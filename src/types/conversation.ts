export type Speaker = 'user' | 'character';

export interface DialogueMessage {
  speaker: Speaker;
  text: string;
}

export type EvaluationLevel = 'perlu dilatih' | 'berkembang' | 'efektif';

export interface EvaluationDimension {
  tingkat: EvaluationLevel;
  alasan: string;
}

export interface EvaluationResult {
  kejelasan_pesan: EvaluationDimension;
  pemahaman_konteks: EvaluationDimension;
  ketercapaian_tujuan: EvaluationDimension;
  rasa_hormat_dan_batasan: EvaluationDimension;
  alternatif_respons: {
    versi_ringkas: string;
    versi_rinci: string;
  };
  maksud_tersembunyi_karakter: string;
  rekomendasi_level: 'tetap' | 'naik' | 'turun';
}

export interface ScenarioItem {
  id: string;
  name: string;
  role: string;
  zone: string;
  targetSkill: string;
  context: string;
  initialDialogue: string;
  defaultGoal: string;
  goals: string[];
  portrait: string;
  hint: string;
}

export interface OfficeTask {
  id: string;
  scenarioId: string;
  title: string;
  npc: string;
  zone: string;
  skill: string;
  completed: boolean;
}

