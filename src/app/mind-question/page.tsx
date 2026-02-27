"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Sparkles, HelpCircle, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import answers from "@/lib/answers.json";

export default function MindQuestionPage() {
    const router = useRouter();
    const [isSpinning, setIsSpinning] = useState(false);
    const [result, setResult] = useState<string | null>(null);

    const getAnswer = () => {
        setIsSpinning(true);
        setResult(null);

        // Mystical delay
        setTimeout(() => {
            const randomIndex = Math.floor(Math.random() * answers.length);
            setResult(answers[randomIndex]);
            setIsSpinning(false);
        }, 2000);
    };

    return (
        <div className="min-h-screen bg-bg text-text noise flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Orbs */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-600/10 rounded-full blur-[120px] pointer-events-none" />

            <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => router.back()}
                className="absolute top-8 left-8 flex items-center gap-2 text-text-muted hover:text-accent transition-colors text-xs uppercase tracking-[0.2em] font-bold"
            >
                <ArrowLeft className="w-4 h-4" /> Geri Dön
            </motion.button>

            <div className="w-full max-w-lg space-y-12 text-center relative z-10">
                <header className="space-y-4">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-3xl mx-auto flex items-center justify-center shadow-2xl shadow-purple-500/20"
                    >
                        <HelpCircle className="w-10 h-10 text-white/90" />
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-4xl font-heading font-bold"
                    >
                        Aklımdaki Soru
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-text-muted text-sm max-w-xs mx-auto leading-relaxed"
                    >
                        Sorunuza odaklanın, derin bir nefes alın ve evrenin size ne söylemek istediğini keşfedin.
                    </motion.p>
                </header>

                <main className="relative h-64 flex items-center justify-center">
                    <AnimatePresence mode="wait">
                        {!result && !isSpinning && (
                            <motion.button
                                key="btn"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.1 }}
                                onClick={getAnswer}
                                className="group relative"
                            >
                                <div className="absolute inset-0 bg-accent/20 blur-3xl group-hover:bg-accent/40 transition-all rounded-full" />
                                <div className="relative bg-surface border border-border/50 px-10 py-6 rounded-2xl shadow-xl transition-all group-hover:border-accent group-hover:scale-105 active:scale-95">
                                    <span className="text-lg font-semibold tracking-wide flex items-center gap-3">
                                        Cevabı fısılda <Sparkles className="w-5 h-5 text-amber-400" />
                                    </span>
                                </div>
                            </motion.button>
                        )}

                        {isSpinning && (
                            <motion.div
                                key="loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-center gap-6"
                            >
                                <div className="relative w-24 h-24">
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                        className="absolute inset-0 border-4 border-accent/20 border-t-accent rounded-full"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Sparkles className="w-8 h-8 text-accent animate-pulse" />
                                    </div>
                                </div>
                                <p className="text-xs text-accent font-bold uppercase tracking-[0.3em] animate-pulse">
                                    Evrenle bağlantı kuruluyor...
                                </p>
                            </motion.div>
                        )}

                        {result && (
                            <motion.div
                                key="result"
                                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                className="flex flex-col items-center gap-8"
                            >
                                <div className="relative p-1">
                                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-accent to-amber-500 rounded-3xl blur-md opacity-20" />
                                    <div className="relative bg-surface/80 backdrop-blur-md border border-accent/30 p-10 rounded-3xl shadow-2xl">
                                        <p className="text-2xl sm:text-3xl font-heading font-medium text-text leading-tight italic">
                                            "{result}"
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={getAnswer}
                                    className="flex items-center gap-2 text-text-muted hover:text-accent transition-colors text-[10px] font-bold uppercase tracking-[0.2em]"
                                >
                                    <RefreshCw className="w-4 h-4" /> Başka bir soru sor
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </main>

                <footer className="pt-12">
                    <div className="flex items-center justify-center gap-4 text-text-muted/30 text-[9px] uppercase tracking-[0.2em]">
                        <span>İlahi Rehberlik</span>
                        <div className="w-1 h-1 bg-border rounded-full" />
                        <span>Kozmik Bilgelik</span>
                        <div className="w-1 h-1 bg-border rounded-full" />
                        <span>Anlık Yanıt</span>
                    </div>
                </footer>
            </div>
        </div>
    );
}
