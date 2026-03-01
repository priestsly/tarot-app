"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
    Sparkles, User, LogOut, LayoutDashboard,
    History, Search, Menu, X, Bell, Moon,
    LogIn, Settings, UserPlus
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "../utils/cn";

export function Navigation() {
    const supabase = createClient();
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    // Hide navigation in the Tarot Room for maximum immersion
    const isRoom = pathname?.startsWith('/room/');
    if (isRoom) return null;

    useEffect(() => {
        const getAuth = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            if (user) {
                const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
                setProfile(data);
            }
        };
        getAuth();

        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
                setProfile(data);
            } else {
                setProfile(null);
            }
        });

        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);

        return () => {
            authListener.subscription.unsubscribe();
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = '/';
    };

    const isConsultant = profile?.role === 'consultant';

    const menuItems = [
        { name: "Keşfet", href: "/consultants", icon: Search, show: true },
        { name: "Oturumlarım", href: "/consultations", icon: History, show: !!user },
        { name: "Panel", href: "/dashboard", icon: LayoutDashboard, show: isConsultant },
    ];

    return (
        <nav className={cn(
            "fixed top-0 left-0 right-0 z-[100] transition-all duration-300 px-4 py-3 sm:px-6",
            scrolled ? "bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5 py-2" : "bg-transparent"
        )}>
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform">
                        <Moon className="w-6 h-6 text-amber-200 fill-amber-200/20" />
                    </div>
                    <div className="hidden sm:block">
                        <h1 className="text-lg font-heading font-black tracking-tight text-white group-hover:text-purple-300 transition-colors">
                            MYSTIC TAROT
                        </h1>
                        <p className="text-[9px] text-purple-400 font-bold tracking-[0.3em] uppercase opacity-60">Realtime Readings</p>
                    </div>
                </Link>

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/10 backdrop-blur-md">
                    {menuItems.filter(i => i.show).map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all",
                                pathname === item.href
                                    ? "bg-purple-600 text-white shadow-lg shadow-purple-500/20"
                                    : "text-text-muted hover:text-white hover:bg-white/5"
                            )}
                        >
                            <item.icon className="w-4 h-4" />
                            {item.name}
                        </Link>
                    ))}
                </div>

                {/* Right Side: Auth / Profile */}
                <div className="flex items-center gap-3">
                    {user ? (
                        <div className="flex items-center gap-2">
                            {/* User Profile Popover-ish button */}
                            <Link
                                href="/profile"
                                className="flex items-center gap-3 pl-3 pr-1 py-1 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all group"
                            >
                                <div className="hidden sm:block text-right pr-2">
                                    <p className="text-[10px] font-bold text-white leading-none mb-1">{profile?.full_name || user.email?.split('@')[0]}</p>
                                    <p className="text-[9px] text-purple-400 uppercase tracking-widest font-black leading-none">{isConsultant ? 'Danışman' : 'Danışan'}</p>
                                </div>
                                <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30 group-hover:bg-purple-500/30 transition-colors">
                                    <User className="w-4 h-4 text-purple-300" />
                                </div>
                            </Link>

                            <button
                                onClick={handleLogout}
                                className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                title="Çıkış Yap"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Link
                                href="/login"
                                className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all border border-white/10"
                            >
                                <LogIn className="w-4 h-4 text-purple-400" />
                                <span className="hidden sm:inline">Giriş Yap</span>
                            </Link>
                            <Link
                                href="/login?mode=signup"
                                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:shadow-lg hover:shadow-purple-500/30 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all"
                            >
                                <UserPlus className="w-4 h-4 text-amber-200" />
                                <span className="hidden sm:inline">Üye Ol</span>
                            </Link>
                        </div>
                    )}

                    {/* Mobile Menu Toggle */}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="md:hidden w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white"
                    >
                        {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden mt-4 overflow-hidden"
                    >
                        <div className="bg-[#161623] border border-white/10 rounded-2xl p-4 space-y-2 shadow-2xl">
                            {menuItems.filter(i => i.show).map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setIsMenuOpen(false)}
                                    className={cn(
                                        "flex items-center gap-3 p-4 rounded-xl text-sm font-bold uppercase tracking-widest transition-all",
                                        pathname === item.href
                                            ? "bg-purple-600 text-white"
                                            : "text-text-muted hover:text-white hover:bg-white/5"
                                    )}
                                >
                                    <item.icon className="w-5 h-5" />
                                    {item.name}
                                </Link>
                            ))}
                            {!user && (
                                <div className="grid grid-cols-2 gap-2 pt-2">
                                    <Link href="/login" onClick={() => setIsMenuOpen(false)} className="flex items-center justify-center gap-2 p-4 bg-white/5 rounded-xl text-xs font-bold uppercase text-white">
                                        <LogIn className="w-4 h-4" /> Giriş
                                    </Link>
                                    <Link href="/login?mode=signup" onClick={() => setIsMenuOpen(false)} className="flex items-center justify-center gap-2 p-4 bg-purple-600 rounded-xl text-xs font-bold uppercase text-white shadow-lg shadow-purple-900/40">
                                        <UserPlus className="w-4 h-4" /> Üye Ol
                                    </Link>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}
