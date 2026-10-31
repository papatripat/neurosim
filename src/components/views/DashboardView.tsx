import React from 'react';
import {
  User,
  ShieldCheck,
  DoorOpen,
  Users,
  Shirt,
  Play,
  ArrowRight,
  LogOut,
  Sparkles,
  CheckCircle2,
  Clock,
  Compass,
  Award,
  Layers,
  Briefcase,
} from 'lucide-react';
import { UserProfile } from '../modals/AuthModal';
import { CharacterCustomization } from '../../types/character';
import { OfficeTask } from '../../types/conversation';
import { CharacterCanvasPreview } from '../character/CharacterCanvasPreview';

export interface OfficeRoom {
  id: string;
  name: string;
  zone: string;
  description: string;
  spawnCoords: { x: number; y: number };
  capacity: number;
  activeCount: number;
  npcs: string[];
}

export const OFFICE_ROOMS: OfficeRoom[] = [
  {
    id: 'room-main',
    name: 'Kantor Utama & Open Workspace',
    zone: 'Workstation Utama',
    description: 'Pusat workstation tim dengan 16 meja kerja komputer, koridor navigasi sentral, dan area kolaborasi.',
    spawnCoords: { x: 1810, y: 790 },
    capacity: 25,
    activeCount: 3,
    npcs: ['Priyoga', 'Rifat', 'Baginda'],
  },
  {
    id: 'room-meeting',
    name: 'Ruang Rapat Strategis',
    zone: 'Ruang Rapat & Konferensi',
    description: 'Ruang konferensi formal berlantai kayu untuk presentasi proposal dan negosiasi proyek bersama Pak Hendra.',
    spawnCoords: { x: 600, y: 480 },
    capacity: 12,
    activeCount: 1,
    npcs: ['Pak Hendra (Klien)'],
  },
  {
    id: 'room-pantry',
    name: 'Pantry & Coffee Breakroom',
    zone: 'Pantry & Dapur',
    description: 'Area santai dengan espresso machine, meja kafe, dan rekan kerja senior Dimas untuk obrolan santai.',
    spawnCoords: { x: 480, y: 950 },
    capacity: 15,
    activeCount: 2,
    npcs: ['Dimas', 'Host Barista'],
  },
  {
    id: 'room-executive',
    name: 'Ruang Eksekutif & Manajemen',
    zone: 'Ruang Eksekutif & Manajemen',
    description: 'Ruangan kerja pimpinan Bu Rina untuk pembagian tugas, arahan prioritas, dan feedback kerja berkala.',
    spawnCoords: { x: 2150, y: 360 },
    capacity: 8,
    activeCount: 1,
    npcs: ['Bu Rina (Atasan)'],
  },
  {
    id: 'room-afk',
    name: 'AFK Room & Area Santai',
    zone: 'AFK Room & Area Santai',
    description: 'Ruang istirahat dan relaksasi tenang dilengkapi sofa empuk, sudut buku, dan dispenser untuk jeda istirahat.',
    spawnCoords: { x: 600, y: 1180 },
    capacity: 10,
    activeCount: 1,
    npcs: ['Area Relaksasi Karyawan'],
  },
];

interface Props {
  currentUser: UserProfile | null;
  characterConfig: CharacterCustomization;
  tasks: OfficeTask[];
  userHistory: any[];
  onSelectRoom: (room: OfficeRoom) => void;
  onEnterSimulationDirect: (room?: OfficeRoom) => void;
  onOpenCustomizer: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  onBackToLanding: () => void;
}

export const DashboardView: React.FC<Props> = ({
  currentUser,
  characterConfig,
  tasks,
  userHistory,
  onSelectRoom,
  onEnterSimulationDirect,
  onOpenCustomizer,
  onOpenAuth,
  onLogout,
  onBackToLanding,
}) => {
  const completedTasks = tasks.filter((t) => t.completed).length;
  const progressPercent = Math.round((completedTasks / tasks.length) * 100);

  return (
    <div className="w-full h-full overflow-y-auto bg-sand/30 text-ink select-none flex flex-col">
      {/* Top Header */}
      <header className="flex-shrink-0 flex items-center justify-between px-6 py-3.5 bg-cream border-b border-[#d1c7b5] sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToLanding}
            className="flex items-center gap-2.5 text-left group"
            title="Kembali ke Beranda"
          >
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-cream border border-teal/30 flex items-center justify-center shadow-xs">
              <img src="/logo.webp" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-ink group-hover:text-teal transition-colors block leading-tight font-serif">
                NeuroSim
              </span>
              <span className="text-[10px] text-teal font-semibold block leading-tight">
                Dashboard Karyawan
              </span>
            </div>
          </button>
        </div>

        {/* Center / Right Header Actions */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenCustomizer}
            className="px-3 py-1.5 rounded-lg border border-[#d1c7b5] bg-cream hover:bg-sand text-xs font-semibold text-ink transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Shirt className="w-3.5 h-3.5 text-teal" />
            <span>Kustomisasi Karakter</span>
          </button>

          <button
            type="button"
            onClick={() => onEnterSimulationDirect(OFFICE_ROOMS[0])}
            className="px-4 py-2 rounded-lg bg-teal hover:bg-teal-dark text-soft text-xs font-bold transition-all shadow-xs flex items-center gap-2"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Masuk Simulasi 2D</span>
          </button>

          {currentUser ? (
            <div className="flex items-center gap-2 pl-2 border-l border-[#d1c7b5]">
              <button
                type="button"
                onClick={onOpenAuth}
                className="flex items-center gap-2 p-1 rounded-lg hover:bg-sand/70 transition-colors"
                title="Lihat Profil ID Karyawan"
              >
                <div className="w-7 h-7 rounded-full bg-teal text-soft flex items-center justify-center text-xs font-bold shadow-xs">
                  {currentUser.fullName.charAt(0)}
                </div>
                <div className="text-left hidden sm:block">
                  <span className="text-xs font-bold block text-ink leading-tight">
                    {currentUser.fullName.split(' ')[0]}
                  </span>
                  <span className="text-[10px] text-teal block leading-tight font-medium">
                    {currentUser.role}
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={onLogout}
                className="p-1.5 rounded-lg text-ink-muted hover:text-red-700 hover:bg-red-50 transition-colors"
                title="Keluar / Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="px-3 py-1.5 rounded-lg border border-teal text-teal hover:bg-teal/10 text-xs font-bold transition-colors"
            >
              Masuk Akun
            </button>
          )}
        </div>
      </header>

      {/* Main Dashboard Workspace */}
      <main className="max-w-6xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (Width: 4/12): User Identity & Live Character */}
        <div className="lg:col-span-4 space-y-5">
          {/* 1. User Identity ID Card */}
          <div className="bg-cream border-2 border-[#b5aa94] rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#d1c7b5] pb-3">
              <div className="flex items-center gap-2 text-teal font-bold text-xs uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" />
                <span>Kartu ID Karyawan</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                AKTIF ONLINE
              </span>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-xl bg-sand/60 border-2 border-teal/40 overflow-hidden flex items-center justify-center flex-shrink-0 shadow-xs">
                <img
                  src={currentUser?.avatar || '/assets/characters/resident/standing/south.png'}
                  alt="Avatar"
                  className="w-12 h-12 object-contain pixelated scale-125"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-bold text-sm sm:text-base text-ink truncate font-serif">
                  {currentUser?.fullName || 'Baginda Putra Krista'}
                </h2>
                <p className="text-xs text-teal font-semibold mt-0.5 truncate">
                  {currentUser?.role || 'Staff Pengembang Antarmuka'}
                </p>
                <p className="text-[11px] text-ink-muted truncate">
                  {currentUser?.department || 'Divisi Aksesibilitas & UI/UX'}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-[#d1c7b5] grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded bg-sand/40 border border-[#d1c7b5]">
                <span className="text-[10px] text-ink-muted block">ID Karyawan:</span>
                <span className="font-mono font-bold text-ink">
                  #EMP-{currentUser?.id || '2026-01'}
                </span>
              </div>
              <div className="p-2 rounded bg-sand/40 border border-[#d1c7b5]">
                <span className="text-[10px] text-ink-muted block">Database Status:</span>
                <span className="font-bold text-emerald-700">Tersinkronisasi</span>
              </div>
            </div>
          </div>

          {/* 2. Active Character Live Canvas Preview */}
          <div className="bg-cream border-2 border-[#b5aa94] rounded-2xl p-5 shadow-sm flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-ink flex items-center gap-1.5">
                <Shirt className="w-4 h-4 text-teal" />
                <span>Karakter Simulator Aktif</span>
              </span>
              <span className="text-[10px] font-mono text-ink-muted">64×64 LPC</span>
            </div>

            <CharacterCanvasPreview
              config={characterConfig}
              direction="south"
              zoom={2.6}
              className="my-1"
            />

            <div className="text-center w-full mt-2">
              <span className="font-bold text-xs text-ink block">{characterConfig.name}</span>
              <span className="text-[10px] text-ink-muted block">
                {characterConfig.gender === 'male' ? 'Karyawan Pria' : 'Karyawan Wanita'} ·{' '}
                {characterConfig.archetype || 'resident'}
              </span>
            </div>

            <button
              type="button"
              onClick={onOpenCustomizer}
              className="w-full mt-3 py-2 px-3 rounded-xl bg-teal hover:bg-teal-dark text-soft text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              <Shirt className="w-3.5 h-3.5" />
              <span>Buka Generator Karakter</span>
            </button>
          </div>

          {/* 3. Daily Tasks / Agenda Progress */}
          <div className="bg-cream border-2 border-[#b5aa94] rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-ink flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-ochre" />
                <span>Progres Agenda Harian</span>
              </span>
              <span className="font-mono text-xs font-bold text-teal">
                {completedTasks}/{tasks.length} Selesai
              </span>
            </div>

            <div className="w-full h-2.5 rounded-full bg-sand border border-[#c4b8a1] overflow-hidden">
              <div
                className="h-full bg-teal transition-all duration-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="space-y-1.5 pt-1">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-2 rounded-lg border text-xs flex items-center gap-2 ${
                    task.completed
                      ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900'
                      : 'bg-sand/30 border-[#d1c7b5] text-ink'
                  }`}
                >
                  <CheckCircle2
                    className={`w-3.5 h-3.5 flex-shrink-0 ${
                      task.completed ? 'text-emerald-600' : 'text-ink-muted'
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <span className={`block font-medium truncate ${task.completed ? 'line-through' : ''}`}>
                      {task.title}
                    </span>
                    <span className="text-[10px] text-ink-muted block">{task.zone}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (Width: 8/12): Room Directory & Lobby + AI Evaluation History */}
        <div className="lg:col-span-8 space-y-6">
          {/* Room Directory / Lobby Selection */}
          <div className="bg-cream border-2 border-[#b5aa94] rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#d1c7b5] pb-3">
              <div>
                <h3 className="font-bold text-base sm:text-lg text-ink font-serif flex items-center gap-2">
                  <DoorOpen className="w-5 h-5 text-teal" />
                  <span>Pilihan Ruangan Kantor Virtual</span>
                </h3>
                <p className="text-xs text-ink-muted">
                  Pilih ruangan kerja untuk memasuki lobby atau langsung menuju koordinat ruangan di kantor 2D.
                </p>
              </div>

              <span className="text-[11px] font-mono font-bold text-teal bg-teal/10 px-2.5 py-1 rounded-lg border border-teal/20 self-start sm:self-auto">
                {OFFICE_ROOMS.length} RUANGAN TERSEDIA
              </span>
            </div>

            {/* Room Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {OFFICE_ROOMS.map((room) => (
                <div
                  key={room.id}
                  className="bg-sand/30 hover:bg-sand/60 border border-[#d1c7b5] hover:border-teal rounded-xl p-4 transition-all flex flex-col justify-between space-y-3 group shadow-2xs"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-bold text-teal uppercase tracking-wide bg-cream px-2 py-0.5 rounded border border-[#d1c7b5]">
                        {room.zone}
                      </span>
                      <div className="flex items-center gap-1 text-[10px] text-ink-muted font-mono">
                        <Users className="w-3 h-3 text-teal" />
                        <span>{room.activeCount} aktif</span>
                      </div>
                    </div>

                    <h4 className="font-bold text-sm text-ink group-hover:text-teal transition-colors">
                      {room.name}
                    </h4>

                    <p className="text-xs text-ink-muted leading-relaxed line-clamp-2">
                      {room.description}
                    </p>

                    <div className="text-[11px] text-ink font-medium">
                      <span className="text-ink-muted">Rekan di ruangan: </span>
                      {room.npcs.join(', ')}
                    </div>
                  </div>

                  {/* Room CTAs */}
                  <div className="pt-2 border-t border-[#d1c7b5]/60 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onSelectRoom(room)}
                      className="flex-1 py-2 px-3 rounded-lg bg-cream hover:bg-sand border border-[#b5aa94] text-xs font-bold text-ink transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Users className="w-3.5 h-3.5 text-teal" />
                      <span>Masuk Lobby</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onEnterSimulationDirect(room)}
                      className="flex-1 py-2 px-3 rounded-lg bg-teal hover:bg-teal-dark text-soft text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Masuk 2D</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Evaluation History */}
          <div className="bg-cream border-2 border-[#b5aa94] rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#d1c7b5] pb-3">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-ochre" />
                <h3 className="font-bold text-sm sm:text-base text-ink font-serif">
                  Riwayat Evaluasi Komunikasi AI (Remote MySQL)
                </h3>
              </div>
              <span className="text-[10px] text-ink-muted font-mono">
                {userHistory.length} Sesi Tercatat
              </span>
            </div>

            {userHistory.length === 0 ? (
              <div className="p-6 rounded-xl bg-sand/30 border border-dashed border-[#c4b8a1] text-center space-y-2">
                <Compass className="w-7 h-7 text-ink-muted mx-auto" />
                <p className="text-xs text-ink font-medium">Belum ada riwayat evaluasi percakapan.</p>
                <p className="text-[11px] text-ink-muted max-w-md mx-auto">
                  Mulailah berinteraksi dengan Bu Rina di Ruangan Bos, Dimas di Pantry, atau Pak Hendra di Meeting Room
                  untuk mendapatkan penilaian objektif dari Gemini AI!
                </p>
                <button
                  type="button"
                  onClick={() => onEnterSimulationDirect(OFFICE_ROOMS[0])}
                  className="mt-2 px-4 py-1.5 rounded-lg bg-teal text-soft text-xs font-bold shadow-xs hover:bg-teal-dark transition-colors inline-flex items-center gap-1.5"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Mulai Percakapan Sekarang</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {userHistory.slice(0, 5).map((evalItem: any, idx: number) => (
                  <div
                    key={evalItem.id || idx}
                    className="p-3.5 rounded-xl bg-sand/30 border border-[#d1c7b5] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-ink">{evalItem.scenario_id || 'Skenario Kantor'}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-teal/10 text-teal font-bold border border-teal/20">
                          Level {evalItem.level || 2}
                        </span>
                      </div>
                      <p className="text-[11px] text-ink-muted">
                        Tujuan: {evalItem.user_goal || 'Latihan komunikasi profesional'}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 sm:text-right flex-shrink-0">
                      <div>
                        <span className="text-[10px] text-ink-muted block">Rekomendasi Level:</span>
                        <span className="font-bold text-teal text-sm">
                          Level {evalItem.rekomendasi_level || 2}
                        </span>
                      </div>
                      <span className="text-[10px] text-ink-muted font-mono">
                        {evalItem.created_at ? new Date(evalItem.created_at).toLocaleDateString() : 'Hari ini'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
