"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, Flame, X } from "lucide-react";

interface AltarItem { id: string; type: string; emoji: string; x: number; y: number }

const ITEMS = [
    { type: "candle", emoji: "🕯️", name: "Mum" },
    { type: "crystal", emoji: "💎", name: "Kristal" },
    { type: "flower", emoji: "🌸", name: "Çiçek" },
    { type: "incense", emoji: "🪔", name: "Tütsü" },
    { type: "moon", emoji: "🌙", name: "Ay" },
    { type: "star", emoji: "⭐", name: "Yıldız" },
    { type: "herb", emoji: "🌿", name: "Bitki" },
    { type: "eye", emoji: "🧿", name: "Nazar" },
    { type: "heart", emoji: "❤️", name: "Kalp" },
    { type: "bell", emoji: "🔔", name: "Çan" },
    { type: "feather", emoji: "🪶", name: "Tüy" },
    { type: "shell", emoji: "🐚", name: "Deniz Kabuğu" },
];

export default function AltarPage() {
    const router = useRouter();
    const [items, setItems] = useState<AltarItem[]>([]);
    const [intention, setIntention] = useState("");
    const [showPicker, setShowPicker] = useState(false);
    const [savedIntention, setSavedIntention] = useState("");
    const altarRef = useRef<HTMLDivElement>(null);

    // Load from localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem("altar-items");
            const savedInt = localStorage.getItem("altar-intention");
            if (saved) setItems(JSON.parse(saved));
            if (savedInt) setSavedIntention(savedInt);
        } catch { }
    }, []);

    // Save to localStorage
    useEffect(() => {
        try {
            localStorage.setItem("altar-items", JSON.stringify(items));
        } catch { }
    }, [items]);

    const addItem = (type: string, emoji: string) => {
        setItems(prev => [...prev, { id: Date.now().toString(), type, emoji, x: 30 + Math.random() * 40, y: 30 + Math.random() * 40 }]);
        setShowPicker(false);
    };

    const removeItem = (id: string) => setItems(prev => prev.filter(i => i.id !== id));

    const saveIntention = () => {
        if (!intention.trim()) return;
        setSavedIntention(intention);
        localStorage.setItem("altar-intention", intention);
        setIntention("");
    };

    return (
        <div className="min-h-screen bg-[#0a0812] text-white relative overflow-hidden">
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute bottom-0 left-0 right-0 h-[50vh] bg-gradient-to-t from-amber-900/5 to-transparent" />
            </div>

            <header className="sticky top-0 z-30 bg-[#0a0812]/80 backdrop-blur-xl border-b border-white/[0.04]">
                <div className="max-w-2xl mx-auto flex items-center justify-between px-4 sm:px-6 py-4">
                    <button onClick={() => router.push("/")} className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors text-sm"><ArrowLeft className="w-4 h-4" /> Geri</button>
                    <h1 className="text-sm font-semibold text-white/50">Dijital Sunak</h1>
                    <button onClick={() => setShowPicker(!showPicker)} className="p-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] transition-all"><Plus className="w-4 h-4 text-white/40" /></button>
                </div>
            </header>

            <main className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 py-6 pb-20">
                {/* Intention */}
                {savedIntention ? (
                    <div className="bg-amber-500/[0.04] border border-amber-500/15 rounded-2xl p-4 text-center mb-6">
                        <p className="text-[10px] text-amber-400/40 uppercase tracking-wider mb-1">Niyetiniz</p>
                        <p className="text-sm text-amber-200/60 italic">&ldquo;{savedIntention}&rdquo;</p>
                        <button onClick={() => { setSavedIntention(""); localStorage.removeItem("altar-intention"); }} className="text-[10px] text-white/15 hover:text-white/30 mt-2">Temizle</button>
                    </div>
                ) : (
                    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 mb-6 flex gap-2">
                        <input type="text" value={intention} onChange={e => setIntention(e.target.value)} onKeyDown={e => e.key === "Enter" && saveIntention()}
                            placeholder="Niyetinizi yazın..." className="flex-1 bg-transparent text-sm text-white/60 placeholder:text-white/20 focus:outline-none" />
                        <button onClick={saveIntention} disabled={!intention.trim()} className="text-xs text-amber-400/50 hover:text-amber-400/80 disabled:opacity-20">Kaydet</button>
                    </div>
                )}

                {/* Item picker */}
                {showPicker && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4 mb-6">
                        <div className="grid grid-cols-6 gap-2">
                            {ITEMS.map(item => (
                                <button key={item.type} onClick={() => addItem(item.type, item.emoji)}
                                    className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-white/[0.05] transition-all">
                                    <span className="text-2xl">{item.emoji}</span>
                                    <span className="text-[8px] text-white/25">{item.name}</span>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Altar surface */}
                <div ref={altarRef} className="relative w-full aspect-square bg-gradient-to-b from-[#1a1520] to-[#120e18] border border-white/[0.06] rounded-2xl overflow-hidden">
                    {/* Cloth texture */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_80%,rgba(139,92,246,0.03),transparent_60%)]" />
                    <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-amber-900/5 to-transparent" />

                    {/* Items */}
                    {items.map(item => (
                        <motion.div key={item.id} drag dragConstraints={altarRef} className="absolute cursor-grab active:cursor-grabbing group"
                            style={{ left: `${item.x}%`, top: `${item.y}%`, transform: "translate(-50%, -50%)" }}>
                            <span className="text-3xl sm:text-4xl select-none filter drop-shadow-lg">{item.emoji}</span>
                            <button onClick={() => removeItem(item.id)} className="absolute -top-1 -right-1 w-4 h-4 bg-red-500/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <X className="w-2.5 h-2.5 text-white" />
                            </button>
                        </motion.div>
                    ))}

                    {items.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <p className="text-xs text-white/15 text-center">+ butonuna basarak<br />sunağınızı doldurun</p>
                        </div>
                    )}
                </div>

                <p className="text-center text-[9px] text-white/10 mt-6 uppercase tracking-[0.2em]">Öğeleri sürükleyerek yerleştirin</p>
            </main>
        </div>
    );
}
