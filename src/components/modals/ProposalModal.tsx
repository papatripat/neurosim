import React, { useEffect, useRef } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ProposalModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    dialogRef.current?.focus();
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-3 sm:p-4 overflow-y-auto">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="proposal-title"
        tabIndex={-1}
        className="w-full max-w-2xl bg-cream border-2 border-teal rounded-lg shadow-xl my-6 max-h-[88vh] flex flex-col overflow-hidden"
      >
        {/* Whitepaper Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-teal text-soft border-b border-teal-dark">
          <div>
            <h2 id="proposal-title" className="text-sm sm:text-base font-bold">
              Berkas Proposal & Landasan Riset NeuroSim
            </h2>
            <p className="text-[11px] text-soft/80">
              Hackathon INCEPTION 2026 · Sub-Tema: Education and Inclusive Future Skills
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup Berkas Proposal"
            className="text-soft/80 hover:text-soft text-lg leading-none px-1.5 py-0.5 rounded transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Document Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-sm text-ink leading-relaxed bg-parchment/40">
          <blockquote className="p-3.5 bg-sand rounded border border-muted/20 text-ink">
            <p className="italic text-xs sm:text-sm">
              "Mengubah tantangan sosial menjadi kesiapan profesional melalui simulasi ruang kerja berbasis AI yang aman, adaptif, dan terukur."
            </p>
            <cite className="block text-[11px] text-ink-muted not-italic mt-1.5 font-medium">
              Tim: mamah doain aku lolos final · Universitas Pembangunan Nasional "Veteran" Jawa Timur
            </cite>
          </blockquote>

          {/* 1. Latar Belakang */}
          <section className="space-y-1.5">
            <h3 className="text-sm font-bold text-teal">1. Latar Belakang & Masalah Utama</h3>
            <p className="text-xs text-ink leading-relaxed">
              Mahasiswa tingkat akhir dan lulusan baru neurodivergen (seperti autisme atau ADHD) kerap menghadapi hambatan saat memasuki dunia kerja. Hambatan ini bukan disebabkan oleh kurangnya kompetensi teknis, melainkan tingginya tuntutan komunikasi implisit: instruksi kerja yang ambigu, kritik yang dibungkus basa-basi, serta perubahan prioritas mendadak di luar jam kerja.
            </p>
          </section>

          {/* 2. Landasan Ilmiah & Regulasi */}
          <section className="space-y-2">
            <h3 className="text-sm font-bold text-teal">2. Landasan Ilmiah & Regulasi Inklusi</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-3 bg-soft rounded border border-sand space-y-1">
                <h4 className="text-xs font-bold text-teal">Teori Double Empathy (Milton, 2012)</h4>
                <p className="text-xs text-ink-muted leading-relaxed">
                  Kesalahpahaman komunikasi antara orang autistik dan non-autistik adalah masalah interaksi dua arah, bukan kekurangan salah satu pihak. NeuroSim tidak bertujuan "memperbaiki" pengguna, melainkan memberi ruang aman berlatih membaca konteks.
                </p>
              </div>

              <div className="p-3 bg-soft rounded border border-sand space-y-1">
                <h4 className="text-xs font-bold text-teal">Dasar Hukum Ketenagakerjaan</h4>
                <p className="text-xs text-ink-muted leading-relaxed">
                  UU No. 8 Tahun 2016 Pasal 53 mewajibkan instansi pemerintah/BUMN mempekerjakan paling sedikit 2% dan swasta 1% penyandang disabilitas. PP No. 60 Tahun 2020 juga mewajibkan adanya Unit Layanan Disabilitas.
                </p>
              </div>
            </div>
          </section>

          {/* 3. Tiga Skenario Kerja */}
          <section className="space-y-2">
            <h3 className="text-sm font-bold text-teal">3. Tiga Skenario Latihan di Kantor Virtual</h3>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 bg-soft rounded border border-sand">
                <strong className="text-teal block">Ruang Eksekutif & Manajemen: Bu Rina (Atasan Perfeksionis)</strong>
                <p className="text-ink-muted">Tantangan: Instruksi ambigu ("tolong dirapikan ya, besok pagi saya lihat"). Keterampilan: Mengajukan pertanyaan klarifikasi spesifik.</p>
              </div>

              <div className="p-2.5 bg-soft rounded border border-sand">
                <strong className="text-teal block">Pantry & Dapur: Dimas (Rekan Kerja Senior)</strong>
                <p className="text-ink-muted">Tantangan: Kritik tersirat bernada santai di pantry. Keterampilan: Menanyakan maksud dan meminta contoh konkret.</p>
              </div>

              <div className="p-2.5 bg-soft rounded border border-sand">
                <strong className="text-teal block">Ruang Rapat & Konferensi: Pak Hendra (Klien)</strong>
                <p className="text-ink-muted">Tantangan: Permintaan revisi mendadak di luar jam kerja karena cemas rapat direksi. Keterampilan: Menetapkan batas dan negosiasi tenggat realistis.</p>
              </div>
            </div>
          </section>

          {/* 4. Rubrik Penilaian */}
          <section className="space-y-1.5">
            <h3 className="text-sm font-bold text-teal">4. Rubrik Evaluasi 4 Dimensi Objektif</h3>
            <p className="text-xs text-ink leading-relaxed">
              Setiap respons dinilai menggunakan 4 dimensi: Kejelasan Pesan, Pemahaman Konteks, Ketercapaian Tujuan, dan Rasa Hormat & Batasan. Penilaian menggunakan skala deskriptif (Perlu Dilatih, Berkembang, Efektif) tanpa angka skor penghakiman.
            </p>
          </section>

          {/* 5. Etika & Privasi */}
          <section className="p-3 bg-sand rounded border border-muted/20 text-xs space-y-1">
            <h4 className="font-bold text-ink">Komitmen Privasi & Etika Penggunaan</h4>
            <ul className="list-disc list-inside text-ink space-y-0.5">
              <li>NeuroSim bukan alat diagnosis medis dan tidak menggantikan bantuan profesional.</li>
              <li>Data percakapan tidak disimpan di server pada versi MVP, hanya tersimpan di memori peramban pengguna.</li>
              <li>Pengguna dapat menandai umpan balik evaluator yang terasa kurang tepat.</li>
            </ul>
          </section>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-cream border-t border-sand flex justify-between items-center text-xs">
          <span className="text-ink-muted">Sumber: Dokumen Resmi Proposal Inception 2026</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-teal text-soft rounded font-medium hover:bg-teal-dark transition-colors"
          >
            Selesai & Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
