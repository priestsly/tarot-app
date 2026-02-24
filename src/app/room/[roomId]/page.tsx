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
        <div className="h-screen w-screen bg-black overflow-hidden relative font-inter select-none">

            {/* ═══════════════ IMMERSIVE BACKGROUND ═══════════════ */}
            <div className="nebula-bg" />
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-royal/20 to-transparent pointer-events-none" />

            {/* ═══════════════ TOP HUD: BRAND & STATUS ═══════════════ */}
            <div className="absolute top-6 left-8 z-50 flex items-center gap-6">
                <div className="flex flex-col">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-gold to-royal flex items-center justify-center shadow-lg shadow-gold/20">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <h1 className="text-xl font-black tracking-[0.2em] text-white uppercase drop-shadow-lg">Mystic Port</h1>
                    </div>
                </div>

                <div className="h-10 w-[1px] bg-white/10 mx-2" />

                <div className="flex items-center gap-4">
                    <div className="px-4 py-1.5 glass-card rounded-full border-gold/20 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-gold animate-pulse" />
                        <span className="text-[10px] text-gold-light font-bold tracking-widest uppercase">Room: {roomId}</span>
                        <button onClick={copyRoomId} className="ml-2 hover:text-white text-gold/60 transition-colors">
                            <Copy className="w-3 h-3" />
                        </button>
                    </div>
                    <button
                        onClick={() => router.push("/")}
                        className="px-4 py-1.5 glass-card rounded-full border-rose-500/20 text-rose-400 hover:text-rose-300 text-[10px] font-bold tracking-widest uppercase transition-all flex items-center gap-2"
                    >
                        <ArrowLeft className="w-3 h-3" /> Leave
                    </button>
                </div>
            </div>

            {/* ═══════════════ VISION HUD (TOP RIGHT) ═══════════════ */}
            <div className="absolute top-6 right-8 z-50 flex flex-col gap-4 items-end">
                <div className="flex gap-4">
                    {/* Remote Vision */}
                    <div className="w-56 aspect-video glass-card rounded-2xl overflow-hidden border-royal/30 group relative">
                        <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                        {!remoteVideoRef.current && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                <span className="text-[9px] text-ethereal/50 font-bold uppercase tracking-widest animate-pulse">Awaiting Soul...</span>
                            </div>
                        )}
                        <div className="absolute bottom-2 left-3 px-2 py-0.5 bg-black/60 backdrop-blur-md rounded text-[8px] text-ethereal font-bold tracking-widest uppercase border border-ethereal/20">Remote</div>
                    </div>

                    {/* Local Vision */}
                    <div className="w-40 aspect-video glass-card rounded-2xl overflow-hidden border-gold/30 group relative">
                        <video ref={myVideoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
                        <div className="absolute bottom-2 left-3 px-2 py-0.5 bg-black/60 backdrop-blur-md rounded text-[8px] text-gold-light font-bold tracking-widest uppercase border border-gold/20">Oracle</div>

                        {/* Stream Controls Overlay */}
                        <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={toggleMute} className={cn("p-1.5 rounded-lg backdrop-blur-md border transition-all", isMuted ? "bg-rose-500/20 border-rose-500/40 text-rose-400" : "bg-white/10 border-white/20 text-white")}>
                                {isMuted ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                            </button>
                            <button onClick={toggleVideo} className={cn("p-1.5 rounded-lg backdrop-blur-md border transition-all", isVideoOff ? "bg-rose-500/20 border-rose-500/40 text-rose-400" : "bg-white/10 border-white/20 text-white")}>
                                {isVideoOff ? <VideoOff className="w-3 h-3" /> : <Video className="w-3 h-3" />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══════════════ CLIENT PROFILE HUD (MIDDLE LEFT) ═══════════════ */}
            {isConsultant && clientProfile && (
                <div className="absolute left-8 top-1/2 -translate-y-1/2 z-50 w-64">
                    <div className="glass-card rounded-3xl p-6 border-gold/20 relative overflow-hidden group hover:border-gold/40 transition-all duration-500">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-gold/10 to-transparent rounded-bl-full" />

                        <h3 className="text-[10px] text-gold font-black tracking-[0.2em] uppercase mb-4 opacity-60">Client Profile</h3>
                        <p className="text-2xl font-black text-white mb-2">{clientProfile.name}</p>

                        <div className="space-y-3 pt-2">
                            <div className="flex items-center gap-2 text-ethereal/80">
                                <Activity className="w-3 h-3" />
                                <span className="text-[10px] font-bold tracking-widest uppercase">{clientProfile.birth || 'Unknown Date'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-ethereal/60">
                                <Video className="w-3 h-3" />
                                <span className="text-[10px] font-bold tracking-widest uppercase">{clientProfile.time || 'Unknown Time'}</span>
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-white/5">
                            <div className="px-3 py-2 bg-royal/30 rounded-xl border border-royal/50 text-center">
                                <p className="text-[9px] text-ethereal font-bold tracking-[0.1em] uppercase">Package Request</p>
                                <p className="text-xl font-heading text-gold tracking-widest mt-1">{clientProfile.cards} Cards</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════════ MAIN TABLE (CENTRAL STAGE) ═══════════════ */}
            <main
                className="absolute inset-0 z-10 cursor-default"
                onPointerMove={(e) => {
                    if (e.pointerType === 'touch') return;
                    const now = Date.now();
                    if (now - lastCursorEmit.current > 50) {
                        lastCursorEmit.current = now;
                        socket?.emit("cursor-move", roomId, { userId: socket.id, x: e.clientX, y: e.clientY });
                    }
                }}
            >
                {/* Table Mat / Texture */}
                <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
                    <div className="w-[80vh] h-[80vh] border-[0.5px] border-gold/50 rounded-full animate-pulse-slow" />
                    <div className="absolute w-[60vh] h-[60vh] border-[0.5px] border-gold/30 rounded-full flex items-center justify-center">
                        <div className="w-1 h-1 bg-gold rounded-full" />
                    </div>
                </div>

                {/* Cards Container */}
                <div ref={tableRef} className="absolute inset-0 z-20 w-full h-full perspective-[2000px] overflow-hidden" id="tarot-table">
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

                {/* External Cursors */}
                {Object.entries(cursors).map(([userId, pos]) => (
                    <div
                        key={userId}
                        className="absolute z-50 pointer-events-none transition-all duration-75 ease-linear"
                        style={{ left: pos.x, top: pos.y }}
                    >
                        <div className="w-3 h-3 bg-gold rounded-full shadow-[0_0_15px_rgba(197,160,89,0.8)] animate-ping" />
                        <div className="w-1.5 h-1.5 bg-white rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                ))}
            </main>

            {/* ═══════════════ CHAT HUD (BOTTOM RIGHT) ═══════════════ */}
            <div className="absolute bottom-8 right-8 z-50">
                {!isChatOpen ? (
                    <button
                        onClick={() => setIsChatOpen(true)}
                        className="w-14 h-14 glass-card rounded-2xl flex items-center justify-center hover:scale-110 transition-all border-gold/30 group relative"
                    >
                        <MessageCircle className="w-6 h-6 text-gold group-hover:text-white" />
                        {messages.length > 0 && <div className="absolute -top-1 -right-1 w-4 h-4 bg-crimson rounded-full text-[8px] flex items-center justify-center font-bold text-white border-2 border-black">!</div>}
                    </button>
                ) : (
                    <div className="w-80 h-[400px] glass-card rounded-3xl overflow-hidden flex flex-col border-gold/20 shadow-2xl">
                        <div className="p-4 bg-white/5 border-b border-white/5 flex items-center justify-between">
                            <span className="text-[10px] font-black tracking-widest uppercase text-gold">Whispers</span>
                            <button onClick={() => setIsChatOpen(false)} className="text-white/40 hover:text-white"><X className="w-4 h-4" /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                            {messages.map(msg => (
                                <div key={msg.id} className={cn("flex flex-col", msg.sender === "Seeker" ? "items-end" : "items-start")}>
                                    <div className={cn(
                                        "px-3 py-2 rounded-2xl text-[11px] max-w-[85%] leading-relaxed",
                                        msg.sender === "Seeker" ? "bg-royal/50 text-white rounded-br-sm border border-royal/30" : "bg-white/5 text-gold-light rounded-bl-sm border border-white/10"
                                    )}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                        <form onSubmit={handleSendMessage} className="p-3 bg-black/40 border-t border-white/5 flex gap-2">
                            <input
                                value={chatInput}
                                onChange={e => setChatInput(e.target.value)}
                                placeholder="Divine silence..."
                                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-gold/50 transition-all"
                            />
                            <button className="p-2.5 rounded-xl bg-gold text-black hover:bg-gold-light transition-all">
                                <Send className="w-4 h-4" />
                            </button>
                        </form>
                    </div>
                )}
            </div>

            {/* ═══════════════ ACTION DOCK (BOTTOM CENTER) ═══════════════ */}
            {isConsultant && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50">
                    <div className="glass-card rounded-[2.5rem] p-3 flex items-center gap-3 border-gold/20 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                        <button
                            onClick={handleDealPackage}
                            disabled={!clientProfile}
                            className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-gold to-gold-light text-black rounded-full font-black tracking-[0.2em] uppercase text-xs shadow-lg shadow-gold/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-30"
                        >
                            <Sparkles className="w-4 h-4" />
                            Cast Spread
                        </button>

                        <div className="w-[1px] h-8 bg-white/10 mx-2" />

                        <div className="flex gap-2">
                            <button
                                onClick={handleDrawCard}
                                className="w-12 h-12 glass-card rounded-full flex items-center justify-center hover:bg-white/10 transition-all group"
                                title="Single Draw"
                            >
                                <PlusSquare className="w-5 h-5 text-gold group-hover:text-white" />
                            </button>
                            <button
                                onClick={handleClearTable}
                                className="w-12 h-12 glass-card rounded-full flex items-center justify-center hover:bg-crimson/20 border-rose-500/10 transition-all group"
                                title="Purge Table"
                            >
                                <Trash2 className="w-5 h-5 text-rose-500 group-hover:text-rose-400" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════════ LOGS PANEL (BOTTOM LEFT) ═══════════════ */}
            <div className="absolute bottom-8 left-8 z-50 w-56">
                <div className="glass-card rounded-2xl p-4 border-gold/10 group h-32 hover:h-64 transition-all duration-700 flex flex-col overflow-hidden">
                    <div className="flex items-center gap-2 mb-3 opacity-40 group-hover:opacity-100 transition-opacity">
                        <Activity className="w-3.5 h-3.5 text-gold" />
                        <span className="text-[9px] font-black tracking-widest uppercase text-gold">Mystic Ledger</span>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
                        {logs.slice().reverse().map(log => (
                            <div key={log.id} className="text-[10px] text-ethereal/60 leading-tight pb-2 border-b border-white/5 last:border-0">
                                <span className="text-gold/40 text-[8px] font-mono mr-2">{log.timestamp}</span>
                                {log.message}
                            </div>
                        ))}
                    </div>
                </div>
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

