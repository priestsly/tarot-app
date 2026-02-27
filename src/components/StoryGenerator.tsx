"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { X, Download, Share2, Instagram } from "lucide-react";

interface StoryGeneratorProps {
    isOpen: boolean;
    onClose: () => void;
    cardName?: string;
    cardMeaning?: string;
    cardImage?: string;
    signName?: string;
}

const TEMPLATES = [
    { id: "dark", name: "Mistik", bg: "from-[#0a0812] via-[#1a1030] to-[#0a0812]", textColor: "text-white" },
    { id: "gold", name: "Altın", bg: "from-[#1a1510] via-[#2a2015] to-[#1a1510]", textColor: "text-amber-100" },
    { id: "cosmic", name: "Kozmik", bg: "from-[#0d0520] via-[#150840] to-[#0d0520]", textColor: "text-purple-100" },
];

export const StoryGenerator = ({ isOpen, onClose, cardName, cardMeaning, cardImage, signName }: StoryGeneratorProps) => {
    const canvasRef = useRef<HTMLDivElement>(null);
    const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0]);
    const [customText, setCustomText] = useState("");
    const [generating, setGenerating] = useState(false);

    if (!isOpen) return null;

    const handleDownload = async () => {
        if (!canvasRef.current) return;
        setGenerating(true);
        try {
            const html2canvas = (await import("html2canvas")).default;
            const canvas = await html2canvas(canvasRef.current, {
                backgroundColor: null,
                scale: 3,
                useCORS: true,
                allowTaint: true,
                logging: false,
                width: canvasRef.current.offsetWidth,
                height: canvasRef.current.offsetHeight,
            });

            const dataUrl = canvas.toDataURL("image/png", 1.0);
            const link = document.createElement("a");
            link.download = `mystic-tarot-story-${Date.now()}.png`;
            link.href = dataUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (e) {
            console.error("Story generation failed:", e);
            alert("Görsel oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.");
        }
        setGenerating(false);
    };

    const displayText = customText || cardMeaning || "Yıldızlar bugün size güzel haberler fısıldıyor...";
    const today = new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long" });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md bg-[#1a1825] border border-white/[0.08] rounded-2xl shadow-2xl my-auto relative flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/[0.06] shrink-0">
                    <div className="flex items-center gap-2">
                        <Instagram className="w-4 h-4 text-pink-400/60" />
                        <h3 className="text-sm font-semibold text-white/80">Story Oluştur</h3>
                    </div>
                    <button onClick={onClose} className="text-white/30 hover:text-white/60 transition-colors p-1"><X className="w-6 h-6" /></button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto w-full">
                    {/* Preview */}
                    <div className="p-4 flex justify-center">
                        <div ref={canvasRef}
                            className={`w-[240px] aspect-[9/16] bg-gradient-to-b ${selectedTemplate.bg} rounded-xl overflow-hidden relative flex flex-col items-center justify-center p-6 mx-auto`}>
                            {/* Decorative elements */}
                            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-purple-500/5 to-transparent" />
                            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-purple-500/5 to-transparent" />

                            {/* Stars decoration */}
                            <div className="absolute top-6 left-6 text-white/10 text-4xl">✦</div>
                            <div className="absolute top-12 right-10 text-white/8 text-2xl">✧</div>
                            <div className="absolute bottom-16 left-10 text-white/8 text-2xl">✧</div>
                            <div className="absolute bottom-8 right-6 text-white/10 text-3xl">✦</div>

                            {/* Content */}
                            <div className="relative z-10 text-center space-y-4 w-full">
                                {cardImage && (
                                    <div className="w-16 h-28 mx-auto rounded-lg overflow-hidden border border-white/10 shadow-xl">
                                        <img src={cardImage} alt={cardName} className="w-full h-full object-cover" crossOrigin="anonymous" />
                                    </div>
                                )}

                                {cardName && (
                                    <h2 className={`text-base font-heading font-bold tracking-widest uppercase ${selectedTemplate.textColor}`}>
                                        {cardName}
                                    </h2>
                                )}

                                {signName && (
                                    <p className="text-[10px] text-white/40 uppercase tracking-[0.2em]">{signName}</p>
                                )}

                                <p className={`text-[10px] sm:text-xs ${selectedTemplate.textColor}/60 leading-relaxed max-w-[180px] mx-auto italic`}>
                                    &ldquo;{displayText}&rdquo;
                                </p>

                                <p className="text-[8px] text-white/20 uppercase tracking-[0.2em] mt-6">{today}</p>
                            </div>

                            {/* Branding */}
                            <div className="absolute bottom-4 left-0 right-0 text-center">
                                <p className="text-[6px] sm:text-[7px] text-white/15 uppercase tracking-[0.3em]">Mystic Tarot ✦</p>
                            </div>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="p-4 space-y-4 border-t border-white/[0.06] bg-[#1a1825]">
                        {/* Template picker */}
                        <div className="flex gap-2">
                            {TEMPLATES.map(t => (
                                <button key={t.id} onClick={() => setSelectedTemplate(t)}
                                    className={`flex-1 py-2.5 rounded-lg text-[10px] sm:text-xs font-semibold transition-all ${selectedTemplate.id === t.id ? "bg-purple-500/20 text-purple-300 border border-purple-500/25" : "bg-white/[0.03] text-white/30 border border-white/[0.06] hover:bg-white/[0.05]"}`}>
                                    {t.name}
                                </button>
                            ))}
                        </div>

                        {/* Custom text */}
                        <input type="text" value={customText} onChange={e => setCustomText(e.target.value)}
                            placeholder="Özel mesaj yazın..."
                            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-xs sm:text-sm text-white/70 placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-purple-500/30" />

                        {/* Actions */}
                        <div className="flex gap-2 pb-2">
                            <button onClick={handleDownload} disabled={generating}
                                className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-purple-600/50 to-pink-600/40 text-white/90 rounded-xl text-xs sm:text-sm font-semibold border border-purple-500/20 hover:brightness-110 active:scale-[0.98] transition-all">
                                <Download className="w-5 h-5" /> {generating ? "Oluşturuluyor..." : "İndir"}
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
