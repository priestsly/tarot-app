"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, ChevronLeft, ChevronRight, Star, AlertTriangle } from "lucide-react";
import { getMoonPhase } from "@/lib/astrology";

// ── Cosmic Events Database ──
interface CosmicEvent {
    date: string; // "MM-DD"
    name: string;
    emoji: string;
    type: "moon" | "retrograde" | "eclipse" | "season" | "portal";
    desc: string;
}

const COSMIC_EVENTS: CosmicEvent[] = [
    // Retrogrades 2026
    { date: "01-25", name: "Merkür Retrograd Başlangıç", emoji: "☿️", type: "retrograde", desc: "İletişimde dikkatli olun. Eski konular gündeme gelebilir." },
    { date: "02-14", name: "Merkür Retrograd Bitiş", emoji: "☿️", type: "retrograde", desc: "İletişim enerjisi normalleşiyor." },
    { date: "03-02", name: "Venüs Retrograd Başlangıç", emoji: "♀️", type: "retrograde", desc: "Eski aşklar gündeme gelebilir. İlişkilerde sabırlı olun." },
    { date: "04-12", name: "Venüs Retrograd Bitiş", emoji: "♀️", type: "retrograde", desc: "Aşk ve güzellik enerjisi yeniden akıyor." },
    { date: "05-19", name: "Merkür Retrograd Başlangıç", emoji: "☿️", type: "retrograde", desc: "Teknoloji ve seyahatte aksaklıklar mümkün." },
    { date: "06-11", name: "Merkür Retrograd Bitiş", emoji: "☿️", type: "retrograde", desc: "Netlik geri dönüyor." },
    { date: "07-04", name: "Neptün Retrograd Başlangıç", emoji: "♆", type: "retrograde", desc: "Hayaller ve yanılsamalar sorgulanıyor." },
    { date: "09-15", name: "Merkür Retrograd Başlangıç", emoji: "☿️", type: "retrograde", desc: "Yıl sonuna doğru iletişimde son test." },
    { date: "10-07", name: "Merkür Retrograd Bitiş", emoji: "☿️", type: "retrograde", desc: "Berraklık geri geliyor." },
    { date: "12-09", name: "Neptün Retrograd Bitiş", emoji: "♆", type: "retrograde", desc: "Ruhsal netlik artıyor." },
    // Eclipses
    { date: "02-17", name: "Kısmi Ay Tutulması", emoji: "🌒", type: "eclipse", desc: "Duygusal farkındalık ve tamamlanma zamanı." },
    { date: "03-03", name: "Halka Güneş Tutulması", emoji: "🌑", type: "eclipse", desc: "Yeni başlangıçlar ve niyetler için güçlü bir kapı." },
    { date: "08-12", name: "Kısmi Ay Tutulması", emoji: "🌒", type: "eclipse", desc: "Dönüşüm ve bırakma zamanı." },
    { date: "08-28", name: "Tam Güneş Tutulması", emoji: "🌑", type: "eclipse", desc: "Güçlü bir yeniden doğuş enerjisi." },
    // Seasons & Portals
    { date: "03-20", name: "İlkbahar Ekinoksu", emoji: "🌱", type: "season", desc: "Doğa uyanıyor. Yeni projelere başlangıç zamanı." },
    { date: "06-21", name: "Yaz Gündönümü", emoji: "☀️", type: "season", desc: "En uzun gün. Enerji dorukta." },
    { date: "09-22", name: "Sonbahar Ekinoksu", emoji: "🍂", type: "season", desc: "Denge zamanı. İç gözlem dönemi başlıyor." },
    { date: "12-21", name: "Kış Gündönümü", emoji: "❄️", type: "season", desc: "En uzun gece. Dinlenme ve yenilenme." },
    { date: "11-11", name: "11:11 Portal", emoji: "🌀", type: "portal", desc: "Evrensel senkronizasyon. Niyetleriniz güçleniyor." },
    { date: "12-12", name: "12:12 Portal", emoji: "🌀", type: "portal", desc: "Yıl sonu manifestasyon kapısı açık." },
    { date: "08-08", name: "Aslan Kapısı", emoji: "🦁", type: "portal", desc: "Sirius yıldızı hizalanması. Ruhsal uyanış." },
];

const MONTHS_TR = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
const DAYS_TR = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
    const d = new Date(year, month, 1).getDay();
    return d === 0 ? 6 : d - 1; // Monday = 0
}

const TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    retrograde: { bg: "bg-red-500/10", text: "text-red-300/70", border: "border-red-500/20" },
    eclipse: { bg: "bg-purple-500/10", text: "text-purple-300/70", border: "border-purple-500/20" },
    season: { bg: "bg-emerald-500/10", text: "text-emerald-300/70", border: "border-emerald-500/20" },
    portal: { bg: "bg-amber-500/10", text: "text-amber-300/70", border: "border-amber-500/20" },
    moon: { bg: "bg-blue-500/10", text: "text-blue-300/70", border: "border-blue-500/20" },
};

export default function CosmicCalendarPage() {
    const router = useRouter();
    const now = new Date();
    const [viewYear, setViewYear] = useState(now.getFullYear());
    const [viewMonth, setViewMonth] = useState(now.getMonth());
    const [selectedDay, setSelectedDay] = useState<number | null>(now.getDate());

    const daysInMonth = getDaysInMonth(viewYear, viewMonth);
    const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
    const today = now.getDate();
    const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth();

    // Get events for this month
    const monthEvents = useMemo(() => {
        const mm = String(viewMonth + 1).padStart(2, "0");
        return COSMIC_EVENTS.filter(e => e.date.startsWith(mm + "-"));
    }, [viewMonth]);

    // Get events for selected day
    const dayEvents = useMemo(() => {
        if (!selectedDay) return [];
        const key = `${String(viewMonth + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`;
        return COSMIC_EVENTS.filter(e => e.date === key);
    }, [viewMonth, selectedDay]);

    // Moon phase for selected day
    const selectedMoon = useMemo(() => {
        if (!selectedDay) return null;
        return getMoonPhase(new Date(viewYear, viewMonth, selectedDay));
    }, [viewYear, viewMonth, selectedDay]);

    // Event days for dot indicators
    const eventDays = useMemo(() => {
        const set = new Set<number>();
        monthEvents.forEach(e => { const d = parseInt(e.date.split("-")[1]); set.add(d); });
        return set;
    }, [monthEvents]);

    const prevMonth = () => {
        if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
        else setViewMonth(m => m - 1);
        setSelectedDay(null);
    };
    const nextMonth = () => {
        if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
        else setViewMonth(m => m + 1);
        setSelectedDay(null);
    };

    return (
        <div className="min-h-screen bg-[#0a0812] text-white relative overflow-hidden">
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vh] bg-indigo-900/5 rounded-full blur-[250px]" />
            </div>

            <header className="sticky top-0 z-30 bg-[#0a0812]/80 backdrop-blur-xl border-b border-white/[0.04]">
                <div className="max-w-2xl mx-auto flex items-center justify-between px-4 sm:px-6 py-4">
                    <button onClick={() => router.push("/")} className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors text-sm"><ArrowLeft className="w-4 h-4" /> Geri</button>
                    <Star className="w-4 h-4 text-indigo-400/30" />
                </div>
            </header>

            <main className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 py-8 pb-20">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-heading font-semibold text-white/90 mb-2">Kozmik Takvim</h1>
                    <p className="text-sm text-white/35">Ay fazları, retrograde&apos;ler, tutulmalar ve portallar.</p>
                </div>

                {/* Month nav */}
                <div className="flex items-center justify-between mb-6">
                    <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-white/[0.05] transition-all"><ChevronLeft className="w-5 h-5 text-white/40" /></button>
                    <h2 className="text-lg font-heading font-semibold text-white/70">{MONTHS_TR[viewMonth]} {viewYear}</h2>
                    <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-white/[0.05] transition-all"><ChevronRight className="w-5 h-5 text-white/40" /></button>
                </div>

                {/* Calendar Grid */}
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 mb-6">
                    {/* Day headers */}
                    <div className="grid grid-cols-7 mb-2">
                        {DAYS_TR.map(d => <div key={d} className="text-center text-[9px] text-white/25 uppercase tracking-wider py-1">{d}</div>)}
                    </div>
                    {/* Days */}
                    <div className="grid grid-cols-7 gap-1">
                        {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const day = i + 1;
                            const isToday = isCurrentMonth && day === today;
                            const isSel = day === selectedDay;
                            const hasEvent = eventDays.has(day);
                            const moonPhase = getMoonPhase(new Date(viewYear, viewMonth, day));
                            const isNewMoon = moonPhase.name === "Yeni Ay";
                            const isFullMoon = moonPhase.name === "Dolunay";

                            return (
                                <button key={day} onClick={() => setSelectedDay(day)}
                                    className={`relative aspect-square rounded-lg flex flex-col items-center justify-center text-xs transition-all
                                        ${isSel ? "bg-purple-500/20 border border-purple-500/30" : isToday ? "bg-white/[0.05] border border-white/10" : "hover:bg-white/[0.03] border border-transparent"}`}>
                                    <span className={`${isSel ? "text-purple-300" : isToday ? "text-white/80 font-bold" : "text-white/40"}`}>{day}</span>
                                    {/* Indicators */}
                                    <div className="flex gap-0.5 mt-0.5 h-1.5">
                                        {hasEvent && <div className="w-1.5 h-1.5 rounded-full bg-amber-400/60" />}
                                        {isNewMoon && <div className="w-1.5 h-1.5 rounded-full bg-gray-400/40" />}
                                        {isFullMoon && <div className="w-1.5 h-1.5 rounded-full bg-yellow-300/60" />}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                    {/* Legend */}
                    <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-white/[0.04]">
                        <span className="flex items-center gap-1 text-[8px] text-white/20"><span className="w-1.5 h-1.5 rounded-full bg-amber-400/60" /> Olay</span>
                        <span className="flex items-center gap-1 text-[8px] text-white/20"><span className="w-1.5 h-1.5 rounded-full bg-gray-400/40" /> Yeni Ay</span>
                        <span className="flex items-center gap-1 text-[8px] text-white/20"><span className="w-1.5 h-1.5 rounded-full bg-yellow-300/60" /> Dolunay</span>
                    </div>
                </div>

                {/* Selected day info */}
                {selectedDay && selectedMoon && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 mb-6">
                        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 flex items-center gap-4">
                            <span className="text-3xl">{selectedMoon.emoji}</span>
                            <div>
                                <h3 className="text-xs font-semibold text-white/60">{selectedDay} {MONTHS_TR[viewMonth]} — {selectedMoon.name}</h3>
                                <p className="text-[10px] text-white/30 mt-0.5">{selectedMoon.desc}</p>
                            </div>
                        </div>

                        {dayEvents.map((ev, i) => {
                            const c = TYPE_COLORS[ev.type];
                            return (
                                <div key={i} className={`${c.bg} border ${c.border} rounded-2xl p-4 flex items-center gap-3`}>
                                    <span className="text-2xl">{ev.emoji}</span>
                                    <div>
                                        <h4 className={`text-xs font-semibold ${c.text}`}>{ev.name}</h4>
                                        <p className="text-[10px] text-white/30 mt-0.5">{ev.desc}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </motion.div>
                )}

                {/* Upcoming events */}
                <div className="space-y-2">
                    <h3 className="text-[10px] text-white/25 uppercase tracking-[0.2em] mb-3">
                        {MONTHS_TR[viewMonth]} Olayları
                    </h3>
                    {monthEvents.length === 0 ? (
                        <p className="text-xs text-white/20 text-center py-8">Bu ay kayıtlı kozmik olay yok.</p>
                    ) : (
                        monthEvents.map((ev, i) => {
                            const c = TYPE_COLORS[ev.type];
                            const day = parseInt(ev.date.split("-")[1]);
                            const isPast = isCurrentMonth && day < today;
                            return (
                                <button key={i} onClick={() => setSelectedDay(day)}
                                    className={`w-full ${c.bg} border ${c.border} rounded-xl p-3 flex items-center gap-3 text-left transition-all hover:brightness-110 ${isPast ? "opacity-40" : ""}`}>
                                    <div className="w-10 text-center">
                                        <span className="text-lg">{ev.emoji}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className={`text-xs font-semibold ${c.text}`}>{ev.name}</h4>
                                        <p className="text-[10px] text-white/25 mt-0.5 truncate">{ev.desc}</p>
                                    </div>
                                    <span className="text-[10px] text-white/20 shrink-0">{day} {MONTHS_TR[viewMonth].slice(0, 3)}</span>
                                </button>
                            );
                        })
                    )}
                </div>

                {/* Active retrograde warning */}
                {monthEvents.some(e => e.type === "retrograde" && e.name.includes("Başlangıç")) && (
                    <div className="mt-6 bg-red-500/[0.04] border border-red-500/15 rounded-2xl p-4 flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-400/50 shrink-0" />
                        <div>
                            <h4 className="text-xs font-semibold text-red-300/70">Retrograd Uyarısı</h4>
                            <p className="text-[10px] text-white/30 mt-0.5">Bu ay aktif retrograd var. Önemli kararları mümkünse erteleyin.</p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
