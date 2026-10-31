import { getScenarioConfig } from '../src/config/scenarios.config';
import { FullEvaluationResult, RubricOutput } from '../src/schemas/evaluator.schema';
import { generateRubricEvaluation } from '../src/services/gemini.service';
import { calculateLevelRecommendation } from '../src/services/levelEngine';

export interface EvaluateRequestBody {
  scenarioId: string;
  level?: 1 | 2 | 3;
  userGoal?: string;
  transcript: Array<{ speaker: string; text: string }>;
}

/**
 * Fallback evaluasi realistis jika API Gemini down / offline
 */
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

/**
 * Logika murni pemrosesan evaluasi rubrik 4 dimensi
 */
export async function processEvaluate(body: EvaluateRequestBody): Promise<FullEvaluationResult> {
  const scenarioId = body.scenarioId || 'skenario-1';
  const level = (body.level === 1 || body.level === 2 || body.level === 3) ? body.level : 2;
  const userGoal = body.userGoal || '';
  const transcript = Array.isArray(body.transcript) ? body.transcript : [];

  const scenario = getScenarioConfig(scenarioId);

  try {
    const rubric = await generateRubricEvaluation({
      scenario,
      level,
      userGoal,
      transcript,
    });

    if (!rubric) {
      return getFallbackEvaluation(scenarioId);
    }

    // Hitung rekomendasi level secara deterministik (Rule Engine Bab E)
    const levelRec = calculateLevelRecommendation(rubric);

    return {
      ...rubric,
      maksud_tersembunyi_karakter: scenario.hiddenIntent,
      rekomendasi_level: levelRec,
    };
  } catch (error) {
    console.error('[API Evaluate] Error:', error);
    return getFallbackEvaluation(scenarioId);
  }
}

/**
 * Web Standard Request/Response Handler (Kompatibel dengan Vercel Serverless Functions)
 */
export async function handleEvaluate(req: Request): Promise<Response> {
  try {
    const body: EvaluateRequestBody = await req.json();
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

// Default export untuk kemudahan import jika diperlukan
export default handleEvaluate;
