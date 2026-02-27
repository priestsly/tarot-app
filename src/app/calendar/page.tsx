"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ChevronLeft, ChevronRight, Star, AlertTriangle, Moon, Sun, Zap, Info } from "lucide-react";

// ── Cosmic Events Database 2026 (Verified Data) ──
interface CosmicEvent {
    date: string; // "MM-DD"
    name: string;
    emoji: string;
    type: "new_moon" | "full_moon" | "retrograde" | "eclipse" | "season" | "portal";
    desc: string;
    time?: string;
    sign?: string;
}

const COSMIC_EVENTS: CosmicEvent[] = [
    // 🌑 Yeniaylar 2026
    { date: "01-18", name: "Yeni Ay (Oğlak)", emoji: "🌑", type: "new_moon", time: "22:53", sign: "Oğlak", desc: "Kariyer hedefleri ve disiplin konularında yeni tohumlar ekme zamanı." },
    { date: "02-17", name: "Yeni Ay (Kova)", emoji: "🌑", type: "new_moon", time: "15:01", sign: "Kova", desc: "Toplumsal projeler ve teknolojik yenilikler için vizyoner bir başlangıç." },
    { date: "03-19", name: "Yeni Ay (Balık)", emoji: "🌑", type: "new_moon", time: "05:22", sign: "Balık", desc: "Ruhsal şifa ve sanatsal ilhamlar için içe dönme vakti." },
    { date: "04-17", name: "Yeni Ay (Koç)", emoji: "🌑", type: "new_moon", time: "17:52", sign: "Koç", desc: "Cesur adımlar ve bireysel başlangıçlar için yüksek enerji." },
    { date: "05-16", name: "Yeni Ay (Boğa)", emoji: "🌑", type: "new_moon", time: "04:02", sign: "Boğa", desc: "Maddi güven ve konfor alanları inşa etmek için ideal zaman." },
    { date: "06-15", name: "Yeni Ay (İkizler)", emoji: "🌑", type: "new_moon", time: "12:54", sign: "İkizler", desc: "İletişim ağlarını genişletme ve yeni eğitimler için harika bir dönem." },
    { date: "07-14", name: "Yeni Ay (Yengeç)", emoji: "🌑", type: "new_moon", time: "21:38", sign: "Yengeç", desc: "Aile ve yuva temalarında yenilenme ve koruma enerjisi." },
    { date: "08-12", name: "Yeni Ay (Aslan)", emoji: "🌑", type: "new_moon", time: "20:36", sign: "Aslan", desc: "Yaratıcılığınızı sergilemek ve sahnede olmak için parlayan bir başlangıç." },
    { date: "09-11", name: "Yeni Ay (Başak)", emoji: "🌑", type: "new_moon", time: "06:14", sign: "Başak", desc: "Düzen, sağlık ve verimlilik adına yeni rutinler oluşturma zamanı." },
    { date: "10-10", name: "Yeni Ay (Terazi)", emoji: "🌑", type: "new_moon", time: "18:50", sign: "Terazi", desc: "İlişkilerde denge ve estetik projeler için yeni bir kapı." },
    { date: "11-09", name: "Yeni Ay (Akrep)", emoji: "🌑", type: "new_moon", time: "10:01", sign: "Akrep", desc: "Derin dönüşüm ve finansal ortaklıklar için stratejik başlangıç." },
    { date: "12-09", name: "Yeni Ay (Yay)", emoji: "🌑", type: "new_moon", time: "03:00", sign: "Yay", desc: "İnançlar, seyahatler ve felsefi keşifler için ufkunu açma vakti." },

    // 🌕 Dolunaylar 2026
    { date: "01-03", name: "Dolunay (Yengeç)", emoji: "🌕", type: "full_moon", time: "13:04", sign: "Yengeç", desc: "Duygusal yüklerden arınma ve ev-aile konularında netleşme." },
    { date: "02-02", name: "Dolunay (Aslan)", emoji: "🌕", type: "full_moon", time: "01:08", sign: "Aslan", desc: "Bireysel yeteneklerin takdir edilmesi ve liderlik gücünün doruğu." },
    { date: "03-03", name: "Dolunay (Başak)", emoji: "🌕", type: "full_moon", time: "14:37", sign: "Başak", desc: "Detayların tamamlanması ve sağlıkla ilgili kararların netleşmesi." },
    { date: "04-02", name: "Dolunay (Terazi)", emoji: "🌕", type: "full_moon", time: "00:11", sign: "Terazi", desc: "İlişkilerde hasat zamanı ve adalet temalarının vurgusu." },
    { date: "05-01", name: "Dolunay (Akrep)", emoji: "🌕", type: "full_moon", time: "10:08", sign: "Akrep", desc: "Krizlerin çözülmesi ve derin duygusal bırakılışlar." },
    { date: "05-31", name: "Dolunay (Yay)", emoji: "🌕", type: "full_moon", time: "01:23", sign: "Yay", desc: "Uzak hedeflerin meyvelerini toplama ve inançlarda netleşme." },
    { date: "06-30", name: "Dolunay (Oğlak)", emoji: "🌕", type: "full_moon", time: "17:51", sign: "Oğlak", desc: "Sorumlulukların sonuçlanması ve toplumsal statüyle ilgili değişim." },
    { date: "07-29", name: "Dolunay (Kova)", emoji: "🌕", type: "full_moon", time: "10:33", sign: "Kova", desc: "Sosyal çevre ve arkadaşlık ilişkilerinde farkındalık zirvesi." },
    { date: "08-28", name: "Dolunay (Balık)", emoji: "🌕", type: "full_moon", time: "21:18", sign: "Balık", desc: "Ruhsal teslimiyet ve hayallerin gerçeğe döküldüğü anlar." },
    { date: "09-26", name: "Dolunay (Koç)", emoji: "🌕", type: "full_moon", time: "05:49", sign: "Koç", desc: "Bireysel var oluşun ilanı ve cesaret gerektiren hamlelerin sonucu." },
    { date: "10-26", name: "Dolunay (Boğa)", emoji: "🌕", type: "full_moon", time: "13:11", sign: "Boğa", desc: "Konfor arayışının ve kazançların istikrara kavuşma vakti." },
    { date: "11-24", name: "Dolunay (İkizler)", emoji: "🌕", type: "full_moon", time: "20:53", sign: "İkizler", desc: "Bilgi trafiğinin zirvesi ve yakın çevreyle olan meselelerin sonu." },
    { date: "12-24", name: "Dolunay (Yengeç)", emoji: "🌕", type: "full_moon", time: "05:29", sign: "Yengeç", desc: "Yılın son duygusal temizliği ve aile içi bağların güçlenmesi." },

    // 🌀 Tutulmalar 2026
    { date: "02-17", name: "Halkalı Güneş Tutulması", emoji: "☀️🌑", type: "eclipse", time: "15:01", sign: "Kova", desc: "Kova burcunda gerçekleşecek bu tutulma, teknoloji ve toplumsal devrimlerin habercisi." },
    { date: "03-03", name: "Tam Ay Tutulması", emoji: "🌕🌑", type: "eclipse", time: "14:37", sign: "Başak", desc: "Başak-Balık aksındaki bu tutulma, kaos ve düzen arasındaki dengeyi bulmaya zorlayacak." },
    { date: "08-12", name: "Tam Güneş Tutulması", emoji: "☀️🌑", type: "eclipse", time: "20:36", sign: "Aslan", desc: "Aslan burcundaki bu güçlü tutulma, yaratıcı enerjiyi ve liderlik vasıflarını tetikleyecek." },
    { date: "08-28", name: "Parçalı Ay Tutulması", emoji: "🌕🌑", type: "eclipse", time: "21:18", sign: "Balık", desc: "Sezgilerin tavan yapacağı, bilinçaltı temizliği için kadersel bir an." },

    // 🔄 Gezegen Retroları 2026
    { date: "02-26", name: "Merkür Retrograd Başlıyor", emoji: "☿️", type: "retrograde", sign: "Balık", desc: "Zihin dalgınlığına ve iletişim aksaklıklarına dikkat." },
    { date: "03-20", name: "Merkür Retrograd Bitiyor", emoji: "☿️", type: "retrograde", sign: "Balık", desc: "İletişim kanalları yeniden açılıyor, kararlar netleşiyor." },
    { date: "06-29", name: "Merkür Retrograd Başlıyor", emoji: "☿️", type: "retrograde", sign: "Yengeç", desc: "Aile içi yanlış anlaşılmalar ve geçmiş hatıralar gündemde." },
    { date: "07-23", name: "Merkür Retrograd Bitiyor", emoji: "☿️", type: "retrograde", sign: "Yengeç", desc: "Duygusal ifadeler daha rahat akmaya başlıyor." },
    { date: "10-24", name: "Merkür Retrograd Başlıyor", emoji: "☿️", type: "retrograde", sign: "Akrep", desc: "Gizli bilgilerin açığa çıkışı ve derin şüpheler dönemi." },
    { date: "11-13", name: "Merkür Retrograd Bitiyor", emoji: "☿️", type: "retrograde", sign: "Akrep", desc: "Stratejik düşünme ve araştırmada başarı." },
    { date: "10-03", name: "Venüs Retrograd Başlıyor", emoji: "♀️", type: "retrograde", sign: "Akrep", desc: "İlişkilerde krizler, tutku ve değerlerin teste tabi tutulması." },
    { date: "11-13", name: "Venüs Retrograd Bitiyor", emoji: "♀️", type: "retrograde", sign: "Terazi", desc: "İlişkilerde barış ve estetik denge yeniden kuruluyor." },

    // 🗓️ Mevsimler & Portallar
    { date: "03-20", name: "İlkbahar Ekinoksu (Nevruz)", emoji: "🌱", type: "season", desc: "Doğanın uyanışı. Güneş Koç burcuna geçiyor. Astroloji yılının başlangıcı." },
    { date: "06-21", name: "Yaz Gündönümü", emoji: "☀️", type: "season", desc: "En uzun gün. Güneş Yengeç burcuna geçiyor." },
    { date: "09-22", name: "Sonbahar Ekinoksu", emoji: "🍂", type: "season", desc: "Gece ve gündüzün eşitliği. Güneş Terazi burcuna geçiyor." },
    { date: "12-21", name: "Kış Gündönümü", emoji: "❄️", type: "season", desc: "En uzun gece. Güneş Oğlak burcuna geçiyor." },
    { date: "08-08", name: "Aslan Kapısı (Lion's Gate)", emoji: "🦁", type: "portal", desc: "Sirius yıldızı ile hizalanma. Tezahür gücü yüksek gün." },
    { date: "11-11", name: "11:11 Manifest Kapısı", emoji: "🌀", type: "portal", desc: "Yüksek farkındalık ve evrensel kapıların açılışı." },
];

const MONTHS_TR = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
const DAYS_TR = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

function getDaysInMonth(year: number, month: number) { return new Date(year, month + 1, 0).getDate(); }
function getFirstDayOfMonth(year: number, month: number) { const d = new Date(year, month, 1).getDay(); return d === 0 ? 6 : d - 1; }

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
    const [viewYear, setViewYear] = useState(2026); // Default to 2026 as per user request
    const [viewMonth, setViewMonth] = useState(now.getMonth());
    const [selectedDay, setSelectedDay] = useState<number | null>(now.getDate());

    const daysInMonth = getDaysInMonth(viewYear, viewMonth);
    const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
    const today = now.getDate();
    const isCurrentMonth = now.getFullYear() === viewYear && now.getMonth() === viewMonth;

    const monthEvents = useMemo(() => {
        const mm = String(viewMonth + 1).padStart(2, "0");
        return COSMIC_EVENTS.filter(e => e.date.startsWith(mm + "-"));
    }, [viewMonth]);

    const dayEvents = useMemo(() => {
        if (!selectedDay) return [];
        const mm = String(viewMonth + 1).padStart(2, "0");
        const dd = String(selectedDay).padStart(2, "0");
        return COSMIC_EVENTS.filter(e => e.date === `${mm}-${dd}`);
    }, [viewMonth, selectedDay]);

    const eventDays = useMemo(() => {
        const map = new Map<number, CosmicEvent[]>();
        monthEvents.forEach(e => {
            const d = parseInt(e.date.split("-")[1]);
            if (!map.has(d)) map.set(d, []);
            map.get(d)!.push(e);
        });
        return map;
    }, [monthEvents]);

    return (
        <div className="min-h-screen bg-[#0a0812] text-white relative overflow-hidden font-inter">
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 inset-x-0 h-[50%] bg-gradient-to-b from-purple-900/10 to-transparent" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] h-[90vh] bg-indigo-500/5 rounded-full blur-[200px]" />
            </div>

            <header className="sticky top-0 z-40 bg-[#0a0812]/80 backdrop-blur-xl border-b border-white/[0.04]">
                <div className="max-w-2xl mx-auto flex items-center justify-between px-4 sm:px-6 py-4">
                    <button onClick={() => router.push("/")} className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors text-xs font-medium uppercase tracking-widest"><ArrowLeft className="w-4 h-4" /> <span>Geri</span></button>
                    <div className="flex items-center gap-2">
                        <Star className="w-3.5 h-3.5 text-amber-500/40 animate-pulse" />
                        <span className="text-[10px] text-white/20 uppercase tracking-[0.3em] font-bold">2026 Göksel Rehber</span>
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
                    <p className="text-sm text-white/30 max-w-xs mx-auto leading-relaxed italic">&ldquo;Gökyüzündeki her hareket, yeryüzündeki bir oluşun habercisidir.&rdquo;</p>
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between mb-8 bg-white/[0.02] border border-white/[0.06] rounded-2xl p-2 shrink-0">
                    <button onClick={() => setViewMonth(m => (m === 0 ? 11 : m - 1))} className="p-3 rounded-xl hover:bg-white/5 transition-all text-white/30"><ChevronLeft className="w-5 h-5" /></button>
                    <div className="text-center">
                        <h2 className="text-lg font-heading font-bold text-white/80">{MONTHS_TR[viewMonth]}</h2>
                        <p className="text-[10px] text-white/20 uppercase tracking-widest font-bold">{viewYear}</p>
                    </div>
                    <button onClick={() => setViewMonth(m => (m === 11 ? 0 : m + 1))} className="p-3 rounded-xl hover:bg-white/5 transition-all text-white/30"><ChevronRight className="w-5 h-5" /></button>
                </div>

                {/* Calendar Grid */}
                <div className="bg-white/[0.01] border border-white/[0.04] rounded-[2.5rem] p-5 sm:p-7 mb-10 shadow-2xl shadow-black/40">
                    <div className="grid grid-cols-7 mb-4">
                        {DAYS_TR.map(d => <div key={d} className="text-center text-[10px] text-white/15 uppercase font-black tracking-tighter py-2">{d}</div>)}
                    </div>

                    <div className="grid grid-cols-7 gap-2 sm:gap-3">
                        {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} className="aspect-square opacity-0" />)}

                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const day = i + 1;
                            const isToday = isCurrentMonth && day === today;
                            const isSelected = day === selectedDay;
                            const dayEventsList = eventDays.get(day) || [];

                            return (
                                <button key={day} onClick={() => setSelectedDay(day)}
                                    className={`relative aspect-square rounded-2xl flex flex-col items-center justify-center transition-all duration-300 group
                                        ${isSelected ?
                                            "bg-indigo-600/30 border border-indigo-400/50 shadow-lg shadow-indigo-500/10 scale-105" :
                                            isToday ? "bg-white/[0.08] border border-white/20" : "hover:bg-white/[0.04] border border-transparent"}`}>

                                    <span className={`text-sm sm:text-base font-medium ${isSelected ? "text-white" : isToday ? "text-indigo-300" : "text-white/40 group-hover:text-white/70"}`}>
                                        {day}
                                    </span>

                                    {/* Event Dots */}
                                    <div className="flex gap-1 mt-1.5 h-1">
                                        {dayEventsList.slice(0, 3).map((e, idx) => (
                                            <div key={idx} className={`w-1 h-1 rounded-full ${TYPE_COLORS[e.type].dot} shadow-sm`} />
                                        ))}
                                    </div>

                                    {isSelected && (
                                        <motion.div layoutId="selection" className="absolute -inset-1 rounded-3xl border border-indigo-400/20 pointer-events-none" />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Legend */}
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
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="space-y-4 mb-10"
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <Star className="w-4 h-4 text-indigo-400/40" />
                                <h3 className="text-xs font-bold text-white/30 uppercase tracking-[0.2em]">{selectedDay} {MONTHS_TR[viewMonth]} Detayları</h3>
                            </div>

                            {dayEvents.length > 0 ? (
                                dayEvents.map((ev, i) => (
                                    <div key={i} className={`relative overflow-hidden group p-6 rounded-3xl border ${TYPE_COLORS[ev.type].border} ${TYPE_COLORS[ev.type].bg}`}>
                                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                            <span className="text-6xl">{ev.emoji}</span>
                                        </div>
                                        <div className="relative z-10">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className={`p-2 rounded-xl ${TYPE_COLORS[ev.type].bg} border ${TYPE_COLORS[ev.type].border}`}>
                                                    <span className="text-xl">{ev.emoji}</span>
                                                </div>
                                                <div>
                                                    <h4 className={`text-base font-bold ${TYPE_COLORS[ev.type].text}`}>{ev.name}</h4>
                                                    <div className="flex gap-2">
                                                        {ev.time && <span className="text-[9px] font-black uppercase text-white/20 bg-white/5 px-1.5 py-0.5 rounded">Saat {ev.time}</span>}
                                                        {ev.sign && <span className="text-[9px] font-black uppercase text-white/20 bg-white/5 px-1.5 py-0.5 rounded">{ev.sign} Burcunda</span>}
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-sm text-white/50 leading-relaxed">{ev.desc}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 rounded-3xl border border-dashed border-white/5 text-center">
                                    <Moon className="w-10 h-10 text-white/5 mx-auto mb-3" />
                                    <p className="text-xs text-white/20">Bugün gökyüzünde özel bir olay kaydı bulunmuyor.</p>
                                    <p className="text-[10px] text-white/10 mt-1 italic">Rutin kozmik enerjiler devam ediyor.</p>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Monthly Summary */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3 px-2">
                        <Zap className="w-4 h-4 text-amber-500/40" />
                        <h3 className="text-xs font-bold text-white/30 uppercase tracking-[0.2em]">{MONTHS_TR[viewMonth]} Özet</h3>
                    </div>

                    {monthEvents.length === 0 ? (
                        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-8 text-center">
                            <p className="text-xs text-white/25">Bu ay için kritik bir olay bulunmamaktadır.</p>
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {monthEvents.sort((a, b) => parseInt(a.date.split('-')[1]) - parseInt(b.date.split('-')[1])).map((ev, i) => {
                                const day = parseInt(ev.date.split("-")[1]);
                                return (
                                    <button
                                        key={i}
                                        onClick={() => setSelectedDay(day)}
                                        className="group w-full bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] rounded-2xl p-4 flex items-center gap-4 transition-all"
                                    >
                                        <div className="w-10 h-10 shrink-0 flex items-center justify-center bg-white/[0.03] border border-white/[0.06] rounded-xl text-center">
                                            <span className="text-xs font-bold text-white/40">{day}</span>
                                        </div>
                                        <div className="flex-1 text-left min-w-0">
                                            <h4 className="text-xs font-bold text-white/70 group-hover:text-indigo-300 transition-colors truncate">{ev.name}</h4>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <div className={`w-1 h-1 rounded-full ${TYPE_COLORS[ev.type].dot}`} />
                                                <span className="text-[10px] text-white/20 capitalize font-medium">{ev.type.replace('_', ' ')}</span>
                                            </div>
                                        </div>
                                        <div className="p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Star className="w-3.5 h-3.5 text-indigo-400/40" />
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Info Card */}
                <div className="mt-12 p-6 rounded-3xl bg-indigo-500/[0.03] border border-indigo-500/10 flex items-start gap-4">
                    <Info className="w-5 h-5 text-indigo-400/40 shrink-0 mt-0.5" />
                    <div>
                        <h4 className="text-xs font-bold text-indigo-300/60 uppercase tracking-wider mb-2">Astroloji Notu</h4>
                        <p className="text-[11px] text-white/30 leading-relaxed italic">
                            Bu takvimdeki veriler 2026 yılı Türkiye yerel saatine göre hesaplanmış olup, Ay fazlarını ve temel gezegen hareketlerini doğrulanmış astronomik verilere dayanarak sunar.
                            Kozmik etkiler geneldir; her bireyin haritasında farklı tezahür edebilir.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
