import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
    // Railway'den gelen değerleri al, tırnakları ve boşlukları temizle
    const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
    const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

    // Build aşamasında hata vermemesi için
    const supabaseUrl = rawUrl.replace(/['"]/g, '').trim();
    const supabaseKey = rawKey.replace(/['"]/g, '').trim();

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
