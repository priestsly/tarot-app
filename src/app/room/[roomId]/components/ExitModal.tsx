import { LogOut } from 'lucide-react';

interface ExitModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLeaveTemp: () => void;
    onEndSession: () => void;
}

export const ExitModal = ({ isOpen, onClose, onLeaveTemp, onEndSession }: ExitModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-[#1a1825] border border-border rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4 relative overflow-hidden">
                {/* Decorative background glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-danger/10 blur-[50px] rounded-full pointer-events-none" />

                <h3 className="text-xl font-bold text-text mb-2 flex items-center gap-2">
                    <LogOut className="w-5 h-5 text-danger" />
                    Çıkış Seçenekleri
                </h3>
                <p className="text-sm text-text-muted leading-relaxed">Bağlantınızı nasıl sonlandırmak istersiniz? Kalıcı olarak kapatırsanız bu seansa tekrar dönülemez.</p>
                <div className="flex flex-col gap-2 pt-4">
                    <button onClick={onLeaveTemp} className="w-full py-3 px-4 rounded-xl glass text-text hover:text-white hover:bg-white/10 transition-all text-sm font-semibold border border-transparent hover:border-white/20">
                        Geçici Ayrıl (Sonra Döneceğim)
                    </button>
                    <button onClick={onEndSession} className="w-full py-3 px-4 rounded-xl bg-danger/80 text-white hover:bg-danger transition-all text-sm font-semibold shadow-lg shadow-danger/20">
                        Oturumu Tamamen Kapat
                    </button>
                    <button onClick={onClose} className="w-full py-2 px-4 rounded-xl text-text-muted hover:text-white transition-all text-xs font-semibold mt-2">
                        Vazgeç
                    </button>
                </div>
            </div>
        </div>
    );
};
