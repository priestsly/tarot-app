"use client";

import { use, useEffect, useState, useRef, useCallback } from "react";
import { Copy, PlusSquare, ArrowLeft, Mic, MicOff, Video, VideoOff, Menu, X, Sparkles, Activity, MousePointer2, MessageCircle, Send, Trash2, ChevronUp, ChevronDown, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import Peer from "peerjs";
import TarotCard, { CardState } from "@/components/TarotCard";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

let socket: Socket;

export default function RoomPage({ params }: { params: Promise<{ roomId: string }> }) {
    const router = useRouter();
    const roomId = use(params).roomId;

    const [copied, setCopied] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Real-time State
    const [cards, setCards] = useState<CardState[]>([]);
    const [maxZIndex, setMaxZIndex] = useState(1);

    // Premium UI State
    interface ActivityLog { id: string; message: string; timestamp: string; userId: string; }
    interface CursorData { x: number; y: number; }
    interface ChatMessage { id: string; sender: string; text: string; timestamp: string; }

    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [cursors, setCursors] = useState<Record<string, CursorData>>({});
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState("");
    const [isChatOpen, setIsChatOpen] = useState(false);

    const lastCursorEmit = useRef<number>(0);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isChatOpen) scrollToBottom();
    }, [messages, isChatOpen]);

    const appendLog = useCallback((message: string) => {
        const logEntry: ActivityLog = {
            id: Math.random().toString(36).substring(2, 9),
            message,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            userId: socket?.id || "Unknown"
        };
        socket?.emit("activity-log", roomId, logEntry);
    }, [roomId]);

    // WebRTC & Audio/Video State
    const [myPeerId, setMyPeerId] = useState<string>("");
    const [remotePeerId, setRemotePeerId] = useState<string>("");
    const myVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const peerRef = useRef<Peer | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [isVideoBarVisible, setIsVideoBarVisible] = useState(true);

    const tableRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // 1. Initialize Socket
        socket = io();

        // Helper: Initialize PeerJS and setup event listeners once we have a stream (real or dummy)
        const initPeerAndJoin = (mediaStream: MediaStream) => {
            peerRef.current = new Peer({
                config: {
                    iceServers: [
                        { urls: 'stun:stun.l.google.com:19302' },
                        { urls: 'stun:global.stun.twilio.com:3478' }
                    ]
                }
            });

            peerRef.current.on('open', (id) => {
                setMyPeerId(id);
                console.log('My peer ID is: ' + id);
                socket.emit("join-room", roomId, id);
            });

            // Answer incoming calls
            peerRef.current.on('call', call => {
                call.answer(mediaStream);
                call.on('stream', remoteStream => {
                    console.log("Received remote stream (answering)", remoteStream.id);
                    if (remoteVideoRef.current && remoteVideoRef.current.srcObject !== remoteStream) {
                        remoteVideoRef.current.srcObject = remoteStream;
                        remoteVideoRef.current.onloadedmetadata = () => {
                            remoteVideoRef.current?.play().catch(e => {
                                console.error("Play error:", e);
                                if (e.name === 'NotAllowedError' && remoteVideoRef.current) {
                                    // Browser blocked autoplay (likely because it has audio and user hasn't interacted).
                                    // Mute it temporarily to force video playback, user can unmute later.
                                    remoteVideoRef.current.muted = true;
                                    remoteVideoRef.current.play().catch(console.error);
                                }
                            });
                        };
                    }
                });
            });

            // Listen for new users connecting
            socket.on("user-connected", (userId: string) => {
                console.log("User connected:", userId);
                setRemotePeerId(userId);
                connectToNewUser(userId, mediaStream);
            });
        };

        // 2. Setup User Media (Camera/Mic) FIRST
        navigator.mediaDevices.getUserMedia({
            video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
            audio: true
        })
            .then(stream => {
                streamRef.current = stream;
                if (myVideoRef.current) {
                    myVideoRef.current.srcObject = stream;
                }
                initPeerAndJoin(stream);
            })
            .catch(err => {
                console.error("Failed to get local stream", err);

                // Fallback: Create a dummy stream with a black canvas and silent audio.
                // This forces PeerJS to negotiate WebRTC video/audio tracks in the SDP so it can still RECEIVE video from others!
                try {
                    const canvas = document.createElement("canvas");
                    canvas.width = 640;
                    canvas.height = 480;
                    const ctx = canvas.getContext("2d");
                    if (ctx) {
                        ctx.fillStyle = "black";
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                    }
                    const videoStream = (canvas as any).captureStream(1); // 1 FPS

                    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
                    const destNode = audioCtx.createMediaStreamDestination();

                    const dummyStream = new MediaStream([
                        ...videoStream.getVideoTracks(),
                        ...destNode.stream.getAudioTracks()
                    ]);

                    // Disable tracks so they send black/silent frames instead of nonsense
                    dummyStream.getTracks().forEach(t => t.enabled = false);
                    streamRef.current = dummyStream;

                    initPeerAndJoin(dummyStream);
                } catch (fallbackErr) {
                    console.error("Fallback dummy stream creation failed", fallbackErr);
                    initPeerAndJoin(new MediaStream());
                }
            });

        // Handle user disconnect
        socket.on("user-disconnected", (userId: string) => {
            console.log("User disconnected:", userId);
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = null;
            }
            setRemotePeerId("");
            setCursors(prev => {
                const next = { ...prev };
                delete next[userId];
                return next;
            });
        });

        // ========== PREMIUM FEATURES SYNC ==========
        socket.on("sync-logs", (serverLogs: ActivityLog[]) => {
            if (serverLogs) setLogs(serverLogs);
        });

        socket.on("sync-messages", (serverMsgs: ChatMessage[]) => {
            if (serverMsgs) setMessages(serverMsgs);
        });

        socket.on("chat-message", (msg: ChatMessage) => {
            setMessages(prev => {
                const newMsgs = [...prev, msg];
                if (newMsgs.length > 100) newMsgs.shift();
                return newMsgs;
            });
        });

        socket.on("activity-log", (logEntry: ActivityLog) => {
            setLogs(prev => {
                const newLogs = [...prev, logEntry];
                if (newLogs.length > 50) newLogs.shift();
                return newLogs;
            });
        });

        socket.on("cursor-move", (cursorData: { userId: string; x: number; y: number }) => {
            setCursors(prev => ({ ...prev, [cursorData.userId]: { x: cursorData.x, y: cursorData.y } }));
        });

        // ========== TAROT STATE SYNC ==========
        socket.on("sync-state", (serverCards: CardState[]) => {
            setCards(serverCards);
            const topZ = Math.max(0, ...serverCards.map(c => c.zIndex));
            setMaxZIndex(topZ + 1);
        });

        socket.on("card-added", (newCard: CardState) => {
            setCards(prev => {
                // Prevent duplicate adds if we emitted it ourselves
                if (prev.some(c => c.id === newCard.id)) return prev;
                return [...prev, newCard];
            });
            setMaxZIndex(prev => Math.max(prev, newCard.zIndex + 1));
        });

        socket.on("card-updated", (updatedCard: CardState) => {
            setCards(prev => prev.map(c => c.id === updatedCard.id ? updatedCard : c));
            setMaxZIndex(prev => Math.max(prev, updatedCard.zIndex + 1));
        });

        socket.on("card-flipped", (cardId: string, isReversed: boolean, isFlipped: boolean) => {
            setCards(prev => prev.map(c =>
                c.id === cardId ? { ...c, isReversed, isFlipped } : c
            ));
        });

        return () => {
            socket.disconnect();
            peerRef.current?.destroy();
            const tracks = streamRef.current?.getTracks();
            tracks?.forEach(track => track.stop());
        };
    }, [roomId]);

    function connectToNewUser(userId: string, stream: MediaStream) {
        if (!peerRef.current || !stream) return;
        console.log("Calling user", userId);

        const call = peerRef.current.call(userId, stream);

        call.on('stream', remoteStream => {
            console.log("Received remote stream (calling)", remoteStream.id);
            if (remoteVideoRef.current && remoteVideoRef.current.srcObject !== remoteStream) {
                remoteVideoRef.current.srcObject = remoteStream;
                // Ensure playback starts
                remoteVideoRef.current.onloadedmetadata = () => {
                    remoteVideoRef.current?.play().catch(e => {
                        console.error("Play error:", e);
                        if (e.name === 'NotAllowedError' && remoteVideoRef.current) {
                            // Browser blocked autoplay. Mute to force video playback.
                            remoteVideoRef.current.muted = true;
                            remoteVideoRef.current.play().catch(console.error);
                        }
                    });
                };
            }
        });
    }

    const copyRoomId = () => {
        navigator.clipboard.writeText(roomId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const toggleMute = () => {
        if (streamRef.current) {
            const audioTrack = streamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMuted(!audioTrack.enabled);
            }
        }
    };

    const toggleVideo = () => {
        if (streamRef.current) {
            const videoTrack = streamRef.current.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoOff(!videoTrack.enabled);
            }
        }
    };

    // ========== TAROT INTERACTIONS ==========

    const handleClearTable = () => {
        appendLog("Cleared the mystical table");
        setCards([]);
        socket.emit("clear-table", roomId);
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatInput.trim()) return;

        const msg: ChatMessage = {
            id: Math.random().toString(36).substring(2, 9),
            sender: "Seeker",
            text: chatInput.trim(),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, msg]);
        socket.emit("chat-message", roomId, msg);
        setChatInput("");
    };

    const handleDrawCard = () => {
        appendLog("Drew a mysterious card from the aether");
        const newCard: CardState = {
            id: Math.random().toString(36).substring(2, 9),
            cardIndex: Math.floor(Math.random() * 78), // 0-77
            x: 50, // Bottom center dealing
            y: 80 + Math.random() * 5, // Slight jitter
            isFlipped: false,
            isReversed: false,
            zIndex: maxZIndex
        };
        setMaxZIndex(prev => prev + 1);

        // Optimistic update
        setCards(prev => [...prev, newCard]);
        socket.emit("add-card", roomId, newCard);
    };

    const handleThreeCardSpread = () => {
        appendLog("Manifested a 3-Card Spread (Past, Present, Future)");
        const spread: CardState[] = [
            { id: Math.random().toString(36).substring(2, 9), cardIndex: Math.floor(Math.random() * 78), x: 20, y: 40, zIndex: maxZIndex + 1, isFlipped: false, isReversed: Math.random() > 0.5 },
            { id: Math.random().toString(36).substring(2, 9), cardIndex: Math.floor(Math.random() * 78), x: 50, y: 40, zIndex: maxZIndex + 2, isFlipped: false, isReversed: Math.random() > 0.5 },
            { id: Math.random().toString(36).substring(2, 9), cardIndex: Math.floor(Math.random() * 78), x: 80, y: 40, zIndex: maxZIndex + 3, isFlipped: false, isReversed: Math.random() > 0.5 }
        ];
        setMaxZIndex(prev => prev + 3);
        const newCards = [...cards, ...spread];
        setCards(newCards);
        socket.emit("sync-all-cards", roomId, newCards);
    };

    const handlePointerDown = useCallback((id: string) => {
        const newZ = maxZIndex + 1;
        setMaxZIndex(newZ);
        setCards(prev => {
            const next = prev.map(c => c.id === id ? { ...c, zIndex: newZ } : c);
            const updatedCard = next.find(c => c.id === id);
            if (updatedCard) socket.emit("update-card", roomId, updatedCard);
            return next;
        });
    }, [maxZIndex, roomId]);

    const handleDragEnd = useCallback((id: string, percentX: number, percentY: number) => {
        setCards(prev => {
            const next = prev.map(c => c.id === id ? { ...c, x: percentX, y: percentY } : c);
            const updatedCard = next.find(c => c.id === id);
            if (updatedCard) socket.emit("update-card", roomId, updatedCard);
            return next;
        });
    }, [roomId]);

    const handleFlipEnd = useCallback((id: string, isReversed: boolean, isFlipped: boolean) => {
        if (isFlipped) appendLog("Revealed a card's destiny");
        setCards(prev => prev.map(c => c.id === id ? { ...c, isReversed, isFlipped } : c));
        socket.emit("flip-card", roomId, id, isReversed, isFlipped);
    }, [roomId, appendLog]);

    return (
        <div className="flex flex-col h-screen bg-[#030712] text-slate-100 overflow-hidden font-inter relative">

            {/* ═══════════════ ANIMATED BACKGROUND ═══════════════ */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                {/* Aurora band - Teal */}
                <div className="absolute top-[5%] -left-[20%] w-[140%] h-[250px] bg-gradient-to-r from-transparent via-teal-500/5 to-transparent rounded-full blur-[100px] skew-y-[-4deg] animate-aurora" />
                {/* Aurora band - Cyan */}
                <div className="absolute top-[40%] -right-[10%] w-[120%] h-[200px] bg-gradient-to-r from-transparent via-cyan-400/4 to-transparent rounded-full blur-[120px] skew-y-[3deg] animate-aurora" style={{ animationDelay: '5s' }} />
            </div>

            {/* ═══════════════ TOP: VIDEO STRIP ═══════════════ */}
            <div className="relative z-30 flex-shrink-0 bg-[#0a1628]/80 border-b border-teal-500/15 backdrop-blur-xl shadow-2xl transition-all duration-500 ease-in-out">
                {/* Video Bar Content */}
                <div className={cn(
                    "transition-all duration-500 ease-out overflow-hidden flex",
                    isVideoBarVisible ? "max-h-[220px] opacity-100 p-3" : "max-h-0 opacity-0 p-0"
                )}>
                    <div className="flex flex-1 max-w-4xl mx-auto gap-3 items-stretch justify-center h-full">
                        {/* Remote Video */}
                        <div className="flex-1 relative group overflow-hidden rounded-xl border border-teal-500/15 bg-[#030712] aspect-video shadow-[0_0_20px_rgba(20,184,166,0.08)]">
                            <div className="absolute -inset-1 bg-gradient-to-r from-teal-500/15 to-cyan-500/15 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-700 pointer-events-none" />
                            <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover relative z-10" />
                            <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                                <span className="text-xs text-slate-500/50 font-mono tracking-[0.2em] animate-pulse">Awaiting connection...</span>
                            </div>
                            <div className="absolute bottom-2 left-3 z-20 px-3 py-1 bg-black/60 rounded-md text-[9px] text-teal-200 font-mono tracking-widest uppercase backdrop-blur-md border border-teal-500/20">
                                Remote
                            </div>
                        </div>

                        {/* Local Video */}
                        <div className="flex-1 relative group overflow-hidden rounded-xl border border-teal-500/15 bg-[#030712] aspect-video shadow-[0_0_20px_rgba(20,184,166,0.08)]">
                            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400/15 to-teal-400/15 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-700 pointer-events-none" />
                            <video ref={myVideoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1] relative z-10" />
                            <div className="absolute bottom-2 left-3 z-20 px-3 py-1 bg-black/60 rounded-md text-[9px] text-cyan-200 font-mono tracking-widest uppercase backdrop-blur-md border border-cyan-500/20">
                                You
                            </div>
                        </div>

                        {/* Controls Column */}
                        <div className="flex flex-col justify-center gap-2 pl-2 border-l border-teal-500/15">
                            <button onClick={toggleMute} className={cn("p-3 rounded-xl transition-all border shadow-lg", isMuted ? "bg-rose-500/20 text-rose-400 border-rose-500/40" : "bg-[#0a1628]/50 text-slate-300 border-slate-600/30 hover:bg-[#0a1628] hover:border-teal-400/40")} title={isMuted ? 'Unmute' : 'Mute'}>
                                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                            </button>
                            <button onClick={toggleVideo} className={cn("p-3 rounded-xl transition-all border shadow-lg", isVideoOff ? "bg-rose-500/20 text-rose-400 border-rose-500/40" : "bg-[#0a1628]/50 text-slate-300 border-slate-600/30 hover:bg-[#0a1628] hover:border-teal-400/40")} title={isVideoOff ? 'Enable Camera' : 'Disable Camera'}>
                                {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Video Toggle Button */}
                <button
                    onClick={() => setIsVideoBarVisible(!isVideoBarVisible)}
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full z-40 px-6 py-1.5 bg-[#0a1628]/90 backdrop-blur-xl border border-t-0 border-teal-500/15 rounded-b-xl text-slate-400 hover:text-teal-300 transition-all flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] shadow-lg font-bold"
                >
                    {isVideoBarVisible ? <><ChevronUp className="w-3 h-3" />Hide Vision</> : <><ChevronDown className="w-3 h-3" />Show Vision</>}
                </button>
            </div>

            {/* ═══════════════ MIDDLE: MAIN CONTENT ═══════════════ */}
            <div className="flex flex-1 min-h-0 relative z-10">

                {/* Mobile Menu Toggle */}
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="md:hidden absolute top-3 left-3 z-50 p-2.5 bg-black/50 backdrop-blur-md rounded-xl text-slate-300 hover:text-white transition-colors border border-slate-500/30"
                >
                    {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>

                {/* Card Counter Badge */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 px-4 py-1.5 bg-[#0a1628]/60 backdrop-blur-md border border-teal-500/20 rounded-full flex items-center gap-2 shadow-[0_0_15px_rgba(20,184,166,0.08)]">
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                    <span className="text-[10px] text-slate-200 font-mono tracking-widest uppercase font-bold">Cards: {cards.length}</span>
                </div>

                {/* Mobile Sidebar Overlay */}
                {isSidebarOpen && (
                    <div
                        className="md:hidden fixed inset-0 bg-black/80 z-40 backdrop-blur-md"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}

                {/* Compact Floating Chat Panel */}
                {isChatOpen && (
                    <div className="fixed bottom-4 right-4 z-50 w-80 max-h-[320px] bg-[#0a1628]/95 backdrop-blur-2xl border border-teal-500/15 rounded-2xl shadow-[0_10px_50px_rgba(0,0,0,0.7)] flex flex-col overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-2.5 border-b border-teal-500/10">
                            <span className="text-xs text-slate-300 font-semibold tracking-widest uppercase flex items-center gap-1.5">
                                <MessageCircle className="w-3.5 h-3.5 text-teal-400" />
                                Whispers
                            </span>
                            <button onClick={() => setIsChatOpen(false)} className="text-slate-500 hover:text-slate-200 transition-colors p-0.5">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Messages (compact, show last few) */}
                        <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[180px] scrollbar-hide">
                            {messages.length === 0 && (
                                <p className="text-[10px] text-slate-500 text-center py-4 font-mono tracking-widest uppercase">No whispers yet...</p>
                            )}
                            {messages.slice(-10).map(msg => (
                                <div key={msg.id} className="flex gap-2 items-start">
                                    <span className={cn("text-[10px] font-bold shrink-0 mt-0.5", msg.sender === "Seeker" ? "text-teal-400" : "text-amber-400")}>{msg.sender === "Seeker" ? "You" : "Them"}</span>
                                    <p className="text-xs text-slate-300 leading-relaxed">{msg.text}</p>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <form onSubmit={handleSendMessage} className="flex items-center gap-2 p-2.5 border-t border-teal-500/10 bg-black/30">
                            <input
                                type="text"
                                value={chatInput}
                                onChange={e => setChatInput(e.target.value)}
                                placeholder="Type a whisper..."
                                autoFocus
                                className="flex-1 bg-[#030712]/80 border border-slate-700/40 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-teal-500/40 transition-colors placeholder:text-slate-500"
                            />
                            <button
                                type="submit"
                                disabled={!chatInput.trim()}
                                className="p-2 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/30 hover:bg-teal-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                <Send className="w-3.5 h-3.5" />
                            </button>
                        </form>
                    </div>
                )}

                {/* ── SIDEBAR (LEFT PANEL) ── */}
                <aside className={cn(
                    "fixed md:relative inset-y-0 left-0 w-64 bg-[#0a1628]/80 backdrop-blur-2xl flex flex-col p-5 space-y-6 z-50 transition-transform duration-500 ease-out border-r border-teal-500/15 shadow-[5px_0_30px_rgba(0,0,0,0.5)]",
                    isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
                )}>
                    <div className="space-y-4 pt-10 md:pt-0 relative z-10">
                        <button
                            onClick={() => router.push("/")}
                            className="flex items-center gap-2 text-slate-400 hover:text-teal-300 transition-colors text-xs font-medium tracking-[0.2em] uppercase"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            Leave Room
                        </button>
                        <div>
                            <h2 className="text-2xl font-black font-heading tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-teal-200 to-cyan-300">Mystic Tarot</h2>
                            <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-[#030712] border border-slate-700/40 rounded-lg group hover:border-teal-400/40 transition-colors relative overflow-hidden">
                                <div className="absolute inset-0 bg-teal-500/5 blur opacity-0 group-hover:opacity-100 transition duration-500" />
                                <span className="text-[10px] text-slate-500 font-mono truncate flex-1 tracking-wider uppercase relative z-10">ID: <span className="text-slate-300">{roomId}</span></span>
                                <button onClick={copyRoomId} className="text-slate-400 hover:text-teal-300 transition-colors relative z-10" title="Copy Room ID">
                                    <Copy className="w-3.5 h-3.5" />
                                </button>
                            </div>
                            {copied && <p className="text-[10px] text-teal-400 mt-1.5 font-medium tracking-widest uppercase">Copied!</p>}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="relative z-10 flex flex-col gap-3">
                        <button
                            onClick={handleThreeCardSpread}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-teal-500/15 text-teal-200 rounded-xl font-heading tracking-widest uppercase font-bold text-[11px] transition-all active:scale-[0.98] border border-teal-500/30 hover:bg-teal-500/25 shadow-[0_0_15px_rgba(20,184,166,0.1)]"
                        >
                            <Sparkles className="w-4 h-4 text-teal-400" />
                            3-Card Spread
                        </button>
                        <div className="flex gap-3">
                            <button
                                onClick={handleDrawCard}
                                className="flex-1 flex items-center justify-center gap-2 px-3 py-3 bg-white/5 text-neutral-300 rounded-xl font-heading tracking-widest uppercase font-bold text-[11px] transition-all active:scale-[0.98] border border-white/10 hover:bg-white/10 hover:text-white"
                            >
                                <PlusSquare className="w-4 h-4 text-cyan-400" />
                                Draw
                            </button>
                            <button
                                onClick={handleClearTable}
                                title="Clear Table"
                                className="flex items-center justify-center px-4 py-3 bg-rose-500/10 text-rose-400 rounded-xl transition-all active:scale-[0.98] border border-rose-500/25 hover:bg-rose-500/20"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                        <button
                            onClick={() => setIsChatOpen(prev => !prev)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-500/10 text-amber-200 rounded-xl font-heading tracking-widest uppercase font-bold text-[11px] transition-all active:scale-[0.98] border border-amber-500/25 hover:bg-amber-500/15"
                        >
                            <MessageCircle className="w-4 h-4 text-amber-400" />
                            Whispers
                            {messages.length > 0 && <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse shadow-[0_0_8px_#f59e0b]" />}
                        </button>
                    </div>

                    {/* Chronicle (Activity Log) */}
                    <div className="flex-1 min-h-0 pt-5 border-t border-teal-500/10 relative z-10 flex flex-col">
                        <div className="flex items-center gap-2 mb-3">
                            <Activity className="w-3.5 h-3.5 text-teal-400/80" />
                            <p className="text-[10px] text-teal-400/80 font-heading font-bold tracking-[0.2em] uppercase">Chronicle</p>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-hide">
                            {logs.slice().reverse().map(log => (
                                <div key={log.id} className="text-[9px] leading-relaxed border-l-2 border-teal-500/25 pl-2">
                                    <span className="text-slate-500 block font-mono tracking-widest uppercase">{log.timestamp}</span>
                                    <span className="text-slate-300 font-medium">{log.message}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </aside>

                {/* ── TAROT TABLE (BOUNDED AREA) ── */}
                <main
                    className="flex-1 relative overflow-hidden bg-[#040c1a]/80"
                    onPointerMove={(e) => {
                        if (e.pointerType === 'touch') return;
                        const now = Date.now();
                        if (now - lastCursorEmit.current > 50) {
                            lastCursorEmit.current = now;
                            socket?.emit("cursor-move", roomId, { userId: socket.id, x: e.clientX, y: e.clientY });
                        }
                    }}
                >
                    {/* Table texture grid */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(20,184,166,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(20,184,166,0.02)_1px,transparent_1px)] bg-[size:80px_80px] pointer-events-none" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#030712_80%)] pointer-events-none" />
                    {/* Center warm glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40vw] h-[40vh] bg-teal-500/8 rounded-full blur-[150px] pointer-events-none" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[25vw] h-[25vh] bg-cyan-400/5 rounded-full blur-[100px] pointer-events-none" />

                    {/* Live Cursors (Desktop only) */}
                    <div className="hidden md:block">
                        {Object.entries(cursors).map(([userId, pos]) => (
                            <div
                                key={userId}
                                className="absolute z-50 pointer-events-none transition-all duration-75 ease-linear flex flex-col items-center"
                                style={{ left: pos.x, top: pos.y }}
                            >
                                <MousePointer2 className="w-5 h-5 text-teal-400 fill-teal-400/80 drop-shadow-[0_0_8px_rgba(20,184,166,0.6)] -rotate-12" />
                                <span className="mt-0.5 px-2 py-0.5 bg-[#0a1628]/80 backdrop-blur-md rounded text-[9px] text-teal-300 font-mono tracking-[0.1em] border border-teal-400/40 whitespace-nowrap shadow-[0_0_10px_rgba(20,184,166,0.3)]">
                                    Seeker
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Cards */}
                    <div ref={tableRef} className="absolute inset-0 z-10 w-full h-full perspective-[1000px] overflow-hidden" id="tarot-table">
                        {cards.map(card => (
                            <TarotCard
                                key={card.id}
                                card={card}
                                onDragEnd={handleDragEnd}
                                onFlipEnd={handleFlipEnd}
                                onPointerDown={handlePointerDown}
                                isLocal={true}
                                constraintsRef={tableRef}
                            />
                        ))}
                    </div>
                </main>
            </div>

            {/* ═══════════════ BOTTOM: MOBILE FLOATING BAR ═══════════════ */}
            <div className="md:hidden fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 p-2 bg-[#0a1628]/90 backdrop-blur-2xl border border-teal-500/15 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8)]">
                <button
                    onClick={handleDrawCard}
                    className="flex flex-col items-center justify-center p-2 w-14 h-12 bg-[#030712]/50 active:bg-[#0a1628] rounded-xl transition-all border border-slate-700/30"
                >
                    <PlusSquare className="w-5 h-5 text-cyan-400" />
                    <span className="text-[7px] font-bold text-slate-400 uppercase mt-1 tracking-widest">Draw</span>
                </button>
                <button
                    onClick={handleThreeCardSpread}
                    className="flex flex-col items-center justify-center p-2 w-14 h-12 bg-teal-500/15 active:bg-teal-500/25 rounded-xl transition-all border border-teal-400/25 shadow-[0_0_10px_rgba(20,184,166,0.08)]"
                >
                    <Sparkles className="w-5 h-5 text-teal-300" />
                    <span className="text-[7px] font-bold text-teal-200 uppercase mt-1 tracking-widest">Spread</span>
                </button>
                <button
                    onClick={() => setIsChatOpen(!isChatOpen)}
                    className="flex flex-col items-center justify-center p-2 w-14 h-12 bg-amber-500/10 active:bg-amber-500/20 rounded-xl transition-all relative border border-amber-500/25"
                >
                    <MessageCircle className="w-5 h-5 text-amber-400" />
                    <span className="text-[7px] font-bold text-amber-300 uppercase mt-1 tracking-widest">Chat</span>
                    {messages.length > 0 && <div className="absolute top-1 right-1.5 w-2 h-2 bg-amber-400 rounded-full shadow-[0_0_5px_#f59e0b]" />}
                </button>
                <button
                    onClick={handleClearTable}
                    className="flex flex-col items-center justify-center p-2 w-14 h-12 bg-rose-500/10 active:bg-rose-500/20 rounded-xl transition-all border border-rose-500/25"
                >
                    <Trash2 className="w-5 h-5 text-rose-500" />
                    <span className="text-[7px] font-bold text-rose-400 uppercase mt-1 tracking-widest">Clear</span>
                </button>
            </div>

        </div >
    );
}

