import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    // Railway'den gelen değerleri al ve tırnaklardan temizle
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/['"]/g, '')
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.replace(/['"]/g, '')

    // BUILD AŞAMASI VEYA EKSİK ANAHTAR KONTROLÜ
    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder')) {
        return new Proxy({}, {
            get: (_, prop) => {
                if (prop === 'auth') return {
                    getUser: async () => ({ data: { user: null } }),
                    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
                    signInWithPassword: async () => ({ data: {}, error: null }),
                    signUp: async () => ({ data: {}, error: null }),
                    signInWithOAuth: async () => ({ data: {}, error: null }),
                };
                return () => ({
                    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }) }),
                    select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) })
                });
            }
        }) as any;
    }

    return createBrowserClient(supabaseUrl, supabaseKey)
}
