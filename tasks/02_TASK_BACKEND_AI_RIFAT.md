# PANDUAN TEKNIS: BACKEND & AI ARCHITECTURE
**Penanggung Jawab:** Rifat Abhista (didukung Backend & AI Companion Agent)  
**Tujuan Utama:** Membangun proxy AI stateless yang aman, prompt engineering berjangkar, validasi skema JSON evaluasi 4 dimensi (Zod), dan rule engine penyesuaian level deterministik.

---

## 1. File Tanggung Jawab & Struktur Modul

Rifat bertanggung jawab penuh atas pembuatan dan pemeliharaan file-file berikut:

```
src/
├── schemas/
│   └── evaluator.schema.ts      --> Kontrak skema Zod untuk output evaluator
├── config/
│   └── scenarios.config.ts      --> Naskah persona, prompt system, batas perilaku, hidden intent
├── services/
│   ├── gemini.service.ts        --> Wrapper pemanggil Google Gemini API
│   └── levelEngine.ts           --> Fungsi murni penentu rekomendasi naik/turun level
api/
├── chat.ts                      --> Endpoint POST /api/chat (Persona Roleplay)
└── evaluate.ts                  --> Endpoint POST /api/evaluate (Rubric Evaluator)
```

---

## 2. Kontrak & Skema Validasi Zod (`src/schemas/evaluator.schema.ts`)

Evaluator Agent wajib mengembalikan JSON valid tanpa markdown formatting (`json...`). Skema Zod mengunci format agar frontend tidak pernah mengalami *render crash*:

```typescript
import { z } from 'zod';

export const EvaluasiDimensiSchema = z.object({
  tingkat: z.enum(['perlu dilatih', 'berkembang', 'efektif']),
  alasan: z.string().min(10, 'Alasan evaluasi harus deskriptif'),
});

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

// Payload lengkap yang dikirim ke Frontend (sudah digabung dengan data server-side)
export interface FullEvaluationResult extends RubricOutput {
  maksud_tersembunyi_karakter: string; // Diambil dari scenarios.config.ts, bukan ditebak LLM
  rekomendasi_level: 'tetap' | 'naik' | 'turun'; // Dihitung oleh levelEngine.ts
}
```

---

## 3. Konfigurasi Skenario Server-Side (`src/config/scenarios.config.ts`)

> **ATURAN PRIVASI & KEAMANAN:** Maksud tersembunyi (*hidden intent*) dan naskah persona **TIDAK BOLEH** disimpan di client atau dikirim oleh browser. Semuanya tersimpan di server agar pengguna tidak bisa melihatnya di DevTools Network tab.

```typescript
export interface ScenarioConfig {
  id: string;
  name: string;
  role: string;
  targetSkill: string;
  hiddenIntent: string; // Jangkar evaluasi (ditulis manusia)
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
```

---

## 4. Mesin Rekomendasi Level Deterministik (`src/services/levelEngine.ts`)

> **ATURAN PROPOSAL BAB E:** Rekomendasi level **BUKAN** tebakan LLM, melainkan fungsi logika murni:

```typescript
import { RubricOutput } from '../schemas/evaluator.schema';

export function calculateLevelRecommendation(evaluation: RubricOutput): 'tetap' | 'naik' | 'turun' {
  const dimensions = [
    evaluation.kejelasan_pesan.tingkat,
    evaluation.pemahaman_konteks.tingkat,
    evaluation.ketercapaian_tujuan.tingkat,
    evaluation.rasa_hormat_dan_batasan.tingkat,
  ];

  const efektifCount = dimensions.filter(t => t === 'efektif').length;
  const perluDilatihCount = dimensions.filter(t => t === 'perlu dilatih').length;

  if (efektifCount >= 3) {
    return 'naik';
  } else if (perluDilatihCount >= 2) {
    return 'turun';
  }
  return 'tetap';
}
```

---

## 5. Implementasi Endpoint Persona Chat (`api/chat.ts`)

```typescript
import { GoogleGenAI } from '@google/genai';
import { SCENARIOS } from '../src/config/scenarios.config';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function handleChat(req: Request): Promise<Response> {
  try {
    const { scenarioId, level = 2, transcript } = await req.json();
    const scenario = SCENARIOS[scenarioId] || SCENARIOS['skenario-1'];

    // Batasi konteks maksimal 6 giliran sesuai proposal
    const limitedHistory = transcript.slice(-12);

    const systemInstruction = `
${scenario.systemPrompt}
Tingkat kesulitan saat ini: Level ${level} (${scenario.levelRules[level as 1|2|3]}).
Batasan perilaku: ${scenario.behaviorLimits}.
Jawab dalam 1-3 kalimat langsung layaknya percakapan chat. Jangan gunakan format surat atau pembuka email.
`;

    // Format riwayat obrolan untuk Gemini
    const contents = limitedHistory.map((m: any) => ({
      role: m.speaker === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }]
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.3, // Rendah agar konsisten
        maxOutputTokens: 150
      }
    });

    const reply = response.text?.trim() || scenario.fallbackReply;
    return new Response(JSON.stringify({ reply }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Chat API Error:', error);
    return new Response(JSON.stringify({ reply: 'Baik, tolong lanjutkan tugasnya ya.' }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
```

---

## 6. Implementasi Endpoint Rubrik Evaluator (`api/evaluate.ts`)

```typescript
import { GoogleGenAI } from '@google/genai';
import { SCENARIOS } from '../src/config/scenarios.config';
import { RubricOutputSchema } from '../src/schemas/evaluator.schema';
import { calculateLevelRecommendation } from '../src/services/levelEngine';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function handleEvaluate(req: Request): Promise<Response> {
  try {
    const { scenarioId, level, userGoal, transcript } = await req.json();
    const scenario = SCENARIOS[scenarioId] || SCENARIOS['skenario-1'];

    const prompt = `
Kamu adalah Rubric Evaluator independen untuk NeuroSim.
Evaluasi transkrip percakapan berikut secara objektif berdasarkan tujuan pengguna dan maksud tersembunyi karakter.
Tujuan pilihan pengguna: "${userGoal}"
Maksud tersembunyi karakter yang sebenarnya: "${scenario.hiddenIntent}"

Transkrip Percakapan:
${JSON.stringify(transcript, null, 2)}

Rubrik Penilaian 4 Dimensi:
1. kejelasan_pesan: Apakah maksud pengguna langsung terbaca dan spesifik?
   Pilihan tingkat: 'perlu dilatih' (maksud tidak terbaca/panjang tanpa inti), 'berkembang' (terbaca tapi bertele-tele), 'efektif' (langsung terbaca & spesifik).
2. pemahaman_konteks: Apakah pengguna menangkap yang tersirat atau memastikannya?
   Pilihan tingkat: 'perlu dilatih' (mengabaikan yang tersirat), 'berkembang' (menebak tanpa memastikan), 'efektif' (memastikan lewat pertanyaan).
3. ketercapaian_tujuan: Apakah respons mendekatkan ke tujuan pilihan pengguna?
   Pilihan tingkat: 'perlu dilatih', 'berkembang', 'efektif'.
4. rasa_hormat_dan_batasan: Apakah menjaga rasa hormat sekaligus menjaga batas/kapasitas pengguna?
   Pilihan tingkat: 'perlu dilatih', 'berkembang', 'efektif'.

Alternatif respons: Berikan 1 versi ringkas dan 1 versi lebih rinci.
Balas HANYA dalam format JSON murni tanpa markdown triple backticks.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: 'application/json',
        temperature: 0.1 // Suhu sangat rendah untuk evaluasi stabil
      }
    });

    const parsedJson = JSON.parse(response.text || '{}');
    const validatedRubric = RubricOutputSchema.parse(parsedJson);

    // Hitung rekomendasi level secara deterministik
    const levelRec = calculateLevelRecommendation(validatedRubric);

    const fullResult = {
      ...validatedRubric,
      maksud_tersembunyi_karakter: scenario.hiddenIntent,
      rekomendasi_level: levelRec
    };

    return new Response(JSON.stringify(fullResult), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Evaluate API Error:', error);
    // Fallback template jika LLM error
    return new Response(JSON.stringify(getFallbackEvaluation(scenarioId)), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

function getFallbackEvaluation(scenarioId: string) {
  const scenario = SCENARIOS[scenarioId] || SCENARIOS['skenario-1'];
  return {
    kejelasan_pesan: { tingkat: 'berkembang', alasan: 'Pesan telah disampaikan namun dapat diperjelas lagi.' },
    pemahaman_konteks: { tingkat: 'berkembang', alasan: 'Sebagian konteks tersirat berhasil ditangkap.' },
    ketercapaian_tujuan: { tingkat: 'berkembang', alasan: 'Mendekati tujuan yang dipilih.' },
    rasa_hormat_dan_batasan: { tingkat: 'efektif', alasan: 'Tetap menjaga kesopanan dan batas kerja.' },
    alternatif_respons: {
      versi_ringkas: 'Boleh saya pastikan objek kerja dan tenggat waktunya?',
      versi_rinci: 'Supaya hasilnya sesuai harapan, boleh saya konfirmasi rincian pekerjaan dan batas waktunya?'
    },
    maksud_tersembunyi_karakter: scenario.hiddenIntent,
    rekomendasi_level: 'tetap'
  };
}
```

---

## 7. Checklist Verifikasi Rifat

- [ ] File `scenarios.config.ts` memuat lengkap Skenario 1, 2, dan 3.
- [ ] Endpoint `/api/chat` membatasi riwayat transkrip maksimal 6 giliran percakapan.
- [ ] Endpoint `/api/evaluate` memvalidasi output dengan `RubricOutputSchema.parse()`.
- [ ] Fungsi `calculateLevelRecommendation` teruji dengan aturan $\ge 3$ efektif $\rightarrow$ naik.
- [ ] Environment variable `GEMINI_API_KEY` terkonfigurasi di `.env` (lokal) dan Vercel Dashboard (production).
- [ ] Mock fallback berfungsi jika kuota atau internet terputus saat demonstrasi.

