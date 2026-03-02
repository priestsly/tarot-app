"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LogIn, Sparkles, Eye, Calendar, Clock, User, ArrowRight, ArrowLeft, Star, Heart, Moon, Shield, X, ChevronRight, Loader2, UserIcon } from "lucide-react";
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
  const [mounted, setMounted] = useState(false);

  const dots = useMemo(() => Array.from({ length: 40 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    delay: Math.random() * 5,
    duration: Math.random() * 8 + 10,
  })), []);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

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

  const [step, setStep] = useState<string>("welcome");
  const [clientName, setClientName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [selectedPackage, setSelectedPackage] = useState<string>("");
  const [readingFocus, setReadingFocus] = useState("");
  const [gender, setGender] = useState("");
  const [isWheelOpen, setIsWheelOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  // Yeni sistem (Danışman / Oturum)
  const [consultants, setConsultants] = useState<any[]>([]);
  const [selectedConsultant, setSelectedConsultant] = useState<any>(null);
  const [pendingSessionId, setPendingSessionId] = useState<string | null>(null);
  const [isWaitingForConsultant, setIsWaitingForConsultant] = useState(false);
  const [rejectedModal, setRejectedModal] = useState(false);
  const [appointmentModal, setAppointmentModal] = useState(false);
  const [offlineWarningModal, setOfflineWarningModal] = useState(false);
  const [clientSessions, setClientSessions] = useState<any[]>([]);
  const [isConsultant, setIsConsultant] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    if (!supabase) return;

    let sessionStatusChannel: any = null;

    const fetchProfile = async (userId: string) => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, birth_date, zodiac_sign, ascendant_sign")
        .eq("id", userId)
        .maybeSingle();

      if (data) setProfile(data);
    };

    const fetchActiveSessions = async (userId: string) => {
      const { data } = await supabase
        .from('sessions')
        .select(`id, room_id, status, consultant:consultants(display_name)`)
        .or(`client_id.eq.${userId},consultant_id.eq.${userId}`)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(5);

      if (data) setClientSessions(data);
    };

    const checkIsConsultant = async (userId: string) => {
      const { data } = await supabase
        .from('consultants')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      if (data) setIsConsultant(true);
    };

    const fetchConsultants = async () => {
      const { data } = await supabase
        .from("consultants")
        .select(`id, display_name, rating, is_online, specialties, profiles(avatar_url)`)
        .order('is_online', { ascending: false });

      if (data) setConsultants(data);
    };

    const initUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user;
      setUser(currentUser ?? null);

      if (currentUser) {
        fetchProfile(currentUser.id);
        fetchActiveSessions(currentUser.id);
        checkIsConsultant(currentUser.id);

        // Session status realtime
        if (!sessionStatusChannel) {
          sessionStatusChannel = supabase.channel(`user_sessions_${currentUser.id}`)
            .on('postgres_changes', {
              event: '*',
              schema: 'public',
              table: 'sessions',
              filter: `client_id=eq.${currentUser.id}`
            }, () => fetchActiveSessions(currentUser.id))
            .on('postgres_changes', {
              event: '*',
              schema: 'public',
              table: 'sessions',
              filter: `consultant_id=eq.${currentUser.id}`
            }, () => fetchActiveSessions(currentUser.id))
            .subscribe();
        }
      }
    };

    initUser();
    fetchConsultants();

    // Consultant status realtime
    const consultantChannel = supabase.channel('consultant_status_global')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'consultants'
      }, () => fetchConsultants())
      .subscribe();

    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user;
      setUser(currentUser ?? null);
      if (currentUser) {
        fetchProfile(currentUser.id);
        fetchActiveSessions(currentUser.id);
      } else {
        setProfile(null);
        setClientSessions([]);
        setIsConsultant(false);
        if (sessionStatusChannel) {
          supabase.removeChannel(sessionStatusChannel);
          sessionStatusChannel = null;
        }
      }
    });

    return () => {
      authSub.unsubscribe();
      supabase.removeChannel(consultantChannel);
      if (sessionStatusChannel) supabase.removeChannel(sessionStatusChannel);
    };
  }, []);

  // Oturum kabul edilmesini dinle
  useEffect(() => {
    const supabase = createClient();
    if (!pendingSessionId || !supabase) return;

    let checkInterval: NodeJS.Timeout;

    const channel = supabase
      .channel(`session_${pendingSessionId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'sessions', filter: `id=eq.${pendingSessionId}` },
        (payload: any) => {
          console.log("Session updated!", payload.new);
          if (payload.new.status === 'active') {
            const params = new URLSearchParams();
            params.set("role", "client");
            params.set("name", clientName);
            params.set("birth", birthDate);
            if (birthTime) params.set("time", birthTime);
            if (readingFocus) params.set("focus", readingFocus);

            if (readingFocus === "İlişki Danışmanı") {
              params.set("pkgId", "relation");
              params.set("cards", "1");
              params.set("gender", gender);
            } else {
              const pkg = PACKAGES.find(p => p.id === selectedPackage);
              const cardCount = pkg ? pkg.cards : 3;
              params.set("pkgId", selectedPackage);
              params.set("cards", String(cardCount));
            }

            router.push(`/room/${payload.new.room_id}?${params.toString()}`);
          } else if (payload.new.status === 'cancelled') {
            setIsWaitingForConsultant(false);
            setPendingSessionId(null);
            setStep("welcome");
            setRejectedModal(true);
          }
        }
      )
      .subscribe((status) => {
        // If realtime fails for some reason, doing a manual fallback check
        if (status === 'SUBSCRIBED') {
          checkInterval = setInterval(async () => {
            const { data } = await supabase.from('sessions').select('*').eq('id', pendingSessionId).single();
            if (data?.status === 'active') {
              // trigger logic just like payload
              const params = new URLSearchParams();
              params.set("role", "client");
              params.set("name", clientName);
              params.set("birth", birthDate);
              if (birthTime) params.set("time", birthTime);
              if (readingFocus) params.set("focus", readingFocus);

              if (readingFocus === "İlişki Danışmanı") {
                params.set("pkgId", "relation");
                params.set("cards", "1");
                params.set("gender", gender);
              } else {
                const pkg = PACKAGES.find(p => p.id === selectedPackage);
                const cardCount = pkg ? pkg.cards : 3;
                params.set("pkgId", selectedPackage);
                params.set("cards", String(cardCount));
              }

              router.push(`/room/${data.room_id}?${params.toString()}`);
            }
          }, 5000); // Check every 5s silently as backup
        }
      });

    return () => {
      supabase.removeChannel(channel);
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [pendingSessionId, router, clientName, birthDate, birthTime, readingFocus, gender, selectedPackage]);

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
    // initialRoom handled differently now, mostly redirecting or keeping empty
  }, [initialRoom]);

  const submitClientForm = async () => {
    if (!selectedConsultant) {
      alert("Lütfen önce bir danışman seçin.");
      return;
    }
    if (!clientName || !birthDate) {
      alert("İsim veya doğum tarihi eksik. Lütfen bilgilerinizi kontrol edin.");
      return;
    }

    // Validate package selections depending on focus
    if (readingFocus === "İlişki Danışmanı" && !gender) {
      alert("Lütfen enerji seçimi yapın.");
      return;
    } else if (readingFocus !== "İlişki Danışmanı" && !selectedPackage) {
      alert("Lütfen bir paket seçin.");
      return;
    }

    // Check if consultant is online
    const isOffline = !selectedConsultant.is_online;
    if (!isOffline) {
      setIsWaitingForConsultant(true);
    }

    // Generate room code and insert session into DB
    const roomCode = "tarot-" + Math.random().toString(36).substring(2, 6);

    const clientInfo = {
      name: clientName,
      birth_date: birthDate,
      birth_time: birthTime,
      gender,
      focus: readingFocus,
      pkgId: readingFocus === "İlişki Danışmanı" ? "relation" : selectedPackage,
      cards: readingFocus === "İlişki Danışmanı" ? 1 : (PACKAGES.find(p => p.id === selectedPackage)?.cards || 3),
      is_offline_request: isOffline
    };

    const supabase = createClient();
    const { data, error } = await supabase.from('sessions').insert({
      consultant_id: selectedConsultant.id,
      status: 'pending',
      room_id: roomCode,
      client_info: clientInfo,
      client_id: user ? user.id : null
    }).select().single();

    if (error) {
      console.error(error);
      alert("Oturum açılamadı. Lütfen giriş yaptığınızı doğrulayın veya veritabanı yamasını çalıştırın.");
      setIsWaitingForConsultant(false);
      return;
    }

    if (isOffline) {
      setAppointmentModal(true);
      setStep("welcome"); // Reset view
    } else {
      setPendingSessionId(data.id);
    }
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
        <div
          onClick={() => router.push("/profile")}
          className="w-full bg-surface/40 border border-accent/20 rounded-2xl p-4 flex items-center justify-between group overflow-hidden relative cursor-pointer hover:bg-surface/60 transition-all active:scale-[0.99]"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold">
              {(profile?.full_name?.[0] || user.email?.[0] || "U").toUpperCase()}
            </div>
            <div className="text-left">
              <p className="text-[10px] text-accent font-bold uppercase tracking-widest">{isConsultant ? "Danışman Paneli" : "Profilim"}</p>
              <p className="text-sm text-text font-medium truncate max-w-[12rem]">{profile?.full_name || user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isConsultant && (
              <button
                onClick={(e) => { e.stopPropagation(); router.push("/dashboard"); }}
                className="px-3 py-1.5 bg-accent/20 border border-accent/40 rounded-lg text-[10px] font-bold text-accent hover:bg-accent/30 transition-all uppercase"
              >
                Panel
              </button>
            )}
            <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-accent transition-colors" />
          </div>
        </div>
      ) : (
        <button
          onClick={() => router.push("/login")}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white/5 border border-white/10 text-white rounded-xl font-bold transition-all hover:bg-white/10 active:scale-[0.98] group"
        >
          <LogIn className="w-5 h-5 text-accent group-hover:rotate-12 transition-transform" />
          <span>Giriş Yap / Üye Ol</span>
        </button>
      )}

      {clientSessions.length > 0 && (
        <div className="mb-6 space-y-3">
          <h3 className="text-[10px] uppercase tracking-[0.2em] text-emerald-400 font-bold ml-1 mb-2">Aktif Oturum (Geri Dön)</h3>
          {clientSessions.map(session => (
            <button
              key={session.id}
              onClick={() => router.push(`/room/${session.room_id}?role=client`)}
              className="w-full relative overflow-hidden bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex items-center justify-between group hover:bg-emerald-500/20 transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg shadow-inner bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{session.consultant?.display_name || "Danışman"}</p>
                  <p className="text-[10px] mt-0.5 flex items-center gap-1 font-bold uppercase tracking-wider text-emerald-400">
                    Devam Ediyor
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-1 transition-transform" />
            </button>
          ))}
        </div>
      )}

      <div className="relative my-6 opacity-80">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/50" /></div>
        <div className="relative flex justify-center"><span className="bg-bg px-4 text-[10px] text-accent font-bold uppercase tracking-[0.2em]">Uzman Danışmanlar</span></div>
      </div>

      <div className="space-y-3">
        {/* AI Tarot (Sürekli Aktif) */}
        <button
          onClick={() => router.push("/ai-tarot")}
          className="w-full flex items-center gap-4 p-4 rounded-xl border border-fuchsia-500/30 bg-gradient-to-r from-fuchsia-500/10 to-indigo-500/10 hover:bg-fuchsia-500/20 hover:border-fuchsia-500/50 transition-all text-left group shadow-[0_0_15px_rgba(217,70,239,0.1)] relative overflow-hidden"
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-fuchsia-500/50 to-transparent opacity-50" />

          <div className="w-12 h-12 rounded-full relative shrink-0 border border-fuchsia-400/50 overflow-hidden bg-[#1a0f2e] flex items-center justify-center shadow-lg shadow-fuchsia-500/20">
            <span className="text-xl">🤖</span>
            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-surface bg-emerald-500 shadow-[0_0_10px_#10b981]" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-300 to-indigo-300 flex items-center gap-2">
              Mistik Yapay Zeka
              <span className="flex items-center gap-0.5 text-[9px] text-fuchsia-300 bg-fuchsia-500/20 px-1.5 py-0.5 rounded-md uppercase tracking-widest border border-fuchsia-500/30 font-bold">
                7/24 Aktif
              </span>
            </h3>
            <p className="text-[11px] text-fuchsia-200/70 mt-1 truncate font-medium">Günlük Ücretsiz Yorum • Görselli Seçim</p>
          </div>
          <ArrowRight className="w-4 h-4 text-fuchsia-500/50 group-hover:text-fuchsia-400 group-hover:translate-x-1 transition-all" />
        </button>

        {/* Canlı Danışmanlar */}
        {consultants.length === 0 ? (
          <div className="text-center p-4 border border-white/5 rounded-xl bg-white/5">
            <Loader2 className="w-5 h-5 animate-spin mx-auto text-text-muted mb-2" />
            <p className="text-xs text-text-muted">Danışmanlar aranıyor...</p>
          </div>
        ) : (
          consultants.map(c => (
            <button
              key={c.id}
              onClick={() => {
                setSelectedConsultant(c);
                if (!c.is_online) {
                  setOfflineWarningModal(true);
                } else {
                  setStep("client_step1_name");
                }
              }}
              className="w-full flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-accent/40 hover:shadow-[0_0_20px_rgba(139,92,246,0.15)] transition-all text-left group overflow-hidden relative"
            >
              <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-12 h-12 rounded-full relative shrink-0 border border-white/20 overflow-hidden bg-midnight flex items-center justify-center shadow-lg">
                {c.profiles?.avatar_url ? (
                  <img src={c.profiles.avatar_url} alt={c.display_name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg font-bold text-accent">{c.display_name?.charAt(0) || "D"}</span>
                )}
                <div className={cn("absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-[#161623]", c.is_online ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : "bg-zinc-500")} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 group-hover:text-accent-light transition-colors">
                  <span className="truncate">{c.display_name}</span>
                  {c.rating && <span className="flex items-center gap-0.5 text-[10px] text-amber-300 bg-amber-500/20 border border-amber-500/20 px-1.5 py-0.5 rounded-md shrink-0"><Star className="w-3 h-3 fill-amber-300" /> {c.rating}</span>}
                  {!c.is_online && <span className="text-[9px] text-zinc-400 bg-zinc-800/80 px-1.5 py-0.5 rounded border border-zinc-700 uppercase tracking-widest font-bold ml-auto shrink-0">Çevrimdışı</span>}
                </h3>
                <p className="text-[11px] text-zinc-300/80 mt-1 truncate font-medium">{c.specialties?.join(" • ") || "Tarot, Astroloji"}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-white/30 group-hover:text-accent group-hover:translate-x-1 transition-all" />
            </button>
          ))
        )}
      </div>

      {/* Meditation Room */}
      <div className="relative my-6 mt-8">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/50" /></div>
        <div className="relative flex justify-center"><span className="bg-bg px-3 text-[9px] text-text-muted/40 uppercase tracking-[0.2em]">keşfet</span></div>
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


  // ─── STEP 1: NAME ───────────────────────────────────────────────
  const renderClientStep1 = () => (
    <motion.div key="client_step1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-6">
      <button onClick={() => setStep("welcome")} className={backBtn}>
        <ArrowLeft className="w-4 h-4" /> Geri
      </button>
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
        {selectedConsultant?.is_online ? (
          <>Fal Başlasın <Sparkles className="w-5 h-5" /></>
        ) : (
          <>Randevu Talebi Gönder <Calendar className="w-5 h-5" /></>
        )}
      </button>
    </motion.div>
  );

  // ─── WAITING OVERLAY ────────────────────────────────────────────
  if (isWaitingForConsultant) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-6 relative overflow-hidden font-inter">
        <div className="absolute inset-0 bg-midnight/30" />
        <Particles />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass p-8 rounded-2xl max-w-sm w-full relative z-10 text-center border-accent/20 border shadow-2xl"
        >
          <div className="w-20 h-20 mx-auto mb-6 relative">
            <div className="absolute inset-0 rounded-full border-t-2 border-accent animate-spin" />
            <div className="absolute inset-2 rounded-full border-r-2 border-purple-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-amber-300 animate-pulse" />
            </div>
          </div>
          <h2 className="text-xl font-heading font-bold text-white mb-2">Danışman Bekleniyor</h2>
          <p className="text-sm text-text-muted mb-6">Talebiniz {selectedConsultant?.display_name || "danışman"} uzmanına iletildi. Lütfen ayrılmayın, bağlantı onaylandığında otomatik olarak odaya alınacaksınız.</p>

          <button
            onClick={() => { setIsWaitingForConsultant(false); setPendingSessionId(null); setStep("welcome"); }}
            className="text-xs text-red-400 hover:text-red-300 underline underline-offset-4"
          >
            İptal Et ve Geri Dön
          </button>
        </motion.div>
      </div>
    );
  }

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
                {step === "client_step1_name" && renderClientStep1()}
                {step === "client_step2_birth" && renderClientStep2()}
                {step === "client_step3_focus" && renderClientStep3Focus()}
                {step === "client_step_gender" && renderClientStepGender()}
                {step === "client_step4_package" && renderClientStep4()}
              </AnimatePresence>
            </div>
          </div>

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

      {/* REJECTED MODAL */}
      <AnimatePresence>
        {rejectedModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
              onClick={() => setRejectedModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-zinc-900 border border-white/10 shadow-2xl rounded-3xl p-6 text-center overflow-hidden"
            >
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-red-500/50 to-orange-500/50" />
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                <X className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Talebiniz İletilemedi</h3>
              <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
                Danışman şu anda meşgul veya talebinizi reddetti. Lütfen yıldızlar tekrar hizalanana kadar bekleyin veya başka bir danışman seçin.
              </p>
              <button
                onClick={() => setRejectedModal(false)}
                className="w-full py-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold tracking-wide transition-all active:scale-95"
              >
                Tamam, anladım
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* APPOINTMENT MODAL */}
      <AnimatePresence>
        {appointmentModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
              onClick={() => setAppointmentModal(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 10 }}
              className="w-full max-w-sm bg-surface border border-accent/20 rounded-3xl p-6 shadow-2xl relative overflow-hidden text-center z-10"
            >
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-500" />
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                <Calendar className="w-8 h-8 text-emerald-400" />
              </div>
              <h2 className="text-xl font-heading font-bold text-white mb-2">Randevu Talebi İletildi</h2>
              <p className="text-sm text-text-muted mb-6">
                Danışman şu an çevrimdışı. Talebiniz başarıyla iletildi. Danışman panelinden onaylandığında ve odayı kurduğunda profilinizdeki aktif randevular kısmından ona katılabilirsiniz.
              </p>
              <button
                onClick={() => setAppointmentModal(false)}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl transition-colors"
              >
                Anladım
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* OFFLINE WARNING MODAL */}
      <AnimatePresence>
        {offlineWarningModal && selectedConsultant && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
              onClick={() => setOfflineWarningModal(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 10 }}
              className="w-full max-w-sm bg-surface border border-amber-500/30 shadow-[0_0_40px_rgba(245,158,11,0.15)] rounded-3xl p-8 relative overflow-hidden text-center z-10"
            >
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-400 to-orange-500" />
              <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-6 border border-amber-500/20 relative">
                <span className="text-amber-400 font-bold text-2xl">Z</span>
                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-500 animate-ping" />
              </div>
              <h2 className="text-xl font-heading font-bold text-white mb-2">Danışman Çevrimdışı</h2>
              <p className="text-sm text-zinc-400 mb-8 leading-relaxed">
                <strong className="text-white">{selectedConsultant.display_name}</strong> şu an çevrimdışı.
                Devam ederseniz, form bilgileriniz <strong>Randevu Talebi</strong> olarak iletilecektir.
                Danışman çevrimiçi olduğunda size dönüş yapacaktır.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    setOfflineWarningModal(false);
                    setStep("client_step1_name");
                  }}
                  className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl shadow-lg shadow-amber-500/20 font-bold transition-all hover:bg-amber-400"
                >
                  Anladım, Talep Oluştur
                </button>
                <button
                  onClick={() => {
                    setOfflineWarningModal(false);
                    setSelectedConsultant(null);
                  }}
                  className="w-full py-3.5 bg-white/5 text-zinc-300 rounded-xl border border-white/10 font-bold transition-all hover:bg-white/10 hover:text-white"
                >
                  Vazgeç, Başka Seç
                </button>
              </div>
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
