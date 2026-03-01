"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Video, XCircle, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

interface InviteModalProps {
    consultantId: string;
    consultantName: string;
    isOpen: boolean;
    isOnline?: boolean;
    onClose: () => void;
}

export function InviteModal({ consultantId, consultantName, isOpen, isOnline = true, onClose }: InviteModalProps) {
    const [status, setStatus] = useState<'idle' | 'sending' | 'pending' | 'accepted' | 'declined' | 'error' | 'offline-sent'>('idle');
    const [inviteId, setInviteId] = useState<string | null>(null);
    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        if (!isOpen) {
            setStatus('idle');
            setInviteId(null);
            return;
        }

        const initiateInvite = async () => {
            setStatus('sending');
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                alert("Önce giriş yapmalısınız.");
                onClose();
                router.push('/login');
                return;
            }

            // Get client profile
            const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
            const clientName = profile?.full_name || 'Bilinmeyen Danışan';

            // Insert invite
            const { data: invite, error } = await supabase.from('session_invites').insert({
                consultant_id: consultantId,
                client_id: user.id,
                client_name: clientName,
            }).select().single();

            if (error || !invite) {
                setStatus('error');
                return;
            }

            if (!isOnline) {
                setStatus('offline-sent');
                return;
            }

            setInviteId(invite.id);
            setStatus('pending');

            // Listen for Consultant's response (only if online)
            const channel = supabase.channel(`invite:${invite.id}`)
                .on(
                    'postgres_changes',
                    { event: 'UPDATE', schema: 'public', table: 'session_invites', filter: `id=eq.${invite.id}` },
                    (payload) => {
                        const newStatus = payload.new.status;
                        setStatus(newStatus as any);

                        if (newStatus === 'accepted' && payload.new.room_id) {
                            setTimeout(() => {
                                onClose();
                                router.push(`/room/${payload.new.room_id}`);
                            }, 1500);
                        } else if (newStatus === 'declined') {
                            setTimeout(() => {
                                onClose();
                            }, 3000);
                        }
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        };

        if (isOpen && status === 'idle') {
            initiateInvite();
        }
    }, [isOpen, consultantId]);

    const handleCancel = async () => {
        if (inviteId) {
            await supabase.from('session_invites').delete().eq('id', inviteId);
        }
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-sm bg-[#161623] border border-white/10 rounded-3xl p-8 shadow-2xl shadow-purple-500/20 text-center overflow-hidden"
                    >
                        {status === 'pending' || status === 'sending' ? (
                            <>
                                <div className="absolute top-0 inset-x-0 h-1 bg-white/5 overflow-hidden">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-purple-500 to-indigo-500"
                                        initial={{ width: "0%" }}
                                        animate={{ width: "100%" }}
                                        transition={{ duration: 15, ease: "linear" }}
                                    />
                                </div>
                                <div className="w-20 h-20 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mx-auto mb-6 relative">
                                    <div className="absolute inset-0 rounded-full border-t-2 border-purple-400 animate-spin" />
                                    <Sparkles className="w-8 h-8 text-purple-300 animate-pulse" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2 font-heading">Ruhlar Sesleniyor</h3>
                                <p className="text-sm text-purple-200/60 leading-relaxed mb-8">
                                    <strong className="text-white">{consultantName}</strong> adlı danışmana vizyon isteği gönderildi. Kabul etmesi bekleniyor...
                                </p>
                                <button onClick={handleCancel} className="text-sm font-bold text-zinc-400 hover:text-white transition-colors">
                                    İptal Et
                                </button>
                            </>
                        ) : status === 'accepted' ? (
                            <>
                                <div className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6">
                                    <Video className="w-8 h-8 text-emerald-400" />
                                </div>
                                <h3 className="text-xl font-bold text-emerald-400 mb-2 font-heading">Bağlantı Kuruldu</h3>
                                <p className="text-sm text-emerald-200/60">Odaya yönlendiriliyorsunuz, lütfen bekleyin...</p>
                            </>
                        ) : status === 'declined' ? (
                            <>
                                <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-6">
                                    <XCircle className="w-8 h-8 text-red-500" />
                                </div>
                                <h3 className="text-xl font-bold text-red-400 mb-2 font-heading">İstek Reddedildi</h3>
                                <p className="text-sm text-red-200/60 mb-8">Danışman şu anda meşgul veya isteğinizi kabul edemiyor.</p>
                                <button onClick={onClose} className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold transition-colors">
                                    Kapat
                                </button>
                            </>
                        ) : status === 'offline-sent' ? (
                            <>
                                <div className="w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-6">
                                    <Sparkles className="w-8 h-8 text-amber-500" />
                                </div>
                                <h3 className="text-xl font-bold text-amber-400 mb-2 font-heading">İstek İletildi</h3>
                                <p className="text-sm text-amber-200/60 mb-8">Danışman şu an çevrimdışı. Talebiniz kendisine iletildi, müsait olduğunda dönüş yapacaktır.</p>
                                <button onClick={onClose} className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold transition-colors">
                                    Kapat
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="text-red-400 mb-4">Bir hata oluştu, istek gönderilemedi.</div>
                                <button onClick={onClose} className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold transition-colors">
                                    Kapat
                                </button>
                            </>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
