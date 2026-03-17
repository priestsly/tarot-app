"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export const FogOverlay = () => {
    const [dusts, setDusts] = useState<{ id: number, x: number, delay: number, size: number, duration: number }[]>([]);

    useEffect(() => {
        // Generate random mystical dust particles
        const newDusts = Array.from({ length: 40 }).map((_, i) => ({
            id: i,
            x: Math.random() * 100,
            delay: Math.random() * 20,
            size: Math.random() * 3 + 1,
            duration: Math.random() * 10 + 15
        }));
        setDusts(newDusts);
    }, []);

    return (
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
            {/* 1. Deep Bottom Mist (Aşağıdan Yukarıya Doğru Koyu Sis) */}
            <div className="absolute inset-x-0 bottom-0 h-[60%] bg-gradient-to-t from-black/40 via-purple-900/5 to-transparent blur-3xl opacity-60" />

            {/* 2. Rising Dust Particles (Yükselen Kozmik Tozlar) */}
            {dusts.map((dust) => (
                <motion.div
                    key={dust.id}
                    className="absolute bottom-[-10px] rounded-full bg-accent/10 blur-[1px]"
                    style={{
                        left: `${dust.x}%`,
                        width: dust.size,
                        height: dust.size,
                    }}
                    initial={{ y: 0, opacity: 0 }}
                    animate={{
                        y: -1200, // Move up far
                        opacity: [0, 0.4, 0.6, 0.2, 0],
                        x: [`${dust.x}%`, `${dust.x + (Math.random() * 10 - 5)}%`, `${dust.x}%`],
                    }}
                    transition={{
                        duration: dust.duration,
                        repeat: Infinity,
                        delay: dust.delay,
                        ease: "linear",
                    }}
                />
            ))}

            {/* 3. Layered Ambient Clouds (Katmanlı Ortam Bulutları) */}
            <motion.div
                className="absolute inset-[-20%] bg-[radial-gradient(circle_at_bottom,rgba(184,164,232,0.06)_0%,transparent_60%)]"
                animate={{
                    opacity: [0.3, 0.6, 0.3],
                    scale: [1, 1.1, 1],
                }}
                transition={{
                    duration: 25,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />

            <motion.div
                className="absolute inset-[-30%] bg-[radial-gradient(circle_at_bottom_right,rgba(212,185,106,0.03)_0%,transparent_50%)]"
                animate={{
                    opacity: [0.2, 0.4, 0.2],
                    x: ["-5%", "5%", "-5%"],
                }}
                transition={{
                    duration: 18,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 5
                }}
            />

            {/* 4. Center Mystery Focus (Merkezdeki Mistik Odak) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,transparent_20%,rgba(12,11,20,0.4)_100%)]" />
        </div>
    );
};
