import { MessageCircle, X, Smile, Mic, Send } from 'lucide-react';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { cn } from '../page';
import { ChatMessage } from '../types';
import { VoiceMessage } from './VoiceMessage';

interface ChatPanelProps {
    isChatOpen: boolean;
    setIsChatOpen: (v: boolean) => void;
    messages: ChatMessage[];
    isConsultant: boolean;
    clientProfile: any;
    remoteTyping: boolean;
    chatInput: string;
    handleTyping: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleSendMessage: (e: React.FormEvent) => void;
    showEmojiPicker: boolean;
    setShowEmojiPicker: (v: boolean) => void;
    onEmojiClick: (emojiObject: any) => void;
    startRecording: (e: React.PointerEvent) => void;
    stopRecording: () => void;
    isRecording: boolean;
    messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

export const ChatPanel = ({
    isChatOpen,
    setIsChatOpen,
    messages,
    isConsultant,
    clientProfile,
    remoteTyping,
    chatInput,
    handleTyping,
    handleSendMessage,
    showEmojiPicker,
    setShowEmojiPicker,
    onEmojiClick,
    startRecording,
    stopRecording,
    isRecording,
    messagesEndRef
}: ChatPanelProps) => {
    if (!isChatOpen) return null;

    return (
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
                                    <VoiceMessage audioUrl={msg.audioUrl} />
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
    );
};
