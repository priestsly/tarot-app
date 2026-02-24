"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LogIn, Sparkles, Eye, Calendar, Clock, User, ArrowRight, ArrowLeft, Star, Heart, Moon } from "lucide-react";
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
  { id: "standard", name: "Standart Açılım", cards: 3, icon: <Sparkles className="w-5 h-5 text-teal-400" />, desc: "Geçmiş, Şimdi ve Gelecek üzerine genel bir bakış." },
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
    <motion.div key="welcome" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-6">
      <div className="text-center space-y-3 mb-8">
        <h2 className="text-2xl font-heading text-teal-100 uppercase tracking-widest">Hoş Geldiniz</h2>
        <p className="text-sm text-slate-400 font-light max-w-xs mx-auto">Lütfen giriş yapmak istediğiniz rolü seçin.</p>
      </div>

      <button
        onClick={handleConsultantLogin}
        className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-teal-500/10 text-teal-200 rounded-xl font-medium tracking-wide transition-all border border-teal-500/30 hover:bg-teal-500/20 hover:border-teal-400/50 hover:shadow-[0_0_20px_rgba(20,184,166,0.2)]"
      >
        <Eye className="w-5 h-5" />
        <span className="text-base font-heading uppercase tracking-widest">Danışman Girişi</span>
      </button>

      <div className="relative flex items-center">
        <div className="flex-grow border-t border-slate-700/50" />
        <span className="flex-shrink-0 mx-4 text-[10px] font-medium uppercase tracking-[0.2em] text-slate-500">veya</span>
        <div className="flex-grow border-t border-slate-700/50" />
      </div>

      <button
        onClick={() => setStep("room_input")}
        className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-[#030712]/60 text-slate-300 rounded-xl font-medium tracking-wide transition-all border border-slate-700/50 hover:bg-slate-800/60 hover:border-slate-600/50"
      >
        <User className="w-5 h-5" />
        <span className="text-base font-heading uppercase tracking-widest">Müşteri Girişi</span>
      </button>
    </motion.div>
  );

  const renderRoomInput = () => (
    <motion.div key="room_input" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-6">
      <button onClick={() => setStep("welcome")} className="text-slate-400 hover:text-white transition-colors flex items-center gap-2 text-xs uppercase tracking-widest mb-4">
        <ArrowLeft className="w-4 h-4" /> Geri
      </button>
      <div className="text-center space-y-2 mb-6">
        <h2 className="text-xl font-heading text-teal-100 uppercase tracking-widest">Odaya Katıl</h2>
        <p className="text-xs text-slate-400">Danışmanınızın size verdiği Oda ID'sini girin.</p>
      </div>
      <form onSubmit={submitRoomInput} className="space-y-4">
        <input
          type="text"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          placeholder="Oda ID (Örn: tarot-a1b2)"
          className="w-full bg-[#030712]/80 border border-slate-700/50 rounded-xl px-5 py-4 text-center placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-500/50 focus:border-teal-500/40 transition-all font-mono text-base text-slate-200"
          required
        />
        <button
          type="submit"
          disabled={!roomId.trim()}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-teal-500/10 text-teal-200 rounded-xl font-medium tracking-wide transition-all border border-teal-500/30 hover:bg-teal-500/20 disabled:opacity-25"
        >
          <span className="text-base font-heading uppercase tracking-widest">Devam Et</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </motion.div>
  );

  const renderClientStep1 = () => (
    <motion.div key="client_step1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-6">
      {!initialRoom && (
        <button onClick={() => setStep("room_input")} className="text-slate-400 hover:text-white transition-colors flex items-center gap-2 text-xs uppercase tracking-widest mb-4">
          <ArrowLeft className="w-4 h-4" /> Geri
        </button>
      )}
      <div className="text-center space-y-2 mb-6">
        <h2 className="text-xl font-heading text-teal-100 uppercase tracking-widest">Adım 1: Sizi Tanıyalım</h2>
        <p className="text-xs text-slate-400">Danışmanınızın size hitap edebilmesi için adınızı girin.</p>
      </div>
      <div className="space-y-4">
        <input
          type="text"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          placeholder="Adınız Soyadınız"
          className="w-full bg-[#030712]/80 border border-slate-700/50 rounded-xl px-5 py-4 text-center placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-500/50 focus:border-teal-500/40 transition-all text-base text-slate-200"
        />
        <button
          onClick={() => setStep("client_step2_birth")}
          disabled={!clientName.trim()}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-teal-500/10 text-teal-200 rounded-xl font-medium tracking-wide transition-all border border-teal-500/30 hover:bg-teal-500/20 disabled:opacity-25"
        >
          <span className="text-base font-heading uppercase tracking-widest">İleri</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );

  const renderClientStep2 = () => (
    <motion.div key="client_step2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-6">
      <button onClick={() => setStep("client_step1_name")} className="text-slate-400 hover:text-white transition-colors flex items-center gap-2 text-xs uppercase tracking-widest mb-4">
        <ArrowLeft className="w-4 h-4" /> Geri
      </button>
      <div className="text-center space-y-2 mb-6">
        <h2 className="text-xl font-heading text-teal-100 uppercase tracking-widest">Adım 2: Astroloji Profiliniz</h2>
        <p className="text-xs text-slate-400">Size en doğru Tarot ve Astroloji analizini yapabilmemiz için doğum bilgilerinizi girin.</p>
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-[10px] font-bold text-teal-400/80 uppercase tracking-[0.2em] ml-1">
            <Calendar className="w-3.5 h-3.5" /> Doğum Tarihi
          </label>
          <input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className="w-full bg-[#030712]/80 border border-slate-700/50 rounded-xl px-4 py-3.5 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500/50 focus:border-teal-500/40 transition-all font-mono [color-scheme:dark]"
          />
        </div>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-[10px] font-bold text-teal-400/80 uppercase tracking-[0.2em] ml-1">
            <Clock className="w-3.5 h-3.5" /> Doğum Saati (İsteğe Bağlı)
          </label>
          <input
            type="time"
            value={birthTime}
            onChange={(e) => setBirthTime(e.target.value)}
            className="w-full bg-[#030712]/80 border border-slate-700/50 rounded-xl px-4 py-3.5 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500/50 focus:border-teal-500/40 transition-all font-mono [color-scheme:dark]"
          />
        </div>

        {birthDate && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="flex gap-2 pt-2">
            <div className="flex-1 bg-teal-500/5 border border-teal-500/10 rounded-lg p-2 text-center">
              <p className="text-[8px] text-teal-400/60 uppercase tracking-widest font-bold">Ruh Kartı</p>
              <p className="text-sm font-heading font-bold text-teal-200">{calculateSoulCard(new Date(birthDate)).name}</p>
            </div>
            <div className="flex-1 bg-amber-500/5 border border-amber-500/10 rounded-lg p-2 text-center">
              <p className="text-[8px] text-amber-400/60 uppercase tracking-widest font-bold">Kişilik Kartı</p>
              <p className="text-sm font-heading font-bold text-amber-200">{calculatePersonalityCard(new Date(birthDate).getDate()).name}</p>
            </div>
          </motion.div>
        )}

        <button
          onClick={() => setStep("client_step3_package")}
          disabled={!birthDate}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-teal-500/10 text-teal-200 rounded-xl font-medium tracking-wide transition-all border border-teal-500/30 hover:bg-teal-500/20 disabled:opacity-25 mt-4"
        >
          <span className="text-base font-heading uppercase tracking-widest">İleri</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );

  const renderClientStep3 = () => (
    <motion.div key="client_step3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-6">
      <button onClick={() => setStep("client_step2_birth")} className="text-slate-400 hover:text-white transition-colors flex items-center gap-2 text-xs uppercase tracking-widest mb-4">
        <ArrowLeft className="w-4 h-4" /> Geri
      </button>
      <div className="text-center space-y-2 mb-6">
        <h2 className="text-xl font-heading text-teal-100 uppercase tracking-widest">Adım 3: Fal Paketi</h2>
        <p className="text-xs text-slate-400">Danışmanınızdan almak istediğiniz hizmeti seçin.</p>
      </div>

      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 pb-4 custom-scrollbar">
        {PACKAGES.map((pkg) => (
          <button
            key={pkg.id}
            onClick={() => setSelectedPackage(pkg.id)}
            className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-4 ${selectedPackage === pkg.id
              ? "bg-teal-500/10 border-teal-400/40 shadow-[0_0_15px_rgba(20,184,166,0.1)]"
              : "bg-[#030712]/50 border-slate-700/50 hover:border-slate-500/50"
              }`}
          >
            <div className="mt-1 bg-black/30 p-2 rounded-lg">{pkg.icon}</div>
            <div>
              <h3 className={`font-heading text-lg font-bold mb-1 ${selectedPackage === pkg.id ? "text-teal-200" : "text-white"}`}>
                {pkg.name} ({pkg.cards} Kart)
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">{pkg.desc}</p>
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={submitClientForm}
        disabled={!selectedPackage}
        className="w-full relative flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-teal-600/90 to-cyan-600/90 text-white rounded-xl font-semibold tracking-wide transition-all shadow-[0_0_20px_rgba(20,184,166,0.25)] hover:shadow-[0_0_35px_rgba(20,184,166,0.4)] disabled:opacity-50 disabled:grayscale overflow-hidden group"
      >
        {!selectedPackage ? null : <div className="absolute inset-0 bg-gradient-to-r from-teal-400/0 via-white/10 to-teal-400/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />}
        <Sparkles className="w-5 h-5 relative z-10" />
        <span className="relative z-10 text-base font-heading tracking-widest uppercase">Fal Başlasın</span>
      </button>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col items-center justify-center p-4 selection:bg-teal-500/30 relative overflow-hidden font-inter">

      {/* ═══ AURORA BACKGROUND ═══ */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div animate={{ x: ['-10%', '10%', '-10%'], rotate: [0, 2, 0] }} transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[10%] -left-[20%] w-[140%] h-[300px] bg-gradient-to-r from-transparent via-teal-500/8 to-transparent rounded-full blur-[100px] skew-y-[-6deg]" />
        <motion.div animate={{ x: ['10%', '-10%', '10%'], rotate: [0, -1.5, 0] }} transition={{ duration: 25, repeat: Infinity, ease: "easeInOut", delay: 3 }} className="absolute top-[30%] -left-[10%] w-[120%] h-[250px] bg-gradient-to-r from-transparent via-cyan-400/6 to-transparent rounded-full blur-[120px] skew-y-[3deg]" />
        <motion.div animate={{ x: ['-5%', '15%', '-5%'], opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 6 }} className="absolute bottom-[15%] -right-[20%] w-[100%] h-[200px] bg-gradient-to-r from-transparent via-rose-500/5 to-transparent rounded-full blur-[130px] skew-y-[-4deg]" />
      </div>

      {/* ═══ MAIN CONTENT ═══ */}
      <div className="z-10 w-full max-w-md relative pb-10 pt-4">
        {/* Header Icon */}
        <div className="text-center mb-10">
          <motion.div whileHover={{ scale: 1.08, rotate: 3 }} className="mx-auto w-16 h-16 relative flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-tr from-teal-500 to-cyan-400 rounded-2xl blur-xl opacity-25 animate-pulse-slow" />
            <div className="relative bg-[#0a1628] border border-teal-500/20 p-3.5 rounded-2xl shadow-[0_0_30px_rgba(20,184,166,0.15)]">
              <Eye className="w-8 h-8 text-teal-300" />
            </div>
          </motion.div>
          <h1 className="mt-4 text-3xl font-black tracking-widest font-heading text-transparent bg-clip-text bg-gradient-to-r from-teal-200 via-cyan-100 to-white">
            Mystic Tarot
          </h1>
        </div>

        {/* Dynamic Form Panel */}
        <div className="rounded-3xl p-6 md:p-8 relative overflow-hidden border border-teal-500/10 bg-[#0a1628]/60 backdrop-blur-xl shadow-[0_0_60px_rgba(20,184,166,0.06)] min-h-[420px] flex flex-col justify-center">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-teal-400/30 to-transparent" />

          <AnimatePresence mode="wait">
            {step === "welcome" && renderWelcome()}
            {step === "room_input" && renderRoomInput()}
            {step === "client_step1_name" && renderClientStep1()}
            {step === "client_step2_birth" && renderClientStep2()}
            {step === "client_step3_package" && renderClientStep3()}
          </AnimatePresence>
        </div>

        <p className="text-center text-[10px] text-slate-600 font-mono tracking-[0.15em] uppercase mt-8">
          WebRTC · Socket.io · Binnaz Abla Style
        </p>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#030712] flex items-center justify-center"><div className="w-8 h-8 rounded-full border-t-2 border-teal-500 animate-spin"></div></div>}>
      <HomeContent />
    </Suspense>
  );
}
