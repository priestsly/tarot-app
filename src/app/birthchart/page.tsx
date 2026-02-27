"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles } from "lucide-react";
import { getZodiacSign, getRisingSign, ZODIAC_SIGNS } from "@/lib/astrology";

const HOUSES = ["Benlik", "Para", "İletişim", "Yuva", "Yaratıcılık", "Sağlık", "İlişki", "Dönüşüm", "Felsefe", "Kariyer", "Topluluk", "Ruhsal"];

function BirthChart({ sunIdx, risingIdx }: { sunIdx: number; risingIdx: number }) {
    const size = 300;
    const cx = size / 2, cy = size / 2, r = size / 2 - 20;

    return (
        <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[300px] mx-auto">
            {/* Outer circle */}
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
            <circle cx={cx} cy={cy} r={r - 30} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
            <circle cx={cx} cy={cy} r={r - 60} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />

            {/* House lines & signs */}
            {Array.from({ length: 12 }).map((_, i) => {
                const angle = (i * 30 - 90) * (Math.PI / 180);
                const angle2 = ((i * 30 + 15) - 90) * (Math.PI / 180);
                const x1 = cx + (r - 60) * Math.cos(angle);
                const y1 = cy + (r - 60) * Math.sin(angle);
                const x2 = cx + r * Math.cos(angle);
                const y2 = cy + r * Math.sin(angle);
                const tx = cx + (r - 15) * Math.cos(angle2);
                const ty = cy + (r - 15) * Math.sin(angle2);
                const signIdx = (risingIdx + i) % 12;
                const isSun = signIdx === sunIdx;

                return (
                    <g key={i}>
                        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
                        <text x={tx} y={ty} textAnchor="middle" dominantBaseline="middle"
                            className={`text-[10px] ${isSun ? "fill-amber-400/80" : "fill-white/20"}`}>
                            {ZODIAC_SIGNS[signIdx].symbol}
                        </text>
                    </g>
                );
            })}

            {/* Sun marker */}
            {(() => {
                const sunHouse = ((sunIdx - risingIdx + 12) % 12);
                const angle = ((sunHouse * 30 + 15) - 90) * (Math.PI / 180);
                const sx = cx + (r - 45) * Math.cos(angle);
                const sy = cy + (r - 45) * Math.sin(angle);
                return <circle cx={sx} cy={sy} r={4} fill="rgba(251,191,36,0.6)" />;
            })()}

            {/* ASC marker */}
            <text x={cx + r + 2} y={cy} textAnchor="start" dominantBaseline="middle" className="text-[8px] fill-purple-400/60">ASC</text>

            {/* Center */}
            <circle cx={cx} cy={cy} r={8} fill="rgba(168,85,247,0.15)" stroke="rgba(168,85,247,0.3)" strokeWidth="0.5" />
        </svg>
    );
}

export default function BirthChartPage() {
    const router = useRouter();
    const [birthDate, setBirthDate] = useState("");
    const [birthTime, setBirthTime] = useState("");
    const [result, setResult] = useState<{ sun: number; rising: number } | null>(null);

    const calculate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!birthDate) return;
        const [, m, d] = birthDate.split("-").map(Number);
        const sunSign = getZodiacSign(m, d);
        const sunIdx = ZODIAC_SIGNS.findIndex(s => s.id === sunSign.id);

        let risingIdx = sunIdx;
        if (birthTime) {
            const [h, min] = birthTime.split(":").map(Number);
            const rising = getRisingSign(m, d, h, min);
            risingIdx = ZODIAC_SIGNS.findIndex(s => s.id === rising.id);
        }
        setResult({ sun: sunIdx, rising: risingIdx });
    };

    return (
        <div className="min-h-screen bg-[#0a0812] text-white relative overflow-hidden">
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] h-[70vh] bg-indigo-900/5 rounded-full blur-[250px]" />
            </div>

            <header className="sticky top-0 z-30 bg-[#0a0812]/80 backdrop-blur-xl border-b border-white/[0.04]">
                <div className="max-w-2xl mx-auto flex items-center justify-between px-4 sm:px-6 py-4">
                    <button onClick={() => router.push("/")} className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors text-sm"><ArrowLeft className="w-4 h-4" /> Geri</button>
                    <h1 className="text-sm font-semibold text-white/50">Doğum Haritası</h1>
                    <div className="w-10" />
                </div>
            </header>

            <main className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 py-8 pb-20">
                {!result ? (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
                        <h2 className="text-center text-lg font-heading font-semibold text-white/70 mb-6">Doğum Haritanızı Oluşturun</h2>
                        <form onSubmit={calculate} className="space-y-4">
                            <div>
                                <label className="text-[10px] text-white/30 uppercase tracking-wider block mb-1.5">Doğum Tarihi *</label>
                                <input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)}
                                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white/70 focus:outline-none focus:ring-1 focus:ring-indigo-500/30" />
                            </div>
                            <div>
                                <label className="text-[10px] text-white/30 uppercase tracking-wider block mb-1.5">Doğum Saati <span className="text-white/15">(daha doğru sonuç)</span></label>
                                <input type="time" value={birthTime} onChange={e => setBirthTime(e.target.value)}
                                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white/70 focus:outline-none focus:ring-1 focus:ring-indigo-500/30" />
                            </div>
                            <button type="submit" disabled={!birthDate}
                                className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-600/50 to-purple-600/40 text-white/90 rounded-xl font-semibold text-sm border border-indigo-500/20 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-30">
                                <Sparkles className="w-4 h-4" /> Haritayı Oluştur
                            </button>
                        </form>
                    </motion.div>
                ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                        {/* Chart */}
                        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
                            <BirthChart sunIdx={result.sun} risingIdx={result.rising} />
                        </div>

                        {/* Signs info */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-amber-500/[0.04] border border-amber-500/15 rounded-2xl p-4 text-center">
                                <span className="text-3xl">{ZODIAC_SIGNS[result.sun].symbol}</span>
                                <p className="text-[10px] text-amber-400/40 uppercase tracking-wider mt-1">Güneş</p>
                                <p className="text-xs font-semibold text-white/60">{ZODIAC_SIGNS[result.sun].name}</p>
                            </div>
                            <div className="bg-purple-500/[0.04] border border-purple-500/15 rounded-2xl p-4 text-center">
                                <span className="text-3xl">{ZODIAC_SIGNS[result.rising].symbol}</span>
                                <p className="text-[10px] text-purple-400/40 uppercase tracking-wider mt-1">Yükselen</p>
                                <p className="text-xs font-semibold text-white/60">{ZODIAC_SIGNS[result.rising].name}</p>
                            </div>
                        </div>

                        {/* Houses */}
                        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
                            <h3 className="text-[10px] text-white/25 uppercase tracking-[0.2em] mb-3">12 Ev</h3>
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                {HOUSES.map((house, i) => {
                                    const signIdx = (result.rising + i) % 12;
                                    return (
                                        <div key={i} className="bg-white/[0.02] rounded-lg p-2 text-center">
                                            <span className="text-[10px] text-white/20">{i + 1}.</span>
                                            <span className="text-lg block">{ZODIAC_SIGNS[signIdx].symbol}</span>
                                            <span className="text-[8px] text-white/25 block">{house}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <button onClick={() => setResult(null)} className="w-full text-xs text-white/25 hover:text-white/40 transition-colors text-center py-3">Yeniden Hesapla</button>
                    </motion.div>
                )}
            </main>
        </div>
    );
}
