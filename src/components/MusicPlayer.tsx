"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Music, X, Play, Pause, SkipForward } from "lucide-react";

const TRACKS = [
    { name: "Kozmik Huzur", frequencies: [174, 261, 349], type: "sine" as OscillatorType, color: "purple" },
    { name: "Ay Işığı", frequencies: [220, 330, 440], type: "sine" as OscillatorType, color: "blue" },
    { name: "Kristal Şarkısı", frequencies: [396, 528, 639], type: "triangle" as OscillatorType, color: "cyan" },
    { name: "Toprak Ritmi", frequencies: [110, 146, 220], type: "sine" as OscillatorType, color: "amber" },
    { name: "Rüzgar Fısıltısı", frequencies: [285, 396, 528], type: "sine" as OscillatorType, color: "emerald" },
];

export function MusicPlayer() {
    const [isOpen, setIsOpen] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [trackIdx, setTrackIdx] = useState(0);
    const ctxRef = useRef<AudioContext | null>(null);
    const nodesRef = useRef<{ oscillators: OscillatorNode[]; gains: GainNode[]; master: GainNode } | null>(null);

    const track = TRACKS[trackIdx];

    const stop = useCallback(() => {
        if (nodesRef.current) {
            nodesRef.current.master.gain.linearRampToValueAtTime(0, (ctxRef.current?.currentTime || 0) + 0.5);
            setTimeout(() => {
                nodesRef.current?.oscillators.forEach(o => { try { o.stop(); } catch { } });
                nodesRef.current = null;
            }, 600);
        }
        setIsPlaying(false);
    }, []);

    const play = useCallback(async () => {
        if (nodesRef.current) stop();

        const ctx = ctxRef.current || new AudioContext();
        ctxRef.current = ctx;

        // Force resume for browsers that require user interaction
        if (ctx.state === "suspended") {
            await ctx.resume();
        }

        const master = ctx.createGain();
        master.gain.setValueAtTime(0, ctx.currentTime);
        master.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 1); // Increased volume from 0.04 to 0.15
        master.connect(ctx.destination);

        const oscillators: OscillatorNode[] = [];
        const gains: GainNode[] = [];

        track.frequencies.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = track.type;
            osc.frequency.value = freq;
            osc.detune.value = (Math.random() - 0.5) * 8;
            gain.gain.value = 0.05 + (i === 0 ? 0.02 : 0); // Increased individual oscillator volumes

            // Slow LFO for movement
            const lfo = ctx.createOscillator();
            const lfoGain = ctx.createGain();
            lfo.frequency.value = 0.1 + Math.random() * 0.1;
            lfoGain.gain.value = 2;
            lfo.connect(lfoGain);
            lfoGain.connect(osc.detune);
            lfo.start();

            osc.connect(gain);
            gain.connect(master);
            osc.start();
            oscillators.push(osc);
            gains.push(gain);
        });

        nodesRef.current = { oscillators, gains, master };
        setIsPlaying(true);
    }, [track, stop]);

    const nextTrack = () => {
        const wasPlaying = isPlaying;
        if (isPlaying) stop();
        setTrackIdx(i => (i + 1) % TRACKS.length);
        if (wasPlaying) setTimeout(play, 100);
    };

    useEffect(() => { return () => { if (nodesRef.current) stop(); }; }, [stop]);

    return (
        <>
            {/* Floating button - Moved from bottom-6 to top-24 to avoid overlapping with bottom chat inputs */}
            <button onClick={() => setIsOpen(!isOpen)}
                className={`fixed top-20 right-6 lg:top-24 lg:right-10 z-50 w-12 h-12 rounded-full flex items-center justify-center shadow-xl transition-all ${isPlaying ? "bg-purple-500/30 border border-purple-500/40 animate-pulse" : "bg-[#1a1825]/80 backdrop-blur-md border border-white/10 hover:bg-white/[0.08]"}`}>
                <Music className={`w-5 h-5 ${isPlaying ? "text-purple-300" : "text-white/50"}`} />
            </button>

            {/* Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div initial={{ opacity: 0, y: -20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        className="fixed top-36 right-6 lg:top-40 lg:right-10 z-50 w-72 bg-[#1a1825]/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden">
                        <div className="flex items-center justify-between p-3 border-b border-white/[0.06]">

                            <span className="text-[10px] text-white/30 uppercase tracking-wider">Ambient Müzik</span>
                            <button onClick={() => setIsOpen(false)} className="text-white/20 hover:text-white/40"><X className="w-4 h-4" /></button>
                        </div>

                        <div className="p-4 text-center">
                            <motion.div animate={isPlaying ? { scale: [1, 1.05, 1] } : {}} transition={{ duration: 2, repeat: Infinity }} className="text-3xl mb-2">🎵</motion.div>
                            <h3 className="text-sm font-semibold text-white/60">{track.name}</h3>
                            <p className="text-[10px] text-white/20 mt-0.5">{track.frequencies.join(" Hz · ")} Hz</p>

                            <div className="flex items-center justify-center gap-4 mt-4">
                                <button onClick={isPlaying ? stop : play}
                                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isPlaying ? "bg-purple-500/20 border border-purple-500/30 text-purple-300" : "bg-white/[0.05] border border-white/10 text-white/40 hover:text-white/60"}`}>
                                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                                </button>
                                <button onClick={nextTrack} className="p-2 text-white/25 hover:text-white/50 transition-colors">
                                    <SkipForward className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Track list */}
                        <div className="px-3 pb-3 space-y-1">
                            {TRACKS.map((t, i) => (
                                <button key={i} onClick={() => { setTrackIdx(i); if (isPlaying) { stop(); setTimeout(play, 100); } }}
                                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all ${i === trackIdx ? "bg-purple-500/10 text-white/60" : "text-white/25 hover:bg-white/[0.03] hover:text-white/40"}`}>
                                    <span className="text-xs">{i === trackIdx && isPlaying ? "▶" : "○"}</span>
                                    <span className="text-xs">{t.name}</span>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
