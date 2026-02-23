"use client";

import { motion } from "framer-motion";
import { useRef, useState, useCallback } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export interface CardState {
    id: string;
    cardIndex: number;
    x: number;       // percentage 0-100
    y: number;       // percentage 0-100
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

// Card dimensions
const CARD_W = 144; // w-36
const CARD_H = 224; // h-56

export default function TarotCard({ card, onDragEnd, onFlipEnd, onPointerDown, isLocal, constraintsRef }: TarotCardProps) {
    // Local drag offset in pixels (resets to 0 when not dragging)
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const isDragging = useRef(false);
    const dragStart = useRef({ px: 0, py: 0 });
    const lastTap = useRef<{ time: number; x: number; y: number }>({ time: 0, x: 0, y: 0 });

    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        // Only left mouse button or touch
        if (e.button !== 0) return;
        e.preventDefault();
        e.stopPropagation();

        isDragging.current = true;
        dragStart.current = { px: e.clientX, py: e.clientY };
        setDragOffset({ x: 0, y: 0 });

        onPointerDown(card.id);

        // Capture pointer for smooth dragging even outside the element
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }, [card.id, onPointerDown]);

    const handlePointerMove = useCallback((e: React.PointerEvent) => {
        if (!isDragging.current) return;
        e.preventDefault();

        const dx = e.clientX - dragStart.current.px;
        const dy = e.clientY - dragStart.current.py;

        // Compute tentative new position to enforce table boundaries
        if (constraintsRef?.current) {
            const rect = constraintsRef.current.getBoundingClientRect();
            const currentLeftPx = (card.x / 100) * rect.width - CARD_W / 2;
            const currentTopPx = (card.y / 100) * rect.height - CARD_H / 2;

            let newLeft = currentLeftPx + dx;
            let newTop = currentTopPx + dy;

            // Clamp to table boundaries
            newLeft = Math.max(0, Math.min(rect.width - CARD_W, newLeft));
            newTop = Math.max(0, Math.min(rect.height - CARD_H, newTop));

            setDragOffset({
                x: newLeft - currentLeftPx,
                y: newTop - currentTopPx
            });
        } else {
            setDragOffset({ x: dx, y: dy });
        }
    }, [card.x, card.y, constraintsRef]);

    const handlePointerUp = useCallback((e: React.PointerEvent) => {
        if (!isDragging.current) return;
        isDragging.current = false;

        (e.target as HTMLElement).releasePointerCapture(e.pointerId);

        if (!constraintsRef?.current) {
            setDragOffset({ x: 0, y: 0 });
            return;
        }

        const rect = constraintsRef.current.getBoundingClientRect();

        // Current CSS anchor in pixels
        const currentLeftPx = (card.x / 100) * rect.width - CARD_W / 2;
        const currentTopPx = (card.y / 100) * rect.height - CARD_H / 2;

        // New top-left corner in pixels
        let newLeft = currentLeftPx + dragOffset.x;
        let newTop = currentTopPx + dragOffset.y;

        // Clamp to table
        newLeft = Math.max(0, Math.min(rect.width - CARD_W, newLeft));
        newTop = Math.max(0, Math.min(rect.height - CARD_H, newTop));

        // Convert to center-based percentages
        const newCenterX = newLeft + CARD_W / 2;
        const newCenterY = newTop + CARD_H / 2;

        const newPercentX = (newCenterX / rect.width) * 100;
        const newPercentY = (newCenterY / rect.height) * 100;

        // Reset drag offset BEFORE emitting (so the CSS left/top takes over cleanly)
        setDragOffset({ x: 0, y: 0 });

        onDragEnd(card.id, newPercentX, newPercentY);
    }, [card.id, card.x, card.y, constraintsRef, dragOffset, onDragEnd]);

    // Detect taps (pointerUp with minimal movement) and double-tap to flip
    const handleTapDetection = useCallback((e: React.PointerEvent) => {
        // Only count as a "tap" if the finger/mouse barely moved (< 15px)
        const dx = Math.abs(e.clientX - dragStart.current.px);
        const dy = Math.abs(e.clientY - dragStart.current.py);
        if (dx > 15 || dy > 15) return; // was a drag, not a tap

        const now = Date.now();
        const prev = lastTap.current;

        // Check if this is a double-tap (second tap within 400ms and nearby)
        if (
            now - prev.time < 400 &&
            Math.abs(e.clientX - prev.x) < 30 &&
            Math.abs(e.clientY - prev.y) < 30
        ) {
            // Double-tap detected → flip card
            const newReversed = card.isFlipped ? card.isReversed : Math.random() > 0.5;
            onFlipEnd(card.id, newReversed, !card.isFlipped);
            lastTap.current = { time: 0, x: 0, y: 0 }; // reset to prevent triple-tap
        } else {
            lastTap.current = { time: now, x: e.clientX, y: e.clientY };
        }
    }, [card.id, card.isFlipped, card.isReversed, onFlipEnd]);

    return (
        <motion.div
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={(e) => {
                handlePointerUp(e);
                handleTapDetection(e);
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{
                scale: 1,
                opacity: 1,
                zIndex: card.zIndex,
                rotateY: card.isFlipped ? 180 : 0,
                rotateZ: card.isFlipped && card.isReversed ? 180 : 0,
            }}
            whileHover={isDragging.current ? undefined : { scale: 1.05, boxShadow: "0 0 35px rgba(20, 184, 166, 0.3)" }}
            transition={{
                type: "spring",
                stiffness: 260,
                damping: 20,
                rotateY: { duration: 0.8, ease: "easeInOut" },
                rotateZ: { duration: 0.6, ease: "easeOut" }
            }}
            className="w-36 h-56 rounded-xl select-none touch-none"
            style={{
                position: 'absolute',
                left: `calc(${card.x}% - ${CARD_W / 2}px + ${dragOffset.x}px)`,
                top: `calc(${card.y}% - ${CARD_H / 2}px + ${dragOffset.y}px)`,
                cursor: isDragging.current ? 'grabbing' : 'grab',
                transformStyle: "preserve-3d",
                willChange: "left, top, transform",
            }}
        >
            {/* Front of card (shown when flipped) */}
            <div
                className={cn(
                    "absolute inset-0 rounded-xl bg-gradient-to-br from-[#0a1628] to-[#030712] flex flex-col items-center justify-center p-3 shadow-2xl backface-hidden border border-teal-500/20",
                    "before:absolute before:inset-0 before:rounded-xl before:bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] before:opacity-30 before:pointer-events-none before:mix-blend-overlay"
                )}
                style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
            >
                <div className="absolute inset-1 rounded-lg border border-teal-300/15 flex flex-col items-center justify-center bg-black/60 shadow-inner p-2 z-10 overflow-hidden backdrop-blur-sm">
                    <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-teal-200/8 to-transparent pointer-events-none" />

                    <span className="text-center font-cinzel text-slate-100 font-bold leading-tight text-lg drop-shadow-[0_0_12px_rgba(20,184,166,0.6)] px-1">
                        {getCardName(card.cardIndex)}
                    </span>

                    <div className={cn(
                        "absolute bottom-4 text-[8px] font-inter tracking-[0.2em] uppercase font-bold px-3 py-1 rounded-full border",
                        card.isReversed
                            ? "text-amber-300 border-amber-400/40 bg-amber-500/10 shadow-[0_0_12px_rgba(245,158,11,0.4)]"
                            : "text-teal-300 border-teal-400/40 bg-teal-500/10 shadow-[0_0_12px_rgba(20,184,166,0.4)]"
                    )}>
                        {card.isReversed ? "Reversed" : "Upright"}
                    </div>
                </div>
            </div>

            {/* Back of Card (shown initially) */}
            <div
                className="absolute inset-0 rounded-xl bg-gradient-to-b from-[#0d1b2a] to-[#030712] shadow-[0_15px_40px_rgba(0,0,0,0.9)] flex items-center justify-center p-1.5 border border-teal-500/25 backface-hidden overflow-hidden"
                style={{ backfaceVisibility: "hidden" }}
            >
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay pointer-events-none" />

                <div className="w-full h-full border border-teal-500/20 rounded-lg flex items-center justify-center relative bg-[#040c1a] overflow-hidden">
                    <div className="w-24 h-24 bg-gradient-to-tr from-teal-500/15 to-cyan-500/15 rounded-full blur-xl absolute animate-pulse-slow pointer-events-none" />

                    <svg viewBox="0 0 100 100" className="w-[85%] h-[85%] text-teal-300 opacity-90 relative z-10 drop-shadow-[0_0_8px_rgba(20,184,166,0.5)]">
                        <circle fill="none" stroke="currentColor" strokeWidth="0.5" cx="50" cy="50" r="46" />
                        <circle fill="none" stroke="currentColor" strokeWidth="0.5" cx="50" cy="50" r="42" strokeDasharray="2 4" opacity="0.5" />
                        <path fill="currentColor" opacity="0.9" d="M60 25 A 25 25 0 1 0 75 70 A 30 30 0 1 1 60 25 Z" />
                        <path fill="none" stroke="currentColor" strokeWidth="0.5" d="M25 40 L40 30 L50 45 L35 65 L25 40" opacity="0.6" />
                        <circle fill="currentColor" cx="25" cy="40" r="1.5" />
                        <circle fill="currentColor" cx="40" cy="30" r="1" />
                        <circle fill="currentColor" cx="50" cy="45" r="2" />
                        <circle fill="currentColor" cx="35" cy="65" r="1.5" />
                        <path fill="currentColor" d="M70 30 L72 35 L77 37 L72 39 L70 44 L68 39 L63 37 L68 35 Z" opacity="0.8" transform="scale(0.5) translate(70, 0)" />
                        <path fill="currentColor" d="M30 70 L32 75 L37 77 L32 79 L30 84 L28 79 L23 77 L28 75 Z" opacity="0.6" transform="scale(0.4) translate(30, 80)" />
                    </svg>

                    <div className="absolute inset-1.5 border border-teal-400/8 rounded-md pointer-events-none" />
                </div>
            </div>
        </motion.div>
    );
}
