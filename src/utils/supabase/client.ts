import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // Safety check for build-time / SSR if variables are missing
    if (!url || !anonKey) {
        if (typeof window === 'undefined') {
            console.warn('[Build-time Warning] Supabase keys missing. Returning dummy client.');
            return {
                auth: {
                    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
                    getUser: async () => ({ data: { user: null }, error: null }),
                    signOut: async () => ({ error: null })
                },
                from: () => ({
                    select: () => ({
                        eq: () => ({
                            maybeSingle: async () => ({ data: null, error: null }),
                            single: async () => ({ data: null, error: null })
                        })
                    })
                }),
                storage: { from: () => ({}) }
            } as any;
        }
    }

    return createBrowserClient(url!, anonKey!)
}
