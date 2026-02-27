"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { X, Download, Instagram } from "lucide-react";

interface StoryGeneratorProps {
    isOpen: boolean;
    onClose: () => void;
    cardName?: string;
    cardMeaning?: string;
    cardImage?: string;
    signName?: string;
}

const TEMPLATES = [
    { id: "dark", name: "Mistik", bg: "#0a0812", accent: "#1a1030", textColor: "#ffffff" },
    { id: "gold", name: "Altın", bg: "#1a1510", accent: "#2a2015", textColor: "#ffe4b5" },
    { id: "cosmic", name: "Kozmik", bg: "#0d0520", accent: "#150840", textColor: "#e8d5ff" },
];

export const StoryGenerator = ({ isOpen, onClose, cardName, cardMeaning, cardImage, signName }: StoryGeneratorProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0]);
    const [customText, setCustomText] = useState("");
    const [generating, setGenerating] = useState(false);

    if (!isOpen) return null;

    const displayText = customText || cardMeaning || "Yıldızlar bugün size güzel haberler fısıldıyor...";
    const today = new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long" });

    const handleDownload = async () => {
        setGenerating(true);
        try {
            const canvas = document.createElement("canvas");
            const W = 1080;
            const H = 1920;
            canvas.width = W;
            canvas.height = H;
            const ctx = canvas.getContext("2d")!;

            // Background gradient
            const grad = ctx.createLinearGradient(0, 0, 0, H);
            grad.addColorStop(0, selectedTemplate.bg);
            grad.addColorStop(0.5, selectedTemplate.accent);
            grad.addColorStop(1, selectedTemplate.bg);
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, W, H);

            // Decorative stars
            ctx.fillStyle = "rgba(255,255,255,0.06)";
            ctx.font = "120px serif";
            ctx.fillText("✦", 100, 200);
            ctx.font = "80px serif";
            ctx.fillText("✧", 850, 350);
            ctx.fillText("✧", 150, 1500);
            ctx.font = "100px serif";
            ctx.fillText("✦", 800, 1650);

            // Card image
            let imgY = 500;
            if (cardImage) {
                try {
                    const img = new Image();
                    img.crossOrigin = "anonymous";
                    await new Promise<void>((resolve, reject) => {
                        img.onload = () => resolve();
                        img.onerror = () => reject();
                        img.src = cardImage;
                    });
                    const cardW = 280;
                    const cardH = 440;
                    const cardX = (W - cardW) / 2;
                    const cardY = 450;

                    // Card shadow
                    ctx.shadowColor = "rgba(0,0,0,0.5)";
                    ctx.shadowBlur = 40;
                    ctx.shadowOffsetY = 10;

                    // Rounded rect clip for card
                    roundRect(ctx, cardX, cardY, cardW, cardH, 20);
                    ctx.clip();
                    ctx.drawImage(img, cardX, cardY, cardW, cardH);
                    ctx.restore();
                    ctx.save();

                    // Reset shadow
                    ctx.shadowColor = "transparent";
                    ctx.shadowBlur = 0;
                    ctx.shadowOffsetY = 0;

                    // Card border
                    ctx.strokeStyle = "rgba(255,255,255,0.15)";
                    ctx.lineWidth = 2;
                    roundRect(ctx, cardX, cardY, cardW, cardH, 20);
                    ctx.stroke();

                    imgY = cardY + cardH + 60;
                } catch {
                    imgY = 600;
                }
            }

            // Card name
            if (cardName) {
                ctx.fillStyle = selectedTemplate.textColor;
                ctx.font = "bold 52px serif";
                ctx.textAlign = "center";
                ctx.fillText(cardName, W / 2, imgY);
                imgY += 50;
            }

            // Sign name
            if (signName) {
                ctx.fillStyle = "rgba(255,255,255,0.35)";
                ctx.font = "24px sans-serif";
                ctx.letterSpacing = "8px";
                ctx.fillText(signName.toUpperCase(), W / 2, imgY);
                imgY += 50;
            }

            // Display text
            ctx.fillStyle = selectedTemplate.textColor + "99";
            ctx.font = "italic 30px sans-serif";
            ctx.textAlign = "center";
            const lines = wrapText(ctx, `"${displayText}"`, W - 200);
            imgY += 30;
            for (const line of lines) {
                ctx.fillText(line, W / 2, imgY);
                imgY += 42;
            }

            // Date
            ctx.fillStyle = "rgba(255,255,255,0.15)";
            ctx.font = "20px sans-serif";
            ctx.fillText(today, W / 2, imgY + 80);

            // Branding
            ctx.fillStyle = "rgba(255,255,255,0.1)";
            ctx.font = "18px sans-serif";
            ctx.fillText("MYSTIC TAROT ✦", W / 2, H - 80);

            // Download
            const dataUrl = canvas.toDataURL("image/png", 1.0);
            const link = document.createElement("a");
            link.download = `mystic-tarot-story-${Date.now()}.png`;
            link.href = dataUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (e) {
            console.error("Story generation failed:", e);
            alert("Görsel oluşturulurken bir hata oluştu.");
        }
        setGenerating(false);
    };

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
                        <div
                            className="w-[220px] aspect-[9/16] rounded-xl overflow-hidden relative flex flex-col items-center justify-center p-5 mx-auto border border-white/10"
                            style={{ background: `linear-gradient(to bottom, ${selectedTemplate.bg}, ${selectedTemplate.accent}, ${selectedTemplate.bg})` }}
                        >
                            {/* Stars decoration */}
                            <div className="absolute top-5 left-5 text-white/10 text-3xl">✦</div>
                            <div className="absolute top-10 right-8 text-white/8 text-xl">✧</div>
                            <div className="absolute bottom-14 left-8 text-white/8 text-xl">✧</div>
                            <div className="absolute bottom-7 right-5 text-white/10 text-2xl">✦</div>

                            {/* Content */}
                            <div className="relative z-10 text-center space-y-3 w-full">
                                {cardImage && (
                                    <div className="w-14 h-24 mx-auto rounded-lg overflow-hidden border border-white/10 shadow-xl">
                                        <img src={cardImage} alt={cardName} className="w-full h-full object-cover" />
                                    </div>
                                )}
                                {cardName && (
                                    <h2 className="text-sm font-heading font-bold tracking-wider uppercase" style={{ color: selectedTemplate.textColor }}>
                                        {cardName}
                                    </h2>
                                )}
                                {signName && (
                                    <p className="text-[9px] text-white/35 uppercase tracking-[0.15em]">{signName}</p>
                                )}
                                <p className="text-[9px] italic leading-relaxed max-w-[160px] mx-auto" style={{ color: selectedTemplate.textColor + "99" }}>
                                    &ldquo;{displayText}&rdquo;
                                </p>
                                <p className="text-[7px] text-white/20 uppercase tracking-[0.15em] mt-4">{today}</p>
                            </div>

                            {/* Branding */}
                            <div className="absolute bottom-3 left-0 right-0 text-center">
                                <p className="text-[6px] text-white/15 uppercase tracking-[0.2em]">Mystic Tarot ✦</p>
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
                                className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-purple-600/50 to-pink-600/40 text-white/90 rounded-xl text-xs sm:text-sm font-semibold border border-purple-500/20 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-40">
                                <Download className="w-5 h-5" /> {generating ? "Oluşturuluyor..." : "İndir"}
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

// Helper: draw rounded rectangle path
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

// Helper: wrap text into lines
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const words = text.split(" ");
    const lines: string[] = [];
    let currentLine = "";
    for (const word of words) {
        const testLine = currentLine ? currentLine + " " + word : word;
        if (ctx.measureText(testLine).width > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
        } else {
            currentLine = testLine;
        }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
}
