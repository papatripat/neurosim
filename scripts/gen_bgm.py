import math
import struct
import wave
import os

def generate_lofi_bgm(output_path="demo_assets/audio/bgm_ambient.wav", duration=175.0, sample_rate=44100):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    num_samples = int(duration * sample_rate)
    
    # Chord progression: Dm9 -> G13 -> Cmaj9 -> Am9 (Warm, calm, thoughtful lofi progression)
    # Frequencies in Hz:
    chords = [
        # Dm9: D3, F3, A3, C4, E4
        [146.83, 174.61, 220.00, 261.63, 329.63],
        # G13 / G9: G2, B2, F3, A3, E4
        [98.00, 123.47, 174.61, 220.00, 329.63],
        # Cmaj9: C3, E3, G3, B3, D4
        [130.81, 164.81, 196.00, 246.94, 293.66],
        # Am9: A2, C3, E3, G3, B3
        [110.00, 130.81, 164.81, 196.00, 246.94]
    ]
    chord_len = 4.0 # 4 seconds per chord -> 16 seconds loop
    
    with wave.open(output_path, 'w') as wav:
        wav.setnchannels(2) # Stereo
        wav.setsampwidth(2) # 16-bit
        wav.setframerate(sample_rate)
        
        frames = bytearray()
        
        for i in range(num_samples):
            t = i / sample_rate
            cycle_t = t % 16.0
            chord_idx = int(cycle_t / chord_len) % 4
            chord_t = cycle_t % chord_len
            current_chord = chords[chord_idx]
            
            # Gentle envelope for piano/pad: fast attack, slow exponential decay with warm sustain
            env = math.exp(-chord_t * 0.45) * 0.7 + 0.15
            
            # Synthesize chord tones (soft sine with 2nd & 3rd harmonic for warm electric piano feel)
            left_val = 0.0
            right_val = 0.0
            
            for note_idx, freq in enumerate(current_chord):
                # Detune slightly for stereo warmth
                f_left = freq * 0.999
                f_right = freq * 1.001
                
                # Primary fundamental + warm harmonics
                v_l = math.sin(2 * math.pi * f_left * t) * 0.6 + \
                      math.sin(2 * math.pi * f_left * 2 * t) * 0.2 + \
                      math.sin(2 * math.pi * f_left * 3 * t) * 0.05
                      
                v_r = math.sin(2 * math.pi * f_right * t) * 0.6 + \
                      math.sin(2 * math.pi * f_right * 2 * t) * 0.2 + \
                      math.sin(2 * math.pi * f_right * 3 * t) * 0.05
                      
                pan = (note_idx / (len(current_chord) - 1)) * 0.4 + 0.3 # 0.3 to 0.7 pan
                left_val += v_l * (1.0 - pan)
                right_val += v_r * pan
                
            left_val = left_val * env * 0.15
            right_val = right_val * env * 0.15
            
            # Master fade in / fade out
            if t < 2.0:
                left_val *= (t / 2.0)
                right_val *= (t / 2.0)
            elif t > duration - 3.0:
                left_val *= ((duration - t) / 3.0)
                right_val *= ((duration - t) / 3.0)
                
            # Clamp to 16-bit
            l_sample = max(-32767, min(32767, int(left_val * 32767)))
            r_sample = max(-32767, min(32767, int(right_val * 32767)))
            
            frames.extend(struct.pack('<hh', l_sample, r_sample))
            
            if len(frames) >= 65536:
                wav.writeframes(frames)
                frames = bytearray()
                
        if len(frames) > 0:
            wav.writeframes(frames)
            
    print(f"Generated BGM: {output_path} ({duration}s)")

if __name__ == "__main__":
    generate_lofi_bgm()
