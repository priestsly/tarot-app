"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Send, Loader2, RotateCcw } from "lucide-react";

interface Message { role: "user" | "ai"; text: string; cards?: string[] }

const CARD_BACKS = ["🂠", "🂠", "🂠"];

export default function AiTarotPage() {
    const router = useRouter();
    const [question, setQuestion] = useState("");
    const [messages, setMessages] = useState<Message[]>([
        { role: "ai", text: "Hoş geldiniz. Bir soru sorun, sizin için 3 kart çekeyim ve yorumlayayım. ✨" }
    ]);
    const [loading, setLoading] = useState(false);
    const endRef = useRef<HTMLDivElement>(null);

    useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

    const sendQuestion = async () => {
        if (!question.trim() || loading) return;
        const q = question.trim();
        setQuestion("");
        setMessages(m => [...m, { role: "user", text: q }]);
        setLoading(true);

        try {
            const res = await fetch("/api/ai-tarot", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: q }) });
            const data = await res.json();
            setMessages(m => [...m, { role: "ai", text: data.interpretation, cards: data.cards }]);
        } catch {
            setMessages(m => [...m, { role: "ai", text: "Bağlantı hatası. Lütfen tekrar deneyin." }]);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-[#0a0812] text-white flex flex-col">
            <header className="sticky top-0 z-30 bg-[#0a0812]/80 backdrop-blur-xl border-b border-white/[0.04]">
                <div className="max-w-2xl mx-auto flex items-center justify-between px-4 sm:px-6 py-4">
                    <button onClick={() => router.push("/")} className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors text-sm"><ArrowLeft className="w-4 h-4" /> Geri</button>
                    <h1 className="text-sm font-semibold text-white/50">AI Tarot 🔮</h1>
                    <button onClick={() => setMessages([{ role: "ai", text: "Hoş geldiniz. Yeni bir soru sorabilirsiniz. ✨" }])} className="text-white/25 hover:text-white/50 transition-colors"><RotateCcw className="w-4 h-4" /></button>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 max-w-2xl mx-auto w-full">
                <div className="space-y-4">
                    {messages.map((msg, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[85%] rounded-2xl p-4 ${msg.role === "user" ? "bg-purple-500/15 border border-purple-500/20 rounded-br-md" : "bg-white/[0.03] border border-white/[0.06] rounded-bl-md"}`}>
                                {msg.cards && (
                                    <div className="flex gap-2 mb-3 justify-center">
                                        {msg.cards.map((card, j) => (
                                            <motion.div key={j} initial={{ rotateY: 180, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }} transition={{ delay: j * 0.3 }}
                                                className="bg-gradient-to-b from-purple-500/20 to-indigo-500/10 border border-purple-500/20 rounded-lg px-3 py-2 text-center">
                                                <span className="text-xs font-semibold text-purple-300/80">{card}</span>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                                <p className="text-sm text-white/60 leading-relaxed whitespace-pre-line">{msg.text}</p>
                            </div>
                        </motion.div>
                    ))}
                    {loading && (
                        <div className="flex justify-start">
                            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl rounded-bl-md p-4 flex items-center gap-3">
                                <div className="flex gap-1">{CARD_BACKS.map((_, i) => <motion.span key={i} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, delay: i * 0.2, repeat: Infinity }} className="text-lg">🂠</motion.span>)}</div>
                                <span className="text-xs text-white/30">Kartlar çekiliyor...</span>
                            </div>
                        </div>
                    )}
                    <div ref={endRef} />
                </div>
            </div>

            <div className="sticky bottom-0 bg-[#0a0812]/90 backdrop-blur-xl border-t border-white/[0.04] p-4">
                <div className="max-w-2xl mx-auto flex gap-2">
                    <input type="text" value={question} onChange={e => setQuestion(e.target.value)} onKeyDown={e => e.key === "Enter" && sendQuestion()}
                        placeholder="Sorunuzu yazın..." className="flex-1 bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white/70 placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-purple-500/30" />
                    <button onClick={sendQuestion} disabled={!question.trim() || loading}
                        className="px-4 bg-gradient-to-r from-purple-600/50 to-indigo-600/40 rounded-xl border border-purple-500/20 text-white/80 hover:brightness-110 active:scale-95 transition-all disabled:opacity-30">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                </div>
            </div>
        </div>
    );
}
