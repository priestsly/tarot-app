"use client";

import { motion } from "framer-motion";
import { useState } from "react";
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

export default function TarotCard({ card, onDragEnd, onFlipEnd, onPointerDown, isLocal }: TarotCardProps) {
    // We use Framer Motion's `drag` feature. The layout needs boundaries.

    const handleDoubleClick = () => {
        // Determine random reversed state only when flipping face up for the first time
        const newReversed = card.isFlipped ? card.isReversed : Math.random() > 0.5;
        onFlipEnd(card.id, newReversed, !card.isFlipped);
    };

    return (
        <motion.div
            drag
            dragMomentum={false}
            onPointerDown={() => onPointerDown(card.id)}
            onDragEnd={(e, info) => {
                onDragEnd(card.id, card.x + info.offset.x, card.y + info.offset.y);
            }}
            initial={{ x: card.x, y: card.y, scale: 0, opacity: 0 }}
            animate={{
                x: card.x,
                y: card.y,
                scale: 1,
                opacity: 1,
                zIndex: card.zIndex,
                rotateY: card.isFlipped ? 180 : 0,
                rotateZ: card.isFlipped && card.isReversed ? 180 : 0
            }}
            whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(252, 211, 77, 0.2)" }}
            whileTap={{ scale: 0.95 }}
            transition={{
                type: "spring",
                stiffness: 260,
                damping: 20,
                rotateY: { duration: 0.8, ease: "easeInOut" },
                rotateZ: { duration: 0.6, ease: "easeOut" }
            }}
            onDoubleClick={handleDoubleClick}
            className="absolute w-36 h-56 cursor-grab active:cursor-grabbing rounded-xl transition-all duration-300"
            style={{
                transformStyle: "preserve-3d"
            }}
        >
            {/* Front of card (shown when flipped) */}
            <div
                className={cn(
                    "absolute inset-0 rounded-xl bg-gradient-to-br from-void to-[#1a1a2e] flex flex-col items-center justify-center p-3 shadow-2xl backface-hidden border border-mystic/40",
                    "before:absolute before:inset-0 before:rounded-xl before:bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] before:opacity-30 before:pointer-events-none before:mix-blend-screen"
                )}
                style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
            >
                <div className="absolute inset-1 rounded-lg border border-mystic/40 flex flex-col items-center justify-center bg-black/60 shadow-inner p-2 z-10 overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-mystic/10 to-transparent pointer-events-none" />

                    <span className="text-center font-cinzel text-mystic font-bold leading-tight text-lg drop-shadow-[0_0_8px_rgba(252,211,77,0.8)] px-1">
                        {getCardName(card.cardIndex)}
                    </span>

                    <div className="absolute bottom-3 text-[9px] text-ethereal font-mono tracking-widest uppercase opacity-80 font-semibold shadow-black">
                        {card.isReversed ? "Reversed" : "Upright"}
                    </div>
                </div>
            </div>

            {/* Back of Card (shown initially) */}
            <div
                className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#0a0a16] to-[#120f26] shadow-[0_10px_30px_rgba(0,0,0,0.8)] flex items-center justify-center p-1.5 border border-mystic/50 backface-hidden overflow-hidden"
                style={{ backfaceVisibility: "hidden" }}
            >
                {/* Gold foil texture overlay */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay pointer-events-none" />

                <div className="w-full h-full border-2 border-mystic/40 rounded-lg flex items-center justify-center relative bg-black/40 overflow-hidden">
                    {/* Glowing center orb */}
                    <div className="w-24 h-24 bg-gradient-to-tr from-mystic/20 to-nebula/30 rounded-full blur-xl absolute animate-pulse-slow pointer-events-none" />

                    {/* Mystical SVG Graphic */}
                    <svg viewBox="0 0 100 100" className="w-16 h-16 text-mystic opacity-90 relative z-10 drop-shadow-[0_0_8px_rgba(252,211,77,0.5)]">
                        <path fill="none" stroke="currentColor" strokeWidth="1.5" d="M50 5 L95 50 L50 95 L5 50 Z" />
                        <circle fill="none" stroke="currentColor" strokeWidth="1" cx="50" cy="50" r="30" />
                        <circle fill="currentColor" cx="50" cy="50" r="4" />
                        <path fill="none" stroke="currentColor" strokeWidth="0.5" d="M50 5 L50 95 M5 50 L95 50" />
                        <circle fill="none" stroke="currentColor" strokeWidth="1" cx="50" cy="50" r="42" strokeDasharray="2 4" />
                    </svg>

                    <div className="absolute inset-1.5 border border-mystic/20 rounded-md pointer-events-none" />
                </div>
            </div>
        </motion.div>
    );
}
