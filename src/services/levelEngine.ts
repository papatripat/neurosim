import { RubricOutput } from '../schemas/evaluator.schema';

/**
 * Mesin Penentu Rekomendasi Level Deterministik (Sesuai Proposal Bab E)
 * 
 * Aturan Logika Murni (Bukan Halusinasi / Tebakan LLM):
 * - Jika >= 3 dimensi bernilai 'efektif' -> 'naik'
 * - Jika >= 2 dimensi bernilai 'perlu dilatih' -> 'turun'
 * - Selain itu -> 'tetap'
 */
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
