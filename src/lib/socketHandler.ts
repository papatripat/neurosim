import { Server as SocketIOServer, Socket } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import { PlayerPresence, PlayerMovementPacket, PlayerChatPacket, JoinRoomPayload } from '../types/multiplayer';
import { UserStatus } from '../components/gather/GatherDock';

// In-Memory Room Registry: roomId -> Map<socketId, PlayerPresence>
const rooms = new Map<string, Map<string, PlayerPresence>>();

export function setupRealtimeSocketIO(httpServer: HTTPServer): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket: Socket) => {
    let currentRoomId = '';
    let playerData: PlayerPresence | null = null;

    socket.on('c:join_room', (payload: JoinRoomPayload) => {
      if (currentRoomId) {
        socket.leave(currentRoomId);
        rooms.get(currentRoomId)?.delete(socket.id);
        socket.to(currentRoomId).emit('s:player_left', { socketId: socket.id });
      }

      currentRoomId = (payload && payload.roomId) ? payload.roomId : 'NEURO-HQ-88';
      socket.join(currentRoomId);

      if (!rooms.has(currentRoomId)) {
        rooms.set(currentRoomId, new Map());
      }
      const roomPlayers = rooms.get(currentRoomId)!;

      const user = (payload && payload.user) || { username: 'Pengunjung', fullName: 'Pengunjung Kantor' };
      const spawnCoords = (payload && payload.spawnCoords) || { x: 1687, y: 880 };

      playerData = {
        socketId: socket.id,
        userId: user.id,
        username: user.username || 'Pengunjung',
        fullName: user.fullName || 'Pengunjung Kantor',
        role: user.role || 'Staff Pengembang',
        avatar: user.avatar || '/assets/characters/resident/standing/south.png',
        archetype: (payload && payload.characterConfig && payload.characterConfig.archetype) || 'resident',
        characterConfig: payload && payload.characterConfig,
        roomId: currentRoomId,
        x: spawnCoords.x,
        y: spawnCoords.y,
        direction: 'south',
        status: 'available',
        zone: 'Workstation Utama',
        lastSeen: Date.now(),
      };

      roomPlayers.set(socket.id, playerData);

      // 1. Kirim state semua pemain yang ada di ruangan ini ke pemain baru
      const existingPlayers = Array.from(roomPlayers.values());
      socket.emit('s:room_state', { roomId: currentRoomId, players: existingPlayers });

      // 2. Beritahu pemain lain di ruangan yang sama bahwa ada pemain baru bergabung
      socket.to(currentRoomId).emit('s:player_joined', playerData);
      console.log(`[Socket.IO] ${playerData.fullName} (@${playerData.username}) bergabung ke room: ${currentRoomId} (${roomPlayers.size} pemain)`);
    });

    socket.on('c:move', (data: PlayerMovementPacket) => {
      if (!currentRoomId || !playerData || !data) return;
      playerData.x = data.x;
      playerData.y = data.y;
      playerData.direction = data.direction;
      playerData.anim = data.anim;
      playerData.isMoving = Boolean(data.isMoving);
      playerData.isSitting = Boolean(data.isSitting);
      if (data.zone) playerData.zone = data.zone;
      playerData.lastSeen = Date.now();

      socket.to(currentRoomId).emit('s:player_moved', {
        socketId: socket.id,
        x: data.x,
        y: data.y,
        direction: data.direction,
        anim: data.anim,
        isMoving: playerData.isMoving,
        isSitting: playerData.isSitting,
        zone: playerData.zone,
      });
    });

    socket.on('c:status', (data: { status: UserStatus }) => {
      if (!currentRoomId || !playerData || !data) return;
      playerData.status = data.status;
      socket.to(currentRoomId).emit('s:player_status', {
        socketId: socket.id,
        status: data.status,
      });
    });

    socket.on('c:chat', (data: { text: string }) => {
      if (!currentRoomId || !playerData || !data || !data.text || !data.text.trim()) return;
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const packet: PlayerChatPacket = {
        id: `chat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        socketId: socket.id,
        sender: playerData.fullName.split(' ')[0] || playerData.username,
        text: data.text.trim(),
        time: timeStr,
        userAvatar: playerData.avatar,
      };
      io.to(currentRoomId).emit('s:chat_message', packet);
    });

    socket.on('c:reaction', (data: { emoji: string }) => {
      if (!currentRoomId || !data || !data.emoji) return;
      io.to(currentRoomId).emit('s:reaction_triggered', {
        socketId: socket.id,
        emoji: data.emoji,
      });
    });

    socket.on('disconnect', () => {
      if (currentRoomId && rooms.has(currentRoomId)) {
        const roomPlayers = rooms.get(currentRoomId)!;
        roomPlayers.delete(socket.id);
        socket.to(currentRoomId).emit('s:player_left', { socketId: socket.id });
        console.log(`[Socket.IO] Socket ${socket.id} keluar dari room: ${currentRoomId} (${roomPlayers.size} tersisa)`);
        if (roomPlayers.size === 0) {
          rooms.delete(currentRoomId);
        }
      }
    });
  });

  return io;
}
