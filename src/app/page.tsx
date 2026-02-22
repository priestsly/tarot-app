"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Plus, LogIn, Sparkles, Moon, Star } from "lucide-react";
import { motion } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Home() {
  const router = useRouter();
  const [roomIdInput, setRoomIdInput] = useState("");

  const handleCreateRoom = () => {
    // Generate a simple readable room ID like tarot-xxxx
    const id = "tarot-" + Math.random().toString(36).substring(2, 6);
    router.push(`/room/${id}`);
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomIdInput.trim()) {
      router.push(`/room/${roomIdInput.trim()}`);
    }
  };

  return (
    <div className="min-h-screen bg-obsidian text-neutral-50 flex flex-col items-center justify-center p-4 selection:bg-gold/30 relative overflow-hidden font-inter">

      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[5%] left-[10%] w-[600px] h-[600px] bg-gold-light/10 rounded-full blur-[140px] mix-blend-screen"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-[5%] right-[5%] w-[700px] h-[700px] bg-emerald/10 rounded-full blur-[160px] mix-blend-screen"
        />
        <motion.div
          animate={{ y: [0, -40, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[35%] right-[25%] w-[400px] h-[400px] bg-crimson/10 rounded-full blur-[120px] mix-blend-screen"
        />

        {/* Floating Sparks (Gold/White) */}
        {[...Array(25)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: Math.random(), scale: Math.random() * 0.5 + 0.5 }}
            animate={{
              opacity: [Math.random(), 1, Math.random()],
              y: [0, -30, 0]
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              delay: Math.random() * 5
            }}
            className="absolute rounded-full bg-white"
            style={{
              width: Math.random() * 3 + 'px',
              height: Math.random() * 3 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              backgroundColor: Math.random() > 0.5 ? '#D4AF37' : '#FFFFFF',
              boxShadow: '0 0 12px rgba(212,175,55,0.8)'
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="z-10 w-full max-w-lg space-y-10 relative"
      >
        {/* Header Section */}
        <div className="text-center space-y-6">
          <motion.div
            whileHover={{ scale: 1.05, rotate: 5 }}
            className="mx-auto w-24 h-24 relative flex items-center justify-center"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-gold to-crimson rounded-[2rem] blur-xl opacity-30 animate-pulse-slow" />
            <div className="relative bg-charcoal border border-gold/20 p-5 rounded-[2rem] shadow-2xl backdrop-blur-xl">
              <Moon className="w-12 h-12 text-gold" />
            </div>
            <Star className="absolute -top-3 -right-3 w-8 h-8 text-gold-light animate-pulse" />
          </motion.div>

          <div className="space-y-3">
            <h1 className="text-5xl md:text-6xl font-black tracking-widest font-cinzel bg-gradient-to-br from-[#FDF5E6] via-gold to-[#B8860B] bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(212,175,55,0.3)]">
              Mystic Tarot
            </h1>
            <p className="text-neutral-400 text-lg md:text-xl font-light tracking-wide max-w-sm mx-auto">
              Seek answers in the dark. Connect and read the cards in real-time.
            </p>
          </div>
        </div>

        {/* Action Panel */}
        <div className="glass-panel rounded-[2rem] p-8 md:p-10 space-y-8 relative overflow-hidden group">
          {/* Subtle inner gold glow */}
          <div className="absolute -inset-1 bg-gradient-to-r from-gold/0 via-gold/10 to-gold/0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 blur-xl pointer-events-none" />

          <button
            onClick={handleCreateRoom}
            className="w-full relative inline-flex items-center justify-center gap-3 px-8 py-5 bg-gradient-to-r from-charcoal to-[#1a1710] text-gold-light rounded-2xl font-semibold tracking-wide transition-all shadow-xl hover:shadow-[0_0_25px_rgba(212,175,55,0.4)] hover:scale-[1.02] active:scale-[0.98] border border-gold/30 hover:border-gold overflow-hidden"
          >
            <div className="absolute inset-0 bg-gold/10 translate-y-full hover:translate-y-0 transition-transform duration-300 ease-in-out" />
            <Sparkles className="w-5 h-5 text-gold relative z-10" />
            <span className="relative z-10 text-lg font-cinzel tracking-widest uppercase">Begin Reading</span>
          </button>

          <div className="relative flex items-center">
            <div className="flex-grow border-t border-white/5" />
            <span className="flex-shrink-0 mx-4 text-[10px] font-medium uppercase tracking-[0.2em] text-neutral-500">
              Or Enter The Void
            </span>
            <div className="flex-grow border-t border-white/5" />
          </div>

          <form onSubmit={handleJoinRoom} className="space-y-5">
            <div className="space-y-3">
              <label htmlFor="roomId" className="hidden text-sm font-medium text-neutral-400 ml-1">
                Room ID
              </label>
              <div className="relative group/input">
                <input
                  id="roomId"
                  type="text"
                  value={roomIdInput}
                  onChange={(e) => setRoomIdInput(e.target.value)}
                  placeholder="Paste Room ID here..."
                  className="w-full bg-obsidian/60 border border-white/10 rounded-2xl px-6 py-4 text-center placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-gold/50 focus:border-gold/50 transition-all font-mono text-lg shadow-inner text-gold-light"
                />
                <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-r from-gold/0 via-gold/10 to-gold/0 opacity-0 group-focus-within/input:opacity-100 transition-opacity blur-md" />
              </div>
            </div>

            <button
              type="submit"
              disabled={!roomIdInput.trim()}
              className="w-full inline-flex items-center justify-center gap-3 px-8 py-5 bg-white/5 text-neutral-300 rounded-2xl font-medium tracking-wide transition-all border border-white/10 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:disabled:transform-none backdrop-blur-sm"
            >
              <LogIn className="w-5 h-5 text-neutral-400 group-hover:text-white" />
              <span className="text-lg font-cinzel uppercase tracking-widest">Join Room</span>
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-neutral-600 font-mono tracking-widest uppercase">
          Powered by WebRTC & Socket.io
        </p>
      </motion.div>
    </div>
  );
}
