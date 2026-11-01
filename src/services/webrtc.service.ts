/**
 * WebRTC Service — P2P Mesh Video & Audio Engine
 * Supports Google Meet style camera streaming, microphone voice detection,
 * speaking animation detection (audio meter), and automatic SSL context checking.
 */
import { multiplayerService } from './multiplayer.service';

export interface WebRTCStreamEvent {
  socketId: string;
  stream: MediaStream;
}

export type StreamCallback = (e: WebRTCStreamEvent) => void;
export type StreamRemovedCallback = (socketId: string) => void;
export type SpeakingCallback = (isSpeaking: boolean) => void;

class WebRTCService {
  private localStream: MediaStream | null = null;
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private remoteStreams: Map<string, MediaStream> = new Map();
  private streamListeners: Set<StreamCallback> = new Set();
  private streamRemovedListeners: Set<StreamRemovedCallback> = new Set();
  private speakingListeners: Set<SpeakingCallback> = new Set();

  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private voiceCheckTimer: number | null = null;
  private isSpeaking: boolean = false;
  private unsubSignal: (() => void) | null = null;

  private readonly iceServers: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ];

  constructor() {
    this.setupSignalListener();
  }

  private setupSignalListener(): void {
    if (this.unsubSignal) this.unsubSignal();
    this.unsubSignal = multiplayerService.onWebRTCSignal((data) => {
      this.handleIncomingSignal(data.senderSocketId, data.signal);
    });
  }

  /**
   * Cek apakah konteks peramban aman (HTTPS atau localhost)
   * Penting: navigator.mediaDevices.getUserMedia WAJIB berjalan di Secure Context
   */
  public isSecureContext(): boolean {
    if (typeof window === 'undefined') return false;
    return Boolean(window.isSecureContext || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  }

  public isMediaDevicesSupported(): boolean {
    return typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia);
  }

  /**
   * Mengambil MediaStream lokal (Kamera & Mikrofon)
   */
  public async getOrCreateLocalStream(enableVideo = true, enableAudio = true): Promise<MediaStream> {
    if (!this.isSecureContext() && !this.isMediaDevicesSupported()) {
      throw new Error('SECURE_CONTEXT_REQUIRED');
    }

    if (this.localStream) {
      // Perbarui track aktif
      this.localStream.getVideoTracks().forEach((t) => (t.enabled = enableVideo));
      this.localStream.getAudioTracks().forEach((t) => (t.enabled = enableAudio));
      return this.localStream;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: enableVideo
          ? {
              width: { ideal: 640 },
              height: { ideal: 480 },
              facingMode: 'user',
              frameRate: { ideal: 24, max: 30 },
            }
          : false,
        audio: enableAudio
          ? {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            }
          : false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.localStream = stream;

      // Pastikan audio/video diset sesuai preferensi
      stream.getVideoTracks().forEach((t) => (t.enabled = enableVideo));
      stream.getAudioTracks().forEach((t) => (t.enabled = enableAudio));

      if (enableAudio) {
        this.initVoiceActivityDetection(stream);
      }

      // Pasang track lokal ke semua peer yang sudah ada
      for (const [targetSocketId, pc] of this.peerConnections.entries()) {
        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });
        this.renegotiatePeer(targetSocketId, pc);
      }

      return stream;
    } catch (err: any) {
      console.warn('[WebRTCService] Gagal mendapatkan akses media:', err);
      throw err;
    }
  }

  public getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  public setVideoEnabled(enabled: boolean): void {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach((t) => (t.enabled = enabled));
    }
  }

  public setAudioEnabled(enabled: boolean): void {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((t) => (t.enabled = enabled));
    }
    if (!enabled && this.isSpeaking) {
      this.isSpeaking = false;
      this.emitSpeaking(false);
    }
  }

  public stopLocalStream(): void {
    if (this.voiceCheckTimer) {
      clearInterval(this.voiceCheckTimer);
      this.voiceCheckTimer = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        this.audioContext.close();
      } catch {
        // ignore
      }
      this.audioContext = null;
      this.analyser = null;
    }
    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => t.stop());
      this.localStream = null;
    }
    this.isSpeaking = false;
    this.emitSpeaking(false);
  }

  /**
   * Deteksi suara aktif (Voice Activity Detection / Speaking indicator)
   * Menampilkan cincin hijau Google Meet saat pengguna berbicara
   */
  private initVoiceActivityDetection(stream: MediaStream): void {
    try {
      const audioTrack = stream.getAudioTracks()[0];
      if (!audioTrack) return;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      this.audioContext = new AudioContextClass();
      const source = this.audioContext.createMediaStreamSource(stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.3;
      source.connect(this.analyser);

      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      let silenceCount = 0;

      this.voiceCheckTimer = window.setInterval(() => {
        if (!this.analyser || !this.localStream) return;
        const micTrack = this.localStream.getAudioTracks()[0];
        if (!micTrack || !micTrack.enabled) {
          if (this.isSpeaking) {
            this.isSpeaking = false;
            this.emitSpeaking(false);
          }
          return;
        }

        this.analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;

        // Threshold bicara normal
        const speakingNow = average > 14;

        if (speakingNow) {
          silenceCount = 0;
          if (!this.isSpeaking) {
            this.isSpeaking = true;
            this.emitSpeaking(true);
          }
        } else {
          silenceCount++;
          if (silenceCount > 6 && this.isSpeaking) {
            this.isSpeaking = false;
            this.emitSpeaking(false);
          }
        }
      }, 100);
    } catch (e) {
      console.warn('[WebRTCService] Voice detection unavailable:', e);
    }
  }

  private emitSpeaking(speaking: boolean): void {
    multiplayerService.sendMediaState({ isSpeaking: speaking });
    for (const l of this.speakingListeners) {
      l(speaking);
    }
  }

  public onSpeakingChange(cb: SpeakingCallback): () => void {
    this.speakingListeners.add(cb);
    return () => {
      this.speakingListeners.delete(cb);
    };
  }

  public onStream(cb: StreamCallback): () => void {
    this.streamListeners.add(cb);
    // Kirim stream yang sudah aktif ke listener baru
    for (const [socketId, stream] of this.remoteStreams.entries()) {
      cb({ socketId, stream });
    }
    return () => {
      this.streamListeners.delete(cb);
    };
  }

  public onStreamRemoved(cb: StreamRemovedCallback): () => void {
    this.streamRemovedListeners.add(cb);
    return () => {
      this.streamRemovedListeners.delete(cb);
    };
  }

  public getRemoteStream(socketId: string): MediaStream | undefined {
    return this.remoteStreams.get(socketId);
  }

  /**
   * Hubungkan ke peer tertentu (kirim offer jika kita yang memulai)
   */
  public async connectToPeer(targetSocketId: string, isInitiator = false): Promise<RTCPeerConnection> {
    if (this.peerConnections.has(targetSocketId)) {
      return this.peerConnections.get(targetSocketId)!;
    }

    const pc = new RTCPeerConnection({
      iceServers: this.iceServers,
    });
    this.peerConnections.set(targetSocketId, pc);

    // Kirim kandidat ICE ke target melalui Socket.io
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        multiplayerService.sendWebRTCSignal({
          targetSocketId,
          signal: {
            type: 'candidate',
            candidate: event.candidate,
          },
        });
      }
    };

    // Terima track media remote
    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      if (remoteStream) {
        this.remoteStreams.set(targetSocketId, remoteStream);
        for (const l of this.streamListeners) {
          l({ socketId: targetSocketId, stream: remoteStream });
        }
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        this.removePeer(targetSocketId);
      }
    };

    // Tambahkan track lokal jika sudah ada
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.localStream!);
      });
    }

    if (isInitiator) {
      await this.renegotiatePeer(targetSocketId, pc);
    }

    return pc;
  }

  private async renegotiatePeer(targetSocketId: string, pc: RTCPeerConnection): Promise<void> {
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      multiplayerService.sendWebRTCSignal({
        targetSocketId,
        signal: {
          type: 'offer',
          sdp: offer,
        },
      });
    } catch (err) {
      console.warn('[WebRTCService] Gagal membuat offer ke', targetSocketId, err);
    }
  }

  /**
   * Memproses sinyal masuk (Offer, Answer, atau ICE Candidate)
   */
  private async handleIncomingSignal(senderSocketId: string, signal: any): Promise<void> {
    if (!signal) return;

    try {
      if (signal.type === 'offer') {
        let pc = this.peerConnections.get(senderSocketId);
        if (!pc) {
          pc = await this.connectToPeer(senderSocketId, false);
        }
        await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        multiplayerService.sendWebRTCSignal({
          targetSocketId: senderSocketId,
          signal: {
            type: 'answer',
            sdp: answer,
          },
        });
      } else if (signal.type === 'answer') {
        const pc = this.peerConnections.get(senderSocketId);
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        }
      } else if (signal.type === 'candidate' && signal.candidate) {
        const pc = this.peerConnections.get(senderSocketId);
        if (pc) {
          await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
        }
      }
    } catch (e) {
      console.warn('[WebRTCService] Error processing incoming signal from', senderSocketId, e);
    }
  }

  public removePeer(socketId: string): void {
    const pc = this.peerConnections.get(socketId);
    if (pc) {
      pc.close();
      this.peerConnections.delete(socketId);
    }
    if (this.remoteStreams.has(socketId)) {
      this.remoteStreams.delete(socketId);
      for (const l of this.streamRemovedListeners) {
        l(socketId);
      }
    }
  }

  public cleanup(): void {
    this.stopLocalStream();
    for (const [id] of this.peerConnections) {
      this.removePeer(id);
    }
    this.peerConnections.clear();
    this.remoteStreams.clear();
  }
}

export const webrtcService = new WebRTCService();
