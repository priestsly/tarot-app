"use client";

import { use, useEffect, useState, useRef, useCallback, Suspense } from "react";
import { Copy, PlusSquare, ArrowLeft, Mic, MicOff, Video, VideoOff, Menu, X, Sparkles, Activity, MousePointer2, MessageCircle, Send, Trash2, ChevronUp, ChevronDown, Eye, EyeOff } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { io, Socket } from "socket.io-client";
import Peer from "peerjs";
import TarotCard, { CardState } from "@/components/TarotCard";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

let socket: Socket;

function RoomContent({ params }: { params: Promise<{ roomId: string }> }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const roomId = use(params).roomId;

    // Role & Client Form Data
    const role = searchParams.get('role') || 'consultant'; // default to consultant
    const isConsultant = role === 'consultant';

    // Store remote client profile (for the Consultant)
    const [clientProfile, setClientProfile] = useState<any>(null);

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

        // ========== CLIENT PROFILE SYNC ==========
        socket.on("sync-client-profile", (profile: any) => {
            if (profile) setClientProfile(profile);
        });

        socket.on("client-profile-updated", (profile: any) => {
            setClientProfile(profile);
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

    // Deal the package selected by the client (Consultant only)
    const handleDealPackage = useCallback(() => {
        if (!isConsultant) return;
        const count = clientProfile?.cards || 3;
        appendLog(`Dealt the ${count}-card package for ${clientProfile?.name || 'the Client'}`);

        const usedIndices = new Set<number>();
        const spread: CardState[] = [];
        for (let i = 0; i < count; i++) {
            let idx: number;
            do { idx = Math.floor(Math.random() * 78); } while (usedIndices.has(idx));
            usedIndices.add(idx);

            const xPercent = count === 1 ? 50 : 15 + (70 * i) / (count - 1);
            spread.push({
                id: Math.random().toString(36).substring(2, 9),
                cardIndex: idx,
                x: xPercent,
                y: 45 + (Math.random() * 10 - 5),
                isFlipped: false,
                isReversed: Math.random() > 0.5,
                zIndex: maxZIndex + i + 1
            });
        }
        setMaxZIndex(prev => prev + count);
        setCards(prev => [...prev, ...spread]);
        spread.forEach(c => socket?.emit("add-card", roomId, c));
    }, [isConsultant, clientProfile, maxZIndex, roomId, appendLog]);

    // Role-based Profile Syncing
    useEffect(() => {
        if (!socket) return;

        const syncProfile = () => {
            if (!isConsultant && searchParams.get('name')) {
                const data = {
                    name: searchParams.get('name') || '',
                    birth: searchParams.get('birth') || '',
                    time: searchParams.get('time') || '',
                    pkgId: searchParams.get('pkgId') || '',
                    cards: Number(searchParams.get('cards')) || 0,
                };
                socket.emit("update-client-profile", roomId, data);
            }
        };

        if (socket.connected) syncProfile();
        else socket.on('connect', syncProfile);

        return () => { socket.off('connect', syncProfile); };
    }, [isConsultant, searchParams, roomId]);

    const handlePointerDown = useCallback((id: string) => {
        const newZ = maxZIndex + 1;
        setMaxZIndex(newZ);
        let updatedCard: CardState | undefined;
        setCards(prev => {
            const next = prev.map(c => {
                if (c.id === id) {
                    updatedCard = { ...c, zIndex: newZ };
                    return updatedCard;
                }
                return c;
            });
            return next;
        });
        if (updatedCard) socket.emit("update-card", roomId, updatedCard);
    }, [maxZIndex, roomId]);

    const handleDragEnd = useCallback((id: string, percentX: number, percentY: number) => {
        let updatedCard: CardState | undefined;
        setCards(prev => {
            const next = prev.map(c => {
                if (c.id === id) {
                    updatedCard = { ...c, x: percentX, y: percentY };
                    return updatedCard;
                }
                return c;
            });
            return next;
        });
        if (updatedCard) socket.emit("update-card", roomId, updatedCard);
    }, [roomId]);

    const handleFlipEnd = useCallback((id: string, isReversed: boolean, isFlipped: boolean) => {
        if (isFlipped) appendLog("Revealed a card's destiny");
        setCards(prev => prev.map(c => c.id === id ? { ...c, isReversed, isFlipped } : c));
        socket.emit("flip-card", roomId, id, isReversed, isFlipped);
    }, [roomId, appendLog]);

    return (
        <div className="flex flex-col h-screen bg-slate-50 text-slate-800 overflow-hidden font-inter relative">

            {/* ═══════════════ LIGHT BACKGROUND GLOW ═══════════════ */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[5%] -left-[20%] w-[140%] h-[250px] bg-gradient-to-r from-transparent via-purple-300/20 to-transparent rounded-full blur-[100px] skew-y-[-4deg] animate-aurora" />
                <div className="absolute top-[40%] -right-[10%] w-[120%] h-[200px] bg-gradient-to-r from-transparent via-fuchsia-300/10 to-transparent rounded-full blur-[120px] skew-y-[3deg] animate-aurora" style={{ animationDelay: '5s' }} />
            </div>

            {/* ═══════════════ TOP: VIDEO STRIP ═══════════════ */}
            <div className="relative z-30 flex-shrink-0 bg-white/95 border-b border-purple-100 backdrop-blur-xl shadow-lg shadow-purple-900/5 transition-all duration-500 ease-in-out">
                {/* Video Bar Content */}
                <div className={cn(
                    "transition-all duration-500 ease-out overflow-hidden flex",
                    isVideoBarVisible ? "max-h-[220px] opacity-100 p-3" : "max-h-0 opacity-0 p-0"
                )}>
                    <div className="flex flex-1 max-w-4xl mx-auto gap-4 items-stretch justify-center h-full">
                        {/* Remote Video */}
                        <div className="flex-1 relative group overflow-hidden rounded-2xl border border-purple-100 bg-slate-100 aspect-video shadow-sm">
                            <div className="absolute -inset-1 bg-gradient-to-r from-purple-400/20 to-fuchsia-400/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-700 pointer-events-none" />
                            <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover relative z-10" />
                            <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                                <span className="text-xs text-purple-400/70 font-mono tracking-widest animate-pulse">Awaiting connection...</span>
                            </div>
                            <div className="absolute bottom-2 left-3 z-20 px-3 py-1 bg-white/80 rounded-lg text-[10px] text-purple-700 font-bold tracking-widest uppercase backdrop-blur-md shadow-sm">
                                Remote
                            </div>
                        </div>

                        {/* Local Video */}
                        <div className="flex-1 relative group overflow-hidden rounded-2xl border border-purple-100 bg-slate-100 aspect-video shadow-sm">
                            <div className="absolute -inset-1 bg-gradient-to-r from-fuchsia-400/20 to-amber-400/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-700 pointer-events-none" />
                            <video ref={myVideoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1] relative z-10" />
                            <div className="absolute bottom-2 left-3 z-20 px-3 py-1 bg-white/80 rounded-lg text-[10px] text-fuchsia-700 font-bold tracking-widest uppercase backdrop-blur-md shadow-sm">
                                You
                            </div>
                        </div>

                        {/* Controls Column */}
                        <div className="flex flex-col justify-center gap-3 pl-4 border-l border-purple-100">
                            <button onClick={toggleMute} className={cn("p-3 rounded-xl transition-all border shadow-sm", isMuted ? "bg-rose-50 text-rose-500 border-rose-200" : "bg-white text-purple-600 border-purple-100 hover:bg-purple-50 hover:border-purple-200")} title={isMuted ? 'Unmute' : 'Mute'}>
                                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                            </button>
                            <button onClick={toggleVideo} className={cn("p-3 rounded-xl transition-all border shadow-sm", isVideoOff ? "bg-rose-50 text-rose-500 border-rose-200" : "bg-white text-purple-600 border-purple-100 hover:bg-purple-50 hover:border-purple-200")} title={isVideoOff ? 'Enable Camera' : 'Disable Camera'}>
                                {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Video Toggle Button */}
                <button
                    onClick={() => setIsVideoBarVisible(!isVideoBarVisible)}
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full z-40 px-6 py-1.5 bg-white backdrop-blur-xl border border-t-0 border-purple-100 rounded-b-xl text-purple-500 hover:text-purple-700 transition-all flex items-center gap-2 text-[10px] uppercase tracking-widest shadow-md shadow-purple-900/5 font-bold"
                >
                    {isVideoBarVisible ? <><ChevronUp className="w-3 h-3" />Görüşmeyi Gizle</> : <><ChevronDown className="w-3 h-3" />Görüşmeyi Göster</>}
                </button>
            </div>

            {/* ═══════════════ MIDDLE: MAIN CONTENT ═══════════════ */}
            <div className="flex flex-1 min-h-0 relative z-10 w-full overflow-hidden">

                {/* Mobile Menu Toggle */}
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="md:hidden absolute top-4 left-4 z-50 p-3 bg-white/90 backdrop-blur-md rounded-xl text-purple-900 shadow-md border border-purple-100"
                >
                    {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>

                {/* Card Counter Badge */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-5 py-2 bg-white/90 backdrop-blur-md border border-purple-100 rounded-full flex items-center gap-2 shadow-sm">
                    <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                    <span className="text-[10px] text-purple-900 font-bold tracking-widest uppercase">Cards: {cards.length}</span>
                </div>

                {/* Mobile Sidebar Overlay */}
                {isSidebarOpen && (
                    <div
                        className="md:hidden fixed inset-0 bg-purple-950/20 z-40 backdrop-blur-sm"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}

                {/* Compact Floating Chat Panel */}
                {isChatOpen && (
                    <div className="fixed bottom-24 md:bottom-6 right-6 z-50 w-80 max-h-[350px] bg-white border border-purple-100 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-purple-50 bg-purple-50/50">
                            <span className="text-xs text-purple-900 font-bold tracking-widest uppercase flex items-center gap-1.5">
                                <MessageCircle className="w-4 h-4 text-purple-500" />
                                Sohbet
                            </span>
                            <button onClick={() => setIsChatOpen(false)} className="text-purple-400 hover:text-purple-600 transition-colors p-1">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[220px] custom-scrollbar">
                            {messages.length === 0 && (
                                <p className="text-[10px] text-purple-300 text-center py-4 tracking-widest uppercase font-semibold">Henüz mesaj yok...</p>
                            )}
                            {messages.slice(-15).map(msg => (
                                <div key={msg.id} className={`flex flex-col ${msg.sender === "Seeker" ? "items-end" : "items-start"}`}>
                                    <span className="text-[9px] font-bold text-purple-400 uppercase tracking-wider mb-0.5 ml-1">{msg.sender === "Seeker" ? "Sen" : "Danışman"}</span>
                                    <div className={`px-3 py-2 rounded-2xl max-w-[85%] ${msg.sender === "Seeker" ? "bg-purple-600 text-white rounded-tr-sm" : "bg-purple-50 text-purple-900 border border-purple-100 rounded-tl-sm"}`}>
                                        <p className="text-xs leading-relaxed">{msg.text}</p>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <form onSubmit={handleSendMessage} className="flex items-center gap-2 p-3 bg-white border-t border-purple-50">
                            <input
                                type="text"
                                value={chatInput}
                                onChange={e => setChatInput(e.target.value)}
                                placeholder="Mesaj yazın..."
                                autoFocus
                                className="flex-1 bg-purple-50/50 border border-purple-100 rounded-xl px-4 py-2 text-sm text-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all placeholder:text-purple-300"
                            />
                            <button
                                type="submit"
                                disabled={!chatInput.trim()}
                                className="p-2.5 rounded-xl bg-purple-600 text-white shadow-md shadow-purple-600/20 hover:bg-purple-700 disabled:opacity-50 transition-all hover:-translate-y-0.5 active:translate-y-0"
                            >
                                <Send className="w-4 h-4 ml-0.5" />
                            </button>
                        </form>
                    </div>
                )}

                {/* ── SIDEBAR (LEFT PANEL) ── */}
                <aside className={cn(
                    "fixed md:relative inset-y-0 left-0 w-72 bg-white/95 backdrop-blur-2xl flex flex-col p-6 space-y-6 z-50 transition-transform duration-500 ease-out border-r border-purple-100 shadow-xl",
                    isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
                )}>
                    {/* Brand / Title Component */}
                    <div className="space-y-4 pt-10 md:pt-0 relative z-10 flex flex-col items-center">
                        <button
                            onClick={() => router.push("/")}
                            className="absolute top-0 left-0 flex items-center gap-1 text-purple-400 hover:text-purple-600 transition-colors text-[10px] font-bold tracking-widest uppercase"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            Ayrıl
                        </button>
                        <div className="w-12 h-12 bg-gradient-to-tr from-purple-800 to-fuchsia-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-900/20 mb-2">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-center w-full">
                            <h2 className="text-2xl font-black font-heading tracking-widest text-purple-950">Mystic Tarot</h2>
                            <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-purple-50 border border-purple-100 rounded-xl group transition-all relative overflow-hidden justify-center hover:bg-purple-100/50 cursor-pointer" onClick={copyRoomId} title="Oda IDsini Kopyala">
                                <span className="text-[10px] text-purple-600 font-bold flex-1 tracking-widest uppercase text-center">Oda: <span className="text-purple-900">{roomId}</span></span>
                                <Copy className="w-3.5 h-3.5 text-purple-400" />
                            </div>
                            {copied && <p className="text-[10px] text-purple-500 mt-2 font-bold tracking-widest uppercase">Kopyalandı!</p>}
                        </div>
                    </div>

                    {/* Action Buttons & Client Profile */}
                    <div className="relative z-10 flex flex-col gap-4">
                        {isConsultant && clientProfile && (
                            <div className="bg-gradient-to-br from-purple-50 to-white border border-purple-100 rounded-2xl p-5 space-y-3 relative shadow-sm">
                                <h3 className="text-[10px] font-heading text-purple-400 tracking-widest uppercase font-bold border-b border-purple-100 pb-2">Müşteri Profili</h3>
                                <div className="space-y-1 pt-1">
                                    <p className="text-base font-bold text-purple-950">{clientProfile.name}</p>
                                    {(clientProfile.birth || clientProfile.time) && (
                                        <p className="text-xs text-purple-600 font-medium">{clientProfile.birth} {clientProfile.time}</p>
                                    )}
                                </div>
                                <div className="pt-3 border-t border-purple-100 mt-2">
                                    <p className="text-xs text-purple-700 font-medium">Talep: <span className="text-purple-900 font-bold">{clientProfile.cards} Kart</span></p>
                                </div>
                            </div>
                        )}

                        {isConsultant && (
                            <div className="space-y-3">
                                <button
                                    onClick={handleDealPackage}
                                    disabled={!clientProfile}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-gradient-to-r from-purple-800 to-purple-600 text-white rounded-xl tracking-widest uppercase font-bold text-[11px] shadow-lg shadow-purple-900/20 disabled:opacity-50 disabled:grayscale transition-all hover:-translate-y-0.5"
                                >
                                    <Sparkles className="w-4 h-4 text-amber-300" />
                                    Paketi Dağıt
                                </button>
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleDrawCard}
                                        className="flex-1 flex items-center justify-center gap-2 px-3 py-3 bg-white text-purple-700 rounded-xl tracking-widest uppercase font-bold text-[11px] border border-purple-200 shadow-sm hover:bg-purple-50 transition-all hover:-translate-y-0.5"
                                        title="Ekstra kart çek"
                                    >
                                        <PlusSquare className="w-4 h-4 text-purple-500" />
                                        Draw
                                    </button>
                                    <button
                                        onClick={handleClearTable}
                                        title="Masayı Temizle"
                                        className="flex items-center justify-center px-4 py-3 bg-rose-50 text-rose-600 rounded-xl border border-rose-200 hover:bg-rose-100 transition-all hover:-translate-y-0.5"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {!isConsultant && (
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-center mt-2 shadow-sm">
                                <Sparkles className="w-6 h-6 text-amber-500 mx-auto mb-2 animate-pulse" />
                                <p className="text-sm text-amber-900 font-medium">Danışmanınızın kartları dağıtmasını bekleyin...</p>
                            </div>
                        )}

                        <button
                            onClick={() => setIsChatOpen(prev => !prev)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl tracking-widest uppercase font-bold text-[11px] shadow-sm hover:bg-amber-100 transition-all hover:-translate-y-0.5"
                        >
                            <MessageCircle className="w-4 h-4 text-amber-500" />
                            Sohbeti Aç
                            {messages.length > 0 && <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse shadow-sm" />}
                        </button>
                    </div>

                    {/* Chronicle (Activity Log) */}
                    <div className="flex-1 min-h-0 pt-6 border-t border-purple-100 relative z-10 flex flex-col">
                        <div className="flex items-center gap-2 mb-4">
                            <Activity className="w-4 h-4 text-purple-400" />
                            <p className="text-[10px] text-purple-400 font-bold tracking-widest uppercase">Akış</p>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                            {logs.slice().reverse().map(log => (
                                <div key={log.id} className="text-[10px] leading-relaxed border-l-[3px] border-purple-200 pl-3">
                                    <span className="text-purple-300 block font-mono tracking-widest uppercase mb-0.5">{log.timestamp}</span>
                                    <span className="text-purple-800 font-medium">{log.message}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </aside>

                {/* ── TAROT TABLE (BOUNDED AREA) ── */}
                <main
                    className="flex-1 relative overflow-hidden bg-gradient-to-b from-purple-950 to-midnight"
                    onPointerMove={(e) => {
                        if (e.pointerType === 'touch') return;
                        const now = Date.now();
                        if (now - lastCursorEmit.current > 50) {
                            lastCursorEmit.current = now;
                            socket?.emit("cursor-move", roomId, { userId: socket.id, x: e.clientX, y: e.clientY });
                        }
                    }}
                >
                    {/* Velvet Table texture */}
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 mix-blend-overlay pointer-events-none" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,theme(colors.midnight)_90%)] pointer-events-none" />
                    {/* Center warm glow for cards */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vh] bg-purple-500/10 rounded-full blur-[150px] pointer-events-none" />

                    {/* Live Cursors (Desktop only) */}
                    <div className="hidden md:block">
                        {Object.entries(cursors).map(([userId, pos]) => (
                            <div
                                key={userId}
                                className="absolute z-50 pointer-events-none transition-all duration-75 ease-linear flex flex-col items-center"
                                style={{ left: pos.x, top: pos.y }}
                            >
                                <MousePointer2 className="w-6 h-6 text-white fill-purple-400 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)] -rotate-12" />
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
            <div className="md:hidden fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 p-2 bg-white/95 backdrop-blur-2xl border border-purple-100 rounded-3xl shadow-xl shadow-purple-900/10">
                {isConsultant && (
                    <>
                        <button
                            onClick={handleDealPackage}
                            disabled={!clientProfile}
                            className="flex flex-col items-center justify-center p-2 w-16 h-14 bg-gradient-to-r from-purple-700 to-purple-600 active:scale-[0.98] rounded-2xl transition-all shadow-md shadow-purple-600/30 disabled:opacity-50"
                        >
                            <Sparkles className="w-5 h-5 text-amber-300" />
                            <span className="text-[8px] font-bold text-white uppercase mt-1 tracking-widest">Dağıt</span>
                        </button>
                        <button
                            onClick={handleDrawCard}
                            className="flex flex-col items-center justify-center p-2 w-14 h-14 bg-purple-50 hover:bg-purple-100 active:scale-[0.98] rounded-2xl transition-all border border-purple-100"
                        >
                            <PlusSquare className="w-5 h-5 text-purple-600" />
                            <span className="text-[8px] font-bold text-purple-700 uppercase mt-1 tracking-widest">Draw</span>
                        </button>
                    </>
                )}

                <button
                    onClick={() => setIsChatOpen(!isChatOpen)}
                    className="flex flex-col items-center justify-center p-2 w-14 h-14 bg-amber-50 active:scale-[0.98] rounded-2xl transition-all relative border border-amber-200"
                >
                    <MessageCircle className="w-5 h-5 text-amber-500" />
                    <span className="text-[8px] font-bold text-amber-700 uppercase mt-1 tracking-widest">Chat</span>
                    {messages.length > 0 && <div className="absolute top-1 right-1.5 w-2.5 h-2.5 bg-amber-500 border-2 border-white rounded-full shadow-sm animate-pulse" />}
                </button>

                {isConsultant && (
                    <button
                        onClick={handleClearTable}
                        className="flex flex-col items-center justify-center p-2 w-14 h-14 bg-rose-50 active:scale-[0.98] rounded-2xl transition-all border border-rose-200"
                    >
                        <Trash2 className="w-5 h-5 text-rose-500" />
                        <span className="text-[8px] font-bold text-rose-700 uppercase mt-1 tracking-widest">Clear</span>
                    </button>
                )}
            </div>
        </div>
    );
}

export default function RoomPage({ params }: { params: Promise<{ roomId: string }> }) {
    return (
        <Suspense fallback={<div className="h-screen w-full bg-midnight flex items-center justify-center"><div className="w-12 h-12 rounded-full border-t-2 border-purple-500 animate-spin"></div></div>}>
            <RoomContent params={params} />
        </Suspense>
    );
}

