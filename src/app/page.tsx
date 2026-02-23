"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn, Sparkles, Eye } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const router = useRouter();
  const [roomIdInput, setRoomIdInput] = useState("");

  const handleCreateRoom = () => {
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
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col items-center justify-center p-4 selection:bg-teal-500/30 relative overflow-hidden font-inter">

      {/* ═══ AURORA BACKGROUND ═══ */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {/* Aurora band 1 - Teal */}
        <motion.div
          animate={{ x: ['-10%', '10%', '-10%'], rotate: [0, 2, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[10%] -left-[20%] w-[140%] h-[300px] bg-gradient-to-r from-transparent via-teal-500/8 to-transparent rounded-full blur-[100px] skew-y-[-6deg]"
        />
        {/* Aurora band 2 - Cyan */}
        <motion.div
          animate={{ x: ['10%', '-10%', '10%'], rotate: [0, -1.5, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut", delay: 3 }}
          className="absolute top-[30%] -left-[10%] w-[120%] h-[250px] bg-gradient-to-r from-transparent via-cyan-400/6 to-transparent rounded-full blur-[120px] skew-y-[3deg]"
        />
        {/* Aurora band 3 - Rose (subtle) */}
        <motion.div
          animate={{ x: ['-5%', '15%', '-5%'], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 6 }}
          className="absolute bottom-[15%] -right-[20%] w-[100%] h-[200px] bg-gradient-to-r from-transparent via-rose-500/5 to-transparent rounded-full blur-[130px] skew-y-[-4deg]"
        />

        {/* Star particles */}
        {[...Array(40)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: Math.random() * 0.5 + 0.1 }}
            animate={{
              opacity: [Math.random() * 0.3, Math.random() * 0.8 + 0.2, Math.random() * 0.3],
              scale: [1, 1.3, 1]
            }}
            transition={{
              duration: Math.random() * 4 + 3,
              repeat: Infinity,
              delay: Math.random() * 6
            }}
            className="absolute rounded-full"
            style={{
              width: Math.random() * 2.5 + 1 + 'px',
              height: Math.random() * 2.5 + 1 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              backgroundColor: i % 3 === 0 ? '#5eead4' : i % 3 === 1 ? '#67e8f9' : '#e2e8f0',
              boxShadow: `0 0 ${Math.random() * 8 + 4}px currentColor`
            }}
          />
        ))}
      </div>

      {/* ═══ MAIN CONTENT ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="z-10 w-full max-w-md space-y-10 relative"
      >
        {/* Header */}
        <div className="text-center space-y-6">
          <motion.div
            whileHover={{ scale: 1.08, rotate: 3 }}
            className="mx-auto w-20 h-20 relative flex items-center justify-center"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-teal-500 to-cyan-400 rounded-2xl blur-xl opacity-25 animate-pulse-slow" />
            <div className="relative bg-[#0a1628] border border-teal-500/20 p-4 rounded-2xl shadow-[0_0_30px_rgba(20,184,166,0.15)]">
              <Eye className="w-10 h-10 text-teal-300" />
            </div>
          </motion.div>

          <div className="space-y-3">
            <h1 className="text-4xl md:text-5xl font-black tracking-widest font-cinzel text-transparent bg-clip-text bg-gradient-to-r from-teal-200 via-cyan-100 to-white">
              Mystic Tarot
            </h1>
            <p className="text-slate-400 text-base md:text-lg font-light tracking-wide max-w-xs mx-auto leading-relaxed">
              Real-time tarot readings with video, chat, and shared cards.
            </p>
          </div>
        </div>

        {/* Action Panel */}
        <div className="rounded-2xl p-7 md:p-8 space-y-6 relative overflow-hidden border border-teal-500/10 bg-[#0a1628]/50 backdrop-blur-xl shadow-[0_0_60px_rgba(20,184,166,0.06)]">
          {/* Shimmer line on top */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-400/40 to-transparent" />

          <button
            onClick={handleCreateRoom}
            className="w-full relative flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-teal-600/90 to-cyan-600/90 text-white rounded-xl font-semibold tracking-wide transition-all shadow-[0_0_20px_rgba(20,184,166,0.25)] hover:shadow-[0_0_35px_rgba(20,184,166,0.4)] hover:scale-[1.02] active:scale-[0.98] overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-teal-400/0 via-white/10 to-teal-400/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
            <Sparkles className="w-5 h-5 relative z-10" />
            <span className="relative z-10 text-base font-cinzel tracking-widest uppercase">Begin Reading</span>
          </button>

          <div className="relative flex items-center">
            <div className="flex-grow border-t border-slate-700/50" />
            <span className="flex-shrink-0 mx-4 text-[10px] font-medium uppercase tracking-[0.2em] text-slate-500">
              or join existing
            </span>
            <div className="flex-grow border-t border-slate-700/50" />
          </div>

          <form onSubmit={handleJoinRoom} className="space-y-4">
            <div className="relative group/input">
              <input
                id="roomId"
                type="text"
                value={roomIdInput}
                onChange={(e) => setRoomIdInput(e.target.value)}
                placeholder="Paste Room ID here..."
                className="w-full bg-[#030712]/80 border border-slate-700/50 rounded-xl px-5 py-3.5 text-center placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-500/50 focus:border-teal-500/40 transition-all font-mono text-base shadow-inner text-slate-200"
              />
            </div>

            <button
              type="submit"
              disabled={!roomIdInput.trim()}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-amber-500/10 text-amber-200 rounded-xl font-medium tracking-wide transition-all border border-amber-500/25 hover:bg-amber-500/20 hover:border-amber-400/40 hover:text-amber-100 disabled:opacity-25 disabled:cursor-not-allowed backdrop-blur-sm"
            >
              <LogIn className="w-5 h-5" />
              <span className="text-base font-cinzel uppercase tracking-widest">Join Room</span>
            </button>
          </form>
        </div>

        <p className="text-center text-[10px] text-slate-600 font-mono tracking-[0.15em] uppercase">
          WebRTC · Socket.io · Real-time
        </p>
      </motion.div>
    </div>
  );
}
