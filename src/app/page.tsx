"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Plus, LogIn, Sparkles } from "lucide-react";
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
    <div className="min-h-screen bg-neutral-950 text-neutral-50 flex flex-col items-center justify-center p-4 selection:bg-purple-500/30">
      {/* Background Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[128px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="z-10 w-full max-w-md space-y-8"
      >
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-purple-500/20 mb-6">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
            Mystic Tarot
          </h1>
          <p className="text-neutral-400 text-lg">
            Connect and read the cards together in real-time.
          </p>
        </div>

        <div className="bg-neutral-900/50 backdrop-blur-xl border border-neutral-800 rounded-3xl p-8 shadow-2xl space-y-6">
          <button
            onClick={handleCreateRoom}
            className="w-full group relative inline-flex items-center justify-center gap-2 px-6 py-4 bg-white text-neutral-950 rounded-xl font-medium transition-all hover:bg-neutral-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-5 h-5 transition-transform group-hover:rotate-90" />
            Create New Room
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-neutral-800" />
            </div>
            <div className="relative flex justify-center text-sm uppercase">
              <span className="bg-neutral-950 px-4 text-neutral-500 font-medium tracking-widest">
                or
              </span>
            </div>
          </div>

          <form onSubmit={handleJoinRoom} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="roomId" className="text-sm font-medium text-neutral-400 ml-1">
                Join Existing Room
              </label>
              <div className="relative">
                <input
                  id="roomId"
                  type="text"
                  value={roomIdInput}
                  onChange={(e) => setRoomIdInput(e.target.value)}
                  placeholder="Enter Room ID"
                  className="w-full bg-neutral-950/50 border border-neutral-800 rounded-xl px-4 py-3 placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all font-mono"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={!roomIdInput.trim()}
              className="w-full group inline-flex items-center justify-center gap-2 px-6 py-4 bg-neutral-800 text-white rounded-xl font-medium transition-all hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed hover:disabled:transform-none"
            >
              <LogIn className="w-5 h-5" />
              Join Room
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
