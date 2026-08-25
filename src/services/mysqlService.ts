export interface MySQLStatus {
  connected: boolean;
  message?: string;
  config?: {
    host: string;
    port: number;
    user: string;
    database: string;
  };
  tables?: string[];
}

export async function testarConexaoMySQL(): Promise<MySQLStatus> {
  try {
    const res = await fetch('/api/mysql/status');
    const data = await res.json();
    return data;
  } catch (error) {
    return {
      connected: false,
      message: 'Não foi possível comunicar com o servidor backend: ' + (error instanceof Error ? error.message : String(error)),
    };
  }
}

export async function obterStatusMySQL(): Promise<MySQLStatus> {
  return testarConexaoMySQL();
}

export async function inicializarTabelasMySQL(): Promise<MySQLStatus> {
  try {
    const res = await fetch('/api/mysql/init-tables', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json();
    return data;
  } catch (error) {
    return {
      connected: false,
      message: 'Erro ao criar tabelas: ' + (error instanceof Error ? error.message : String(error)),
    };
  }
}
