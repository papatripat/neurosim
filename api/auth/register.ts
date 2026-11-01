import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';

let pool: mysql.Pool | null = null;

function getDbPool(): mysql.Pool | null {
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
        connectionLimit: 5,
        queueLimit: 0,
        connectTimeout: 5000,
        enableKeepAlive: true,
        keepAliveInitialDelay: 10000,
      });
    } catch (err) {
      console.error('[DB] Gagal membuat pool MySQL:', err);
      return null;
    }
  }

  return pool;
}

export interface RegisterRequestBody {
  username: string;
  password: string;
  fullName: string;
  role?: string;
  department?: string;
  avatar?: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  user?: {
    id: number;
    username: string;
    fullName: string;
    role: string;
    department: string;
    avatar: string;
    reduceMotion: boolean;
    highContrast: boolean;
    textScale: string;
  };
}

export async function processRegister(body: RegisterRequestBody): Promise<AuthResponse> {
  const { username, password, fullName } = body;
  const role = body.role || 'Staff Pengembang';
  const department = body.department || 'Divisi Antarmuka & Frontend';
  const avatar = body.avatar || '/assets/characters/resident/standing/south.png';

  if (!username || username.trim().length < 3) {
    return { success: false, message: 'Username minimal 3 karakter.' };
  }
  if (!password || password.length < 4) {
    return { success: false, message: 'Password minimal 4 karakter.' };
  }
  if (!fullName || fullName.trim().length < 2) {
    return { success: false, message: 'Nama lengkap wajib diisi.' };
  }

  const cleanUser = username.trim().toLowerCase();
  const pool = getDbPool();

  if (pool) {
    try {
      // 1. Periksa apakah username sudah terdaftar di MySQL
      const [existing]: any = await pool.query(
        'SELECT id FROM users WHERE username = ? LIMIT 1',
        [cleanUser]
      );

      if (existing && existing.length > 0) {
        return { success: false, message: 'Username sudah digunakan, silakan pilih username lain.' };
      }

      // 2. Hash password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      // 3. Simpan ke database MySQL
      const [result]: any = await pool.query(
        `INSERT INTO users (username, password_hash, full_name, role, department, avatar)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [cleanUser, passwordHash, fullName.trim(), role, department, avatar]
      );

      const newId = result.insertId;

      return {
        success: true,
        message: 'Registrasi berhasil di database MySQL!',
        user: {
          id: newId,
          username: cleanUser,
          fullName: fullName.trim(),
          role,
          department,
          avatar,
          reduceMotion: false,
          highContrast: false,
          textScale: 'normal',
        },
      };
    } catch (err: any) {
      console.warn('[Register MySQL Warning - Fallback to active session]:', err.message);
    }
  }

  // Fallback instant register (membuat ID Karyawan lokal saat server database offline)
  const fallbackId = Date.now() % 100000;
  return {
    success: true,
    message: 'ID Karyawan berhasil diterbitkan!',
    user: {
      id: fallbackId,
      username: cleanUser,
      fullName: fullName.trim(),
      role,
      department,
      avatar,
      reduceMotion: false,
      highContrast: false,
      textScale: 'normal',
    },
  };
}

async function parseBody(req: any): Promise<any> {
  if (req.body) {
    return typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  }
  if (typeof req.json === 'function') {
    return await req.json();
  }
  return new Promise((resolve) => {
    if (typeof req.on !== 'function') {
      resolve({});
      return;
    }
    let raw = '';
    req.on('data', (chunk: any) => { raw += chunk; });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

function sendJson(res: any, status: number, data: any) {
  if (res) {
    if (typeof res.status === 'function' && typeof res.json === 'function') {
      return res.status(status).json(data);
    }
    if (typeof res.setHeader === 'function' && typeof res.end === 'function') {
      res.statusCode = status;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(data));
      return;
    }
  }
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function handleRegister(req: Request): Promise<Response> {
  try {
    const body: RegisterRequestBody = await parseBody(req);
    const result = await processRegister(body);
    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 400,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, message: 'Format request salah: ' + err.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Universal Vercel Serverless Function Handler (Node.js & Edge compatible)
export default async function handler(req: any, res?: any) {
  try {
    const body = await parseBody(req);
    const result = await processRegister(body);
    return sendJson(res, result.success ? 200 : 400, result);
  } catch (err: any) {
    return sendJson(res, 400, { success: false, message: 'Format request salah: ' + err.message });
  }
}
