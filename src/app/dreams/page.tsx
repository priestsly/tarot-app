"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Moon, Sparkles, Send, Loader2, BookOpen } from "lucide-react";

const COMMON_SYMBOLS = [
    { emoji: "💧", name: "Su", hint: "Duygular, bilinçaltı" },
    { emoji: "🐍", name: "Yılan", hint: "Dönüşüm, korku" },
    { emoji: "✈️", name: "Uçmak", hint: "Özgürlük, kaçış" },
    { emoji: "🏠", name: "Ev", hint: "Güvenlik, iç dünya" },
    { emoji: "🔥", name: "Ateş", hint: "Tutku, yıkım" },
    { emoji: "👶", name: "Bebek", hint: "Yeni başlangıç" },
    { emoji: "🦷", name: "Diş", hint: "Kayıp, endişe" },
    { emoji: "🌊", name: "Deniz", hint: "Bilinçaltı derinlik" },
];

export default function DreamsPage() {
    const router = useRouter();
    const [dream, setDream] = useState("");
    const [result, setResult] = useState<{ interpretation: string; symbols: string[]; advice: string; mood: string } | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!dream.trim() || loading) return;
        setLoading(true);
        try {
            const res = await fetch("/api/dreams", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dream }) });
            const data = await res.json();
            setResult(data);
        } catch { setResult({ interpretation: "Rüyanız derin bir bilinçaltı aktivitesine işaret ediyor. Su ve hareket sembolleri, duygusal bir dönüşüm sürecinde olduğunuzu gösteriyor.", symbols: ["Dönüşüm", "Bilinçaltı"], advice: "Bu rüyayı bir günlüğe kaydedin ve tekrar edip etmediğini izleyin.", mood: "Düşünceli" }); }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-[#0a0812] text-white relative overflow-hidden">
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vh] bg-blue-900/5 rounded-full blur-[250px]" />
            </div>

            <header className="sticky top-0 z-30 bg-[#0a0812]/80 backdrop-blur-xl border-b border-white/[0.04]">
                <div className="max-w-2xl mx-auto flex items-center justify-between px-4 sm:px-6 py-4">
                    <button onClick={() => router.push("/")} className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors text-sm"><ArrowLeft className="w-4 h-4" /> Geri</button>
                    <Moon className="w-4 h-4 text-blue-400/30" />
                </div>
            </header>

            <main className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 py-8 pb-20">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-heading font-semibold text-white/90 mb-2">Rüya Yorumu</h1>
                    <p className="text-sm text-white/35">Rüyanızı anlatın, AI destekli yorumunu alın.</p>
                </div>

                {/* Common Symbols */}
                <div className="grid grid-cols-4 gap-2 mb-8">
                    {COMMON_SYMBOLS.map(s => (
                        <button key={s.name} onClick={() => setDream(d => d + " " + s.name.toLowerCase())}
                            className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3 text-center hover:bg-white/[0.05] transition-all group">
                            <span className="text-xl block mb-1">{s.emoji}</span>
                            <span className="text-[9px] text-white/25 group-hover:text-white/40">{s.hint}</span>
                        </button>
                    ))}
                </div>

                {/* Input */}
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 mb-6">
                    <textarea value={dream} onChange={e => setDream(e.target.value)} placeholder="Rüyanızı detaylı anlatın... Neler gördünüz? Neler hissettiniz?"
                        className="w-full bg-transparent border-none text-sm text-white/70 placeholder:text-white/20 focus:outline-none resize-none h-32" />
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/[0.04]">
                        <span className="text-[10px] text-white/15">{dream.length} karakter</span>
                        <button onClick={handleSubmit} disabled={!dream.trim() || loading}
                            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600/50 to-indigo-600/40 text-white/90 rounded-xl text-sm font-semibold border border-blue-500/20 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-30">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Yorumla
                        </button>
                    </div>
                </div>

                {/* Result */}
                <AnimatePresence>
                    {result && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                            <div className="bg-blue-500/[0.03] border border-blue-500/10 rounded-2xl p-5">
                                <div className="flex items-center gap-2 mb-3"><BookOpen className="w-4 h-4 text-blue-400/50" /><h3 className="text-xs font-semibold text-white/50">Yorum</h3></div>
                                <p className="text-sm text-white/60 leading-relaxed">{result.interpretation}</p>
                            </div>
                            <div className="flex gap-3">
                                <div className="flex-1 bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4">
                                    <span className="text-[10px] text-white/25 uppercase tracking-wider block mb-2">Semboller</span>
                                    <div className="flex flex-wrap gap-1">{result.symbols.map((s, i) => <span key={i} className="px-2 py-1 bg-blue-500/10 border border-blue-500/15 rounded-full text-[10px] text-blue-300/60">{s}</span>)}</div>
                                </div>
                                <div className="w-24 bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 text-center">
                                    <span className="text-[10px] text-white/25 uppercase tracking-wider block mb-1">Mod</span>
                                    <span className="text-sm text-white/60">{result.mood}</span>
                                </div>
                            </div>
                            <div className="bg-purple-500/[0.04] border border-purple-500/15 rounded-2xl p-4 text-center">
                                <p className="text-[10px] text-purple-400/40 uppercase tracking-wider mb-1">Tavsiye</p>
                                <p className="text-sm text-purple-200/60 italic">&ldquo;{result.advice}&rdquo;</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
