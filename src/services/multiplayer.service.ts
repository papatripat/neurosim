import { io, Socket } from 'socket.io-client';
import { EventBus, GAME_EVENTS } from '../game/EventBus';
import {
  PlayerPresence,
  PlayerMovementPacket,
  PlayerChatPacket,
  PlayerReactionPacket,
  JoinRoomPayload,
  PlayerMediaState,
  PlayerMediaStatePacket,
  WebRTCSignalPacket,
} from '../types/multiplayer';
import { UserStatus } from '../components/gather/GatherDock';

export type WebRTCSignalHandler = (data: { senderSocketId: string; signal: any }) => void;

class MultiplayerService {
  private socket: Socket | null = null;
  private currentRoomId: string = '';
  private currentSocketId: string = '';
  private isConnected: boolean = false;
  private onlinePlayers: Map<string, PlayerPresence> = new Map();
  private lastMoveSentTime: number = 0;
  private readonly MOVE_THROTTLE_MS = 40; // 25 fps network update
  private activeServerUrl: string = '';
  private lastJoinPayload: JoinRoomPayload | null = null;
  private signalHandlers: Set<WebRTCSignalHandler> = new Set();
  private currentMediaState: PlayerMediaState = {
    isCamOn: false,
    isMicOn: false,
    isScreenSharing: false,
    isSpeaking: false,
  };

  public connect(url?: string): Socket {
    if (this.socket && this.isConnected && (!url || url === this.activeServerUrl)) {
      return this.socket;
    }

    // Prioritas URL:
    // 1. Parameter eksplisit
    // 2. Custom socket URL dari localStorage (pengaturan pengguna di UI)
    // 3. VITE_SOCKET_URL dari environment variable
    // 4. window.location.origin (default lokal)
    const customUrl = typeof window !== 'undefined' ? localStorage.getItem('neurosim_socket_url') : null;
    const serverUrl = url || customUrl || (typeof window !== 'undefined' ? (import.meta.env.VITE_SOCKET_URL || window.location.origin) : '');

    this.activeServerUrl = serverUrl;

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 8000,
    });

    this.setupListeners();
    return this.socket;
  }

  public reconnect(newUrl?: string): void {
    if (newUrl) {
      this.activeServerUrl = newUrl;
      if (typeof window !== 'undefined') {
        localStorage.setItem('neurosim_socket_url', newUrl);
      }
    }
    this.connect(this.activeServerUrl);
  }

  public isSocketConnected(): boolean {
    return this.isConnected;
  }

  public getServerUrl(): string {
    return this.activeServerUrl;
  }

  public onWebRTCSignal(handler: WebRTCSignalHandler): () => void {
    this.signalHandlers.add(handler);
    return () => {
      this.signalHandlers.delete(handler);
    };
  }

  private setupListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.isConnected = true;
      this.currentSocketId = this.socket?.id || '';
      console.log(`[Multiplayer] Terhubung ke server realtime (${this.activeServerUrl}). Socket ID: ${this.currentSocketId}`);
      EventBus.emit(GAME_EVENTS.REALTIME_CONNECTION_STATUS, { isConnected: true, serverUrl: this.activeServerUrl });

      // Jika sebelumnya sudah ada room yang ingin digabung, kirim join ulang
      if (this.lastJoinPayload) {
        this.socket?.emit('c:join_room', {
          ...this.lastJoinPayload,
          mediaState: this.currentMediaState,
        });
      }
    });

    this.socket.on('connect_error', (err: any) => {
      this.isConnected = false;
      console.warn(`[Multiplayer] Tidak dapat terhubung ke server realtime (${this.activeServerUrl}): ${err.message}`);
      EventBus.emit(GAME_EVENTS.REALTIME_CONNECTION_STATUS, { isConnected: false, error: err.message, serverUrl: this.activeServerUrl });
    });

    this.socket.on('disconnect', (reason: any) => {
      this.isConnected = false;
      this.onlinePlayers.clear();
      EventBus.emit(GAME_EVENTS.ONLINE_PLAYERS_UPDATED, []);
      EventBus.emit(GAME_EVENTS.REALTIME_CONNECTION_STATUS, { isConnected: false, reason, serverUrl: this.activeServerUrl });
      console.log(`[Multiplayer] Terputus dari server: ${reason}`);
    });

    // 1. Menerima daftar seluruh pemain yang sedang ada di dalam room
    this.socket.on('s:room_state', (data: { roomId: string; players: PlayerPresence[] }) => {
      this.onlinePlayers.clear();
      for (const p of data.players) {
        if (p.socketId !== this.currentSocketId) {
          this.onlinePlayers.set(p.socketId, p);
          // Beritahu Phaser untuk spawn remote player
          EventBus.emit(GAME_EVENTS.REMOTE_PLAYER_JOINED, p);
        }
      }
      this.broadcastOnlinePlayersList();
    });

    // 2. Pemain baru masuk ke room
    this.socket.on('s:player_joined', (player: PlayerPresence) => {
      if (player.socketId === this.currentSocketId) return;
      this.onlinePlayers.set(player.socketId, player);
      EventBus.emit(GAME_EVENTS.REMOTE_PLAYER_JOINED, player);
      this.broadcastOnlinePlayersList();
    });

    // 3. Pemain lain bergerak
    this.socket.on('s:player_moved', (data: PlayerMovementPacket) => {
      if (!data.socketId || data.socketId === this.currentSocketId) return;
      const existing = this.onlinePlayers.get(data.socketId);
      if (existing) {
        existing.x = data.x;
        existing.y = data.y;
        existing.direction = data.direction;
        existing.anim = data.anim;
        existing.isMoving = data.isMoving;
        existing.isSitting = data.isSitting;
        if (data.zone) existing.zone = data.zone;
      }
      EventBus.emit(GAME_EVENTS.REMOTE_PLAYER_MOVED, data);
    });

    // 4. Status ketersediaan pemain lain berubah
    this.socket.on('s:player_status', (data: { socketId: string; status: UserStatus }) => {
      const existing = this.onlinePlayers.get(data.socketId);
      if (existing) {
        existing.status = data.status;
      }
      EventBus.emit(GAME_EVENTS.REMOTE_PLAYER_STATUS, data);
      this.broadcastOnlinePlayersList();
    });

    // 5. Pesan obrolan kantor diterima
    this.socket.on('s:chat_message', (packet: PlayerChatPacket) => {
      EventBus.emit(GAME_EVENTS.REMOTE_CHAT_RECEIVED, packet);
      // Jika dari pemain lain, buat balon kata 2D di atas kepalanya
      if (packet.socketId !== this.currentSocketId) {
        EventBus.emit(GAME_EVENTS.TRIGGER_CHAT_BUBBLE, {
          text: packet.text,
          socketId: packet.socketId,
        });
      }
    });

    // 6. Reaksi emoji diterima
    this.socket.on('s:reaction_triggered', (packet: PlayerReactionPacket) => {
      EventBus.emit(GAME_EVENTS.REMOTE_REACTION_RECEIVED, packet);
      // Jika dari pemain lain, buat emoji melayang di atas kepalanya
      if (packet.socketId !== this.currentSocketId) {
        EventBus.emit(GAME_EVENTS.TRIGGER_REACTION, {
          emoji: packet.emoji,
          socketId: packet.socketId,
        });
      }
    });

    // 7. Status media (Kamera, Mic, Speaking, Screen Share) pemain lain berubah
    this.socket.on('s:media_state', (packet: PlayerMediaStatePacket) => {
      if (!packet.socketId || packet.socketId === this.currentSocketId) return;
      const existing = this.onlinePlayers.get(packet.socketId);
      if (existing) {
        existing.mediaState = packet.mediaState;
      }
      EventBus.emit(GAME_EVENTS.REMOTE_MEDIA_CHANGED, packet);
      this.broadcastOnlinePlayersList();
    });

    // 8. Sinyal WebRTC masuk dari pemain lain
    this.socket.on('s:webrtc_signal', (data: { senderSocketId: string; signal: any }) => {
      if (!data || !data.senderSocketId) return;
      for (const handler of this.signalHandlers) {
        try {
          handler(data);
        } catch (e) {
          console.warn('[Multiplayer] Error in WebRTC signal handler:', e);
        }
      }
    });

    // 9. Pemain lain keluar dari room
    this.socket.on('s:player_left', (data: { socketId: string }) => {
      this.onlinePlayers.delete(data.socketId);
      EventBus.emit(GAME_EVENTS.REMOTE_PLAYER_LEFT, data);
      this.broadcastOnlinePlayersList();
    });
  }

  private broadcastOnlinePlayersList(): void {
    const list = Array.from(this.onlinePlayers.values());
    EventBus.emit(GAME_EVENTS.ONLINE_PLAYERS_UPDATED, list);
  }

  public joinRoom(payload: JoinRoomPayload): void {
    this.lastJoinPayload = payload;
    this.currentRoomId = payload.roomId;
    if (!this.socket) {
      this.connect();
    } else if (this.isConnected) {
      this.socket.emit('c:join_room', {
        ...payload,
        mediaState: this.currentMediaState,
      });
    }
  }

  public sendMovement(data: PlayerMovementPacket): void {
    if (!this.socket || !this.isConnected || !this.currentRoomId) return;

    const now = Date.now();
    // Throttle pergerakan kecuali jika berhenti (isMoving: false) atau sedang transisi duduk/berdiri
    if (data.isMoving && !data.isSitting && now - this.lastMoveSentTime < this.MOVE_THROTTLE_MS) {
      return;
    }

    this.lastMoveSentTime = now;
    this.socket.emit('c:move', data);
  }

  public sendStatus(status: UserStatus): void {
    if (!this.socket || !this.isConnected) return;
    this.socket.emit('c:status', { status });
  }

  public sendChat(text: string): void {
    if (!this.socket || !this.isConnected || !text.trim()) return;
    this.socket.emit('c:chat', { text: text.trim() });
  }

  public sendReaction(emoji: string): void {
    if (!this.socket || !this.isConnected || !emoji) return;
    this.socket.emit('c:reaction', { emoji });
  }

  public sendMediaState(mediaState: Partial<PlayerMediaState>): void {
    this.currentMediaState = {
      ...this.currentMediaState,
      ...mediaState,
    };
    EventBus.emit(GAME_EVENTS.LOCAL_MEDIA_CHANGED, this.currentMediaState);
    if (!this.socket || !this.isConnected) return;
    this.socket.emit('c:media_state', { mediaState: this.currentMediaState });
  }

  public sendWebRTCSignal(packet: WebRTCSignalPacket): void {
    if (!this.socket || !this.isConnected) return;
    this.socket.emit('c:webrtc_signal', packet);
  }

  public getCurrentMediaState(): PlayerMediaState {
    return this.currentMediaState;
  }

  public leaveRoom(): void {
    if (!this.socket || !this.currentRoomId) return;
    this.socket.emit('c:leave_room', { roomId: this.currentRoomId });
    this.currentRoomId = '';
    this.onlinePlayers.clear();
    EventBus.emit(GAME_EVENTS.ONLINE_PLAYERS_UPDATED, []);
  }

  public getOnlinePlayers(): PlayerPresence[] {
    return Array.from(this.onlinePlayers.values());
  }

  public getSocketId(): string {
    return this.currentSocketId;
  }
}

export const multiplayerService = new MultiplayerService();
