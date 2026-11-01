import { GoogleGenAI } from '@google/genai';

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

export async function generateRoleplayReply(params: {
  scenario: ScenarioConfig;
  level: 1 | 2 | 3;
  transcript: Array<{ speaker: string; text: string }>;
}): Promise<string> {
  const { scenario, level, transcript } = params;
  const ai = getGenAIClient();

  if (!ai) {
    console.warn('[GeminiService] GEMINI_API_KEY tidak ditemukan, beralih ke fallbackReply');
    return scenario.fallbackReply;
  }

  const limitedHistory = transcript.slice(-12);
  const systemInstruction = `
${scenario.systemPrompt}
Tingkat kesulitan saat ini: Level ${level} (${scenario.levelRules[level]}).
Batasan perilaku: ${scenario.behaviorLimits}.
Jawab dalam 1-3 kalimat langsung layaknya percakapan chat singkat di kantor.
Jangan gunakan format surat resmi atau pembuka/penutup email. Langsung jawab ke intinya.
`;

  const contents = limitedHistory.map((m) => ({
    role: m.speaker === 'user' ? 'user' : 'model',
    parts: [{ text: m.text }],
  }));

  for (const modelName of GEMINI_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.3,
          maxOutputTokens: 300,
        },
      });

      const reply = response.text?.trim();
      if (reply) {
        return reply;
      }
    } catch (error) {
      console.warn(`[GeminiService] Gagal dengan ${modelName}, mencoba model berikutnya:`, error);
    }
  }

  return scenario.fallbackReply;
}

export interface ChatRequestBody {
  scenarioId: string;
  level?: 1 | 2 | 3;
  transcript: Array<{ speaker: 'user' | 'character'; text: string }>;
}

export interface ChatResponseBody {
  reply: string;
}

export async function processChat(body: ChatRequestBody): Promise<ChatResponseBody> {
  const scenarioId = body.scenarioId || 'skenario-1';
  const level = (body.level === 1 || body.level === 2 || body.level === 3) ? body.level : 2;
  const transcript = Array.isArray(body.transcript) ? body.transcript : [];

  const scenario = getScenarioConfig(scenarioId);

  try {
    const reply = await generateRoleplayReply({
      scenario,
      level,
      transcript,
    });
    return { reply: reply || scenario.fallbackReply };
  } catch (error) {
    console.error('[API Chat] Error:', error);
    return { reply: scenario.fallbackReply };
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

export async function handleChat(req: Request): Promise<Response> {
  try {
    const body: ChatRequestBody = await parseBody(req);
    const result = await processChat(body);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[API Chat Handler] Error:', error);
    return new Response(
      JSON.stringify({ reply: 'Baik, tolong lanjutkan tugasnya ya.' }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// Universal Vercel Serverless Function Handler (Node.js & Edge compatible)
export default async function handler(req: any, res?: any) {
  try {
    const body = await parseBody(req);
    const result = await processChat(body);
    return sendJson(res, 200, result);
  } catch (error) {
    console.error('[API Chat Node Handler] Error:', error);
    return sendJson(res, 200, { reply: 'Baik, tolong lanjutkan tugasnya ya.' });
  }
}
