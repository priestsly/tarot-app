"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Moon, Sparkles, Send, Loader2, BookOpen, AlertCircle } from "lucide-react";

export default function DreamsPage() {
    const router = useRouter();
    const [dream, setDream] = useState("");
    const [result, setResult] = useState<{ interpretation: string; symbols: string[]; advice: string; mood: string } | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async () => {
        if (!dream.trim() || loading) return;
        setLoading(true);
        setError("");
        setResult(null);
        try {
            const res = await fetch("/api/dreams", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dream }) });
            const data = await res.json();
            if (data.error) {
                setError(data.error);
            } else if (data.interpretation) {
                setResult(data);
            } else {
                setError("Yorum alınamadı. Lütfen tekrar deneyin.");
            }
        } catch {
            setError("Bağlantı hatası oluştu. Lütfen tekrar deneyin.");
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-[#0a0812] text-white relative overflow-hidden">
            {/* Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 inset-x-0 h-[50%] blur-[120px]" style={{ background: "linear-gradient(to bottom, rgba(30,20,80,0.15), transparent)" }} />
                <div className="absolute bottom-0 inset-x-0 h-[40%] blur-[120px]" style={{ background: "linear-gradient(to top, rgba(20,30,80,0.1), transparent)" }} />
            </div>

            <header className="sticky top-0 z-30 bg-[#0a0812]/80 backdrop-blur-xl border-b border-white/[0.04]">
                <div className="max-w-2xl mx-auto flex items-center justify-between px-4 sm:px-6 py-4">
                    <button onClick={() => router.push("/")} className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors text-sm"><ArrowLeft className="w-4 h-4" /> Geri</button>
                    <Moon className="w-4 h-4 text-blue-400/30" />
                </div>
            </header>

            <main className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 py-8 pb-20">
                {/* Hero */}
                <div className="text-center mb-10">
                    <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-blue-600/20 to-indigo-600/15 border border-blue-500/20 flex items-center justify-center">
                        <Moon className="w-7 h-7 text-blue-400/70" />
                    </div>
                    <h1 className="text-3xl font-heading font-semibold text-white/90 mb-3">Rüya Yorumu</h1>
                    <p className="text-sm text-white/40 max-w-md mx-auto leading-relaxed">
                        Rüyanızı olabildiğince detaylı anlatın. Gördüğünüz mekanlar, kişiler, nesneler ve hissettikleriniz ne kadar çok bilgi verirseniz, yorum o kadar derin olur.
                    </p>
                </div>

                {/* Input */}
                <div className="bg-white/[0.02] border border-white/[0.08] rounded-2xl p-5 mb-6 transition-all focus-within:border-blue-500/20 focus-within:bg-white/[0.03]">
                    <textarea
                        value={dream}
                        onChange={e => setDream(e.target.value)}
                        placeholder="Rüyamda bir ormandaydım, etrafta buz gibi bir su akıyordu. Birden kendimi uçarken buldum ve aşağıda tanımadığım bir şehir gördüm..."
                        className="w-full bg-transparent border-none text-sm text-white/70 placeholder:text-white/20 focus:outline-none resize-none h-36 leading-relaxed"
                    />
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/[0.04]">
                        <span className="text-[10px] text-white/15">{dream.length} karakter</span>
                        <button onClick={handleSubmit} disabled={!dream.trim() || loading}
                            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600/50 to-indigo-600/40 text-white/90 rounded-xl text-sm font-semibold border border-blue-500/20 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-30">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Rüyayı Yorumla
                        </button>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-500/[0.06] border border-red-500/15 rounded-2xl p-5 mb-6 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-400/60 shrink-0 mt-0.5" />
                        <p className="text-sm text-red-300/70 leading-relaxed">{error}</p>
                    </motion.div>
                )}

                {/* Result */}
                <AnimatePresence>
                    {result && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                            {/* Interpretation */}
                            <div className="bg-blue-500/[0.04] border border-blue-500/15 rounded-2xl p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <BookOpen className="w-4 h-4 text-blue-400/60" />
                                    <h3 className="text-xs font-bold text-white/50 uppercase tracking-wider">Rüyanızın Yorumu</h3>
                                </div>
                                <p className="text-[15px] text-white/70 leading-[1.8] whitespace-pre-line">{result.interpretation}</p>
                            </div>

                            {/* Symbols & Mood Row */}
                            <div className="flex gap-3">
                                <div className="flex-1 bg-white/[0.025] border border-white/[0.06] rounded-2xl p-5">
                                    <span className="text-[10px] text-white/30 uppercase tracking-wider block mb-3 font-bold">Semboller</span>
                                    <div className="flex flex-wrap gap-2">
                                        {result.symbols.map((s, i) => (
                                            <span key={i} className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/15 rounded-full text-xs text-blue-300/70 font-medium">{s}</span>
                                        ))}
                                    </div>
                                </div>
                                <div className="w-28 bg-white/[0.025] border border-white/[0.06] rounded-2xl p-5 flex flex-col items-center justify-center text-center">
                                    <span className="text-[10px] text-white/30 uppercase tracking-wider block mb-2 font-bold">Enerji</span>
                                    <span className="text-base text-white/70 font-semibold">{result.mood}</span>
                                </div>
                            </div>

                            {/* Advice */}
                            <div className="bg-purple-500/[0.05] border border-purple-500/20 rounded-2xl p-5 text-center">
                                <p className="text-[10px] text-purple-400/40 uppercase tracking-wider mb-2 font-bold">Bilinçaltı Tavsiyesi</p>
                                <p className="text-base text-purple-200/70 italic leading-relaxed">&ldquo;{result.advice}&rdquo;</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
