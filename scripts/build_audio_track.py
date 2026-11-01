import subprocess
import os

def build_audio():
    os.makedirs("demo_assets/output", exist_ok=True)
    
    # Delays in milliseconds:
    # Seg 1: 0.5s -> 500ms (duration ~26.2s, ends at ~26.7s)
    # Seg 2: 28.0s -> 28000ms (duration ~23.8s, ends at ~51.8s)
    # Seg 3: 55.0s -> 55000ms (duration ~25.8s, ends at ~80.8s)
    # Seg 4: 98.0s -> 98000ms (duration ~25.2s, ends at ~123.2s)
    # Seg 5: 128.0s -> 128000ms (duration ~28.2s, ends at ~156.2s)
    # Outro screen holds with gentle music until 168.0s (02:48)
    
    cmd = [
        "C:\\ffmpeg\\bin\\ffmpeg.exe", "-y",
        "-i", "demo_assets/audio/seg1.mp3",
        "-i", "demo_assets/audio/seg2.mp3",
        "-i", "demo_assets/audio/seg3.mp3",
        "-i", "demo_assets/audio/seg4.mp3",
        "-i", "demo_assets/audio/seg5.mp3",
        "-i", "demo_assets/audio/bgm_ambient.wav",
        "-filter_complex",
        "[0:a]adelay=500|500,volume=1.05[a1];"
        "[1:a]adelay=28000|28000,volume=1.05[a2];"
        "[2:a]adelay=55000|55000,volume=1.05[a3];"
        "[3:a]adelay=98000|98000,volume=1.05[a4];"
        "[4:a]adelay=128000|128000,volume=1.05[a5];"
        "[a1][a2][a3][a4][a5]amix=inputs=5:duration=longest:dropout_transition=0[voice];"
        "[5:a]volume=0.13,afade=t=in:ss=0:d=3,afade=t=out:st=164:d=4[bgm];"
        "[voice][bgm]amix=inputs=2:duration=longest:dropout_transition=0,alimiter=limit=0.95[out]",
        "-map", "[out]",
        "-t", "168",
        "-c:a", "aac",
        "-b:a", "192k",
        "demo_assets/output/master_audio.m4a"
    ]
    
    print("Running ffmpeg audio mix for 168s (02:48)...")
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode == 0:
        print("Master audio mixed successfully: demo_assets/output/master_audio.m4a")
    else:
        print("Error mixing audio:", res.stderr)

if __name__ == "__main__":
    build_audio()
