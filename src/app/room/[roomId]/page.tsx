"use client";

import { use, Suspense } from "react";
import { PlusSquare, Mic, MicOff, X, Sparkles, MousePointer2, MessageCircle, Trash2, Clock, Info, Share2, Maximize, Wand2, Loader2, Feather, Flame } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";
import TarotCard from "@/components/TarotCard";
import { getCardMeaning } from "@/lib/cardData";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { TopBar } from './components/TopBar';
import { RightSidebar } from './components/RightSidebar';
import { ChatPanel } from './components/ChatPanel';
import { ExitModal } from './components/ExitModal';
import { FogOverlay } from './components/FogOverlay';
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
        linkCopied, isAmbientOn, isFullscreen, auraColor,

        // Setters
        setIsSidebarOpen, setChatInput, setIsChatOpen, setRemoteFullscreen,
        setShowExitModal, setShowEmojiPicker, setSelectedCardId, setAiResponse,

        // Refs
        messagesEndRef, myVideoRef, remoteVideoRef, tableRef,

        // Handlers
        copyRoomId, toggleMute, toggleVideo, handleAiInterpret, handleClearTable,
        handleTyping, startRecording, stopRecording, handleSendMessage, onEmojiClick,
        handleDrawCard, handleDrawRumiCard, handleDealPackage, handlePointerDown, handleDragEnd, handleFlipEnd,
        copyShareLink, captureScreenshot, toggleFullscreen, toggleAmbient, handleCursorMove
    } = useTarotRoom(roomId, searchParams);

    return (
        <div className="flex flex-col h-screen bg-bg text-text overflow-hidden font-inter relative">

            {/* ═══ FULL-BLEED TAROT TABLE ═══ */}
            <main
                className="flex-1 relative overflow-hidden bg-bg noise"
                onPointerMove={handleCursorMove}
            >
                {/* Ambient table glows — soft, diffused */}
                <div className="absolute inset-0 pointer-events-none z-0">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] h-[70vh] bg-purple-400/3 rounded-full blur-[220px]" />
                    <div className="absolute top-[20%] left-[10%] w-[300px] h-[300px] bg-indigo-400/3 rounded-full blur-[140px]" />
                    <div className="absolute bottom-[15%] right-[15%] w-[250px] h-[250px] bg-amber-300/2 rounded-full blur-[120px]" />

                    {/* Dynamic Aura Glow */}
                    <motion.div
                        className="absolute inset-0 transition-colors duration-1000"
                        style={{ background: `radial-gradient(circle at center, transparent 40%, ${auraColor} 100%)` }}
                    />

                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,var(--color-bg)_80%)]" />
                </div>

                {/* Table grid texture */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(184,164,232,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(184,164,232,0.02)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none z-0" />

                {/* Fog & Ambient candle glow effects */}
                <FogOverlay />

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
                />

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
                            <button onClick={handleDrawRumiCard} className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl text-text-muted hover:text-amber-500 hover:bg-amber-500/10 transition-all font-heading text-xs uppercase" title="Rumi Kartı Çek">
                                <Feather className="w-4 h-4" />
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
