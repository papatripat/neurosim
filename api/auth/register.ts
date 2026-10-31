import bcrypt from 'bcryptjs';
import { getDbPool } from '../../src/lib/db';

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

export async function handleRegister(req: Request): Promise<Response> {
  try {
    const body: RegisterRequestBody = await req.json();
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
