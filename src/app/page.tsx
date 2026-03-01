"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LogIn, Sparkles, Eye, Calendar, Clock, User, ArrowRight, ArrowLeft, Star, Heart, Moon, Shield, X, ChevronRight, Loader2, UserIcon, Settings } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { MagicWheel } from "@/components/MagicWheel";
import { getMoonPhase } from "@/lib/astrology";
import { createClient } from "@/utils/supabase/client";

export function cn(...inputs: ClassValue[]) {
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
  const [readingFocus, setReadingFocus] = useState("");
  const [gender, setGender] = useState("");
  const [isWheelOpen, setIsWheelOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  const supabase = createClient();

  useEffect(() => {
    if (!supabase) return;

    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
        if (data) {
          setProfile(data);
        } else {
          // Fallback to user metadata if profile row missing
          setProfile({
            full_name: user.user_metadata?.full_name || "",
            birth_date: user.user_metadata?.birth_date || "",
          });
        }

        // Check for active accepted invites specifically for this user
        const { data: activeInvite } = await supabase
          .from('session_invites')
          .select('room_id')
          .eq('client_id', user.id)
          .eq('status', 'accepted')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (activeInvite?.room_id) {
          // If there's a recently accepted invite, offer to join
          if (confirm("Kabul edilmiş bir seans isteğiniz var. Odaya katılmak ister misiniz?")) {
            router.push(`/room/${activeInvite.room_id}`);
          }
        }
      }
    };
    getUser();

    // @ts-ignore
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event: any, session: any) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        const { data } = await supabase.from("profiles").select("*").eq("id", session.user.id).maybeSingle();
        if (data) {
          setProfile(data);
        } else {
          setProfile({
            full_name: session.user.user_metadata?.full_name || "",
            birth_date: session.user.user_metadata?.birth_date || "",
          });
        }
      } else {
        setProfile(null);
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  const handleUseProfile = () => {
    if (!profile) return;

    const name = profile.full_name || user?.user_metadata?.full_name || "";
    const birth = profile.birth_date || user?.user_metadata?.birth_date || "";
    const time = profile.birth_time || "";

    if (!name || !birth) {
      alert("Profil bilgileriniz eksik. Lütfen profil sayfasından adınızı ve doğum tarihinizi doldurun veya manuel giriş yapın.");
      return;
    }

    setClientName(name);
    setBirthDate(birth);
    setBirthTime(time);
    setStep("client_step3_focus");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  // Dynamic background based on moon phase
  const moonBg = useMemo(() => {
    const moon = getMoonPhase(new Date());
    const colors: Record<string, string> = {
      "Yeni Ay": "rgba(30,30,80,0.08)",
      "Hilal (Büyüyen)": "rgba(50,40,100,0.06)",
      "İlk Dördün": "rgba(60,50,120,0.07)",
      "Şişkin Ay (Büyüyen)": "rgba(80,60,140,0.08)",
      "Dolunay": "rgba(180,150,50,0.06)",
      "Şişkin Ay (Küçülen)": "rgba(100,70,130,0.07)",
      "Son Dördün": "rgba(80,50,110,0.06)",
      "Hilal (Küçülen)": "rgba(40,30,90,0.06)",
    };
    return colors[moon.name] || "rgba(60,40,120,0.06)";
  }, []);

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
    console.log("Submitting form with:", { roomId, clientName, birthDate, readingFocus, selectedPackage });

    if (!roomId) {
      alert("Oda kodu eksik. Lütfen ana sayfaya dönüp oda kodunu tekrar girin.");
      return;
    }
    if (!clientName || !birthDate) {
      alert("İsim veya doğum tarihi eksik. Lütfen bilgilerinizi kontrol edin.");
      return;
    }

    const params = new URLSearchParams();
    params.set("role", "client");
    params.set("name", clientName);
    params.set("birth", birthDate);
    if (birthTime) params.set("time", birthTime);
    if (readingFocus) params.set("focus", readingFocus);

    if (readingFocus === "İlişki Danışmanı") {
      if (!gender) {
        alert("Lütfen enerji seçimi yapın.");
        return;
      }
      params.set("pkgId", "relation");
      params.set("cards", "1");
      params.set("gender", gender);
    } else {
      if (!selectedPackage) {
        alert("Lütfen bir paket seçin.");
        return;
      }
      const pkg = PACKAGES.find(p => p.id === selectedPackage);
      const cardCount = pkg ? pkg.cards : 3;
      params.set("pkgId", selectedPackage);
      params.set("cards", String(cardCount));
    }

    console.log("Redirecting to room with params:", params.toString());
    router.push(`/room/${roomId}?${params.toString()}`);
  };

  // Total steps for the progress dots (client flow)
  const stepIndex = step === "room_input" ? 0
    : step === "client_step1_name" ? 1
      : step === "client_step2_birth" ? 2
        : step === "client_step3_focus" ? 3
          : step === "client_step_gender" || step === "client_step4_package" ? 4 : -1;

  // ─── INPUT STYLE ────────────────────────────────────────────────
  const inputClass = "w-full bg-surface border border-border rounded-xl px-5 py-4 text-text placeholder:text-text-muted/40 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/20 transition-all text-base";
  const btnPrimary = "w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-purple-500/80 to-indigo-500/70 text-white/90 rounded-xl font-semibold tracking-wide transition-all hover:brightness-105 hover:shadow-lg hover:shadow-purple-500/10 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none";
  const backBtn = "text-text-muted hover:text-accent transition-colors flex items-center gap-2 text-xs uppercase tracking-[0.15em] font-semibold mb-6";

  // ─── WELCOME ────────────────────────────────────────────────────
  const renderWelcome = () => (
    <motion.div key="welcome" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-4">
      {user ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => router.push("/consultants")}
            className="w-full sm:col-span-2 bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/20 rounded-3xl p-6 flex flex-col items-center justify-center group overflow-hidden relative cursor-pointer hover:bg-amber-500/30 transition-all active:scale-[0.98] shadow-lg shadow-amber-500/5 hover:shadow-amber-500/10"
          >
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-overlay group-hover:opacity-40 transition-opacity" />
            <Sparkles className="w-10 h-10 text-amber-400 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-bold font-heading text-white tracking-wider">Fal Baktır</h3>
            <p className="text-xs text-amber-200/80 mt-1 font-medium">Hemen Çevrimiçi Bir Danışmana Bağlan</p>
          </button>

          <button
            onClick={() => router.push("/consultations")}
            className="w-full bg-surface/60 border border-emerald-500/20 rounded-2xl p-5 flex items-center justify-between group hover:bg-emerald-500/10 transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <Clock className="w-6 h-6" />
              </div>
              <div className="text-left">
                <p className="text-[10px] text-emerald-400 uppercase tracking-widest font-bold">Geçmiş & Aktif</p>
                <p className="text-base text-text font-bold">Oturumlarım</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-emerald-400 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </button>

          <button
            onClick={() => profile?.role === 'consultant' ? router.push("/dashboard") : router.push("/profile")}
            className="w-full bg-surface/60 border border-purple-500/20 rounded-2xl p-5 flex items-center justify-between group hover:bg-purple-500/10 transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                {profile?.role === 'consultant' ? <Shield className="w-6 h-6" /> : <User className="w-6 h-6" />}
              </div>
              <div className="text-left">
                <p className="text-[10px] text-purple-400 uppercase tracking-widest font-bold">{profile?.role === 'consultant' ? "Yönetim Paneli" : "Hesabım"}</p>
                <p className="text-base text-text font-bold">{profile?.role === 'consultant' ? "Danışman Paneli" : "Profilim"}</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-purple-400 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <button
            onClick={() => router.push("/consultants")}
            className="group w-full relative overflow-hidden rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-transparent p-6 flex flex-col items-center gap-3 transition-all hover:border-amber-500/40 hover:bg-amber-500/20 shadow-lg mb-6"
          >
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 mix-blend-overlay" />
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0 shadow-lg shadow-orange-500/20 group-hover:scale-110 transition-transform">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <div className="text-center relative z-10">
              <h3 className="text-xl font-bold font-heading text-white">Danışmanları Keşfet</h3>
              <p className="text-sm text-text-muted mt-1">Sana özel atanmış kader bağlarını keşfetmeye başla.</p>
            </div>
          </button>

          <button
            onClick={() => router.push("/login")}
            className="w-full flex items-center justify-center gap-3 px-6 py-5 bg-white/5 border border-white/10 text-white rounded-2xl font-bold transition-all hover:bg-white/10 active:scale-[0.98] group"
          >
            <LogIn className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
            <span>Giriş Yap veya Üye Ol</span>
          </button>
        </div>
      )}

      {/* Keşfet */}
      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/50" /></div>
        <div className="relative flex justify-center"><span className="bg-[#0a0a0f] px-5 py-1 text-[10px] text-text-muted/60 uppercase tracking-[0.2em] font-bold border border-border/50 rounded-full">Keşfet</span></div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {[
          { href: "/meditation", name: "Meditasyon", desc: "Nefes & niyet", icon: "🧘", border: "border-purple-500/10", hover: "hover:border-purple-500/20 hover:bg-purple-500/5" },
          { href: "/astrology", name: "Astroloji", desc: "Burç & gezegen", icon: "🪐", border: "border-indigo-500/10", hover: "hover:border-indigo-500/20 hover:bg-indigo-500/5" },
          { href: "/dreams", name: "Rüya Yorumu", desc: "AI destekli", icon: "🌙", border: "border-blue-500/10", hover: "hover:border-blue-500/20 hover:bg-blue-500/5" },
          { href: "/candle", name: "Mum Ritüeli", desc: "Niyet & ritüel", icon: "🕯️", border: "border-orange-500/10", hover: "hover:border-orange-500/20 hover:bg-orange-500/5" },
          { href: "/numerology", name: "Numeroloji", desc: "Sayıların gücü", icon: "🔢", border: "border-amber-500/10", hover: "hover:border-amber-500/20 hover:bg-amber-500/5" },
          { href: "/coffee", name: "Kahve Falı", desc: "Fotoğraf ile", icon: "☕", border: "border-yellow-600/10", hover: "hover:border-yellow-600/20 hover:bg-yellow-600/5" },
          { href: "/compatibility", name: "Burç Uyumu", desc: "İki burcun kimyası", icon: "💕", border: "border-pink-500/10", hover: "hover:border-pink-500/20 hover:bg-pink-500/5" },
          { href: "/calendar", name: "Kozmik Takvim", desc: "Ay & retrograd", icon: "📅", border: "border-cyan-500/10", hover: "hover:border-cyan-500/20 hover:bg-cyan-500/5" },
          { href: "/affirmations", name: "Afirmasyonlar", desc: "Günlük olumlamalar", icon: "✨", border: "border-violet-500/10", hover: "hover:border-violet-500/20 hover:bg-violet-500/5" },
          { href: "/ai-tarot", name: "AI Tarot", desc: "7/24 kart çekimi", icon: "🤖", border: "border-fuchsia-500/10", hover: "hover:border-fuchsia-500/20 hover:bg-fuchsia-500/5" },
          { href: "/relationship", name: "İlişki Koçu", desc: "AI danışmanlık", icon: "💬", border: "border-rose-500/10", hover: "hover:border-rose-500/20 hover:bg-rose-500/5" },
          { href: "/birthchart", name: "Doğum Haritası", desc: "SVG yıldız haritası", icon: "🌌", border: "border-sky-500/10", hover: "hover:border-sky-500/20 hover:bg-sky-500/5" },
          { href: "/mind-question", name: "Aklımdaki Soru", desc: "Cevaplar Kitabı", icon: "📖", border: "border-emerald-500/10", hover: "hover:border-emerald-500/20 hover:bg-emerald-500/5" },
        ].map(item => (
          <button key={item.href} onClick={() => router.push(item.href)}
            className={`group w-full relative overflow-hidden rounded-xl border bg-surface/50 p-3.5 flex items-center gap-3 transition-all ${item.border} ${item.hover}`}>
            <span className="text-xl">{item.icon}</span>
            <div className="text-left flex-1 min-w-0">
              <h3 className="text-xs font-semibold text-text/70 truncate">{item.name}</h3>
              <p className="text-[9px] text-text-muted/50 mt-0.5">{item.desc}</p>
            </div>
          </button>
        ))}
      </div>
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
    <motion.div key="client_step1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-6">
      {!initialRoom && (
        <button onClick={() => setStep("room_input")} className={backBtn}>
          <ArrowLeft className="w-4 h-4" /> Geri
        </button>
      )}
      <div className="text-center space-y-2 mb-4">
        <h2 className="text-2xl font-heading text-text">Sizi Tanıyalım</h2>
        <p className="text-sm text-text-muted">Kartların enerjisini size bağlamak için.</p>
      </div>

      <div className="space-y-4">
        {user && !profile && (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="w-6 h-6 text-accent animate-spin" />
            <span className="ml-3 text-xs text-text-muted font-medium">Kozmik bilgileriniz getiriliyor...</span>
          </div>
        )}

        {profile && (profile.full_name || user?.email) && (
          <>
            <button
              onClick={handleUseProfile}
              className="w-full group relative overflow-hidden rounded-2xl border border-accent/20 bg-accent-dim/30 p-5 flex items-center gap-4 transition-all hover:border-accent/40 hover:bg-accent-dim/50 shadow-md active:scale-[0.98]"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-accent/20 to-purple-500/10 flex items-center justify-center shrink-0 border border-accent/10">
                <Sparkles className="w-6 h-6 text-accent" />
              </div>
              <div className="text-left flex-1 min-w-0">
                <h3 className="text-sm font-bold text-text mb-0.5">Kendim İçin</h3>
                <p className="text-[10px] text-accent uppercase tracking-[0.2em] font-bold truncate opacity-80">
                  {profile.full_name || user?.email}
                </p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-surface/50 flex items-center justify-center group-hover:bg-accent/10 transition-colors">
                <ChevronRight className="w-4 h-4 text-accent group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>

            <div className="relative py-4 flex items-center justify-center">
              <div className="absolute inset-x-0 h-px bg-white/5" />
              <span className="relative px-4 bg-midnight text-[9px] text-text-muted uppercase tracking-[0.3em] font-bold">Veya Başkası Adına</span>
            </div>
          </>
        )}

        <div className="space-y-4">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <UserIcon className="w-4 h-4 text-text-muted group-focus-within:text-gold transition-colors" />
            </div>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Fal Sahibinin Adı Soyadı"
              className={inputClass + " pl-11"}
            />
          </div>
          <button onClick={() => setStep("client_step2_birth")} disabled={!clientName.trim()} className={btnPrimary}>
            Manuel Devam Et <ArrowRight className="w-4 h-4" />
          </button>
        </div>
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

        <button onClick={() => setStep("client_step3_focus")} disabled={!birthDate} className={btnPrimary + " mt-2"}>
          İleri <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );

  // ─── STEP 3: FOCUS / INTENT ──────────────────────────────────────
  const renderClientStep3Focus = () => (
    <motion.div key="client_step3_focus" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
      <button onClick={() => setStep("client_step2_birth")} className={backBtn}>
        <ArrowLeft className="w-4 h-4" /> Geri
      </button>
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-2xl font-heading text-text">Niyetiniz Nedir?</h2>
        <p className="text-sm text-text-muted">Kartların hangi konuya ışık tutmasını istersiniz?</p>
      </div>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2 mb-2">
          {['Genel', 'Aşk', 'Kariyer', 'Para', 'Sağlık', 'Ruhsal'].map(tag => (
            <button
              key={tag}
              onClick={() => setReadingFocus(tag)}
              className={cn(
                "px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all",
                readingFocus === tag ? "bg-accent/20 border-accent text-accent" : "bg-card border-border text-text-muted hover:border-accent/40"
              )}
            >
              {tag}
            </button>
          ))}
        </div>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/50" /></div>
          <div className="relative flex justify-center"><span className="bg-bg px-3 text-[10px] text-text-muted/40 uppercase tracking-[0.2em] font-bold">Veya</span></div>
        </div>

        <button
          onClick={() => setReadingFocus("İlişki Danışmanı")}
          className={cn(
            "w-full px-4 py-3 rounded-xl border flex items-center justify-center gap-3 transition-all",
            readingFocus === "İlişki Danışmanı" ? "bg-rose-500/10 border-rose-500/50 text-rose-400" : "bg-surface border-border hover:border-rose-500/30 text-text-muted"
          )}
        >
          <span className="text-xl">💞</span>
          <span className="text-sm font-semibold">İlişki Danışmanı (Özel Kart)</span>
        </button>

        <textarea
          value={readingFocus === "İlişki Danışmanı" ? "" : readingFocus}
          onChange={(e) => {
            if (readingFocus === "İlişki Danışmanı") setReadingFocus(""); // Reset if user starts typing manually
            setReadingFocus(e.target.value);
          }}
          placeholder="Veya spesifik bir soru yazın (örn: Bu iş teklifini kabul etmeli miyim?)"
          className={inputClass + " h-24 resize-none text-sm"}
        />
        <button
          onClick={() => {
            if (readingFocus === "İlişki Danışmanı") {
              setStep("client_step_gender");
            } else {
              setStep("client_step4_package");
            }
          }}
          className={btnPrimary}
        >
          İleri <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );

  // ─── STEP GENDER (Only for İlişki Danışmanı) ────────────────────
  const renderClientStepGender = () => (
    <motion.div key="client_step_gender" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
      <button onClick={() => setStep("client_step3_focus")} className={backBtn}>
        <ArrowLeft className="w-4 h-4" /> Geri
      </button>
      <div className="text-center space-y-2 mb-6">
        <h2 className="text-2xl font-heading text-text">Hangi Enerji?</h2>
        <p className="text-sm text-text-muted">Size en çok hitap eden enerjiyi seçin.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <button
          onClick={() => setGender("Kadın")}
          className={`flex flex-col items-center justify-center gap-3 py-6 px-4 rounded-xl border transition-all ${gender === "Kadın" ? "bg-amber-500/10 border-amber-500/50 text-amber-500" : "bg-surface border-border hover:border-amber-500/30 text-text-muted hover:text-white"
            }`}
        >
          <span className="text-3xl text-amber-500">👩</span>
          <span className="text-sm font-bold tracking-wide">Dişil Enerji</span>
        </button>
        <button
          onClick={() => setGender("Erkek")}
          className={`flex flex-col items-center justify-center gap-3 py-6 px-4 rounded-xl border transition-all ${gender === "Erkek" ? "bg-slate-800/50 border-slate-500/50 text-white" : "bg-surface border-border hover:border-slate-500/30 text-text-muted hover:text-white"
            }`}
        >
          <span className="text-3xl grayscale">👨</span>
          <span className="text-sm font-bold tracking-wide">Eril Enerji</span>
        </button>
      </div>

      <button
        onClick={submitClientForm}
        disabled={!gender}
        className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-rose-500/80 to-pink-500/70 text-white/90 font-bold rounded-xl tracking-wide transition-all hover:brightness-105 hover:shadow-lg hover:shadow-rose-500/10 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none"
      >
        Odaya Katıl <Sparkles className="w-5 h-5" />
      </button>
    </motion.div>
  );

  // ─── STEP 4: PACKAGE ────────────────────────────────────────────
  const renderClientStep4 = () => (
    <motion.div key="client_step4" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
      <button onClick={() => setStep("client_step3_focus")} className={backBtn}>
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
        {[0, 1, 2, 3, 4].map(i => (
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
      {/* Background Effects — soft, diffused edge glows */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-0 inset-x-0 h-[40%] blur-[120px]" style={{ background: `linear-gradient(to bottom, ${moonBg}40, transparent)` }} />
        <div className="absolute bottom-0 inset-x-0 h-[35%] blur-[120px]" style={{ background: `linear-gradient(to top, #1a103060, transparent)` }} />
        <div className="absolute left-0 inset-y-0 w-[40%] blur-[120px]" style={{ background: `linear-gradient(to right, #101a3030, transparent)` }} />
        <div className="absolute right-0 inset-y-0 w-[40%] blur-[120px]" style={{ background: `linear-gradient(to left, #2a1a1020, transparent)` }} />

        {/* Subtle noise/texture */}
        <div className="absolute inset-0 bg-midnight/5 mix-blend-soft-light opacity-20" />
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
                {step === "client_step3_focus" && renderClientStep3Focus()}
                {step === "client_step_gender" && renderClientStepGender()}
                {step === "client_step4_package" && renderClientStep4()}
              </AnimatePresence>
            </div>
          </div>

          {renderProgress()}

          <p className="text-center text-[10px] text-text-muted/40 tracking-[0.15em] uppercase mt-8 mb-8 lg:mb-0">
            Şifreli Bağlantı · Gerçek Zamanlı
          </p>
        </div>
      </div>

      {/* FLOATING MAGIC WHEEL BUTTON */}
      <button
        onClick={() => setIsWheelOpen(true)}
        className="fixed bottom-6 left-6 lg:bottom-10 lg:left-10 z-40 bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xl shadow-purple-500/20 px-4 py-3 rounded-full flex items-center gap-2 font-semibold tracking-wide hover:scale-105 active:scale-95 transition-all border border-purple-400/30"
      >
        <Sparkles className="w-5 h-5 text-amber-300" />
        <span className="hidden sm:inline">Kader Çarkı</span>
      </button>

      {/* MAGIC WHEEL MODAL */}
      <AnimatePresence>
        {isWheelOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md pointer-events-auto"
            >
              <button
                onClick={() => setIsWheelOpen(false)}
                className="absolute -top-12 right-0 text-white/70 hover:text-white bg-white/10 p-2 rounded-full transition-colors z-50"
              >
                <X className="w-5 h-5" />
              </button>
              <MagicWheel />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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
