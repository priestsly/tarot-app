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
        handleDrawCard, handleDrawRumiCard, handleDealPackage, handlePointerDown, handleDragEnd, handleFlipEnd,
        copyShareLink, captureScreenshot, toggleFullscreen, toggleAmbient, handleCursorMove,
        isConnecting, isReady, setIsReady
    } = useTarotRoom(roomId, searchParams);

    const [showStoryGen, setShowStoryGen] = useState(false);
    const [showAiModal, setShowAiModal] = useState(false);

    return (
        <div className="flex flex-col h-screen bg-bg text-text overflow-hidden font-inter relative">

            {/* ═══ FULL-BLEED TAROT TABLE ═══ */}
            <main
                className="flex-1 relative overflow-hidden bg-bg noise"
                onPointerMove={handleCursorMove}
            >
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
                {isConsultant && clientProfile?.pkgId !== 'relation' && cards.filter(c => c.isFlipped).length >= 2 && (
                    <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40">
                        <button onClick={() => setShowAiModal(true)} className="flex items-center gap-2 px-6 py-2.5 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 rounded-full text-[10px] text-purple-200 font-bold tracking-[0.15em] uppercase transition-all backdrop-blur-md shadow-lg shadow-purple-500/10">
                            <Sparkles className="w-4 h-4 text-amber-300" />
                            Tüm Masayı Yorumla
                        </button>
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

                {/* ═══ READY BUTTON OVERLAY ═══ */}
                <AnimatePresence>
                    {!isReady && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-[70] flex flex-col items-center justify-center bg-bg/90 backdrop-blur-md"
                        >
                            <div className="text-center max-w-md p-8 glass rounded-3xl border border-purple-500/20 shadow-2xl shadow-purple-900/20">
                                <Sparkles className="w-12 h-12 text-gold mx-auto mb-6 animate-pulse" />
                                <h2 className="text-3xl font-heading font-bold text-white mb-4 drop-shadow-lg">
                                    Oda Hazır
                                </h2>
                                <p className="text-text-muted mb-8 leading-relaxed">
                                    {isConsultant
                                        ? "Müşteriniz ile bağlantı kurmak ve ruhani seansınızı başlatmak için hazır olduğunuzda aşağıdaki butona tıklayın."
                                        : "Danışmanınız ile telepatik ağ kurmak ve seansınıza başlamak için hazır olduğunuzda butona tıklayın."}
                                </p>
                                <button
                                    onClick={() => setIsReady(true)}
                                    className="w-full py-4 px-8 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-2xl shadow-lg shadow-purple-500/30 transition-all hover:scale-105 active:scale-95 text-lg uppercase tracking-wider flex justify-center items-center gap-3"
                                >
                                    <span>Bağlantıyı Başlat</span>
                                    <Feather className="w-5 h-5 text-purple-200" />
                                </button>
                                <p className="text-[10px] text-text-muted/50 mt-6 uppercase tracking-widest font-semibold">
                                    Kamera ve Mikrofon izni istenecektir
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ═══ CONNECTING OVERLAY ═══ */}
                <AnimatePresence>
                    {isReady && isConnecting && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-bg/80 backdrop-blur-sm"
                        >
                            <div className="w-16 h-16 mb-6 rounded-full border-t-2 border-purple-500 animate-spin" />
                            <h2 className="text-xl font-heading font-medium tracking-widest text-white uppercase drop-shadow-lg">
                                Odaya Bağlanılıyor
                            </h2>
                            <p className="text-sm text-text-muted mt-2 tracking-wide">
                                Ruhani ağ ile iletişim kuruluyor...
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
                                <button onClick={handleDealPackage} disabled={!clientProfile} className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl shadow-lg shadow-purple-500/20 transition-all hover:scale-110 active:scale-95 disabled:opacity-30">
                                    <Sparkles className="w-4 h-4 text-amber-200" />
                                </button>
                                <span className="text-[7px] text-text-muted/60 uppercase tracking-tighter mt-1 font-bold">Dağıt</span>
                            </div>

                            <div className="flex flex-col items-center">
                                <button onClick={() => setShowAurasPanel(!showAurasPanel)} className={cn("p-2 sm:p-2.5 rounded-lg sm:rounded-xl transition-all", showAurasPanel ? "text-accent bg-accent-dim" : "text-text-muted hover:text-accent hover:bg-accent-dim")}>
                                    <Flame className="w-4 h-4" />
                                </button>
                                <span className="text-[7px] text-text-muted/60 uppercase tracking-tighter mt-1 font-bold">Enerji</span>
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
                                <button onClick={handleClearTable} className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl text-text-muted hover:text-danger hover:bg-danger/10 transition-all">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                                <span className="text-[7px] text-text-muted/60 uppercase tracking-tighter mt-1 font-bold">Sil</span>
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
