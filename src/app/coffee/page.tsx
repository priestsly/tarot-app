"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Coffee, Upload, Loader2, Camera } from "lucide-react";

export default function CoffeePage() {
    const router = useRouter();
    const [image, setImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ reading: string; symbols: string[]; future: string; love: string; career: string } | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => setImage(ev.target?.result as string);
        reader.readAsDataURL(file);
    };

    const analyze = async () => {
        if (!image) return;
        setLoading(true);
        try {
            const res = await fetch("/api/coffee", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image }) });
            const data = await res.json();
            setResult(data);
        } catch {
            setResult({
                reading: "Fincanınızda yolculuk ve değişim sembolleri görülüyor. Yakın zamanda hayatınızda önemli bir dönüm noktası olabilir.",
                symbols: ["Yol", "Kuş", "Kalp"],
                future: "Önünüzde yeni kapılar açılıyor. Cesur adımlar atmanın zamanı.",
                love: "Duygusal bağlarınız güçleniyor. Samimiyete alan açın.",
                career: "İş hayatında beklenmedik bir fırsat kapınızı çalabilir.",
            });
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-[#0a0812] text-white relative overflow-hidden">
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] h-[70vh] bg-amber-900/5 rounded-full blur-[250px]" />
            </div>

            <header className="sticky top-0 z-30 bg-[#0a0812]/80 backdrop-blur-xl border-b border-white/[0.04]">
                <div className="max-w-2xl mx-auto flex items-center justify-between px-4 sm:px-6 py-4">
                    <button onClick={() => router.push("/")} className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors text-sm"><ArrowLeft className="w-4 h-4" /> Geri</button>
                    <Coffee className="w-4 h-4 text-amber-400/30" />
                </div>
            </header>

            <main className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 py-8 pb-20">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-heading font-semibold text-white/90 mb-2">Kahve Falı</h1>
                    <p className="text-sm text-white/35">Fincan fotoğrafınızı yükleyin, AI yorumlasın.</p>
                </div>

                {!result ? (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                        {/* Upload */}
                        <div
                            onClick={() => fileRef.current?.click()}
                            className="relative cursor-pointer bg-white/[0.02] border-2 border-dashed border-white/[0.1] rounded-2xl p-8 text-center hover:border-amber-500/20 hover:bg-white/[0.03] transition-all"
                        >
                            {image ? (
                                <img src={image} alt="Fincan" className="max-h-64 mx-auto rounded-xl object-contain" />
                            ) : (
                                <div className="space-y-3">
                                    <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/10 flex items-center justify-center">
                                        <Camera className="w-7 h-7 text-amber-400/40" />
                                    </div>
                                    <p className="text-sm text-white/40">Fincan fotoğrafını yükle</p>
                                    <p className="text-[10px] text-white/20">veya kamerayı kullan</p>
                                </div>
                            )}
                            <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleImage} className="hidden" />
                        </div>

                        {image && (
                            <div className="flex gap-3">
                                <button onClick={() => setImage(null)} className="flex-1 py-3 text-xs text-white/30 border border-white/[0.08] rounded-xl hover:bg-white/[0.03] transition-all">Değiştir</button>
                                <button onClick={analyze} disabled={loading}
                                    className="flex-[2] flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-amber-600/50 to-orange-600/40 text-white/90 rounded-xl font-semibold text-sm border border-amber-500/20 hover:brightness-110 active:scale-[0.98] transition-all">
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Coffee className="w-4 h-4" />} Falıma Bak
                                </button>
                            </div>
                        )}

                        {/* Tips */}
                        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
                            <h3 className="text-[10px] text-white/25 uppercase tracking-wider mb-3">İpuçları</h3>
                            <ul className="space-y-2 text-xs text-white/35">
                                <li>☕ Kahvenizi içtikten sonra fincanı ters çevirin ve 5 dk bekleyin.</li>
                                <li>📸 Fincanın iç kısmını net bir şekilde fotoğraflayın.</li>
                                <li>💡 İyi aydınlatma daha iyi sonuç verir.</li>
                                <li>🔄 Birden fazla açıdan çekmek yorumu zenginleştirir.</li>
                            </ul>
                        </div>
                    </motion.div>
                ) : (
                    <AnimatePresence>
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                            {/* Image preview */}
                            {image && <img src={image} alt="Fincan" className="max-h-48 mx-auto rounded-xl object-contain mb-4 opacity-60" />}

                            {/* Main reading */}
                            <div className="bg-amber-500/[0.03] border border-amber-500/10 rounded-2xl p-5">
                                <h3 className="text-[10px] text-amber-400/40 uppercase tracking-wider mb-3">Genel Okuma</h3>
                                <p className="text-sm text-white/60 leading-relaxed">{result.reading}</p>
                            </div>

                            {/* Symbols */}
                            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
                                <h3 className="text-[10px] text-white/25 uppercase tracking-wider mb-3">Görülen Semboller</h3>
                                <div className="flex flex-wrap gap-2">
                                    {result.symbols.map((s, i) => <span key={i} className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/15 rounded-full text-xs text-amber-300/60">{s}</span>)}
                                </div>
                            </div>

                            {/* Categories */}
                            {[
                                { label: "Gelecek", text: result.future, color: "purple" },
                                { label: "Aşk", text: result.love, color: "pink" },
                                { label: "Kariyer", text: result.career, color: "blue" },
                            ].map(item => (
                                <div key={item.label} className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
                                    <h3 className="text-[10px] text-white/25 uppercase tracking-wider mb-2">{item.label}</h3>
                                    <p className="text-sm text-white/50">{item.text}</p>
                                </div>
                            ))}

                            <button onClick={() => { setResult(null); setImage(null); }} className="w-full mt-4 text-xs text-white/25 hover:text-white/40 transition-colors text-center py-3">Yeni Fal Baktır</button>
                        </motion.div>
                    </AnimatePresence>
                )}
            </main>
        </div>
    );
}
