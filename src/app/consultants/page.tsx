"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Users, Video, Clock, ShieldCheck, Star, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { InviteModal } from "@/components/InviteModal";

interface Consultant {
    id: string;
    full_name: string;
    bio: string | null;
    avatar_url: string | null;
    is_online: boolean;
}

export default function ConsultantsPage() {
    const [consultants, setConsultants] = useState<Consultant[]>([]);
    const [loading, setLoading] = useState(true);
    const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set());
    const [selectedConsultant, setSelectedConsultant] = useState<{ id: string; name: string; isOnline: boolean } | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);

    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        const fetchConsultants = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('profiles')
                .select('id, full_name, bio, avatar_url, is_online')
                .eq('role', 'consultant');

            if (!error && data) {
                setConsultants(data);
            }
            setLoading(false);
        };

        fetchConsultants();

        // Subscribe to global presence channel for consultants
        const channel = supabase.channel('global:consultants', {
            config: { presence: { key: 'watcher' } }
        });

        channel.on('presence', { event: 'sync' }, () => {
            const state = channel.presenceState();
            const currentOnline = new Set<string>();
            Object.values(state).forEach((presences: any[]) => {
                presences.forEach(p => {
                    if (p.role === 'consultant' && p.user_id) {
                        currentOnline.add(p.user_id);
                    }
                });
            });
            setOnlineIds(currentOnline);
        });

        channel.subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const handleConnectClick = (consultant: Consultant, isOnline: boolean) => {
        setSelectedConsultant({ id: consultant.id, name: consultant.full_name, isOnline });
    };

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev + 1) % consultants.length);
    };

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev - 1 + consultants.length) % consultants.length);
    };

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white selection:bg-purple-500/30 overflow-hidden relative font-inter">
            {/* Ambient Backgrounds */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] mix-blend-screen opacity-50 animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] mix-blend-screen opacity-50 animate-pulse-slow" />
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10" />
            </div>

            <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-24">

                {/* Header Section */}
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black font-heading tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-200 to-indigo-200 drop-shadow-sm">
                            Kaderin Rehberleri
                        </h1>
                        <p className="text-lg md:text-xl text-purple-200/60 font-medium leading-relaxed">
                            Gerçek ve deneyimli spiritüel danışmanlarla anında birebir canlı seansa bağlan. Yıldızların ve kartların fısıltısını dileyenler için.
                        </p>
                    </motion.div>
                </div>

                {/* Consultants Carousel / Deck */}
                {loading ? (
                    <div className="flex justify-center items-center h-[500px]">
                        <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : consultants.length === 0 ? (
                    <div className="text-center py-20 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-sm max-w-md mx-auto">
                        <Users className="w-12 h-12 text-purple-400/40 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">Henüz Danışman Yok</h3>
                        <p className="text-purple-200/50">Mistik dünyanın kapıları yeni danışmanlarını bekliyor.</p>
                    </div>
                ) : (
                    <div className="relative h-[600px] flex justify-center items-center w-full max-w-5xl mx-auto perspective-[1200px]">

                        {/* Left Control */}
                        <button
                            onClick={prevSlide}
                            className="absolute left-4 md:left-12 z-50 p-4 rounded-full bg-black/40 hover:bg-purple-600/50 border border-white/10 backdrop-blur-md text-white transition-all transform hover:-translate-x-1"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>

                        <AnimatePresence initial={false} mode="popLayout">
                            {consultants.map((consultant, index) => {
                                const isOnline = onlineIds.has(consultant.id) || consultant.is_online;
                                const isActive = index === currentIndex;

                                // Calculate offset from center for the stacked deck effect
                                const offset = index - currentIndex;
                                const isVisible = Math.abs(offset) <= 2;

                                if (!isVisible) return null;

                                return (
                                    <motion.div
                                        key={consultant.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.8, x: offset * 100 }}
                                        animate={{
                                            opacity: isActive ? 1 : 1 - Math.abs(offset) * 0.3,
                                            scale: isActive ? 1 : 1 - Math.abs(offset) * 0.1,
                                            x: offset * (typeof window !== 'undefined' && window.innerWidth < 768 ? 40 : 120),
                                            rotateY: offset * -15,
                                            zIndex: 40 - Math.abs(offset),
                                        }}
                                        exit={{ opacity: 0, scale: 0.8, zIndex: 0 }}
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        className={`absolute w-[320px] md:w-[400px] h-auto pb-6 group bg-[#161623]/90 backdrop-blur-xl border ${isActive ? 'border-purple-500/50 shadow-[0_0_40px_rgba(147,51,234,0.3)]' : 'border-white/10 shadow-xl shadow-purple-900/10 cursor-pointer'} rounded-3xl overflow-hidden transition-colors duration-500`}
                                        onClick={() => { if (!isActive) setCurrentIndex(index); }}
                                    >
                                        <div className="p-8 relative h-full flex flex-col">
                                            {/* Status Badge */}
                                            <div className="absolute top-6 right-6 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 border border-white/10 backdrop-blur-md shadow-inner">
                                                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]' : 'bg-zinc-500'}`} />
                                                <span className={`text-[10px] font-bold uppercase tracking-wider ${isOnline ? 'text-emerald-400' : 'text-zinc-400'}`}>
                                                    {isOnline ? 'Çevrimiçi' : 'Çevrimdışı'}
                                                </span>
                                            </div>

                                            <div className="flex flex-col items-center gap-4 mb-6 text-center mt-4">
                                                <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-white/10 flex flex-shrink-0 items-center justify-center overflow-hidden shadow-lg relative">
                                                    {consultant.avatar_url ? (
                                                        <img src={consultant.avatar_url} alt={consultant.full_name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Sparkles className="w-10 h-10 text-purple-400/50" />
                                                    )}
                                                </div>
                                                <div className="pt-2">
                                                    <h3 className="text-3xl font-bold font-heading text-white group-hover:text-purple-300 transition-colors">
                                                        {consultant.full_name}
                                                    </h3>
                                                    <div className="flex items-center justify-center gap-3 mt-3">
                                                        <div className="flex items-center gap-1.5 text-amber-400 bg-amber-400/10 px-3 py-1 rounded-md">
                                                            <Star className="w-4 h-4 fill-current" />
                                                            <span className="text-xs font-bold">5.0</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-purple-200/60 bg-purple-500/10 px-3 py-1 rounded-md">
                                                            <ShieldCheck className="w-4 h-4" />
                                                            <span className="text-xs font-bold uppercase tracking-wider">Onaylı</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <p className="text-sm text-center text-purple-200/70 line-clamp-3 leading-relaxed mb-8 font-medium italic">
                                                "{consultant.bio || "Mistik denizlerin fısıltısı senin için yorumlanıyor. Karanlığa ışık tutmayı ve seni rehberliğe kavuşturmayı bekliyor."}"
                                            </p>

                                            <div className="mt-auto">
                                                {isActive && (
                                                    <motion.button
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleConnectClick(consultant, isOnline);
                                                        }}
                                                        className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-2xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(147,51,234,0.4)] hover:shadow-[0_0_30px_rgba(147,51,234,0.6)]"
                                                    >
                                                        <Video className="w-5 h-5" />
                                                        {isOnline ? "Canlı Seansa Bağlan" : "Randevu Planla"}
                                                    </motion.button>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>

                        {/* Right Control */}
                        <button
                            onClick={nextSlide}
                            className="absolute right-4 md:right-12 z-50 p-4 rounded-full bg-black/40 hover:bg-purple-600/50 border border-white/10 backdrop-blur-md text-white transition-all transform hover:translate-x-1"
                        >
                            <ChevronRight className="w-6 h-6" />
                        </button>

                    </div>
                )}
            </main>

            <InviteModal
                consultantId={selectedConsultant?.id || ""}
                consultantName={selectedConsultant?.name || ""}
                isOpen={!!selectedConsultant}
                isOnline={selectedConsultant?.isOnline}
                onClose={() => setSelectedConsultant(null)}
            />
        </div>
    );
}
