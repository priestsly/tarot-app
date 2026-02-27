"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Flame, Heart, Coins, Briefcase, Shield, Star, Eye, Sparkles } from "lucide-react";

const CANDLES = [
    { id: "love", name: "Aşk & İlişkiler", color: "#e84070", glow: "rgba(232,64,112,0.3)", icon: <Heart className="w-5 h-5" />, desc: "Romantik bağları güçlendirin." },
    { id: "money", name: "Bolluk & Bereket", color: "#d4a428", glow: "rgba(212,164,40,0.3)", icon: <Coins className="w-5 h-5" />, desc: "Maddi zenginliği çekin." },
    { id: "career", name: "Kariyer & Başarı", color: "#4488ee", glow: "rgba(68,136,238,0.3)", icon: <Briefcase className="w-5 h-5" />, desc: "Professional hedeflerinize ulaşın." },
    { id: "protect", name: "Koruma & Arınma", color: "#f0f0f0", glow: "rgba(240,240,240,0.2)", icon: <Shield className="w-5 h-5" />, desc: "Negatif enerjilerden arının." },
    { id: "spirit", name: "Ruhsal Gelişim", color: "#a855f7", glow: "rgba(168,85,247,0.3)", icon: <Star className="w-5 h-5" />, desc: "Sezgilerinizi güçlendirin." },
    { id: "clarity", name: "Berraklık & Görü", color: "#06b6d4", glow: "rgba(6,182,212,0.3)", icon: <Eye className="w-5 h-5" />, desc: "Zihinsel berraklık kazanın." },
];

function CandleAnimation({ color, glow }: { color: string; glow: string }) {
    return (
        <div className="relative w-20 h-48 flex flex-col items-center justify-end">
            {/* Flame */}
            <motion.div className="relative mb-0 z-10" animate={{ y: [0, -3, 0, -2, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
                <motion.div className="w-5 h-8 rounded-full" animate={{ scaleX: [1, 1.1, 0.9, 1.05, 1], scaleY: [1, 1.15, 0.95, 1.1, 1], opacity: [0.9, 1, 0.85, 1, 0.9] }}
                    transition={{ duration: 1.5, repeat: Infinity }} style={{ background: `linear-gradient(to top, ${color}, #fbbf24, #fef3c7)`, filter: `drop-shadow(0 0 15px ${glow}) drop-shadow(0 0 30px ${glow})` }} />
                <motion.div className="absolute top-1 left-1/2 -translate-x-1/2 w-2 h-4 bg-white/80 rounded-full blur-[2px]" animate={{ opacity: [0.6, 1, 0.7, 0.9, 0.6] }} transition={{ duration: 1, repeat: Infinity }} />
            </motion.div>
            {/* Wick */}
            <div className="w-0.5 h-3 bg-gray-600 z-10" />
            {/* Candle body */}
            <div className="w-12 h-28 rounded-t-sm rounded-b-lg relative overflow-hidden" style={{ background: `linear-gradient(to bottom, ${color}dd, ${color}88)` }}>
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 h-4 bg-black/10" />
            </div>
            {/* Base */}
            <div className="w-16 h-3 rounded-b-lg bg-gray-700/50 border-t border-gray-600/30" />
            {/* Glow on surface */}
            <div className="absolute bottom-0 w-40 h-20 rounded-full blur-[30px] opacity-30" style={{ backgroundColor: glow }} />
        </div>
    );
}

export default function CandlePage() {
    const router = useRouter();
    const [selectedCandle, setSelectedCandle] = useState(CANDLES[0]);
    const [intention, setIntention] = useState("");
    const [isLit, setIsLit] = useState(false);
    const [timeLeft, setTimeLeft] = useState(180);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const [isComplete, setIsComplete] = useState(false);

    // Ambient sound
    const ctxRef = useRef<AudioContext | null>(null);
    const playAmbient = useCallback(() => {
        if (ctxRef.current) return;
        try {
            const ctx = new AudioContext(); ctxRef.current = ctx;
            const master = ctx.createGain(); master.gain.setValueAtTime(0.03, ctx.currentTime); master.connect(ctx.destination);
            [110, 165, 220].forEach(f => { const o = ctx.createOscillator(); const g = ctx.createGain(); o.type = 'sine'; o.frequency.value = f; o.detune.value = (Math.random() - 0.5) * 6; g.gain.value = 0.02; o.connect(g); g.connect(master); o.start(); });
        } catch { }
    }, []);

    const startRitual = () => {
        if (!intention.trim()) return;
        setIsLit(true);
        setTimeLeft(180);
        setIsComplete(false);
        playAmbient();
        timerRef.current = setInterval(() => setTimeLeft(t => t <= 1 ? (clearInterval(timerRef.current!), setIsComplete(true), 0) : t - 1), 1000);
    };

    const reset = () => { setIsLit(false); setIsComplete(false); setIntention(""); if (timerRef.current) clearInterval(timerRef.current); if (ctxRef.current) { ctxRef.current.close(); ctxRef.current = null; } };

    useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); if (ctxRef.current) ctxRef.current.close(); }, []);

    const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

    return (
        <div className="min-h-screen bg-[#0a0812] text-white relative overflow-hidden">
            <div className="fixed inset-0 pointer-events-none">
                {isLit && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0" style={{ background: `radial-gradient(ellipse at center 60%, ${selectedCandle.glow} 0%, transparent 70%)` }} />}
            </div>

            <header className="sticky top-0 z-30 bg-[#0a0812]/80 backdrop-blur-xl border-b border-white/[0.04]">
                <div className="max-w-2xl mx-auto flex items-center justify-between px-4 sm:px-6 py-4">
                    <button onClick={() => { reset(); router.push("/"); }} className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors text-sm"><ArrowLeft className="w-4 h-4" /> Geri</button>
                    <Flame className="w-4 h-4 text-orange-400/30" />
                </div>
            </header>

            <main className="relative z-10 max-w-lg mx-auto px-4 sm:px-6 py-8 pb-20">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-heading font-semibold text-white/90 mb-2">Mum Ritüeli</h1>
                    <p className="text-sm text-white/35">Niyetinizi belirleyin, mumunuzu yakın.</p>
                </div>

                {!isLit ? (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                        {/* Candle Selection */}
                        <div className="grid grid-cols-3 gap-2">
                            {CANDLES.map(c => (
                                <button key={c.id} onClick={() => setSelectedCandle(c)}
                                    className={`p-3 rounded-xl border transition-all text-center ${selectedCandle.id === c.id ? "border-white/20 bg-white/[0.05]" : "border-white/[0.06] bg-white/[0.01] hover:bg-white/[0.03]"}`}>
                                    <div className="w-3 h-3 rounded-full mx-auto mb-2" style={{ backgroundColor: c.color, boxShadow: `0 0 10px ${c.glow}` }} />
                                    <span className="text-[10px] text-white/50 block">{c.name}</span>
                                </button>
                            ))}
                        </div>

                        {/* Intention */}
                        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
                            <label className="text-[10px] text-white/25 uppercase tracking-wider block mb-2">Niyetiniz</label>
                            <textarea value={intention} onChange={e => setIntention(e.target.value)} placeholder="Ne diliyorsunuz? Niyetinizi yazın..."
                                className="w-full bg-transparent text-sm text-white/70 placeholder:text-white/20 focus:outline-none resize-none h-20" />
                        </div>

                        <button onClick={startRitual} disabled={!intention.trim()}
                            className="w-full flex items-center justify-center gap-2 px-5 py-4 bg-gradient-to-r from-orange-600/50 to-amber-600/40 text-white/90 rounded-xl font-semibold border border-orange-500/20 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-30">
                            <Flame className="w-5 h-5" /> Mumu Yak
                        </button>
                    </motion.div>
                ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center">
                        {/* Candle */}
                        <div className="mb-8">
                            {!isComplete ? <CandleAnimation color={selectedCandle.color} glow={selectedCandle.glow} /> : (
                                <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="text-center">
                                    <Sparkles className="w-12 h-12 text-amber-400/50 mx-auto mb-4" />
                                    <h2 className="text-xl font-heading font-semibold text-white/80 mb-2">Ritüel Tamamlandı</h2>
                                    <p className="text-xs text-white/30">Niyetiniz evrene iletildi.</p>
                                </motion.div>
                            )}
                        </div>

                        {/* Timer */}
                        {!isComplete && (
                            <div className="text-center mb-6">
                                <span className="text-4xl font-mono text-white/50 tracking-wider">{fmt(timeLeft)}</span>
                                <p className="text-[10px] text-white/20 mt-2 uppercase tracking-wider">Mumunuz yanıyor...</p>
                            </div>
                        )}

                        {/* Intention display */}
                        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 w-full text-center mb-6">
                            <span className="text-[10px] text-white/20 uppercase tracking-wider block mb-1">Niyetiniz</span>
                            <p className="text-sm text-white/50 italic">&ldquo;{intention}&rdquo;</p>
                        </div>

                        <button onClick={reset} className="text-xs text-white/25 hover:text-white/40 transition-colors">
                            {isComplete ? "Yeni Ritüel Başlat" : "İptal Et"}
                        </button>
                    </motion.div>
                )}
            </main>
        </div>
    );
}
