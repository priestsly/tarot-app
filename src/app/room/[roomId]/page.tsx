"use client";

import { use, useEffect, useState, useRef, useCallback, Suspense } from "react";
import { Copy, PlusSquare, ArrowLeft, Mic, MicOff, Video, VideoOff, Menu, X, Sparkles, Activity, MousePointer2, MessageCircle, Send, Trash2, Eye, EyeOff, Link2, Clock, Info, Share2, Camera, Volume2, VolumeX, LogOut, Maximize, Wand2, Loader2, Smile } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { io, Socket } from "socket.io-client";
import Peer from "peerjs";
import TarotCard, { CardState } from "@/components/TarotCard";
import { getCardMeaning } from "@/lib/cardData";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import EmojiPicker, { Theme } from "emoji-picker-react";

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
    interface ChatMessage { id: string; sender: string; text?: string; audioUrl?: string; timestamp: string; }

    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [cursors, setCursors] = useState<Record<string, CursorData>>({});
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState("");
    const [isChatOpen, setIsChatOpen] = useState(false);

    // Toast message (live stream style)
    const [toastMsg, setToastMsg] = useState<{ text: string; sender: string } | null>(null);
    const toastTimeout = useRef<NodeJS.Timeout | null>(null);

    // AI Interpretation
    const [aiLoading, setAiLoading] = useState(false);
    const [aiResponse, setAiResponse] = useState("");

    const lastCursorEmit = useRef<number>(0);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Notification beep
    const playNotifSound = useCallback(() => {
        try {
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            osc.frequency.setValueAtTime(1320, ctx.currentTime + 0.08);
            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.3);
            setTimeout(() => ctx.close(), 500);
        } catch { }
    }, []);

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
    const [isVideoBarVisible, setIsVideoBarVisible] = useState(false);
    const [remoteFullscreen, setRemoteFullscreen] = useState(false);

    // Exit Modal
    const [showExitModal, setShowExitModal] = useState(false);

    // Chat Voice Message State
    const [isRecording, setIsRecording] = useState(false);
    const [voiceRecorder, setVoiceRecorder] = useState<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    // Chat Enhanced State
    const [isTyping, setIsTyping] = useState(false);
    const [remoteTyping, setRemoteTyping] = useState(false);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    // Prevent Mobile Back Button Exit
    useEffect(() => {
        const handlePopState = (e: PopStateEvent) => {
            setShowExitModal(true);
            window.history.pushState(null, '', window.location.href);
        };
        window.history.pushState(null, '', window.location.href);
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    // Hold A for 5 seconds to show/hide Camera
    useEffect(() => {
        let timer: any = null;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key.toLowerCase() === 'a') {
                const target = e.target as HTMLElement;
                if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
                if (!timer) {
                    timer = setTimeout(() => {
                        setIsVideoBarVisible(v => !v);
                        timer = null;
                    }, 5000);
                }
            }
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key.toLowerCase() === 'a' && timer) {
                clearTimeout(timer);
                timer = null;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            if (timer) clearTimeout(timer);
        };
    }, []);

    const tableRef = useRef<HTMLDivElement>(null);

    // ── Session Timer ──
    const [sessionStart] = useState(() => Date.now());
    const [elapsed, setElapsed] = useState("00:00");
    useEffect(() => {
        const timer = setInterval(() => {
            const diff = Math.floor((Date.now() - sessionStart) / 1000);
            const m = String(Math.floor(diff / 60)).padStart(2, '0');
            const s = String(diff % 60).padStart(2, '0');
            setElapsed(`${m}:${s}`);
        }, 1000);
        return () => clearInterval(timer);
    }, [sessionStart]);

    // ── Card Info Panel ──
    const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
    const selectedCard = cards.find(c => c.id === selectedCardId);

    // ── Share Link ──
    const [linkCopied, setLinkCopied] = useState(false);
    const copyShareLink = () => {
        const url = `${window.location.origin}/?room=${roomId}`;
        navigator.clipboard.writeText(url);
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2500);
    };

    // ── Card meanings imported from separate file ──
    // (see src/lib/cardData.ts for full 78-card database)

    // ── Screenshot ──
    const captureScreenshot = async () => {
        const el = document.getElementById("tarot-table");
        if (!el) return;
        try {
            const html2canvas = (await import("html2canvas")).default;
            const canvas = await html2canvas(el, { backgroundColor: "#0C0B14", scale: 2 });
            const link = document.createElement("a");
            link.download = `tarot-${roomId}-${Date.now()}.png`;
            link.href = canvas.toDataURL("image/png");
            link.click();
            appendLog("Masa ekran görüntüsü kaydedildi");
        } catch { appendLog("Ekran görüntüsü alınamadı"); }
    };

    // ── Fullscreen ──
    const [isFullscreen, setIsFullscreen] = useState(false);
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    // ── Ambient Sound ──
    const [isAmbientOn, setIsAmbientOn] = useState(false);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const oscillatorsRef = useRef<OscillatorNode[]>([]);

    const toggleAmbient = () => {
        if (isAmbientOn) {
            oscillatorsRef.current.forEach(o => { try { o.stop(); } catch { } });
            oscillatorsRef.current = [];
            audioCtxRef.current?.close();
            audioCtxRef.current = null;
            setIsAmbientOn(false);
        } else {
            const ctx = new AudioContext();
            audioCtxRef.current = ctx;

            // Create a warm ambient drone
            const freqs = [65.41, 98.0, 130.81, 196.0]; // C2, G2, C3, G3
            const oscs: OscillatorNode[] = [];
            freqs.forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = i < 2 ? "sine" : "triangle";
                osc.frequency.setValueAtTime(freq, ctx.currentTime);
                gain.gain.setValueAtTime(0.03 / (i + 1), ctx.currentTime);
                // Slow LFO for movement
                const lfo = ctx.createOscillator();
                const lfoGain = ctx.createGain();
                lfo.frequency.setValueAtTime(0.1 + i * 0.05, ctx.currentTime);
                lfoGain.gain.setValueAtTime(0.01, ctx.currentTime);
                lfo.connect(lfoGain);
                lfoGain.connect(gain.gain);
                lfo.start();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                oscs.push(osc);
            });
            oscillatorsRef.current = oscs;
            setIsAmbientOn(true);
        }
    };

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
            // Notification sound
            playNotifSound();
            // Live toast
            const senderLabel = msg.sender === 'Consultant' ? 'Danışman' : (clientProfile?.name || 'Müşteri');
            setToastMsg({ text: msg.text || "🎤 Sesli Mesaj", sender: senderLabel });
            if (toastTimeout.current) clearTimeout(toastTimeout.current);
            toastTimeout.current = setTimeout(() => setToastMsg(null), 4000);
        });

        socket.on("activity-log", (logEntry: ActivityLog) => {
            setLogs(prev => {
                const newLogs = [...prev, logEntry];
                if (newLogs.length > 50) newLogs.shift();
                return newLogs;
            });
        });

        socket.on("user-typing", (isTyping: boolean) => {
            setRemoteTyping(isTyping);
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
    // ========== AI INTERPRETATION ==========
    const handleAiInterpret = async (cardIndex: number) => {
        if (aiLoading) return;
        setAiLoading(true);
        setAiResponse("");
        try {
            const info = getCardMeaning(cardIndex);
            const flippedCards = cards.filter(c => c.isFlipped).map(c => getCardMeaning(c.cardIndex).name);
            const res = await fetch("/api/interpret", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    card: info,
                    allCards: flippedCards,
                    clientName: clientProfile?.name || "Danışan"
                })
            });
            const data = await res.json();
            setAiResponse(data.interpretation || "Yorum alınamadı.");
        } catch {
            setAiResponse("AI yorumu şu an kullanılamıyor.");
        } finally {
            setAiLoading(false);
        }
    };

    // ========== TAROT INTERACTIONS ==========

    const handleClearTable = () => {
        appendLog("Cleared the mystical table");
        setCards([]);
        socket.emit("clear-table", roomId);
    };

    const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
        setChatInput(e.target.value);
        if (!isTyping) {
            setIsTyping(true);
            socket.emit("typing", roomId, true);
        }
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
            socket.emit("typing", roomId, false);
        }, 2000);
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            recorder.ondataavailable = e => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };
            recorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                audioChunksRef.current = [];

                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onloadend = () => {
                    const base64Audio = reader.result as string;
                    sendVoiceMessage(base64Audio);
                };
                stream.getTracks().forEach(track => track.stop());
            };
            audioChunksRef.current = [];
            recorder.start();
            setVoiceRecorder(recorder);
            setIsRecording(true);
        } catch (err) {
            console.error("Microphone access denied", err);
        }
    };

    const stopRecording = () => {
        if (voiceRecorder && isRecording) {
            voiceRecorder.stop();
            setIsRecording(false);
            setVoiceRecorder(null);
        }
    };

    const sendVoiceMessage = (base64Audio: string) => {
        const msg: ChatMessage = {
            id: Math.random().toString(36).substring(2, 9),
            sender: isConsultant ? "Consultant" : "Client",
            audioUrl: base64Audio,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, msg]);
        socket.emit("chat-message", roomId, msg);
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatInput.trim()) return;

        const msg: ChatMessage = {
            id: Math.random().toString(36).substring(2, 9),
            sender: isConsultant ? "Consultant" : "Client",
            text: chatInput.trim(),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, msg]);
        socket.emit("chat-message", roomId, msg);
        setChatInput("");
        setIsTyping(false);
        socket.emit("typing", roomId, false);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        setShowEmojiPicker(false);
    };

    const onEmojiClick = (emojiObject: any) => {
        setChatInput(prev => prev + emojiObject.emoji);
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
        if (isFlipped) {
            appendLog("Revealed a card's destiny");
            setSelectedCardId(id); // show meaning panel
        } else {
            if (selectedCardId === id) setSelectedCardId(null);
        }
        setCards(prev => prev.map(c => c.id === id ? { ...c, isReversed, isFlipped } : c));
        socket.emit("flip-card", roomId, id, isReversed, isFlipped);
    }, [roomId, appendLog, selectedCardId]);

    return (
        <div className="flex flex-col h-screen bg-bg text-text overflow-hidden font-inter relative">

            {/* ═══ FULL-BLEED TAROT TABLE ═══ */}
            <main
                className="flex-1 relative overflow-hidden bg-bg noise"
                onPointerMove={(e) => {
                    if (e.pointerType === 'touch') return;
                    const now = Date.now();
                    if (now - lastCursorEmit.current > 50) {
                        lastCursorEmit.current = now;
                        socket?.emit("cursor-move", roomId, { userId: socket.id, x: e.clientX, y: e.clientY });
                    }
                }}
            >
                {/* Ambient table glows — soft, diffused */}
                <div className="absolute inset-0 pointer-events-none z-0">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] h-[70vh] bg-purple-400/3 rounded-full blur-[220px]" />
                    <div className="absolute top-[20%] left-[10%] w-[300px] h-[300px] bg-indigo-400/3 rounded-full blur-[140px]" />
                    <div className="absolute bottom-[15%] right-[15%] w-[250px] h-[250px] bg-amber-300/2 rounded-full blur-[120px]" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,var(--color-bg)_80%)]" />
                </div>

                {/* Table grid texture */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(184,164,232,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(184,164,232,0.02)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none z-0" />

                {/* Live Cursors */}
                <div className="hidden md:block">
                    {Object.entries(cursors).map(([userId, pos]) => (
                        <div
                            key={userId}
                            className="absolute z-50 pointer-events-none transition-all duration-75 ease-linear"
                            style={{ left: pos.x, top: pos.y }}
                        >
                            <MousePointer2 className="w-5 h-5 text-accent fill-accent/60 drop-shadow-[0_0_6px_rgba(167,139,250,0.5)] -rotate-12" />
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

                {/* ═══ TOP BAR ═══ */}
                <div className="absolute top-0 inset-x-0 z-40 flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3">
                    {/* Left: Exit & Room ID */}
                    <div className="flex items-center gap-2">
                        <button onClick={() => setShowExitModal(true)} className="glass rounded-xl px-2 sm:px-3 py-2 flex items-center text-text-muted hover:text-danger transition-colors group" title="Odadan Çık">
                            <ArrowLeft className="w-4 h-4" />
                        </button>
                        <button onClick={copyRoomId} className="glass rounded-xl px-3 sm:px-4 py-2 flex items-center gap-2 hover:border-accent/30 transition-all group" title="Oda ID kopyala">
                            <span className="text-[10px] text-text-muted font-mono tracking-wider uppercase">Oda: <span className="text-text group-hover:text-accent transition-colors">{roomId}</span></span>
                            <Copy className="w-3 h-3 text-text-muted group-hover:text-accent transition-colors" />
                        </button>
                        {copied && <span className="text-[10px] text-accent font-semibold animate-pulse">Kopyalandı!</span>}
                    </div>

                    {/* Center: Timer + Status + Card count */}
                    <div className="glass rounded-full px-3 sm:px-5 py-1.5 sm:py-2 flex items-center gap-2 sm:gap-3">
                        <div className="hidden sm:flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-text-muted/50" />
                            <span className="text-[10px] text-text-muted font-mono tracking-wider">{elapsed}</span>
                            <div className="w-px h-3 bg-border ml-1" />
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className={`w-1.5 h-1.5 rounded-full ${remotePeerId ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
                            <span className="text-[9px] text-text-muted font-mono tracking-wider uppercase">{remotePeerId ? 'Bağlı' : 'Bekliyor'}</span>
                        </div>
                        <div className="w-px h-3 bg-border" />
                        <span className="text-[10px] text-text font-bold tracking-widest uppercase">{cards.length}</span>
                    </div>

                    {/* Right: Tools — hide extras on mobile */}
                    <div className="flex items-center gap-1">
                        {/* Desktop-only tools */}
                        <div className="hidden md:flex items-center gap-1">
                            {isConsultant && (
                                <button onClick={copyShareLink} className="glass rounded-xl px-3 py-2 flex items-center gap-1.5 text-text-muted hover:text-accent transition-colors" title="Müşteri davet linki kopyala">
                                    <Share2 className="w-3.5 h-3.5" />
                                    <span className="text-[9px] font-semibold tracking-wider uppercase">{linkCopied ? 'Kopyalandı!' : 'Davet'}</span>
                                </button>
                            )}
                            <button onClick={toggleAmbient} className={cn("glass rounded-xl p-2.5 transition-colors", isAmbientOn ? "text-accent" : "text-text-muted hover:text-accent")} title={isAmbientOn ? "Sesi Kapat" : "Ortam Sesi"}>
                                {isAmbientOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                            </button>
                            <button onClick={captureScreenshot} className="glass rounded-xl p-2.5 text-text-muted hover:text-accent transition-colors" title="Ekran Görüntüsü">
                                <Camera className="w-4 h-4" />
                            </button>
                            <button onClick={() => setIsVideoBarVisible(!isVideoBarVisible)} className="glass rounded-xl p-2.5 text-text-muted hover:text-accent transition-colors" title="Video">
                                {isVideoBarVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                        {/* Always visible: panel toggle */}
                        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="glass rounded-xl p-2 sm:p-2.5 text-text-muted hover:text-accent transition-colors">
                            {isSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                {/* ═══ PiP VIDEO (floating, top-right) — always in DOM to keep stream ═══ */}
                <div className={cn(
                    "absolute top-14 sm:top-16 right-2 sm:right-4 z-30 flex flex-col gap-1.5 sm:gap-2 transition-all duration-300",
                    isVideoBarVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full pointer-events-none"
                )}>
                    {/* Remote */}
                    <div className="w-28 sm:w-44 aspect-video rounded-lg sm:rounded-xl overflow-hidden glass relative cursor-pointer group" onClick={() => setRemoteFullscreen(true)}>
                        <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="text-[7px] sm:text-[9px] text-text-muted/40 font-mono tracking-widest animate-pulse">Bekleniyor...</span>
                        </div>
                        <div className="absolute bottom-0.5 left-1 px-1 py-0.5 bg-black/50 backdrop-blur-sm rounded text-[7px] sm:text-[8px] text-accent font-semibold tracking-wider uppercase">Karşı</div>
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <Maximize className="w-5 h-5 text-white/70" />
                        </div>
                    </div>
                    {/* Local — hidden from self, still streams to remote */}
                    <div className="hidden">
                        <video ref={myVideoRef} autoPlay playsInline muted />
                    </div>
                </div>

                {/* ═══ RIGHT DRAWER (Client Profile + Actions + Logs) ═══ */}
                <div className={cn(
                    "absolute top-16 right-4 z-30 w-72 max-h-[calc(100vh-130px)] bg-[#1a1825] border border-border rounded-2xl flex flex-col overflow-hidden transition-all duration-500 ease-out",
                    isSidebarOpen ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8 pointer-events-none"
                )} style={{ top: isVideoBarVisible ? 'calc(16px + 16rem)' : '64px' }}>
                    <div className="p-5 space-y-4 flex-1 overflow-y-auto">
                        {/* Client Profile */}
                        {isConsultant && clientProfile && (
                            <div className="bg-accent-dim border border-accent/15 rounded-xl p-4 space-y-2">
                                <h3 className="text-[10px] text-accent tracking-[0.15em] uppercase font-bold">Müşteri Profili</h3>
                                <p className="text-base font-bold text-text">{clientProfile.name}</p>
                                {(clientProfile.birth || clientProfile.time) && (
                                    <p className="text-xs text-text-muted">{clientProfile.birth} {clientProfile.time}</p>
                                )}
                                <div className="pt-2 border-t border-border mt-1">
                                    <p className="text-xs text-text-muted">Talep: <span className="text-text font-semibold">{clientProfile.cards} Kart</span></p>
                                </div>
                            </div>
                        )}

                        {/* Client waiting — only before cards are dealt */}
                        {!isConsultant && cards.length === 0 && (
                            <div className="bg-gold-dim border border-gold/15 rounded-xl p-4 text-center">
                                <Sparkles className="w-5 h-5 text-gold mx-auto mb-2 animate-pulse" />
                                <p className="text-xs text-text-muted">Danışmanınızın kartları dağıtmasını bekleyin...</p>
                            </div>
                        )}

                        {/* Activity Log */}
                        <div className="pt-3 border-t border-border">
                            <div className="flex items-center gap-2 mb-3">
                                <Activity className="w-3.5 h-3.5 text-accent/60" />
                                <span className="text-[10px] text-accent/60 font-bold tracking-[0.15em] uppercase">Akış</span>
                            </div>
                            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                                {logs.slice().reverse().map(log => (
                                    <div key={log.id} className="text-[10px] leading-relaxed border-l-2 border-accent/20 pl-2.5">
                                        <span className="text-text-muted/50 block font-mono tracking-wider">{log.timestamp}</span>
                                        <span className="text-text-muted">{log.message}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Leave Room */}
                        <div className="p-4 border-t border-border mt-3">
                            <button
                                onClick={() => setShowExitModal(true)}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 glass rounded-xl text-danger/80 hover:text-danger hover:bg-danger/10 text-xs font-semibold tracking-wide transition-all active:scale-[0.98]"
                            >
                                <LogOut className="w-4 h-4" />
                                Görüşmeyi Sonlandır
                            </button>
                        </div>
                    </div>
                </div>

                {/* ═══ FLOATING CHAT ═══ */}
                {
                    isChatOpen && (
                        <div className="absolute bottom-20 sm:bottom-6 left-2 sm:left-4 right-2 sm:right-auto z-40 sm:w-80 max-h-[350px] sm:max-h-[380px] bg-[#1a1825] border border-border rounded-2xl flex flex-col overflow-hidden shadow-2xl shadow-black/40">
                            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                                <span className="text-xs text-text font-semibold tracking-wider uppercase flex items-center gap-1.5">
                                    <MessageCircle className="w-3.5 h-3.5 text-accent" />
                                    Sohbet
                                </span>
                                <button onClick={() => setIsChatOpen(false)} className="text-text-muted hover:text-text transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[230px]">
                                {messages.length === 0 && (
                                    <p className="text-[10px] text-text-muted/40 text-center py-6 tracking-widest uppercase">Henüz mesaj yok...</p>
                                )}
                                {messages.slice(-20).map(msg => {
                                    const isMine = (isConsultant && msg.sender === 'Consultant') || (!isConsultant && msg.sender === 'Client');
                                    const label = isMine ? 'Sen' : (msg.sender === 'Consultant' ? 'Danışman' : (clientProfile?.name || 'Müşteri'));
                                    return (
                                        <div key={msg.id} className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}>
                                            <span className="text-[10px] font-semibold text-text-muted/60 uppercase tracking-wider mb-0.5 mx-1">{label}</span>
                                            <div className={`px-3.5 py-2.5 rounded-2xl max-w-[85%] text-sm leading-relaxed ${isMine
                                                ? "bg-accent/20 text-text rounded-tr-sm"
                                                : "bg-surface border border-border text-text rounded-tl-sm"
                                                }`}>
                                                {msg.audioUrl ? (
                                                    <audio controls src={msg.audioUrl} className="max-w-full sm:max-w-[200px] h-8" />
                                                ) : (
                                                    msg.text
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>
                            {remoteTyping && (
                                <div className="px-5 pb-2">
                                    <span className="text-[10px] text-text-muted/60 italic animate-pulse">Karşı taraf yazıyor...</span>
                                </div>
                            )}
                            <form onSubmit={handleSendMessage} className="relative flex items-center gap-2 p-3 border-t border-border">
                                {showEmojiPicker && (
                                    <div className="absolute bottom-14 left-0">
                                        <EmojiPicker onEmojiClick={onEmojiClick} theme={Theme.DARK} />
                                    </div>
                                )}
                                <button
                                    type="button"
                                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                    className="p-2 rounded-lg text-text-muted hover:text-accent hover:bg-accent/20 transition-all"
                                >
                                    <Smile className="w-4 h-4" />
                                </button>
                                <input
                                    type="text"
                                    value={chatInput}
                                    onChange={handleTyping}
                                    placeholder="Mesaj yazın..."
                                    autoFocus
                                    className="flex-1 bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent/40 transition-all placeholder:text-text-muted/40"
                                />
                                {!chatInput.trim() ? (
                                    <button
                                        type="button"
                                        onPointerDown={startRecording}
                                        onPointerUp={stopRecording}
                                        onPointerLeave={stopRecording}
                                        onContextMenu={e => e.preventDefault()}
                                        className={cn("p-2 rounded-full transition-all touch-none select-none", isRecording ? "bg-danger text-white scale-110 shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-pulse" : "bg-accent/10 text-accent hover:bg-accent/20")}
                                    >
                                        <Mic className="w-4 h-4" />
                                    </button>
                                ) : (
                                    <button type="submit" className="p-2 rounded-full bg-accent text-white hover:bg-accent-hover transition-all">
                                        <Send className="w-4 h-4" />
                                    </button>
                                )}
                            </form>
                        </div>
                    )
                }

                {/* ═══ LIVE MESSAGE TOAST ═══ */}
                {
                    toastMsg && (
                        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-[#1a1825]/95 border border-border rounded-2xl px-4 py-3 max-w-[80vw] sm:max-w-sm shadow-xl shadow-black/30 animate-pulse pointer-events-none">
                            <span className="text-[10px] text-accent font-bold uppercase tracking-wider block mb-0.5">{toastMsg.sender}</span>
                            <span className="text-sm text-text">{toastMsg.text}</span>
                        </div>
                    )
                }

                {/* ═══ CARD INFO PANEL (consultant only) ═══ */}
                {
                    isConsultant && selectedCard && selectedCard.isFlipped && (() => {
                        const info = getCardMeaning(selectedCard.cardIndex);
                        return (
                            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-40 bg-[#1a1825] border border-border rounded-2xl p-4 w-[28rem] max-w-[calc(100vw-2rem)] max-h-[55vh] sm:max-h-[65vh] overflow-y-auto shadow-2xl shadow-black/50">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Info className="w-4 h-4 text-accent shrink-0" />
                                            <span className="text-base text-text font-heading font-bold">{info.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/15 text-accent font-bold uppercase tracking-wider">{info.element}</span>
                                            <span className="text-xs text-text-muted">{info.keywords}</span>
                                        </div>
                                        <p className="text-base text-text/90 leading-relaxed mb-4">{info.meaning}</p>
                                        <button onClick={() => handleAiInterpret(selectedCard.cardIndex)} disabled={aiLoading} className="flex items-center gap-2 px-4 py-2.5 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-xl text-sm text-purple-200 font-semibold transition-all active:scale-[0.98] disabled:opacity-50 mt-2">
                                            {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                                            {aiLoading ? 'Yorumlanıyor, ruhlara fısıldanıyor...' : 'Mistik AI ile Yorumla'}
                                        </button>
                                        {aiResponse && (
                                            <div className="mt-4 p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl bg-gradient-to-b from-purple-500/5 to-transparent">
                                                <div className="flex items-center gap-1.5 mb-2">
                                                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                                                    <span className="text-[10px] text-purple-400 font-bold uppercase tracking-widest">Mistik AI Yorumu</span>
                                                </div>
                                                <p className="text-[15px] sm:text-base text-text/95 leading-[1.6] whitespace-pre-line tracking-wide drop-shadow-sm">{aiResponse}</p>
                                            </div>
                                        )}
                                    </div>
                                    <button onClick={() => { setSelectedCardId(null); setAiResponse(""); }} className="text-text-muted hover:text-text hover:bg-white/5 p-1.5 rounded-lg transition-colors shrink-0">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        );
                    })()
                }

                {/* ═══ FULLSCREEN REMOTE VIDEO OVERLAY ═══ */}
                {
                    remoteFullscreen && (
                        <div className="fixed inset-0 z-50 bg-black flex flex-col">
                            <video autoPlay playsInline className="flex-1 w-full h-full object-cover" ref={(el) => { if (el && remoteVideoRef.current?.srcObject) { el.srcObject = remoteVideoRef.current.srcObject; } }} />
                            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 p-2 glass rounded-2xl">
                                <button onClick={toggleMute} className={cn("p-3 rounded-xl transition-all", isMuted ? "bg-danger/30 text-danger" : "bg-white/10 text-white hover:bg-white/20")}>
                                    {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                                </button>
                                <button onClick={() => setRemoteFullscreen(false)} className="p-3 rounded-xl bg-danger/30 text-danger hover:bg-danger/50 transition-all">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="absolute top-4 left-4 glass rounded-xl px-4 py-2 flex items-center gap-3">
                                <Clock className="w-3.5 h-3.5 text-text-muted/50" />
                                <span className="text-xs text-text-muted font-mono">{elapsed}</span>
                                {clientProfile && <span className="text-xs text-text font-semibold">{clientProfile.name}</span>}
                            </div>
                        </div>
                    )
                }

                {/* ═══ BOTTOM TOOLBAR ═══ */}
                <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-0.5 sm:gap-1 p-1 sm:p-1.5 glass rounded-xl sm:rounded-2xl">
                    <button onClick={() => setIsChatOpen(!isChatOpen)} className={cn("p-2 sm:p-2.5 rounded-lg sm:rounded-xl transition-all relative", isChatOpen ? "text-gold bg-gold-dim" : "text-text-muted hover:text-gold hover:bg-gold-dim")} title="Sohbet">
                        <MessageCircle className="w-4 h-4" />
                        {messages.length > 0 && !isChatOpen && <div className="absolute top-0.5 right-0.5 w-2 h-2 bg-gold rounded-full animate-pulse" />}
                    </button>

                    {/* === CONSULTANT ACTIONS === */}
                    {isConsultant && (
                        <>
                            <div className="w-px h-5 sm:h-6 bg-border mx-0.5" />
                            <button onClick={handleDealPackage} disabled={!clientProfile} className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-purple-500/70 to-indigo-500/60 text-white/90 rounded-lg sm:rounded-xl font-semibold text-[11px] sm:text-xs tracking-wide transition-all hover:brightness-105 disabled:opacity-40 active:scale-[0.98]">
                                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                                <span className="hidden sm:inline">Dağıt</span>
                            </button>
                            <button onClick={handleDrawCard} className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl text-text-muted hover:text-accent hover:bg-accent-dim transition-all" title="Kart Çek">
                                <PlusSquare className="w-4 h-4" />
                            </button>
                            <button onClick={copyShareLink} className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl text-text-muted hover:text-accent hover:bg-accent-dim transition-all relative" title="Davet Linki">
                                <Share2 className="w-4 h-4" />
                                {linkCopied && <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full" />}
                            </button>
                            <button onClick={handleClearTable} className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl text-text-muted hover:text-danger hover:bg-danger/10 transition-all" title="Temizle">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </>
                    )}
                </div>

                {/* ═══ CUSTOM EXIT MODAL ═══ */}
                {
                    showExitModal && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                            <div className="bg-[#1a1825] border border-border rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4 relative overflow-hidden">
                                {/* Decorative background glow */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-danger/10 blur-[50px] rounded-full pointer-events-none" />

                                <h3 className="text-xl font-bold text-text mb-2 flex items-center gap-2">
                                    <LogOut className="w-5 h-5 text-danger" />
                                    Çıkış Onayı
                                </h3>
                                <p className="text-sm text-text-muted leading-relaxed">Gerçekten mistik masadan ayrılmak istiyor musunuz? Ses veya görüntü bağlantısı kesilecektir.</p>
                                <div className="flex gap-3 pt-5">
                                    <button onClick={() => setShowExitModal(false)} className="flex-1 py-3 px-4 rounded-xl glass text-text-muted hover:text-text hover:bg-white/5 transition-all text-sm font-semibold border border-transparent hover:border-border">Vazgeç</button>
                                    <button onClick={() => window.location.href = "/"} className="flex-1 py-3 px-4 rounded-xl bg-danger/90 text-white hover:bg-danger transition-all text-sm font-semibold shadow-[0_4px_14px_0_rgba(239,68,68,0.39)]">Çıkış Yap</button>
                                </div>
                            </div>
                        </div>
                    )
                }
            </main >
        </div >
    );
}

export default function RoomPage({ params }: { params: Promise<{ roomId: string }> }) {
    return (
        <Suspense fallback={<div className="h-screen w-full bg-midnight flex items-center justify-center"><div className="w-12 h-12 rounded-full border-t-2 border-purple-500 animate-spin"></div></div>}>
            <RoomContent params={params} />
        </Suspense>
    );
}
