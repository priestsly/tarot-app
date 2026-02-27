import { X, Copy, Check, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';
import { cn } from '../page';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    shareUrl: string;
}

export const ShareModal = ({ isOpen, onClose, shareUrl }: ShareModalProps) => {
    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
            <div className="w-full max-w-sm glass rounded-2xl overflow-hidden border border-border shadow-2xl relative animate-in fade-in zoom-in duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-text-muted hover:text-text transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                            <QrCode className="w-5 h-5 text-accent" />
                        </div>
                        <div>
                            <h3 className="text-lg font-heading font-bold text-text">Davet Bağlantısı</h3>
                            <p className="text-xs text-text-muted">Müşterinizle paylaşın veya taratın</p>
                        </div>
                    </div>

                    {/* QR Code */}
                    <div className="flex justify-center mb-6">
                        <div className="bg-white p-4 rounded-xl shadow-lg border-4 border-accent/20">
                            <QRCodeSVG
                                value={shareUrl}
                                size={180}
                                bgColor={"#ffffff"}
                                fgColor={"#1a1825"}
                                level={"Q"}
                            />
                        </div>
                    </div>

                    {/* URL String & Copy */}
                    <div className="relative group">
                        <div className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-text-muted font-mono truncate pr-14 select-all">
                            {shareUrl}
                        </div>
                        <button
                            onClick={handleCopy}
                            className={cn(
                                "absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all",
                                copied ? "bg-emerald-500/20 text-emerald-400" : "bg-accent/10 text-accent hover:bg-accent/20"
                            )}
                            title="Kopyala"
                        >
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
