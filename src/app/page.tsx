"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LogIn, Sparkles, Eye, Calendar, Clock, User, ArrowRight, ArrowLeft, Star, Heart, Moon, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ─── TYPES & DATA ───────────────────────────────────────────────

type ReadingPackage = {
  id: string;
  name: string;
  cards: number;
  icon: React.ReactNode;
  desc: string;
};

const PACKAGES: ReadingPackage[] = [
  { id: "standard", name: "Standart Açılım", cards: 3, icon: <Sparkles className="w-5 h-5" />, desc: "Geçmiş, Şimdi ve Gelecek üzerine genel bir bakış." },
  { id: "synastry", name: "İlişki / Sinastri", cards: 7, icon: <Heart className="w-5 h-5" />, desc: "İki kişi arasındaki dinamiği ve uyumu analiz eder." },
  { id: "celtic", name: "Kelt Haçı", cards: 10, icon: <Star className="w-5 h-5" />, desc: "Derinlemesine ve kapsamlı bir durum analizi." },
  { id: "astrological", name: "Astrolojik 12 Ev", cards: 12, icon: <Moon className="w-5 h-5" />, desc: "Yılın 12 ayına veya hayatın 12 alanına detaylı bakış." },
];

function calculateSoulCard(date: Date): { number: number; name: string } {
  const d = date.getDate();
  const m = date.getMonth() + 1;
  const y = date.getFullYear();
  const digits = `${d}${m}${y}`.split('').map(Number);
  let sum = digits.reduce((a, b) => a + b, 0);
  while (sum > 21) {
    sum = String(sum).split('').map(Number).reduce((a, b) => a + b, 0);
  }
  if (sum === 1) sum = 10;
  const majorArcana = [
    "The Fool", "The Magician", "The High Priestess", "The Empress", "The Emperor",
    "The Hierophant", "The Lovers", "The Chariot", "Strength", "The Hermit",
    "Wheel of Fortune", "Justice", "The Hanged Man", "Death", "Temperance",
    "The Devil", "The Tower", "The Star", "The Moon", "The Sun",
    "Judgement", "The World"
  ];
  return { number: sum, name: majorArcana[sum] };
}

function calculatePersonalityCard(day: number): { number: number; name: string } {
  let num = day;
  while (num > 21) {
    num = String(num).split('').map(Number).reduce((a, b) => a + b, 0);
  }
  const majorArcana = [
    "The Fool", "The Magician", "The High Priestess", "The Empress", "The Emperor",
    "The Hierophant", "The Lovers", "The Chariot", "Strength", "The Hermit",
    "Wheel of Fortune", "Justice", "The Hanged Man", "Death", "Temperance",
    "The Devil", "The Tower", "The Star", "The Moon", "The Sun",
    "Judgement", "The World"
  ];
  return { number: num, name: majorArcana[num] };
}

// ─── FLOATING PARTICLES ─────────────────────────────────────────
function Particles() {
  const dots = useMemo(() => Array.from({ length: 40 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    delay: Math.random() * 5,
    duration: Math.random() * 8 + 10,
  })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {dots.map(dot => (
        <motion.div
          key={dot.id}
          className="absolute rounded-full bg-accent/30"
          style={{ left: `${dot.x}%`, top: `${dot.y}%`, width: dot.size, height: dot.size }}
          animate={{
            y: [0, -60, 0],
            opacity: [0.2, 0.6, 0.2],
          }}
          transition={{
            duration: dot.duration,
            delay: dot.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// ─── MAIN CONTENT ───────────────────────────────────────────────
function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRoom = searchParams.get('room');

  const [step, setStep] = useState<string>(initialRoom ? "client_step1_name" : "welcome");
  const [roomId, setRoomId] = useState(initialRoom || "");
  const [clientName, setClientName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [selectedPackage, setSelectedPackage] = useState<string>("");

  useEffect(() => {
    if (initialRoom) {
      setRoomId(initialRoom);
      setStep("client_step1_name");
    }
  }, [initialRoom]);

  const handleConsultantLogin = () => {
    const newRoomId = "tarot-" + Math.random().toString(36).substring(2, 6);
    router.push(`/room/${newRoomId}?role=consultant`);
  };

  const submitRoomInput = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomId.trim()) setStep("client_step1_name");
  };

  const submitClientForm = () => {
    if (!roomId || !clientName || !birthDate || !selectedPackage) return;
    const pkg = PACKAGES.find(p => p.id === selectedPackage);
    const cardCount = pkg ? pkg.cards : 3;
    const params = new URLSearchParams();
    params.set("role", "client");
    params.set("name", clientName);
    params.set("birth", birthDate);
    if (birthTime) params.set("time", birthTime);
    params.set("pkgId", selectedPackage);
    params.set("cards", String(cardCount));
    router.push(`/room/${roomId}?${params.toString()}`);
  };

  // Total steps for the progress dots (client flow)
  const stepIndex = step === "room_input" ? 0
    : step === "client_step1_name" ? 1
      : step === "client_step2_birth" ? 2
        : step === "client_step3_package" ? 3 : -1;

  // ─── INPUT STYLE ────────────────────────────────────────────────
  const inputClass = "w-full bg-surface border border-border rounded-xl px-5 py-4 text-text placeholder:text-text-muted/40 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/20 transition-all text-base";
  const btnPrimary = "w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-purple-500/80 to-indigo-500/70 text-white/90 rounded-xl font-semibold tracking-wide transition-all hover:brightness-105 hover:shadow-lg hover:shadow-purple-500/10 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none";
  const backBtn = "text-text-muted hover:text-accent transition-colors flex items-center gap-2 text-xs uppercase tracking-[0.15em] font-semibold mb-6";

  // ─── WELCOME ────────────────────────────────────────────────────
  const renderWelcome = () => (
    <motion.div key="welcome" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-5">
      <div className="text-center space-y-2 mb-8">
        <p className="text-sm text-text-muted">Nasıl devam etmek istersiniz?</p>
      </div>

      <button
        onClick={handleConsultantLogin}
        className="group w-full relative overflow-hidden rounded-xl border border-accent/10 bg-surface p-5 flex items-center gap-5 transition-all hover:border-accent/25 hover:bg-accent-dim/60"
      >
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-400/60 to-indigo-500/50 flex items-center justify-center shrink-0 shadow-md shadow-purple-400/10">
          <Shield className="w-5 h-5 text-white/80" />
        </div>
        <div className="text-left flex-1">
          <h3 className="text-base font-semibold text-text">Danışman Girişi</h3>
          <p className="text-xs text-text-muted mt-0.5">Yeni bir fal odası oluştur ve okumaya başla.</p>
        </div>
        <ArrowRight className="w-5 h-5 text-text-muted group-hover:text-accent transition-colors" />
      </button>

      <button
        onClick={() => setStep("room_input")}
        className="group w-full relative overflow-hidden rounded-xl border border-gold/10 bg-surface p-5 flex items-center gap-5 transition-all hover:border-gold/25 hover:bg-gold-dim/60"
      >
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-400/50 to-yellow-500/40 flex items-center justify-center shrink-0 shadow-md shadow-amber-400/10">
          <User className="w-5 h-5 text-white/80" />
        </div>
        <div className="text-left flex-1">
          <h3 className="text-base font-semibold text-text">Müşteri Girişi</h3>
          <p className="text-xs text-text-muted mt-0.5">Oda kodunu girerek danışmanına bağlan.</p>
        </div>
        <ArrowRight className="w-5 h-5 text-text-muted group-hover:text-gold transition-colors" />
      </button>
    </motion.div>
  );

  // ─── ROOM INPUT ─────────────────────────────────────────────────
  const renderRoomInput = () => (
    <motion.div key="room_input" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
      <button onClick={() => setStep("welcome")} className={backBtn}>
        <ArrowLeft className="w-4 h-4" /> Geri
      </button>
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-2xl font-heading text-text">Odaya Katıl</h2>
        <p className="text-sm text-text-muted">Danışmanınızın paylaştığı oda kodunu girin.</p>
      </div>
      <form onSubmit={submitRoomInput} className="space-y-4">
        <input
          type="text"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          placeholder="Oda ID (Örn: tarot-a1b2)"
          className={inputClass + " text-center font-mono text-lg"}
          required
        />
        <button type="submit" disabled={!roomId.trim()} className={btnPrimary}>
          Devam Et <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </motion.div>
  );

  // ─── STEP 1: NAME ───────────────────────────────────────────────
  const renderClientStep1 = () => (
    <motion.div key="client_step1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
      {!initialRoom && (
        <button onClick={() => setStep("room_input")} className={backBtn}>
          <ArrowLeft className="w-4 h-4" /> Geri
        </button>
      )}
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-2xl font-heading text-text">Sizi Tanıyalım</h2>
        <p className="text-sm text-text-muted">Danışmanınıza nasıl hitap edeceğini bildirin.</p>
      </div>
      <div className="space-y-4">
        <input
          type="text"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          placeholder="Adınız Soyadınız"
          className={inputClass}
        />
        <button onClick={() => setStep("client_step2_birth")} disabled={!clientName.trim()} className={btnPrimary}>
          İleri <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );

  // ─── STEP 2: BIRTH ──────────────────────────────────────────────
  const renderClientStep2 = () => (
    <motion.div key="client_step2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
      <button onClick={() => setStep("client_step1_name")} className={backBtn}>
        <ArrowLeft className="w-4 h-4" /> Geri
      </button>
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-2xl font-heading text-text">Doğum Bilgileri</h2>
        <p className="text-sm text-text-muted">Evrensel enerjinizi hesaplamak için.</p>
      </div>
      <div className="space-y-4">
        <div>
          <label className="flex items-center gap-2 text-xs font-semibold text-text-muted mb-2 ml-1">
            <Calendar className="w-3.5 h-3.5 text-accent" /> Doğum Tarihi
          </label>
          <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="flex items-center gap-2 text-xs font-semibold text-text-muted mb-2 ml-1">
            <Clock className="w-3.5 h-3.5 text-accent" /> Doğum Saati <span className="text-text-muted/50 font-normal">(İsteğe bağlı)</span>
          </label>
          <input type="time" value={birthTime} onChange={(e) => setBirthTime(e.target.value)} className={inputClass} />
        </div>

        {birthDate && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="grid grid-cols-2 gap-3 pt-2">
            <div className="bg-accent-dim border border-accent/15 rounded-xl p-4 text-center">
              <p className="text-[10px] text-accent uppercase tracking-[0.15em] font-bold mb-1.5">Ruh Kartı</p>
              <p className="text-sm font-heading font-bold text-text">{calculateSoulCard(new Date(birthDate)).name}</p>
            </div>
            <div className="bg-gold-dim border border-gold/15 rounded-xl p-4 text-center">
              <p className="text-[10px] text-gold uppercase tracking-[0.15em] font-bold mb-1.5">Kişilik Kartı</p>
              <p className="text-sm font-heading font-bold text-text">{calculatePersonalityCard(new Date(birthDate).getDate()).name}</p>
            </div>
          </motion.div>
        )}

        <button onClick={() => setStep("client_step3_package")} disabled={!birthDate} className={btnPrimary + " mt-2"}>
          İleri <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );

  // ─── STEP 3: PACKAGE ────────────────────────────────────────────
  const renderClientStep3 = () => (
    <motion.div key="client_step3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
      <button onClick={() => setStep("client_step2_birth")} className={backBtn}>
        <ArrowLeft className="w-4 h-4" /> Geri
      </button>
      <div className="text-center space-y-2 mb-6">
        <h2 className="text-2xl font-heading text-text">Fal Paketi</h2>
        <p className="text-sm text-text-muted">İhtiyacınıza uygun açılımı seçin.</p>
      </div>

      <div className="space-y-3">
        {PACKAGES.map((pkg) => (
          <button
            key={pkg.id}
            onClick={() => setSelectedPackage(pkg.id)}
            className={`w-full text-left p-4 rounded-xl border transition-all flex gap-4 items-center group
              ${selectedPackage === pkg.id
                ? "bg-accent-dim border-accent/40 ring-1 ring-accent/30"
                : "bg-surface border-border hover:border-accent/25 hover:bg-accent-dim/50"
              }`}
          >
            <div className={`p-2.5 rounded-lg transition-colors ${selectedPackage === pkg.id ? "bg-accent/20 text-accent" : "bg-card text-text-muted group-hover:text-accent"}`}>
              {pkg.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-text flex items-center justify-between gap-2">
                <span className="truncate">{pkg.name}</span>
                <span className="text-[10px] font-mono bg-card px-2 py-0.5 rounded-md border border-border text-text-muted shrink-0">
                  {pkg.cards} Kart
                </span>
              </h3>
              <p className="text-[11px] text-text-muted mt-1 leading-relaxed">{pkg.desc}</p>
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={submitClientForm}
        disabled={!selectedPackage}
        className="w-full flex items-center justify-center gap-3 px-6 py-4 mt-6 bg-gradient-to-r from-gold/80 to-amber-400/70 text-black/80 font-bold rounded-xl tracking-wide transition-all hover:brightness-105 hover:shadow-lg hover:shadow-gold/10 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none"
      >
        Fal Başlasın <Sparkles className="w-5 h-5" />
      </button>
    </motion.div>
  );

  // ─── PROGRESS DOTS ──────────────────────────────────────────────
  const renderProgress = () => {
    if (stepIndex < 0) return null;
    return (
      <div className="flex justify-center gap-2 mt-8">
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-500 ${i === stepIndex ? "w-8 bg-accent" : i < stepIndex ? "w-3 bg-accent/50" : "w-3 bg-border"
              }`}
          />
        ))}
      </div>
    );
  };

  // ─── LAYOUT ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-bg text-text flex relative overflow-hidden font-inter">
      {/* Background Effects — soft, diffused */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] bg-purple-400/4 rounded-full blur-[200px]" />
        <div className="absolute bottom-[-5%] right-[20%] w-[500px] h-[500px] bg-amber-300/3 rounded-full blur-[180px]" />
        <div className="absolute top-[40%] right-[40%] w-[400px] h-[400px] bg-indigo-400/3 rounded-full blur-[200px]" />
      </div>
      <Particles />

      {/* LEFT: Decorative Hero Panel (hidden on mobile) */}
      <div className="hidden lg:flex flex-col justify-center items-center flex-1 relative z-10 p-12">
        {/* Floating tarot card visuals */}
        <motion.div
          animate={{ y: [0, -12, 0], rotate: [-2, 2, -2] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="relative w-48 h-72 rounded-2xl bg-gradient-to-br from-purple-800/60 to-indigo-900/50 border border-accent/15 shadow-xl shadow-purple-800/15 mb-8 overflow-hidden"
        >
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-overlay" />
          <div className="absolute inset-2 border border-gold/15 rounded-xl flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-3/4 h-3/4 text-gold/60">
              <circle fill="none" stroke="currentColor" strokeWidth="0.5" cx="50" cy="50" r="46" />
              <circle fill="none" stroke="currentColor" strokeWidth="0.5" cx="50" cy="50" r="42" strokeDasharray="2 4" opacity="0.4" />
              <path fill="currentColor" opacity="0.6" d="M60 25 A 25 25 0 1 0 75 70 A 30 30 0 1 1 60 25 Z" />
              <path fill="currentColor" d="M70 30 L72 35 L77 37 L72 39 L70 44 L68 39 L63 37 L68 35 Z" opacity="0.5" transform="scale(0.5) translate(70, 0)" />
            </svg>
          </div>
        </motion.div>

        {/* Second floating card behind */}
        <motion.div
          animate={{ y: [0, 8, 0], rotate: [5, 0, 5] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-1/3 left-[15%] w-32 h-48 rounded-xl bg-gradient-to-br from-purple-700/25 to-indigo-800/20 border border-accent/8 shadow-lg opacity-50 -rotate-12"
        />
        <motion.div
          animate={{ y: [0, -8, 0], rotate: [-3, 1, -3] }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 3 }}
          className="absolute bottom-1/4 right-[12%] w-36 h-52 rounded-xl bg-gradient-to-br from-amber-700/15 to-purple-900/15 border border-gold/8 shadow-lg opacity-35 rotate-6"
        />

        <div className="text-center relative z-10">
          <h1 className="text-5xl font-heading font-semibold text-text leading-tight">
            Mystic<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-purple-300/80">Tarot</span>
          </h1>
          <p className="text-text-muted text-sm mt-4 max-w-xs mx-auto leading-relaxed">
            Profesyonel tarot danışmanlık platformu. Gerçek zamanlı okuma, video görüşme ve interaktif kart masası.
          </p>
          <div className="flex items-center justify-center gap-6 mt-8 text-text-muted/40 text-[10px] uppercase tracking-[0.2em]">
            <span>Video Görüşme</span>
            <span className="w-1 h-1 rounded-full bg-accent/20" />
            <span>Gerçek Zamanlı</span>
            <span className="w-1 h-1 rounded-full bg-accent/20" />
            <span>Güvenli</span>
          </div>
        </div>
      </div>

      {/* RIGHT: Form Panel */}
      <div className="w-full lg:w-[480px] lg:min-w-[480px] flex flex-col justify-center items-center p-6 sm:p-10 relative z-10">
        {/* Mobile logo */}
        <div className="lg:hidden text-center mb-10">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-400/50 to-indigo-500/40 flex items-center justify-center shadow-lg shadow-purple-400/10">
            <Sparkles className="w-7 h-7 text-white/70" />
          </div>
          <h1 className="text-3xl font-heading text-text">Mystic Tarot</h1>
          <p className="text-xs text-text-muted mt-1">Profesyonel Danışmanlık</p>
        </div>

        <div className="w-full max-w-sm">
          <div className="glass rounded-2xl p-7 sm:p-8 relative overflow-hidden noise animate-glow">
            <div className="relative z-10">
              <AnimatePresence mode="wait">
                {step === "welcome" && renderWelcome()}
                {step === "room_input" && renderRoomInput()}
                {step === "client_step1_name" && renderClientStep1()}
                {step === "client_step2_birth" && renderClientStep2()}
                {step === "client_step3_package" && renderClientStep3()}
              </AnimatePresence>
            </div>
          </div>

          {renderProgress()}

          <p className="text-center text-[10px] text-text-muted/40 tracking-[0.15em] uppercase mt-8">
            Şifreli Bağlantı · Gerçek Zamanlı
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg flex items-center justify-center"><div className="w-8 h-8 rounded-full border-t-2 border-accent animate-spin" /></div>}>
      <HomeContent />
    </Suspense>
  );
}
