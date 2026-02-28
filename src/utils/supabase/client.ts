import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // BUILD BYPASS: Eğer anahtarlar yoksa, kütüphaneyi hiç çağırmıyoruz.
    // Proxy nesnesi her türlü metod çağrısına "boş" ama "geçerli" cevap döner.
    if (!supabaseUrl || !supabaseKey) {
        return new Proxy({}, {
            get: (_, prop) => {
                if (prop === 'auth') return {
                    getUser: async () => ({ data: { user: null } }),
                    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } })
                };
                return () => ({
                    select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) })
                });
            }
        }) as any;
    }

    return createBrowserClient(supabaseUrl, supabaseKey)
}
