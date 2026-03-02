"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Sparkles, X, Check, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function GlobalNotification() {
    const [incomingRequest, setIncomingRequest] = useState<any>(null);
    const [user, setUser] = useState<any>(null);
    const [onlineClients, setOnlineClients] = useState<Set<string>>(new Set());

    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        let activeChannel: any = null;

        const init = async () => {
            const {
                data: { session },
            } = await supabase.auth.getSession();

            const currentUser = session?.user;
            setUser(currentUser || null);

            if (!currentUser) return;

            // Presence tracking for all users (clients & consultants)
            const presenceChannel = supabase.channel("online_users");
            presenceChannel
                .on("presence", { event: "sync" }, () => {
                    const state = presenceChannel.presenceState();
                    const onlineIds = new Set<string>();
                    Object.values(state).forEach((presences: any) => {
                        (presences as any[]).forEach((p: any) => {
                            if (p.user_id) onlineIds.add(p.user_id);
                        });
                    });
                    setOnlineClients(onlineIds);
                })
                .subscribe(async (status) => {
                    if (status === "SUBSCRIBED") {
                        await presenceChannel.track({
                            user_id: currentUser.id,
                            online_at: new Date().toISOString(),
                        });
                    }
                });

            // Consultant mı kontrol et
            const { data: consultant } = await supabase
                .from("consultants")
                .select("id")
                .eq("id", currentUser.id)
                .maybeSingle();

            if (!consultant) return;

            // Realtime subscription for incoming requests
            activeChannel = supabase
                .channel("global_notifications")
                .on(
                    "postgres_changes",
                    {
                        event: "INSERT",
                        schema: "public",
                        table: "sessions",
                        filter: `consultant_id=eq.${currentUser.id}`,
                    },
                    (payload) => {
                        // trigger native push
                        showBrowserNotification(payload.new);
                        // trigger UI state, which in turn triggers ringing effect
                        setIncomingRequest(payload.new);
                    }
                )
                .subscribe();
        };

        init();

        // Notification permission (wrap in try-catch for mobile constraints)
        try {
            if (
                typeof window !== "undefined" &&
                "Notification" in window &&
                Notification.permission === "default"
            ) {
                Notification.requestPermission().catch(() => { });
            }
        } catch (e) {
            console.warn("Notification request constraint:", e);
        }

        return () => {
            if (activeChannel) supabase.removeChannel(activeChannel);
        };
    }, [supabase]);

    const showBrowserNotification = (session: any) => {
        if (
            typeof window !== "undefined" &&
            "Notification" in window &&
            Notification.permission === "granted"
        ) {
            new Notification("Yeni Görüşme Talebi", {
                body: `${session.client_info?.name || "Bir müşteri"} sizinle görüşmek istiyor.`,
                icon: "/favicon.ico",
            });
        }
    };

    const playNotificationSound = () => {
        try {
            if (typeof navigator !== 'undefined' && "vibrate" in navigator) {
                navigator.vibrate([200, 100, 200, 100, 400]);
            }

            const ctx = new (window.AudioContext ||
                (window as any).webkitAudioContext)();

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = "sine";
            osc.frequency.setValueAtTime(520, ctx.currentTime);
            osc.frequency.setValueAtTime(650, ctx.currentTime + 0.1);

            gain.gain.setValueAtTime(0.0001, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + 1);

            // Auto suspend to avoid context leaks
            setTimeout(() => {
                if (ctx.state !== 'closed') ctx.close().catch(() => { });
            }, 1200);

        } catch (err) {
            console.error("Audio/Vibrate error on mobile", err);
        }
    };

    // Effect to continuously ring while incoming request is active
    useEffect(() => {
        let ringInterval: NodeJS.Timeout | null = null;
        if (incomingRequest) {
            // First play right away
            playNotificationSound();
            // Then loop every 3 seconds
            ringInterval = setInterval(() => {
                playNotificationSound();
            }, 3000);
        }
        return () => {
            if (ringInterval) clearInterval(ringInterval);
        };
    }, [incomingRequest]);

    const handleAcceptSession = async (session: any) => {
        const { error } = await supabase
            .from("sessions")
            .update({
                status: "active",
                updated_at: new Date().toISOString(),
            })
            .eq("id", session.id);

        if (!error) {
            setIncomingRequest(null);
            router.push(`/room/${session.room_id}`);
        } else {
            console.error(error);
        }
    };

    const handleRejectSession = async (session: any) => {
        await supabase
            .from("sessions")
            .update({
                status: "cancelled",
                updated_at: new Date().toISOString(),
            })
            .eq("id", session.id);

        setIncomingRequest(null);
    };

    return (
        <AnimatePresence>
            {incomingRequest && (
                <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="w-full max-w-sm bg-[#161623] border border-white/10 shadow-2xl rounded-3xl overflow-hidden relative"
                    >
                        {/* Top strip */}
                        <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 to-teal-400 absolute top-0 left-0" />

                        <div className="p-6">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-inner">
                                    <Calendar className="w-6 h-6 text-emerald-400" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white tracking-tight">Yeni Randevu</h2>
                                    <p className="text-xs text-zinc-400 uppercase tracking-widest font-semibold mt-0.5 whitespace-nowrap">Bekleyen Talep</p>
                                </div>
                            </div>

                            <div className="bg-white/5 rounded-2xl p-4 border border-white/5 space-y-3 mb-6">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-zinc-500 font-medium">Danışan</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-white font-bold">{incomingRequest.client_info?.name || "İsimsiz"}</span>
                                        {incomingRequest.client_id && onlineClients.has(incomingRequest.client_id) ? (
                                            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-widest">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                Çevrimiçi
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-zinc-500/10 border border-zinc-500/20 text-zinc-400 text-[10px] font-bold uppercase tracking-widest">
                                                <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
                                                Çevrimdışı
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-zinc-500 font-medium">Konu</span>
                                    <span className="text-white font-bold">{incomingRequest.client_info?.focus || "Genel"}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-zinc-500 font-medium">Paket</span>
                                    <span className="text-white font-bold">{incomingRequest.client_info?.pkgId || "Standart"}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => handleRejectSession(incomingRequest)}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 border border-white/10 text-zinc-300 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all font-bold text-sm"
                                >
                                    <X className="w-4 h-4" /> Reddet
                                </button>

                                <button
                                    onClick={() => handleAcceptSession(incomingRequest)}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 text-white hover:bg-emerald-400 shadow-lg shadow-emerald-500/20 transition-all font-bold text-sm"
                                >
                                    <Check className="w-4 h-4 relative -top-[1px]" /> Kabul Et
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}