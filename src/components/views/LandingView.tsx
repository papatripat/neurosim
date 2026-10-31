import React, { useState } from 'react';
import {
  Play,
  Shirt,
  ShieldCheck,
  Sparkles,
  Compass,
  ArrowRight,
  CheckCircle2,
  Award,
  LogIn,
} from 'lucide-react';
import { UserProfile } from '../modals/AuthModal';
import { CharacterCustomization, CharacterDirection } from '../../types/character';
import { CharacterCanvasPreview } from '../character/CharacterCanvasPreview';

interface Props {
  currentUser: UserProfile | null;
  characterConfig: CharacterCustomization;
  onEnterDashboard: () => void;
  onEnterSimulation: () => void;
  onOpenCustomizer: () => void;
  onOpenAuth: () => void;
  onOpenProposal?: () => void;
}

export const LandingView: React.FC<Props> = ({
  currentUser,
  characterConfig,
  onEnterDashboard,
  onEnterSimulation,
  onOpenCustomizer,
  onOpenAuth,
}) => {
  const [previewDirection, setPreviewDirection] = useState<CharacterDirection>('south');

  return (
    <div className="w-full h-full overflow-y-auto bg-sand/30 text-ink select-none flex flex-col">
      {/* Top Navigation Bar */}
      <nav className="flex-shrink-0 flex items-center justify-between px-6 py-4 bg-cream border-b border-[#d1c7b5] sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg overflow-hidden bg-cream border border-teal/30 flex items-center justify-center shadow-xs">
            <img src="/logo.webp" alt="Logo NeuroSim" className="w-full h-full object-contain" />
          </div>
          <div>
            <span className="font-bold text-base tracking-tight text-ink block leading-tight font-serif">
              NeuroSim
            </span>
            <span className="text-[11px] text-teal font-semibold block leading-tight">
              Virtual Office AI Simulator
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenCustomizer}
            className="text-xs font-semibold text-ink hover:text-teal transition-colors px-3 py-1.5 rounded border border-[#d1c7b5] bg-cream hover:bg-sand flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Shirt className="w-3.5 h-3.5 text-teal" />
            <span className="hidden md:inline">Kustomisasi Karakter</span>
          </button>

          {currentUser ? (
            <button
              type="button"
              onClick={onEnterDashboard}
              className="px-4 py-2 rounded-lg bg-teal hover:bg-teal-dark text-soft text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <span>Dashboard ({currentUser.fullName ? currentUser.fullName.split(' ')[0] : currentUser.username})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onOpenAuth}
                className="px-3.5 py-1.5 rounded-lg border border-teal text-teal hover:bg-teal/10 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Masuk ID Karyawan</span>
              </button>
              <button
                type="button"
                onClick={onEnterSimulation}
                className="px-4 py-2 rounded-lg bg-teal hover:bg-teal-dark text-soft text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Mulai Simulasi Tamu</span>
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16 flex flex-col lg:flex-row items-center gap-10 lg:gap-14">
        {/* Left: Text & Content */}
        <div className="flex-1 space-y-5 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal/10 border border-teal/20 text-teal text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Simulasi Ruang Kerja & Evaluasi Objektif</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-ink leading-[1.18] font-serif tracking-tight">
            Ruang Latihan Komunikasi Kerja{' '}
            <span className="text-teal underline decoration-ochre underline-offset-4">
              di Kantor Virtual 2D
            </span>
          </h1>

          <p className="text-sm sm:text-base text-ink-muted leading-relaxed max-w-2xl">
            Simulasi interaktif untuk mengasah komunikasi di lingkungan kerja secara mandiri.
            Latih kesiapanmu menghadapi instruksi atasan, obrolan santai di pantry, hingga
            negosiasi tugas bersama karakter AI dengan panduan percakapan yang adaptif.
          </p>

          {/* Action CTAs */}
          <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-3">
            {currentUser ? (
              <button
                type="button"
                onClick={onEnterDashboard}
                className="px-6 py-3 rounded-xl bg-teal hover:bg-teal-dark text-soft font-bold text-sm sm:text-base transition-all shadow-md hover:shadow-lg flex items-center gap-2.5 transform hover:-translate-y-0.5 cursor-pointer"
              >
                <span>Buka Dashboard Karyawan</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenAuth}
                className="px-6 py-3 rounded-xl bg-teal hover:bg-teal-dark text-soft font-bold text-sm sm:text-base transition-all shadow-md hover:shadow-lg flex items-center gap-2.5 transform hover:-translate-y-0.5 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Masuk Portal Karyawan</span>
              </button>
            )}

            <button
              type="button"
              onClick={onEnterSimulation}
              className="px-5 py-3 rounded-xl bg-cream hover:bg-sand border-2 border-teal text-teal font-bold text-sm sm:text-base transition-all shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Jelajahi Kantor 2D Langsung</span>
            </button>
          </div>

          {/* 3 Standout Project Pillars */}
          <div className="pt-6 sm:pt-8 flex flex-wrap items-center justify-center lg:justify-start gap-y-2.5 gap-x-6 text-xs text-ink-muted font-medium">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Denah Kantor 2D Interaktif</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Panduan Percakapan 3 Level AI</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Evaluasi Objektif & Riwayat Terdata</span>
            </div>
          </div>
        </div>

        {/* Right: Interactive Character Canvas Card Preview */}
        <div className="w-full sm:w-80 lg:w-96 flex flex-col items-center flex-shrink-0">
          <div className="w-full bg-cream border-2 border-[#b5aa94] rounded-2xl p-5 shadow-xl relative overflow-hidden flex flex-col items-center">
            <div className="absolute top-3 left-3 text-[10px] font-bold text-teal bg-teal/10 px-2 py-0.5 rounded border border-teal/20">
              AVATAR AKTIF
            </div>

            <CharacterCanvasPreview
              config={characterConfig}
              direction={previewDirection}
              onChangeDirection={setPreviewDirection}
              className="my-3"
            />

            <div className="text-center w-full mt-1">
              <span className="font-bold text-sm text-ink block">{characterConfig.name}</span>
              <span className="text-xs text-ink-muted block mt-0.5">
                {characterConfig.gender === 'male' ? 'Karyawan Pria' : 'Karyawan Wanita'}
              </span>
            </div>

            <button
              type="button"
              onClick={onOpenCustomizer}
              className="w-full mt-4 py-2.5 px-4 rounded-xl bg-sand hover:bg-[#d8ccb8] border border-[#b5aa94] text-xs font-bold text-ink transition-colors flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
            >
              <Shirt className="w-4 h-4 text-teal" />
              <span>Ubah Tampilan Karakter</span>
            </button>
          </div>
        </div>
      </section>

      {/* 4 Feature Pillars Grid */}
      <section className="bg-cream/80 border-y border-[#d1c7b5] py-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold text-teal tracking-wider uppercase">
              Fitur & Sistem Utama
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-ink font-serif">
              Dirancang Nyata untuk Kesiapan Komunikasi Kerja
            </h2>
            <p className="text-xs sm:text-sm text-ink-muted">
              Mulai dari navigasi kantor virtual 2D yang ramah sensori, simulasi dialog kontekstual bersama AI,
              hingga lembar evaluasi terukur yang membantu melihat perkembanganmu.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Pillar 1 */}
            <div className="p-5 rounded-xl bg-sand/40 border border-[#d1c7b5] flex flex-col space-y-3 shadow-xs">
              <div className="w-10 h-10 rounded-lg bg-teal text-soft flex items-center justify-center">
                <Compass className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-ink">Eksplorasi Kantor 2D Real-time</h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                Jelajahi berbagai zona kerja seperti Workstation, Ruang Rapat, Pantry, hingga AFK Lounge
                dengan pergerakan karakter responsif dan tata letak yang rapi.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="p-5 rounded-xl bg-sand/40 border border-[#d1c7b5] flex flex-col space-y-3 shadow-xs">
              <div className="w-10 h-10 rounded-lg bg-teal text-soft flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-ink">Simulasi Percakapan Berbasis Peran</h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                Berlatih langsung dengan Bu Rina (atasan), Dimas (rekan kerja), dan Pak Hendra (klien)
                didukung 3 tingkat bantuan dialog yang bisa disesuaikan dengan kebutuhanmu.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="p-5 rounded-xl bg-sand/40 border border-[#d1c7b5] flex flex-col space-y-3 shadow-xs">
              <div className="w-10 h-10 rounded-lg bg-teal text-soft flex items-center justify-center">
                <Shirt className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-ink">Kustomisasi Karakter Lengkap</h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                Pilih peran kerja, pakaian formal maupun santai, gaya rambut, dan aksesoris avatarmu
                dengan format standar Universal LPC yang tampil konsisten di denah kantor.
              </p>
            </div>

            {/* Pillar 4 */}
            <div className="p-5 rounded-xl bg-sand/40 border border-[#d1c7b5] flex flex-col space-y-3 shadow-xs">
              <div className="w-10 h-10 rounded-lg bg-teal text-soft flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-ink">Lembar Evaluasi Objektif</h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                Dapatkan umpan balik terperinci mengenai kejelasan pesan, pemahaman konteks, serta batasan profesional,
                lengkap dengan riwayat latihan yang tersimpan.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Developer Info Footer */}
      <footer className="mt-auto px-6 py-6 bg-cream border-t border-[#d1c7b5] text-xs text-ink-muted">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal" />
            <span className="font-semibold text-ink">
              NEUROSIM © 2026
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <span>Priyoga Listyo Ananda (Game Engine)</span>
            <span>·</span>
            <span>Rifat Abhista (Backend & AI)</span>
            <span>·</span>
            <span>Baginda Putra Krista (UI/UX & Accessibility)</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
