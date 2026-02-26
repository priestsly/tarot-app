import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';

interface VoiceMessageProps {
    audioUrl: string;
}

export const VoiceMessage = ({ audioUrl }: VoiceMessageProps) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleTimeUpdate = () => {
        if (!audioRef.current) return;
        const current = audioRef.current.currentTime;
        const duration = audioRef.current.duration;
        if (duration) {
            setProgress((current / duration) * 100);
        }
    };

    const handleEnd = () => {
        setIsPlaying(false);
        setProgress(0);
    };

    return (
        <div className="flex items-center gap-3 bg-[#202c33] px-3 py-2 rounded-xl min-w-[180px] sm:min-w-[220px] group border border-white/5 shadow-inner">
            <button
                onClick={togglePlay}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-accent/20 text-accent hover:bg-accent/30 transition-all active:scale-95"
            >
                {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
            </button>

            <div className="flex-1 flex flex-col gap-1.5">
                {/* Wave-ish bars (visual effect) */}
                <div className="flex items-end gap-[2px] h-4">
                    {[...Array(20)].map((_, i) => (
                        <div
                            key={i}
                            className={`w-[2px] bg-accent/30 rounded-full transition-all ${isPlaying ? 'animate-pulse' : ''
                                }`}
                            style={{
                                height: `${30 + Math.random() * 70}%`,
                                opacity: progress > (i / 20) * 100 ? 1 : 0.3,
                                backgroundColor: progress > (i / 20) * 100 ? '#7cffdf' : 'rgba(124, 255, 223, 0.3)'
                            }}
                        />
                    ))}
                </div>

                {/* Visual Progress Bar */}
                <div className="relative w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <div
                        className="absolute h-full bg-accent transition-all duration-100 ease-linear"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            <div className="flex flex-col items-end gap-1">
                <Volume2 className="w-3.5 h-3.5 text-text-muted/40" />
                <span className="text-[10px] text-text-muted/40 font-mono">
                    {audioRef.current ? Math.floor(audioRef.current.duration || 0) : '0'}:{(audioRef.current ? Math.floor(audioRef.current.duration || 0) % 60 : 0).toString().padStart(2, '0')}
                </span>
            </div>

            <audio
                ref={audioRef}
                src={audioUrl}
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleEnd}
                className="hidden"
            />
        </div>
    );
};
