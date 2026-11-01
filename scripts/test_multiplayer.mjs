import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  transports: ['websocket', 'polling'],
});

socket.on('connect', () => {
  console.log('[TestClient] Connected to server. Socket ID:', socket.id);

  // 1. Join room
  socket.emit('c:join_room', {
    roomId: 'NEURO-HQ-88',
    user: {
      username: 'Rifat_Bot',
      fullName: 'Rifat AI Partner',
      role: 'AI Architecture Lead',
      avatar: '/assets/characters/resident/standing/south.png',
    },
    characterConfig: {
      archetype: 'office-worker',
    },
    spawnCoords: { x: 1750, y: 840 },
  });

  // 2. Wait 1s then move
  setTimeout(() => {
    console.log('[TestClient] Sending movement...');
    socket.emit('c:move', {
      x: 1790,
      y: 840,
      direction: 'east',
      anim: 'char-office-worker-walk-east',
      isMoving: true,
      zone: 'Workstation Utama',
    });

    setTimeout(() => {
      // 3. Send sitting state (duduk di sofa/kursi breakout)
      console.log('[TestClient] Sending sitting state (isSitting: true)...');
      socket.emit('c:move', {
        x: 1790,
        y: 840,
        direction: 'south',
        anim: 'char-office-worker-sit-south',
        isMoving: false,
        isSitting: true,
        zone: 'Workstation Utama',
      });

      // 4. Send chat message
      console.log('[TestClient] Sending chat message...');
      socket.emit('c:chat', {
        text: 'Halo tim! Arsitektur multiplayer realtime dan sistem duduk online sukses aktif!',
      });

      // 5. Send reaction
      console.log('[TestClient] Sending emoji reaction...');
      socket.emit('c:reaction', {
        emoji: '🔥',
      });
    }, 1200);
  }, 1000);
});

socket.on('s:chat_message', (msg) => {
  console.log('[TestClient] Received chat:', msg.sender, ':', msg.text);
});

socket.on('s:player_joined', (p) => {
  console.log('[TestClient] Player joined room:', p.fullName, '(@' + p.username + ')');
});

// Keep connection open for 20 seconds
setTimeout(() => {
  console.log('[TestClient] Disconnecting test client...');
  socket.disconnect();
  process.exit(0);
}, 20000);
