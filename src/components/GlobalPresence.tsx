"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Shield, X, Video } from "lucide-react";

export function GlobalPresence() {
    const supabase = createClient();
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [newInvite, setNewInvite] = useState<any>(null);
    const [acceptedInvite, setAcceptedInvite] = useState<any>(null);

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            setUser(user);

            const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
            if (!profile) return;
            setProfile(profile);

            // 1. If Consultant: Listen for NEW invites globally
            if (profile.role === 'consultant') {
                // Tracking presence globally on every page for consultants
                const presenceChannel = supabase.channel('global:consultants', {
                    config: { presence: { key: 'watcher' } }
                });

                presenceChannel.subscribe(async (status) => {
                    if (status === 'SUBSCRIBED') {
                        await presenceChannel.track({
                            user_id: user.id,
                            role: 'consultant',
                            status: 'online'
                        });
                    }
                });

                // Listen for INSERT on session_invites
                const inviteChannel = supabase.channel('global-invites')
                    .on(
                        'postgres_changes',
                        { event: 'INSERT', schema: 'public', table: 'session_invites', filter: `consultant_id=eq.${user.id}` },
                        (payload) => {
                            setNewInvite(payload.new);
                            if ('Notification' in window && Notification.permission === 'granted') {
                                new Notification('Yeni Seans İsteği', {
                                    body: `${payload.new.client_name} sizinle görüşmek istiyor.`,
                                    icon: '/icon-192.png'
                                });
                            }
                        }
                    )
                    .subscribe();

                return () => {
                    supabase.removeChannel(presenceChannel);
                    supabase.removeChannel(inviteChannel);
                };
            }

            // 2. If Client: Check for recently accepted invites if they are wandering around
            const inviteChannel = supabase.channel('client-invites')
                .on(
                    'postgres_changes',
                    { event: 'UPDATE', schema: 'public', table: 'session_invites', filter: `client_id=eq.${user.id}` },
                    (payload) => {
                        if (payload.new.status === 'accepted' && payload.new.room_id) {
                            setAcceptedInvite(payload.new);
                        }
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(inviteChannel);
            };
        };

        const cleanup = init();
        return () => {
            // Clean up handled by internal returns or explicitly here if needed
        };
    }, []);

    return (
        <div className="fixed top-6 right-6 z-[9999] pointer-events-none">
            <AnimatePresence>
                {newInvite && (
                    <motion.div
                        initial={{ opacity: 0, x: 50, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 50, scale: 0.9 }}
                        className="pointer-events-auto bg-[#161623] border border-purple-500/50 rounded-2xl p-5 shadow-2xl shadow-purple-900/40 w-80 mb-3"
                    >
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
                                <Bell className="w-5 h-5 text-purple-400" />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-bold text-white mb-1">Yeni Seans Talebi</h4>
                                <p className="text-xs text-text-muted mb-4">{newInvite.client_name} seans başlatmak istiyor.</p>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => { setNewInvite(null); router.push('/dashboard'); }}
                                        className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold rounded-lg transition-colors"
                                    >
                                        Detaylar
                                    </button>
                                    <button
                                        onClick={() => setNewInvite(null)}
                                        className="p-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {acceptedInvite && (
                    <motion.div
                        initial={{ opacity: 0, x: 50, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 50, scale: 0.9 }}
                        className="pointer-events-auto bg-[#161623] border border-emerald-500/50 rounded-2xl p-5 shadow-2xl shadow-emerald-900/40 w-80 mb-3"
                    >
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                                <Video className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-bold text-white mb-1">İstek Kabul Edildi!</h4>
                                <p className="text-xs text-text-muted mb-4">Danışman isteğinizi kabul etti. Seansa katılmaya hazır mısınız?</p>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => {
                                            const roomId = acceptedInvite.room_id;
                                            setAcceptedInvite(null);
                                            router.push(`/room/${roomId}`);
                                        }}
                                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded-lg transition-colors"
                                    >
                                        Hemen Katıl
                                    </button>
                                    <button
                                        onClick={() => setAcceptedInvite(null)}
                                        className="p-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
