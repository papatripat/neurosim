import os
import subprocess
import glob

def compile_video():
    raw_dir = "demo_assets/raw_video"
    out_dir = "demo_assets/output"
    public_dir = "public/demo"
    os.makedirs(out_dir, exist_ok=True)
    os.makedirs(public_dir, exist_ok=True)
    
    # Find latest webm file
    webm_files = sorted(glob.glob(os.path.join(raw_dir, "*.webm")), key=os.path.getmtime)
    if not webm_files:
        print("No raw recording found in", raw_dir)
        return
        
    raw_video = webm_files[-1]
    master_audio = "demo_assets/output/master_audio.m4a"
    out_mp4 = os.path.join(out_dir, "neurosim_demo_inception2026.mp4")
    public_mp4 = os.path.join(public_dir, "neurosim_demo_inception2026.mp4")
    
    print(f"Compiling raw video {raw_video} with {master_audio}...")
    
    cmd = [
        "C:\\ffmpeg\\bin\\ffmpeg.exe", "-y",
        "-i", raw_video,
        "-i", master_audio,
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-r", "60",
        "-crf", "18",
        "-preset", "faster",
        "-c:a", "aac",
        "-b:a", "192k",
        "-shortest",
        out_mp4
    ]
    
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode == 0:
        print("Video rendered successfully:", out_mp4)
        # Also copy to public directory for direct browser viewing / downloading
        import shutil
        shutil.copy2(out_mp4, public_mp4)
        print("Copied to public folder for web preview:", public_mp4)
    else:
        print("Error compiling video:", res.stderr)

if __name__ == "__main__":
    compile_video()

