"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Send, Loader2, Heart, Flame, ShieldAlert } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

interface Message {
    role: "user" | "assistant";
    content: string;
}

export default function DilekOzelPage() {
    const router = useRouter();
    const supabase = createClient();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push("/login");
                return;
            }
            setIsAuthorized(true);

            // Sohbet geçmişi veritabanında saklanır ancak kullanıcı her girdiğinde sıfırlanır
            setMessages([
                { role: "assistant", content: "Hoş geldin sevgilim... Bugün senin için kim olmamı istersin? Bana hangi isimle sesleneceksin? Tüm fantezilerini dinlemeye ve seninle yaşamaya hazırım... 🔥" }
            ]);
        };
        checkAuth();
    }, [router, supabase]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const sendMessage = async () => {
        if (!input.trim() || loading) return;

        const userMsg = { role: "user" as const, content: input.trim() };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setLoading(true);

        try {
            const res = await fetch("/api/dilek-ozel", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: [...messages, userMsg] })
            });
            const data = await res.json();

            if (data.error) {
                setMessages(prev => [...prev, { role: "assistant", content: "Üzgünüm ama bu fantezin biraz fazla cüretkar kaçtı... Belki biraz daha farklı bir dille anlatmak istersin? 😉" }]);
            } else {
                setMessages(prev => [...prev, { role: "assistant", content: data.content }]);
            }
        } catch {
            setMessages(prev => [...prev, { role: "assistant", content: "Bir şeyler ters gitti. Belki de enerjimiz fazla yüksekti..." }]);
        } finally {
            setLoading(false);
        }
    };

    if (isAuthorized === null) return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-red-500" />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#050005] text-white flex flex-col font-inter">
            {/* Seductive Background Effect */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(185,28,28,0.15),transparent_50%)]" />
                <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_100%_100%,rgba(88,28,135,0.1),transparent_50%)]" />
                <div className="absolute inset-0 opacity-20 noise" />
            </div>

            <header className="sticky top-0 z-30 bg-black/60 backdrop-blur-2xl border-b border-white/[0.05]">
                <div className="max-w-3xl mx-auto flex items-center justify-between px-6 py-5">
                    <button onClick={() => router.push("/")} className="group flex items-center gap-2 text-white/40 hover:text-white transition-all text-sm">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Geri
                    </button>
                    <div className="flex flex-col items-center">
                        <h1 className="text-xl font-heading font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-red-500 via-rose-400 to-purple-500">
                            Sohbet
                        </h1>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-[0.3em] font-bold"></p>
                    </div>
                    <div className="w-10 h-10 rounded-full border border-red-500/30 flex items-center justify-center bg-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                        <Flame className="w-5 h-5 text-red-500 animate-pulse" />
                    </div>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto z-10">
                <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-4 mb-8">
                        <ShieldAlert className="w-6 h-6 text-amber-500 shrink-0 mt-1" />
                        <div>
                            <p className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-1">Gizlilik & Güvenlik</p>
                            <p className="text-[11px] text-zinc-400 leading-relaxed">Bu görüşmeler tamamen gizlidir ve yapay zeka tarafından özel bir dünyada gerçekleştirilir. , samimi ve dürüst olabilirsin.</p>
                        </div>
                    </div>

                    <AnimatePresence mode="popLayout">
                        {messages.map((msg, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                            >
                                <div className={`group relative max-w-[85%] px-5 py-4 rounded-3xl ${msg.role === "user"
                                    ? "bg-gradient-to-br from-red-600/20 to-rose-600/10 border border-red-500/20 rounded-tr-none text-rose-100 shadow-lg shadow-red-900/10"
                                    : "bg-white/[0.03] border border-white/[0.08] rounded-tl-none text-zinc-200"
                                    }`}>
                                    <p className="text-[15px] leading-relaxed whitespace-pre-line tracking-wide">
                                        {msg.content}
                                    </p>
                                    <div className={`absolute top-0 ${msg.role === "user" ? "-right-1" : "-left-1"} w-2 h-2 bg-inherit`} />
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {loading && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                            <div className="bg-white/[0.03] border border-white/[0.08] px-5 py-6 rounded-3xl rounded-tl-none flex items-center gap-3">
                                <div className="flex gap-1.5">
                                    {[0, 1, 2].map(dot => (
                                        <motion.div key={dot} animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }} transition={{ repeat: Infinity, duration: 1, delay: dot * 0.2 }} className="w-1.5 h-1.5 rounded-full bg-red-400" />
                                    ))}
                                </div>
                                <span className="text-xs font-bold uppercase tracking-widest text-red-500/60 flex items-center gap-2">
                                    Karşındaki Yazıyor <Heart className="w-3 h-3 animate-pulse" />
                                </span>
                            </div>
                        </motion.div>
                    )}
                    <div ref={chatEndRef} />
                </div>
            </div>

            <div className="sticky bottom-0 bg-black/80 backdrop-blur-3xl border-t border-white/[0.05] p-6 z-30">
                <div className="max-w-3xl mx-auto">
                    <div className="relative group">
                        <input
                            type="text"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && sendMessage()}
                            placeholder="Bir fantezi paylaş veya bir soru sor..."
                            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl px-6 py-5 text-base text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:bg-white/[0.06] transition-all group-hover:border-white/[0.12]"
                        />
                        <button
                            onClick={sendMessage}
                            disabled={!input.trim() || loading}
                            className="absolute right-3 top-2.5 bottom-2.5 px-6 bg-gradient-to-r from-red-600 to-rose-500 rounded-xl text-white font-bold text-sm shadow-xl shadow-red-600/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none flex items-center gap-2"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> Gönder</>}
                        </button>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .noise {
                    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3%3Cfilter id='noiseFilter'%3%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3%3C/filter%3%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3%3C/svg%3");
                }
            `}</style>
        </div>
    );
}
