"use client";

import { motion } from "framer-motion";
import { useRef } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export interface CardState {
    id: string; // unique instance ID
    cardIndex: number; // 0-77 representing the Tarot card
    x: number;
    y: number;
    isFlipped: boolean;
    isReversed: boolean;
    zIndex: number;
}

interface TarotCardProps {
    card: CardState;
    onDragEnd: (id: string, x: number, y: number) => void;
    onFlipEnd: (id: string, isReversed: boolean, isFlipped: boolean) => void;
    onPointerDown: (id: string) => void;
    isLocal: boolean;
    constraintsRef?: React.RefObject<HTMLDivElement | null>;
}

// Map index to a tarot name or just use a generic card back/front for now
// In a real app we'd map these to actual images. For now we use beautiful CSS fronts.
const getCardName = (index: number) => {
    const majorArcana = [
        "The Fool", "The Magician", "The High Priestess", "The Empress", "The Emperor",
        "The Hierophant", "The Lovers", "The Chariot", "Strength", "The Hermit",
        "Wheel of Fortune", "Justice", "The Hanged Man", "Death", "Temperance",
        "The Devil", "The Tower", "The Star", "The Moon", "The Sun",
        "Judgement", "The World"
    ];
    if (index < majorArcana.length) return majorArcana[index];
    return `Minor Arcana ${index}`;
};

export default function TarotCard({ card, onDragEnd, onFlipEnd, onPointerDown, isLocal, constraintsRef }: TarotCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);

    return (
        <motion.div
            ref={cardRef}
            drag
            dragMomentum={false} // Disable momentum to completely stop "swimming"
            dragElastic={0}   // Strict bounds against the table edge
            dragConstraints={constraintsRef}
            onPointerDown={() => onPointerDown(card.id)}
            onDragEnd={(e, info) => {
                if (!constraintsRef?.current) return;

                const rect = constraintsRef.current.getBoundingClientRect();

                // Calculate exactly how many percentages the mouse horizontally and vertically moved.
                const deltaPercentX = (info.offset.x / rect.width) * 100;
                const deltaPercentY = (info.offset.y / rect.height) * 100;

                // Add to the original card's % position! Guaranteed no desyncs from the DOM.
                let newPercentX = card.x + deltaPercentX;
                let newPercentY = card.y + deltaPercentY;

                // Keep safely inside the table boundaries (5% to 95%)
                newPercentX = Math.max(5, Math.min(95, newPercentX));
                newPercentY = Math.max(5, Math.min(95, newPercentY));

                onDragEnd(card.id, newPercentX, newPercentY);
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{
                scale: 1,
                opacity: 1,
                zIndex: card.zIndex,
                rotateY: card.isFlipped ? 180 : 0,
                rotateZ: card.isFlipped && card.isReversed ? 180 : 0,
                // Instantly zero out Framer Motion's internal drag offset because our CSS left/top updates simultaneously!
                x: 0,
                y: 0
            }}
            style={{
                position: 'absolute',
                left: `calc(${card.x}% - 72px)`,
                top: `calc(${card.y}% - 112px)`,
                transformStyle: "preserve-3d",
                willChange: "transform, box-shadow, left, top"
            }}
            onDoubleClick={() => {
                const newReversed = card.isFlipped ? card.isReversed : Math.random() > 0.5;
                onFlipEnd(card.id, newReversed, !card.isFlipped);
            }}
            whileHover={{ scale: 1.05, boxShadow: "0 0 35px rgba(226, 232, 240, 0.3)" }}
            whileTap={{ scale: 0.95 }}
            transition={{
                type: "spring",
                stiffness: 260,
                damping: 20,
                x: { duration: 0 }, // Prevent visual glitch/floating when x and y snap back to 0
                y: { duration: 0 },
                rotateY: { duration: 0.8, ease: "easeInOut" },
                rotateZ: { duration: 0.6, ease: "easeOut" }
            }}
            className="w-36 h-56 cursor-grab active:cursor-grabbing rounded-xl"
        >
            {/* Front of card (shown when flipped) */}
            <div
                className={cn(
                    "absolute inset-0 rounded-xl bg-gradient-to-br from-[#1E1B2E] to-[#0d0914] flex flex-col items-center justify-center p-3 shadow-2xl backface-hidden border border-slate-400/30",
                    "before:absolute before:inset-0 before:rounded-xl before:bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] before:opacity-30 before:pointer-events-none before:mix-blend-overlay"
                )}
                style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
            >
                <div className="absolute inset-1 rounded-lg border border-slate-300/20 flex flex-col items-center justify-center bg-black/60 shadow-inner p-2 z-10 overflow-hidden backdrop-blur-sm">
                    <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-slate-200/10 to-transparent pointer-events-none" />

                    <span className="text-center font-cinzel text-slate-100 font-bold leading-tight text-lg drop-shadow-[0_0_12px_rgba(226,232,240,0.8)] px-1">
                        {getCardName(card.cardIndex)}
                    </span>

                    <div className={cn(
                        "absolute bottom-4 text-[8px] font-inter tracking-[0.2em] uppercase font-bold px-3 py-1 rounded-full border",
                        card.isReversed
                            ? "text-[#c084fc] border-[#c084fc]/50 bg-[#c084fc]/10 shadow-[0_0_12px_rgba(192,132,252,0.4)]"
                            : "text-[#60a5fa] border-[#60a5fa]/50 bg-[#60a5fa]/10 shadow-[0_0_12px_rgba(96,165,250,0.4)]"
                    )}>
                        {card.isReversed ? "Reversed" : "Upright"}
                    </div>
                </div>
            </div>

            {/* Back of Card (shown initially) */}
            <div
                className="absolute inset-0 rounded-xl bg-gradient-to-b from-[#1c182a] to-[#0a0710] shadow-[0_15px_40px_rgba(0,0,0,0.9)] flex items-center justify-center p-1.5 border border-slate-400/40 backface-hidden overflow-hidden"
                style={{ backfaceVisibility: "hidden" }}
            >
                {/* Silver texture overlay */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay pointer-events-none" />

                <div className="w-full h-full border border-slate-500/30 rounded-lg flex items-center justify-center relative bg-[#0B0813] overflow-hidden">
                    {/* Glowing center orb */}
                    <div className="w-24 h-24 bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 rounded-full blur-xl absolute animate-pulse-slow pointer-events-none" />

                    {/* Minimalist Constellation/Moon Design */}
                    <svg viewBox="0 0 100 100" className="w-[85%] h-[85%] text-slate-300 opacity-90 relative z-10 drop-shadow-[0_0_8px_rgba(226,232,240,0.5)]">
                        {/* Outer delicate ring */}
                        <circle fill="none" stroke="currentColor" strokeWidth="0.5" cx="50" cy="50" r="46" />
                        <circle fill="none" stroke="currentColor" strokeWidth="0.5" cx="50" cy="50" r="42" strokeDasharray="2 4" opacity="0.5" />

                        {/* Crescent Moon */}
                        <path fill="currentColor" opacity="0.9" d="M60 25 A 25 25 0 1 0 75 70 A 30 30 0 1 1 60 25 Z" />

                        {/* Constellation lines and stars */}
                        <path fill="none" stroke="currentColor" strokeWidth="0.5" d="M25 40 L40 30 L50 45 L35 65 L25 40" opacity="0.6" />
                        <circle fill="currentColor" cx="25" cy="40" r="1.5" />
                        <circle fill="currentColor" cx="40" cy="30" r="1" />
                        <circle fill="currentColor" cx="50" cy="45" r="2" />
                        <circle fill="currentColor" cx="35" cy="65" r="1.5" />

                        {/* Sparkles */}
                        <path fill="currentColor" d="M70 30 L72 35 L77 37 L72 39 L70 44 L68 39 L63 37 L68 35 Z" opacity="0.8" transform="scale(0.5) translate(70, 0)" />
                        <path fill="currentColor" d="M30 70 L32 75 L37 77 L32 79 L30 84 L28 79 L23 77 L28 75 Z" opacity="0.6" transform="scale(0.4) translate(30, 80)" />
                    </svg>

                    <div className="absolute inset-1.5 border border-slate-400/10 rounded-md pointer-events-none" />
                </div>
            </div>
        </motion.div>
    );
}
