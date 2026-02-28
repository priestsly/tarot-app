import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // EĞER ANAHTARLAR YOKSA (BUILD AŞAMASINDAYIZ), KÜTÜPHANEYİ ÇAĞIRMA!
    if (!supabaseUrl || !supabaseKey) {
        // En sağlam yol: Her türlü isteği yutan "yansız" bir proxy dönersek build asla çökemez.
        return new Proxy({}, {
            get: (_, prop) => {
                if (prop === 'auth') return {
                    getUser: async () => ({ data: { user: null } }),
                    exchangeCodeForSession: async () => ({ data: {}, error: null })
                };
                return () => ({
                    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }) })
                });
            }
        }) as any;
    }

    const cookieStore = await cookies()

    return createServerClient(
        supabaseUrl,
        supabaseKey,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    try {
                        cookieStore.set({ name, value, ...options })
                    } catch (error) {
                        // The `set` method was called from a Server Component.
                    }
                },
                remove(name: string, options: CookieOptions) {
                    try {
                        cookieStore.set({ name, value: '', ...options })
                    } catch (error) {
                        // The `delete` method was called from a Server Component.
                    }
                },
            },
        }
    )
}
