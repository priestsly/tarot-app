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
                // info.point gets the absolute viewport drop point, but it's often easier to just get the offset if we rely on a container
                // Since we emit absolute or relative coordinates, let's keep it simple:
                // We accumulate the drag offset to x, y.
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
            transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
                rotateY: { duration: 0.6 },
                rotateZ: { duration: 0.6 }
            }}
            onDoubleClick={handleDoubleClick}
            className="absolute w-36 h-56 cursor-grab active:cursor-grabbing border-2 border-transparent hover:border-purple-500/50 rounded-xl transition-colors duration-200"
            style={{
                transformStyle: "preserve-3d"
            }}
        >
            {/* Front of card (shown when flipped) */}
            <div
                className={cn(
                    "absolute inset-0 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 shadow-2xl flex flex-col items-center justify-center p-4 backface-hidden",
                    "border border-indigo-200"
                )}
                style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
            >
                <div className="flex-1 w-full border-2 border-indigo-300 rounded-lg flex items-center justify-center bg-white p-2">
                    <span className="text-center font-serif text-indigo-900 font-bold leading-tight">
                        {getCardName(card.cardIndex)}
                    </span>
                </div>
                <div className="h-6 mt-2 text-[10px] text-indigo-500 font-mono tracking-widest uppercase">
                    {card.isReversed ? "Reversed" : "Upright"}
                </div>
            </div>

            {/* Back of Card (shown initially) */}
            <div
                className="absolute inset-0 rounded-xl bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] bg-indigo-950 shadow-2xl flex items-center justify-center p-2 border border-indigo-500/30 backface-hidden"
                style={{ backfaceVisibility: "hidden" }}
            >
                <div className="w-full h-full border border-indigo-400/20 rounded-lg flex items-center justify-center">
                    <div className="w-16 h-16 bg-gradient-to-tr from-purple-500/20 to-indigo-500/20 rounded-full blur-md absolute" />
                    <svg viewBox="0 0 100 100" className="w-12 h-12 text-indigo-400 opacity-60">
                        <path fill="currentColor" d="M50 0 L100 50 L50 100 L0 50 Z" />
                        <circle fill="transparent" stroke="currentColor" strokeWidth="2" cx="50" cy="50" r="25" />
                    </svg>
                </div>
            </div>
        </motion.div>
    );
}
