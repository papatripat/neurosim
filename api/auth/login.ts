import bcrypt from 'bcryptjs';
import { getDbPool } from '../../src/lib/db';

export interface LoginRequestBody {
  username: string;
  password: string;
}

export interface LoginResponse {
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
  history?: any[];
}

export async function processLogin(body: LoginRequestBody): Promise<LoginResponse> {
  const { username, password } = body;

  if (!username || !password) {
    return { success: false, message: 'Username dan password wajib diisi.' };
  }

  const pool = getDbPool();
  if (!pool) {
    return { success: false, message: 'Koneksi ke database server tidak tersedia.' };
  }

  try {
    const [rows]: any = await pool.query(
      `SELECT id, username, password_hash, full_name, role, department, avatar,
              reduce_motion, high_contrast, text_scale
       FROM users WHERE username = ? LIMIT 1`,
      [username.trim().toLowerCase()]
    );

    if (!rows || rows.length === 0) {
      return { success: false, message: 'Username atau password tidak ditemukan.' };
    }

    const user = rows[0];

    // Bandingkan password hash
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return { success: false, message: 'Username atau password tidak cocok.' };
    }

    // Ambil riwayat evaluasi terakhir user (maksimal 10 riwayat)
    let history: any[] = [];
    try {
      const [histRows]: any = await pool.query(
        `SELECT id, scenario_id, level, user_goal, kejelasan_tingkat, konteks_tingkat,
                tujuan_tingkat, batasan_tingkat, rekomendasi_level, created_at
         FROM user_evaluations WHERE user_id = ? ORDER BY created_at DESC LIMIT 10`,
        [user.id]
      );
      history = histRows || [];
    } catch (e) {
      console.warn('[Login History Fetch Error]:', e);
    }

    return {
      success: true,
      message: 'Login berhasil!',
      user: {
        id: user.id,
        username: user.username,
        fullName: user.full_name,
        role: user.role,
        department: user.department,
        avatar: user.avatar,
        reduceMotion: Boolean(user.reduce_motion),
        highContrast: Boolean(user.high_contrast),
        textScale: user.text_scale || 'normal',
      },
      history,
    };
  } catch (err: any) {
    console.error('[Login API Error]:', err);
    return { success: false, message: 'Gagal melakukan login: ' + (err.message || '') };
  }
}

export async function handleLogin(req: Request): Promise<Response> {
  try {
    const body: LoginRequestBody = await req.json();
    const result = await processLogin(body);
    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 401,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, message: 'Permintaan tidak valid.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export default handleLogin;
