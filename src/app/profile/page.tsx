"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { motion } from "framer-motion";
import {
    User, Calendar, Moon, Star, Sparkles, LogOut,
    ChevronRight, Heart, Brain, MapPin, Edit3, Save, X, Loader2
} from "lucide-react";
import { useRouter } from "next/navigation";

interface Profile {
    full_name: string;
    birth_date: string;
    birth_time: string;
    zodiac_sign: string;
    ascendant_sign: string;
    interests: string[];
}

const ZODIAC_SIGNS = [
    "Koç", "Boğa", "İkizler", "Yengeç", "Aslan", "Başak",
    "Terazi", "Akrep", "Yay", "Oğlak", "Kova", "Balık"
];

export default function ProfilePage() {
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editedProfile, setEditedProfile] = useState<Profile | null>(null);
    const [saving, setSaving] = useState(false);
    const [user, setUser] = useState<any>(null);

    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        if (!supabase) return;
        async function loadProfile() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push("/login");
                return;
            }
            setUser(user);

            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .maybeSingle();

            if (data) {
                setProfile(data);
                setEditedProfile(data);
            } else {
                // Initialize with empty if profile doesn't exist yet
                const emptyProfile = {
                    full_name: user?.user_metadata?.full_name || "",
                    birth_date: user?.user_metadata?.birth_date || "",
                    birth_time: "",
                    zodiac_sign: "",
                    ascendant_sign: "",
                    interests: []
                };
                setProfile(emptyProfile);
                setEditedProfile(emptyProfile);
            }
            setLoading(false);
        }
        loadProfile();
    }, []);

    const handleSave = async () => {
        if (!editedProfile || !user) return;
        setSaving(true);

        try {
            // First, get the current role to preserve it
            const { data: current } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
            const role = current?.role || 'client';

            // Sanitize data: convert empty strings to null for date/time
            const sanitized = {
                ...editedProfile,
                role,
                birth_date: editedProfile.birth_date || null,
                birth_time: editedProfile.birth_time || null,
                zodiac_sign: editedProfile.zodiac_sign || null,
                ascendant_sign: editedProfile.ascendant_sign || null
            };

            const { error } = await supabase
                .from("profiles")
                .upsert({ id: user.id, ...sanitized });

            if (!error) {
                setProfile(editedProfile);
                setIsEditing(false);
            } else {
                console.error("Save error:", error);
                alert("Bilgiler kaydedilirken bir hata oluştu: " + error.message);
            }
        } catch (err: any) {
            console.error("Runtime save error:", err);
            alert("Bir hata oluştu: " + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/");
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-accent animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-text font-inter pb-20 overflow-hidden relative">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-purple-900/20 to-transparent pointer-events-none" />

            <div className="max-w-2xl mx-auto px-4 pt-12 relative z-10">
                {/* Header/Back */}
                <button
                    onClick={() => router.push("/")}
                    className="flex items-center gap-2 text-text-muted hover:text-accent transition-colors mb-8 text-sm font-bold uppercase tracking-widest"
                >
                    <ChevronRight className="w-4 h-4 rotate-180" />
                    Ana Sayfa
                </button>

                {/* Profile Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#161623]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-4">
                        <Sparkles className="w-6 h-6 text-accent/20" />
                    </div>

                    <div className="flex flex-col items-center mb-10">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-purple-600 to-amber-400 p-1 mb-4 shadow-xl shadow-purple-500/20">
                            <div className="w-full h-full rounded-full bg-[#161623] flex items-center justify-center overflow-hidden border-2 border-[#161623]">
                                <User className="w-12 h-12 text-white/80" />
                            </div>
                        </div>
                        <h1 className="text-2xl font-bold font-heading text-white tracking-tight">
                            {profile?.full_name || "Mistik Yolcu"}
                        </h1>
                        <p className="text-text-muted text-sm">{user?.email}</p>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-accent flex items-center gap-2">
                                <Star className="w-4 h-4" />
                                Kozmik Kimlik
                            </h2>
                            <button
                                onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                                disabled={saving}
                                className="flex items-center gap-2 text-xs font-bold text-accent hover:text-white transition-colors"
                            >
                                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : isEditing ? <Save className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                                {isEditing ? "Kaydet" : "Bilgileri Düzenle"}
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Ad Soyad */}
                            <div className="p-4 bg-white/5 border border-white/5 rounded-2xl">
                                <p className="text-[10px] text-text-muted uppercase font-bold tracking-widest mb-1">Ad Soyad</p>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        className="bg-transparent border-none text-white focus:outline-none w-full text-sm"
                                        value={editedProfile?.full_name || ""}
                                        onChange={e => setEditedProfile(p => p ? { ...p, full_name: e.target.value } : null)}
                                    />
                                ) : (
                                    <p className="text-white font-medium">{profile?.full_name || "Belirtilmemiş"}</p>
                                )}
                            </div>

                            {/* Doğum Tarihi */}
                            <div className="p-4 bg-white/5 border border-white/5 rounded-2xl">
                                <p className="text-[10px] text-text-muted uppercase font-bold tracking-widest mb-1">Doğum Tarihi</p>
                                {isEditing ? (
                                    <input
                                        type="date"
                                        className="bg-transparent border-none text-white focus:outline-none w-full text-sm [color-scheme:dark]"
                                        value={editedProfile?.birth_date || ""}
                                        onChange={e => setEditedProfile(p => p ? { ...p, birth_date: e.target.value } : null)}
                                    />
                                ) : (
                                    <p className="text-white font-medium">{profile?.birth_date || "Belirtilmemiş"}</p>
                                )}
                            </div>

                            {/* Burç */}
                            <div className="p-4 bg-white/5 border border-white/5 rounded-2xl">
                                <p className="text-[10px] text-text-muted uppercase font-bold tracking-widest mb-1">Burç</p>
                                {isEditing ? (
                                    <select
                                        className="bg-zinc-900 border border-white/10 rounded-lg text-white focus:outline-none w-full text-sm p-1"
                                        value={editedProfile?.zodiac_sign || ""}
                                        onChange={e => setEditedProfile(p => p ? { ...p, zodiac_sign: e.target.value } : null)}
                                    >
                                        <option value="">Seçiniz</option>
                                        {ZODIAC_SIGNS.map(sign => <option key={sign} value={sign}>{sign}</option>)}
                                    </select>
                                ) : (
                                    <p className="text-white font-medium">{profile?.zodiac_sign || "Belirtilmemiş"}</p>
                                )}
                            </div>

                            {/* Yükselen */}
                            <div className="p-4 bg-white/5 border border-white/5 rounded-2xl">
                                <p className="text-[10px] text-text-muted uppercase font-bold tracking-widest mb-1">Yükselen</p>
                                {isEditing ? (
                                    <select
                                        className="bg-zinc-900 border border-white/10 rounded-lg text-white focus:outline-none w-full text-sm p-1"
                                        value={editedProfile?.ascendant_sign || ""}
                                        onChange={e => setEditedProfile(p => p ? { ...p, ascendant_sign: e.target.value } : null)}
                                    >
                                        <option value="">Seçiniz</option>
                                        {ZODIAC_SIGNS.map(sign => <option key={sign} value={sign}>{sign}</option>)}
                                    </select>
                                ) : (
                                    <p className="text-white font-medium">{profile?.ascendant_sign || "Belirtilmemiş"}</p>
                                )}
                            </div>
                        </div>

                        {/* İlgi Alanları Section */}
                        <div className="mt-8">
                            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-accent flex items-center gap-2 mb-4">
                                <Heart className="w-4 h-4" />
                                Ruhani İlgi Alanları
                            </h2>
                            <div className="flex flex-wrap gap-2">
                                {["Tarot", "Astroloji", "Meditasyon", "Numeroloji", "Rüya Tabiri", "Ritüeller"].map(tag => {
                                    const isSelected = profile?.interests?.includes(tag);
                                    return (
                                        <button
                                            key={tag}
                                            onClick={() => {
                                                if (!isEditing) return;
                                                const current = editedProfile?.interests || [];
                                                const next = current.includes(tag)
                                                    ? current.filter(t => t !== tag)
                                                    : [...current, tag];
                                                setEditedProfile(p => p ? { ...p, interests: next } : null);
                                            }}
                                            className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${isSelected
                                                ? "bg-accent/20 border-accent/40 text-accent shadow-lg shadow-accent/10"
                                                : "bg-white/5 border-white/10 text-text-muted hover:border-white/20"
                                                }`}
                                        >
                                            {tag}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Stats / Soul Info Mockup */}
                        <div className="grid grid-cols-3 gap-4 pt-8">
                            <div className="text-center">
                                <p className="text-xl font-bold text-white">12</p>
                                <p className="text-[10px] text-text-muted uppercase tracking-tighter">Açılan Kart</p>
                            </div>
                            <div className="text-center border-x border-white/5">
                                <p className="text-xl font-bold text-white">4</p>
                                <p className="text-[10px] text-text-muted uppercase tracking-tighter">Favori Deste</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xl font-bold text-white">7</p>
                                <p className="text-[10px] text-text-muted uppercase tracking-tighter">Mistik Puan</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Footer Actions */}
                <div className="mt-8 flex items-center justify-between">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 text-red-400/70 hover:text-red-400 transition-colors text-xs font-bold uppercase tracking-widest"
                    >
                        <LogOut className="w-4 h-4" />
                        Oturumu Kapat
                    </button>

                    <p className="text-[10px] text-text-muted font-medium">
                        Tarot App v0.1.0 • 2026
                    </p>
                </div>
            </div>
        </div>
    );
}
