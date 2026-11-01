import { UserStatus } from '../components/gather/GatherDock';
import { CharacterCustomization } from './character';

export interface PlayerMediaState {
  isCamOn: boolean;
  isMicOn: boolean;
  isScreenSharing: boolean;
  isSpeaking: boolean;
}

export interface PlayerPresence {
  socketId: string;
  userId?: number;
  username: string;
  fullName: string;
  role: string;
  avatar: string;
  archetype: string;
  characterConfig?: CharacterCustomization;
  roomId: string;
  x: number;
  y: number;
  direction: 'north' | 'south' | 'east' | 'west';
  anim?: string;
  isMoving?: boolean;
  isSitting?: boolean;
  status: UserStatus;
  zone: string;
  lastSeen?: number;
  mediaState?: PlayerMediaState;
}

export interface PlayerMovementPacket {
  socketId?: string;
  x: number;
  y: number;
  direction: 'north' | 'south' | 'east' | 'west';
  anim: string;
  isMoving: boolean;
  isSitting?: boolean;
  zone: string;
}

export interface PlayerChatPacket {
  id: string;
  socketId: string;
  sender: string;
  text: string;
  time: string;
  userAvatar?: string;
}

export interface PlayerReactionPacket {
  socketId: string;
  emoji: string;
}

export interface PlayerMediaStatePacket {
  socketId: string;
  mediaState: PlayerMediaState;
}

export interface WebRTCSignalPacket {
  targetSocketId: string;
  senderSocketId?: string;
  signal: any;
}

export interface JoinRoomPayload {
  roomId: string;
  user: {
    id?: number;
    username: string;
    fullName: string;
    role?: string;
    avatar?: string;
  };
  characterConfig?: CharacterCustomization;
  spawnCoords?: { x: number; y: number };
  mediaState?: PlayerMediaState;
}
