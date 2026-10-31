import { getScenarioConfig } from '../src/config/scenarios.config';
import { FullEvaluationResult, RubricOutput } from '../src/schemas/evaluator.schema';
import { generateRubricEvaluation } from '../src/services/gemini.service';
import { calculateLevelRecommendation } from '../src/services/levelEngine';
import { getDbPool } from '../src/lib/db';

export interface EvaluateRequestBody {
  scenarioId: string;
  level?: 1 | 2 | 3;
  userGoal?: string;
  transcript: Array<{ speaker: string; text: string }>;
  userId?: number;
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
 * Simpan hasil evaluasi ke MySQL jika user sedang login
 */
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
    console.log(`[DB] Evaluasi berhasil disimpan ke MySQL untuk user_id: ${userId}`);
  } catch (err) {
    console.warn('[DB Save Evaluation Error]:', err);
  }
}

/**
 * Logika murni pemrosesan evaluasi rubrik 4 dimensi
 */
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
      // Hitung rekomendasi level secara deterministik (Rule Engine Bab E)
      const levelRec = calculateLevelRecommendation(rubric);
      finalResult = {
        ...rubric,
        maksud_tersembunyi_karakter: scenario.hiddenIntent,
        rekomendasi_level: levelRec,
      };
    }

    // Jika user login, simpan ke MySQL
    if (userId) {
      saveEvaluationToDb(userId, scenarioId, level, userGoal, finalResult, transcript);
    }

    return finalResult;
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

export default handleEvaluate;
