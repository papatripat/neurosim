import { ScenarioItem, OfficeTask, EvaluationResult } from '../types/conversation';

export const SCENARIOS: ScenarioItem[] = [
  {
    id: 'skenario-1',
    name: 'Bu Rina',
    role: 'Atasan Tim Antarmuka',
    zone: 'Zona 4 · Ruang Bos',
    targetSkill: 'Mengajukan pertanyaan klarifikasi spesifik',
    context:
      'Bu Rina bicara singkat dan mengandalkan konteks. Kamu perlu menggali apa maksud sebenarnya dari instruksi yang ambigu.',
    initialDialogue:
      'Halaman beranda tolong dirapikan ya. Besok pagi saya lihat.',
    defaultGoal: 'Mendapat kejelasan instruksi spesifik',
    goals: [
      'Mendapat kejelasan instruksi spesifik',
      'Memastikan prioritas tugas dan batas waktu pasti',
      'Menjaga batas kerja tanpa terkesan menolak tugas',
    ],
    portrait: '/assets/characters/office-worker/standing/south.png',
    hint: 'Tanyakan dua hal: objek pekerjaan (tampilan atau kode) dan jam berapa "besok pagi" yang dimaksud.',
  },
  {
    id: 'skenario-2',
    name: 'Dimas',
    role: 'Rekan Kerja Senior',
    zone: 'Zona 1 · Pantry',
    targetSkill: 'Menanyakan maksud tersirat dan meminta contoh konkret',
    context:
      'Dimas memberi kritik samar sambil membuat kopi. Kamu perlu menggali apa yang sebenarnya dia maksud tanpa bersikap defensif.',
    initialDialogue:
      'Menarik sih kemarin formulirnya, tapi kayaknya alurnya masih bisa dipikirkan lagi deh.',
    defaultGoal: 'Menanyakan maksud dan meminta contoh konkret',
    goals: [
      'Menanyakan maksud dan meminta contoh konkret',
      'Memahami alasan kritik tanpa bersikap defensif',
      'Mendiskusikan solusi perbaikan alur pengguna',
    ],
    portrait: '/assets/characters/resident/standing/south.png',
    hint: 'Jangan defensif. Tanyakan bagian formulir mana yang dirasa ganjil dan minta contoh alur yang lebih baik.',
  },
  {
    id: 'skenario-3',
    name: 'Pak Hendra',
    role: 'Klien Pemilik Proyek',
    zone: 'Zona 2 · Meeting Room',
    targetSkill: 'Menetapkan batasan jam kerja & negosiasi tenggat',
    context:
      'Pak Hendra mengirim permintaan mendadak di luar jam kerja karena cemas akan presentasi direksi besok siang.',
    initialDialogue:
      'Malam, tolong perombakan fitur laporan diselesaikan malam ini ya. Besok jam 11 siang harus saya bawa ke direksi!',
    defaultGoal: 'Menetapkan batas jam kerja & negosiasi tenggat realistis',
    goals: [
      'Menetapkan batas jam kerja & negosiasi tenggat realistis',
      'Menawarkan alternatif kompromi untuk demo esok hari',
      'Menjaga profesionalisme di bawah tekanan mendadak',
    ],
    portrait: '/assets/characters/courier/standing/south.png',
    hint: 'Validasi kekhawatirannya soal rapat direksi, jelaskan kapasitasmu malam ini, tawarkan bagian inti yang realistis.',
  },
];

export const INITIAL_TASKS: OfficeTask[] = [
  {
    id: 'task-1',
    scenarioId: 'skenario-1',
    title: 'Klarifikasi Tugas Halaman Beranda',
    npc: 'Bu Rina',
    zone: 'Zona 4 · Ruang Bos',
    skill: 'Klarifikasi Instruksi Ambigu',
    completed: false,
  },
  {
    id: 'task-2',
    scenarioId: 'skenario-2',
    title: 'Diskusi Alur Formulir Pendaftaran',
    npc: 'Dimas',
    zone: 'Zona 1 · Pantry',
    skill: 'Menanyakan Maksud Kritik Tersirat',
    completed: false,
  },
  {
    id: 'task-3',
    scenarioId: 'skenario-3',
    title: 'Negosiasi Permintaan Revisi Mendadak',
    npc: 'Pak Hendra',
    zone: 'Zona 2 · Meeting Room',
    skill: 'Menetapkan Batas Jam Kerja',
    completed: false,
  },
];

export const MOCK_REPLIES: Record<string, string[]> = {
  'skenario-1': [
    'Tampilannya. Terutama bagian atas, jaraknya masih berantakan. Jam 9 besok saya buka.',
    'Ya, navigasi header dan jarak logo terlalu mepet. Tolong sesuaikan padding-nya.',
    'Cukup fokus pada bagian itu dulu. Nanti saya periksa lagi sebelum rapat.',
  ],
  'skenario-2': [
    'Iya, tadi aku coba di formulir pendaftaran pas klik tombol simpan, alurnya kayak muter-muter.',
    'Bukan cuma labelnya sih, tapi urutan langkahnya agak rancu buat pengguna pertama.',
    'Saran aja sih, coba dibikin bertahap atau ada indikator progress bar yang lebih jelas.',
  ],
  'skenario-3': [
    'Soalnya besok jam 11 siang direksi mau lihat demo produknya langsung, saya khawatir kalau belum siap.',
    'Kalau memang tidak sempat semua malam ini, kira-kira fitur utama apa yang bisa selesai besok pagi?',
    'Baik, mari kita prioritaskan modul utama itu dulu. Sisanya kita diskusikan lagi setelah rapat direksi.',
  ],
};

export const MOCK_EVALUATIONS: Record<string, EvaluationResult> = {
  'skenario-1': {
    kejelasan_pesan: {
      tingkat: 'efektif',
      alasan:
        'Pertanyaanmu langsung menyebutkan objek kerja dan mengonfirmasi batas waktu spesifik.',
    },
    pemahaman_konteks: {
      tingkat: 'efektif',
      alasan:
        'Kamu menyadari bahwa kata "dirapikan" punya banyak tafsir dan langsung memastikannya.',
    },
    ketercapaian_tujuan: {
      tingkat: 'efektif',
      alasan:
        'Objek yang harus diperbaiki dan tenggat jam 09.00 sudah terkonfirmasi jelas.',
    },
    rasa_hormat_dan_batasan: {
      tingkat: 'berkembang',
      alasan:
        'Respons sudah sopan dan profesional, tapi belum mengomunikasikan batas kapasitas.',
    },
    maksud_tersembunyi_karakter:
      'Bu Rina ingin jarak dan penataan bagian atas halaman beranda rapi sebelum pukul 09.00 WIB.',
    alternatif_respons: {
      versi_ringkas:
        'Bu Rina, yang dirapikan tampilan atau kode, dan batas waktunya jam berapa besok?',
      versi_rinci:
        'Supaya hasilnya tepat, boleh saya pastikan: bagian mana yang diprioritaskan, dan batas waktu besok pagi pukul berapa?',
    },
    rekomendasi_level: 'naik',
  },
  'skenario-2': {
    kejelasan_pesan: {
      tingkat: 'efektif',
      alasan:
        'Pertanyaan terfokus pada meminta contoh nyata di bagian formulir pendaftaran.',
    },
    pemahaman_konteks: {
      tingkat: 'efektif',
      alasan:
        'Berhasil mengurai kritik samar menjadi perbaikan alur teknis yang konkret.',
    },
    ketercapaian_tujuan: {
      tingkat: 'efektif',
      alasan:
        'Maksud rekan senior berhasil terungkap tanpa perdebatan personal.',
    },
    rasa_hormat_dan_batasan: {
      tingkat: 'efektif',
      alasan:
        'Gaya bicara tetap santai layaknya rekan setara tanpa terkesan defensif.',
    },
    maksud_tersembunyi_karakter:
      'Ada alur navigasi di formulir pendaftaran yang membingungkan bagi pengguna baru.',
    alternatif_respons: {
      versi_ringkas:
        'Boleh kasih contoh spesifik tombol atau langkah mana yang membingungkan?',
      versi_rinci:
        'Menarik, Dimas. Boleh tunjukkan bagian mana yang menurutmu ganjil supaya bisa langsung aku perbaiki?',
    },
    rekomendasi_level: 'naik',
  },
  'skenario-3': {
    kejelasan_pesan: {
      tingkat: 'efektif',
      alasan:
        'Menegaskan batasan waktu di luar jam kerja dengan tawaran solusi kompromi.',
    },
    pemahaman_konteks: {
      tingkat: 'efektif',
      alasan:
        'Menangkap kepanikan klien menjelang rapat direksi dan menenangkannya.',
    },
    ketercapaian_tujuan: {
      tingkat: 'efektif',
      alasan:
        'Target menjaga batasan jam kerja tercapai tanpa membatalkan proyek.',
    },
    rasa_hormat_dan_batasan: {
      tingkat: 'efektif',
      alasan:
        'Menjaga hubungan bisnis yang sehat dan menghargai urgensi klien.',
    },
    maksud_tersembunyi_karakter:
      'Klien panik karena ada presentasi direksi besok siang dan butuh kepastian progres.',
    alternatif_respons: {
      versi_ringkas:
        'Malam ini saya selesaikan fitur intinya dulu, sisanya kita selesaikan besok pagi sebelum rapat.',
      versi_rinci:
        'Saya mengerti urgensi rapat besok, Pak. Karena sekarang di luar jam kerja, bagaimana jika malam ini saya pastikan demo intinya siap, dan rincian lain kita selesaikan besok pagi?',
    },
    rekomendasi_level: 'naik',
  },
};

