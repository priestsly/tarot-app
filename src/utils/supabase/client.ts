import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    // Eğer tarayıcıda değilsek (build/derleme aşamasındaysak), @supabase/ssr kütüphanesini 
    // hiç çağırmayarak "anahtar yok" hatası fırlatmasını engelliyoruz.
    if (typeof window === 'undefined') {
        return {
            auth: {
                onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
                getUser: async () => ({ data: { user: null } }),
                signInWithPassword: async () => ({ data: {}, error: null }),
                signUp: async () => ({ data: {}, error: null }),
                signInWithOAuth: async () => ({ data: {}, error: null }),
            },
            from: () => ({
                select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) })
            })
        } as any;
    }

    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
}
