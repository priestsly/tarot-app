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

                // 3. Initialize WebRTC peer via PeerJS ONCE STREAM IS READY
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

                    // Join Room ONLY when we have a media stream and a peer ID
                    socket.emit("join-room", roomId, id);
                });

                // Answer incoming calls
                peerRef.current.on('call', call => {
                    call.answer(stream);
                    call.on('stream', remoteStream => {
                        console.log("Received remote stream (answering)", remoteStream.id);
                        if (remoteVideoRef.current && remoteVideoRef.current.srcObject !== remoteStream) {
                            remoteVideoRef.current.srcObject = remoteStream;
                            remoteVideoRef.current.onloadedmetadata = () => {
                                remoteVideoRef.current?.play().catch(e => console.error("Play error:", e));
                            };
                        }
                    });
                });

                // Listen for new users connecting
                socket.on("user-connected", (userId: string) => {
                    console.log("User connected:", userId);
                    setRemotePeerId(userId);
                    // Call the new user
                    connectToNewUser(userId, stream);
                });
            })
            .catch(err => {
                console.error("Failed to get local stream", err);
                // Fallback: still join room but no camera
                peerRef.current = new Peer({
                    config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }
                });
                peerRef.current.on('open', (id) => {
                    setMyPeerId(id);
                    socket.emit("join-room", roomId, id);
                });
                socket.on("user-connected", (userId: string) => setRemotePeerId(userId));
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

    function connectToNewUser(userId: string, stream: MediaStream | null) {
        if (!peerRef.current) return;
        console.log("Calling user", userId);

        // PeerJS requires a MediaStream when calling, if we don't have one, we can call without it
        // and just wait to receive their stream. However, in PeerJS, to receive a stream, you often
        // need to initiate the call object properly. We can pass an empty stream or use modern APIs:
        const call = stream ? peerRef.current.call(userId, stream) : peerRef.current.call(userId, new MediaStream());

        call.on('stream', remoteStream => {
            console.log("Received remote stream (calling)", remoteStream.id);
            if (remoteVideoRef.current && remoteVideoRef.current.srcObject !== remoteStream) {
                remoteVideoRef.current.srcObject = remoteStream;
                // Ensure playback starts
                remoteVideoRef.current.onloadedmetadata = () => {
                    remoteVideoRef.current?.play().catch(e => console.error("Play error:", e));
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
        <div className="flex h-screen bg-neutral-950 text-neutral-50 overflow-hidden font-sans">

            {/* Mobile Toggle */}
            <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="md:hidden absolute top-6 left-6 z-50 p-2.5 bg-neutral-900/80 backdrop-blur-md border border-neutral-800 rounded-xl text-white shadow-xl hover:bg-neutral-800 transition-colors"
            >
                {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Overlay for mobile when sidebar is open */}
            {isSidebarOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar / Left Menu */}
            <aside className={cn(
                "fixed md:relative inset-y-0 left-0 w-64 bg-neutral-900 border-r border-neutral-800 flex flex-col p-6 space-y-8 z-50 shadow-2xl transition-transform duration-300",
                isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
            )}>
                <div className="space-y-4 pt-12 md:pt-0">
                    <button
                        onClick={() => router.push("/")}
                        className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors text-sm font-medium"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Leave Room
                    </button>
                    <div>
                        <h2 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">Mystic Tarot</h2>
                        <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg group hover:border-neutral-700 transition-colors">
                            <span className="text-xs text-neutral-500 font-mono truncate flex-1">ID: {roomId}</span>
                            <button onClick={copyRoomId} className="text-neutral-500 hover:text-white transition-colors" title="Copy Room ID">
                                <Copy className="w-4 h-4" />
                            </button>
                        </div>
                        {copied && <p className="text-xs text-green-400 mt-2">Copied to clipboard!</p>}
                    </div>
                </div>

                <button
                    onClick={handleDrawCard}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white text-neutral-950 rounded-xl font-medium transition-all hover:bg-neutral-200 active:scale-95 shadow-xl shadow-white/5"
                >
                    <PlusSquare className="w-5 h-5" />
                    Draw Card
                </button>

                <div className="mt-auto pt-8 border-t border-neutral-800">
                    <p className="text-xs text-neutral-500 mb-2 font-medium">How to play</p>
                    <ul className="text-xs text-neutral-400 space-y-2">
                        <li>• Click <span className="text-white">Draw Card</span> to place a random card</li>
                        <li>• Drag cards across the table</li>
                        <li>• Double-click cards to flip them</li>
                    </ul>
                </div>
            </aside>

            {/* Main Table Area */}
            <main className="flex-1 relative bg-neutral-950 overflow-hidden">
                {/* Subtle grid pattern for the table context */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />

                {/* WebRTC Video Overlay (Top Right) */}
                <div className="absolute top-6 right-6 z-40 flex flex-col gap-4">
                    <div className="relative group overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 w-48 aspect-video shadow-2xl">
                        <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover bg-neutral-900 pointer-events-none" />
                        <div className="absolute inset-0 bg-neutral-900 flex items-center justify-center opacity-0 data-[novideo=true]:opacity-100 transition-opacity pointer-events-none">
                            <span className="text-sm text-neutral-500">Waiting for peer...</span>
                        </div>
                    </div>
                    <div className="relative overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900 w-32 aspect-video shadow-xl translate-x-12">
                        <video ref={myVideoRef} autoPlay playsInline muted className="w-full h-full object-cover bg-neutral-900 transform scale-x-[-1]" />
                    </div>

                    <div className="flex items-center gap-2 justify-end translate-x-12">
                        <button onClick={toggleMute} className={cn("p-2 rounded-full border transition-colors", isMuted ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-neutral-800 text-white border-neutral-700 hover:bg-neutral-700")}>
                            {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                        </button>
                        <button onClick={toggleVideo} className={cn("p-2 rounded-full border transition-colors", isVideoOff ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-neutral-800 text-white border-neutral-700 hover:bg-neutral-700")}>
                            {isVideoOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                {/* Tarot Cards Table Area */}
                <div className="absolute inset-0 z-10 w-full h-full" id="tarot-table">
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
