"use client";

import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
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
    // We use Framer Motion's `drag` feature. The layout needs boundaries.
    const [pixelPos, setPixelPos] = useState({ x: 0, y: 0 });
    const [hasCalculated, setHasCalculated] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);

    // Convert percentage to pixels dynamically based on table size
    useEffect(() => {
        if (!constraintsRef?.current) return;
        const container = constraintsRef.current;

        const updatePosition = () => {
            const rect = container.getBoundingClientRect();
            // width: 144px, height: 224px (w-36 h-56)
            setPixelPos({
                x: (card.x / 100) * rect.width - 72,
                y: (card.y / 100) * rect.height - 112
            });
            setHasCalculated(true);
        };

        // Update initially
        const tm = setTimeout(updatePosition, 10);

        const observer = new ResizeObserver(() => {
            updatePosition();
        });

        observer.observe(container);

        return () => {
            clearTimeout(tm);
            observer.disconnect();
        };
    }, [card.x, card.y, constraintsRef]);

    const handleDoubleClick = () => {
        // Determine random reversed state only when flipping face up for the first time
        const newReversed = card.isFlipped ? card.isReversed : Math.random() > 0.5;
        onFlipEnd(card.id, newReversed, !card.isFlipped);
    };

    return (
        <motion.div
            ref={cardRef}
            drag
            dragMomentum={false}
            dragConstraints={constraintsRef}
            onPointerDown={() => onPointerDown(card.id)}
            onDragEnd={(e, info) => {
                if (!constraintsRef?.current || !cardRef.current) return;
                const containerRect = constraintsRef.current.getBoundingClientRect();
                const cardRect = cardRef.current.getBoundingClientRect();

                // Calculate center point relative to the container
                const centerXPx = (cardRect.left - containerRect.left) + cardRect.width / 2;
                const centerYPx = (cardRect.top - containerRect.top) + cardRect.height / 2;

                // Convert back to percentages
                const newPercentX = (centerXPx / containerRect.width) * 100;
                const newPercentY = (centerYPx / containerRect.height) * 100;

                onDragEnd(card.id, newPercentX, newPercentY);
            }}
            initial={{ x: pixelPos.x, y: pixelPos.y, scale: 0, opacity: 0 }}
            animate={{
                x: pixelPos.x,
                y: pixelPos.y,
                scale: 1,
                opacity: hasCalculated ? 1 : 0,
                zIndex: card.zIndex,
                rotateY: card.isFlipped ? 180 : 0,
                rotateZ: card.isFlipped && card.isReversed ? 180 : 0
            }}
            whileHover={{ scale: 1.05, boxShadow: "0 0 35px rgba(212, 175, 55, 0.25)" }}
            whileTap={{ scale: 0.95 }}
            transition={{
                type: "spring",
                stiffness: 260,
                damping: 20,
                rotateY: { duration: 0.8, ease: "easeInOut" },
                rotateZ: { duration: 0.6, ease: "easeOut" }
            }}
            onDoubleClick={handleDoubleClick}
            className="absolute w-36 h-56 cursor-grab active:cursor-grabbing rounded-xl"
            style={{
                transformStyle: "preserve-3d",
                willChange: "transform, box-shadow"
            }}
        >
            {/* Front of card (shown when flipped) */}
            <div
                className={cn(
                    "absolute inset-0 rounded-xl bg-gradient-to-br from-obsidian to-charcoal flex flex-col items-center justify-center p-3 shadow-2xl backface-hidden border border-gold/40",
                    "before:absolute before:inset-0 before:rounded-xl before:bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] before:opacity-20 before:pointer-events-none before:mix-blend-screen"
                )}
                style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
            >
                <div className="absolute inset-1 rounded-lg border border-gold/30 flex flex-col items-center justify-center bg-black/80 shadow-inner p-2 z-10 overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-gold/5 to-transparent pointer-events-none" />

                    <span className="text-center font-cinzel text-gold-light font-bold leading-tight text-lg drop-shadow-[0_0_10px_rgba(212,175,55,0.6)] px-1">
                        {getCardName(card.cardIndex)}
                    </span>

                    <div className={cn(
                        "absolute bottom-4 text-[8px] font-inter tracking-[0.2em] uppercase font-bold px-3 py-1 rounded-full border",
                        card.isReversed
                            ? "text-crimson border-crimson/50 bg-crimson/10 shadow-[0_0_10px_rgba(128,0,0,0.5)]"
                            : "text-emerald border-emerald/50 bg-emerald/10 shadow-[0_0_10px_rgba(9,121,105,0.5)]"
                    )}>
                        {card.isReversed ? "Reversed" : "Upright"}
                    </div>
                </div>
            </div>

            {/* Back of Card (shown initially) */}
            <div
                className="absolute inset-0 rounded-xl bg-gradient-to-b from-[#0a0a0c] to-[#050505] shadow-[0_15px_40px_rgba(0,0,0,0.9)] flex items-center justify-center p-1.5 border border-gold/60 backface-hidden overflow-hidden"
                style={{ backfaceVisibility: "hidden" }}
            >
                {/* Gold foil texture overlay */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay pointer-events-none" />

                <div className="w-full h-full border border-gold/40 rounded-lg flex items-center justify-center relative bg-obsidian overflow-hidden">
                    {/* Glowing center orb */}
                    <div className="w-24 h-24 bg-gradient-to-tr from-gold/20 to-crimson/20 rounded-full blur-xl absolute animate-pulse-slow pointer-events-none" />

                    {/* Intricate Geometric Mandala SVG */}
                    <svg viewBox="0 0 100 100" className="w-[85%] h-[85%] text-gold opacity-90 relative z-10 drop-shadow-[0_0_8px_rgba(212,175,55,0.6)]">
                        {/* Outer rings */}
                        <circle fill="none" stroke="currentColor" strokeWidth="0.5" cx="50" cy="50" r="46" />
                        <circle fill="none" stroke="currentColor" strokeWidth="1" cx="50" cy="50" r="42" strokeDasharray="1 3" />
                        <circle fill="none" stroke="currentColor" strokeWidth="0.5" cx="50" cy="50" r="38" />

                        {/* Star / Hexagram */}
                        <path fill="none" stroke="currentColor" strokeWidth="0.75" d="M50 12 L83 69 L17 69 Z" />
                        <path fill="none" stroke="currentColor" strokeWidth="0.75" d="M50 88 L17 31 L83 31 Z" />

                        {/* Inner geometry */}
                        <circle fill="none" stroke="currentColor" strokeWidth="1" cx="50" cy="50" r="15" />
                        <circle fill="none" stroke="currentColor" strokeWidth="0.5" cx="50" cy="50" r="10" />
                        <circle fill="currentColor" cx="50" cy="50" r="3" />

                        {/* Cardinal points */}
                        <path fill="none" stroke="currentColor" strokeWidth="0.5" d="M50 4 L50 12 M50 88 L50 96 M4 50 L12 50 M88 50 L96 50" />
                    </svg>

                    <div className="absolute inset-1.5 border border-gold/20 rounded-md pointer-events-none" />
                </div>
            </div>
        </motion.div>
    );
}
