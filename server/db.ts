import mysql from 'mysql2';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: Number(process.env.MYSQL_PORT) || 3306,
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'sistema_transito_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

let pool: any = null;

export function getMySQLPool(): any {
  if (!pool) {
    pool = mysql.createPool(dbConfig).promise();
  }
  return pool;
}

export async function testConnection(): Promise<{ connected: boolean; message: string; config: any }> {
  try {
    const p = getMySQLPool();
    const [rows] = await p.query('SELECT 1 + 1 AS test');
    return {
      connected: true,
      message: 'Conexão MySQL bem-sucedida! Servidor respondendo.',
      config: {
        host: dbConfig.host,
        port: dbConfig.port,
        user: dbConfig.user,
        database: dbConfig.database,
      },
    };
  } catch (error: any) {
    return {
      connected: false,
      message: `Falha na conexão MySQL: ${error.message || error}`,
      config: {
        host: dbConfig.host,
        port: dbConfig.port,
        user: dbConfig.user,
        database: dbConfig.database,
      },
    };
  }
}
