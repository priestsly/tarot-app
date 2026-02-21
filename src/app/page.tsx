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
    <div className="min-h-screen bg-void text-neutral-50 flex flex-col items-center justify-center p-4 selection:bg-nebula/30 relative overflow-hidden font-inter">

      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[10%] left-[20%] w-[500px] h-[500px] bg-nebula/20 rounded-full blur-[120px] mix-blend-screen"
        />
        <motion.div
          animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-[10%] right-[10%] w-[600px] h-[600px] bg-ethereal/10 rounded-full blur-[150px] mix-blend-screen"
        />
        <motion.div
          animate={{ y: [0, -30, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[40%] right-[30%] w-[300px] h-[300px] bg-mystic/5 rounded-full blur-[100px] mix-blend-screen"
        />

        {/* Floating Stars */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: Math.random(), scale: Math.random() * 0.5 + 0.5 }}
            animate={{
              opacity: [Math.random(), 1, Math.random()],
              y: [0, -20, 0]
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
              boxShadow: '0 0 10px rgba(255,255,255,0.8)'
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
            className="mx-auto w-20 h-20 relative flex items-center justify-center"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-nebula to-mystic rounded-3xl blur-xl opacity-50 animate-pulse-slow" />
            <div className="relative bg-[#0f0f1a] border border-white/20 p-4 rounded-3xl shadow-2xl backdrop-blur-xl">
              <Moon className="w-10 h-10 text-mystic" />
            </div>
            <Star className="absolute -top-2 -right-2 w-6 h-6 text-ethereal animate-pulse" />
          </motion.div>

          <div className="space-y-2">
            <h1 className="text-5xl md:text-6xl font-black tracking-widest font-cinzel bg-gradient-to-br from-white via-[#e2e8f0] to-[#94a3b8] bg-clip-text text-transparent drop-shadow-2xl">
              Mystic Tarot
            </h1>
            <p className="text-neutral-400 text-lg md:text-xl font-light tracking-wide max-w-sm mx-auto">
              Seek answers in the stars. Connect and read the cards in real-time.
            </p>
          </div>
        </div>

        {/* Action Panel */}
        <div className="glass-panel rounded-[2rem] p-8 md:p-10 space-y-8 relative overflow-hidden group">
          {/* Subtle inner glow */}
          <div className="absolute -inset-1 bg-gradient-to-r from-nebula/0 via-ethereal/10 to-nebula/0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 blur-xl pointer-events-none" />

          <button
            onClick={handleCreateRoom}
            className="w-full relative inline-flex items-center justify-center gap-3 px-8 py-5 bg-gradient-to-r from-nebula to-purple-800 text-white rounded-2xl font-semibold tracking-wide transition-all shadow-lg hover:shadow-nebula/50 hover:scale-[1.02] active:scale-[0.98] border border-white/10 overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full hover:translate-y-0 transition-transform duration-300 ease-in-out" />
            <Sparkles className="w-5 h-5 text-mystic relative z-10" />
            <span className="relative z-10 text-lg">Create New Reading Room</span>
          </button>

          <div className="relative flex items-center">
            <div className="flex-grow border-t border-white/10" />
            <span className="flex-shrink-0 mx-4 text-xs font-medium uppercase tracking-widest text-neutral-500">
              Enter the Void
            </span>
            <div className="flex-grow border-t border-white/10" />
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
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-center placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-ethereal/50 focus:border-ethereal/50 transition-all font-mono text-lg shadow-inner"
                />
                <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-r from-ethereal/0 via-ethereal/20 to-ethereal/0 opacity-0 group-focus-within/input:opacity-100 transition-opacity blur-md" />
              </div>
            </div>

            <button
              type="submit"
              disabled={!roomIdInput.trim()}
              className="w-full inline-flex items-center justify-center gap-3 px-8 py-5 bg-white/5 text-white rounded-2xl font-medium tracking-wide transition-all border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed hover:disabled:transform-none backdrop-blur-sm"
            >
              <LogIn className="w-5 h-5 text-neutral-400" />
              <span className="text-lg text-neutral-200">Join Room</span>
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
