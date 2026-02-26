import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { io, Socket } from "socket.io-client";
import Peer from "peerjs";
import { ActivityLog, CursorData, ChatMessage } from "../types";
import { CardState } from "@/components/TarotCard";

export function useTarotRoom(roomId: string, searchParams: URLSearchParams) {
    const role = searchParams.get('role') || 'consultant';
    const isConsultant = role === 'consultant';

    // State
    const [clientProfile, setClientProfile] = useState<{
        name: string; birth: string; time: string; pkgId: string; cards: number; focus?: string;
    } | null>(null);
    const clientProfileRef = useRef(clientProfile);
    useEffect(() => { clientProfileRef.current = clientProfile; }, [clientProfile]);

    const [copied, setCopied] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [cards, setCards] = useState<CardState[]>([]);
    const [maxZIndex, setMaxZIndex] = useState(1);
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [cursors, setCursors] = useState<Record<string, CursorData>>({});
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState("");
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [remoteTyping, setRemoteTyping] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [toastMsg, setToastMsg] = useState<{ text: string; sender: string } | null>(null);
    const [remotePeerId, setRemotePeerId] = useState("");
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [isVideoBarVisible, setIsVideoBarVisible] = useState(false);
    const [remoteFullscreen, setRemoteFullscreen] = useState(false);
    const [showExitModal, setShowExitModal] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [elapsed, setElapsed] = useState("00:00");
    const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
    const [linkCopied, setLinkCopied] = useState(false);
    const [isAmbientOn, setIsAmbientOn] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [auraColor, setAuraColor] = useState("rgba(139, 92, 246, 0.1)");
    const [aiLoading, setAiLoading] = useState(false);
    const [aiResponse, setAiResponse] = useState("");

    // Refs
    const socketRef = useRef<Socket | null>(null);
    const peerRef = useRef<Peer | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const myVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const tableRef = useRef<HTMLDivElement>(null);
    const lastCursorEmit = useRef<number>(0);
    const toastTimeout = useRef<NodeJS.Timeout | null>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const oscillatorsRef = useRef<OscillatorNode[]>([]);
    const startTimeRef = useRef<number>(Date.now());

    const selectedCard = useMemo(() => cards.find(c => c.id === selectedCardId), [cards, selectedCardId]);

    // Timer
    useEffect(() => {
        const interval = setInterval(() => {
            const diff = Date.now() - startTimeRef.current;
            const mins = Math.floor(diff / 60000).toString().padStart(2, '0');
            const secs = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
            setElapsed(`${mins}:${secs}`);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const playNotifSound = useCallback(() => {
        try {
            const ctx = new window.AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
            osc.connect(gain); gain.connect(ctx.destination);
            osc.start(); osc.stop(ctx.currentTime + 0.3);
        } catch { }
    }, []);

    const appendLog = useCallback((message: string) => {
        const logEntry: ActivityLog = {
            id: Math.random().toString(36).substring(2, 9),
            message,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            userId: socketRef.current?.id || "Unknown"
        };
        socketRef.current?.emit("activity-log", roomId, logEntry);
    }, [roomId]);

    // Socket & Peer
    useEffect(() => {
        if (!socketRef.current) socketRef.current = io();
        const socket = socketRef.current;

        const initPeerAndJoin = (mediaStream: MediaStream) => {
            peerRef.current = new Peer({ config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] } });
            peerRef.current.on('open', (id) => socket.emit("join-room", roomId, id));
            peerRef.current.on('call', call => {
                setRemotePeerId(call.peer);
                call.answer(mediaStream);
                call.on('stream', rs => { if (remoteVideoRef.current) remoteVideoRef.current.srcObject = rs; });
            });
            socket.on("user-connected", (uid: string) => {
                setRemotePeerId(uid);
                peerRef.current?.call(uid, mediaStream)?.on('stream', rs => { if (remoteVideoRef.current) remoteVideoRef.current.srcObject = rs; });
            });
        };

        const canvas = document.createElement("canvas"); canvas.width = 1; canvas.height = 1;
        const vStream = (canvas as any).captureStream(1);
        const aCtx = new AudioContext();
        const dest = aCtx.createMediaStreamDestination();
        const dStream = new MediaStream([...vStream.getVideoTracks(), ...dest.stream.getAudioTracks()]);
        dStream.getTracks().forEach(t => t.enabled = false);
        streamRef.current = dStream;
        initPeerAndJoin(dStream);

        socket.on("user-disconnected", () => { setRemotePeerId(""); if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null; });
        socket.on("sync-logs", (l: ActivityLog[]) => setLogs(l));
        socket.on("sync-messages", (m: ChatMessage[]) => setMessages(m));
        socket.on("chat-message", (msg: ChatMessage) => {
            setMessages(prev => [...prev.slice(-99), msg]);
            playNotifSound();
            const prof = clientProfileRef.current;
            setToastMsg({ text: msg.text || "🎤 Sesli Mesaj", sender: msg.sender === 'Consultant' ? 'Danışman' : (prof?.name || 'Müşteri') });
            if (toastTimeout.current) clearTimeout(toastTimeout.current);
            toastTimeout.current = setTimeout(() => setToastMsg(null), 4000);
        });
        socket.on("activity-log", (l: ActivityLog) => setLogs(prev => [...prev.slice(-49), l]));
        socket.on("user-typing", (t: boolean) => setRemoteTyping(t));
        socket.on("cursor-move", (d: any) => setCursors(prev => ({ ...prev, [d.userId]: { x: d.x, y: d.y } })));
        socket.on("sync-state", (s: CardState[]) => { setCards(s); setMaxZIndex(Math.max(0, ...s.map(c => c.zIndex)) + 1); });
        socket.on("card-added", (c: CardState) => setCards(prev => prev.some(x => x.id === c.id) ? prev : [...prev, c]));
        socket.on("card-updated", (c: CardState) => setCards(prev => prev.map(x => x.id === c.id ? c : x)));
        socket.on("card-flipped", (id: string, r: boolean, f: boolean) => setCards(prev => prev.map(x => x.id === id ? { ...x, isReversed: r, isFlipped: f } : x)));
        socket.on("sync-client-profile", (p: any) => setClientProfile(p));
        socket.on("client-profile-updated", (p: any) => setClientProfile(p));

        return () => {
            socket.disconnect();
            peerRef.current?.destroy();
            streamRef.current?.getTracks().forEach(t => t.stop());
        };
    }, [roomId, playNotifSound]);

    // Key Shortcut
    useEffect(() => {
        const handleDown = (e: KeyboardEvent) => {
            if (e.altKey && e.key.toLowerCase() === 'v') {
                const t = e.target as HTMLElement;
                if (t.tagName !== 'INPUT' && t.tagName !== 'TEXTAREA') setIsVideoBarVisible(v => !v);
            }
        };
        window.addEventListener('keydown', handleDown);
        return () => window.removeEventListener('keydown', handleDown);
    }, []);

    // Handlers
    const copyRoomId = () => { navigator.clipboard.writeText(roomId); setCopied(true); setTimeout(() => setCopied(false), 2000); };
    const toggleMute = () => { if (streamRef.current) { const t = streamRef.current.getAudioTracks()[0]; if (t) { t.enabled = !t.enabled; setIsMuted(!t.enabled); } } };
    const toggleVideo = () => { if (streamRef.current) { const t = streamRef.current.getVideoTracks()[0]; if (t) { t.enabled = !t.enabled; setIsVideoOff(!t.enabled); } } };
    const toggleAmbient = () => {
        if (isAmbientOn) { oscillatorsRef.current.forEach(o => o.stop()); oscillatorsRef.current = []; setIsAmbientOn(false); }
        else {
            const ctx = new AudioContext(); audioCtxRef.current = ctx;
            [65.41, 130.81].forEach(f => {
                const o = ctx.createOscillator(); const g = ctx.createGain();
                o.frequency.value = f; g.gain.value = 0.01; o.connect(g); g.connect(ctx.destination);
                o.start(); oscillatorsRef.current.push(o);
            });
            setIsAmbientOn(true);
        }
    };

    const handleSendMessage = () => {
        if (!chatInput.trim()) return;
        const msg: ChatMessage = { id: Math.random().toString(36).substr(2, 9), text: chatInput, sender: isConsultant ? 'Consultant' : 'Client', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
        setMessages(prev => [...prev.slice(-99), msg]);
        socketRef.current?.emit("chat-message", roomId, msg);
        setChatInput(""); socketRef.current?.emit("user-typing", roomId, false);
    };

    const handleVoiceMessage = (audioUrl: string) => {
        const msg: ChatMessage = { id: Math.random().toString(36).substr(2, 9), audioUrl, sender: isConsultant ? 'Consultant' : 'Client', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
        setMessages(prev => [...prev.slice(-99), msg]);
        socketRef.current?.emit("chat-message", roomId, msg);
    };

    const handleDrawCard = () => {
        const card: CardState = { id: Math.random().toString(36).substr(2, 9), cardIndex: Math.floor(Math.random() * 78), x: 40 + Math.random() * 20, y: 40 + Math.random() * 20, isFlipped: false, isReversed: Math.random() > 0.8, zIndex: maxZIndex };
        setCards(prev => [...prev, card]); setMaxZIndex(z => z + 1);
        socketRef.current?.emit("add-card", roomId, card);
        appendLog(isConsultant ? "Danışman bir kart seçti" : "Kart seçildi");
    };

    const handleDrawRumiCard = () => {
        const card: CardState = { id: Math.random().toString(36).substr(2, 9), cardIndex: Math.floor(Math.random() * 22), deckType: 'rumi', x: 50, y: 50, isFlipped: false, isReversed: false, zIndex: maxZIndex };
        setCards(prev => [...prev, card]); setMaxZIndex(z => z + 1);
        socketRef.current?.emit("add-card", roomId, card);
        appendLog("Rumi kartı çekildi");
    };

    const handleDealPackage = () => {
        if (!clientProfile) return;
        const count = clientProfile.cards || 3;
        const news: CardState[] = [];
        let cz = maxZIndex;
        for (let i = 0; i < count; i++) {
            const c: CardState = { id: Math.random().toString(36).substr(2, 9), cardIndex: Math.floor(Math.random() * 78), x: 20 + i * 15, y: 50, isFlipped: false, isReversed: Math.random() > 0.8, zIndex: cz++ };
            news.push(c); socketRef.current?.emit("add-card", roomId, c);
        }
        setCards(prev => [...prev, ...news]); setMaxZIndex(cz);
        appendLog(`${count} kartlık açılım yapıldı`);
    };

    const handleClearTable = () => { setCards([]); socketRef.current?.emit("clear-table", roomId); appendLog("Masa temizlendi"); };
    const handlePointerDown = (id: string) => { setMaxZIndex(z => z + 1); setCards(prev => prev.map(c => c.id === id ? { ...c, zIndex: maxZIndex + 1 } : c)); setSelectedCardId(id); };
    const handleDragEnd = (id: string, x: number, y: number) => { setCards(prev => prev.map(c => c.id === id ? { ...c, x, y } : c)); const card = cards.find(c => c.id === id); if (card) socketRef.current?.emit("update-card", roomId, { ...card, x, y }); };
    const handleFlipEnd = (id: string, r: boolean, f: boolean) => { setCards(prev => prev.map(c => c.id === id ? { ...c, isReversed: r, isFlipped: f } : c)); socketRef.current?.emit("card-flipped", roomId, id, r, f); };
    const handleCursorMove = (e: React.PointerEvent) => { const now = Date.now(); if (now - lastCursorEmit.current > 50) { socketRef.current?.emit("cursor-move", roomId, { x: e.clientX, y: e.clientY }); lastCursorEmit.current = now; } };
    const copyShareLink = () => { const url = `${window.location.origin}/room/${roomId}?role=client`; navigator.clipboard.writeText(url); setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2000); };
    const captureScreenshot = () => { alert("Screenshot captured (demo)"); };
    const toggleFullscreen = () => { if (!document.fullscreenElement) document.documentElement.requestFullscreen(); else document.exitFullscreen(); setIsFullscreen(!isFullscreen); };
    const [isTyping, setIsTyping] = useState(false);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
        setChatInput(e.target.value);
        if (!isTyping) {
            setIsTyping(true);
            socketRef.current?.emit("user-typing", roomId, true);
        }
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
            socketRef.current?.emit("user-typing", roomId, false);
        }, 2000);
    };
    const onEmojiClick = (e: any) => { setChatInput(prev => prev + e.emoji); setShowEmojiPicker(false); };
    const handleAiInterpret = () => { setAiLoading(true); setTimeout(() => { setAiResponse("Geleceğiniz parlak görünüyor..."); setAiLoading(false); }, 2000); };
    const voiceRecorderRef = useRef<MediaRecorder | null>(null);
    const voiceChunksRef = useRef<Blob[]>([]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            voiceRecorderRef.current = recorder;
            voiceChunksRef.current = [];
            recorder.ondataavailable = (e) => { if (e.data.size > 0) voiceChunksRef.current.push(e.data); };
            recorder.onstop = () => {
                const blob = new Blob(voiceChunksRef.current, { type: 'audio/webm' });
                const url = URL.createObjectURL(blob);
                handleVoiceMessage(url);
                stream.getTracks().forEach(t => t.stop());
            };
            recorder.start();
            setIsRecording(true);
        } catch (e) { console.error("Mic access denied", e); }
    };

    const stopRecording = () => {
        if (voiceRecorderRef.current && voiceRecorderRef.current.state === 'recording') {
            voiceRecorderRef.current.stop();
        }
        setIsRecording(false);
    };

    return {
        role, isConsultant, clientProfile, copied, isSidebarOpen, cards, maxZIndex, logs, cursors, messages, chatInput, isChatOpen,
        toastMsg, aiLoading, aiResponse, remotePeerId, isMuted, isVideoOff, isVideoBarVisible, remoteFullscreen, showExitModal, isRecording,
        remoteTyping, showEmojiPicker, elapsed, selectedCardId, selectedCard, linkCopied, isAmbientOn, isFullscreen, auraColor,
        setIsSidebarOpen, setChatInput, setIsChatOpen, setRemoteFullscreen, setShowExitModal, setShowEmojiPicker, setSelectedCardId, setAiResponse,
        messagesEndRef, myVideoRef, remoteVideoRef, tableRef,
        copyRoomId, toggleMute, toggleVideo, handleAiInterpret, handleClearTable, handleTyping, startRecording, stopRecording, handleSendMessage, onEmojiClick,
        handleDrawCard, handleDrawRumiCard, handleDealPackage, handlePointerDown, handleDragEnd, handleFlipEnd,
        copyShareLink, captureScreenshot, toggleFullscreen, toggleAmbient, handleCursorMove
    };
}
