"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Play, Pause, RotateCcw, Wind, Sparkles, Moon, Sun, Volume2, VolumeX } from "lucide-react";

// ── BREATHING PATTERNS ──
const PATTERNS = [
    { id: "calm", name: "Sakinlik", inhale: 4, hold: 4, exhale: 6, desc: "Stresi azaltır, zihni berraklaştırır." },
    { id: "energy", name: "Enerji", inhale: 4, hold: 2, exhale: 4, desc: "Canlanma ve odak için." },
    { id: "deep", name: "Derin Huzur", inhale: 5, hold: 7, exhale: 8, desc: "Derin rahatlama ve meditatif hal." },
];

// ── INTENTIONS ──
const INTENTIONS = [
    "Bugün açık bir zihinle kartlara yaklaşıyorum.",
    "Evrenin rehberliğini kabul ediyorum.",
    "İçsel sesimi dinlemeye hazırım.",
    "Gerçeği görmek için cesaretim var.",
    "Kalbimi ve zihinimi açıyorum.",
];

// ── AMBIENT DRONE GENERATOR ──
function useAmbientDrone() {
    const ctxRef = useRef<AudioContext | null>(null);
    const nodesRef = useRef<OscillatorNode[]>([]);
    const gainRef = useRef<GainNode | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    const start = useCallback(() => {
        if (ctxRef.current) return;
        try {
            const ctx = new AudioContext();
            ctxRef.current = ctx;

            const master = ctx.createGain();
            master.gain.setValueAtTime(0, ctx.currentTime);
            master.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 3);
            master.connect(ctx.destination);
            gainRef.current = master;

            // Deep drone pad — layered sine waves
            const freqs = [55, 82.5, 110, 165, 220]; // A1, E2, A2, E3, A3 — fifths
            freqs.forEach((f, i) => {
                const osc = ctx.createOscillator();
                const g = ctx.createGain();
                osc.type = i < 2 ? 'sine' : 'triangle';
                osc.frequency.setValueAtTime(f, ctx.currentTime);
                // Subtle detuning for warmth
                osc.detune.setValueAtTime((Math.random() - 0.5) * 8, ctx.currentTime);
                g.gain.setValueAtTime(i < 2 ? 0.04 : 0.015, ctx.currentTime);
                osc.connect(g);
                g.connect(master);
                osc.start();
                nodesRef.current.push(osc);
            });

            // Very slow LFO on master gain for breathing feel
            const lfo = ctx.createOscillator();
            const lfoGain = ctx.createGain();
            lfo.type = 'sine';
            lfo.frequency.setValueAtTime(0.08, ctx.currentTime); // ~5 second cycle
            lfoGain.gain.setValueAtTime(0.015, ctx.currentTime);
            lfo.connect(lfoGain);
            lfoGain.connect(master.gain);
            lfo.start();
            nodesRef.current.push(lfo);

            setIsPlaying(true);
        } catch { }
    }, []);

    const stop = useCallback(() => {
        if (gainRef.current && ctxRef.current) {
            gainRef.current.gain.linearRampToValueAtTime(0, ctxRef.current.currentTime + 2);
            setTimeout(() => {
                nodesRef.current.forEach(n => { try { n.stop(); } catch { } });
                nodesRef.current = [];
                ctxRef.current?.close();
                ctxRef.current = null;
                gainRef.current = null;
            }, 2500);
        }
        setIsPlaying(false);
    }, []);

    useEffect(() => {
        return () => {
            nodesRef.current.forEach(n => { try { n.stop(); } catch { } });
            ctxRef.current?.close();
        };
    }, []);

    return { start, stop, isPlaying };
}

// ── PARTICLES ──
function MeditationParticles() {
    const dots = useMemo(() => Array.from({ length: 30 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 1,
        delay: Math.random() * 8,
        duration: Math.random() * 12 + 15,
    })), []);

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {dots.map(dot => (
                <motion.div
                    key={dot.id}
                    className="absolute rounded-full bg-purple-300/20"
                    style={{ left: `${dot.x}%`, top: `${dot.y}%`, width: dot.size, height: dot.size }}
                    animate={{ y: [0, -80, 0], opacity: [0.1, 0.4, 0.1] }}
                    transition={{ duration: dot.duration, delay: dot.delay, repeat: Infinity, ease: "easeInOut" }}
                />
            ))}
        </div>
    );
}

// ── MAIN PAGE ──
export default function MeditationPage() {
    const router = useRouter();
    const [phase, setPhase] = useState<"setup" | "breathing" | "intention" | "complete">("setup");
    const [selectedPattern, setSelectedPattern] = useState(PATTERNS[0]);
    const [breathPhase, setBreathPhase] = useState<"inhale" | "hold" | "exhale">("inhale");
    const [isRunning, setIsRunning] = useState(false);
    const [cyclesCompleted, setCyclesCompleted] = useState(0);
    const [totalCycles] = useState(5);
    const [customIntention, setCustomIntention] = useState("");
    const [selectedIntention, setSelectedIntention] = useState("");
    const [timer, setTimer] = useState(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const breathRef = useRef<NodeJS.Timeout | null>(null);
    const { start: startAmbient, stop: stopAmbient, isPlaying: isAmbientPlaying } = useAmbientDrone();

    // ── Timer ──
    useEffect(() => {
        if (isRunning) {
            timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [isRunning]);

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    };

    // ── Breathing Cycle ──
    const runBreathCycle = useCallback(() => {
        const p = selectedPattern;
        let cycle = 0;

        const doCycle = () => {
            if (cycle >= totalCycles) {
                setIsRunning(false);
                setPhase("intention");
                return;
            }

            // Inhale
            setBreathPhase("inhale");
            breathRef.current = setTimeout(() => {
                // Hold
                setBreathPhase("hold");
                breathRef.current = setTimeout(() => {
                    // Exhale
                    setBreathPhase("exhale");
                    breathRef.current = setTimeout(() => {
                        cycle++;
                        setCyclesCompleted(cycle);
                        doCycle();
                    }, p.exhale * 1000);
                }, p.hold * 1000);
            }, p.inhale * 1000);
        };

        doCycle();
    }, [selectedPattern, totalCycles]);

    const startBreathing = () => {
        setPhase("breathing");
        setIsRunning(true);
        setCyclesCompleted(0);
        setTimer(0);
        startAmbient();
        runBreathCycle();
    };

    const stopBreathing = () => {
        setIsRunning(false);
        if (breathRef.current) clearTimeout(breathRef.current);
        stopAmbient();
    };

    const reset = () => {
        stopBreathing();
        setPhase("setup");
        setCyclesCompleted(0);
        setTimer(0);
    };

    // ── Breath circle scale ──
    const breathScale = breathPhase === "inhale" ? 1.6 : breathPhase === "hold" ? 1.6 : 1;
    const breathDuration = breathPhase === "inhale" ? selectedPattern.inhale : breathPhase === "hold" ? selectedPattern.hold : selectedPattern.exhale;
    const breathLabel = breathPhase === "inhale" ? "Nefes Al" : breathPhase === "hold" ? "Tut" : "Nefes Ver";

    return (
        <div className="min-h-screen bg-[#0a0812] text-white flex flex-col items-center justify-center relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vh] bg-purple-900/8 rounded-full blur-[250px]" />
                <div className="absolute top-[10%] left-[20%] w-[300px] h-[300px] bg-indigo-900/10 rounded-full blur-[180px]" />
                <div className="absolute bottom-[10%] right-[20%] w-[250px] h-[250px] bg-violet-900/8 rounded-full blur-[160px]" />
            </div>
            <MeditationParticles />

            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 sm:p-6">
                <button onClick={() => router.push("/")} className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors text-sm">
                    <ArrowLeft className="w-4 h-4" /> Geri
                </button>
                <div className="flex items-center gap-3">
                    {phase !== "setup" && (
                        <span className="text-xs text-white/30 font-mono tracking-widest">{formatTime(timer)}</span>
                    )}
                    <button
                        onClick={isAmbientPlaying ? stopAmbient : startAmbient}
                        className="p-2 rounded-xl text-white/30 hover:text-white/60 hover:bg-white/5 transition-all"
                        title={isAmbientPlaying ? "Sesi Kapat" : "Ambient Aç"}
                    >
                        {isAmbientPlaying ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="relative z-10 w-full max-w-lg px-6 flex flex-col items-center">
                <AnimatePresence mode="wait">
                    {/* ── SETUP PHASE ── */}
                    {phase === "setup" && (
                        <motion.div
                            key="setup"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="w-full text-center"
                        >
                            <Moon className="w-10 h-10 text-purple-400/50 mx-auto mb-6" />
                            <h1 className="text-3xl sm:text-4xl font-heading font-semibold text-white/90 mb-3">
                                Meditasyon Odası
                            </h1>
                            <p className="text-sm text-white/40 mb-12 max-w-xs mx-auto leading-relaxed">
                                Seansa başlamadan önce zihninizi berraklaştırın ve niyetinizi belirleyin.
                            </p>

                            <h3 className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-bold mb-4">Nefes Kalıbı Seçin</h3>
                            <div className="space-y-3 mb-10">
                                {PATTERNS.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => setSelectedPattern(p)}
                                        className={`w-full text-left p-4 rounded-xl border transition-all flex items-center gap-4 group ${selectedPattern.id === p.id
                                            ? "bg-purple-500/10 border-purple-500/30 ring-1 ring-purple-500/20"
                                            : "bg-white/[0.02] border-white/[0.06] hover:border-purple-500/20 hover:bg-white/[0.04]"
                                            }`}
                                    >
                                        <div className={`p-2.5 rounded-xl transition-colors ${selectedPattern.id === p.id ? "bg-purple-500/20 text-purple-300" : "bg-white/5 text-white/30 group-hover:text-white/50"}`}>
                                            <Wind className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-semibold text-white/80">{p.name}</span>
                                                <span className="text-[10px] text-white/25 font-mono">{p.inhale}-{p.hold}-{p.exhale}</span>
                                            </div>
                                            <p className="text-[11px] text-white/35 mt-0.5">{p.desc}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={startBreathing}
                                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-purple-600/60 to-indigo-600/50 text-white/90 rounded-xl font-semibold tracking-wide transition-all hover:brightness-110 hover:shadow-lg hover:shadow-purple-500/10 active:scale-[0.98] border border-purple-500/20"
                            >
                                <Play className="w-5 h-5" /> Başla
                            </button>
                        </motion.div>
                    )}

                    {/* ── BREATHING PHASE ── */}
                    {phase === "breathing" && (
                        <motion.div
                            key="breathing"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-full flex flex-col items-center"
                        >
                            {/* Breathing Circle */}
                            <div className="relative w-56 h-56 sm:w-72 sm:h-72 flex items-center justify-center mb-12">
                                {/* Outer ring */}
                                <motion.div
                                    className="absolute inset-0 rounded-full border border-purple-500/10"
                                    animate={{ scale: breathScale, opacity: breathPhase === "hold" ? 0.6 : 0.3 }}
                                    transition={{ duration: breathDuration, ease: breathPhase === "hold" ? "linear" : "easeInOut" }}
                                />
                                {/* Middle ring glow */}
                                <motion.div
                                    className="absolute inset-4 rounded-full bg-purple-500/5 border border-purple-400/8"
                                    animate={{ scale: breathScale }}
                                    transition={{ duration: breathDuration, ease: breathPhase === "hold" ? "linear" : "easeInOut" }}
                                />
                                {/* Core circle */}
                                <motion.div
                                    className="absolute inset-10 rounded-full bg-gradient-to-br from-purple-500/10 to-indigo-600/8 border border-purple-400/15 shadow-[0_0_60px_rgba(139,92,246,0.1)]"
                                    animate={{ scale: breathScale }}
                                    transition={{ duration: breathDuration, ease: breathPhase === "hold" ? "linear" : "easeInOut" }}
                                />
                                {/* Center text */}
                                <div className="relative z-10 text-center">
                                    <motion.p
                                        key={breathLabel}
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-lg font-heading font-semibold text-white/70"
                                    >
                                        {breathLabel}
                                    </motion.p>
                                    <p className="text-[10px] text-white/25 mt-1 uppercase tracking-[0.2em]">
                                        {breathDuration} saniye
                                    </p>
                                </div>
                            </div>

                            {/* Progress */}
                            <div className="flex items-center gap-2 mb-8">
                                {Array.from({ length: totalCycles }).map((_, i) => (
                                    <div
                                        key={i}
                                        className={`h-1.5 rounded-full transition-all duration-500 ${i < cyclesCompleted ? "w-6 bg-purple-400/60" : i === cyclesCompleted ? "w-4 bg-purple-400/30 animate-pulse" : "w-2 bg-white/10"}`}
                                    />
                                ))}
                            </div>

                            <p className="text-xs text-white/25 mb-8">Döngü {cyclesCompleted + 1} / {totalCycles}</p>

                            {/* Controls */}
                            <div className="flex items-center gap-3">
                                <button onClick={stopBreathing} className="p-3 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-white/70 hover:bg-white/10 transition-all">
                                    <Pause className="w-5 h-5" />
                                </button>
                                <button onClick={reset} className="p-3 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-white/70 hover:bg-white/10 transition-all">
                                    <RotateCcw className="w-5 h-5" />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* ── INTENTION PHASE ── */}
                    {phase === "intention" && (
                        <motion.div
                            key="intention"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="w-full text-center"
                        >
                            <Sparkles className="w-8 h-8 text-amber-400/40 mx-auto mb-6" />
                            <h2 className="text-2xl font-heading font-semibold text-white/90 mb-2">Niyetinizi Belirleyin</h2>
                            <p className="text-sm text-white/35 mb-10 max-w-xs mx-auto">
                                Kartlara hangi enerjiyle yaklaşmak istiyorsunuz?
                            </p>

                            <div className="space-y-2 mb-8">
                                {INTENTIONS.map((intent, i) => (
                                    <button
                                        key={i}
                                        onClick={() => { setSelectedIntention(intent); setCustomIntention(""); }}
                                        className={`w-full text-left px-4 py-3 rounded-xl border transition-all text-sm ${selectedIntention === intent
                                            ? "bg-purple-500/10 border-purple-500/25 text-white/80"
                                            : "bg-white/[0.02] border-white/[0.06] text-white/40 hover:text-white/60 hover:border-white/10"
                                            }`}
                                    >
                                        &ldquo;{intent}&rdquo;
                                    </button>
                                ))}
                            </div>

                            <div className="relative mb-8">
                                <textarea
                                    value={customIntention}
                                    onChange={(e) => { setCustomIntention(e.target.value); setSelectedIntention(""); }}
                                    placeholder="Veya kendi niyetinizi yazın..."
                                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white/70 placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-purple-500/30 focus:border-purple-500/20 resize-none h-20 transition-all"
                                />
                            </div>

                            <button
                                onClick={() => setPhase("complete")}
                                disabled={!selectedIntention && !customIntention.trim()}
                                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-purple-600/60 to-indigo-600/50 text-white/90 rounded-xl font-semibold tracking-wide transition-all hover:brightness-110 active:scale-[0.98] border border-purple-500/20 disabled:opacity-30 disabled:pointer-events-none"
                            >
                                <Sun className="w-5 h-5" /> Hazırım
                            </button>
                        </motion.div>
                    )}

                    {/* ── COMPLETE PHASE ── */}
                    {phase === "complete" && (
                        <motion.div
                            key="complete"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-full text-center"
                        >
                            <motion.div
                                animate={{ rotate: [0, 360] }}
                                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                className="w-16 h-16 mx-auto mb-8 rounded-full border border-purple-500/20 flex items-center justify-center"
                            >
                                <Sparkles className="w-7 h-7 text-purple-400/50" />
                            </motion.div>

                            <h2 className="text-2xl font-heading font-semibold text-white/90 mb-3">Hazırsınız</h2>
                            <p className="text-sm text-white/35 mb-4">
                                {formatTime(timer)} boyunca nefes egzersizi yaptınız.
                            </p>

                            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 mb-10">
                                <p className="text-[10px] text-white/25 uppercase tracking-[0.15em] mb-2">Niyetiniz</p>
                                <p className="text-sm text-white/60 italic leading-relaxed">
                                    &ldquo;{selectedIntention || customIntention}&rdquo;
                                </p>
                            </div>

                            <div className="space-y-3">
                                <button
                                    onClick={() => router.push("/")}
                                    className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-purple-600/60 to-indigo-600/50 text-white/90 rounded-xl font-semibold tracking-wide transition-all hover:brightness-110 active:scale-[0.98] border border-purple-500/20"
                                >
                                    <Sparkles className="w-5 h-5" /> Seansa Geç
                                </button>
                                <button
                                    onClick={reset}
                                    className="w-full px-6 py-3 text-white/30 text-sm hover:text-white/50 transition-colors"
                                >
                                    Tekrar Meditasyon Yap
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Bottom decorative text */}
            <p className="absolute bottom-6 text-[9px] text-white/15 uppercase tracking-[0.25em] z-10">
                Mystic Tarot · Meditasyon
            </p>
        </div>
    );
}
