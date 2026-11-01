import os

subtitles = """1
00:00:01,000 --> 00:00:08,000
Bagi talenta neurodivergen—seperti individu pada spektrum autisme atau ADHD—kompetensi teknis bukanlah masalah utama.

2
00:00:08,500 --> 00:00:16,500
Hambatan terbesar sering kali terletak pada 'kurikulum tersembunyi' di dunia kerja: memahami instruksi ambigu, kritik yang terselubung,

3
00:00:17,000 --> 00:00:22,000
dan perubahan mendadak di luar jam kerja yang memicu kecemasan tinggi.

4
00:00:22,500 --> 00:00:27,000
Inilah NeuroSim: Simulator dinamika kantor berbasis agen AI yang aman, adaptif, dan bebas penghakiman.

5
00:00:28,500 --> 00:00:36,500
NeuroSim menghadirkan ruang kantor virtual 2D interaktif berbasis Phaser 3 dan React.

6
00:00:37,000 --> 00:00:46,500
Di sini, pengguna dapat memilih peran profesional, menyesuaikan karakter secara inklusif, dan menjelajahi dinamika ruang kerja layaknya hari pertama bekerja di kantor sungguhan.

7
00:00:47,000 --> 00:00:54,500
Bagi pengguna yang lebih nyaman dengan tampilan bebas distraksi visual, NeuroSim juga menyediakan Direct Mode untuk langsung fokus ke latihan komunikasi.

8
00:00:55,500 --> 00:01:03,000
Mari kita uji Skenario Pertama: menghadapi atasan yang meminta dokumen 'dirapikan sebelum besok pagi' tanpa rincian.

9
00:01:03,500 --> 00:01:10,000
Pengguna diajak menetapkan tujuan komunikasinya sendiri. Percakapan ini ditenagai Google Gemini API

10
00:01:10,200 --> 00:01:15,500
yang diprogram dengan batasan psikologis yang ketat: tegas dan lugas, namun tidak pernah merendahkan.

11
00:01:16,000 --> 00:01:23,500
Pengguna memiliki kendali penuh melalui tombol Jeda dan Petunjuk saat merasa kewalahan, menjaga ruang latihan tetap aman dan bebas trauma.

12
00:01:38,500 --> 00:01:46,500
Setelah sesi selesai, agen evaluator independen menilai percakapan menggunakan Rubrik Objektif 4 Dimensi—

13
00:01:47,000 --> 00:01:52,500
bukan berdasarkan basa-basi sosial, melainkan efektivitas dan batasan kerja sehat.

14
00:01:53,000 --> 00:02:00,500
Fitur kuncinya adalah Membongkar Maksud Tersembunyi: NeuroSim menjelaskan apa yang sebenarnya dipikirkan oleh atasan secara eksplisit,

15
00:02:01,000 --> 00:02:09,500
menghapus kabut tebak-tebakan sosial, serta memberikan contoh respons alternatif baik versi ringkas maupun rinci untuk dicoba kembali.

16
00:02:08,500 --> 00:02:16,500
NeuroSim dibangun dengan prinsip Aksesibilitas Penuh (WCAG AA)—mendukung mode kontras tinggi, pengurangan animasi gerak, hingga arsitektur multiplayer realtime.

17
00:02:17,000 --> 00:02:27,500
Berlandaskan Double Empathy Theory, kami tidak berusaha mengubah cara berpikir pekerja neurodivergen, melainkan menjembatani komunikasi agar dunia kerja Indonesia menjadi lebih inklusif, suportif, dan setara.

18
00:02:28,000 --> 00:02:36,000
NeuroSim — Mengubah kecemasan sosial menjadi kesiapan profesional. Terima kasih.
"""

def save_subtitles():
    os.makedirs("demo_assets/output", exist_ok=True)
    os.makedirs("public/demo", exist_ok=True)
    with open("demo_assets/output/neurosim_demo_subtitles.srt", "w", encoding="utf-8") as f:
        f.write(subtitles.strip())
    with open("public/demo/neurosim_demo_subtitles.srt", "w", encoding="utf-8") as f:
        f.write(subtitles.strip())
    print("Subtitles synchronized for 168s video!")

if __name__ == "__main__":
    save_subtitles()
