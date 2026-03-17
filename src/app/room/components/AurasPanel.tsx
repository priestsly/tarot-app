import { motion } from 'framer-motion';
import { Sparkles, Moon, Sun, Droplets, Wind, X } from 'lucide-react';

interface AurasPanelProps {
    isOpen: boolean;
    onClose: () => void;
    currentAura: string;
    setAuraFocus: (focus: string) => void;
}

const AURAS = [
    { id: 'Ruhsal', name: 'Ruhsal Boyut', color: 'rgba(184, 164, 232, 0.15)', icon: <Moon className="w-5 h-5" />, desc: "Sezgileri güçlendirir, üçüncü gözü açar." },
    { id: 'Aşk', name: 'Kalp Çakrası', color: 'rgba(232, 124, 124, 0.15)', icon: <Sparkles className="w-5 h-5 text-pink-400" />, desc: "Duygusal bağları ve empatiyi artırır." },
    { id: 'Para', name: 'Toprak Elementi', color: 'rgba(212, 185, 106, 0.15)', icon: <Sun className="w-5 h-5 text-amber-400" />, desc: "Maddi konulara ve bolluğa odaklanmayı sağlar." },
    { id: 'Yaratıcılık', name: 'Su Elementi', color: 'rgba(124, 212, 232, 0.15)', icon: <Droplets className="w-5 h-5 text-cyan-400" />, desc: "Yaratıcılık ve içsel huzuru derinleştirir." },
    { id: 'Kariyer', name: 'Hava Elementi', color: 'rgba(124, 184, 232, 0.15)', icon: <Wind className="w-5 h-5 text-blue-400" />, desc: "Zihinsel açıklık ve vizyonu genişletir." },
];

export const AurasPanel = ({ isOpen, onClose, currentAura, setAuraFocus }: AurasPanelProps) => {
    if (!isOpen) return null;

    return (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-40 bg-[#1a1825] border border-border rounded-2xl p-4 w-[24rem] max-w-[calc(100vw-2rem)] shadow-2xl animate-in fade-in slide-in-from-bottom-5">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-accent" />
                    <h3 className="text-sm font-heading font-bold text-text uppercase tracking-wider">Aura ve Enerji</h3>
                </div>
                <button onClick={onClose} className="text-text-muted hover:text-text hover:bg-white/5 p-1 rounded-lg transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="grid gap-2">
                {AURAS.map((aura) => (
                    <button
                        key={aura.id}
                        onClick={() => { setAuraFocus(aura.id); onClose(); }}
                        className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 relative overflow-hidden group
                            ${currentAura === aura.id
                                ? 'bg-accent-dim border-accent/40 ring-1 ring-accent/30'
                                : 'bg-surface border-border hover:border-accent/25 hover:bg-accent-dim/50'}`}
                    >
                        <div
                            className="absolute inset-0 opacity-20 pointer-events-none transition-opacity group-hover:opacity-30"
                            style={{ backgroundColor: aura.color }}
                        />
                        <div className={`p-2 rounded-xl transition-colors ${currentAura === aura.id ? 'bg-accent/20' : 'bg-bg text-text-muted group-hover:text-text'}`}>
                            {aura.icon}
                        </div>
                        <div className="flex-1 min-w-0 z-10">
                            <h4 className="text-sm font-semibold text-text">{aura.name}</h4>
                            <p className="text-[10px] text-text-muted truncate mt-0.5">{aura.desc}</p>
                        </div>
                    </button>
                ))}
            </div>

            <p className="text-center text-[9px] text-text-muted/50 mt-4 uppercase tracking-widest">
                Danışanınızın ekranındaki ambiyans rengi anında değişecektir.
            </p>
        </div>
    );
};
