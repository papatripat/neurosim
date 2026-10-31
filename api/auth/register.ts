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

  const pool = getDbPool();
  if (!pool) {
    return { success: false, message: 'Koneksi ke database server tidak tersedia.' };
  }

  try {
    // 1. Periksa apakah username sudah terdaftar
    const [existing]: any = await pool.query(
      'SELECT id FROM users WHERE username = ? LIMIT 1',
      [username.trim().toLowerCase()]
    );

    if (existing && existing.length > 0) {
      return { success: false, message: 'Username sudah digunakan, silakan pilih username lain.' };
    }

    // 2. Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 3. Simpan ke database
    const [result]: any = await pool.query(
      `INSERT INTO users (username, password_hash, full_name, role, department, avatar)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [username.trim().toLowerCase(), passwordHash, fullName.trim(), role, department, avatar]
    );

    const newId = result.insertId;

    return {
      success: true,
      message: 'Registrasi berhasil!',
      user: {
        id: newId,
        username: username.trim().toLowerCase(),
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
    console.error('[Register API Error]:', err);
    return { success: false, message: 'Terjadi kesalahan server saat mendaftar: ' + (err.message || '') };
  }
}

export async function handleRegister(req: Request): Promise<Response> {
  try {
    const body: RegisterRequestBody = await req.json();
    const result = await processRegister(body);
    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 400,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, message: 'Permintaan tidak valid.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export default handleRegister;
