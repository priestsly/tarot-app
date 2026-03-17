import { LogOut } from 'lucide-react';

interface ExitModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export const ExitModal = ({ isOpen, onClose, onConfirm }: ExitModalProps) => {
    if (!isOpen) return null;

    return (
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
                    <button onClick={onClose} className="flex-1 py-3 px-4 rounded-xl glass text-text-muted hover:text-text hover:bg-white/5 transition-all text-sm font-semibold border border-transparent hover:border-border">Vazgeç</button>
                    <button onClick={onConfirm} className="flex-1 py-3 px-4 rounded-xl bg-danger/90 text-white hover:bg-danger transition-all text-sm font-semibold shadow-[0_4px_14px_0_rgba(239,68,68,0.39)]">Çıkış Yap</button>
                </div>
            </div>
        </div>
    );
};
