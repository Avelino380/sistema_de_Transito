import React, { useState, useEffect } from 'react';
import {
  Database,
  Server,
  CheckCircle2,
  AlertCircle,
  Play,
  Copy,
  Check,
  RefreshCw,
  Terminal,
  ShieldCheck,
  FileCode,
  HardDrive,
  Cpu,
} from 'lucide-react';
import { testarConexaoMySQL, inicializarTabelasMySQL, obterStatusMySQL, MySQLStatus } from '../services/mysqlService';

export const Configuracoes: React.FC = () => {
  const [loadingTest, setLoadingTest] = useState(false);
  const [loadingInit, setLoadingInit] = useState(false);
  const [status, setStatus] = useState<MySQLStatus | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'status' | 'schema' | 'env'>('status');

  const carregarStatus = async () => {
    const res = await obterStatusMySQL();
    setStatus(res);
  };

  useEffect(() => {
    carregarStatus();
  }, []);

  const handleTestarConexao = async () => {
    setLoadingTest(true);
    const res = await testarConexaoMySQL();
    setStatus(res);
    setLoadingTest(false);
  };

  const handleCriarTabelas = async () => {
    setLoadingInit(true);
    const res = await inicializarTabelasMySQL();
    setStatus(res);
    setLoadingInit(false);
  };

  const sqlSchemaScript = `-- ========================================================
-- SCHEMA SQL DO SISTEMA DE GESTÃO DE TRÂNSITO E MULTAS
-- Compatível com: MySQL 5.7+, MySQL 8.0+, MariaDB 10.3+
-- ========================================================

CREATE DATABASE IF NOT EXISTS sistema_transito_db 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE sistema_transito_db;

-- 1. TABELA DE UTILIZADORES
CREATE TABLE IF NOT EXISTS utilizadores (
    id VARCHAR(128) PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    perfil ENUM('Administrador', 'Agente', 'Consulta') NOT NULL DEFAULT 'Agente',
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    ultimo_acesso TIMESTAMP NULL DEFAULT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. TABELA DE CONDUTORES
CREATE TABLE IF NOT EXISTS condutores (
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
) ENGINE=InnoDB;

-- 3. TABELA DE VIATURAS
CREATE TABLE IF NOT EXISTS viaturas (
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
) ENGINE=InnoDB;

-- 4. TABELA DE MULTAS / AUTOS DE NOTÍCIA
CREATE TABLE IF NOT EXISTS multas (
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
) ENGINE=InnoDB;

-- 5. TABELA DE PAGAMENTOS E CAIXA
CREATE TABLE IF NOT EXISTS pagamentos (
    id VARCHAR(64) PRIMARY KEY,
    numero_recibo VARCHAR(40) NOT NULL UNIQUE,
    multa_id VARCHAR(64) NOT NULL,
    numero_multa VARCHAR(40) NOT NULL,
    valor_pago DECIMAL(12, 2) NOT NULL,
    metodo_pagamento ENUM('Multicaixa Express', 'TPA', 'Depósito Bancário', 'RUPE', 'Numerário') NOT NULL,
    referencia VARCHAR(80) NULL,
    recebido_por VARCHAR(120) NOT NULL,
    data_pagamento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pagamentos_multa 
        FOREIGN KEY (multa_id) REFERENCES multas(id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 6. TABELA DE LOGS DE AUDITORIA
CREATE TABLE IF NOT EXISTS logs_auditoria (
    id VARCHAR(64) PRIMARY KEY,
    acao VARCHAR(80) NOT NULL,
    entidade VARCHAR(60) NOT NULL,
    documento_id VARCHAR(64) NULL,
    utilizador_email VARCHAR(150) NOT NULL,
    detalhes TEXT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;`;

  const handleCopySQL = () => {
    navigator.clipboard.writeText(sqlSchemaScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Database className="w-6 h-6 text-amber-500" />
            Estrutura da Base de Dados & Integração MySQL
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Gestão da conexão com MySQL / MariaDB e sincronização híbrida com Firebase Firestore.
          </p>
        </div>

        {/* Tab selector */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('status')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'status'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Estado da Conexão
          </button>
          <button
            onClick={() => setActiveTab('schema')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'schema'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Script SQL
          </button>
          <button
            onClick={() => setActiveTab('env')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'env'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Configuração (.env)
          </button>
        </div>
      </div>

      {activeTab === 'status' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card MySQL Status */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                    <Server className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      Servidor MySQL / MariaDB
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Conexão via Driver Node.js (mysql2 pool)
                    </p>
                  </div>
                </div>

                <span
                  className={`px-2.5 py-1 text-xs font-bold rounded-full flex items-center gap-1.5 ${
                    status?.connected
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      status?.connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                    }`}
                  />
                  {status?.connected ? 'Conectado' : 'Aguardando Configuração'}
                </span>
              </div>

              <div className="mt-4 space-y-3">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs space-y-2 border border-slate-200/60 dark:border-slate-700/60">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Host / IP:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {status?.config?.host || 'localhost'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Porta:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {status?.config?.port || 3306}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Base de Dados:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {status?.config?.database || 'sistema_transito_db'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Utilizador:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {status?.config?.user || 'root'}
                    </span>
                  </div>
                </div>

                {status?.message && (
                  <div
                    className={`p-3 rounded-xl text-xs flex items-start gap-2.5 ${
                      status.connected
                        ? 'bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-900/50'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {status.connected ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    )}
                    <span className="break-all">{status.message}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Ações */}
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={handleTestarConexao}
                disabled={loadingTest}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white text-xs font-bold rounded-xl transition-all disabled:opacity-50 cursor-pointer shadow-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingTest ? 'animate-spin' : ''}`} />
                {loadingTest ? 'A Testar...' : 'Testar Conexão'}
              </button>

              <button
                type="button"
                onClick={handleCriarTabelas}
                disabled={loadingInit || !status?.connected}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-xl transition-all disabled:opacity-40 cursor-pointer shadow-xs"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                {loadingInit ? 'A Criar Tabelas...' : 'Auto-Criar Tabelas'}
              </button>
            </div>
          </div>

          {/* Card Firestore Cloud */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      Google Cloud Firestore
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Sincronização em tempo real & Segurança
                    </p>
                  </div>
                </div>

                <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Ativo
                </span>
              </div>

              <div className="mt-4 space-y-3">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs space-y-2 border border-slate-200/60 dark:border-slate-700/60">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Projeto ID:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200 truncate ml-2">
                      ai-studio-sistemadegestode-7d9817c1...
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Coleções Ativas:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      6 (multas, condutores, viaturas, pagamentos...)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Regras de Segurança:</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      Publicadas & Válidas
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 rounded-xl text-xs text-blue-800 dark:text-blue-300">
                  <p className="font-bold flex items-center gap-1.5 mb-1">
                    <Cpu className="w-4 h-4" /> Arquitetura Dual-Stack
                  </p>
                  A aplicação suporta tanto o <strong>Firestore em tempo real</strong> quanto o <strong>MySQL via REST API</strong>, permitindo migração contínua e backups relacionais.
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <a
                href="https://console.firebase.google.com/project/ai-studio-sistemadegestode-7d9817c1-2a9a-4ae1-bd88-affab30ebdf4/firestore"
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1"
              >
                Abrir Painel do Firebase Cloud ↗
              </a>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'schema' && (
        <div className="bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-sm text-white">Script DDL / SQL para MySQL</h3>
            </div>
            <button
              onClick={handleCopySQL}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg text-xs font-bold transition-all cursor-pointer border border-slate-700"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Script SQL</span>
                </>
              )}
            </button>
          </div>

          <pre className="p-4 bg-slate-950 rounded-xl font-mono text-xs text-slate-300 overflow-x-auto border border-slate-800/80 max-h-[500px]">
            {sqlSchemaScript}
          </pre>
        </div>
      )}

      {activeTab === 'env' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <FileCode className="w-5 h-5 text-indigo-500" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Variáveis de Conexão MySQL (.env)
            </h3>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Para conectar a sua instância MySQL própria (local, cPanel, VPS ou AWS RDS), defina as seguintes variáveis de ambiente:
          </p>

          <div className="p-4 bg-slate-950 rounded-xl font-mono text-xs text-amber-400 overflow-x-auto border border-slate-800">
            <p>MYSQL_HOST=localhost</p>
            <p>MYSQL_PORT=3306</p>
            <p>MYSQL_USER=root</p>
            <p>MYSQL_PASSWORD=sua_senha_secreta</p>
            <p>MYSQL_DATABASE=sistema_transito_db</p>
          </div>

          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-xl text-xs text-amber-800 dark:text-amber-300">
            <p className="font-semibold mb-1">Como configurar no servidor:</p>
            1. Crie o ficheiro <code>.env</code> na raiz do projeto com os dados do seu banco MySQL.<br />
            2. Clique na aba <strong>Estado da Conexão</strong> e clique em <strong>Testar Conexão</strong>.<br />
            3. Em seguida, clique em <strong>Auto-Criar Tabelas</strong> para inicializar as 6 tabelas automaticamente!
          </div>
        </div>
      )}
    </div>
  );
};
