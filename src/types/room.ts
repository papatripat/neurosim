export type AudioRadius = 'close' | 'medium' | 'room';

export interface OfficeRoom {
  id: string;
  code: string; // e.g. "NEURO-HQ-88"
  name: string; // e.g. "Kantor Pusat NeuroSim"
  description: string;
  hostName: string;
  isPrivate: boolean;
  passcode?: string;
  capacity: number; // Max members allowed
  activeCount: number; // Currently connected members
  proximityAudio: boolean; // Spatial audio based on avatar distance (Proximity chat)
  audioRadius: AudioRadius;
  tags: string[];
  createdAt: string;
}

export interface CreateRoomInput {
  name: string;
  code?: string;
  description?: string;
  isPrivate: boolean;
  passcode?: string;
  capacity: number;
  proximityAudio: boolean;
  audioRadius: AudioRadius;
}

