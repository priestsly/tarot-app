"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Hash, Sparkles } from "lucide-react";

function calcLifePath(date: string): number {
    const digits = date.replace(/-/g, "").split("").map(Number);
    let sum = digits.reduce((a, b) => a + b, 0);
    while (sum > 9 && sum !== 11 && sum !== 22 && sum !== 33) { sum = String(sum).split("").map(Number).reduce((a, b) => a + b, 0); }
    return sum;
}

function calcNameNumber(name: string): number {
    const map: Record<string, number> = { a: 1, b: 2, c: 3, ç: 3, d: 4, e: 5, f: 6, g: 7, ğ: 7, h: 8, i: 9, ı: 9, j: 1, k: 2, l: 3, m: 4, n: 5, o: 6, ö: 6, p: 7, r: 9, s: 1, ş: 1, t: 2, u: 3, ü: 3, v: 4, y: 7, z: 8 };
    let sum = name.toLowerCase().split("").reduce((a, c) => a + (map[c] || 0), 0);
    while (sum > 9 && sum !== 11 && sum !== 22) { sum = String(sum).split("").map(Number).reduce((a, b) => a + b, 0); }
    return sum;
}

const MEANINGS: Record<number, { title: string; desc: string; strengths: string[]; challenges: string[] }> = {
    1: { title: "Lider", desc: "Bağımsız, yenilikçi ve öncü. Kendi yolunu çizen, cesareti bol bir ruh.", strengths: ["Özgünlük", "Girişimcilik", "Kararlılık"], challenges: ["İnatçılık", "Yalnızlık eğilimi"] },
    2: { title: "Diplomat", desc: "Uyumlu, hassas ve işbirlikçi. İlişkilerde denge kurma ustası.", strengths: ["Empati", "Sabır", "İşbirliği"], challenges: ["Kararsızlık", "Aşırı hassasiyet"] },
    3: { title: "Yaratıcı", desc: "İfade gücü yüksek, neşeli ve ilham verici. Sanatsal ruha sahip.", strengths: ["Yaratıcılık", "İletişim", "İyimserlik"], challenges: ["Dağınıklık", "Yüzeysellik riski"] },
    4: { title: "İnşaatçı", desc: "Disiplinli, pratik ve güvenilir. Sağlam temeller kuran bir yapı ustası.", strengths: ["Düzen", "Çalışkanlık", "Güvenilirlik"], challenges: ["Katılık", "Aşırı kontrol"] },
    5: { title: "Özgür Ruh", desc: "Maceracı, çok yönlü ve değişime açık. Hayatın her rengini deneyimlemek ister.", strengths: ["Esneklik", "Cesaret", "Uyum"], challenges: ["Sabırsızlık", "Taahhüt korkusu"] },
    6: { title: "Şifacı", desc: "Sorumluluk sahibi, sevgi dolu ve koruyucu. Ailenin ve toplumun kalbi.", strengths: ["Fedakarlık", "Uyum", "Sorumluluk"], challenges: ["Mükemmeliyetçilik", "Kontrol"] },
    7: { title: "Mistik", desc: "Analitik, sezgisel ve derin düşünen. Gerçeğin peşinde koşan bir araştırmacı.", strengths: ["Sezgi", "Analiz", "Bilgelik"], challenges: ["İzolasyon", "Şüphecilik"] },
    8: { title: "Güç Sahibi", desc: "Hırslı, otoriteli ve başarıya odaklı. Maddi ve manevi zenginliği bir arada taşır.", strengths: ["Liderlik", "Vizyon", "Dayanıklılık"], challenges: ["Materyalizm", "İş bağımlılığı"] },
    9: { title: "İnsancıl", desc: "İdealist, cömert ve evrensel sevgi taşıyan. Dünyayı iyileştirmek için gelmiş.", strengths: ["Empati", "Cömertlik", "Vizyon"], challenges: ["Hayal kırıklığı", "Bırakamama"] },
    11: { title: "Aydınlatıcı", desc: "Master sayı. Yüksek sezgi ve ilhama sahip. İnsanlığa ışık tutan bir ruh.", strengths: ["Sezgisel güç", "İlham", "Vizyonerlik"], challenges: ["Aşırı hassasiyet", "İç çatışma"] },
    22: { title: "Usta İnşaatçı", desc: "Master sayı. Büyük hayalleri gerçeğe dönüştürme gücüne sahip.", strengths: ["Pratik vizyon", "Liderlik", "Sabır"], challenges: ["Aşırı baskı", "Tükenmişlik"] },
    33: { title: "Usta Öğretmen", desc: "Master sayı. Koşulsuz sevgi ve şefkat ile yol gösteren.", strengths: ["Şefkat", "Öğretme", "Şifa"], challenges: ["Fedakarlık fazlası", "Mükemmeliyetçilik"] },
};

export default function NumerologyPage() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [birthDate, setBirthDate] = useState("");
    const [result, setResult] = useState<{ lifePath: number; nameNum: number } | null>(null);

    const handleCalc = (e: React.FormEvent) => {
        e.preventDefault();
        if (!birthDate) return;
        setResult({ lifePath: calcLifePath(birthDate), nameNum: name ? calcNameNumber(name) : 0 });
    };

    const lifeInfo = result ? MEANINGS[result.lifePath] || MEANINGS[1] : null;
    const nameInfo = result && result.nameNum ? MEANINGS[result.nameNum] || MEANINGS[1] : null;

    // Daily personal number
    const dailyNum = useMemo(() => {
        if (!result) return null;
        const today = new Date();
        let sum = result.lifePath + today.getDate() + (today.getMonth() + 1);
        while (sum > 9) sum = String(sum).split("").map(Number).reduce((a, b) => a + b, 0);
        return sum;
    }, [result]);

    return (
        <div className="min-h-screen bg-[#0a0812] text-white relative overflow-hidden">
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vh] bg-amber-900/5 rounded-full blur-[250px]" />
            </div>

            <header className="sticky top-0 z-30 bg-[#0a0812]/80 backdrop-blur-xl border-b border-white/[0.04]">
                <div className="max-w-2xl mx-auto flex items-center justify-between px-4 sm:px-6 py-4">
                    <button onClick={() => router.push("/")} className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors text-sm"><ArrowLeft className="w-4 h-4" /> Geri</button>
                    <Hash className="w-4 h-4 text-amber-400/30" />
                </div>
            </header>

            <main className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 py-8 pb-20">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-heading font-semibold text-white/90 mb-2">Numeroloji</h1>
                    <p className="text-sm text-white/35">İsminiz ve doğum tarihinizden yaşamınızın sayısal kodunu keşfedin.</p>
                </div>

                {!result ? (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
                        <form onSubmit={handleCalc} className="space-y-4">
                            <div>
                                <label className="text-[10px] text-white/30 uppercase tracking-wider block mb-1.5">Ad Soyad</label>
                                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Adınız ve soyadınız"
                                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white/70 placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-amber-500/30 transition-all" />
                            </div>
                            <div>
                                <label className="text-[10px] text-white/30 uppercase tracking-wider block mb-1.5">Doğum Tarihi *</label>
                                <input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)}
                                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white/70 focus:outline-none focus:ring-1 focus:ring-amber-500/30 transition-all" />
                            </div>
                            <button type="submit" disabled={!birthDate}
                                className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-amber-600/50 to-orange-600/40 text-white/90 rounded-xl font-semibold text-sm border border-amber-500/20 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-30">
                                <Sparkles className="w-4 h-4" /> Hesapla
                            </button>
                        </form>
                    </motion.div>
                ) : (
                    <AnimatePresence>
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                            {/* Life Path */}
                            <div className="bg-amber-500/[0.03] border border-amber-500/10 rounded-2xl p-6 text-center">
                                <span className="text-[10px] text-amber-400/40 uppercase tracking-wider">Yaşam Yolu Sayısı</span>
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-6xl font-heading font-bold text-amber-300/70 my-3">{result.lifePath}</motion.div>
                                {lifeInfo && <>
                                    <h3 className="text-lg font-semibold text-white/80 mb-2">{lifeInfo.title}</h3>
                                    <p className="text-sm text-white/50 leading-relaxed">{lifeInfo.desc}</p>
                                    <div className="flex flex-wrap justify-center gap-2 mt-4">
                                        {lifeInfo.strengths.map((s, i) => <span key={i} className="px-3 py-1 bg-amber-500/10 border border-amber-500/15 rounded-full text-[10px] text-amber-300/60">{s}</span>)}
                                    </div>
                                    <div className="flex flex-wrap justify-center gap-2 mt-2">
                                        {lifeInfo.challenges.map((c, i) => <span key={i} className="px-3 py-1 bg-red-500/8 border border-red-500/12 rounded-full text-[10px] text-red-300/50">{c}</span>)}
                                    </div>
                                </>}
                            </div>

                            {/* Name Number */}
                            {nameInfo && (
                                <div className="bg-purple-500/[0.03] border border-purple-500/10 rounded-2xl p-5">
                                    <div className="flex items-center gap-3">
                                        <div className="text-3xl font-heading font-bold text-purple-300/60">{result.nameNum}</div>
                                        <div>
                                            <span className="text-[10px] text-purple-400/40 uppercase tracking-wider block">İsim Sayısı — {nameInfo.title}</span>
                                            <p className="text-xs text-white/40 mt-0.5">{nameInfo.desc}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Daily Number */}
                            {dailyNum && (
                                <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 flex items-center gap-4">
                                    <div className="text-2xl font-heading font-bold text-white/40">{dailyNum}</div>
                                    <div>
                                        <span className="text-[10px] text-white/25 uppercase tracking-wider block">Bugünün Kişisel Sayısı</span>
                                        <p className="text-xs text-white/40 mt-0.5">{MEANINGS[dailyNum]?.title || "Evrensel"} enerjisi etkili.</p>
                                    </div>
                                </div>
                            )}

                            <button onClick={() => setResult(null)} className="w-full mt-4 text-xs text-white/25 hover:text-white/40 transition-colors text-center py-3">Tekrar Hesapla</button>
                        </motion.div>
                    </AnimatePresence>
                )}
            </main>
        </div>
    );
}
