import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Trophy, Star } from 'lucide-react';
import { cn } from '@/app/page';

const WHEEL_PRIZES = [
    { label: "Şans Sende", icon: "⭐", desc: "Bugün tüm şans kapıları sana açık" },
    { label: "Sakin Ol", icon: "🌊", desc: "Derin bir nefes al ve akışa bırak" },
    { label: "Sürpriz", icon: "🎁", desc: "Günün ilerleyen saatlerinde küçük bir sürpriz var" },
    { label: "Aşk", icon: "💖", desc: "Kalbindeki sorulara cevap bulacaksın" },
    { label: "Odaklan", icon: "🎯", desc: "Aklındaki o işe odaklan, başaracaksın" },
    { label: "Bereket", icon: "💰", desc: "Beklediğin o haber nihayet geliyor" },
];

export const MagicWheel = () => {
    const [isSpinning, setIsSpinning] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [result, setResult] = useState<typeof WHEEL_PRIZES[0] | null>(null);

    const spinWheel = () => {
        if (isSpinning) return;

        setIsSpinning(true);
        setResult(null);

        // At least 5 full rotations (1800 deg) + random angle
        const randomPrizeIndex = Math.floor(Math.random() * WHEEL_PRIZES.length);
        const sliceAngle = 360 / WHEEL_PRIZES.length;

        // Target angle to land on the specific prize
        // We subtract from 360 because CSS rotation pushes things clockwise, 
        // pointer is fixed at the top (0 deg).
        const targetAngle = 360 - (randomPrizeIndex * sliceAngle);

        // Add random slight offset so it doesn't land perfectly in the center every time
        const offset = (Math.random() - 0.5) * (sliceAngle * 0.8);

        const totalRotation = rotation + 1800 + targetAngle + offset - (rotation % 360);

        setRotation(totalRotation);

        setTimeout(() => {
            setIsSpinning(false);
            setResult(WHEEL_PRIZES[randomPrizeIndex]);
        }, 4000);
    };

    const sliceAngle = 360 / WHEEL_PRIZES.length;

    return (
        <div className="w-full flex flex-col items-center bg-surface border border-border rounded-3xl p-6 sm:p-8 relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-[radial-gradient(circle_at_center,rgba(167,139,250,0.05)_0%,transparent_70%)] pointer-events-none" />

            <div className="text-center mb-10 relative z-10 w-full">
                <h3 className="text-xl font-heading font-bold text-text flex items-center justify-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-accent" />
                    Kader Çarkı
                    <Sparkles className="w-5 h-5 text-accent" />
                </h3>
                <p className="text-sm text-text-muted max-w-[200px] mx-auto leading-relaxed">Günün enerjisini çek, şansını dene.</p>
            </div>

            {/* WHEEL CONTAINER */}
            <div className="relative w-56 h-56 sm:w-64 sm:h-64 mb-8">
                {/* Pointer Arrow */}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-30 drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]">
                    <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-gold relative z-10" />
                    <div className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[24px] border-t-gold/30 absolute -top-[2px] -left-[14px] z-0" />
                </div>

                {/* THE WHEEL BASE */}
                <div className="w-full h-full rounded-full border-[6px] border-surface shadow-[0_0_30px_rgba(167,139,250,0.15)] relative overflow-hidden bg-surface">
                    <div
                        className="w-full h-full rounded-full relative"
                        style={{
                            transform: `rotate(${rotation}deg)`,
                            transition: "transform 4s cubic-bezier(0.15, 0.85, 0.35, 1)",
                            background: `conic-gradient(from -${sliceAngle / 2}deg, ${WHEEL_PRIZES.map((_, i) => `${i % 2 === 0 ? 'rgba(167,139,250,0.05)' : 'rgba(167,139,250,0.15)'} ${i * sliceAngle}deg ${(i + 1) * sliceAngle}deg`).join(', ')
                                })`
                        }}
                    >
                        {/* PRIZE ICONS */}
                        {WHEEL_PRIZES.map((prize, i) => {
                            const rotationAngle = (i * sliceAngle);
                            return (
                                <div
                                    key={i}
                                    className="absolute inset-0 flex items-center justify-center flex-col pb-[50%]"
                                    style={{
                                        transform: `rotate(${rotationAngle}deg)`,
                                    }}
                                >
                                    <div className="text-2xl drop-shadow-md z-10 mt-4 origin-bottom -rotate-180">
                                        <div style={{ transform: "rotate(180deg)" }}>{prize.icon}</div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Spin Button */}
                <button
                    onClick={spinWheel}
                    disabled={isSpinning || !!result}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-gold to-amber-600 rounded-full z-30 flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-all outline-none focus:outline-none focus:ring-4 focus:ring-gold/30 disabled:opacity-50 disabled:pointer-events-none group"
                >
                    {/* Inner styling + shadow */}
                    <div className="absolute inset-1 rounded-full border-2 border-white/20 bg-gradient-to-br from-amber-400/20 to-transparent pointer-events-none" />
                    <span className="text-white/95 font-bold tracking-wider text-xs sm:text-sm drop-shadow-md group-hover:drop-shadow-lg transition-all">ÇEVİR</span>

                    {/* Ring decoration */}
                    <div className="absolute -inset-1.5 rounded-full border border-gold/40 z-0 pointer-events-none" />
                </button>
            </div>

            {/* RESULT */}
            <div className="h-20 flex items-center justify-center w-full">
                <AnimatePresence mode="wait">
                    {result && (
                        <motion.div
                            initial={{ opacity: 0, y: 15, scale: 0.9, filter: "blur(4px)" }}
                            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                            className="text-center w-full bg-accent-dim border border-accent/20 rounded-xl p-4 shadow-lg shadow-accent/5 backdrop-blur-sm"
                        >
                            <div className="flex items-center justify-center gap-2 text-gold font-bold mb-1 tracking-wide">
                                <Trophy className="w-4 h-4" />
                                {result.label}
                            </div>
                            <p className="text-sm text-text/80">{result.desc}</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
