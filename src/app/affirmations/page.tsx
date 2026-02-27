"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, RefreshCw, Share2, Heart, Sparkles } from "lucide-react";

const AFFIRMATIONS = [
    "Bugün evren benim yanımda. Her adımım doğru yöne.",
    "Ben yeterli, güçlü ve değerliyim.",
    "Bolluk ve bereket hayatıma akıyor.",
    "Geçmişi bırakıyorum, şimdide huzurla yaşıyorum.",
    "Korkularım beni tanımlamaz, cesaretim yolumu açar.",
    "Sevgiyi veriyorum ve bolca geri alıyorum.",
    "Bugün beklenmedik güzelliklerle dolu.",
    "İç huzurum her koşulda korunuyor.",
    "Hayallerim gerçekleşmeyi hak ediyor ve ben de.",
    "Her zorluğun içinde bir hediye saklı.",
    "Sezgilerime güveniyorum, onlar beni doğruya yönlendiriyor.",
    "Bugün kendime şefkat ve sevgi gösteriyorum.",
    "Evrenin zamanlamasına teslim oluyorum.",
    "Ben dönüşüm sürecindeyim ve bu güzel bir şey.",
    "Kalbim açık, zihnim berrak, ruhum özgür.",
    "Bugün bir mucize olabilir ve ben buna hazırım.",
    "Negatif enerjileri bırakıyorum, yerine ışık doluyor.",
    "Ben tam olduğum yerde olmalıyım.",
    "Minnettarlık kalbimi genişletiyor.",
    "Bugün hayatımdaki güzellikleri fark ediyorum.",
    "Değişim beni korkutmaz, büyütür.",
    "Enerjim yüksek, niyetim net.",
    "Ruhum evrenin bir parçası, bağlıyım ve güvendeyim.",
    "Bugün kendimi yargılamayı bırakıyorum.",
    "Sevdiğim insanlarla bağım güçleniyor.",
    "Maddi ve manevi zenginlik benim doğal halim.",
    "Hayat bana ne verirse versin, minnettarım.",
    "Bugün sadece iyi enerjiyi kabul ediyorum.",
    "Ben yolculuğumda tam olması gereken yerdeyim.",
    "İçsel bilgeliğim en güvenilir rehberim.",
];

const CATEGORIES = [
    { id: "all", name: "Genel", emoji: "✨" },
    { id: "love", name: "Sevgi", emoji: "💕" },
    { id: "abundance", name: "Bolluk", emoji: "🌟" },
    { id: "peace", name: "Huzur", emoji: "🕊️" },
    { id: "courage", name: "Cesaret", emoji: "🔥" },
];

const BG_GRADIENTS = [
    "from-purple-900/20 via-indigo-900/10 to-[#0a0812]",
    "from-blue-900/20 via-cyan-900/10 to-[#0a0812]",
    "from-pink-900/20 via-rose-900/10 to-[#0a0812]",
    "from-amber-900/20 via-orange-900/10 to-[#0a0812]",
    "from-emerald-900/20 via-teal-900/10 to-[#0a0812]",
];

export default function AffirmationsPage() {
    const router = useRouter();
    const today = new Date();
    const seed = today.getDate() + today.getMonth() * 31 + today.getFullYear();

    const dailyAffirmation = AFFIRMATIONS[seed % AFFIRMATIONS.length];
    const dailyBg = BG_GRADIENTS[seed % BG_GRADIENTS.length];

    const [current, setCurrent] = useState(dailyAffirmation);
    const [liked, setLiked] = useState(false);
    const [key, setKey] = useState(0);

    const shuffle = () => {
        const next = AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)];
        setCurrent(next);
        setLiked(false);
        setKey(k => k + 1);
    };

    const share = async () => {
        try {
            await navigator.share({ text: `✨ ${current}\n\n— Mystic Tarot` });
        } catch {
            await navigator.clipboard.writeText(`✨ ${current}\n\n— Mystic Tarot`);
        }
    };

    return (
        <div className={`min-h-screen bg-gradient-to-b ${dailyBg} text-white relative overflow-hidden`}>
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[60vw] h-[40vh] bg-purple-500/3 rounded-full blur-[200px]" />
            </div>

            <header className="sticky top-0 z-30 bg-transparent">
                <div className="max-w-2xl mx-auto flex items-center justify-between px-4 sm:px-6 py-4">
                    <button onClick={() => router.push("/")} className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors text-sm"><ArrowLeft className="w-4 h-4" /> Geri</button>
                </div>
            </header>

            <main className="relative z-10 max-w-lg mx-auto px-6 flex flex-col items-center justify-center" style={{ minHeight: "calc(100vh - 120px)" }}>
                <AnimatePresence mode="wait">
                    <motion.div key={key} initial={{ opacity: 0, y: 30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.5 }}
                        className="text-center mb-12">
                        <Sparkles className="w-6 h-6 text-purple-400/30 mx-auto mb-6" />
                        <p className="text-2xl sm:text-3xl font-heading font-light text-white/80 leading-relaxed italic">
                            &ldquo;{current}&rdquo;
                        </p>
                    </motion.div>
                </AnimatePresence>

                <div className="flex items-center gap-4">
                    <button onClick={() => setLiked(!liked)} className={`p-3 rounded-full border transition-all ${liked ? "bg-pink-500/20 border-pink-500/30 text-pink-400" : "border-white/10 text-white/25 hover:text-white/50"}`}>
                        <Heart className={`w-5 h-5 ${liked ? "fill-current" : ""}`} />
                    </button>
                    <button onClick={shuffle} className="p-3 rounded-full border border-white/10 text-white/25 hover:text-white/50 hover:border-white/20 transition-all">
                        <RefreshCw className="w-5 h-5" />
                    </button>
                    <button onClick={share} className="p-3 rounded-full border border-white/10 text-white/25 hover:text-white/50 hover:border-white/20 transition-all">
                        <Share2 className="w-5 h-5" />
                    </button>
                </div>

                <p className="text-[9px] text-white/10 uppercase tracking-[0.3em] mt-12">
                    {today.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                </p>
            </main>
        </div>
    );
}
