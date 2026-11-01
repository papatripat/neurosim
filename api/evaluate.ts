import { z } from 'zod';
import { GoogleGenAI } from '@google/genai';
import mysql from 'mysql2/promise';

export const EvaluasiDimensiSchema = z.object({
  tingkat: z.enum(['perlu dilatih', 'berkembang', 'efektif']),
  alasan: z.string().min(10, 'Alasan evaluasi harus deskriptif'),
});

export type EvaluasiDimensi = z.infer<typeof EvaluasiDimensiSchema>;

export const RubricOutputSchema = z.object({
  kejelasan_pesan: EvaluasiDimensiSchema,
  pemahaman_konteks: EvaluasiDimensiSchema,
  ketercapaian_tujuan: EvaluasiDimensiSchema,
  rasa_hormat_dan_batasan: EvaluasiDimensiSchema,
  alternatif_respons: z.object({
    versi_ringkas: z.string().min(5),
    versi_rinci: z.string().min(10),
  }),
});

export type RubricOutput = z.infer<typeof RubricOutputSchema>;

export interface FullEvaluationResult extends RubricOutput {
  maksud_tersembunyi_karakter: string;
  rekomendasi_level: 'tetap' | 'naik' | 'turun';
}

export interface ScenarioConfig {
  id: string;
  name: string;
  role: string;
  targetSkill: string;
  hiddenIntent: string;
  systemPrompt: string;
  behaviorLimits: string;
  fallbackReply: string;
  levelRules: {
    1: string;
    2: string;
    3: string;
  };
}

export const SCENARIOS: Record<string, ScenarioConfig> = {
  'skenario-1': {
    id: 'skenario-1',
    name: 'Bu Rina (Atasan Perfeksionis)',
    role: 'Atasan di tim pengembangan antarmuka',
    targetSkill: 'Mengajukan pertanyaan klarifikasi yang spesifik',
    hiddenIntent: 'Jarak dan penataan bagian atas halaman beranda rapi sebelum pukul 09.00 WIB.',
    behaviorLimits: 'Tidak merendahkan pribadi, kritik hanya tentang pekerjaan, tidak mengancam, maksimal 6 giliran.',
    fallbackReply: 'Baik, intinya tolong pastikan bagian atas rapi ya. Jam 9 besok saya cek.',
    systemPrompt: `Kamu adalah Bu Rina, atasan perfeksionis di tim antarmuka. 
Gaya bicaramu singkat, lugas, mengandalkan konteks, dan jarang menjelaskan alasan kecuali ditanya secara spesifik.
Pekerjaan: Kamu ingin halaman beranda dirapikan sebelum jam 09.00 pagi besok.
Aturan: Jika pengguna bertanya dengan spesifik (apakah kode atau tampilan, dan pukul berapa), berikan jawaban langsung tanpa basa-basi. 
Jangan pernah menghina atau menyerang pribadi pengguna.`,
    levelRules: {
      1: 'Menyebut objek kerja dan tenggat dengan cukup jelas, kooperatif menjawab pertanyaan.',
      2: 'Hanya menyebut sebagian informasi, melengkapi rincian bila ditanya secara spesifik.',
      3: 'Hanya menyebut sebagian informasi, lalu menambah permintaan baru di tengah percakapan.'
    }
  },
  'skenario-2': {
    id: 'skenario-2',
    name: 'Dimas (Rekan Kerja Senior)',
    role: 'Rekan kerja senior satu divisi',
    targetSkill: 'Menanyakan maksud tersirat dan meminta contoh konkret',
    hiddenIntent: 'Ada alur navigasi di formulir pendaftaran yang membingungkan bagi pengguna baru.',
    behaviorLimits: 'Bahasa santai/rekan kantor, tidak menggurui secara kasar, tidak menyindir pribadi.',
    fallbackReply: 'Coba cek lagi deh alur tombolnya, menurutku agak bikin bingung.',
    systemPrompt: `Kamu adalah Dimas, rekan kerja senior yang santai tetapi sering memberi kritik samar seperti: "Menarik sih, tapi mungkin bisa dipikirkan lagi".
Kamu baru akan menjelaskan masalah sebenarnya jika lawan bicaramu menanyakan maksud spesifik dan meminta contoh nyata.`,
    levelRules: {
      1: 'Memberikan petunjuk bagian mana yang kurang setelah satu kali ditanya.',
      2: 'Menggunakan kalimat tersirat ("kayaknya ada yang ganjil"), baru jelas setelah ditanya 2 kali.',
      3: 'Sangat implisit dan mengalihkan topik kecuali pengguna menahan fokus secara tegas.'
    }
  },
  'skenario-3': {
    id: 'skenario-3',
    name: 'Pak Hendra (Klien)',
    role: 'Klien pemilik proyek lepas',
    targetSkill: 'Menetapkan batasan jam kerja & negosiasi tenggat realistis',
    hiddenIntent: 'Klien panik karena ada presentasi direksi besok siang dan butuh kepastian progres.',
    behaviorLimits: 'Tegas menuntut pekerjaan tapi tetap profesional dalam koridor bisnis.',
    fallbackReply: 'Tolong diusahakan ya, besok siang saya harus bawa bahannya ke direksi.',
    systemPrompt: `Kamu adalah Pak Hendra, klien yang mengirim pesan di luar jam kerja meminta perombakan besar.
Kamu sedang cemas menghadapi rapat direksi besok siang. Jika pengguna merespons dengan menetapkan batas jam kerja secara sopan dan menawarkan solusi alternatif yang realistis, kamu bersedia berkompromi.`,
    levelRules: {
      1: 'Meminta perubahan tetapi langsung menyebut alasan kepanikannya.',
      2: 'Menuntut selesai besok pagi tanpa menyebut alasan, baru lunak jika dinegosiasikan.',
      3: 'Mendesak dan menekan waktu, baru mau mendengar bila pengguna menetapkan batas dengan sangat tegas.'
    }
  }
};

export function getScenarioConfig(scenarioId: string): ScenarioConfig {
  return SCENARIOS[scenarioId] || SCENARIOS['skenario-1'];
}

export function calculateLevelRecommendation(
  evaluation: Pick<
    RubricOutput,
    'kejelasan_pesan' | 'pemahaman_konteks' | 'ketercapaian_tujuan' | 'rasa_hormat_dan_batasan'
  >
): 'tetap' | 'naik' | 'turun' {
  const dimensions = [
    evaluation.kejelasan_pesan.tingkat,
    evaluation.pemahaman_konteks.tingkat,
    evaluation.ketercapaian_tujuan.tingkat,
    evaluation.rasa_hormat_dan_batasan.tingkat,
  ];

  const efektifCount = dimensions.filter((t) => t === 'efektif').length;
  const perluDilatihCount = dimensions.filter((t) => t === 'perlu dilatih').length;

  if (efektifCount >= 3) {
    return 'naik';
  } else if (perluDilatihCount >= 2) {
    return 'turun';
  }
  return 'tetap';
}

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

let aiClient: GoogleGenAI | null = null;
const GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-flash-latest'];

function getGenAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

export async function generateRubricEvaluation(params: {
  scenario: ScenarioConfig;
  level: 1 | 2 | 3;
  userGoal: string;
  transcript: Array<{ speaker: string; text: string }>;
}): Promise<RubricOutput | null> {
  const { scenario, userGoal, transcript } = params;
  const ai = getGenAIClient();

  if (!ai) {
    console.warn('[GeminiService] GEMINI_API_KEY tidak ditemukan untuk evaluasi');
    return null;
  }

  const prompt = `
Kamu adalah Rubric Evaluator independen untuk NeuroSim (Simulator Dinamika Kerja untuk Profesional Neurodivergen).
Evaluasi transkrip percakapan berikut secara objektif berdasarkan tujuan pengguna dan maksud tersembunyi karakter.
TIDAK BOLEH memaksakan standar basa-basi sosial neurotipikal. Fokus pada kejelasan, batasan sehat, dan ketercapaian tujuan.

Tujuan pilihan pengguna: "${userGoal || scenario.targetSkill}"
Maksud tersembunyi karakter yang sebenarnya: "${scenario.hiddenIntent}"

Transkrip Percakapan:
${JSON.stringify(transcript, null, 2)}

Rubrik Penilaian 4 Dimensi:
1. kejelasan_pesan: Apakah maksud pengguna langsung terbaca dan spesifik?
   Pilihan tingkat: 'perlu dilatih' | 'berkembang' | 'efektif'
2. pemahaman_konteks: Apakah pengguna menangkap konteks tersirat atau memastikannya?
   Pilihan tingkat: 'perlu dilatih' | 'berkembang' | 'efektif'
3. ketercapaian_tujuan: Apakah respons mendekatkan ke tujuan latihan pengguna?
   Pilihan tingkat: 'perlu dilatih' | 'berkembang' | 'efektif'
4. rasa_hormat_dan_batasan: Apakah menjaga rasa hormat sekaligus menjaga batas/kapasitas kerja pengguna?
   Pilihan tingkat: 'perlu dilatih' | 'berkembang' | 'efektif'

Alternatif respons: Berikan 1 versi ringkas dan 1 versi lebih rinci yang relevan.
Keluarkan HANYA JSON murni yang sesuai dengan skema berikut tanpa triple backticks markdown:
{
  "kejelasan_pesan": { "tingkat": "...", "alasan": "..." },
  "pemahaman_konteks": { "tingkat": "...", "alasan": "..." },
  "ketercapaian_tujuan": { "tingkat": "...", "alasan": "..." },
  "rasa_hormat_dan_batasan": { "tingkat": "...", "alasan": "..." },
  "alternatif_respons": {
    "versi_ringkas": "...",
    "versi_rinci": "..."
  }
}
`;

  for (const modelName of GEMINI_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });

      const rawText = response.text?.trim() || '{}';
      const parsedJson = JSON.parse(rawText);
      const validatedRubric = RubricOutputSchema.parse(parsedJson);
      return validatedRubric;
    } catch (error) {
      console.warn(`[GeminiService] Gagal evaluasi dengan ${modelName}, mencoba model berikutnya:`, error);
    }
  }

  return null;
}

export interface EvaluateRequestBody {
  scenarioId: string;
  level?: 1 | 2 | 3;
  userGoal?: string;
  transcript: Array<{ speaker: string; text: string }>;
  userId?: number;
}

export function getFallbackEvaluation(scenarioId: string): FullEvaluationResult {
  const scenario = getScenarioConfig(scenarioId);

  const fallbackRubric: RubricOutput = {
    kejelasan_pesan: {
      tingkat: 'berkembang',
      alasan: 'Pesan sudah mulai menyampaikan maksud utama, namun rincian teknis masih dapat diperjelas.',
    },
    pemahaman_konteks: {
      tingkat: 'berkembang',
      alasan: 'Sebagian konteks tersirat berhasil ditangkap, disarankan untuk selalu mengonfirmasi batas waktu.',
    },
    ketercapaian_tujuan: {
      tingkat: 'berkembang',
      alasan: 'Respons sudah mengarah ke tujuan latihan yang dipilih, pertahankan fokus pembicaraan.',
    },
    rasa_hormat_dan_batasan: {
      tingkat: 'efektif',
      alasan: 'Sikap sopan dan profesional terjaga dengan baik tanpa mengorbankan batasan kerja.',
    },
    alternatif_respons: {
      versi_ringkas:
        scenarioId === 'skenario-2'
          ? 'Boleh minta contoh alur yang menurutmu kurang pas?'
          : scenarioId === 'skenario-3'
          ? 'Malam ini saya amankan fitur utama dulu, besok pagi kita rampungkan.'
          : 'Boleh saya konfirmasi bagian mana yang dirapikan dan jam batas waktunya besok?',
      versi_rinci:
        scenarioId === 'skenario-2'
          ? 'Supaya langsung tepat sasaran, boleh tunjukkan langkah mana yang membingungkan agar saya revisi?'
          : scenarioId === 'skenario-3'
          ? 'Saya memahami urgensi rapat besok. Bagaimana jika modul intinya saya selesaikan sekarang, dan sisanya besok pagi sebelum rapat?'
          : 'Supaya hasilnya sesuai ekspektasi, boleh saya pastikan prioritas tampilan serta tenggat waktu besok pagi pukul berapa?',
    },
  };

  const levelRec = calculateLevelRecommendation(fallbackRubric);

  return {
    ...fallbackRubric,
    maksud_tersembunyi_karakter: scenario.hiddenIntent,
    rekomendasi_level: levelRec,
  };
}

async function saveEvaluationToDb(
  userId: number,
  scenarioId: string,
  level: number,
  userGoal: string,
  result: FullEvaluationResult,
  transcript: any[]
) {
  try {
    const pool = getDbPool();
    if (!pool) return;

    await pool.query(
      `INSERT INTO user_evaluations (
        user_id, scenario_id, level, user_goal,
        kejelasan_tingkat, kejelasan_alasan,
        konteks_tingkat, konteks_alasan,
        tujuan_tingkat, tujuan_alasan,
        batasan_tingkat, batasan_alasan,
        maksud_tersembunyi, rekomendasi_level,
        alternatif_ringkas, alternatif_rinci,
        transcript_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        scenarioId,
        level,
        userGoal,
        result.kejelasan_pesan.tingkat,
        result.kejelasan_pesan.alasan,
        result.pemahaman_konteks.tingkat,
        result.pemahaman_konteks.alasan,
        result.ketercapaian_tujuan.tingkat,
        result.ketercapaian_tujuan.alasan,
        result.rasa_hormat_dan_batasan.tingkat,
        result.rasa_hormat_dan_batasan.alasan,
        result.maksud_tersembunyi_karakter,
        result.rekomendasi_level,
        result.alternatif_respons.versi_ringkas,
        result.alternatif_respons.versi_rinci,
        JSON.stringify(transcript),
      ]
    );
  } catch (err) {
    console.warn('[DB Save Evaluation Error]:', err);
  }
}

export async function processEvaluate(body: EvaluateRequestBody): Promise<FullEvaluationResult> {
  const scenarioId = body.scenarioId || 'skenario-1';
  const level = (body.level === 1 || body.level === 2 || body.level === 3) ? body.level : 2;
  const userGoal = body.userGoal || '';
  const transcript = Array.isArray(body.transcript) ? body.transcript : [];
  const userId = body.userId;

  const scenario = getScenarioConfig(scenarioId);

  try {
    const rubric = await generateRubricEvaluation({
      scenario,
      level,
      userGoal,
      transcript,
    });

    let finalResult: FullEvaluationResult;

    if (!rubric) {
      finalResult = getFallbackEvaluation(scenarioId);
    } else {
      const levelRec = calculateLevelRecommendation(rubric);
      finalResult = {
        ...rubric,
        maksud_tersembunyi_karakter: scenario.hiddenIntent,
        rekomendasi_level: levelRec,
      };
    }

    if (userId) {
      saveEvaluationToDb(userId, scenarioId, level, userGoal, finalResult, transcript);
    }

    return finalResult;
  } catch (error) {
    console.error('[API Evaluate] Error:', error);
    return getFallbackEvaluation(scenarioId);
  }
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

export async function handleEvaluate(req: Request): Promise<Response> {
  try {
    const body: EvaluateRequestBody = await parseBody(req);
    const result = await processEvaluate(body);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[API Evaluate Handler] Error:', error);
    const fallback = getFallbackEvaluation('skenario-1');
    return new Response(JSON.stringify(fallback), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Universal Vercel Serverless Function Handler (Node.js & Edge compatible)
export default async function handler(req: any, res?: any) {
  try {
    const body = await parseBody(req);
    const result = await processEvaluate(body);
    return sendJson(res, 200, result);
  } catch (error) {
    console.error('[API Evaluate Node Handler] Error:', error);
    const fallback = getFallbackEvaluation('skenario-1');
    return sendJson(res, 200, fallback);
  }
}
