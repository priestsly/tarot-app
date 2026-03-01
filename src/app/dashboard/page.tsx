"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Video, Settings, Bell, Clock, User, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

interface SessionInvite {
    id: string;
    client_id: string;
    client_name: string;
    status: 'pending' | 'accepted' | 'declined';
    created_at: string;
}

interface Profile {
    id: string;
    full_name: string;
    role: string;
    avatar_url: string | null;
}

export default function DashboardPage() {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [invites, setInvites] = useState<SessionInvite[]>([]);
    const [loading, setLoading] = useState(true);
    const [isBusy, setIsBusy] = useState(false);
    const [presenceChannel, setPresenceChannel] = useState<any>(null);
    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        // Request Notification permission
        if ('Notification' in window) {
            Notification.requestPermission();
        }

        const loadDashboard = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            // Fetch profile
            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profileData) {
                setProfile(profileData);

                // If consultant, set online and listen for invites
                if (profileData.role === 'consultant') {
                    // 1. Set online globally via Presence
                    const newChannel = supabase.channel('global:consultants', {
                        config: { presence: { key: 'watcher' } }
                    });

                    newChannel.on('presence', { event: 'sync' }, () => { });

                    newChannel.subscribe(async (status) => {
                        if (status === 'SUBSCRIBED') {
                            await newChannel.track({
                                user_id: user.id,
                                role: 'consultant',
                                status: 'online'
                            });
                            setPresenceChannel(newChannel);
                        }
                    });

                    // 2. Fetch active pending invites
                    const { data: inviteData } = await supabase
                        .from('session_invites')
                        .select('*')
                        .eq('consultant_id', user.id)
                        .eq('status', 'pending')
                        .order('created_at', { ascending: false });

                    if (inviteData) setInvites(inviteData);

                    // 3. Listen for NEW invites real-time
                    const inviteListener = supabase.channel('consultant-invites')
                        .on(
                            'postgres_changes',
                            { event: 'INSERT', schema: 'public', table: 'session_invites', filter: `consultant_id=eq.${user.id}` },
                            (payload) => {
                                const newInvite = payload.new as SessionInvite;
                                setInvites((prev) => [newInvite, ...prev]);

                                if ('Notification' in window && Notification.permission === 'granted') {
                                    new Notification('Yeni Seans İsteği', {
                                        body: `${newInvite.client_name} sizinle canlı bir görüşme yapmak istiyor.`,
                                        icon: '/icon-192.png'
                                    });
                                }
                            }
                        )
                        .on(
                            'postgres_changes',
                            { event: 'UPDATE', schema: 'public', table: 'session_invites', filter: `consultant_id=eq.${user.id}` },
                            (payload) => {
                                // Remove if status is no longer pending (cancelled by client, etc.)
                                if (payload.new.status !== 'pending') {
                                    setInvites((prev) => prev.filter(inv => inv.id !== payload.new.id));
                                }
                            }
                        )
                        .subscribe();

                    return () => {
                        supabase.removeChannel(newChannel);
                        supabase.removeChannel(inviteListener);
                    };
                }
            }
            setLoading(false);
        };

        loadDashboard();
    }, [router, supabase]);

    useEffect(() => {
        if (presenceChannel && profile) {
            presenceChannel.track({
                user_id: profile.id,
                role: 'consultant',
                status: isBusy ? 'busy' : 'online'
            });
        }
    }, [isBusy, presenceChannel, profile]);

    const handleAccept = async (inviteId: string) => {
        const roomId = crypto.randomUUID(); // Generate unique room ID
        const { error } = await supabase
            .from('session_invites')
            .update({ status: 'accepted', room_id: roomId })
            .eq('id', inviteId);

        if (!error) {
            router.push(`/room/${roomId}`);
        }
    };

    const handleDecline = async (inviteId: string) => {
        const { error } = await supabase
            .from('session_invites')
            .update({ status: 'declined' })
            .eq('id', inviteId);

        if (!error) {
            setInvites(invites.filter(inv => inv.id !== inviteId));
        }
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/');
    };

    if (loading) {
        return <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center"><div className="w-8 h-8 rounded-full border-4 border-purple-500/30 border-t-purple-500 animate-spin" /></div>;
    }

    if (!profile) return null;

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white font-inter">
            {/* Top Navigation */}
            <nav className="border-b border-white/10 bg-[#11111a]/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-amber-200" />
                        </div>
                        <div>
                            <h1 className="text-lg font-heading font-bold leading-tight">Mystic Tarot</h1>
                            <span className="text-[10px] text-purple-300/80 font-bold uppercase tracking-wider">{profile.role === 'consultant' ? 'Danışman Portalı' : 'Danışan Portalı'}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex items-center gap-3 pr-4 border-r border-white/10">
                            <div className="text-right">
                                <p className="text-sm font-bold">{profile.full_name}</p>
                                <p className="text-xs text-zinc-400 capitalize">{profile.role}</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                                {profile.avatar_url ? <img src={profile.avatar_url} className="w-full h-full rounded-full object-cover" /> : <User className="w-5 h-5 text-zinc-400" />}
                            </div>
                        </div>
                        <button onClick={handleSignOut} className="p-2.5 rounded-xl bg-zinc-800/50 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors">
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {profile.role === 'consultant' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column - Active Invites */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold font-heading flex items-center gap-3">
                                    <Bell className="w-6 h-6 text-purple-400 flex-shrink-0" />
                                    Bekleyen İstekler
                                    {invites.length > 0 && (
                                        <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold ml-2 animate-pulse">
                                            {invites.length} Yeni
                                        </span>
                                    )}
                                </h2>
                            </div>

                            <AnimatePresence>
                                {invites.length === 0 ? (
                                    <motion.div
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                        className="bg-[#11111a] border border-white/5 rounded-3xl p-12 text-center"
                                    >
                                        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                                            <Clock className="w-8 h-8 text-zinc-500" />
                                        </div>
                                        <h3 className="text-xl font-bold mb-2">Şu an sessizlik hakim...</h3>
                                        <p className="text-zinc-500">Yeni bir bağlantı isteği geldiğinde burada belirecek. Sayfayı açık tutarak çevrimiçi kalabilirsin.</p>
                                    </motion.div>
                                ) : (
                                    <div className="space-y-4">
                                        {invites.map((invite) => (
                                            <motion.div
                                                key={invite.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: 20 }}
                                                className="bg-gradient-to-r from-purple-900/20 to-indigo-900/10 border border-purple-500/30 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-lg shadow-purple-900/10"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-full bg-purple-500/20 border border-purple-500/50 flex items-center justify-center">
                                                        <User className="w-6 h-6 text-purple-300" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-lg font-bold text-white mb-1">{invite.client_name}</h4>
                                                        <p className="text-sm text-purple-200/60">Canlı seans başlatmak istiyor.</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3 w-full sm:w-auto">
                                                    <button
                                                        onClick={() => handleDecline(invite.id)}
                                                        className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-white/5 hover:bg-red-500/20 text-zinc-300 hover:text-red-400 border border-white/10 hover:border-red-500/50 transition-all font-bold text-sm"
                                                    >
                                                        Reddet
                                                    </button>
                                                    <button
                                                        onClick={() => handleAccept(invite.id)}
                                                        className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm transition-all shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2"
                                                    >
                                                        <Video className="w-4 h-4" />
                                                        Kabul Et
                                                    </button>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Right Column - Status */}
                        <div className="space-y-6">
                            <div className="bg-[#11111a] border border-white/5 rounded-3xl p-6">
                                <h3 className="text-lg font-bold font-heading mb-6 flex items-center gap-2">
                                    <Settings className="w-5 h-5 text-zinc-400" />
                                    Danışman Durumu
                                </h3>

                                <div className={`flex items-center justify-between p-4 border rounded-2xl transition-colors ${isBusy ? 'bg-amber-500/10 border-amber-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full animate-pulse ${isBusy ? 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.8)]' : 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]'}`} />
                                        <span className={`font-bold ${isBusy ? 'text-amber-400' : 'text-emerald-400'}`}>
                                            {isBusy ? 'Meşgul' : 'Çevrimiçi'}
                                        </span>
                                    </div>
                                    <span className={`text-xs font-medium ${isBusy ? 'text-amber-400/60' : 'text-emerald-400/60'}`}>
                                        {isBusy ? 'Sadece Çevrimdışı Talep Alır' : 'Danışanlara Görünür'}
                                    </span>
                                </div>

                                <button
                                    onClick={() => setIsBusy(!isBusy)}
                                    className="w-full mt-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold text-sm transition-all"
                                >
                                    Durumu {isBusy ? '"Çevrimiçi"' : '"Meşgul"'} Olarak Değiştir
                                </button>

                                <p className="text-xs text-zinc-500 mt-4 leading-relaxed">
                                    Bu pencere açık kaldığı sürece profilinde durumunuz görülecektir. Danışanlar siz "Meşgul" veya sayfadan çıkmış olsanız da size Randevu Talebi (Offline İstek) gönderebilirler.
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <h2 className="text-2xl font-bold mb-4">Danışan Portalı Yapım Aşamasında</h2>
                        <p className="text-zinc-500 mb-8">Buradan favori danışmanlarını ve geçmiş seanslarını görebileceksin.</p>
                        <button onClick={() => router.push('/consultants')} className="px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-colors">
                            Danışmanları Keşfet
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}
