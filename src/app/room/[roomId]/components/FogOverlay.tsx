"use client";

import { motion } from "framer-motion";

export const FogOverlay = () => {
    return (
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
            {/* Animasyonlu Duman Katmanları */}
            <motion.div
                className="absolute inset-[-20%] bg-[radial-gradient(ellipse_at_center,rgba(184,164,232,0.03)_0%,transparent_70%)]"
                animate={{
                    x: ["-5%", "5%", "-5%"],
                    y: ["-2%", "2%", "-2%"],
                    scale: [1, 1.05, 1],
                }}
                transition={{
                    duration: 15,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />
            <motion.div
                className="absolute inset-[-10%] bg-[radial-gradient(ellipse_at_bottom_left,rgba(212,185,106,0.02)_0%,transparent_60%)]"
                animate={{
                    x: ["2%", "-2%", "2%"],
                    y: ["1%", "-1%", "1%"],
                    opacity: [0.3, 0.6, 0.3]
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 2
                }}
            />

            {/* Mum Işığı Titremesi (Table Glow Overlay) */}
            <motion.div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(212,185,106,0.015)_0%,transparent_80%)]"
                animate={{
                    opacity: [0.4, 0.7, 0.5, 0.8, 0.4],
                    scale: [1, 1.02, 0.98, 1.01, 1]
                }}
                transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />
        </div>
    );
};
