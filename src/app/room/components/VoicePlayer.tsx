"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause } from "lucide-react";

interface VoicePlayerProps {
    src: string;
    isMine: boolean;
}

export const VoicePlayer = ({ src, isMine }: VoicePlayerProps) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const animRef = useRef<number>(0);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleLoaded = () => setDuration(audio.duration);
        const handleEnded = () => {
            setIsPlaying(false);
            setProgress(0);
            setCurrentTime(0);
            cancelAnimationFrame(animRef.current);
        };

        audio.addEventListener("loadedmetadata", handleLoaded);
        audio.addEventListener("ended", handleEnded);
        return () => {
            audio.removeEventListener("loadedmetadata", handleLoaded);
            audio.removeEventListener("ended", handleEnded);
            cancelAnimationFrame(animRef.current);
        };
    }, []);

    const updateProgress = () => {
        const audio = audioRef.current;
        if (!audio) return;
        setCurrentTime(audio.currentTime);
        setProgress((audio.currentTime / audio.duration) * 100 || 0);
        if (!audio.paused) {
            animRef.current = requestAnimationFrame(updateProgress);
        }
    };

    const togglePlay = () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying) {
            audio.pause();
            cancelAnimationFrame(animRef.current);
        } else {
            audio.play();
            animRef.current = requestAnimationFrame(updateProgress);
        }
        setIsPlaying(!isPlaying);
    };

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        const audio = audioRef.current;
        if (!audio || !duration) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        audio.currentTime = percent * duration;
        setProgress(percent * 100);
        setCurrentTime(audio.currentTime);
    };

    const formatTime = (seconds: number) => {
        if (!seconds || !isFinite(seconds)) return "0:00";
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, "0")}`;
    };

    // Generate fake waveform bars
    const bars = Array.from({ length: 28 }, (_, i) => {
        const seed = (i * 7 + 3) % 13;
        return 20 + (seed / 13) * 80;
    });

    const accentColor = isMine ? "bg-purple-400" : "bg-emerald-400";
    const accentText = isMine ? "text-purple-300" : "text-emerald-300";

    return (
        <div className="flex items-center gap-2.5 min-w-[180px] sm:min-w-[210px]">
            <audio ref={audioRef} src={src} preload="metadata" />

            {/* Play/Pause Button */}
            <button
                onClick={togglePlay}
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all ${isMine
                        ? "bg-purple-500/30 hover:bg-purple-500/50 text-purple-200"
                        : "bg-emerald-500/30 hover:bg-emerald-500/50 text-emerald-200"
                    }`}
            >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
            </button>

            {/* Waveform + Progress */}
            <div className="flex-1 flex flex-col gap-1">
                <div
                    className="flex items-end gap-[2px] h-5 cursor-pointer"
                    onClick={handleSeek}
                >
                    {bars.map((height, i) => {
                        const barPercent = (i / bars.length) * 100;
                        const isActive = barPercent <= progress;
                        return (
                            <div
                                key={i}
                                className={`w-[2.5px] rounded-full transition-all duration-150 ${isActive ? accentColor : "bg-white/15"
                                    } ${isPlaying && isActive ? "animate-pulse" : ""}`}
                                style={{ height: `${height}%` }}
                            />
                        );
                    })}
                </div>
                <div className="flex items-center justify-between">
                    <span className={`text-[9px] font-mono ${accentText} opacity-70`}>
                        {formatTime(isPlaying || currentTime > 0 ? currentTime : duration)}
                    </span>
                    {duration > 0 && currentTime > 0 && (
                        <span className="text-[9px] font-mono text-white/30">
                            {formatTime(duration)}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};
