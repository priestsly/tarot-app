"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Copy, Video, Clock, CheckCircle, XCircle, ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";

interface Session {
    id: string;
    consultant_id: string;
    client_id: string;
    client_name: string;
    status: string;
    room_id: string;
    created_at: string;
    consultant_name?: string; // We will populate this
}

export default function ConsultationsPage() {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState<'client' | 'consultant' | null>(null);
    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        const fetchHistory = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
            const role = profile?.role || 'client';
            setUserRole(role);

            // Fetch session history for this user
            const { data: rawSessions, error } = await supabase
                .from('session_invites')
                .select('*')
                .or(`client_id.eq.${user.id},consultant_id.eq.${user.id}`)
                .order('created_at', { ascending: false });

            if (error) {
                console.error("Error fetching sessions:", error);
                setLoading(false);
                return;
            }

            if (!rawSessions || rawSessions.length === 0) {
                setSessions([]);
                setLoading(false);
                return;
            }

            // We need to fetch consultant names if the user is a client
            const consultantIds = Array.from(new Set(rawSessions.map((s: any) => s.consultant_id)));
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, full_name')
                .in('id', consultantIds);

            const profileMap = new Map();
            if (profiles) {
                profiles.forEach((p: any) => profileMap.set(p.id, p.full_name));
            }

            const enrichedSessions = rawSessions.map((s: any) => ({
                ...s,
                consultant_name: profileMap.get(s.consultant_id) || "Bilinmeyen Danışman"
            }));

            setSessions(enrichedSessions);
            setLoading(false);
        };

        fetchHistory();
    }, []);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('tr-TR', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white pt-24 px-4 sm:px-6 lg:px-8 pb-12 font-inter relative overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-4xl mx-auto relative z-10">
                <div className="mb-10">
                    <Link href="/" className="inline-flex items-center text-sm font-bold text-purple-400 hover:text-purple-300 transition-colors mb-6 cursor-pointer">
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Ana Sayfaya Dön
                    </Link>
                    <h1 className="text-3xl md:text-5xl font-black font-heading text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-indigo-200">
                        Oturumlarım
                    </h1>
                    <p className="text-purple-200/60 mt-2 font-medium">Tüm aktif ve geçmiş seans geçmişiniz burada listelenir.</p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : sessions.length === 0 ? (
                    <div className="text-center py-16 bg-[#161623] border border-white/5 rounded-3xl">
                        <Clock className="w-12 h-12 text-purple-500/30 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-white mb-2">Henüz Bir Oturum Yok</h3>
                        <p className="text-sm text-purple-200/50">Geçmişte yapılmış bir seans kaydı bulunamadı.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {sessions.map((session, index) => {
                            const isActive = session.status === 'accepted';
                            const isPending = session.status === 'pending';
                            const isCompleted = session.status === 'completed';
                            const isDeclined = session.status === 'declined';

                            const displayName = userRole === 'consultant' ? session.client_name : session.consultant_name;
                            const roleLabel = userRole === 'consultant' ? 'Danışan' : 'Danışman';

                            return (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    key={session.id}
                                    className={`p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${isActive ? 'bg-emerald-500/10 border-emerald-500/30' :
                                            isPending ? 'bg-amber-500/5 border-amber-500/20' :
                                                'bg-[#161623] border-white/5 opacity-75 grayscale-[30%]'
                                        }`}
                                >
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            {isActive ? <Video className="w-5 h-5 text-emerald-400" /> :
                                                isCompleted ? <CheckCircle className="w-5 h-5 text-purple-400" /> :
                                                    isDeclined ? <XCircle className="w-5 h-5 text-red-400" /> :
                                                        <Clock className="w-5 h-5 text-amber-400" />}
                                            <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${isActive ? 'bg-emerald-500/20 text-emerald-400' :
                                                    isCompleted ? 'bg-purple-500/20 text-purple-400' :
                                                        isDeclined ? 'bg-red-500/20 text-red-400' :
                                                            'bg-amber-500/20 text-amber-400'
                                                }`}>
                                                {isActive ? 'Aktif' : isCompleted ? 'Tamamlandı' : isDeclined ? 'Reddedildi' : 'Bekliyor'}
                                            </span>
                                            <span className="text-xs text-white/40">{formatDate(session.created_at)}</span>
                                        </div>

                                        <h3 className="text-lg font-bold text-white">
                                            <span className="text-white/50 text-sm font-medium mr-2">{roleLabel}:</span>
                                            {displayName}
                                        </h3>

                                        {session.room_id && (
                                            <div className="flex items-center gap-2 mt-2">
                                                <code className="text-xs bg-black/40 text-purple-300 px-2 py-1 rounded border border-white/5">
                                                    ID: {session.room_id.split('-')[0]}...
                                                </code>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
                                        {isActive && session.room_id && (
                                            <button
                                                onClick={() => router.push(`/room/${session.room_id}`)}
                                                className="w-full md:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-colors whitespace-nowrap"
                                            >
                                                Sohbete Dön
                                            </button>
                                        )}
                                        {isPending && userRole === 'consultant' && (
                                            <button
                                                onClick={() => router.push('/dashboard')}
                                                className="w-full md:w-auto px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl transition-colors whitespace-nowrap"
                                            >
                                                İsteği Değerlendir
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
