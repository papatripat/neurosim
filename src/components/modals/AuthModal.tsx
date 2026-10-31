import React, { useState } from 'react';
import { User, KeyRound, UserPlus, LogIn, ShieldCheck, LogOut, History, Award, X } from 'lucide-react';

export interface UserProfile {
  id: number;
  username: string;
  fullName: string;
  role: string;
  department: string;
  avatar: string;
  reduceMotion: boolean;
  highContrast: boolean;
  textScale: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onLoginSuccess: (user: UserProfile, history?: any[]) => void;
  onLogout: () => void;
  userHistory?: any[];
}

const AVATAR_OPTIONS = [
  { id: 'resident', name: 'Resident Casual', path: '/assets/characters/resident/standing/south.png' },
  { id: 'office-worker', name: 'Office Professional', path: '/assets/characters/office-worker/standing/south.png' },
  { id: 'courier', name: 'Field Specialist', path: '/assets/characters/courier/standing/south.png' },
];

export const AuthModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentUser,
  onLoginSuccess,
  onLogout,
  userHistory = [],
}) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form States
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('Staff Pengembang');
  const [department, setDepartment] = useState('Divisi Antarmuka & Frontend');
  const [selectedAvatar, setSelectedAvatar] = useState('/assets/characters/resident/standing/south.png');

  if (!isOpen) return null;

  const handleLogin = async (e?: React.FormEvent, customUser?: string, customPass?: string) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    const u = customUser || username;
    const p = customPass || password;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u, password: p }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal login.');
      }

      setSuccessMessage('Berhasil masuk! Selamat datang kembali.');
      setTimeout(() => {
        onLoginSuccess(data.user, data.history);
        onClose();
      }, 500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan saat login.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          fullName,
          role,
          department,
          avatar: selectedAvatar,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal registrasi.');
      }

      setSuccessMessage('Akun ID Karyawan berhasil dibuat!');
      setTimeout(() => {
        onLoginSuccess(data.user, []);
        onClose();
      }, 600);
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan saat registrasi.');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick Demo Login untuk Juri Hackathon
  const handleQuickDemo = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    handleLogin(undefined, user, pass);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto"
    >
      <div className="w-full max-w-md bg-cream border-4 border-teal rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 my-auto">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-4 py-3 bg-teal text-soft">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-sand" />
            <h2 id="auth-modal-title" className="font-bold text-sm sm:text-base font-serif">
              {currentUser ? 'Kartu ID Karyawan' : 'Portal Masuk Kantor Virtual'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup jendela"
            className="w-7 h-7 rounded hover:bg-black/20 flex items-center justify-center transition-colors text-soft"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Jika Sudah Login: Tampilkan Kartu Profil & Riwayat MySQL */}
        {currentUser ? (
          <div className="p-4 sm:p-5 space-y-4">
            {/* ID Card Visual */}
            <div className="p-4 bg-parchment border-2 border-teal/40 rounded-lg shadow-sm flex items-center gap-4">
              <div className="w-16 h-16 rounded border-2 border-teal overflow-hidden bg-sand flex-shrink-0">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.fullName}
                  className="w-full h-full object-contain scale-[1.9] pixelated"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal text-soft uppercase tracking-wider">
                    ID #{currentUser.id}
                  </span>
                  <span className="text-xs text-ink-muted">@{currentUser.username}</span>
                </div>
                <h3 className="font-bold text-base text-ink truncate mt-0.5">
                  {currentUser.fullName}
                </h3>
                <p className="text-xs text-teal font-medium truncate">{currentUser.role}</p>
                <p className="text-[11px] text-ink-muted truncate">{currentUser.department}</p>
              </div>
            </div>

            {/* Riwayat Latihan di MySQL */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-ink flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-teal" />
                  Riwayat Simulasi Tersimpan (MySQL):
                </h4>
                <span className="text-[11px] text-ink-muted">
                  {userHistory.length} Sesi Terdata
                </span>
              </div>

              {userHistory.length === 0 ? (
                <div className="p-3 bg-sand/50 rounded border border-[#d1c7b5] text-center text-xs text-ink-muted">
                  Belum ada riwayat simulasi yang tersimpan di database. Mulai latihan dengan Bu Rina atau Dimas!
                </div>
              ) : (
                <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 text-xs">
                  {userHistory.map((h, i) => (
                    <div
                      key={h.id || i}
                      className="p-2 bg-parchment border border-[#d1c7b5] rounded flex items-center justify-between"
                    >
                      <div>
                        <span className="font-semibold text-ink block capitalize">
                          {h.scenario_id.replace('-', ' ')}
                        </span>
                        <span className="text-[10px] text-ink-muted block">
                          Level {h.level} · {new Date(h.created_at).toLocaleDateString('id-ID')}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-teal text-soft">
                        Level: {h.rekomendasi_level}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Logout Button */}
            <div className="pt-2 border-t border-[#d1c7b5] flex justify-end gap-2">
              <button
                type="button"
                onClick={onLogout}
                className="px-3.5 py-1.5 rounded bg-brick text-soft text-xs font-semibold hover:bg-brick/90 flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <LogOut className="w-3.5 h-3.5" />
                Keluar (Clock Out)
              </button>
            </div>
          </div>
        ) : (
          /* Jika Belum Login: Tampilkan Tab Login / Register */
          <div className="p-4 sm:p-5 space-y-4">
            {/* Tab Switcher */}
            <div className="flex rounded bg-sand p-1 border border-muted/30">
              <button
                type="button"
                onClick={() => {
                  setTab('login');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded flex items-center justify-center gap-1.5 transition-colors ${
                  tab === 'login' ? 'bg-teal text-soft shadow-xs' : 'text-ink hover:text-black'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                Masuk Kantor
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab('register');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded flex items-center justify-center gap-1.5 transition-colors ${
                  tab === 'register' ? 'bg-teal text-soft shadow-xs' : 'text-ink hover:text-black'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                Buat ID Baru
              </button>
            </div>

            {/* Feedback Messages */}
            {errorMessage && (
              <div className="p-2.5 rounded bg-brick/10 border border-brick/40 text-brick text-xs">
                {errorMessage}
              </div>
            )}
            {successMessage && (
              <div className="p-2.5 rounded bg-sage/20 border border-sage/40 text-sage text-xs font-semibold">
                {successMessage}
              </div>
            )}

            {/* Form Login */}
            {tab === 'login' && (
              <form onSubmit={(e) => handleLogin(e)} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Username:</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="misal: rifat_lead"
                    className="w-full px-3 py-1.5 bg-parchment border border-muted/50 rounded text-xs text-ink focus:outline-none focus:ring-1 focus:ring-teal"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Kata Sandi:</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-1.5 bg-parchment border border-muted/50 rounded text-xs text-ink focus:outline-none focus:ring-1 focus:ring-teal"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2 bg-teal text-soft rounded text-xs font-bold hover:bg-teal-dark transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-xs mt-2"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  {isLoading ? 'Memverifikasi...' : 'Masuk ke Ruang Kerja'}
                </button>

                {/* Quick Access untuk Juri Hackathon */}
                <div className="pt-3 border-t border-[#d1c7b5] space-y-1.5">
                  <p className="text-[11px] text-ink-muted text-center font-medium">
                    ⚡ Masuk Cepat untuk Juri & Tim:
                  </p>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleQuickDemo('rifat_lead', 'password123')}
                      className="flex-1 py-1 px-2 rounded bg-sand hover:bg-sand/80 border border-[#d1c7b5] text-[11px] font-semibold text-ink transition-colors"
                    >
                      Rifat (Lead)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        // Guest mode
                        onLoginSuccess({
                          id: 999,
                          username: 'tamu_juri',
                          fullName: 'Dewan Juri INCEPTION 2026',
                          role: 'Juri & Penguji Inklusivitas',
                          department: 'Evaluasi Kompetisi',
                          avatar: '/assets/characters/courier/standing/south.png',
                          reduceMotion: false,
                          highContrast: false,
                          textScale: 'normal',
                        }, []);
                        onClose();
                      }}
                      className="flex-1 py-1 px-2 rounded bg-teal/15 hover:bg-teal/25 border border-teal text-[11px] font-semibold text-teal transition-colors"
                    >
                      Tamu Juri (Instan)
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Form Register */}
            {tab === 'register' && (
              <form onSubmit={handleRegister} className="space-y-2.5">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Nama Lengkap:</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="misal: Rifat Abhista"
                    className="w-full px-3 py-1.5 bg-parchment border border-muted/50 rounded text-xs text-ink focus:outline-none focus:ring-1 focus:ring-teal"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1">Username:</label>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="rifat"
                      className="w-full px-3 py-1.5 bg-parchment border border-muted/50 rounded text-xs text-ink focus:outline-none focus:ring-1 focus:ring-teal"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1">Kata Sandi:</label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="min 4 huruf"
                      className="w-full px-3 py-1.5 bg-parchment border border-muted/50 rounded text-xs text-ink focus:outline-none focus:ring-1 focus:ring-teal"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1">Peran Jabatan:</label>
                    <input
                      type="text"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      placeholder="Junior Developer"
                      className="w-full px-3 py-1.5 bg-parchment border border-muted/50 rounded text-xs text-ink focus:outline-none focus:ring-1 focus:ring-teal"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1">Departemen:</label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="Divisi Antarmuka"
                      className="w-full px-3 py-1.5 bg-parchment border border-muted/50 rounded text-xs text-ink focus:outline-none focus:ring-1 focus:ring-teal"
                    />
                  </div>
                </div>

                {/* Pemilihan Avatar Pixel Art */}
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Pilih Avatar Pegawai:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {AVATAR_OPTIONS.map((av) => (
                      <button
                        key={av.id}
                        type="button"
                        onClick={() => setSelectedAvatar(av.path)}
                        className={`p-1.5 rounded border text-center flex flex-col items-center gap-1 transition-colors ${
                          selectedAvatar === av.path
                            ? 'border-teal bg-teal/15 shadow-xs font-bold'
                            : 'border-[#d1c7b5] bg-parchment hover:bg-sand'
                        }`}
                      >
                        <div className="w-8 h-8 rounded overflow-hidden">
                          <img
                            src={av.path}
                            alt={av.name}
                            className="w-full h-full object-contain scale-[1.9] pixelated"
                          />
                        </div>
                        <span className="text-[10px] leading-tight text-ink">{av.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2 bg-teal text-soft rounded text-xs font-bold hover:bg-teal-dark transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-xs mt-2"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  {isLoading ? 'Mendaftarkan...' : 'Terbitkan ID Karyawan'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
