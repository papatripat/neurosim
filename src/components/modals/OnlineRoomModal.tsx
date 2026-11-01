import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Building2,
  Users,
  Copy,
  Check,
  Plus,
  LogIn,
  Share2,
  Lock,
  Unlock,
  Radio,
  Volume2,
  Sparkles,
  Search,
  UserPlus,
} from 'lucide-react';
import { OfficeRoom, CreateRoomInput, AudioRadius } from '../../types/room';
import { Participant } from '../gather/ParticipantsDrawer';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentRoom: OfficeRoom;
  availableRooms: OfficeRoom[];
  onJoinRoom: (roomCode: string, passcode?: string) => { success: boolean; message?: string };
  onCreateRoom: (input: CreateRoomInput) => void;
  userName?: string;
  userRole?: string;
  userAvatar?: string;
  participants?: Participant[];
}

type TabType = 'current' | 'join' | 'create';

const generateOfficialRoomCode = (): string => {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `NEURO-${num}`;
};

// Opsi 2 (Sesi Mandiri / Live Sesi): Hanya menampilkan akun yang sedang aktif di peramban
export const getRoomColleagues = (
  _roomCode: string,
  userName: string,
  _allParticipants?: Participant[],
  userRole?: string,
  userAvatar?: string
): Participant[] => {
  const selfParticipant: Participant = {
    id: 'user-self',
    name: userName || 'Baginda Putra Krista',
    role: userRole || 'Frontend UI/UX & Aksesibilitas',
    zone: 'Workstation Utama',
    status: 'online',
    isNPC: false,
    portrait: userAvatar || '/assets/characters/resident/standing/south.png',
  };

  return [selfParticipant];
};

export const OnlineRoomModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentRoom,
  availableRooms,
  onJoinRoom,
  onCreateRoom,
  userName = 'Baginda Putra Krista',
  userRole,
  userAvatar,
  participants,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('current');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Search filter for room directory
  const [searchQuery, setSearchQuery] = useState('');

  // Join Room State
  const [inputCode, setInputCode] = useState('');
  const [inputPasscode, setInputPasscode] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);

  // Create Room State
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomCode, setNewRoomCode] = useState(() => generateOfficialRoomCode());
  const [newRoomDesc, setNewRoomDesc] = useState('');
  const [newRoomCapacity, setNewRoomCapacity] = useState(25);
  const [newRoomPrivate, setNewRoomPrivate] = useState(false);
  const [newRoomPasscode, setNewRoomPasscode] = useState('');
  const [newRoomProximity, setNewRoomProximity] = useState(true);
  const [newRoomRadius, setNewRoomRadius] = useState<AudioRadius>('medium');

  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const activeRoom: OfficeRoom = currentRoom || {
    id: 'default',
    code: 'NEURO-HQ-88',
    name: 'Kantor Pusat NeuroSim (Ruang Kerja Utama)',
    description: 'Ruang kerja kolaboratif divisi UI/UX, Backend, dan AI. Denah kantor 2D lengkap dengan meeting room & pantry.',
    hostName: userName || 'Baginda Putra Krista',
    isPrivate: false,
    capacity: 30,
    activeCount: 1,
    proximityAudio: true,
    audioRadius: 'medium' as AudioRadius,
    tags: ['Utama', 'Kolaborasi', 'Virtual Office'],
    createdAt: 'Hari ini, Sesi Aktif',
  };

  // Dinamis: Hanya menampilkan pengguna aktif di sesi ini (Opsi 2)
  const roomParticipants = getRoomColleagues(activeRoom.code, userName, participants, userRole, userAvatar);

  // Tautan undangan otomatis mendeteksi domain hosting aktif (window.location.origin)
  const getDynamicShareUrl = (): string => {
    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      const pathname = window.location.pathname.replace(/\/+$/, '');
      return `${origin}${pathname}/?room=${encodeURIComponent(activeRoom.code)}`;
    }
    const envUrl = (import.meta as any).env?.VITE_PUBLIC_APP_URL || (import.meta as any).env?.VITE_APP_URL;
    if (envUrl) {
      return `${envUrl.replace(/\/+$/, '')}/?room=${encodeURIComponent(activeRoom.code)}`;
    }
    return `https://neurosim.app/?room=${encodeURIComponent(activeRoom.code)}`;
  };

  const roomShareUrl = getDynamicShareUrl();

  const handleCopyCode = () => {
    navigator.clipboard.writeText(activeRoom.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(roomShareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError(null);
    if (!inputCode.trim()) {
      setJoinError('Kode ruangan wajib diisi.');
      return;
    }

    const cleanCode = inputCode.trim().toUpperCase();
    const result = onJoinRoom(cleanCode, inputPasscode.trim() || undefined);
    if (result.success) {
      setActiveTab('current');
      setInputCode('');
      setInputPasscode('');
    } else {
      setJoinError(result.message || 'Gagal masuk ke ruangan. Pastikan kode atau sandi benar.');
    }
  };

  const handleQuickJoin = (room: OfficeRoom) => {
    if (room.isPrivate) {
      setInputCode(room.code);
      setActiveTab('join');
      return;
    }
    onJoinRoom(room.code);
    setActiveTab('current');
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;

    const generatedCode = newRoomCode.trim().toUpperCase() || generateOfficialRoomCode();

    onCreateRoom({
      name: newRoomName.trim(),
      code: generatedCode,
      description: newRoomDesc.trim(),
      capacity: newRoomCapacity,
      isPrivate: newRoomPrivate,
      passcode: newRoomPrivate ? newRoomPasscode.trim() : undefined,
      proximityAudio: newRoomProximity,
      audioRadius: newRoomRadius,
    });

    setNewRoomName('');
    setNewRoomDesc('');
    setNewRoomPasscode('');
    setNewRoomPrivate(false);
    setNewRoomCode(generateOfficialRoomCode());

    setActiveTab('current');
  };

  // Filtered rooms for directory
  const filteredRooms = availableRooms.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) ||
      r.code.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q) ||
      r.tags?.some((t) => t.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="room-modal-title"
        tabIndex={-1}
        className="w-full max-w-2xl bg-cream border-2 border-teal rounded-xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-ink select-none"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-teal text-soft border-b border-teal-dark flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-cream/15 border border-soft/30 flex items-center justify-center shadow-xs">
              <Building2 className="w-4 h-4 text-brass" />
            </div>
            <div>
              <h2 id="room-modal-title" className="text-sm sm:text-base font-bold leading-tight">
                Ruang Kantor Online
              </h2>
              <p className="text-[11px] text-soft/80 leading-tight">
                Simulasi Kolaborasi & Ruang Kerja Virtual Tim
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup Pengaturan Ruangan"
            className="p-1.5 rounded hover:bg-black/20 text-soft transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#d1c7b5] bg-sand/60 px-4 pt-2 gap-1 flex-shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('current')}
            className={`px-3 sm:px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-1.5 border-t border-x cursor-pointer ${
              activeTab === 'current'
                ? 'bg-cream text-teal border-[#d1c7b5] border-b-cream -mb-px'
                : 'border-transparent text-ink-muted hover:text-ink hover:bg-cream/50'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Ruangan Saya</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 ml-0.5 animate-pulse" />
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('join')}
            className={`px-3 sm:px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-1.5 border-t border-x cursor-pointer ${
              activeTab === 'join'
                ? 'bg-cream text-teal border-[#d1c7b5] border-b-cream -mb-px'
                : 'border-transparent text-ink-muted hover:text-ink hover:bg-cream/50'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Masuk Ruangan Lain</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('create');
              if (!newRoomCode) setNewRoomCode(generateOfficialRoomCode());
            }}
            className={`px-3 sm:px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-1.5 border-t border-x cursor-pointer ${
              activeTab === 'create'
                ? 'bg-cream text-teal border-[#d1c7b5] border-b-cream -mb-px'
                : 'border-transparent text-ink-muted hover:text-ink hover:bg-cream/50'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Buat Ruangan Baru</span>
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4 bg-cream/70">
          {/* TAB 1: CURRENT ACTIVE ROOM */}
          {activeTab === 'current' && (
            <div className="space-y-4">
              {/* Active Space Banner Card */}
              <div className="p-4 bg-sand border-2 border-teal/40 rounded-xl space-y-3 shadow-inner">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-teal text-soft shadow-2xs">
                        Ruang Aktif
                      </span>
                      {activeRoom.isPrivate ? (
                        <span className="px-2 py-0.5 text-[10px] font-medium rounded bg-brick/15 text-brick border border-brick/30 flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" /> Privat
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[10px] font-medium rounded bg-sage/15 text-sage border border-sage/30 flex items-center gap-1">
                          <Unlock className="w-2.5 h-2.5" /> Publik
                        </span>
                      )}
                      <span className="px-2 py-0.5 text-[10px] font-medium rounded bg-cream border border-[#d1c7b5] text-ink-muted">
                        Host: <strong className="text-teal">{activeRoom.code === 'NEURO-HQ-88' ? (userName || 'Baginda Putra Krista') : (activeRoom.hostName || userName)}</strong>
                      </span>
                      {activeRoom.tags?.map((tag) => (
                        <span key={tag} className="px-1.5 py-0.5 text-[9.5px] rounded bg-cream/80 border border-teal/20 text-wood-dark font-medium">
                          #{tag}
                        </span>
                      ))}
                    </div>

                    <h3 className="font-bold text-base sm:text-lg text-ink leading-tight">
                      {activeRoom.name}
                    </h3>
                    <p className="text-xs text-ink-muted leading-relaxed">
                      {activeRoom.description}
                    </p>
                  </div>

                  <div className="text-right flex-shrink-0 bg-cream/90 p-2.5 rounded-lg border border-muted/20 shadow-2xs">
                    <span className="text-[10px] text-ink-muted uppercase font-bold block">Kapasitas</span>
                    <span className="text-sm font-bold text-teal flex items-center justify-end gap-1 font-mono">
                      <Users className="w-3.5 h-3.5 text-sage" />
                      {roomParticipants.length} / {activeRoom.capacity}
                    </span>
                    <span className="text-[9.5px] text-ink-muted block mt-0.5 font-medium">Pegawai Hadir</span>
                  </div>
                </div>

                {/* Shareable Code & URL Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-[#d1c7b5]">
                  {/* Room Code */}
                  <div className="p-2.5 bg-cream rounded-lg border border-sand flex items-center justify-between gap-2 shadow-2xs">
                    <div>
                      <span className="text-[10px] text-ink-muted block font-medium">Kode Akses Ruangan:</span>
                      <span className="font-mono font-bold text-xs sm:text-sm text-teal tracking-wider">
                        {activeRoom.code}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      title="Salin Kode Akses"
                      className="px-2.5 py-1 text-xs font-semibold rounded bg-sand hover:bg-parchment border border-muted/30 text-ink transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      {copiedCode ? <Check className="w-3 h-3 text-sage" /> : <Copy className="w-3 h-3 text-teal" />}
                      <span>{copiedCode ? 'Disalin' : 'Salin'}</span>
                    </button>
                  </div>

                  {/* Share Link */}
                  <div className="p-2.5 bg-cream rounded-lg border border-sand flex items-center justify-between gap-2 shadow-2xs">
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] text-ink-muted block font-medium">Tautan Undangan Rekan:</span>
                      <span className="text-[11px] font-mono text-teal truncate block font-medium select-all" title={roomShareUrl}>
                        {roomShareUrl}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      title="Salin Tautan Undangan"
                      className="px-2.5 py-1 text-xs font-semibold rounded bg-teal text-soft hover:bg-teal-dark transition-colors flex items-center gap-1 flex-shrink-0 shadow-xs cursor-pointer"
                    >
                      {copiedLink ? <Check className="w-3 h-3 text-brass" /> : <Share2 className="w-3 h-3" />}
                      <span>{copiedLink ? 'Tersalin' : 'Undang'}</span>
                    </button>
                  </div>
                </div>

                {/* Active Session Member & Waiting for Peers helper */}
                <div className="pt-2 border-t border-[#d1c7b5]/80 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold text-teal">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-sage" />
                      Rekan Kerja di Ruangan Ini:
                    </span>
                    <span className="text-[10.5px] font-mono text-ink-muted font-medium">
                      {roomParticipants.length} aktif di sesi peramban
                    </span>
                  </div>

                  {/* Self Active Member Card */}
                  <div className="grid grid-cols-1 gap-2">
                    {roomParticipants.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center gap-2.5 p-2 rounded-lg bg-cream/90 border border-sand text-xs shadow-2xs"
                      >
                        <div className="relative w-7 h-7 rounded-full bg-sand border border-teal/30 flex items-center justify-center font-bold text-[11px] text-teal overflow-hidden flex-shrink-0">
                          {p.portrait ? (
                            <img src={p.portrait} alt={p.name} className="w-full h-full object-cover scale-150" />
                          ) : (
                            p.name.charAt(0)
                          )}
                          <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full border border-white bg-emerald-500 animate-pulse" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-ink text-xs truncate flex items-center gap-1.5">
                            <span>{p.name}</span>
                            <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-teal text-soft font-bold">Kamu</span>
                          </div>
                          <div className="text-[10.5px] text-ink-muted truncate font-normal">{p.role}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Collaboration helper card */}
                  <div className="p-3 bg-cream/60 rounded-lg border border-dashed border-[#d1c7b5] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs">
                    <div className="space-y-0.5">
                      <span className="font-semibold text-ink flex items-center gap-1.5 text-[11.5px]">
                        <UserPlus className="w-3.5 h-3.5 text-teal" />
                        Menunggu Rekan Kerja Bergabung...
                      </span>
                      <p className="text-[10.5px] text-ink-muted leading-tight">
                        Bagikan tautan undangan atau kode akses di atas agar rekan tim dapat masuk ke denah kantor yang sama.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="px-2.5 py-1 text-xs font-semibold rounded bg-teal text-soft hover:bg-teal-dark transition-colors flex items-center gap-1 flex-shrink-0 shadow-xs cursor-pointer"
                    >
                      <Share2 className="w-3 h-3" />
                      <span>Salin Undangan</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Spatial Audio & Video Proximity Info */}
              <div className="p-3 bg-parchment rounded-lg border border-sand space-y-2 text-xs">
                <div className="flex items-center gap-2 text-teal font-bold">
                  <Radio className="w-4 h-4 text-brass" />
                  <h4>Fitur Audio & Video Spasial (Proximity Chat)</h4>
                </div>
                <p className="text-ink-muted text-[11.5px] leading-relaxed">
                  Suara dan interaksi rekan kantor berbasis jarak spasial (proximity chat) — otomatis terdengar saat avatarmu mendekat di denah 2D, dan meredup secara halus ketika saling menjauh.
                </p>
                <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-sand/60">
                  <span className="flex items-center gap-1.5 text-sage font-medium">
                    <Volume2 className="w-3.5 h-3.5" />
                    Radius Suara: {activeRoom.audioRadius === 'close' ? 'Dekat (Meja Kerja)' : activeRoom.audioRadius === 'medium' ? 'Sedang (Satu Klaster)' : 'Satu Ruangan Penuh'}
                  </span>
                  <span className="text-teal font-medium flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Proximity Audio Aktif
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: JOIN ANOTHER ROOM */}
          {activeTab === 'join' && (
            <div className="space-y-4">
              <form onSubmit={handleJoinSubmit} className="p-4 bg-sand rounded-xl border border-muted/30 space-y-3">
                <h3 className="font-bold text-xs uppercase tracking-wider text-teal">
                  Gabung dengan Kode / Tautan
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2 space-y-1">
                    <label htmlFor="join-code" className="text-xs font-semibold text-ink block">
                      Kode Ruangan Kantor:
                    </label>
                    <input
                      id="join-code"
                      type="text"
                      placeholder="Contoh: NEURO-HQ-88"
                      value={inputCode}
                      onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 bg-soft border border-muted/40 rounded-lg text-xs font-mono font-bold uppercase focus:ring-1 focus:ring-teal focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="join-passcode" className="text-xs font-semibold text-ink block">
                      Sandi (Bila Privat):
                    </label>
                    <input
                      id="join-passcode"
                      type="password"
                      placeholder="Opsional"
                      value={inputPasscode}
                      onChange={(e) => setInputPasscode(e.target.value)}
                      className="w-full px-3 py-2 bg-soft border border-muted/40 rounded-lg text-xs focus:ring-1 focus:ring-teal focus:outline-none"
                    />
                  </div>
                </div>

                {joinError && (
                  <p className="text-xs text-brick font-medium bg-brick/10 p-2 rounded border border-brick/30">
                    {joinError}
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full py-2 bg-teal text-soft text-xs font-semibold rounded-lg hover:bg-teal-dark transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Masuk ke Ruangan Ini</span>
                </button>
              </form>

              {/* Public Available Rooms Directory */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs font-bold text-ink uppercase tracking-wider block">
                    Daftar Ruangan Terbuka di Kantor ({filteredRooms.length}):
                  </span>
                  {/* Dynamic Search Filter */}
                  <div className="relative w-full sm:w-56">
                    <Search className="w-3.5 h-3.5 text-ink-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Cari nama atau kode..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-7 pr-3 py-1 bg-soft border border-muted/40 rounded-lg text-xs text-ink focus:ring-1 focus:ring-teal focus:outline-none placeholder:text-ink-muted/60"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  {filteredRooms.map((room) => {
                    const isCurrent = room.code === activeRoom.code;
                    const dynamicCount = isCurrent ? roomParticipants.length : 0;
                    const displayHost = room.code === 'NEURO-HQ-88' ? (userName || room.hostName) : room.hostName;

                    return (
                      <div
                        key={room.id}
                        className={`p-3 rounded-lg border transition-all flex items-center justify-between gap-3 ${
                          isCurrent
                            ? 'bg-teal/10 border-teal shadow-xs'
                            : 'bg-cream hover:bg-sand border-sand'
                        }`}
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-xs text-ink truncate block">
                              {room.name}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-sand border border-muted/20 text-teal font-bold">
                              {room.code}
                            </span>
                            {room.isPrivate ? (
                              <span className="text-[10px] text-brick font-medium flex items-center gap-0.5">
                                <Lock className="w-2.5 h-2.5" /> Privat
                              </span>
                            ) : (
                              <span className="text-[10px] text-sage font-medium flex items-center gap-0.5">
                                <Unlock className="w-2.5 h-2.5" /> Publik
                              </span>
                            )}
                            <span className="text-[10px] text-ink-muted">
                              Host: {displayHost || 'Tim'}
                            </span>
                          </div>
                          <p className="text-[11px] text-ink-muted line-clamp-1">
                            {room.description}
                          </p>
                          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                            {room.tags?.map((t) => (
                              <span key={t} className="text-[9px] px-1.5 py-0.2 rounded bg-sand/80 text-wood-dark border border-muted/20">
                                #{t}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs font-medium text-ink-muted flex items-center gap-1 font-mono">
                            <Users className="w-3.5 h-3.5 text-sage" />
                            {dynamicCount} / {room.capacity}
                          </span>

                          {isCurrent ? (
                            <span className="px-2.5 py-1 text-xs font-bold rounded bg-teal text-soft">
                              Aktif
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleQuickJoin(room)}
                              className="px-2.5 py-1 text-xs font-semibold rounded bg-parchment hover:bg-teal hover:text-soft border border-muted/30 transition-colors cursor-pointer"
                            >
                              Masuk
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CREATE NEW ROOM */}
          {activeTab === 'create' && (
            <form onSubmit={handleCreateSubmit} className="space-y-3.5">
              <div className="p-3 bg-parchment rounded-lg border border-sand text-xs text-ink-muted flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-ochre flex-shrink-0" />
                <p>
                  Buat ruang kantor terpisah untuk tim kerja, divisi proyek, atau sesi diskusi privat.
                </p>
              </div>

              {/* Room Name & Custom Code */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label htmlFor="new-room-name" className="text-xs font-bold text-ink block">
                    Nama Ruang Kantor:
                  </label>
                  <input
                    id="new-room-name"
                    type="text"
                    required
                    placeholder="Contoh: Studio Desain UI/UX Sprint 1"
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    className="w-full px-3 py-2 bg-soft border border-muted/40 rounded-lg text-xs text-ink focus:ring-1 focus:ring-teal focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="new-room-code" className="text-xs font-bold text-ink block">
                    Kode Unik Ruangan:
                  </label>
                  <input
                    id="new-room-code"
                    type="text"
                    readOnly
                    value={newRoomCode}
                    title="Kode unik dibuat otomatis oleh sistem"
                    className="w-full px-3 py-2 bg-sand/60 border border-[#d1c7b5] rounded-lg text-xs font-mono font-bold text-teal tracking-wider uppercase cursor-not-allowed select-all"
                  />
                  <span className="text-[10px] text-ink-muted block leading-tight">
                    Dibuat otomatis oleh sistem
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label htmlFor="new-room-desc" className="text-xs font-semibold text-ink block">
                  Deskripsi Ruangan (Tujuan & Agenda):
                </label>
                <textarea
                  id="new-room-desc"
                  rows={2}
                  placeholder="Contoh: Ruang koordinasi perbaikan layout, warna, dan pengujian aksesibilitas pengguna..."
                  value={newRoomDesc}
                  onChange={(e) => setNewRoomDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-soft border border-muted/40 rounded-lg text-xs text-ink focus:ring-1 focus:ring-teal focus:outline-none resize-none"
                />
              </div>

              {/* Capacity & Privacy Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Capacity */}
                <div className="space-y-1">
                  <label htmlFor="new-room-cap" className="text-xs font-semibold text-ink block">
                    Kapasitas Maksimal Pegawai:
                  </label>
                  <select
                    id="new-room-cap"
                    value={newRoomCapacity}
                    onChange={(e) => setNewRoomCapacity(Number(e.target.value))}
                    className="w-full p-2 bg-soft border border-muted/40 rounded-lg text-xs text-ink focus:ring-1 focus:ring-teal focus:outline-none"
                  >
                    <option value={10}>10 Pegawai (Kelompok Kecil)</option>
                    <option value={25}>25 Pegawai (Satu Divisi Kantor)</option>
                    <option value={50}>50 Pegawai (Ruang Pertemuan Luas)</option>
                    <option value={100}>100 Pegawai (Aula & Townhall)</option>
                  </select>
                </div>

                {/* Spatial Audio Mode */}
                <div className="space-y-1">
                  <label htmlFor="new-room-audio" className="text-xs font-semibold text-ink block">
                    Jangkauan Suara Spasial (3D Audio):
                  </label>
                  <select
                    id="new-room-audio"
                    value={newRoomRadius}
                    onChange={(e) => setNewRoomRadius(e.target.value as AudioRadius)}
                    className="w-full p-2 bg-soft border border-muted/40 rounded-lg text-xs text-ink focus:ring-1 focus:ring-teal focus:outline-none"
                  >
                    <option value="close">Jarak Dekat (Meja Bersebelahan)</option>
                    <option value="medium">Jarak Sedang (Klaster Ruangan)</option>
                    <option value="room">Satu Ruangan Penuh (Broadcast)</option>
                  </select>
                </div>
              </div>

              {/* Privacy Checkbox */}
              <div className="p-3 bg-sand rounded-lg border border-sand space-y-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-ink cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newRoomPrivate}
                    onChange={(e) => setNewRoomPrivate(e.target.checked)}
                    className="rounded text-teal focus:ring-teal"
                  />
                  <span>Kunci Ruangan dengan Sandi Tambahan (Private Space)</span>
                </label>

                {newRoomPrivate && (
                  <input
                    type="text"
                    placeholder="Masukkan sandi masuk ruangan..."
                    value={newRoomPasscode}
                    onChange={(e) => setNewRoomPasscode(e.target.value)}
                    className="w-full px-3 py-1.5 bg-soft border border-muted/40 rounded text-xs focus:ring-1 focus:ring-teal focus:outline-none"
                  />
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-2.5 bg-teal text-soft text-xs font-bold rounded-lg hover:bg-teal-dark transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Ruang Kantor Baru</span>
              </button>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-sand border-t border-[#d1c7b5] flex items-center justify-between text-xs text-ink-muted flex-shrink-0">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Terhubung sebagai <strong className="text-ink">{userName}</strong>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg border border-muted/30 bg-cream text-ink font-semibold hover:bg-sand transition-colors shadow-2xs cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
