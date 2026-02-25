import { ArrowLeft, Copy, Clock, Volume2, VolumeX, Camera, Menu, X, Share2 } from 'lucide-react';
import { cn } from '../page';

interface TopBarProps {
    roomId: string;
    elapsed: string;
    cardsCount: number;
    remotePeerId: string | null;
    isConsultant: boolean;
    isAmbientOn: boolean;
    copied: boolean;
    linkCopied: boolean;
    isSidebarOpen: boolean;
    copyRoomId: () => void;
    copyShareLink: () => void;
    toggleAmbient: () => void;
    captureScreenshot: () => void;
    setIsSidebarOpen: (v: boolean) => void;
    setShowExitModal: (v: boolean) => void;
}

export const TopBar = ({
    roomId,
    elapsed,
    cardsCount,
    remotePeerId,
    isConsultant,
    isAmbientOn,
    copied,
    linkCopied,
    isSidebarOpen,
    copyRoomId,
    copyShareLink,
    toggleAmbient,
    captureScreenshot,
    setIsSidebarOpen,
    setShowExitModal
}: TopBarProps) => {
    return (
        <div className="absolute top-0 inset-x-0 z-40 flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 pointer-events-none">
            {/* Left: Exit & Room ID */}
            <div className="flex items-center gap-2 pointer-events-auto">
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
            <div className="glass rounded-full px-3 sm:px-5 py-1.5 sm:py-2 flex items-center gap-2 sm:gap-3 pointer-events-auto">
                <div className="hidden sm:flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-text-muted/50" />
                    <span className="text-[10px] text-text-muted font-mono tracking-wider">{elapsed}</span>
                    <div className="w-px h-3 bg-border ml-1" />
                </div>
                <div className="flex items-center gap-1.5">
                    <div className={cn("w-1.5 h-1.5 rounded-full", remotePeerId ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse')} />
                    <span className="text-[9px] text-text-muted font-mono tracking-wider uppercase">{remotePeerId ? 'Bağlı' : 'Bekliyor'}</span>
                </div>
                <div className="w-px h-3 bg-border" />
                <span className="text-[10px] text-text font-bold tracking-widest uppercase">{cardsCount}</span>
            </div>

            {/* Right: Tools — hide extras on mobile */}
            <div className="flex items-center gap-1 pointer-events-auto">
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
                </div>
                {/* Always visible: panel toggle */}
                <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="glass rounded-xl p-2 sm:p-2.5 text-text-muted hover:text-accent transition-colors">
                    {isSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                </button>
            </div>
        </div>
    );
};
