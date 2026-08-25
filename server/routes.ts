import { Router, Request, Response } from 'express';
import { getMySQLPool, testConnection } from './db';

export const apiRouter = Router();

// Teste de conexão e status do MySQL
apiRouter.get('/mysql/status', async (req: Request, res: Response) => {
  const result = await testConnection();
  res.json(result);
});

// Inicialização automática das tabelas MySQL
apiRouter.post('/mysql/init-tables', async (req: Request, res: Response) => {
  try {
    const pool = getMySQLPool();

    const sqlQueries = [
      `CREATE TABLE IF NOT EXISTS utilizadores (
        id VARCHAR(128) PRIMARY KEY,
        nome VARCHAR(150) NOT NULL,
        email VARCHAR(150) NOT NULL UNIQUE,
        perfil ENUM('Administrador', 'Agente', 'Consulta') NOT NULL DEFAULT 'Agente',
        ativo BOOLEAN NOT NULL DEFAULT TRUE,
        ultimo_acesso TIMESTAMP NULL DEFAULT NULL,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;`,

      `CREATE TABLE IF NOT EXISTS condutores (
        id VARCHAR(64) PRIMARY KEY,
        nome VARCHAR(150) NOT NULL,
        bi VARCHAR(30) NOT NULL UNIQUE,
        numero_carta VARCHAR(30) NOT NULL UNIQUE,
        categoria_carta VARCHAR(20) NOT NULL DEFAULT 'Ligeiro',
        telefone VARCHAR(30) NULL,
        morada VARCHAR(255) NULL,
        pontos INT NOT NULL DEFAULT 12,
        estado_carta ENUM('Válida', 'Suspensa', 'Apreendida', 'Caducada') NOT NULL DEFAULT 'Válida',
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;`,

      `CREATE TABLE IF NOT EXISTS viaturas (
        id VARCHAR(64) PRIMARY KEY,
        matricula VARCHAR(20) NOT NULL UNIQUE,
        marca VARCHAR(60) NOT NULL,
        modelo VARCHAR(60) NOT NULL,
        ano INT NULL,
        cor VARCHAR(40) NULL,
        nome_proprietario VARCHAR(150) NOT NULL,
        bi_proprietario VARCHAR(30) NULL,
        telefone_proprietario VARCHAR(30) NULL,
        estado ENUM('Regular', 'Apreendida', 'Com Restrições', 'Inativa') NOT NULL DEFAULT 'Regular',
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;`,

      `CREATE TABLE IF NOT EXISTS multas (
        id VARCHAR(64) PRIMARY KEY,
        numero_multa VARCHAR(40) NOT NULL UNIQUE,
        data_infracao DATE NOT NULL,
        hora_infracao TIME NOT NULL,
        local_infracao VARCHAR(200) NOT NULL,
        provincia VARCHAR(60) NOT NULL DEFAULT 'Luanda',
        municipio VARCHAR(60) NULL,
        matricula VARCHAR(20) NOT NULL,
        nome_condutor VARCHAR(150) NOT NULL,
        bi_condutor VARCHAR(30) NOT NULL,
        numero_carta VARCHAR(30) NULL,
        tipo_infracao VARCHAR(255) NOT NULL,
        artigo_codigo VARCHAR(60) NULL,
        gravidade ENUM('Leve', 'Grave', 'Muito Grave') NOT NULL DEFAULT 'Grave',
        pontos_retirados INT NOT NULL DEFAULT 2,
        valor_total DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
        valor_pago DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
        saldo_devedor DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
        status_pagamento ENUM('Pendente', 'Pago', 'Parcial', 'Anulado') NOT NULL DEFAULT 'Pendente',
        agente_responsavel VARCHAR(120) NOT NULL,
        documento_apreendido VARCHAR(60) DEFAULT 'Nenhum',
        observacoes TEXT NULL,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_matricula (matricula),
        INDEX idx_bi_condutor (bi_condutor),
        INDEX idx_status_pagamento (status_pagamento)
      ) ENGINE=InnoDB;`,

      `CREATE TABLE IF NOT EXISTS pagamentos (
        id VARCHAR(64) PRIMARY KEY,
        numero_recibo VARCHAR(40) NOT NULL UNIQUE,
        multa_id VARCHAR(64) NOT NULL,
        numero_multa VARCHAR(40) NOT NULL,
        valor_pago DECIMAL(12, 2) NOT NULL,
        metodo_pagamento ENUM('Multicaixa Express', 'TPA', 'Depósito Bancário', 'RUPE', 'Numerário') NOT NULL,
        referencia VARCHAR(80) NULL,
        recebido_por VARCHAR(120) NOT NULL,
        data_pagamento TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;`,

      `CREATE TABLE IF NOT EXISTS logs_auditoria (
        id VARCHAR(64) PRIMARY KEY,
        acao VARCHAR(80) NOT NULL,
        entidade VARCHAR(60) NOT NULL,
        documento_id VARCHAR(64) NULL,
        utilizador_email VARCHAR(150) NOT NULL,
        detalhes TEXT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;`,
    ];

    for (const sql of sqlQueries) {
      await pool.query(sql);
    }

    res.json({
      connected: true,
      message: 'Todas as 6 tabelas MySQL foram criadas/verificadas com sucesso no banco de dados!',
      tables: ['utilizadores', 'condutores', 'viaturas', 'multas', 'pagamentos', 'logs_auditoria'],
    });
  } catch (error: any) {
    res.status(500).json({
      connected: false,
      message: `Erro ao criar tabelas no MySQL: ${error.message || error}`,
    });
  }
});
