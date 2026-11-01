import asyncio
import edge_tts
import os

scripts = {
    "seg1": "Bagi talenta neurodivergen, seperti individu pada spektrum autisme atau ADHD, kompetensi teknis bukanlah masalah utama. Hambatan terbesar sering kali terletak pada kurikulum tersembunyi di dunia kerja: memahami instruksi ambigu, kritik yang terselubung, dan perubahan mendadak di luar jam kerja yang memicu kecemasan tinggi. Inilah NeuroSim: Simulator dinamika kantor berbasis agen AI yang aman, adaptif, dan bebas penghakiman.",
    "seg2": "NeuroSim menghadirkan ruang kantor virtual dua dimensi interaktif berbasis Phaser 3 dan React. Di sini, pengguna dapat memilih peran profesional, menyesuaikan karakter secara inklusif, dan menjelajahi dinamika ruang kerja layaknya hari pertama bekerja di kantor sungguhan. Bagi pengguna yang lebih nyaman dengan tampilan bebas distraksi visual, NeuroSim juga menyediakan Direct Mode untuk langsung fokus ke latihan komunikasi.",
    "seg3": "Mari kita uji Skenario Pertama: menghadapi atasan yang meminta dokumen dirapikan sebelum besok pagi tanpa rincian. Pengguna diajak menetapkan tujuan komunikasinya sendiri. Percakapan ini ditenagai Google Gemini API yang diprogram dengan batasan psikologis yang ketat: tegas dan lugas, namun tidak pernah merendahkan. Pengguna memiliki kendali penuh melalui tombol Jeda dan Petunjuk saat merasa kewalahan, menjaga ruang latihan tetap aman dan bebas trauma.",
    "seg4": "Setelah sesi selesai, agen evaluator independen menilai percakapan menggunakan Rubrik Objektif 4 Dimensi, bukan berdasarkan basa-basi sosial, melainkan efektivitas dan batasan kerja sehat. Fitur kuncinya adalah Membongkar Maksud Tersembunyi: NeuroSim menjelaskan apa yang sebenarnya dipikirkan oleh atasan secara eksplisit, menghapus kabut tebak-tebakan sosial, serta memberikan contoh respons alternatif baik versi ringkas maupun rinci untuk dicoba kembali.",
    "seg5": "NeuroSim dibangun dengan prinsip Aksesibilitas Penuh (WCAG AA), mendukung mode kontras tinggi, pengurangan animasi gerak, hingga arsitektur multiplayer realtime. Berlandaskan Double Empathy Theory, kami tidak berusaha mengubah cara berpikir pekerja neurodivergen, melainkan menjembatani komunikasi agar dunia kerja Indonesia menjadi lebih inklusif, suportif, dan setara. NeuroSim: Mengubah kecemasan sosial menjadi kesiapan profesional. Terima kasih."
}

async def generate():
    os.makedirs("demo_assets/audio", exist_ok=True)
    voice = "id-ID-ArdiNeural" # Professional, confident, clear
    for key, text in scripts.items():
        communicate = edge_tts.Communicate(text, voice, rate="+2%")
        out_path = f"demo_assets/audio/{key}.mp3"
        await communicate.save(out_path)
        print(f"Generated {out_path}")

if __name__ == "__main__":
    asyncio.run(generate())
