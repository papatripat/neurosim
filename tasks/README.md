# NEUROSIM — Panduan Koordinasi Tim & 3 Pilar Pengerjaan
**Hackathon INCEPTION 2026 · Tim: mamah doain aku lolos final**

Dokumen ini adalah panduan pembagian kerja 3 pilar utama untuk 3 anggota tim beserta AI companion-nya. Setiap anggota memiliki berkas panduan teknis terisolasi agar dapat bekerja secara mandiri tanpa saling mengunci (*zero merge conflict*).

---

## Pembagian Peran & Dokumen Tugas

| Anggota Tim | Peran Utama | Berkas Panduan Teknis | Fokus Utama |
| :--- | :--- | :--- | :--- |
| **Priyoga Listyo Ananda** | *2D Game World & Phaser Engine* | [`01_TASK_GAME_ENGINE_PRIYOGA.md`](./01_TASK_GAME_ENGINE_PRIYOGA.md) | Phaser 3.85+ di React, Canvas Kantor 576×384, Y-Sorting, Deteksi Jarak [E], Fix Keyboard Capture |
| **Rifat Abhista** | *Lead Backend & AI Architecture* | [`02_TASK_BACKEND_AI_RIFAT.md`](./02_TASK_BACKEND_AI_RIFAT.md) | Gemini API Proxy, Validasi Zod, Naskah Persona & Evaluator Rubrik 4 Dimensi, Rule Penyesuaian Level |
| **Baginda Putra Krista** | *UI/UX, Aksesibilitas & Skenario* | [`03_TASK_UI_ACCESSIBILITY_BAGINDA.md`](./03_TASK_UI_ACCESSIBILITY_BAGINDA.md) | Modal Chat React, Tombol Aksi (Jeda/Lewati/Keluar/Petunjuk), Rubrik Evaluasi & Coba Lagi, Dual-Mode UX |

---

## Struktur Aset Terkurasi (`public/assets/`)

Folder `public/` telah dirapikan menjadi struktur bersih dan terkurasi dengan pembaruan peta kantor resolusi tinggi **WebP (2752×1536 px, ~487 KB)**:

```
public/assets/
├── maps/
│   ├── rooms-ground.webp       --> Peta kantor utama 2752x1536 px (WebP ~487 KB)
│   ├── manifest.json           --> Koordinat 5 zona kantor & bounding box
│   └── environment-palette.gpl --> Palet warna resmi 24-warna
├── props/                      --> Sprite perabot kantor (desk, chair, computer, cooler, dll.)
├── characters/
│   ├── resident/               --> Karakter Pemain (aligned.png + south.png)
│   ├── office-worker/          --> NPC 1: Bu Rina (aligned.png + south.png)
│   └── courier/                --> NPC 3: Klien Pak Hendra (aligned.png + south.png)
└── ui/
    ├── spritesheet.png         --> Ikon transparan Kenney (16x16)
    ├── 9-slice/                --> Bingkai dialog tan/brown & tombol warna
    └── License.txt             --> Lisensi CC0
```

### 5 Zona Kantor pada Peta Baru (2752×1536 px)
1. **Zona 1 (Kiri Atas): Pantry & Dapur (Dimas - Skenario 2)** — Lantai catur hitam-abu, tempat istirahat, membuat kopi, dan kritik tidak langsung.
2. **Zona 2 (Kiri Tengah): Meeting Room (Pak Hendra - Skenario 3)** — Ruang rapat berlantai oranye terracotta untuk negosiasi tenggat & revisi mendadak dengan klien.
3. **Zona 3 (Kiri Bawah): Smoking Area** — Area santai/merokok karyawan berlantai ubin teal dengan jendela sirkulasi.
4. **Zona 4 (Kanan Atas): Ruangan Bos (Bu Rina - Skenario 1)** — Ruang kerja atasan formal berlantai parket kayu untuk klarifikasi instruksi ambigu.
5. **Zona 5 (Kanan Bawah & Tengah): Main Room (Tempat Kerja Karyawan)** — Area kerja utama karpet biru, workstation karyawan, dan meja kerja pemain.

### Titik Khusus:
- **Pintu Depan (Spawn Pemain):** Terletak tepat di seberang Koridor Tengah bagian bawah `(1375, 1280)`.
- **Papan To-Do List Interaktif:** Terletak di dinding **Koridor Tengah** `(1400, 450)`. Pemain dapat menekan **[E]** untuk melihat daftar skenario/tugas kerja harian yang harus diselesaikan!

---

## Titik Sambung Antar-Peran (Contract & Interfaces)

Ketiga modul ini hanya berkomunikasi melalui 2 kontrak sederhana:

### 1. Kontrak Phaser ↔ React (`EventBus`)
Dikelola bersama antara **Priyoga** (Phaser) dan **Baginda** (React):
- **Event `OPEN_DIALOG`**: Dipancarkan oleh Phaser saat pemain menekan [E] di dekat NPC.
  ```ts
  EventBus.emit('OPEN_DIALOG', { scenarioId: 'skenario-1', npcName: 'Bu Rina' });
  ```
  *Phaser mematikan keyboard capture (`disableGlobalCapture()`) dan mengunci gerak pemain.*
- **Event `CLOSE_DIALOG`**: Dipancarkan oleh React saat pemain keluar dari dialog / selesai latihan.
  ```ts
  EventBus.emit('CLOSE_DIALOG');
  ```
  *Phaser menghidupkan kembali keyboard capture (`enableGlobalCapture()`) dan membuka kunci gerak pemain.*

### 2. Kontrak React ↔ Backend (`API Endpoints`)
Dikelola bersama antara **Baginda** (React) dan **Rifat** (Backend):
- **`POST /api/chat`**:
  - Request: `{ scenarioId: string, level: 1|2|3, transcript: Array<{ speaker: 'user'|'character', text: string }> }`
  - Response: `{ reply: string }`
- **`POST /api/evaluate`**:
  - Request: `{ scenarioId: string, level: 1|2|3, userGoal: string, transcript: Array<{ speaker: string, text: string }> }`
  - Response: Strictly JSON tervalidasi Zod berisi evaluasi 4 dimensi, maksud tersembunyi, 2 alternatif respons, dan rekomendasi level.

---

## Disiplin Gerbang Sprint 24 Jam

1. **Gerbang A (Jam ke-10):**
   - Skenario 1 (Bu Rina) wajib berjalan tuntas dari awal hingga umpan balik.
   - Jika canvas Phaser terkendala, **aktifkan Mode Daftar Skenario Langsung** milik Baginda sebagai jalan pintas utama agar evaluasi AI tetap dapat diuji.
2. **Gerbang B (Jam ke-15):**
   - Fitur baru dihentikan.
   - Skenario 1 & 2 wajib stabil. Jika waktu sempit, Skenario 3 disederhanakan.
   - Fokus ke pengujian bebas bug, aksesibilitas, dan persiapan materi submission.
