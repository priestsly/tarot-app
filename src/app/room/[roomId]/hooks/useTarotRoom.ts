import { useEffect, useState, useRef, useCallback, useMemo } from "react";

import { createClient } from "@/utils/supabase/client";
import Peer from "peerjs";
import { ActivityLog, CursorData, ChatMessage } from "../types";
import { CardState } from "@/components/TarotCard";
import { getCardMeaning } from "@/lib/cardData";

// Remove global socket to avoid cross-component pollution

export function useTarotRoom(roomId: string, searchParams: URLSearchParams) {
    // Role & Client Form Data
    const role = searchParams.get('role') || 'consultant'; // default to consultant
    const isConsultant = role === 'consultant';

    const [clientProfile, setClientProfile] = useState<{
        name: string;
        birth: string;
        time: string;
        pkgId: string;
        cards: number;
        focus?: string;
        gender?: string;
    } | null>(null);
    const clientProfileRef = useRef(clientProfile);
    useEffect(() => { clientProfileRef.current = clientProfile; }, [clientProfile]);

    const [copied, setCopied] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [showAurasPanel, setShowAurasPanel] = useState(false);
    const [fullShareUrl, setFullShareUrl] = useState("");
    const [currentAura, setCurrentAura] = useState(searchParams.get('focus') || 'Ruhsal');

    // Real-time State
    const [cards, setCards] = useState<CardState[]>([]);
    const cardsRef = useRef(cards); useEffect(() => { cardsRef.current = cards; }, [cards]);
    const [maxZIndex, setMaxZIndex] = useState(1);

    // Premium UI State
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const logsRef = useRef(logs); useEffect(() => { logsRef.current = logs; }, [logs]);
    const [cursors, setCursors] = useState<Record<string, CursorData>>({});
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const messagesRef = useRef(messages); useEffect(() => { messagesRef.current = messages; }, [messages]);
    const [chatInput, setChatInput] = useState("");
    const [isChatOpen, setIsChatOpen] = useState(false);

    // Toast message (live stream style)
    const [toastMsg, setToastMsg] = useState<{ text: string; sender: string } | null>(null);
    const toastTimeout = useRef<NodeJS.Timeout | null>(null);

    const [isConnecting, setIsConnecting] = useState(true);
    const [isReady, setIsReady] = useState(false);

    // AI Interpretation
    const [aiLoading, setAiLoading] = useState(false);
    const [aiResponse, setAiResponse] = useState("");

    const lastCursorEmit = useRef<number>(0);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const socketRef = useRef<any>(null);

    // Notification beep
    const playNotifSound = useCallback(() => {
        try {
            const ctx = new window.AudioContext();
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

    // SFX: Card flip sound — mystical chime
    const playCardFlipSound = useCallback(() => {
        try {
            const ctx = new window.AudioContext();
            // Chime 1
            const osc1 = ctx.createOscillator();
            const g1 = ctx.createGain();
            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(523, ctx.currentTime);  // C5
            osc1.frequency.setValueAtTime(659, ctx.currentTime + 0.1);  // E5
            osc1.frequency.setValueAtTime(784, ctx.currentTime + 0.2);  // G5
            g1.gain.setValueAtTime(0.12, ctx.currentTime);
            g1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
            osc1.connect(g1);
            g1.connect(ctx.destination);
            osc1.start(ctx.currentTime);
            osc1.stop(ctx.currentTime + 0.6);
            // Shimmer
            const osc2 = ctx.createOscillator();
            const g2 = ctx.createGain();
            osc2.type = 'triangle';
            osc2.frequency.setValueAtTime(1570, ctx.currentTime + 0.1);
            g2.gain.setValueAtTime(0.05, ctx.currentTime + 0.1);
            g2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
            osc2.connect(g2);
            g2.connect(ctx.destination);
            osc2.start(ctx.currentTime + 0.1);
            osc2.stop(ctx.currentTime + 0.5);
            setTimeout(() => ctx.close(), 800);
        } catch { }
    }, []);

    // SFX: Aura change — deep whoosh
    const playAuraChangeSound = useCallback(() => {
        try {
            const ctx = new window.AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const filter = ctx.createBiquadFilter();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(60, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.3);
            osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.8);
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(800, ctx.currentTime);
            filter.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.8);
            gain.gain.setValueAtTime(0.08, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.9);
            setTimeout(() => ctx.close(), 1200);
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
            userId: socketRef.current?.id || "Unknown"
        };
        socketRef.current?.emit("activity-log", roomId, logEntry);
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

    // Aura Color — deep, dark tones that keep the mystical mood
    const auraColor = useMemo(() => {
        const activeAura = clientProfile?.focus || currentAura;

        switch (activeAura) {
            case 'Aşk': return 'rgba(120, 30, 50, 0.65)';      // Deep dark crimson
            case 'Para': return 'rgba(100, 80, 20, 0.55)';      // Dark antique gold
            case 'Kariyer': return 'rgba(20, 40, 100, 0.55)';    // Deep midnight blue
            case 'Yaratıcılık': return 'rgba(15, 60, 80, 0.55)'; // Dark ocean teal
            case 'Ruhsal':
            default:
                return 'rgba(50, 30, 90, 0.50)';                 // Deep indigo
        }
    }, [clientProfile?.focus, currentAura]);

    const handleAuraChange = useCallback((newAura: string) => {
        setCurrentAura(newAura);
        playAuraChangeSound();
        socketRef.current?.emit("update-aura", roomId, newAura);
        if (isConsultant && clientProfile) {
            setClientProfile(prev => prev ? { ...prev, focus: newAura } : null);
        }
    }, [isConsultant, clientProfile, playAuraChangeSound, roomId]);

    // Initialize fullShareUrl on mount so it's always ready
    useEffect(() => {
        if (typeof window !== 'undefined') {
            setFullShareUrl(`${window.location.origin}/?room=${roomId}`);
        }
    }, [roomId]);

    const copyShareLink = useCallback(() => {
        const url = `${window.location.origin}/?room=${roomId}`;
        navigator.clipboard.writeText(url);
        setLinkCopied(true);
        setFullShareUrl(url);
        setShowShareModal(true);
        setTimeout(() => setLinkCopied(false), 2000);
        appendLog("Davet linki kopyalandı");
    }, [roomId, appendLog]);

    // ── Screenshot ──
    const captureScreenshot = async () => {
        const el = document.getElementById("tarot-table");
        if (!el) return;
        try {
            const html2canvas = (await import("html2canvas")).default;
            const canvas = await html2canvas(el, {
                backgroundColor: "#0C0B14",
                scale: 2,
                useCORS: true,
                allowTaint: true,
                logging: false,
            });
            const dataUrl = canvas.toDataURL("image/png", 1.0);
            const link = document.createElement("a");
            link.download = `tarot-${roomId}-${Date.now()}.png`;
            link.href = dataUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
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
            const ctx = new window.AudioContext();
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
        if (!isReady) return; // Wait for user to manually click 'Ready'

        // 1. Initialize Supabase Realtime "Socket"
        if (!socketRef.current) {
            const supabase = createClient();
            const channel = supabase.channel(`room:${roomId}`, {
                config: {
                    broadcast: { self: false },
                    presence: { key: 'pending' } // will update when peer connects
                }
            });

            const fakeSocket: any = {
                id: "",
                channel,
                connected: false,
                queue: [],
                emit: (event: string, ...args: any[]) => {
                    let outEvent = event;
                    let outArgs = args;

                    if (event === "add-card") outEvent = "card-added";
                    else if (event === "update-card") outEvent = "card-updated";
                    else if (event === "flip-card") outEvent = "card-flipped";
                    else if (event === "clear-table") { outEvent = "sync-state"; outArgs = [roomId, []]; }
                    else if (event === "sync-all-cards") outEvent = "sync-state";
                    else if (event === "update-client-profile") outEvent = "client-profile-updated";
                    else if (event === "update-aura") outEvent = "aura-updated";
                    else if (event === "typing") outEvent = "user-typing";

                    const sendPayload = () => {
                        channel.send({
                            type: "broadcast",
                            event: outEvent,
                            payload: { args: outArgs }
                        });
                    };

                    if (fakeSocket.connected) {
                        sendPayload();
                    } else {
                        fakeSocket.queue.push(sendPayload);
                    }
                },
                on: (event: string, callback: (...args: any[]) => void) => {
                    channel.on("broadcast", { event }, ({ payload }) => {
                        let args = payload?.args || [];
                        if (args.length > 0 && args[0] === roomId) {
                            args = args.slice(1);
                        }
                        callback(...args);
                    });
                },
                disconnect: () => {
                    supabase.removeChannel(channel);
                }
            };
            socketRef.current = fakeSocket;
            channel.subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    fakeSocket.connected = true;
                    if (fakeSocket.id) {
                        channel.track({ peerId: fakeSocket.id, role: isConsultant ? 'consultant' : 'client' });
                    }
                    while (fakeSocket.queue.length > 0) {
                        const sendPayload = fakeSocket.queue.shift();
                        if (sendPayload) sendPayload();
                    }

                    // If no one is in the room after 3 seconds, hide connecting overlay so consultant can wait
                    setTimeout(() => {
                        setIsConnecting(false);
                    }, 3000);
                }
            });
        }
        const socket = socketRef.current;

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
                socket.id = id;
                // Tracking presence implicitly triggers if subscribed already, otherwise queues
                if (socket.connected) {
                    socket.channel?.track({ peerId: id, role: isConsultant ? 'consultant' : 'client' });
                }
                socket.emit("user-connected", id); // Broadcast arrival explicitly

                // If I am the client, I announce that I am ready to receive data
                if (!isConsultant) {
                    socket.emit("client-ready", id);
                } else {
                    socket.emit("consultant-ready", id);
                }
            });

            // Answer incoming calls
            peerRef.current.on('call', call => {
                setRemotePeerId(call.peer);
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

            // Listen for NEW users connecting explicitly via broadcast
            socket.on('user-connected', (userId: string) => {
                if (userId && userId !== socket.id) {
                    console.log("User connected (broadcast):", userId);
                    setRemotePeerId(userId);
                    setIsConnecting(false);
                    connectToNewUser(userId, mediaStream);

                    // Join notification toast
                    const profile = clientProfileRef.current;
                    const joinName = profile?.name || "Bir kullanıcı";
                    appendLog(`${joinName} odaya giriş yaptı`);
                    setToastMsg({ text: `${joinName} odaya giriş yaptı ✨`, sender: "Sistem" });
                    if (toastTimeout.current) clearTimeout(toastTimeout.current);
                    toastTimeout.current = setTimeout(() => setToastMsg(null), 5000);
                }
            });

            // Handshake: Client is ready, Consultant sends the room state
            socket.on('client-ready', (clientId: string) => {
                if (isConsultant && clientId !== socket.id) {
                    console.log("Client is ready, sending sync data...");
                    if (cardsRef.current.length > 0) socket.emit("sync-state", roomId, cardsRef.current);
                    if (logsRef.current.length > 0) socket.emit("sync-logs", roomId, logsRef.current);
                    if (messagesRef.current.length > 0) socket.emit("sync-messages", roomId, messagesRef.current);
                }
            });

            // Handshake: Consultant is ready, Client sends their profile data
            socket.on('consultant-ready', (consultantId: string) => {
                if (!isConsultant && consultantId !== socket.id) {
                    console.log("Consultant is ready, sending profile data...");
                    if (clientProfileRef.current) {
                        socket.emit("update-client-profile", roomId, clientProfileRef.current);
                    }
                }
            });

            // Handle user disconnect via Presence
            socket.channel?.on('presence', { event: 'leave' }, ({ leftPresences }: any) => {
                leftPresences.forEach((p: any) => {
                    if (p.peerId && p.peerId !== socket.id) {
                        console.log("User disconnected (presence):", p.peerId);
                        if (remoteVideoRef.current) {
                            remoteVideoRef.current.srcObject = null;
                        }

                        // Disconnect notification toast
                        const profile = clientProfileRef.current;
                        const leaveName = profile?.name || "Bir kullanıcı";
                        appendLog(`${leaveName} odadan ayrıldı`);
                        setToastMsg({ text: `${leaveName} odadan ayrıldı 👋`, sender: "Sistem" });
                        if (toastTimeout.current) clearTimeout(toastTimeout.current);
                        toastTimeout.current = setTimeout(() => setToastMsg(null), 5000);

                        setRemotePeerId("");
                        setCursors(prev => {
                            const next = { ...prev };
                            delete next[p.peerId];
                            return next;
                        });
                    }
                });
            });
        };

        // 2. Setup User Media (Camera/Mic) IMMEDIATELY
        navigator.mediaDevices.getUserMedia({
            video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
            audio: true
        })
            .then(stream => {
                // Mute mic by default right after getting access, for both users
                stream.getAudioTracks().forEach(t => t.enabled = false);
                setIsMuted(true);

                streamRef.current = stream;
                if (myVideoRef.current) {
                    myVideoRef.current.srcObject = stream;
                }
                initPeerAndJoin(stream);
            })
            .catch(err => {
                console.error("Failed to get local stream", err);
                // Fallback to dummy stream if user denies camera explicitly so text chat still works
                createDummyAndJoin();
            });

        function createDummyAndJoin() {
            try {
                const canvas = document.createElement("canvas");
                canvas.width = 640;
                canvas.height = 480;
                const ctx2 = canvas.getContext("2d");
                if (ctx2) {
                    ctx2.fillStyle = "black";
                    ctx2.fillRect(0, 0, canvas.width, canvas.height);
                }
                const videoStream = (canvas as any).captureStream(1);
                const audioCtx2 = new (window.AudioContext || (window as any).webkitAudioContext)();
                const destNode = audioCtx2.createMediaStreamDestination();
                const dummyStream = new MediaStream([
                    ...videoStream.getVideoTracks(),
                    ...destNode.stream.getAudioTracks()
                ]);
                dummyStream.getTracks().forEach(t => t.enabled = false);
                streamRef.current = dummyStream;
                initPeerAndJoin(dummyStream);
            } catch (fallbackErr) {
                console.error("Dummy stream creation failed", fallbackErr);
                initPeerAndJoin(new MediaStream());
            }
        }

        // Note: Disconnect is now handled by Supabase Presence ^

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
            const profile = clientProfileRef.current;
            const senderLabel = msg.sender === 'Consultant' ? 'Danışman' : (profile?.name || 'Müşteri');
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

        socket.on("aura-updated", (aura: string) => {
            setCurrentAura(aura);
        });

        return () => {
            socket?.disconnect();
            peerRef.current?.destroy();
            const tracks = streamRef.current?.getTracks();
            tracks?.forEach(track => track.stop());
            socketRef.current = null;
        };
    }, [roomId, playNotifSound, isReady]);

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
            const flippedCards = cards.filter(c => c.isFlipped).map(c => ({
                ...getCardMeaning(c.cardIndex),
                isReversed: c.isReversed
            }));

            const res = await fetch("/api/interpret", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    card: cardIndex === -1 ? null : { ...getCardMeaning(cardIndex), isReversed: selectedCard?.isReversed },
                    allCards: flippedCards.map(c => c.name),
                    allCardsDetailed: cardIndex === -1 ? flippedCards : null,
                    clientName: clientProfile?.name || "Danışan",
                    focus: clientProfile?.focus || searchParams.get('focus') || ""
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
        socketRef.current?.emit("clear-table", roomId);
    };

    const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
        setChatInput(e.target.value);
        if (!isTyping) {
            setIsTyping(true);
            socketRef.current?.emit("typing", roomId, true);
        }
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
            socketRef.current?.emit("typing", roomId, false);
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
        socketRef.current?.emit("chat-message", roomId, msg);
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
        socketRef.current?.emit("chat-message", roomId, msg);
        setChatInput("");
        setIsTyping(false);
        socketRef.current?.emit("typing", roomId, false);
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
        socketRef.current?.emit("add-card", roomId, newCard);
    };

    const handleDrawRumiCard = () => {
        appendLog("Rumi destesinden bir kart çekti");
        const newCard: CardState = {
            id: Math.random().toString(36).substring(2, 9),
            cardIndex: Math.floor(Math.random() * 78), // 0-77
            deckType: 'rumi',
            x: 50, // Bottom center dealing
            y: 80 + Math.random() * 5, // Slight jitter
            isFlipped: false,
            isReversed: false,
            zIndex: maxZIndex
        };
        setMaxZIndex(prev => prev + 1);

        // Optimistic update
        setCards(prev => [...prev, newCard]);
        socketRef.current?.emit("add-card", roomId, newCard);
    };

    const handleDealPackage = useCallback(() => {
        if (!isConsultant) return;
        const count = clientProfile?.cards || 3;
        const pkgId = clientProfile?.pkgId || 'standard';
        appendLog(`Dealt the ${count}-card package for ${clientProfile?.name || 'the Client'}`);

        const usedIndices = new Set<number>();
        const spread: CardState[] = [];

        // Handle special "relation" mode for Single Eril/Disil card
        if (pkgId === 'relation') {
            const deckType = clientProfile?.gender === "Kadın" ? "disil" : "eril";
            const maxIdx = 54;
            const idx = Math.floor(Math.random() * maxIdx) + 1; // 1 to 54
            spread.push({
                id: Math.random().toString(36).substring(2, 9),
                cardIndex: idx,
                deckType,
                x: 50,
                y: 45,
                isFlipped: false,
                isReversed: false, // Or allow reversed if you want
                zIndex: maxZIndex + 1
            });
        } else {
            for (let i = 0; i < count; i++) {
                let idx: number;
                do { idx = Math.floor(Math.random() * 78); } while (usedIndices.has(idx));
                usedIndices.add(idx);

                // Positioning logic based on popular spreads
                let xPos = 50;
                let yPos = 45;

                if (pkgId === 'standard') {
                    xPos = count === 1 ? 50 : 15 + (70 * i) / (count - 1);
                } else if (pkgId === 'synastry') {
                    // Heart-ish shape or two columns
                    xPos = i < 3 ? 30 : (i < 6 ? 70 : 50);
                    yPos = 30 + (i % 3) * 20;
                } else if (pkgId === 'celtic') {
                    // Cross + Pillar
                    const crossX = [50, 50, 50, 50, 35, 65];
                    const crossY = [45, 45, 25, 65, 45, 45];
                    const pillarX = [85, 85, 85, 85];
                    const pillarY = [75, 55, 35, 15];
                    if (i < 6) { xPos = crossX[i]; yPos = crossY[i]; }
                    else { xPos = pillarX[i - 6]; yPos = pillarY[i - 6]; }
                } else {
                    xPos = 15 + (Math.random() * 70);
                    yPos = 20 + (Math.random() * 50);
                }

                spread.push({
                    id: Math.random().toString(36).substring(2, 9),
                    cardIndex: idx,
                    x: xPos,
                    y: yPos,
                    isFlipped: false,
                    isReversed: Math.random() > 0.3, // 30% chance of being reversed
                    zIndex: maxZIndex + i + 1
                });
            }
        }
        setMaxZIndex(prev => prev + (pkgId === 'relation' ? 1 : count));
        setCards(prev => [...prev, ...spread]);
        spread.forEach(c => socketRef.current?.emit("add-card", roomId, c));
    }, [isConsultant, clientProfile, maxZIndex, roomId, appendLog]);

    // Role-based Profile Syncing
    useEffect(() => {
        const socket = socketRef.current;
        if (!socket) return;

        const syncProfile = () => {
            if (!isConsultant && searchParams.get('name')) {
                const data = {
                    name: searchParams.get('name') || '',
                    birth: searchParams.get('birth') || '',
                    time: searchParams.get('time') || '',
                    pkgId: searchParams.get('pkgId') || '',
                    cards: Number(searchParams.get('cards')) || 0,
                    focus: searchParams.get('focus') || '',
                    gender: searchParams.get('gender') || '',
                };
                socket.emit("update-client-profile", roomId, data);
            }
        };

        if (socket.connected) {
            syncProfile();
        } else {
            const int = setInterval(() => {
                if (socketRef.current?.connected) {
                    syncProfile();
                    clearInterval(int);
                }
            }, 500);
            return () => clearInterval(int);
        }
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
        if (updatedCard) socketRef.current?.emit("update-card", roomId, updatedCard);
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
        if (updatedCard) socketRef.current?.emit("update-card", roomId, updatedCard);
    }, [roomId]);

    const handleFlipEnd = useCallback((id: string, isReversed: boolean, isFlipped: boolean) => {
        if (isFlipped) {
            appendLog("Revealed a card's destiny");
            setSelectedCardId(id);
            playCardFlipSound();
        } else {
            if (selectedCardId === id) setSelectedCardId(null);
        }
        setCards(prev => prev.map(c => c.id === id ? { ...c, isReversed, isFlipped } : c));
        socketRef.current?.emit("flip-card", roomId, id, isReversed, isFlipped);
    }, [roomId, appendLog, selectedCardId, playCardFlipSound]);

    const handleCursorMove = (e: React.PointerEvent) => {
        if (e.pointerType === 'touch') return;
        const now = Date.now();
        if (now - lastCursorEmit.current > 50) {
            lastCursorEmit.current = now;
            socketRef.current?.emit("cursor-move", roomId, { userId: socketRef.current.id, x: e.clientX, y: e.clientY });
        }
    }

    return {
        // State
        role, isConsultant, clientProfile, copied, isSidebarOpen,
        cards, maxZIndex, logs, cursors, messages, chatInput, isChatOpen,
        toastMsg, aiLoading, aiResponse, remotePeerId, isMuted, isVideoOff,
        isVideoBarVisible, remoteFullscreen, showExitModal, isRecording,
        remoteTyping, showEmojiPicker, elapsed, selectedCardId, selectedCard,
        linkCopied, isAmbientOn, isFullscreen, auraColor,

        showShareModal,
        fullShareUrl,
        showAurasPanel,
        currentAura,
        isConnecting,
        isReady,

        // Setters
        setIsSidebarOpen,
        setIsReady,
        setChatInput, setIsChatOpen, setRemoteFullscreen,
        setShowExitModal, setShowEmojiPicker, setSelectedCardId, setAiResponse,
        setShowShareModal,
        setShowAurasPanel,
        handleAuraChange,

        // Refs
        messagesEndRef, myVideoRef, remoteVideoRef, tableRef,

        // Handlers
        copyRoomId, toggleMute, toggleVideo, handleAiInterpret, handleClearTable,
        handleTyping, startRecording, stopRecording, handleSendMessage, onEmojiClick,
        handleDrawCard, handleDrawRumiCard, handleDealPackage, handlePointerDown, handleDragEnd, handleFlipEnd,
        copyShareLink, captureScreenshot, toggleFullscreen, toggleAmbient, handleCursorMove
    };
}
