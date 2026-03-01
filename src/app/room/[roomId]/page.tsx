"use client";

import { use, Suspense } from "react";
import { PlusSquare, Mic, MicOff, X, Sparkles, MousePointer2, MessageCircle, Trash2, Clock, Info, Share2, Maximize, Wand2, Loader2, Feather, Flame, Instagram } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";
import TarotCard from "@/components/TarotCard";
import { getCardMeaning } from "@/lib/cardData";
import { getRumiMeaning } from "@/lib/rumiData";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { TopBar } from './components/TopBar';
import { RightSidebar } from './components/RightSidebar';
import { ChatPanel } from './components/ChatPanel';
import { ExitModal } from './components/ExitModal';
import { ShareModal } from './components/ShareModal';
import { FogOverlay } from './components/FogOverlay';
import { AurasPanel } from './components/AurasPanel';
import { StoryGenerator } from '@/components/StoryGenerator';
import { AiModal } from './components/AiModal';
import { useTarotRoom } from './hooks/useTarotRoom';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

function RoomContent({ params }: { params: Promise<{ roomId: string }> }) {
    const searchParams = useSearchParams();
    const roomId = use(params).roomId;

    const {
        // State
        role, isConsultant, clientProfile, copied, isSidebarOpen,
        cards, maxZIndex, logs, cursors, messages, chatInput, isChatOpen,
        toastMsg, aiLoading, aiResponse, remotePeerId, isMuted, isVideoOff,
        isVideoBarVisible, remoteFullscreen, showExitModal, isRecording,
        remoteTyping, showEmojiPicker, elapsed, selectedCardId, selectedCard,
        linkCopied, isAmbientOn, isFullscreen, auraColor, showShareModal, fullShareUrl,
        showAurasPanel, currentAura,

        // Setters
        setIsSidebarOpen, setChatInput, setIsChatOpen, setRemoteFullscreen,
        setShowExitModal, setShowShareModal, setShowEmojiPicker, setSelectedCardId, setAiResponse,
        setShowAurasPanel, handleAuraChange,

        // Refs
        messagesEndRef, myVideoRef, remoteVideoRef, tableRef,

        // Handlers
        copyRoomId, toggleMute, toggleVideo, handleAiInterpret, handleClearTable,
        handleTyping, startRecording, stopRecording, handleSendMessage, onEmojiClick,
        handleDrawCard, handleDrawRumiCard, handleDealPackage, handlePointerDown, handleDragEnd, handleFlipEnd, handleRevealAll, handlePingCard,
        copyShareLink, captureScreenshot, toggleFullscreen, toggleAmbient, handleCursorMove,
        isConnecting, localReady, remoteReady, setLocalReady, pingedCardId
    } = useTarotRoom(roomId, searchParams);

    const [showStoryGen, setShowStoryGen] = useState(false);
    const [showAiModal, setShowAiModal] = useState(false);
    const [bottomConfirmClear, setBottomConfirmClear] = useState(false);

    const onBottomClearClick = () => {
        if (bottomConfirmClear) {
            handleClearTable();
            setBottomConfirmClear(false);
        } else {
            setBottomConfirmClear(true);
            setTimeout(() => setBottomConfirmClear(false), 3000);
        }
    };

    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    const handleLocalCursor = (e: React.PointerEvent) => {
        setMousePos({ x: e.clientX, y: e.clientY });
        handleCursorMove(e);
    };

    return (
        <div className="flex flex-col h-screen bg-bg text-text overflow-hidden font-inter relative">

            {/* ═══ FULL-BLEED TAROT TABLE ═══ */}
            <main
                className="flex-1 relative overflow-hidden bg-bg noise"
                onPointerMove={handleLocalCursor}
            >
                {/* Magical Cursor Glow (WOW Factor) */}
                <motion.div
                    className="absolute z-0 pointer-events-none w-[500px] h-[500px] rounded-full blur-[150px] opacity-20 bg-purple-500/30 transition-all duration-300 ease-out"
                    animate={{ left: mousePos.x - 250, top: mousePos.y - 250 }}
                />
                {/* Ambient table glows — softer, more vail-like */}
                <div className="absolute inset-0 pointer-events-none z-0">
                    <div className="absolute inset-0 bg-gradient-to-tr from-purple-900/10 via-midnight/5 to-amber-900/5 opacity-50" />

                    {/* Animated Mist/Vail flow */}
                    <motion.div
                        animate={{
                            backgroundPosition: ["0% 0%", "100% 100%"],
                            opacity: [0.1, 0.15, 0.1]
                        }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10"
                    />

                    {/* Dynamic Aura — atmospheric edge fog, not a center spotlight */}
                    <motion.div
                        className="absolute inset-0"
                        key={auraColor}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 2 }}
                    >
                        {/* Top edge glow */}
                        <div className="absolute top-0 inset-x-0 h-[40%] blur-[120px]" style={{ background: `linear-gradient(to bottom, ${auraColor}, transparent)` }} />
                        {/* Bottom edge glow */}
                        <div className="absolute bottom-0 inset-x-0 h-[35%] blur-[120px]" style={{ background: `linear-gradient(to top, ${auraColor}, transparent)` }} />
                        {/* Left edge glow */}
                        <div className="absolute left-0 inset-y-0 w-[40%] blur-[120px]" style={{ background: `linear-gradient(to right, ${auraColor}, transparent)` }} />
                        {/* Right edge glow */}
                        <div className="absolute right-0 inset-y-0 w-[40%] blur-[120px]" style={{ background: `linear-gradient(to left, ${auraColor}, transparent)` }} />
                    </motion.div>
                </div>

                {/* Table grid texture */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(184,164,232,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(184,164,232,0.015)_1px,transparent_1px)] bg-[size:80px_80px] pointer-events-none z-0" />

                {/* Fog & Ambient candle glow effects */}
                <FogOverlay />

                {/* Overall AI Interpretation Button (Top Center) */}
                {isConsultant && clientProfile?.pkgId !== 'relation' && cards.length > 0 && (
                    <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3">
                        {cards.some(c => !c.isFlipped) && (
                            <button
                                onClick={handleRevealAll}
                                className="flex items-center gap-2 px-5 py-2.5 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 rounded-full text-[10px] text-amber-200 font-bold tracking-[0.1em] uppercase transition-all backdrop-blur-md shadow-lg shadow-amber-500/10"
                            >
                                <Sparkles className="w-4 h-4 text-amber-300" />
                                Hepsini Aç
                            </button>
                        )}
                        {cards.filter(c => c.isFlipped).length >= 2 && (
                            <button
                                onClick={() => setShowAiModal(true)}
                                className="flex items-center gap-2 px-5 py-2.5 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 rounded-full text-[10px] text-purple-200 font-bold tracking-[0.1em] uppercase transition-all backdrop-blur-md shadow-lg shadow-purple-500/10"
                            >
                                <Wand2 className="w-4 h-4 text-purple-300" />
                                Masayı Yorumla
                            </button>
                        )}
                    </div>
                )}

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
                {/* THE DECK / TABLE - Client sees it blurred until ready, Consultant sees it always */}
                <div
                    ref={tableRef}
                    className={cn(
                        "absolute inset-0 z-10 w-full h-full perspective-[1000px] overflow-hidden transition-all duration-1000",
                        (localReady && remoteReady || isConsultant) ? "opacity-100" : "opacity-0 pointer-events-none scale-95 blur-sm"
                    )}
                    id="tarot-table"
                >
                    {cards.map(card => (
                        <TarotCard
                            key={card.id}
                            card={card}
                            onDragEnd={handleDragEnd}
                            onFlipEnd={handleFlipEnd}
                            onPointerDown={handlePointerDown}
                            onPing={handlePingCard}
                            isPinged={card.id === pingedCardId}
                            isLocal={true}
                            constraintsRef={tableRef}
                        />
                    ))}
                </div>

                {/* ═══ MINI MUTUAL HANDSHAKE UI (Floating Widget Top Right) ═══ */}
                <AnimatePresence>
                    {(!localReady || !remoteReady) && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.9, x: 20 }}
                            transition={{ duration: 0.4, ease: "easeInOut" }}
                            className="absolute top-20 left-1/2 -translate-x-1/2 z-[60] flex flex-col pointer-events-none"
                        >
                            <div className="glass p-3 rounded-2xl border border-purple-500/20 shadow-[0_10px_40px_rgba(147,51,234,0.15)] flex flex-col gap-3 pointer-events-auto backdrop-blur-xl relative overflow-hidden bg-[#0a0a0f]/90">

                                {/* Status Indicators */}
                                <div className="flex gap-4 items-center">
                                    {/* Danışman Status */}
                                    <div className="flex flex-col items-center gap-1">
                                        <span className="text-[10px] text-purple-200/50 uppercase tracking-widest font-bold">Danışman</span>
                                        {isConsultant ? (
                                            localReady
                                                ? <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md border border-emerald-500/20">Hazır</span>
                                                : <span className="text-xs font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-500/20 animate-pulse">Bekleniyor</span>
                                        ) : (
                                            remoteReady
                                                ? <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md border border-emerald-500/20">Hazır</span>
                                                : <span className="text-xs font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-500/20 animate-pulse">Bekleniyor</span>
                                        )}
                                    </div>

                                    <div className="w-px h-8 bg-white/10" />

                                    {/* Danışan Status */}
                                    <div className="flex flex-col items-center gap-1">
                                        <span className="text-[10px] text-purple-200/50 uppercase tracking-widest font-bold">{clientProfile?.name || 'Müşteri'}</span>
                                        {!isConsultant ? (
                                            localReady
                                                ? <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md border border-emerald-500/20">Hazır</span>
                                                : <span className="text-xs font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-500/20 animate-pulse">Bekleniyor</span>
                                        ) : (
                                            remoteReady
                                                ? <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md border border-emerald-500/20">Hazır</span>
                                                : <span className="text-xs font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-500/20 animate-pulse">Bekleniyor</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ═══ CONNECTING OVERLAY (Hidden now that we use Mutual Handshake, but kept for fallback) ═══ */}
                <AnimatePresence>
                    {(localReady && remoteReady) && isConnecting && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, scale: 1.05 }}
                            transition={{ duration: 0.5 }}
                            className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-[#0B0914]/80 backdrop-blur-md"
                        >
                            <div className="relative mb-8">
                                <div className="w-20 h-20 rounded-full border-t-2 border-l-2 border-purple-500 animate-spin" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Sparkles className="w-6 h-6 text-gold animate-pulse" />
                                </div>
                            </div>
                            <h2 className="text-xl font-heading font-bold tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-br from-purple-200 to-purple-500 uppercase drop-shadow-lg">
                                Astral Boyuta Bağlanılıyor
                            </h2>
                            <p className="text-xs text-purple-300/50 mt-3 tracking-widest uppercase font-medium">
                                Enerji hatları senkronize ediliyor...
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ═══ TOP BAR COMPONENT ═══ */}
                <TopBar
                    roomId={roomId}
                    elapsed={elapsed}
                    cardsCount={cards.length}
                    remotePeerId={remotePeerId}
                    isConsultant={isConsultant}
                    isAmbientOn={isAmbientOn}
                    copied={copied}
                    linkCopied={linkCopied}
                    isSidebarOpen={isSidebarOpen}
                    copyRoomId={copyRoomId}
                    copyShareLink={copyShareLink}
                    toggleAmbient={toggleAmbient}
                    captureScreenshot={captureScreenshot}
                    setIsSidebarOpen={setIsSidebarOpen}
                    setShowExitModal={setShowExitModal}
                    setShowShareModal={setShowShareModal}
                    handleClearTable={handleClearTable}
                />

                {/* ═══ PiP VIDEO (floating, top-right) — always in DOM to keep stream ═══ */}
                <div className={cn(
                    "absolute top-14 sm:top-16 right-2 sm:right-4 z-30 flex flex-col gap-1.5 sm:gap-2 transition-all duration-300",
                    isVideoBarVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full pointer-events-none"
                )}>
                    {/* Remote */}
                    <div className="w-24 sm:w-32 aspect-[3/4] sm:aspect-[9/16] rounded-lg sm:rounded-xl overflow-hidden glass relative cursor-pointer group" onClick={() => setRemoteFullscreen(true)}>
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

                {/* ═══ RIGHT DRAWER COMPONENT ═══ */}
                <RightSidebar
                    isSidebarOpen={isSidebarOpen}
                    isVideoBarVisible={isVideoBarVisible}
                    isConsultant={isConsultant}
                    clientProfile={clientProfile}
                    cards={cards}
                    logs={logs}
                    setShowExitModal={setShowExitModal}
                />

                {/* ═══ FLOATING CHAT COMPONENT ═══ */}
                <ChatPanel
                    isChatOpen={isChatOpen}
                    setIsChatOpen={setIsChatOpen}
                    messages={messages}
                    isConsultant={isConsultant}
                    clientProfile={clientProfile}
                    remoteTyping={remoteTyping}
                    chatInput={chatInput}
                    handleTyping={handleTyping}
                    handleSendMessage={handleSendMessage}
                    showEmojiPicker={showEmojiPicker}
                    setShowEmojiPicker={setShowEmojiPicker}
                    onEmojiClick={onEmojiClick}
                    startRecording={startRecording}
                    stopRecording={stopRecording}
                    isRecording={isRecording}
                    messagesEndRef={messagesEndRef}
                />

                {/* ═══ LIVE MESSAGE TOAST ═══ */}
                {toastMsg && (
                    <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-[#1a1825]/95 border border-border rounded-2xl px-4 py-3 max-w-[80vw] sm:max-w-sm shadow-xl shadow-black/30 animate-pulse pointer-events-none">
                        <span className="text-[10px] text-accent font-bold uppercase tracking-wider block mb-0.5">{toastMsg.sender}</span>
                        <span className="text-sm text-text">{toastMsg.text}</span>
                    </div>
                )}

                {/* ═══ CARD INFO PANEL (consultant only) ═══ */}
                {
                    isConsultant && selectedCard && selectedCard.isFlipped && selectedCard.deckType !== 'eril' && selectedCard.deckType !== 'disil' && (() => {
                        const isRumi = selectedCard.deckType === 'rumi';
                        const info = isRumi ? getRumiMeaning(selectedCard.cardIndex) : getCardMeaning(selectedCard.cardIndex);
                        const standardInfo = !isRumi ? (info as any) : null;

                        return (
                            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-40 bg-[#1a1825] border border-border rounded-2xl p-4 w-[28rem] max-w-[calc(100vw-2rem)] max-h-[55vh] sm:max-h-[65vh] overflow-y-auto shadow-2xl shadow-black/50">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                                                <Info className="w-4 h-4 text-accent" />
                                            </div>
                                            <span className="text-lg text-text font-heading font-bold uppercase tracking-wider">{info.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2 mb-4">
                                            {!isRumi && standardInfo?.element && (
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/20 text-accent font-bold uppercase tracking-wider">{standardInfo.element}</span>
                                            )}
                                            <span className="text-xs text-text-muted font-medium">{info.keywords}</span>
                                        </div>

                                        <p className="text-base text-text/80 leading-relaxed mb-6 italic border-l-2 border-accent/20 pl-4">{info.meaning}</p>

                                        <button
                                            onClick={() => handleAiInterpret(selectedCard.cardIndex)}
                                            disabled={aiLoading}
                                            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-purple-600/30 via-indigo-600/20 to-purple-600/30 hover:from-purple-600/40 hover:to-indigo-600/30 border border-purple-500/40 rounded-2xl text-base text-white font-bold transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-purple-500/10 group overflow-hidden relative"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                            {aiLoading ? <Loader2 className="w-5 h-5 animate-spin text-purple-300" /> : <Sparkles className="w-5 h-5 text-amber-300 group-hover:rotate-12 transition-transform" />}
                                            {aiLoading ? 'Ruhlara fısıldanıyor...' : 'Mistik AI Analizi Başlat'}
                                        </button>

                                        {aiResponse && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="mt-6 p-5 bg-midnight/40 border border-purple-500/30 rounded-2xl bg-gradient-to-br from-purple-500/[0.08] to-transparent shadow-inner"
                                            >
                                                <div className="flex items-center gap-2 mb-3">
                                                    <Wand2 className="w-4 h-4 text-purple-400" />
                                                    <span className="text-[11px] text-purple-400 font-black uppercase tracking-[0.2em]">Mistik Kehanet</span>
                                                </div>
                                                <p className="text-[15px] sm:text-base text-text/95 leading-[1.7] whitespace-pre-line tracking-wide drop-shadow-sm font-medium">{aiResponse}</p>
                                            </motion.div>
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
                <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-end gap-1 sm:gap-2 p-2 glass rounded-2xl sm:rounded-3xl border border-white/10">
                    <div className="flex flex-col items-center">
                        <button onClick={() => setIsChatOpen(!isChatOpen)} className={cn("p-2 sm:p-2.5 rounded-lg sm:rounded-xl transition-all relative", isChatOpen ? "text-gold bg-gold-dim" : "text-text-muted hover:text-gold hover:bg-gold-dim")} title="Sohbet">
                            <MessageCircle className="w-4 h-4" />
                            {messages.length > 0 && !isChatOpen && <div className="absolute top-0.5 right-0.5 w-2 h-2 bg-gold rounded-full animate-pulse border-2 border-[#1a1825]" />}
                        </button>
                        <span className="text-[7px] text-text-muted/60 uppercase tracking-tighter mt-1 font-bold">Sohbet</span>
                    </div>

                    {/* === CONSULTANT ACTIONS === */}
                    {isConsultant && (
                        <>
                            <div className="w-px h-8 bg-white/5 mx-1 mb-4" />

                            <div className="flex flex-col items-center">
                                <button onClick={() => setShowAurasPanel(!showAurasPanel)} className={cn("p-2 sm:p-2.5 rounded-lg sm:rounded-xl transition-all", showAurasPanel ? "text-accent bg-accent-dim" : "text-text-muted hover:text-accent hover:bg-accent-dim")}>
                                    <Flame className="w-4 h-4" />
                                </button>
                                <span className="text-[7px] text-text-muted/60 uppercase tracking-tighter mt-1 font-bold">Enerji</span>
                            </div>

                            <div className="flex flex-col items-center">
                                <button onClick={handleDealPackage} disabled={!clientProfile} className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl shadow-lg shadow-purple-500/20 transition-all hover:scale-110 active:scale-95 disabled:opacity-30">
                                    <Sparkles className="w-4 h-4 text-amber-200" />
                                </button>
                                <span className="text-[7px] text-text-muted/60 uppercase tracking-tighter mt-1 font-bold">Dağıt</span>
                            </div>

                            <div className="flex flex-col items-center">
                                <button onClick={handleDrawCard} className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl text-text-muted hover:text-accent hover:bg-accent-dim transition-all">
                                    <PlusSquare className="w-4 h-4" />
                                </button>
                                <span className="text-[7px] text-text-muted/60 uppercase tracking-tighter mt-1 font-bold">+ Kart</span>
                            </div>

                            <div className="flex flex-col items-center">
                                <button onClick={handleDrawRumiCard} className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl text-text-muted hover:text-amber-500 hover:bg-amber-500/10 transition-all uppercase">
                                    <Feather className="w-4 h-4" />
                                </button>
                                <span className="text-[7px] text-text-muted/60 uppercase tracking-tighter mt-1 font-bold">Rumi</span>
                            </div>

                            <div className="flex flex-col items-center">
                                <button onClick={copyShareLink} className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl text-text-muted hover:text-accent hover:bg-accent-dim transition-all relative">
                                    <Share2 className="w-4 h-4" />
                                    {linkCopied && <div className="absolute top-0.5 right-0.5 w-2 h-2 bg-emerald-400 rounded-full border-2 border-[#1a1825]" />}
                                </button>
                                <span className="text-[7px] text-text-muted/60 uppercase tracking-tighter mt-1 font-bold">Paylaş</span>
                            </div>

                            <div className="flex flex-col items-center">
                                <button onClick={onBottomClearClick} className={cn("p-2 sm:p-2.5 rounded-lg sm:rounded-xl transition-all", bottomConfirmClear ? "bg-red-500/20 text-red-500" : "text-text-muted hover:text-danger hover:bg-danger/10")}>
                                    <Trash2 className="w-4 h-4" />
                                </button>
                                <span className={cn("text-[7px] uppercase tracking-tighter mt-1 font-bold", bottomConfirmClear ? "text-red-500" : "text-text-muted/60")}>
                                    {bottomConfirmClear ? 'Emin?' : 'Sil'}
                                </span>
                            </div>
                        </>
                    )}

                    {/* Story — visible to EVERYONE */}
                    {cards.filter(c => c.isFlipped).length > 0 && (
                        <>
                            <div className="w-px h-8 bg-white/5 mx-1 mb-4" />
                            <div className="flex flex-col items-center">
                                <button onClick={() => setShowStoryGen(true)} className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl text-text-muted hover:text-pink-400 hover:bg-pink-400/10 transition-all">
                                    <Instagram className="w-4 h-4" />
                                </button>
                                <span className="text-[7px] text-text-muted/60 uppercase tracking-tighter mt-1 font-bold">Story</span>
                            </div>
                        </>
                    )}
                </div>

                {/* ═══ SHARE MODAL COMPONENT ═══ */}
                <ShareModal
                    isOpen={showShareModal}
                    onClose={() => setShowShareModal(false)}
                    shareUrl={fullShareUrl}
                />

                {/* ═══ AURAS PANEL COMPONENT ═══ */}
                <AurasPanel
                    isOpen={showAurasPanel}
                    onClose={() => setShowAurasPanel(false)}
                    currentAura={currentAura}
                    setAuraFocus={handleAuraChange}
                />

                {/* ═══ STORY GENERATOR ═══ */}
                <StoryGenerator
                    isOpen={showStoryGen}
                    onClose={() => setShowStoryGen(false)}
                    cardName={selectedCard ? getCardMeaning(selectedCard.cardIndex).name : cards.filter(c => c.isFlipped).length > 0 ? getCardMeaning(cards.filter(c => c.isFlipped)[cards.filter(c => c.isFlipped).length - 1].cardIndex).name : undefined}
                    cardMeaning={selectedCard ? getCardMeaning(selectedCard.cardIndex).keywords : cards.filter(c => c.isFlipped).length > 0 ? getCardMeaning(cards.filter(c => c.isFlipped)[cards.filter(c => c.isFlipped).length - 1].cardIndex).keywords : undefined}
                    cardImage={selectedCard ? `/cards/${selectedCard.cardIndex}.webp` : cards.filter(c => c.isFlipped).length > 0 ? `/cards/${cards.filter(c => c.isFlipped)[cards.filter(c => c.isFlipped).length - 1].cardIndex}.webp` : undefined}
                />

                {/* ═══ AI INTERPRETATION MODAL ═══ */}
                <AiModal
                    isOpen={showAiModal}
                    onClose={() => setShowAiModal(false)}
                    aiResponse={aiResponse}
                    aiLoading={aiLoading}
                    onInterpret={() => handleAiInterpret(-1)}
                />

                {/* ═══ EXIT MODAL COMPONENT ═══ */}
                <ExitModal
                    isOpen={showExitModal}
                    onClose={() => setShowExitModal(false)}
                    onConfirm={() => window.location.href = "/"}
                />
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
