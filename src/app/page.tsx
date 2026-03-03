"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useRouter } from "next/navigation";
import { LogIn, ChevronRight, RefreshCw, ArrowRight, Sparkles, Wand2 } from "lucide-react";
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── CARD DATA ───────────────────────────────────────────────
const EXPLORE_CARDS = [
  { id: 'tarot', title: 'Tarot Danışmanları', desc: 'Canlı okumalar ve Mistik AI, gerçek zamanlı danışmanlık.', href: '/tarot', color: 'from-[#2d1b69] to-[#0f0a2e]', border: 'border-[#a855f7]/30', bgImage: '/assets/background/tarotd.jpg' },
  { id: 'meditation', title: 'Meditasyon', desc: 'Nefes, niyet ve mistik alfa frekanslarıyla zihnini dinlendir.', href: '/meditation', color: 'from-[#134e4a] to-[#042f2e]', border: 'border-teal-400/30', bgImage: '/assets/background/meditasyon.jpg' },
  { id: 'astrology', title: 'Astroloji', desc: 'Burçlar, gezegen geçişleri ve sana özel günlük harita yorumları.', href: '/astrology', color: 'from-[#1e3a5f] to-[#0c1929]', border: 'border-sky-400/30', bgImage: '/assets/background/astrology.jpg' },
  { id: 'dreams', title: 'Rüya Yorumu', desc: 'Gördüğün rüyaları sembolizm ve AI analizleriyle deşifre et.', href: '/dreams', color: 'from-[#1a1a4e] to-[#0a0a24]', border: 'border-indigo-400/30', bgImage: '/assets/background/dreams.jpg' },
  { id: 'candle', title: 'Mum Ritüeli', desc: 'Dijital mum yak, niyetini tut ve evrenin enerjisiyle şekillendir.', href: '/candle', color: 'from-[#7c2d12] to-[#371205]', border: 'border-orange-400/30', bgImage: '/assets/background/candle.jpg' },
  { id: 'numerology', title: 'Numeroloji', desc: 'İsminin ve doğum tarihinin arkasındaki yaşam şifresini keşfet.', href: '/numerology', color: 'from-[#713f12] to-[#3b1f06]', border: 'border-amber-400/30', bgImage: '/assets/background/numerology.jpg' },
  { id: 'coffee', title: 'Kahve Falı', desc: 'Fotoğrafı yükle ve telvelerdeki saklı anlamları ortaya çıkar.', href: '/coffee', color: 'from-[#5c2d0e] to-[#2a1506]', border: 'border-amber-500/30', bgImage: '/assets/background/coffee.jpg' },
  { id: 'compatibility', title: 'Burç Uyumu', desc: 'Partnerinle aranızdaki kozmik kimyayı ve sinastri analizini gör.', href: '/compatibility', color: 'from-[#831843] to-[#3b0a1e]', border: 'border-pink-400/30', bgImage: '/assets/background/compatibility.jpg' },
  { id: 'calendar', title: 'Kozmik Takvim', desc: 'Dolunaylar, gerilemeler ve önemli astrolojik geçiş günleri.', href: '/calendar', color: 'from-[#164e63] to-[#072a38]', border: 'border-cyan-400/30', bgImage: '/assets/background/calendar.jpg' },
  { id: 'affirmations', title: 'Afirmasyonlar', desc: 'Evrenden sana gönderilen günlük pozitif niyet ve olumlamalar.', href: '/affirmations', color: 'from-[#4a1d96] to-[#1e0b3e]', border: 'border-violet-400/30', bgImage: '/assets/background/affirmations.jpg' },
  { id: 'relationship', title: 'İlişki Koçu', desc: 'Aşk hayatındaki düğümleri çözecek AI destekli uzman tavsiyeleri.', href: '/relationship', color: 'from-[#9f1239] to-[#4c0519]', border: 'border-rose-400/30', bgImage: '/assets/background/relationship.jpg' },
  { id: 'birthchart', title: 'Doğum Haritası', desc: 'Doğduğun anda gökyüzü nasıldı? Kapsamlı SVG yıldız haritan.', href: '/birthchart', color: 'from-[#0c4a6e] to-[#042036]', border: 'border-sky-300/30', bgImage: '/assets/background/birthchart.jpg' },
  { id: 'mind', title: 'Cevaplar Kitabı', desc: 'Gözlerini kapat, soruna odaklan ve kainat sana cevabı versin.', href: '/mind-question', color: 'from-[#14532d] to-[#052e16]', border: 'border-emerald-400/30', bgImage: '/assets/background/mind.jpg' },
];

function SwipeableCard({ card, onSwipe, index, total, isFront }: { card: typeof EXPLORE_CARDS[0], onSwipe: (dir: number) => void, index: number, total: number, isFront: boolean }) {
  const router = useRouter();
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-150, 150], [-10, 10]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  const isDragging = useRef(false);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;

    if (offset > 100 || velocity > 500) {
      onSwipe(1); // Swipe Right (Önceki Kart)
    } else if (offset < -100 || velocity < -500) {
      onSwipe(-1); // Swipe Left (Sonraki Kart)
    } else {
      x.set(0); // Snap back
    }

    // Prevent immediate tap after drag
    setTimeout(() => {
      isDragging.current = false;
    }, 100);
  };

  const handleDragStart = () => {
    isDragging.current = true;
  };

  // Stacking logic based on index
  const scale = 1 - index * 0.06;
  const yOffset = index * 25;
  const zIndex = total - index;

  return (
    <motion.div
      style={{
        width: '100%',
        maxWidth: '300px',
        height: '400px',
        position: 'absolute',
        top: 0,
        left: 'calc(50% - 150px)',
        zIndex,
        x,
        rotate,
        scale: isFront ? 1 : scale,
        y: isFront ? 0 : yOffset,
        opacity: isFront ? opacity : (1 - index * 0.2),
      }}
      drag={isFront ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onTap={() => {
        if (isFront && !isDragging.current) router.push(card.href);
      }}
      animate={{ scale: isFront ? 1 : scale, y: isFront ? 0 : yOffset }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`rounded-[2rem] p-1 glass overflow-hidden shadow-2xl shadow-black/50 ${isFront ? "cursor-pointer active:scale-95 transition-transform" : ""}`}
    >
      <div className={`relative w-full h-full rounded-[1.8rem] bg-gradient-to-b ${card.color} border ${card.border} p-6 flex flex-col items-center justify-end overflow-hidden group`}>
        {/* Background Image - Full Bleed */}
        {card.bgImage && (
          <div
            className="absolute inset-0 bg-cover bg-center z-0 scale-105 group-hover:scale-110 transition-transform duration-700"
            style={{ backgroundImage: `url(${card.bgImage})` }}
          />
        )}
        {/* Dark gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent z-[1] pointer-events-none" />
        {/* Subtle inner border */}
        <div className="absolute inset-2 border border-white/10 rounded-[1.4rem] pointer-events-none z-[2]" />

        {/* Content - pinned to bottom */}
        <div className="relative z-10 w-full text-left mt-auto">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-heading font-bold text-white drop-shadow-lg">{card.title}</h2>
            {isFront && <ArrowRight className="w-5 h-5 text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all" />}
          </div>
          <p className="text-xs text-white/70 leading-relaxed font-medium line-clamp-3 mb-2">{card.desc}</p>
          {isFront && (
            <div className="flex items-center gap-1.5 mt-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              <span className="text-[9px] uppercase font-bold tracking-[0.2em] text-accent">Keşfetmek için tıkla</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function HomeContent() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isConsultant, setIsConsultant] = useState(false);
  const [cards, setCards] = useState(EXPLORE_CARDS);
  const supabase = createClient();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user;
      setUser(currentUser ?? null);

      if (currentUser) {
        const { data: profileData } = await supabase.from("profiles").select("full_name").eq("id", currentUser.id).single();
        if (profileData) setProfile(profileData);

        const { data: consultantData } = await supabase.from('consultants').select('id').eq('id', currentUser.id).maybeSingle();
        if (consultantData) setIsConsultant(true);
      }
    };
    fetchUser();
  }, []);

  const handleSwipe = (direction: number) => {
    setCards((prevCards) => {
      const newCards = [...prevCards];
      if (direction === -1) {
        // Sola kaydırıldı -> En üstteki kartı en alta at
        const frontCard = newCards.shift();
        if (frontCard) newCards.push(frontCard);
      } else {
        // Sağa kaydırıldı -> En alttaki kartı en üste getir (Geri Dön)
        const backCard = newCards.pop();
        if (backCard) newCards.unshift(backCard);
      }
      return newCards;
    });
  };

  const handleShuffle = () => {
    setCards((prevCards) => {
      const shuffled = [...prevCards].sort(() => Math.random() - 0.5);
      return shuffled;
    });
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#0a0510] relative overflow-hidden font-inter text-text isolate">
      {/* Mystical Background Lighting */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-purple-900/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-900/20 blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 pointer-events-none mix-blend-overlay" />

      {/* HEADER / NAVBAR */}
      <header className="w-full p-6 flex items-center justify-between relative z-40">
        <div className="flex items-center gap-3" onClick={() => router.push('/')} style={{ cursor: 'pointer' }}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20 border border-white/10">
            <Sparkles className="w-5 h-5 text-white/90" />
          </div>
          <div>
            <h1 className="text-lg font-heading font-bold text-white leading-tight">Mystic</h1>
            <p className="text-[9px] uppercase tracking-[0.3em] text-accent/80 font-bold">Tarot & Astroloji</p>
          </div>
        </div>

        {user ? (
          <div onClick={() => router.push("/profile")} className="flex items-center gap-3 glass px-3 py-1.5 rounded-full border border-white/5 cursor-pointer hover:bg-white/5 transition-colors">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-white capitalize">{profile?.full_name || "Gezgin"}</p>
              <p className="text-[9px] text-accent font-bold uppercase tracking-wider">{isConsultant ? "Danışman" : "Profilim"}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-white text-xs font-bold">
              {(profile?.full_name?.[0] || user.email?.[0] || "U").toUpperCase()}
            </div>
          </div>
        ) : (
          <button onClick={() => router.push("/login")} className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-black font-bold text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(255,255,255,0.2)] hover:bg-zinc-200 transition-colors">
            <LogIn className="w-4 h-4" /> Giriş Yap
          </button>
        )}
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 w-full relative flex flex-col items-center z-30 overflow-y-auto pb-12">
        {/* ======================================= */}
        {/* 1) TOP HERO - MAIN TAROT FEATURE ROW */}
        {/* ======================================= */}
        <div className="w-full max-w-lg px-6 mt-4 mb-10">
          <div className="text-center mb-6">
            <span className="px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-[10px] font-bold uppercase tracking-[0.2em] inline-flex items-center gap-2 mb-3 shadow-[0_0_10px_rgba(168,85,247,0.2)]">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
              Sonsuz İhtimaller Alanı
            </span>
            <h2 className="text-3xl font-heading font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-accent mb-2">
              Kaderinizi Şekillendirin
            </h2>
            <p className="text-xs text-text-muted">Canlı danışmanlar ile gerçek zamanlı Tarot okumaları veya Yapay Zeka ile mistik analizler.</p>
          </div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push('/tarot')}
            className="w-full relative rounded-3xl p-1 bg-gradient-to-br from-fuchsia-500/40 via-purple-600/40 to-indigo-600/40 shadow-[0_0_30px_rgba(168,85,247,0.15)] cursor-pointer group"
          >
            {/* Inner Glow */}
            <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-r from-fuchsia-500/20 to-indigo-500/20 blur-xl" />

            <div className="relative bg-surface/90 backdrop-blur-xl rounded-[1.4rem] p-6 border border-white/5 overflow-hidden flex items-center justify-between">
              {/* Feature Background Image */}
              <div
                className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-soft-light group-hover:scale-110 transition-transform duration-1000"
                style={{ backgroundImage: "url('/assets/background/tarot.jpg')" }}
              />
              {/* Magic Graphic Overlay inside box */}
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-fuchsia-500/20 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute right-0 bottom-0 opacity-10 grayscale group-hover:grayscale-0 group-hover:opacity-30 transition-all pointer-events-none">
                <span className="text-8xl">🔮</span>
              </div>

              <div className="relative z-10">
                <h3 className="text-xl font-heading font-bold text-white mb-1 flex items-center gap-2">
                  Tarot Danışmanlığı <Wand2 className="w-4 h-4 text-fuchsia-400" />
                </h3>
                <p className="text-xs text-zinc-400 max-w-[200px] mb-4">Gerçek insanlarla video görüşmesi veya AI ile hızlı yorumlar.</p>
                <button className="px-5 py-2.5  rounded-xl text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-fuchsia-600/20 group-hover:shadow-fuchsia-600/40 transition-all flex items-center gap-2">
                  Hemen Başla <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Divider / Spacer */}
        <div className="w-3/4 max-w-sm h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-10" />

        {/* ======================================= */}
        {/* 2) BOTTOM SECTION - EXPLORE CARD SWIPER */}
        {/* ======================================= */}
        <div className="w-full flex flex-col items-center">
          <div className="text-center mb-8 relative z-30 pointer-events-none">
            <h2 className="text-[10px] text-amber-500 uppercase font-bold tracking-[0.4em] mb-2 flex items-center justify-center gap-2">
              <span className="w-8 h-px bg-amber-500/30" />
              Evreni Keşfet
              <span className="w-8 h-px bg-amber-500/30" />
            </h2>
            <p className="text-xs text-white/40 font-medium">Bambaşka bir krallık için kartı kaydırın.</p>
          </div>

          {/* Deck Container */}
          <div className="relative w-full h-[400px] flex justify-center perspective-[1200px]">
            <AnimatePresence>
              {cards.slice(0, 4).map((card, idx) => (
                <SwipeableCard
                  key={card.id}
                  card={card}
                  index={idx}
                  total={cards.length}
                  isFront={idx === 0}
                  onSwipe={handleSwipe}
                />
              ))}
            </AnimatePresence>
          </div>

          {/* Deck Controls */}
          <div className="mt-10 flex items-center gap-8 relative z-30">
            <button
              onClick={() => handleSwipe(1)} // Right swipe -> gets previous card
              className="w-12 h-12 rounded-full border border-white/10 glass flex items-center justify-center text-white/50 hover:text-white hover:bg-white/5 transition-all shadow-lg"
              title="Önceki"
            >
              <motion.div whileHover={{ x: -3 }}><ChevronRight className="w-5 h-5 rotate-180" /></motion.div>
            </button>
            <button
              onClick={handleShuffle}
              className="flex flex-col items-center gap-2 text-white/30 hover:text-accent transition-colors"
              title="Desteyi Karıştır"
            >
              <div className="w-14 h-14 rounded-full border border-white/10 glass flex items-center justify-center text-current hover:bg-white/5 transition-all shadow-lg">
                <RefreshCw className="w-5 h-5" />
              </div>
              <span className="text-[9px] uppercase font-bold tracking-widest">Karıştır</span>
            </button>
            <button
              onClick={() => handleSwipe(-1)} // Left swipe -> gets next card
              className="w-12 h-12 rounded-full border border-white/10 glass flex items-center justify-center text-white/50 hover:text-white hover:bg-white/5 transition-all shadow-lg"
              title="Sonraki (Sola Kaydır)"
            >
              <motion.div whileHover={{ x: 3 }}><ChevronRight className="w-5 h-5" /></motion.div>
            </button>
          </div>
        </div>

      </main>

    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-[100dvh] bg-[#0a0510] flex items-center justify-center"><div className="w-10 h-10 rounded-full border border-white/10 border-t-accent animate-spin" /></div>}>
      <HomeContent />
    </Suspense>
  );
}
