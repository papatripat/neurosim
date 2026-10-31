# DESIGN DIRECTION — NEUROSIM

## 1. Identitas & Visi Produk
- **Produk:** NeuroSim (Simulator Dinamika Kantor Berbasis Agen AI untuk Pekerja Neurodivergen)
- **Karakter & Jiwa:** *Cozy Tactile Analog Office* — memadukan kehangatan ruang kerja fisik (kertas manila, papan tugas gabus, folder arsip kayu) dengan dunia virtual 16-bit.
- **Prinsip Utama:** Menenangkan, terstruktur, ramah sensorik, tanpa penghakiman, dan tidak memicu kelelahan visual (*sensory-friendly*).

## 2. Palet Warna (Grounded pada `environment-palette.gpl`)
Bebas dari warna neon yang menyilaukan mata dan bebas dari generic blue-purple AI gradients.
- **Latar Belakang Utama:** `#e6dfce` (Pasir Hangat / Sand)
- **Permukaan Kartu & Panel:** `#f4ead5` (Kertas Manila / Soft Cream)
- **Tinta Teks Utama:** `#242a38` (Dark Slate Navy — Kontras 11.2:1 terhadap krem, lolos WCAG AAA)
- **Tinta Teks Pendukung:** `#4a5659` (Muted Slate — Kontras >4.5:1 untuk teks normal)
- **Struktur & Tombol Utama:** `#355c5a` (Deep Slate Teal) dengan hover `#2c4d4b`
- **Aksen Taktil Kayu/Papan:** `#856044` (Warm Wood Oak)
- **Aksen Umpan Balik Deskriptif:**
  - *Efektif:* `#2b6e4f` (Sage Green)
  - *Berkembang:* `#b87a28` (Warm Ochre)
  - *Perlu Dilatih:* `#94463d` (Terracotta Brick)
  - *Aksen Khusus / Sorotan Papan:* `#e0b65d` (Warm Brass Gold)

## 3. Tipografi
- **Teks Utama:** Humanist system sans-serif (`system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`) dengan leading yang longgar untuk kemudahan baca penderita ADHD / disleksia.
- **Aksen Metadata / Angka:** Font monospace bersih untuk giliran interaksi dan indikator status teknis.
- **Aturan Tegas:** Tidak menggunakan uppercase berlebihan dengan tracking ekstrem, teks percakapan selalu muncul langsung tanpa efek ketik lambat.

## 4. Bentuk & Komponen
- **Bentuk:** Sudut sedikit membulat lembut (`rounded-lg` atau `rounded-md`), tidak semua komponen berbentuk pil bulat.
- **Elevasi:** Matte & terbumi (ground plane). Hanya modal overlay yang memiliki shadow lembut, seluruh komponen halaman duduk rata (*flat & tactile*).
- **Border:** Garis pembatas halus 1-2px dengan warna yang kontras tegas (`border-sand` atau `border-teal`).
- **Ikonografi:** Ikon hanya digunakan untuk aksi fungsional (kirim, tutup, navigasi). Tidak menggunakan ikon dekoratif yang mengacaukan hierarki.

## 5. Dials
- **ENERGY:** 2 (Tenang, hangat, profesional)
- **RHYTHM:** 2 (Komposisi terstruktur, hierarki jelas)
- **MOTION:** 1 (Animasi minimal, hanya transisi state fungsional, bebas infinite pulse/ping loop)

