"use client";

import { motion } from "framer-motion";
import { X, Sparkles, Loader2, Wand2, Volume2, VolumeX } from "lucide-react";
import { useState, useEffect, useRef } from "react";

interface AiModalProps {
    isOpen: boolean;
    onClose: () => void;
    aiResponse: string;
    aiLoading: boolean;
    onInterpret: () => void;
}

export const AiModal = ({ isOpen, onClose, aiResponse, aiLoading, onInterpret }: AiModalProps) => {
    const [speaking, setSpeaking] = useState(false);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    useEffect(() => {
        // Pre-load voices for browsers that need it
        window.speechSynthesis.getVoices();

        return () => {
            if (speaking) {
                window.speechSynthesis.cancel();
            }
        };
    }, [speaking]);

    if (!isOpen) return null;

    const handleSpeak = () => {
        if (speaking) {
            window.speechSynthesis.cancel();
            setSpeaking(false);
            return;
        }

        if (!aiResponse) return;

        const utterance = new SpeechSynthesisUtterance(aiResponse);
        utterance.lang = "tr-TR";

        // Mistik ve akıcı bir tempo için ayarlar
        utterance.rate = 0.85; // Biras yavaşlatarak daha bilge bir hava
        utterance.pitch = 0.95; // Hafif kalınlaştırarak daha mistik bir hava

        // En iyi Türkçe sesi bulma (Google Türkçe genelde en akıcısıdır)
        const voices = window.speechSynthesis.getVoices();
        const trVoices = voices.filter(v => v.lang.includes("tr"));

        // Tercih sırası: Google > Microsoft > Diğer
        const bestVoice = trVoices.find(v => v.name.includes("Google")) ||
            trVoices.find(v => v.name.includes("Microsoft")) ||
            trVoices[0];

        if (bestVoice) utterance.voice = bestVoice;

        utterance.onend = () => setSpeaking(false);
        utterance.onerror = () => setSpeaking(false);

        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
        setSpeaking(true);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
                initial={{ opacity: 0, y: -30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -30, scale: 0.95 }}
                className="w-full max-w-lg bg-[#12111C] border border-purple-500/20 rounded-3xl shadow-2xl shadow-purple-500/10 flex flex-col max-h-[80vh] relative overflow-hidden"
            >
                {/* Decorative glow */}
                <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-purple-500/10 to-transparent pointer-events-none" />

                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-white/[0.06] shrink-0 relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500/30 to-indigo-600/20 flex items-center justify-center">
                            <Sparkles className="w-4.5 h-4.5 text-amber-300" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-white/90 uppercase tracking-wider">Mistik AI Kehaneti</h3>
                            <p className="text-[10px] text-white/30 mt-0.5">Tüm masadaki kartların birleşimi</p>
                        </div>
                    </div>
                    <button onClick={() => { if (speaking) window.speechSynthesis.cancel(); onClose(); }} className="text-white/30 hover:text-white/60 transition-colors p-1.5 hover:bg-white/5 rounded-lg">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 relative z-10">
                    {aiResponse ? (
                        <div className="space-y-5">
                            {/* Response */}
                            <div className="bg-purple-500/[0.06] border border-purple-500/15 rounded-2xl p-5">
                                <div className="flex items-center gap-2 mb-4">
                                    <Wand2 className="w-4 h-4 text-purple-400/70" />
                                    <span className="text-[11px] text-purple-400/70 font-black uppercase tracking-[0.2em]">Kehanet</span>
                                </div>
                                <p className="text-[15px] text-white/80 leading-[1.8] whitespace-pre-line tracking-wide">
                                    {aiResponse}
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <button
                                    onClick={handleSpeak}
                                    className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all border ${speaking
                                        ? "bg-amber-500/20 border-amber-500/30 text-amber-200"
                                        : "bg-white/[0.03] border-white/[0.08] text-white/50 hover:text-white/70 hover:bg-white/[0.05]"
                                        }`}
                                >
                                    {speaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                                    {speaking ? "Durdur" : "Sesli Oku"}
                                </button>

                                <button
                                    onClick={onInterpret}
                                    disabled={aiLoading}
                                    className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded-xl text-sm text-purple-200 font-semibold transition-all disabled:opacity-40"
                                >
                                    {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-amber-300" />}
                                    Yeniden Yorumla
                                </button>
                            </div>
                        </div>
                    ) : aiLoading ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-4">
                            <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center">
                                <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                            </div>
                            <p className="text-sm text-white/40 italic">Kartlar okunuyor, ruhlar fısıldıyor...</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 gap-5">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/15 to-indigo-600/10 border border-purple-500/20 flex items-center justify-center">
                                <Sparkles className="w-8 h-8 text-amber-300/60" />
                            </div>
                            <div className="text-center">
                                <p className="text-sm text-white/50 mb-1">Masadaki kartlar hazır.</p>
                                <p className="text-xs text-white/25">Tüm kartları birlikte yorumlamak için butona basın.</p>
                            </div>
                            <button
                                onClick={onInterpret}
                                disabled={aiLoading}
                                className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600/30 via-indigo-600/20 to-purple-600/30 hover:from-purple-600/40 hover:to-indigo-600/30 border border-purple-500/40 rounded-2xl text-base text-white font-bold transition-all active:scale-[0.98] shadow-lg shadow-purple-500/10 group overflow-hidden relative"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                <Sparkles className="w-5 h-5 text-amber-300" />
                                Tüm Masayı Yorumla
                            </button>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};
