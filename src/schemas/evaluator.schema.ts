import { z } from 'zod';

/**
 * Skema evaluasi per dimensi kualitatif
 */
export const EvaluasiDimensiSchema = z.object({
  tingkat: z.enum(['perlu dilatih', 'berkembang', 'efektif']),
  alasan: z.string().min(10, 'Alasan evaluasi harus deskriptif'),
});

export type EvaluasiDimensi = z.infer<typeof EvaluasiDimensiSchema>;

/**
 * Skema keluaran murni dari model LLM (Rubric Evaluator)
 */
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

/**
 * Payload lengkap yang dikirim ke Frontend (telah diperkaya dengan data server-side)
 * Selaras 100% dengan EvaluationResult di src/types/conversation.ts
 */
export interface FullEvaluationResult extends RubricOutput {
  maksud_tersembunyi_karakter: string; // Diambil dari scenarios.config.ts (human-authored anchor)
  rekomendasi_level: 'tetap' | 'naik' | 'turun'; // Dihitung deterministik oleh levelEngine.ts
}
