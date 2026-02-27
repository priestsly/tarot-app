"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ChevronLeft, ChevronRight, Star, AlertTriangle, Moon, Sun, Zap, Info, Loader2, Sparkles } from "lucide-react";

interface CosmicEvent {
    date: string; // "MM-DD"
    name: string;
    emoji: string;
    type: "new_moon" | "full_moon" | "retrograde" | "eclipse" | "season" | "portal";
    desc: string;
    time?: string;
    sign?: string;
}

const MONTHS_TR = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
const DAYS_TR = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

const TYPE_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
    retrograde: { bg: "bg-red-500/10", text: "text-red-300", border: "border-red-500/20", dot: "bg-red-400" },
    eclipse: { bg: "bg-indigo-500/10", text: "text-indigo-300", border: "border-indigo-500/20", dot: "bg-indigo-400" },
    season: { bg: "bg-emerald-500/10", text: "text-emerald-300", border: "border-emerald-500/20", dot: "bg-emerald-400" },
    portal: { bg: "bg-amber-500/10", text: "text-amber-300", border: "border-amber-500/20", dot: "bg-amber-400" },
    new_moon: { bg: "bg-gray-500/10", text: "text-gray-300", border: "border-gray-500/20", dot: "bg-gray-400" },
    full_moon: { bg: "bg-yellow-500/10", text: "text-yellow-300", border: "border-yellow-500/20", dot: "bg-yellow-400" },
};

export default function CosmicCalendarPage() {
    const router = useRouter();
    const now = new Date();
    const [viewYear, setViewYear] = useState(2026);
    const [viewMonth, setViewMonth] = useState(now.getMonth());
    const [selectedDay, setSelectedDay] = useState<number | null>(now.getDate());

    // AI States
    const [events, setEvents] = useState<CosmicEvent[]>([]);
    const [monthlySummary, setMonthlySummary] = useState("");
    const [loading, setLoading] = useState(false);

    const daysInMonth = useMemo(() => new Date(viewYear, viewMonth + 1, 0).getDate(), [viewYear, viewMonth]);
    const firstDay = useMemo(() => {
        const d = new Date(viewYear, viewMonth, 1).getDay();
        return d === 0 ? 6 : d - 1;
    }, [viewYear, viewMonth]);

    const fetchAiEvents = useCallback(async (m: number, y: number) => {
        setLoading(true);
        try {
            const res = await fetch("/api/calendar", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ month: m + 1, year: y })
            });
            const data = await res.json();
            if (data.events) {
                setEvents(data.events);
                setMonthlySummary(data.monthlySummary || "");
            }
        } catch (error) {
            console.error("AI Calendar Error:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAiEvents(viewMonth, viewYear);
    }, [viewMonth, viewYear, fetchAiEvents]);

    const dayEvents = useMemo(() => {
        if (!selectedDay) return [];
        const mm = String(viewMonth + 1).padStart(2, "0");
        const dd = String(selectedDay).padStart(2, "0");
        return events.filter(e => e.date === `${mm}-${dd}`);
    }, [viewMonth, selectedDay, events]);

    const eventDays = useMemo(() => {
        const map = new Map<number, CosmicEvent[]>();
        events.forEach(e => {
            const d = parseInt(e.date.split("-")[1]);
            if (!map.has(d)) map.set(d, []);
            map.get(d)!.push(e);
        });
        return map;
    }, [events]);

    return (
        <div className="min-h-screen bg-[#0a0812] text-white relative overflow-hidden font-inter">
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 inset-x-0 h-[50%] bg-gradient-to-b from-purple-900/10 to-transparent" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] h-[90vh] bg-indigo-500/5 rounded-full blur-[200px]" />
            </div>

            <header className="sticky top-0 z-40 bg-[#0a0812]/80 backdrop-blur-xl border-b border-white/[0.04]">
                <div className="max-w-2xl mx-auto flex items-center justify-between px-4 sm:px-6 py-4">
                    <button onClick={() => router.push("/")} className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors text-xs font-medium uppercase tracking-widest">
                        <ArrowLeft className="w-4 h-4" /> <span>Geri</span>
                    </button>
                    <div className="flex items-center gap-2">
                        {loading ? <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-500/40" />}
                        <span className="text-[10px] text-white/20 uppercase tracking-[0.3em] font-bold">AI Kozmik Rehber</span>
                    </div>
                    <div className="w-10" />
                </div>
            </header>

            <main className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 py-8 pb-32">
                <div className="text-center mb-10">
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="inline-block p-1.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] mb-6">
                        <div className="px-6 py-1.5 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/10 border border-white/5">
                            <h1 className="text-2xl font-heading font-bold text-white/90">Kozmik Takvim</h1>
                        </div>
                    </motion.div>

                    <AnimatePresence mode="wait">
                        <motion.p
                            key={monthlySummary}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-sm text-white/35 max-w-sm mx-auto leading-relaxed italic"
                        >
                            {loading ? "Gökler inceleniyor..." : monthlySummary || "Yıldızlar senin için bir araya geliyor."}
                        </motion.p>
                    </AnimatePresence>
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between mb-8 bg-white/[0.02] border border-white/[0.06] rounded-2xl p-2">
                    <button onClick={() => setViewMonth(m => (m === 0 ? 11 : m - 1))} className="p-3 rounded-xl hover:bg-white/5 transition-all text-white/30"><ChevronLeft className="w-5 h-5" /></button>
                    <div className="text-center min-w-[120px]">
                        <h2 className="text-lg font-heading font-bold text-white/80">{MONTHS_TR[viewMonth]}</h2>
                        <p className="text-[10px] text-white/20 uppercase tracking-widest font-bold">{viewYear}</p>
                    </div>
                    <button onClick={() => setViewMonth(m => (m === 11 ? 0 : m + 1))} className="p-3 rounded-xl hover:bg-white/5 transition-all text-white/30"><ChevronRight className="w-5 h-5" /></button>
                </div>

                {/* Calendar Grid */}
                <div className="bg-white/[0.01] border border-white/[0.04] rounded-[2.5rem] p-5 sm:p-7 mb-10 shadow-2xl relative overflow-hidden leading-none">
                    {loading && (
                        <div className="absolute inset-0 z-20 bg-[#0a0812]/40 backdrop-blur-[2px] flex items-center justify-center">
                            <div className="flex flex-col items-center gap-2">
                                <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                                <span className="text-[10px] text-white/30 uppercase tracking-widest">AI Senkronize Oluyor</span>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-7 mb-4">
                        {DAYS_TR.map(d => <div key={d} className="text-center text-[10px] text-white/15 uppercase font-black tracking-tighter py-2">{d}</div>)}
                    </div>

                    <div className="grid grid-cols-7 gap-2 sm:gap-3">
                        {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} className="aspect-square opacity-0" />)}

                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const day = i + 1;
                            const isToday = now.getFullYear() === viewYear && now.getMonth() === viewMonth && day === now.getDate();
                            const isSelected = day === selectedDay;
                            const dayEventsList = eventDays.get(day) || [];

                            return (
                                <button key={day} onClick={() => setSelectedDay(day)}
                                    className={`relative aspect-square rounded-2xl flex flex-col items-center justify-center transition-all duration-300
                                        ${isSelected ?
                                            "bg-indigo-600/30 border border-indigo-400/50 shadow-lg scale-105" :
                                            isToday ? "bg-white/[0.08] border border-white/20" : "hover:bg-white/[0.04] border border-transparent"}`}>

                                    <span className={`text-sm sm:text-base font-medium ${isSelected ? "text-white" : isToday ? "text-indigo-300" : "text-white/40"}`}>
                                        {day}
                                    </span>

                                    <div className="flex gap-1 mt-1.5 h-1">
                                        {dayEventsList.slice(0, 3).map((e, idx) => (
                                            <div key={idx} className={`w-1 h-1 rounded-full ${TYPE_COLORS[e.type]?.dot || "bg-white/20"}`} />
                                        ))}
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mt-8 pt-6 border-t border-white/[0.03]">
                        {Object.entries(TYPE_COLORS).map(([type, colors]) => (
                            <div key={type} className="flex items-center gap-2">
                                <div className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                                <span className="text-[9px] text-white/20 uppercase tracking-tighter font-bold">{type.replace('_', ' ')}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Day Details */}
                <AnimatePresence mode="wait">
                    {selectedDay && (
                        <motion.div
                            key={`${viewMonth}-${selectedDay}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-4 mb-32"
                        >
                            <div className="flex items-center gap-3 mb-2 px-2">
                                <Star className="w-4 h-4 text-indigo-400/40" />
                                <h3 className="text-xs font-bold text-white/30 uppercase tracking-[0.2em]">{selectedDay} {MONTHS_TR[viewMonth]} Olayları</h3>
                            </div>

                            {dayEvents.length > 0 ? (
                                dayEvents.map((ev, i) => (
                                    <div key={i} className={`relative overflow-hidden p-6 rounded-3xl border ${TYPE_COLORS[ev.type]?.border || "border-white/10"} ${TYPE_COLORS[ev.type]?.bg || "bg-white/5"}`}>
                                        <div className="absolute top-0 right-0 p-4 opacity-10">
                                            <span className="text-6xl">{ev.emoji}</span>
                                        </div>
                                        <div className="relative z-10">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className={`p-2 rounded-xl bg-black/20 border border-white/5`}>
                                                    <span className="text-xl">{ev.emoji}</span>
                                                </div>
                                                <div>
                                                    <h4 className={`text-base font-bold text-white/90`}>{ev.name}</h4>
                                                    <div className="flex gap-2">
                                                        {ev.time && <span className="text-[10px] font-bold uppercase text-white/30 bg-black/20 px-2 py-0.5 rounded">Saat {ev.time}</span>}
                                                        {ev.sign && <span className="text-[10px] font-bold uppercase text-indigo-300/60 bg-indigo-500/10 px-2 py-0.5 rounded">{ev.sign}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-sm text-white/50 leading-relaxed font-light">{ev.desc}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-12 rounded-[2rem] border border-dashed border-white/5 text-center bg-white/[0.01]">
                                    <Moon className="w-8 h-8 text-white/5 mx-auto mb-4" />
                                    <p className="text-xs text-white/20 italic">Bu gün için özel bir gökyüzü kaydı bulunmuyor.</p>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
