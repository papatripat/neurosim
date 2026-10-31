import mysql from 'mysql2/promise';

let pool: mysql.Pool | null = null;

export function getDbPool(): mysql.Pool | null {
  const host = process.env.MYSQL_HOST;
  const user = process.env.MYSQL_USER;
  const password = process.env.MYSQL_PASSWORD;
  const database = process.env.MYSQL_DATABASE || 'neurosim_db';
  const port = Number(process.env.MYSQL_PORT) || 3306;

  if (!host || !user) {
    return null;
  }

  if (!pool) {
    try {
      pool = mysql.createPool({
        host,
        port,
        user,
        password,
        database,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        connectTimeout: 5000,
        enableKeepAlive: true,
        keepAliveInitialDelay: 10000,
      });
    } catch (err) {
      console.error('[DB] Gagal menginisialisasi connection pool MySQL:', err);
      return null;
    }
  }

  return pool;
}

export async function isDbConnected(): Promise<boolean> {
  const p = getDbPool();
  if (!p) return false;
  try {
    const conn = await p.getConnection();
    await conn.ping();
    conn.release();
    return true;
  } catch (err) {
    console.warn('[DB Ping] Koneksi MySQL tidak aktif:', err);
    return false;
  }
}
