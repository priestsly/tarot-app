"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Sparkles, Star, Heart, Briefcase, Moon, Sun, Activity, Loader2, Zap, Clock, Brain } from "lucide-react";
import {
    getZodiacSign, getMoonPhase, getDailyMessage, getCurrentPlanets,
    getElementAnalysis, getRisingSign, ZODIAC_SIGNS, type ZodiacSign, type AIHoroscope
} from "@/lib/astrology";

export default function AstrologyPage() {
    const router = useRouter();
    const [birthDate, setBirthDate] = useState("");
    const [birthTime, setBirthTime] = useState("");
    const [selectedSign, setSelectedSign] = useState<ZodiacSign | null>(null);
    const [risingSign, setRisingSign] = useState<ZodiacSign | null>(null);
    const [activeTab, setActiveTab] = useState<"overview" | "daily" | "planets">("overview");

    // AI Horoscope state
    const [aiHoroscope, setAiHoroscope] = useState<AIHoroscope | null>(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState("");

    const moonPhase = useMemo(() => getMoonPhase(new Date()), []);
    const planets = useMemo(() => getCurrentPlanets(), []);

    const handleDateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!birthDate) return;
        const [y, m, d] = birthDate.split("-").map(Number);
        const sign = getZodiacSign(m, d);
        setSelectedSign(sign);

        // Calculate rising sign if birth time provided
        if (birthTime) {
            const [h, min] = birthTime.split(":").map(Number);
            setRisingSign(getRisingSign(m, d, h, min));
        }
    };

    // Fetch AI horoscope
    const fetchAIHoroscope = useCallback(async () => {
        if (!selectedSign) return;
        setAiLoading(true);
        setAiError("");

        try {
            const res = await fetch("/api/horoscope", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    signName: selectedSign.name,
                    signSymbol: selectedSign.symbol,
                    element: selectedSign.element,
                    planet: selectedSign.planet,
                    moonPhase: moonPhase.name,
                    birthDate: birthDate || undefined,
                    birthTime: birthTime || undefined,
                    risingSign: risingSign?.name || undefined,
                }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Hata oluştu");
            }

            const data = await res.json();
            setAiHoroscope(data);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Bağlantı hatası";
            setAiError(msg);
        } finally {
            setAiLoading(false);
        }
    }, [selectedSign, moonPhase, birthDate, birthTime, risingSign]);

    const elementInfo = selectedSign ? getElementAnalysis(selectedSign.element) : null;

    return (
        <div className="min-h-screen bg-[#0a0812] text-white relative overflow-hidden">
            {/* Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vh] bg-indigo-900/6 rounded-full blur-[250px]" />
                <div className="absolute top-[5%] right-[10%] w-[300px] h-[300px] bg-purple-900/8 rounded-full blur-[180px]" />
                <div className="absolute bottom-[5%] left-[10%] w-[250px] h-[250px] bg-violet-900/6 rounded-full blur-[160px]" />
            </div>

            {/* Header */}
            <header className="sticky top-0 z-30 bg-[#0a0812]/80 backdrop-blur-xl border-b border-white/[0.04]">
                <div className="max-w-2xl mx-auto flex items-center justify-between px-4 sm:px-6 py-4">
                    <button onClick={() => router.push("/")} className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors text-sm">
                        <ArrowLeft className="w-4 h-4" /> Ana Sayfa
                    </button>
                    <div className="flex items-center gap-2">
                        <span className="text-lg">{moonPhase.emoji}</span>
                        <span className="text-[10px] text-white/30 uppercase tracking-wider">{moonPhase.name}</span>
                    </div>
                </div>
            </header>

            <main className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 py-8 pb-20">
                {/* Title */}
                <div className="text-center mb-10">
                    <h1 className="text-3xl sm:text-4xl font-heading font-semibold text-white/90 mb-2">Astroloji</h1>
                    <p className="text-sm text-white/35 max-w-sm mx-auto">Doğum bilgilerinizi girin, AI destekli kişisel haritanızı keşfedin.</p>
                </div>

                {/* Moon Phase Card */}
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 mb-8 flex items-center gap-4">
                    <div className="text-4xl">{moonPhase.emoji}</div>
                    <div className="flex-1">
                        <h3 className="text-sm font-semibold text-white/70">{moonPhase.name}</h3>
                        <p className="text-xs text-white/35 mt-0.5">{moonPhase.desc}</p>
                    </div>
                </div>

                {/* Birth Input */}
                {!selectedSign ? (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 mb-8">
                        <h2 className="text-sm font-semibold text-white/60 mb-4 flex items-center gap-2">
                            <Star className="w-4 h-4 text-purple-400/50" /> Doğum Bilgileriniz
                        </h2>
                        <form onSubmit={handleDateSubmit} className="space-y-4">
                            <div>
                                <label className="text-[10px] text-white/30 uppercase tracking-wider block mb-1.5">Doğum Tarihi *</label>
                                <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)}
                                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white/70 focus:outline-none focus:ring-1 focus:ring-purple-500/30 focus:border-purple-500/20 transition-all" />
                            </div>
                            <div>
                                <label className="text-[10px] text-white/30 uppercase tracking-wider block mb-1.5">Doğum Saati <span className="text-white/15">(yükselen burç için)</span></label>
                                <input type="time" value={birthTime} onChange={(e) => setBirthTime(e.target.value)}
                                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white/70 focus:outline-none focus:ring-1 focus:ring-purple-500/30 focus:border-purple-500/20 transition-all" />
                            </div>
                            <button type="submit" disabled={!birthDate}
                                className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-600/50 to-indigo-600/40 text-white/90 rounded-xl font-semibold text-sm transition-all hover:brightness-110 active:scale-[0.98] border border-purple-500/20 disabled:opacity-30 disabled:pointer-events-none">
                                <Sparkles className="w-4 h-4" /> Haritamı Göster
                            </button>
                        </form>

                        {/* Quick Select */}
                        <div className="mt-6 pt-5 border-t border-white/[0.04]">
                            <p className="text-[10px] text-white/25 uppercase tracking-[0.2em] mb-3 text-center">veya burç seçin</p>
                            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                                {ZODIAC_SIGNS.map(sign => (
                                    <button key={sign.id} onClick={() => { setSelectedSign(sign); setRisingSign(null); }}
                                        className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-white/[0.04] transition-all group">
                                        <span className="text-xl group-hover:scale-110 transition-transform">{sign.symbol}</span>
                                        <span className="text-[9px] text-white/30 group-hover:text-white/50">{sign.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <AnimatePresence mode="wait">
                        <motion.div key={selectedSign.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>

                            {/* Sign Header */}
                            <div className="text-center mb-4">
                                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }} className="text-6xl mb-4">{selectedSign.symbol}</motion.div>
                                <h2 className="text-2xl font-heading font-bold text-white/90">{selectedSign.name}</h2>
                                <p className="text-xs text-white/30 mt-1">{selectedSign.dateRange} · {selectedSign.element} {selectedSign.elementEmoji} · {selectedSign.planet}</p>
                            </div>

                            {/* Rising Sign Badge */}
                            {risingSign && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                                    className="flex items-center justify-center gap-3 mb-8">
                                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-2 flex items-center gap-2">
                                        <span className="text-lg">{risingSign.symbol}</span>
                                        <div>
                                            <span className="text-[9px] text-amber-400/50 uppercase tracking-wider block">Yükselen</span>
                                            <span className="text-xs font-semibold text-amber-300/80">{risingSign.name}</span>
                                        </div>
                                    </div>
                                    <div className="bg-purple-500/10 border border-purple-500/20 rounded-full px-4 py-2 flex items-center gap-2">
                                        <span className="text-lg">{selectedSign.symbol}</span>
                                        <div>
                                            <span className="text-[9px] text-purple-400/50 uppercase tracking-wider block">Güneş</span>
                                            <span className="text-xs font-semibold text-purple-300/80">{selectedSign.name}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Tabs */}
                            <div className="flex items-center gap-1 mb-6 bg-white/[0.02] rounded-xl p-1 border border-white/[0.05]">
                                {([
                                    { key: "overview", label: "Genel", icon: <Star className="w-3.5 h-3.5" /> },
                                    { key: "daily", label: "AI Günlük", icon: <Brain className="w-3.5 h-3.5" /> },
                                    { key: "planets", label: "Gezegenler", icon: <Moon className="w-3.5 h-3.5" /> },
                                ] as const).map(tab => (
                                    <button key={tab.key}
                                        onClick={() => { setActiveTab(tab.key); if (tab.key === "daily" && !aiHoroscope && !aiLoading) fetchAIHoroscope(); }}
                                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${activeTab === tab.key ? "bg-purple-500/15 text-purple-300 border border-purple-500/20" : "text-white/30 hover:text-white/50"}`}>
                                        {tab.icon} {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Tab Content */}
                            <AnimatePresence mode="wait">
                                {activeTab === "overview" && (
                                    <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                                        {/* Traits */}
                                        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
                                            <h3 className="text-[10px] text-white/25 uppercase tracking-[0.2em] mb-3">Kişilik Özellikleri</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedSign.traits.map((t, i) => (
                                                    <span key={i} className="px-3 py-1.5 bg-purple-500/8 border border-purple-500/15 rounded-full text-xs text-white/60">{t}</span>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Rising Sign Detail */}
                                        {risingSign && (
                                            <div className="bg-amber-500/[0.03] border border-amber-500/10 rounded-2xl p-5">
                                                <h3 className="text-[10px] text-amber-400/40 uppercase tracking-[0.2em] mb-3">Yükselen Burç: {risingSign.name} {risingSign.symbol}</h3>
                                                <p className="text-sm text-white/50 mb-2">Yükselen burcunuz dış dünyanın sizi nasıl gördüğünü belirler.</p>
                                                <div className="flex flex-wrap gap-2 mt-3">
                                                    {risingSign.traits.map((t, i) => (
                                                        <span key={i} className="px-3 py-1.5 bg-amber-500/8 border border-amber-500/15 rounded-full text-xs text-amber-200/60">{t}</span>
                                                    ))}
                                                </div>
                                                <p className="text-[10px] text-white/25 mt-3 italic">
                                                    Güneş burcunuz ({selectedSign.name}) iç dünyanızı, yükselen burcunuz ({risingSign.name}) ise sosyal maskenizi yansıtır.
                                                </p>
                                            </div>
                                        )}

                                        {/* Element */}
                                        {elementInfo && (
                                            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
                                                <h3 className="text-[10px] text-white/25 uppercase tracking-[0.2em] mb-3">Element: {selectedSign.element} {selectedSign.elementEmoji}</h3>
                                                <p className="text-sm text-white/50 mb-2">{elementInfo.strength}</p>
                                                <p className="text-xs text-amber-400/60 italic">💡 {elementInfo.advice}</p>
                                            </div>
                                        )}

                                        {/* Lucky */}
                                        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
                                            <h3 className="text-[10px] text-white/25 uppercase tracking-[0.2em] mb-3">Şanslı Bilgiler</h3>
                                            <div className="grid grid-cols-2 gap-3 text-sm">
                                                <div><span className="text-[10px] text-white/25 block">Sayılar</span><span className="text-white/60">{selectedSign.lucky.numbers.join(", ")}</span></div>
                                                <div><span className="text-[10px] text-white/25 block">Renk</span><span className="text-white/60">{selectedSign.lucky.color}</span></div>
                                                <div><span className="text-[10px] text-white/25 block">Gün</span><span className="text-white/60">{selectedSign.lucky.day}</span></div>
                                                <div><span className="text-[10px] text-white/25 block">Taş</span><span className="text-white/60">{selectedSign.lucky.stone}</span></div>
                                            </div>
                                        </div>

                                        {/* Compatibility */}
                                        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
                                            <h3 className="text-[10px] text-white/25 uppercase tracking-[0.2em] mb-3">Uyumluluk</h3>
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <Heart className="w-3.5 h-3.5 text-emerald-400/50" />
                                                    <span className="text-xs text-white/40">Uyumlu:</span>
                                                    <span className="text-xs text-emerald-300/60">{selectedSign.compatible.join(", ")}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Heart className="w-3.5 h-3.5 text-red-400/50" />
                                                    <span className="text-xs text-white/40">Zorlu:</span>
                                                    <span className="text-xs text-red-300/60">{selectedSign.incompatible.join(", ")}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {activeTab === "daily" && (
                                    <motion.div key="daily" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">

                                        {aiLoading && (
                                            <div className="text-center py-16">
                                                <Loader2 className="w-8 h-8 text-purple-400/40 animate-spin mx-auto mb-4" />
                                                <p className="text-sm text-white/30">Yıldızlar okunuyor...</p>
                                                <p className="text-[10px] text-white/15 mt-1">AI kişisel yorumunuzu hazırlıyor</p>
                                            </div>
                                        )}

                                        {aiError && (
                                            <div className="bg-red-500/5 border border-red-500/15 rounded-2xl p-5 text-center">
                                                <p className="text-sm text-red-300/60 mb-3">{aiError}</p>
                                                <button onClick={fetchAIHoroscope} className="text-xs text-purple-300/60 hover:text-purple-300/80 underline">Tekrar Dene</button>

                                                {/* Fallback static content */}
                                                <div className="mt-6 pt-4 border-t border-white/[0.04] space-y-4 text-left">
                                                    {[
                                                        { cat: "general", label: "Genel Yorum", icon: <Sparkles className="w-4 h-4 text-purple-400/50" /> },
                                                        { cat: "love", label: "Aşk", icon: <Heart className="w-4 h-4 text-pink-400/50" /> },
                                                        { cat: "career", label: "Kariyer", icon: <Briefcase className="w-4 h-4 text-blue-400/50" /> },
                                                    ].map(item => (
                                                        <div key={item.cat} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
                                                            <div className="flex items-center gap-2 mb-2">{item.icon}<h3 className="text-xs font-semibold text-white/50">{item.label}</h3></div>
                                                            <p className="text-sm text-white/50 italic">&ldquo;{getDailyMessage(selectedSign.name, item.cat)}&rdquo;</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {aiHoroscope && !aiLoading && (
                                            <>
                                                {/* Energy & Mood Bar */}
                                                <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 flex items-center gap-4">
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-[10px] text-white/25 uppercase tracking-wider flex items-center gap-1"><Zap className="w-3 h-3" /> Enerji Seviyesi</span>
                                                            <span className="text-xs font-bold text-purple-300/70">{aiHoroscope.energy}/10</span>
                                                        </div>
                                                        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                                                            <motion.div initial={{ width: 0 }} animate={{ width: `${aiHoroscope.energy * 10}%` }} transition={{ duration: 1, delay: 0.3 }}
                                                                className="h-full bg-gradient-to-r from-purple-500/60 to-indigo-500/60 rounded-full" />
                                                        </div>
                                                    </div>
                                                    <div className="text-center px-4 border-l border-white/[0.06]">
                                                        <span className="text-[10px] text-white/25 uppercase tracking-wider block">Mod</span>
                                                        <span className="text-sm font-semibold text-white/60">{aiHoroscope.mood}</span>
                                                    </div>
                                                </div>

                                                {/* Lucky Hour */}
                                                <div className="bg-amber-500/[0.03] border border-amber-500/10 rounded-2xl p-4 flex items-center gap-3">
                                                    <Clock className="w-4 h-4 text-amber-400/50" />
                                                    <div>
                                                        <span className="text-[10px] text-amber-400/40 uppercase tracking-wider">Şanslı Saat</span>
                                                        <span className="text-sm font-semibold text-amber-300/70 ml-2">{aiHoroscope.luckyHour}</span>
                                                    </div>
                                                </div>

                                                {/* AI Readings */}
                                                {[
                                                    { key: "general", label: "Genel", icon: <Sparkles className="w-4 h-4 text-purple-400/50" />, text: aiHoroscope.general },
                                                    { key: "love", label: "Aşk & İlişkiler", icon: <Heart className="w-4 h-4 text-pink-400/50" />, text: aiHoroscope.love },
                                                    { key: "career", label: "Kariyer & Para", icon: <Briefcase className="w-4 h-4 text-blue-400/50" />, text: aiHoroscope.career },
                                                    { key: "health", label: "Sağlık & Enerji", icon: <Activity className="w-4 h-4 text-emerald-400/50" />, text: aiHoroscope.health },
                                                ].map((item, i) => (
                                                    <motion.div key={item.key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                                                        className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
                                                        <div className="flex items-center gap-2 mb-3">{item.icon}<h3 className="text-xs font-semibold text-white/50">{item.label}</h3></div>
                                                        <p className="text-sm text-white/60 leading-relaxed">{item.text}</p>
                                                    </motion.div>
                                                ))}

                                                {/* Advice */}
                                                <div className="bg-purple-500/[0.04] border border-purple-500/15 rounded-2xl p-5 text-center">
                                                    <p className="text-[10px] text-purple-400/40 uppercase tracking-wider mb-2">Günün Tavsiyesi</p>
                                                    <p className="text-sm text-purple-200/70 italic leading-relaxed">&ldquo;{aiHoroscope.advice}&rdquo;</p>
                                                </div>

                                                {/* Refresh */}
                                                <button onClick={fetchAIHoroscope} disabled={aiLoading}
                                                    className="w-full py-2.5 text-xs text-white/25 hover:text-white/40 transition-colors">
                                                    Yeni yorum al
                                                </button>

                                                <p className="text-center text-[9px] text-white/15 flex items-center justify-center gap-1">
                                                    <Brain className="w-3 h-3" /> AI tarafından üretilmiştir · Gemini
                                                </p>
                                            </>
                                        )}

                                        {!aiHoroscope && !aiLoading && !aiError && (
                                            <div className="text-center py-12">
                                                <Brain className="w-8 h-8 text-purple-400/20 mx-auto mb-4" />
                                                <p className="text-sm text-white/30 mb-4">AI yorumu yükleniyor...</p>
                                                <button onClick={fetchAIHoroscope}
                                                    className="px-6 py-2.5 bg-gradient-to-r from-purple-600/40 to-indigo-600/30 text-white/80 rounded-xl text-sm font-semibold border border-purple-500/20 hover:brightness-110 transition-all">
                                                    <Sparkles className="w-4 h-4 inline mr-2" /> AI Yorumunu Al
                                                </button>
                                            </div>
                                        )}
                                    </motion.div>
                                )}

                                {activeTab === "planets" && (
                                    <motion.div key="planets" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                                        {planets.map((p, i) => (
                                            <div key={i} className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 flex items-center gap-4">
                                                <span className="text-2xl w-10 text-center">{p.emoji}</span>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between">
                                                        <h4 className="text-sm font-semibold text-white/70">{p.planet}</h4>
                                                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${p.status.includes("Retrograd") ? "bg-red-500/10 text-red-400/70 border border-red-500/20" : "bg-white/[0.04] text-white/30"}`}>{p.status}</span>
                                                    </div>
                                                    <p className="text-xs text-white/30 mt-0.5">{p.desc}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Change sign */}
                            <button onClick={() => { setSelectedSign(null); setRisingSign(null); setAiHoroscope(null); setAiError(""); setActiveTab("overview"); }}
                                className="w-full mt-8 px-4 py-3 text-white/25 text-xs hover:text-white/40 transition-colors text-center">
                                Başka bir burç seç
                            </button>

                            {/* Quick zodiac access */}
                            <div className="mt-4 flex items-center justify-center flex-wrap gap-1">
                                {ZODIAC_SIGNS.map(sign => (
                                    <button key={sign.id}
                                        onClick={() => { setSelectedSign(sign); setRisingSign(null); setAiHoroscope(null); setAiError(""); setActiveTab("overview"); }}
                                        className={`w-9 h-9 rounded-full flex items-center justify-center text-lg transition-all ${selectedSign.id === sign.id ? "bg-purple-500/15 border border-purple-500/25 scale-110" : "hover:bg-white/[0.04] opacity-40 hover:opacity-70"}`}
                                        title={sign.name}>
                                        {sign.symbol}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </AnimatePresence>
                )}
            </main>

            <p className="fixed bottom-6 left-0 right-0 text-center text-[9px] text-white/10 uppercase tracking-[0.25em] z-10">
                Mystic Tarot · Astroloji
            </p>
        </div>
    );
}
