"use client";

import { use, useEffect, useState, useRef, useCallback } from "react";
import { Copy, PlusSquare, ArrowLeft, Mic, MicOff, Video, VideoOff, Menu, X } from "lucide-react";
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

    const handleDrawCard = () => {
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
        setCards(prev => prev.map(c => c.id === id ? { ...c, isReversed, isFlipped } : c));
        socket.emit("flip-card", roomId, id, isReversed, isFlipped);
    }, [roomId]);

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

            {/* Overlay for mobile when sidebar is open */}
            {isSidebarOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-void/80 z-40 backdrop-blur-md"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

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

                <div className="relative group z-10">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-nebula to-mystic rounded-2xl blur opacity-20 group-hover:opacity-60 transition duration-500" />
                    <button
                        onClick={handleDrawCard}
                        className="w-full relative flex items-center justify-center gap-3 px-6 py-4 bg-[#0a0a12] text-white rounded-2xl font-semibold tracking-wide transition-all active:scale-[0.98] border border-white/10 overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-white/5 group-hover:bg-transparent transition-colors" />
                        <PlusSquare className="w-5 h-5 text-mystic relative z-10" />
                        <span className="relative z-10">Draw Card</span>
                    </button>
                </div>

                <div className="mt-auto pt-8 border-t border-white/10 relative z-10">
                    <p className="text-xs text-mystic/80 mb-4 font-cinzel font-bold tracking-widest uppercase">The Ritual Rituals</p>
                    <ul className="text-xs text-neutral-400 space-y-3 font-medium tracking-wide">
                        <li className="flex gap-2"><div className="w-1 h-1 rounded-full bg-ethereal mt-1.5" />Click <span className="text-white">Draw Card</span> to manifest</li>
                        <li className="flex gap-2"><div className="w-1 h-1 rounded-full bg-ethereal mt-1.5" />Drag cards across the aether</li>
                        <li className="flex gap-2"><div className="w-1 h-1 rounded-full bg-ethereal mt-1.5" />Double-click to reveal destiny</li>
                    </ul>
                </div>
            </aside>

            {/* Main Table Area */}
            <main className="flex-1 relative bg-transparent overflow-hidden">
                {/* Subtle astrolabe/grid pattern for the table context */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:100px_100px] pointer-events-none mix-blend-overlay" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,var(--color-void)_100%)] pointer-events-none" />

                {/* WebRTC Video Overlay (Top Right) */}
                <div className="absolute top-8 right-8 z-40 flex flex-col gap-6">
                    <div className="relative group">
                        {/* Remote Video Glow */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-ethereal to-nebula rounded-3xl blur opacity-30 group-hover:opacity-60 transition duration-1000" />
                        <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-black/50 backdrop-blur-md w-56 aspect-video shadow-2xl">
                            <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover mix-blend-luminosity hover:mix-blend-normal transition-all duration-700 pointer-events-none" />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 data-[novideo=true]:opacity-100 transition-opacity pointer-events-none">
                                <span className="text-sm text-ethereal/70 font-mono tracking-widest animate-pulse">Awaiting spirit...</span>
                            </div>
                        </div>
                    </div>

                    <div className="relative group translate-x-12">
                        {/* Local Video Glow */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-mystic to-nebula rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000" />
                        <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black/50 backdrop-blur-md w-36 aspect-video shadow-xl">
                            <video ref={myVideoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1] opacity-70 hover:opacity-100 transition-opacity duration-500" />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 justify-end translate-x-12 mt-2">
                        <button onClick={toggleMute} className={cn("p-3 rounded-xl transition-all shadow-lg backdrop-blur-md border", isMuted ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-white/5 text-mystic border-white/10 hover:bg-white/10 hover:border-mystic/30")}>
                            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                        </button>
                        <button onClick={toggleVideo} className={cn("p-3 rounded-xl transition-all shadow-lg backdrop-blur-md border", isVideoOff ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-white/5 text-ethereal border-white/10 hover:bg-white/10 hover:border-ethereal/30")}>
                            {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

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
