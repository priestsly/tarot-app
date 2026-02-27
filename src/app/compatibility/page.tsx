"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Heart, Sparkles, X } from "lucide-react";
import { ZODIAC_SIGNS, type ZodiacSign } from "@/lib/astrology";

// Compatibility matrix (index-based, 0=Aries...11=Pisces)
// Score: 0-100
const COMPAT: Record<string, Record<string, number>> = {
    "Koç": { "Koç": 65, "Boğa": 40, "İkizler": 80, "Yengeç": 35, "Aslan": 95, "Başak": 45, "Terazi": 60, "Akrep": 50, "Yay": 90, "Oğlak": 40, "Kova": 75, "Balık": 55 },
    "Boğa": { "Koç": 40, "Boğa": 70, "İkizler": 35, "Yengeç": 90, "Aslan": 45, "Başak": 95, "Terazi": 55, "Akrep": 85, "Yay": 30, "Oğlak": 95, "Kova": 40, "Balık": 85 },
    "İkizler": { "Koç": 80, "Boğa": 35, "İkizler": 60, "Yengeç": 45, "Aslan": 85, "Başak": 40, "Terazi": 95, "Akrep": 35, "Yay": 70, "Oğlak": 45, "Kova": 95, "Balık": 40 },
    "Yengeç": { "Koç": 35, "Boğa": 90, "İkizler": 45, "Yengeç": 65, "Aslan": 50, "Başak": 80, "Terazi": 35, "Akrep": 95, "Yay": 40, "Oğlak": 55, "Kova": 45, "Balık": 95 },
    "Aslan": { "Koç": 95, "Boğa": 45, "İkizler": 85, "Yengeç": 50, "Aslan": 70, "Başak": 55, "Terazi": 80, "Akrep": 40, "Yay": 95, "Oğlak": 35, "Kova": 60, "Balık": 50 },
    "Başak": { "Koç": 45, "Boğa": 95, "İkizler": 40, "Yengeç": 80, "Aslan": 55, "Başak": 65, "Terazi": 50, "Akrep": 90, "Yay": 35, "Oğlak": 95, "Kova": 50, "Balık": 75 },
    "Terazi": { "Koç": 60, "Boğa": 55, "İkizler": 95, "Yengeç": 35, "Aslan": 80, "Başak": 50, "Terazi": 65, "Akrep": 55, "Yay": 75, "Oğlak": 40, "Kova": 95, "Balık": 45 },
    "Akrep": { "Koç": 50, "Boğa": 85, "İkizler": 35, "Yengeç": 95, "Aslan": 40, "Başak": 90, "Terazi": 55, "Akrep": 70, "Yay": 45, "Oğlak": 75, "Kova": 35, "Balık": 95 },
    "Yay": { "Koç": 90, "Boğa": 30, "İkizler": 70, "Yengeç": 40, "Aslan": 95, "Başak": 35, "Terazi": 75, "Akrep": 45, "Yay": 65, "Oğlak": 50, "Kova": 85, "Balık": 40 },
    "Oğlak": { "Koç": 40, "Boğa": 95, "İkizler": 45, "Yengeç": 55, "Aslan": 35, "Başak": 95, "Terazi": 40, "Akrep": 75, "Yay": 50, "Oğlak": 70, "Kova": 55, "Balık": 80 },
    "Kova": { "Koç": 75, "Boğa": 40, "İkizler": 95, "Yengeç": 45, "Aslan": 60, "Başak": 50, "Terazi": 95, "Akrep": 35, "Yay": 85, "Oğlak": 55, "Kova": 65, "Balık": 50 },
    "Balık": { "Koç": 55, "Boğa": 85, "İkizler": 40, "Yengeç": 95, "Aslan": 50, "Başak": 75, "Terazi": 45, "Akrep": 95, "Yay": 40, "Oğlak": 80, "Kova": 50, "Balık": 70 },
};

function getCompatAnalysis(s1: ZodiacSign, s2: ZodiacSign, score: number) {
    const sameElement = s1.element === s2.element;
    const elements = [s1.element, s2.element].sort().join("-");

    let chemistry = "", challenge = "", advice = "";

    if (score >= 85) {
        chemistry = `${s1.name} ve ${s2.name} arasında neredeyse doğaüstü bir bağ var. Birbirinizi kelimesiz anlama gücüne sahipsiniz.`;
        challenge = "Bu kadar güçlü bir bağ bazen bağımlılığa dönüşebilir. Kendi bireyselliğinizi korumayı unutmayın.";
        advice = "Bu ilişki nadirdir, besleyin ve koruyun.";
    } else if (score >= 70) {
        chemistry = `Güçlü bir çekim ve uyum var. ${sameElement ? "Aynı elementi paylaşmanız doğal bir anlayış yaratıyor." : "Farklı elementleriniz birbirinizi tamamlıyor."}`;
        challenge = "Bazı noktalarda uzlaşma gerekebilir ama temel değerleriniz uyumlu.";
        advice = "İletişimi açık tutun, bu ilişki büyük potansiyel taşıyor.";
    } else if (score >= 50) {
        chemistry = `İlginç bir dinamik var. ${s1.name}'in ${s1.element} enerjisi ile ${s2.name}'in ${s2.element} enerjisi bazen çarpışsa da öğretici.`;
        challenge = "Birbirinizin farklılıklarını kabul etmek en büyük sınavınız olacak.";
        advice = "Sabır ve empati ile bu ilişki sizi büyütebilir.";
    } else {
        chemistry = `${s1.name} ve ${s2.name} arasında zorlayıcı ama dönüştürücü bir enerji var. Kolay bir yol değil ama imkansız da değil.`;
        challenge = "Temel bakış açılarınız çok farklı. İnatlaşmak yerine anlamaya çalışın.";
        advice = "Karşılıklı saygı ve kabul bu ilişkinin temelidir.";
    }

    // Category scores
    const loveSc = Math.min(100, score + (sameElement ? 10 : -5) + (Math.random() * 10 | 0));
    const commSc = Math.min(100, score + (elements.includes("Hava") ? 10 : 0) + (Math.random() * 8 | 0));
    const trustSc = Math.min(100, score + (elements.includes("Toprak") ? 8 : 0) + (Math.random() * 6 | 0));
    const sexSc = Math.min(100, score + (elements.includes("Ateş") || elements.includes("Su") ? 12 : 0) + (Math.random() * 10 | 0));

    return {
        chemistry, challenge, advice, categories: [
            { name: "Romantik Uyum", score: Math.round(loveSc), emoji: "💕" },
            { name: "İletişim", score: Math.round(commSc), emoji: "💬" },
            { name: "Güven", score: Math.round(trustSc), emoji: "🤝" },
            { name: "Tutku", score: Math.round(sexSc), emoji: "🔥" },
        ]
    };
}

export default function CompatibilityPage() {
    const router = useRouter();
    const [sign1, setSign1] = useState<ZodiacSign | null>(null);
    const [sign2, setSign2] = useState<ZodiacSign | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [selecting, setSelecting] = useState<1 | 2>(1);

    const score = useMemo(() => {
        if (!sign1 || !sign2) return 0;
        return COMPAT[sign1.name]?.[sign2.name] ?? 50;
    }, [sign1, sign2]);

    const analysis = useMemo(() => {
        if (!sign1 || !sign2) return null;
        return getCompatAnalysis(sign1, sign2, score);
    }, [sign1, sign2, score]);

    const handleCompare = () => {
        if (sign1 && sign2) setShowResult(true);
    };

    const reset = () => { setSign1(null); setSign2(null); setShowResult(false); setSelecting(1); };

    const scoreColor = score >= 80 ? "text-emerald-400" : score >= 60 ? "text-amber-400" : score >= 40 ? "text-orange-400" : "text-red-400";
    const scoreLabel = score >= 85 ? "Ruh Eşi" : score >= 70 ? "Güçlü Uyum" : score >= 50 ? "Gelişebilir" : "Zorlu Ama Öğretici";

    return (
        <div className="min-h-screen bg-[#0a0812] text-white relative overflow-hidden">
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vh] bg-pink-900/5 rounded-full blur-[250px]" />
            </div>

            <header className="sticky top-0 z-30 bg-[#0a0812]/80 backdrop-blur-xl border-b border-white/[0.04]">
                <div className="max-w-2xl mx-auto flex items-center justify-between px-4 sm:px-6 py-4">
                    <button onClick={() => router.push("/")} className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors text-sm"><ArrowLeft className="w-4 h-4" /> Geri</button>
                    <Heart className="w-4 h-4 text-pink-400/30" />
                </div>
            </header>

            <main className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 py-8 pb-20">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-heading font-semibold text-white/90 mb-2">Burç Uyumu</h1>
                    <p className="text-sm text-white/35">İki burcu seçin, uyumunuzu keşfedin.</p>
                </div>

                <AnimatePresence mode="wait">
                    {!showResult ? (
                        <motion.div key="select" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                            {/* Two sign slots */}
                            <div className="flex items-center gap-4 justify-center">
                                <button onClick={() => setSelecting(1)}
                                    className={`w-28 h-28 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all ${selecting === 1 ? "border-pink-500/40 bg-pink-500/5" : "border-white/10 bg-white/[0.02]"}`}>
                                    {sign1 ? (<><span className="text-3xl">{sign1.symbol}</span><span className="text-[10px] text-white/40 mt-1">{sign1.name}</span></>) : <span className="text-xs text-white/20">1. Burç</span>}
                                </button>

                                <Heart className={`w-6 h-6 ${sign1 && sign2 ? "text-pink-400/60" : "text-white/10"} transition-colors`} />

                                <button onClick={() => setSelecting(2)}
                                    className={`w-28 h-28 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all ${selecting === 2 ? "border-pink-500/40 bg-pink-500/5" : "border-white/10 bg-white/[0.02]"}`}>
                                    {sign2 ? (<><span className="text-3xl">{sign2.symbol}</span><span className="text-[10px] text-white/40 mt-1">{sign2.name}</span></>) : <span className="text-xs text-white/20">2. Burç</span>}
                                </button>
                            </div>

                            {/* Zodiac grid */}
                            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                                {ZODIAC_SIGNS.map(sign => {
                                    const isSelected = sign.id === sign1?.id || sign.id === sign2?.id;
                                    return (
                                        <button key={sign.id} onClick={() => {
                                            if (selecting === 1) { setSign1(sign); setSelecting(2); }
                                            else { setSign2(sign); }
                                        }} className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${isSelected ? "bg-pink-500/10 border border-pink-500/20" : "hover:bg-white/[0.04] border border-transparent"}`}>
                                            <span className="text-xl">{sign.symbol}</span>
                                            <span className="text-[9px] text-white/30">{sign.name}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            <button onClick={handleCompare} disabled={!sign1 || !sign2}
                                className="w-full flex items-center justify-center gap-2 px-5 py-4 bg-gradient-to-r from-pink-600/50 to-red-600/40 text-white/90 rounded-xl font-semibold border border-pink-500/20 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-30">
                                <Sparkles className="w-5 h-5" /> Uyumu Keşfet
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                            {/* Header */}
                            <div className="text-center mb-6">
                                <div className="flex items-center justify-center gap-4 mb-4">
                                    <div className="text-center"><span className="text-4xl block">{sign1!.symbol}</span><span className="text-xs text-white/40">{sign1!.name}</span></div>
                                    <Heart className="w-6 h-6 text-pink-400/50" />
                                    <div className="text-center"><span className="text-4xl block">{sign2!.symbol}</span><span className="text-xs text-white/40">{sign2!.name}</span></div>
                                </div>
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: "spring" }}
                                    className={`text-5xl font-heading font-bold ${scoreColor}`}>%{score}</motion.div>
                                <p className="text-sm text-white/40 mt-1">{scoreLabel}</p>
                            </div>

                            {/* Category bars */}
                            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 space-y-4">
                                {analysis?.categories.map((cat, i) => (
                                    <div key={cat.name}>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-xs text-white/40 flex items-center gap-1.5">{cat.emoji} {cat.name}</span>
                                            <span className="text-xs font-bold text-white/50">%{cat.score}</span>
                                        </div>
                                        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                                            <motion.div initial={{ width: 0 }} animate={{ width: `${cat.score}%` }} transition={{ duration: 1, delay: 0.2 + i * 0.15 }}
                                                className={`h-full rounded-full ${cat.score >= 80 ? "bg-emerald-500/60" : cat.score >= 60 ? "bg-amber-500/60" : "bg-orange-500/60"}`} />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Analysis */}
                            {analysis && (<>
                                <div className="bg-pink-500/[0.03] border border-pink-500/10 rounded-2xl p-5">
                                    <h3 className="text-[10px] text-pink-400/40 uppercase tracking-wider mb-2">Kimya</h3>
                                    <p className="text-sm text-white/60 leading-relaxed">{analysis.chemistry}</p>
                                </div>
                                <div className="bg-amber-500/[0.03] border border-amber-500/10 rounded-2xl p-5">
                                    <h3 className="text-[10px] text-amber-400/40 uppercase tracking-wider mb-2">Sınav</h3>
                                    <p className="text-sm text-white/60 leading-relaxed">{analysis.challenge}</p>
                                </div>
                                <div className="bg-purple-500/[0.04] border border-purple-500/15 rounded-2xl p-5 text-center">
                                    <p className="text-[10px] text-purple-400/40 uppercase tracking-wider mb-1">Tavsiye</p>
                                    <p className="text-sm text-purple-200/60 italic">&ldquo;{analysis.advice}&rdquo;</p>
                                </div>
                            </>)}

                            <button onClick={reset} className="w-full mt-4 text-xs text-white/25 hover:text-white/40 transition-colors text-center py-3">
                                Başka Burçları Dene
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
