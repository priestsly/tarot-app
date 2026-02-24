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
    <motion.div key="welcome" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-6">
      <div className="text-center space-y-3 mb-8">
        <h2 className="text-3xl font-heading text-purple-950">Hoş Geldiniz</h2>
        <p className="text-sm text-purple-700/80 font-light max-w-xs mx-auto">Lütfen devam etmek istediğiniz portalı seçin.</p>
      </div>

      <button
        onClick={handleConsultantLogin}
        className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-purple-900 text-white rounded-2xl shadow-lg shadow-purple-900/20 hover:shadow-purple-900/40 hover:-translate-y-0.5 transition-all duration-300 border border-purple-800"
      >
        <Eye className="w-5 h-5 text-amber-300" />
        <span className="text-base font-heading tracking-widest">Danışman Girişi</span>
      </button>

      <div className="relative flex items-center">
        <div className="flex-grow border-t border-purple-200" />
        <span className="flex-shrink-0 mx-4 text-xs font-medium uppercase tracking-widest text-purple-400">veya</span>
        <div className="flex-grow border-t border-purple-200" />
      </div>

      <button
        onClick={() => setStep("room_input")}
        className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white text-purple-900 rounded-2xl shadow-md hover:shadow-lg transition-all border border-purple-100 hover:border-purple-300"
      >
        <User className="w-5 h-5 text-purple-500" />
        <span className="text-base font-heading tracking-widest">Müşteri Girişi</span>
      </button>
    </motion.div>
  );

  const renderRoomInput = () => (
    <motion.div key="room_input" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-6">
      <button onClick={() => setStep("welcome")} className="text-purple-400 hover:text-purple-700 transition-colors flex items-center gap-2 text-xs uppercase tracking-widest mb-4">
        <ArrowLeft className="w-4 h-4" /> Geri
      </button>
      <div className="text-center space-y-2 mb-6">
        <h2 className="text-3xl font-heading text-purple-950">Odaya Katıl</h2>
        <p className="text-xs text-purple-600/80">Danışmanınızın size verdiği Oda ID'sini girin.</p>
      </div>
      <form onSubmit={submitRoomInput} className="space-y-4">
        <input
          type="text"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          placeholder="Oda ID (Örn: tarot-a1b2)"
          className="w-full bg-white/60 backdrop-blur-sm border border-purple-200 rounded-2xl px-5 py-4 text-center placeholder:text-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all font-mono text-lg text-purple-900 shadow-inner"
          required
        />
        <button
          type="submit"
          disabled={!roomId.trim()}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-purple-800 to-purple-600 text-white rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:transform-none"
        >
          <span className="text-base font-heading tracking-widest">Devam Et</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </motion.div>
  );

  const renderClientStep1 = () => (
    <motion.div key="client_step1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-6">
      {!initialRoom && (
        <button onClick={() => setStep("room_input")} className="text-purple-400 hover:text-purple-700 transition-colors flex items-center gap-2 text-xs uppercase tracking-widest mb-4">
          <ArrowLeft className="w-4 h-4" /> Geri
        </button>
      )}
      <div className="text-center space-y-2 mb-6">
        <h2 className="text-3xl font-heading text-purple-950">Sizi Tanıyalım</h2>
        <p className="text-xs text-purple-600/80">Danışmanınızın size hitap edebilmesi için adınızı girin.</p>
      </div>
      <div className="space-y-4">
        <input
          type="text"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          placeholder="Adınız Soyadınız"
          className="w-full bg-white/60 backdrop-blur-sm border border-purple-200 rounded-2xl px-5 py-4 text-center placeholder:text-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all text-base text-purple-900 shadow-inner"
        />
        <button
          onClick={() => setStep("client_step2_birth")}
          disabled={!clientName.trim()}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-purple-800 to-purple-600 text-white rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:transform-none"
        >
          <span className="text-base font-heading tracking-widest">İleri</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );

  const renderClientStep2 = () => (
    <motion.div key="client_step2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-6">
      <button onClick={() => setStep("client_step1_name")} className="text-purple-400 hover:text-purple-700 transition-colors flex items-center gap-2 text-xs uppercase tracking-widest mb-4">
        <ArrowLeft className="w-4 h-4" /> Geri
      </button>
      <div className="text-center space-y-2 mb-6">
        <h2 className="text-3xl font-heading text-purple-950">Astroloji Profiliniz</h2>
        <p className="text-xs text-purple-600/80">Evrensel enerjinizi hizalamak için doğum bilgilerinizi girin.</p>
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-xs font-semibold text-purple-800 ml-1">
            <Calendar className="w-4 h-4 text-amber-500" /> Doğum Tarihi
          </label>
          <input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className="w-full bg-white/60 border border-purple-200 rounded-2xl px-4 py-3.5 text-base text-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
          />
        </div>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-xs font-semibold text-purple-800 ml-1">
            <Clock className="w-4 h-4 text-amber-500" /> Doğum Saati (İsteğe Bağlı)
          </label>
          <input
            type="time"
            value={birthTime}
            onChange={(e) => setBirthTime(e.target.value)}
            className="w-full bg-white/60 border border-purple-200 rounded-2xl px-4 py-3.5 text-base text-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
          />
        </div>

        {birthDate && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="flex gap-3 pt-3">
            <div className="flex-1 bg-gradient-to-br from-purple-50 to-white border border-purple-100 rounded-xl p-3 text-center shadow-sm">
              <p className="text-[10px] text-purple-400 uppercase tracking-widest font-bold mb-1">Ruh Kartı</p>
              <p className="text-sm font-heading font-bold text-purple-900">{calculateSoulCard(new Date(birthDate)).name}</p>
            </div>
            <div className="flex-1 bg-gradient-to-br from-amber-50 to-white border border-amber-100 rounded-xl p-3 text-center shadow-sm">
              <p className="text-[10px] text-amber-500 uppercase tracking-widest font-bold mb-1">Kişilik Kartı</p>
              <p className="text-sm font-heading font-bold text-amber-900">{calculatePersonalityCard(new Date(birthDate).getDate()).name}</p>
            </div>
          </motion.div>
        )}

        <button
          onClick={() => setStep("client_step3_package")}
          disabled={!birthDate}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 mt-2 bg-gradient-to-r from-purple-800 to-purple-600 text-white rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:transform-none"
        >
          <span className="text-base font-heading tracking-widest">İleri</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );

  const renderClientStep3 = () => (
    <motion.div key="client_step3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-6">
      <button onClick={() => setStep("client_step2_birth")} className="text-purple-400 hover:text-purple-700 transition-colors flex items-center gap-2 text-xs uppercase tracking-widest mb-4">
        <ArrowLeft className="w-4 h-4" /> Geri
      </button>
      <div className="text-center space-y-2 mb-6">
        <h2 className="text-3xl font-heading text-purple-950">Fal Paketi</h2>
        <p className="text-xs text-purple-600/80">Sizin için en uygun açılımı seçin.</p>
      </div>

      <div className="space-y-3">
        {PACKAGES.map((pkg) => (
          <button
            key={pkg.id}
            onClick={() => setSelectedPackage(pkg.id)}
            className={`w-full text-left p-4 rounded-2xl border transition-all flex gap-4 items-center group
              ${selectedPackage === pkg.id
                ? "bg-purple-50 border-purple-400 shadow-md ring-1 ring-purple-400"
                : "bg-white border-purple-100 hover:border-purple-300 hover:shadow-sm"
              }`}
          >
            <div className={`p-3 rounded-xl ${selectedPackage === pkg.id ? "bg-purple-100" : "bg-purple-50 group-hover:bg-purple-100/50"} transition-colors`}>
              {pkg.icon}
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-heading font-bold text-purple-950 flex items-center justify-between">
                {pkg.name}
                <span className="text-[10px] font-sans font-medium bg-white px-2 py-0.5 rounded-full border border-purple-200 text-purple-600">
                  {pkg.cards} Kart
                </span>
              </h3>
              <p className="text-[11px] text-purple-600/80 mt-1 leading-relaxed">{pkg.desc}</p>
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={submitClientForm}
        disabled={!selectedPackage}
        className="w-full flex items-center justify-center gap-3 px-6 py-4 mt-6 bg-amber-500 hover:bg-amber-400 text-white rounded-2xl shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 hover:-translate-y-0.5 transition-all outline-none font-bold"
      >
        <span className="text-base font-heading tracking-widest text-white drop-shadow-sm uppercase">Fal Başlasın</span>
        <Sparkles className="w-5 h-5 text-white" />
      </button>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center p-4 selection:bg-purple-200 relative overflow-hidden font-inter">

      {/* Soft Elegant Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-purple-200/40 rounded-full blur-[120px] mix-blend-multiply pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-amber-100/50 rounded-full blur-[150px] mix-blend-multiply pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-20 h-20 mx-auto mb-4 bg-gradient-to-tr from-purple-800 to-fuchsia-600 rounded-3xl p-[2px] shadow-2xl shadow-purple-900/40"
          >
            <div className="w-full h-full bg-white rounded-[22px] flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-purple-600" />
            </div>
          </motion.div>
          <h1 className="text-4xl font-heading font-medium tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-purple-950 to-purple-800 drop-shadow-sm">
            Mystic Tarot
          </h1>
          <p className="text-xs tracking-widest uppercase mt-2 text-purple-500/80 font-semibold">Premium Danışmanlık Ağı</p>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-8 shadow-xl shadow-purple-900/5 border border-white relative overflow-hidden">
          {/* Subtle inner reflection */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />

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
