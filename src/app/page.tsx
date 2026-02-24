"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LogIn, Sparkles, Eye, Calendar, Clock, User, ArrowRight, ArrowLeft, Star, Heart, Moon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── TYPES & DATA ───────────────────────────────────────────────

type ReadingPackage = {
  id: string;
  name: string;
  cards: number;
  icon: React.ReactNode;
  desc: string;
};

const PACKAGES: ReadingPackage[] = [
  { id: "standard", name: "Standart Açılım", cards: 3, icon: <Sparkles className="w-5 h-5 text-purple-400" />, desc: "Geçmiş, Şimdi ve Gelecek üzerine genel bir bakış." },
  { id: "synastry", name: "İlişki / Sinastri", cards: 7, icon: <Heart className="w-5 h-5 text-rose-400" />, desc: "İki kişi arasındaki dinamiği ve uyumu analiz eder." },
  { id: "celtic", name: "Kelt Haçı", cards: 10, icon: <Star className="w-5 h-5 text-amber-400" />, desc: "Derinlemesine ve kapsamlı bir durum analizi." },
  { id: "astrological", name: "Astrolojik 12 Ev", cards: 12, icon: <Moon className="w-5 h-5 text-indigo-400" />, desc: "Yılın 12 ayına veya hayatın 12 alanına detaylı bakış." },
];

// Soul Card calculation from the PDFs
function calculateSoulCard(date: Date): { number: number; name: string } {
  const d = date.getDate();
  const m = date.getMonth() + 1;
  const y = date.getFullYear();
  const digits = `${d}${m}${y}`.split('').map(Number);
  let sum = digits.reduce((a, b) => a + b, 0);
  while (sum > 21) {
    sum = String(sum).split('').map(Number).reduce((a, b) => a + b, 0);
  }
  if (sum === 1) sum = 10; // Soul card can't be 1 (Magician) per the PDFs
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

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRoom = searchParams.get('room');

  // Flow State
  // "welcome" | "room_input" | "client_step1_name" | "client_step2_birth" | "client_step3_package"
  const [step, setStep] = useState<string>(initialRoom ? "client_step1_name" : "welcome");

  // Form Data
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

  // ─── HANDLERS ───────────────────────────────────────────────────

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

    // Find the number of cards for the selected package
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

  // ─── RENDERERS ──────────────────────────────────────────────────

  const renderWelcome = () => (
    <motion.div key="welcome" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }} className="space-y-8">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-black tracking-widest text-white uppercase drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">Gate of Insight</h2>
        <p className="text-sm text-ethereal/60 font-medium tracking-wide">Choose your path into the unknown.</p>
      </div>

      <div className="grid gap-4">
        <button
          onClick={handleConsultantLogin}
          className="group relative w-full flex flex-col items-center justify-center p-8 bg-gradient-to-br from-royal/40 to-black border border-white/10 rounded-3xl overflow-hidden hover:border-gold/50 transition-all duration-500 shadow-2xl"
        >
          <div className="absolute inset-0 bg-gold/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500">
            <Eye className="w-8 h-8 text-gold drop-shadow-glow" />
          </div>
          <span className="text-xl font-black text-white tracking-[0.2em] uppercase">The Oracle</span>
          <span className="text-[10px] text-gold-light/40 font-bold uppercase tracking-widest mt-2 group-hover:text-gold transition-colors">Start Reading</span>
        </button>

        <button
          onClick={() => setStep("room_input")}
          className="group relative w-full flex flex-col items-center justify-center p-8 bg-gradient-to-br from-black to-white/5 border border-white/10 rounded-3xl overflow-hidden hover:border-ethereal/50 transition-all duration-500 shadow-xl"
        >
          <div className="absolute inset-0 bg-ethereal/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500">
            <User className="w-8 h-8 text-ethereal drop-shadow-glow" />
          </div>
          <span className="text-xl font-black text-white tracking-[0.2em] uppercase">The Seeker</span>
          <span className="text-[10px] text-ethereal/40 font-bold uppercase tracking-widest mt-2 group-hover:text-ethereal transition-colors">Enter a Room</span>
        </button>
      </div>
    </motion.div>
  );

  const renderRoomInput = () => (
    <motion.div key="room_input" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="space-y-10">
      <button onClick={() => setStep("welcome")} className="text-ethereal/60 hover:text-white transition-colors flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
        <ArrowLeft className="w-4 h-4" /> Go Back
      </button>
      <div className="text-center space-y-3">
        <h2 className="text-4xl font-black tracking-widest text-white uppercase">Summon Table</h2>
        <p className="text-xs text-ethereal/50 font-medium tracking-wide">Speak the Secret ID of your Oracle.</p>
      </div>
      <form onSubmit={submitRoomInput} className="space-y-8">
        <input
          type="text"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          placeholder="TAROT-XXXX"
          className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-6 text-center placeholder:text-white/20 focus:outline-none focus:border-gold/50 transition-all font-mono text-2xl text-gold tracking-[0.2em] shadow-inner"
          required
        />
        <button
          type="submit"
          className="w-full flex items-center justify-center gap-4 px-8 py-5 bg-gradient-to-r from-gold to-gold-light text-black rounded-full font-black tracking-[0.2em] uppercase text-sm shadow-xl shadow-gold/20 hover:scale-[1.02] active:scale-95 transition-all"
        >
          Invoke Presence
          <ArrowRight className="w-5 h-5" />
        </button>
      </form>
    </motion.div>
  );

  const renderClientStep1 = () => (
    <motion.div key="client_step1" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="space-y-10">
      {!initialRoom && (
        <button onClick={() => setStep("room_input")} className="text-ethereal/60 hover:text-white transition-colors flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
          <ArrowLeft className="w-4 h-4" /> Go Back
        </button>
      )}
      <div className="text-center space-y-3">
        <h2 className="text-4xl font-black tracking-widest text-white uppercase">Your Identity</h2>
        <p className="text-xs text-ethereal/50 font-medium tracking-wide">The cards must know who they speak for.</p>
      </div>
      <div className="space-y-8">
        <input
          type="text"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          placeholder="FULL NAME"
          className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-center placeholder:text-white/20 focus:outline-none focus:border-ethereal/50 transition-all text-xl text-white tracking-widest uppercase"
        />
        <button
          onClick={() => setStep("client_step2_birth")}
          disabled={!clientName.trim()}
          className="w-full flex items-center justify-center gap-4 px-8 py-5 bg-ethereal text-black rounded-full font-black tracking-[0.2em] uppercase text-sm shadow-xl shadow-ethereal/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-20 disabled:scale-100"
        >
          Reveal More
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );

  const renderClientStep2 = () => (
    <motion.div key="client_step2" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="space-y-10">
      <button onClick={() => setStep("client_step1_name")} className="text-ethereal/60 hover:text-white transition-colors flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
        <ArrowLeft className="w-4 h-4" /> Go Back
      </button>
      <div className="text-center space-y-3">
        <h2 className="text-4xl font-black tracking-widest text-white uppercase">Stellar Alignment</h2>
        <p className="text-xs text-ethereal/50 font-medium tracking-wide">Sync your temporal origin with the stars.</p>
      </div>
      <div className="space-y-6">
        <div className="space-y-3">
          <label className="flex items-center gap-3 text-[10px] font-black tracking-widest text-gold uppercase ml-1">
            <Calendar className="w-4 h-4" /> Birth Date
          </label>
          <input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-lg text-white appearance-none focus:outline-none focus:border-gold/40 transition-all uppercase tracking-widest"
          />
        </div>
        <div className="space-y-3">
          <label className="flex items-center gap-3 text-[10px] font-black tracking-widest text-gold uppercase ml-1">
            <Clock className="w-4 h-4" /> Birth Time (Optional)
          </label>
          <input
            type="time"
            value={birthTime}
            onChange={(e) => setBirthTime(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-lg text-white appearance-none focus:outline-none focus:border-gold/40 transition-all"
          />
        </div>

        {birthDate && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 gap-4 pt-4">
            <div className="bg-royal/30 border border-royal/50 rounded-2xl p-4 text-center">
              <p className="text-[9px] text-ethereal font-black tracking-widest uppercase mb-1">Soul Card</p>
              <p className="text-xs font-heading font-bold text-white tracking-widest">{calculateSoulCard(new Date(birthDate)).name}</p>
            </div>
            <div className="bg-crimson/10 border border-crimson/20 rounded-2xl p-4 text-center">
              <p className="text-[9px] text-rose-400 font-black tracking-widest uppercase mb-1">Personality</p>
              <p className="text-xs font-heading font-bold text-white tracking-widest">{calculatePersonalityCard(new Date(birthDate).getDate()).name}</p>
            </div>
          </motion.div>
        )}

        <button
          onClick={() => setStep("client_step3_package")}
          disabled={!birthDate}
          className="w-full flex items-center justify-center gap-4 px-8 py-5 mt-4 bg-ethereal text-black rounded-full font-black tracking-[0.2em] uppercase text-sm shadow-xl shadow-ethereal/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-20"
        >
          Proceed to Draw
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );

  const renderClientStep3 = () => (
    <motion.div key="client_step3" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }} className="space-y-8">
      <button onClick={() => setStep("client_step2_birth")} className="text-ethereal/60 hover:text-white transition-colors flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
        <ArrowLeft className="w-4 h-4" /> Go Back
      </button>
      <div className="text-center space-y-3">
        <h2 className="text-4xl font-black tracking-widest text-white uppercase">Fate Chosen</h2>
        <p className="text-xs text-ethereal/50 font-medium tracking-wide">Select the complexity of your revelation.</p>
      </div>

      <div className="grid gap-4">
        {PACKAGES.map((pkg) => (
          <button
            key={pkg.id}
            onClick={() => setSelectedPackage(pkg.id)}
            className={`w-full text-left p-6 rounded-3xl border transition-all flex gap-5 items-center group relative overflow-hidden
              ${selectedPackage === pkg.id
                ? "bg-royal/30 border-gold shadow-[0_0_20px_rgba(197,160,89,0.2)]"
                : "bg-white/5 border-white/10 hover:border-white/30"
              }`}
          >
            {selectedPackage === pkg.id && (
              <div className="absolute inset-0 bg-gradient-to-r from-gold/10 to-transparent" />
            )}
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${selectedPackage === pkg.id ? "bg-gold/20" : "bg-white/5"}`}>
              {pkg.icon}
            </div>
            <div className="flex-1 relative z-10">
              <h3 className="text-sm font-black text-white tracking-widest uppercase flex items-center justify-between">
                {pkg.name}
                <span className="text-[9px] font-sans font-black px-2.5 py-1 rounded-full border border-white/10 text-gold-light bg-black/40">
                  {pkg.cards} CARDS
                </span>
              </h3>
              <p className="text-[10px] text-ethereal/60 mt-2 leading-relaxed tracking-wide font-medium">{pkg.desc}</p>
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={submitClientForm}
        disabled={!selectedPackage}
        className="group w-full flex items-center justify-center gap-4 px-8 py-6 mt-6 bg-gradient-to-r from-crimson to-royal text-white rounded-full font-black tracking-[0.3em] uppercase text-sm shadow-2xl shadow-royal/40 hover:scale-[1.05] active:scale-95 transition-all outline-none disabled:opacity-20"
      >
        <span>Begin Ceremony</span>
        <Sparkles className="w-5 h-5 group-hover:animate-spin" />
      </button>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 selection:bg-gold/30 relative overflow-hidden font-inter">

      {/* ─── IMMERSIVE ELEMENTS ─── */}
      <div className="nebula-bg" />
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-royal/10 rounded-full blur-[150px] animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-crimson/10 rounded-full blur-[150px] animate-pulse-slow" style={{ animationDelay: '2s' }} />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
        className="relative z-10 w-full max-w-lg"
      >
        {/* Header Logo Area */}
        {step === "welcome" && (
          <div className="text-center mb-16">
            <motion.div
              initial={{ scale: 0.5, rotate: -45, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
              className="w-24 h-24 mx-auto mb-8 relative"
            >
              <div className="absolute inset-0 bg-gold blur-3xl opacity-20 animate-pulse" />
              <div className="relative w-full h-full bg-gradient-to-tr from-royal to-black border-2 border-gold/50 rounded-[2.5rem] flex items-center justify-center shadow-[0_0_50px_rgba(197,160,89,0.3)]">
                <Sparkles className="w-12 h-12 text-gold animate-aurora" />
              </div>
            </motion.div>
            <h1 className="text-5xl font-black tracking-[0.3em] uppercase drop-shadow-2xl">
              Mystic Port
            </h1>
            <div className="flex items-center justify-center gap-4 mt-6">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-gold/30" />
              <p className="text-[10px] tracking-[0.5em] uppercase text-gold/60 font-black">Divine Intervention</p>
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-gold/30" />
            </div>
          </div>
        )}

        {/* Main Card Container */}
        <div className={cn(
          "transition-all duration-700",
          step === "welcome" ? "" : "bg-white/5 backdrop-blur-3xl rounded-[3rem] p-12 border border-white/10 shadow-2xl"
        )}>
          <AnimatePresence mode="wait">
            {step === "welcome" && renderWelcome()}
            {step === "room_input" && renderRoomInput()}
            {step === "client_step1_name" && renderClientStep1()}
            {step === "client_step2_birth" && renderClientStep2()}
            {step === "client_step3_package" && renderClientStep3()}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center space-y-4">
          <p className="text-[9px] text-white/20 font-black tracking-[0.4em] uppercase">
            Hyper-Real Encryption · 2026 Edition
          </p>
          <div className="flex justify-center gap-6 opacity-20">
            <Moon className="w-4 h-4" />
            <Star className="w-4 h-4" />
            <Heart className="w-4 h-4" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-midnight flex items-center justify-center"><div className="w-8 h-8 rounded-full border-t-2 border-purple-500 animate-spin"></div></div>}>
      <HomeContent />
    </Suspense>
  );
}
