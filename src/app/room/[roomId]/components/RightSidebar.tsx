import { Sparkles, Activity, LogOut } from 'lucide-react';
import { cn } from '../page';
import { CardState } from '@/components/TarotCard';

interface RightSidebarProps {
    isSidebarOpen: boolean;
    isVideoBarVisible: boolean;
    isConsultant: boolean;
    clientProfile: any;
    cards: CardState[];
    logs: any[];
    setShowExitModal: (v: boolean) => void;
}

export const RightSidebar = ({
    isSidebarOpen,
    isVideoBarVisible,
    isConsultant,
    clientProfile,
    cards,
    logs,
    setShowExitModal
}: RightSidebarProps) => {
    return (
        <div className={cn(
            "absolute top-16 right-4 z-30 w-72 max-h-[calc(100vh-130px)] bg-[#1a1825] border border-border rounded-2xl flex flex-col overflow-hidden transition-all duration-500 ease-out pointer-events-auto",
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
    );
};
