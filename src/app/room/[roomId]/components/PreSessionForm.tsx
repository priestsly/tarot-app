import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

interface PreSessionFormProps {
    onSubmit: (data: any) => void;
}

const PACKAGES = [
    { id: "standard", name: "Standart Açılım", cards: 3, desc: "Geçmiş, Şimdi ve Gelecek" },
    { id: "synastry", name: "İlişki / Aşk", cards: 7, desc: "İki kişi arasındaki uyum" },
    { id: "celtic", name: "Kelt Haçı", cards: 10, desc: "Kapsamlı durum analizi" },
];

export const PreSessionForm = ({ onSubmit }: PreSessionFormProps) => {
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        birth: '',
        time: '',
        gender: 'belirtmek_istemiyorum',
        pkgId: 'standard',
        focus: 'Genel',
    });

    const supabase = createClient();

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
                if (profile) {
                    setFormData(prev => ({
                        ...prev,
                        name: profile.full_name || prev.name,
                        birth: profile.birth_date || prev.birth,
                        time: profile.birth_time || prev.time,
                    }));
                }
            }
            setLoading(false);
        };
        fetchProfile();
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const selectedPkg = PACKAGES.find(p => p.id === formData.pkgId);
        onSubmit({
            ...formData,
            cards: selectedPkg?.cards || 3
        });
    };

    if (loading) {
        return (
            <div className="absolute inset-0 z-[100] bg-[#0a0a0f] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="absolute inset-0 z-[100] bg-[#0a0a0f] flex items-center justify-center p-4">
            {/* Ambient Background */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md bg-[#161623] border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative"
            >
                <div className="p-8">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center mb-6">
                        <Sparkles className="w-6 h-6 text-amber-200" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Seansa Hazırlan</h2>
                    <p className="text-sm text-purple-200/60 mb-8">Kader bağların kurulmadan önce enerjini netleştir.</p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold tracking-wider text-purple-300 uppercase">Adınız</label>
                            <input
                                required
                                type="text"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                                placeholder="Gerçek adınız veya rumuzunuz"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold tracking-wider text-purple-300 uppercase">Doğum Tarihi</label>
                                <input
                                    type="date"
                                    value={formData.birth}
                                    onChange={e => setFormData({ ...formData, birth: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold tracking-wider text-purple-300 uppercase">Doğum Saati</label>
                                <input
                                    type="time"
                                    value={formData.time}
                                    onChange={e => setFormData({ ...formData, time: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-bold tracking-wider text-purple-300 uppercase">Açılım Türü</label>
                            <select
                                value={formData.pkgId}
                                onChange={e => setFormData({ ...formData, pkgId: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                            >
                                {PACKAGES.map(p => (
                                    <option key={p.id} value={p.id}>{p.name} ({p.cards} Kart) - {p.desc}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-bold tracking-wider text-purple-300 uppercase">Odak Noktası (Niyetiniz)</label>
                            <input
                                required
                                type="text"
                                value={formData.focus}
                                onChange={e => setFormData({ ...formData, focus: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                                placeholder="Örn: Aşk hayatım, Kariyerim..."
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full mt-6 flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-500/20 active:scale-[0.98]"
                        >
                            Odaya Giriş Yap
                            <ArrowRight className="w-4 h-4 text-amber-200" />
                        </button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
};
