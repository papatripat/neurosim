import { GoogleGenAI } from '@google/genai';
import { ScenarioConfig } from '../config/scenarios.config';
import { RubricOutput, RubricOutputSchema } from '../schemas/evaluator.schema';

// Lazy-loaded AI client instance
let aiClient: GoogleGenAI | null = null;

// Daftar model Gemini yang didukung (diurutkan berdasarkan kecepatan & ketersediaan)
const GEMINI_MODELS = ['gemini-3.5-flash-lite', 'gemini-3.5-flash', 'gemini-flash-latest'];

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

export function isGeminiAvailable(): boolean {
  return getGenAIClient() !== null;
}

/**
 * Panggilan Persona Roleplay (Karakter Lawan Bicara)
 */
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

  // Batasi konteks maksimal 6 giliran terakhir (12 pesan)
  const limitedHistory = transcript.slice(-12);

  const systemInstruction = `
${scenario.systemPrompt}
Tingkat kesulitan saat ini: Level ${level} (${scenario.levelRules[level]}).
Batasan perilaku: ${scenario.behaviorLimits}.
Jawab dalam 1-3 kalimat langsung layaknya percakapan chat singkat di kantor.
Jangan gunakan format surat resmi atau pembuka/penutup email. Langsung jawab ke intinya.
`;

  // Format riwayat obrolan untuk Gemini API
  const contents = limitedHistory.map((m) => ({
    role: m.speaker === 'user' ? 'user' : 'model',
    parts: [{ text: m.text }],
  }));

  for (const modelName of GEMINI_MODELS) {
    try {
      console.log(`[GeminiService] Memanggil roleplay dengan model: ${modelName}...`);
      const response = await ai.models.generateContent({
        model: modelName,
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.3, // Rendah agar konsisten dengan persona
          maxOutputTokens: 300,
        },
      });

      const reply = response.text?.trim();
      if (reply) {
        console.log(`[GeminiService] Berhasil mendapatkan balasan dari ${modelName}!`);
        return reply;
      }
    } catch (error) {
      console.warn(`[GeminiService] Gagal dengan ${modelName}, mencoba model berikutnya:`, error);
    }
  }

  console.warn('[GeminiService] Seluruh model gagal, menggunakan fallbackReply.');
  return scenario.fallbackReply;
}

/**
 * Panggilan Rubric Evaluator Independen (Penilaian 4 Dimensi Objektif)
 */
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
   Pilihan tingkat:
   - 'perlu dilatih': Maksud tidak terbaca atau bertele-tele tanpa inti.
   - 'berkembang': Terbaca tapi masih kurang spesifik.
   - 'efektif': Langsung terbaca, to the point, dan spesifik.
2. pemahaman_konteks: Apakah pengguna menangkap konteks tersirat atau memastikannya?
   Pilihan tingkat:
   - 'perlu dilatih': Mengabaikan konteks tersirat.
   - 'berkembang': Menebak-nebak tanpa mengonfirmasi.
   - 'efektif': Memastikan atau mengklarifikasi secara tepat.
3. ketercapaian_tujuan: Apakah respons mendekatkan ke tujuan latihan pengguna?
   Pilihan tingkat: 'perlu dilatih' | 'berkembang' | 'efektif'.
4. rasa_hormat_dan_batasan: Apakah menjaga rasa hormat sekaligus menjaga batas/kapasitas kerja pengguna?
   Pilihan tingkat: 'perlu dilatih' | 'berkembang' | 'efektif'.

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
      console.log(`[GeminiService] Memanggil evaluasi dengan model: ${modelName}...`);
      const response = await ai.models.generateContent({
        model: modelName,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1, // Suhu sangat rendah agar evaluasi stabil & deterministik
        },
      });

      const rawText = response.text?.trim() || '{}';
      const parsedJson = JSON.parse(rawText);
      const validatedRubric = RubricOutputSchema.parse(parsedJson);
      console.log(`[GeminiService] Berhasil mengevaluasi dengan ${modelName}!`);
      return validatedRubric;
    } catch (error) {
      console.warn(`[GeminiService] Gagal evaluasi dengan ${modelName}, mencoba model berikutnya:`, error);
    }
  }

  console.warn('[GeminiService] Seluruh model gagal untuk evaluasi, mengembalikan null.');
  return null;
}
