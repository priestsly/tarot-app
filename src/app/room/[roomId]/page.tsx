"use client";

import { use, useEffect, useState, useRef, useCallback } from "react";
import { Copy, PlusSquare, ArrowLeft, Mic, MicOff, Video, VideoOff, Menu, X, Sparkles, Activity, MousePointer2, MessageCircle, Send, Trash2 } from "lucide-react";
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
            x: window.innerWidth / 2 - 100 + Math.random() * 40 - 20, // Center-ish with jitter
            y: window.innerHeight / 2 - 150 + Math.random() * 40 - 20,
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
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const spread: CardState[] = [
            { id: Math.random().toString(36).substring(2, 9), cardIndex: Math.floor(Math.random() * 78), x: centerX - 220, y: centerY - 150, zIndex: maxZIndex + 1, isFlipped: false, isReversed: Math.random() > 0.5 },
            { id: Math.random().toString(36).substring(2, 9), cardIndex: Math.floor(Math.random() * 78), x: centerX, y: centerY - 150, zIndex: maxZIndex + 2, isFlipped: false, isReversed: Math.random() > 0.5 },
            { id: Math.random().toString(36).substring(2, 9), cardIndex: Math.floor(Math.random() * 78), x: centerX + 220, y: centerY - 150, zIndex: maxZIndex + 3, isFlipped: false, isReversed: Math.random() > 0.5 }
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

    const handleDragEnd = useCallback((id: string, x: number, y: number) => {
        setCards(prev => {
            const next = prev.map(c => c.id === id ? { ...c, x, y } : c);
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
        <div className="flex h-screen bg-void text-neutral-50 overflow-hidden font-inter relative">

            {/* Dynamic Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-nebula/10 rounded-full blur-[150px] mix-blend-screen" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-ethereal/10 rounded-full blur-[150px] mix-blend-screen" />
                <div className="absolute top-[40%] left-[40%] w-[30vw] h-[30vw] bg-mystic/5 rounded-full blur-[100px] mix-blend-screen" />
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 mix-blend-screen" />
            </div>

            {/* Mobile Toggle */}
            <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="md:hidden absolute top-6 left-6 z-50 p-3 glass-panel rounded-xl text-mystic hover:text-white transition-colors border border-mystic/20"
            >
                {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-void/80 z-40 backdrop-blur-md"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Top Center Card Counter (Discreet) */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-4 py-1.5 bg-mystic/10 backdrop-blur-md border border-mystic/20 rounded-full flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-ethereal animate-pulse" />
                <span className="text-xs text-mystic font-mono tracking-widest uppercase font-bold">Cards: {cards.length}</span>
            </div>

            {/* Floating Action Bar (Mobile Only) */}
            <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 p-2 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
                <button
                    onClick={handleDrawCard}
                    className="flex flex-col items-center justify-center p-3 w-16 h-16 bg-white/5 active:bg-white/10 rounded-xl transition-all"
                >
                    <PlusSquare className="w-6 h-6 text-mystic mb-1" />
                    <span className="text-[9px] font-bold text-neutral-300 uppercase">Draw</span>
                </button>
                <button
                    onClick={handleThreeCardSpread}
                    className="flex flex-col items-center justify-center p-3 w-16 h-16 bg-mystic/10 active:bg-mystic/20 rounded-xl transition-all border border-mystic/30 shadow-[0_0_15px_rgba(252,211,77,0.1)]"
                >
                    <Sparkles className="w-6 h-6 text-mystic mb-1" />
                    <span className="text-[9px] font-bold text-mystic uppercase text-center leading-tight">3-Card</span>
                </button>
                <button
                    onClick={() => setIsChatOpen(!isChatOpen)}
                    className="flex flex-col items-center justify-center p-3 w-16 h-16 bg-white/5 active:bg-white/10 rounded-xl transition-all relative"
                >
                    <MessageCircle className="w-6 h-6 text-ethereal mb-1" />
                    <span className="text-[9px] font-bold text-neutral-300 uppercase">Chat</span>
                    {messages.length > 0 && (
                        <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-ethereal rounded-full" />
                    )}
                </button>
            </div>

            {/* Chat Drawer Side Panel */}
            <aside className={cn(
                "fixed inset-y-0 right-0 w-80 bg-black/80 backdrop-blur-2xl border-l border-white/10 flex flex-col z-50 shadow-2xl transition-transform duration-500 ease-out",
                isChatOpen ? "translate-x-0" : "translate-x-full"
            )}>
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <h3 className="font-cinzel text-xl text-ethereal font-bold flex items-center gap-2">
                        <MessageCircle className="w-5 h-5" />
                        Whispers
                    </h3>
                    <button onClick={() => setIsChatOpen(false)} className="text-neutral-500 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {messages.map(msg => (
                        <div key={msg.id} className="flex flex-col gap-1">
                            <div className="flex items-baseline justify-between">
                                <span className={cn("text-xs font-bold", msg.sender === "Seeker" ? "text-mystic" : "text-ethereal")}>{msg.sender}</span>
                                <span className="text-[9px] text-neutral-500 font-mono">{msg.timestamp}</span>
                            </div>
                            <div className={cn(
                                "p-3 rounded-xl text-sm leading-relaxed",
                                msg.sender === "Seeker" ? "bg-mystic/10 text-neutral-200 rounded-tr-sm" : "bg-white/5 text-neutral-300 rounded-tl-sm"
                            )}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10 bg-black/40 flex items-center gap-2">
                    <input
                        type="text"
                        value={chatInput}
                        onChange={e => setChatInput(e.target.value)}
                        placeholder="Send a whisper..."
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-ethereal/50 transition-colors placeholder:text-neutral-600"
                    />
                    <button
                        type="submit"
                        disabled={!chatInput.trim()}
                        className="p-3 rounded-xl bg-ethereal/20 text-ethereal hover:bg-ethereal/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </form>
            </aside>

            {/* Sidebar / Left Menu */}
            <aside className={cn(
                "fixed md:relative inset-y-0 left-0 w-72 glass-panel flex flex-col p-8 space-y-8 z-50 transition-transform duration-500 ease-out border-r border-white/10",
                isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
            )}>
                <div className="space-y-6 pt-12 md:pt-0 relative z-10">
                    <button
                        onClick={() => router.push("/")}
                        className="flex items-center gap-2 text-neutral-400 hover:text-mystic transition-colors text-sm font-medium tracking-wide"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Leave Room
                    </button>
                    <div>
                        <h2 className="text-3xl font-black font-cinzel bg-gradient-to-br from-white via-mystic to-mystic/50 bg-clip-text text-transparent drop-shadow-md">Mystic Tarot</h2>
                        <div className="mt-4 flex items-center gap-2 px-4 py-3 bg-black/40 border border-white/10 rounded-xl group hover:border-mystic/30 transition-colors shadow-inner backdrop-blur-md">
                            <span className="text-xs text-neutral-400 font-mono truncate flex-1 tracking-wider uppercase">ID: <span className="text-mystic/80">{roomId}</span></span>
                            <button onClick={copyRoomId} className="text-neutral-500 hover:text-mystic transition-colors" title="Copy Room ID">
                                <Copy className="w-4 h-4" />
                            </button>
                        </div>
                        {copied && <p className="text-xs text-ethereal mt-2 font-medium tracking-wide">Spell copied to clipboard!</p>}
                    </div>
                </div>

                <div className="relative group z-10 flex flex-col gap-3">
                    <button
                        onClick={handleThreeCardSpread}
                        className="w-full relative flex items-center justify-center gap-3 px-6 py-3 bg-mystic/10 text-mystic rounded-2xl font-semibold tracking-wide transition-all active:scale-[0.98] border border-mystic/30 hover:bg-mystic/20 overflow-hidden"
                    >
                        <Sparkles className="w-5 h-5 relative z-10" />
                        <span className="relative z-10">3-Card Spread</span>
                    </button>
                    <div className="flex gap-2">
                        <button
                            onClick={handleDrawCard}
                            className="flex-1 relative flex items-center justify-center gap-2 px-4 py-4 bg-[#0a0a12] text-white rounded-2xl font-semibold tracking-wide transition-all active:scale-[0.98] border border-white/10 hover:bg-white/5"
                        >
                            <PlusSquare className="w-4 h-4 text-mystic" />
                            <span>Draw</span>
                        </button>
                        <button
                            onClick={handleClearTable}
                            title="Clear Table"
                            className="relative flex items-center justify-center px-4 py-4 bg-red-500/10 text-red-400 rounded-2xl font-semibold tracking-wide transition-all active:scale-[0.98] border border-red-500/20 hover:bg-red-500/20"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Desktop Chat Toggle */}
                    <button
                        onClick={() => setIsChatOpen(true)}
                        className="hidden md:flex w-full relative items-center justify-center gap-3 px-6 py-3 bg-ethereal/10 text-ethereal rounded-2xl font-semibold tracking-wide transition-all active:scale-[0.98] border border-ethereal/30 hover:bg-ethereal/20"
                    >
                        <MessageCircle className="w-5 h-5" />
                        <span>Open Chat</span>
                    </button>
                </div>

                <div className="mt-auto pt-6 border-t border-white/10 relative z-10 flex flex-col flex-1 min-h-[150px]">
                    <div className="flex items-center gap-2 mb-3">
                        <Activity className="w-4 h-4 text-mystic" />
                        <p className="text-xs text-mystic/80 font-cinzel font-bold tracking-widest uppercase">The Chronicle</p>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-3 scrollbar-hide pr-2">
                        {logs.slice().reverse().map(log => (
                            <div key={log.id} className="text-[10px] leading-relaxed border-l border-white/10 pl-3">
                                <span className="text-ethereal block mb-0.5 font-mono">{log.timestamp}</span>
                                <span className="text-neutral-300 font-medium tracking-wide">{log.message}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </aside>

            {/* Main Table Area */}
            <main
                className="flex-1 relative bg-transparent overflow-hidden"
                onPointerMove={(e) => {
                    const now = Date.now();
                    if (now - lastCursorEmit.current > 40) {
                        lastCursorEmit.current = now;
                        socket?.emit("cursor-move", roomId, { userId: socket.id, x: e.clientX, y: e.clientY });
                    }
                }}
            >
                {/* Subtle astrolabe/grid pattern for the table context */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:100px_100px] pointer-events-none mix-blend-overlay" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,var(--color-void)_100%)] pointer-events-none" />

                {/* WebRTC Video Overlay (Top Right Desktop, Top Center Mobile) */}
                <div className="absolute top-16 md:top-8 right-4 md:right-8 z-40 flex flex-row md:flex-col gap-3 md:gap-6 justify-end items-end pointer-events-none">
                    <div className="relative group pointer-events-auto">
                        <div className="absolute -inset-1 bg-gradient-to-r from-ethereal to-nebula rounded-3xl blur opacity-30 group-hover:opacity-60 transition duration-1000 hidden md:block" />
                        <div className="relative overflow-hidden rounded-xl md:rounded-2xl border border-white/20 bg-black/50 backdrop-blur-md w-32 md:w-56 aspect-video shadow-2xl">
                            <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover mix-blend-luminosity hover:mix-blend-normal transition-all duration-700 pointer-events-none" />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 data-[novideo=true]:opacity-100 transition-opacity pointer-events-none">
                                <span className="text-[10px] md:text-sm text-ethereal/70 font-mono tracking-widest animate-pulse">Awaiting...</span>
                            </div>
                        </div>
                    </div>

                    <div className="relative group md:translate-x-12 pointer-events-auto">
                        <div className="absolute -inset-1 bg-gradient-to-r from-mystic to-nebula rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 hidden md:block" />
                        <div className="relative overflow-hidden rounded-lg md:rounded-xl border border-white/10 bg-black/50 backdrop-blur-md w-24 md:w-36 aspect-video shadow-xl">
                            <video ref={myVideoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1] opacity-70 hover:opacity-100 transition-opacity duration-500" />
                        </div>
                    </div>

                    <div className="hidden md:flex items-center gap-3 justify-end translate-x-12 mt-2 pointer-events-auto">
                        <button onClick={toggleMute} className={cn("p-3 rounded-xl transition-all shadow-lg backdrop-blur-md border", isMuted ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-white/5 text-mystic border-white/10 hover:bg-white/10 hover:border-mystic/30")}>
                            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                        </button>
                        <button onClick={toggleVideo} className={cn("p-3 rounded-xl transition-all shadow-lg backdrop-blur-md border", isVideoOff ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-white/5 text-ethereal border-white/10 hover:bg-white/10 hover:border-ethereal/30")}>
                            {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {/* Live Cursors */}
                {Object.entries(cursors).map(([userId, pos]) => (
                    <div
                        key={userId}
                        className="absolute z-50 pointer-events-none transition-all duration-75 ease-linear flex flex-col items-center"
                        style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
                    >
                        <MousePointer2 className="w-6 h-6 text-ethereal fill-ethereal drop-shadow-md -rotate-12" />
                        <span className="mt-1 px-2 py-0.5 bg-ethereal/20 backdrop-blur-md rounded text-[9px] text-white font-mono border border-ethereal/30 whitespace-nowrap">
                            Seeker
                        </span>
                    </div>
                ))}

                {/* Tarot Cards Table Area */}
                <div className="absolute inset-0 z-10 w-full h-full perspective-[1000px]" id="tarot-table">
                    {cards.map(card => (
                        <TarotCard
                            key={card.id}
                            card={card}
                            onDragEnd={handleDragEnd}
                            onFlipEnd={handleFlipEnd}
                            onPointerDown={handlePointerDown}
                            isLocal={true}
                        />
                    ))}
                </div>

            </main>
        </div>
    );
}
