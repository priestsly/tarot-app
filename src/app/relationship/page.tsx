"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Send, Loader2, Heart } from "lucide-react";

interface Message { role: "user" | "ai"; text: string }

export default function RelationshipPage() {
    const router = useRouter();
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<Message[]>([
        { role: "ai", text: "Merhaba, ben ilişki koçunuzum. İlişkinizle ilgili durumunuzu anlatın, size yol göstereyim. 💕\n\nÖrnek sorular:\n• Partnerimle sürekli tartışıyoruz, ne yapmalıyım?\n• Yeni biriyle tanıştım ama ilerleme korkusu var.\n• Uzun süredir bekarım, neden birini bulamıyorum?" }
    ]);
    const [loading, setLoading] = useState(false);
    const endRef = useRef<HTMLDivElement>(null);

    useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

    const ask = async () => {
        if (!input.trim() || loading) return;
        const q = input.trim();
        setInput("");
        setMessages(m => [...m, { role: "user", text: q }]);
        setLoading(true);

        try {
            const res = await fetch("/api/relationship", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: q, history: messages.slice(-6) }) });
            const data = await res.json();
            const aiText = data.response || data.error || "Bir hata oluştu. Tekrar deneyin.";
            setMessages(m => [...m, { role: "ai", text: aiText }]);
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
                    <h1 className="text-sm font-semibold text-white/50 flex items-center gap-2"><Heart className="w-4 h-4 text-pink-400/50" /> İlişki Koçu</h1>
                    <div className="w-10" />
                </div>
            </header>

            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 max-w-2xl mx-auto w-full">
                <div className="space-y-4">
                    {messages.map((msg, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[85%] rounded-2xl p-4 ${msg.role === "user" ? "bg-pink-500/15 border border-pink-500/20 rounded-br-md" : "bg-white/[0.03] border border-white/[0.06] rounded-bl-md"}`}>
                                <p className="text-sm text-white/60 leading-relaxed whitespace-pre-line">{msg.text}</p>
                            </div>
                        </motion.div>
                    ))}
                    {loading && (
                        <div className="flex justify-start">
                            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl rounded-bl-md p-4">
                                <Loader2 className="w-4 h-4 text-pink-400/40 animate-spin" />
                            </div>
                        </div>
                    )}
                    <div ref={endRef} />
                </div>
            </div>

            <div className="sticky bottom-0 bg-[#0a0812]/90 backdrop-blur-xl border-t border-white/[0.04] p-4">
                <div className="max-w-2xl mx-auto flex gap-2">
                    <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && ask()}
                        placeholder="Durumunuzu anlatın..." className="flex-1 bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white/70 placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-pink-500/30" />
                    <button onClick={ask} disabled={!input.trim() || loading}
                        className="px-4 bg-gradient-to-r from-pink-600/50 to-rose-600/40 rounded-xl border border-pink-500/20 text-white/80 hover:brightness-110 active:scale-95 transition-all disabled:opacity-30">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                </div>
            </div>
        </div>
    );
}
