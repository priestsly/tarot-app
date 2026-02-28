import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
    // Railway ortam değişkenleri sorununu KESİN çözmek için değerleri doğrudan yedekliyoruz
    const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://oezzrdomxzzuxqibqcko.supabase.co';
    const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lenpyZG9teHp6dXhxaWJxY2tvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyNzAwNTUsImV4cCI6MjA4Nzg0NjA1NX0.qnFuSRIcAaeKSA8XZdbjGoWTP3TP0Lx6Y0MhRURB3DA';

    let supabaseUrl = rawUrl.replace(/['"]/g, '').trim();
    let supabaseKey = rawKey.replace(/['"]/g, '').trim();

    // Eğer eski placeholder koda gömülü kaldıysa onu da gerçek değerle ez
    if (supabaseUrl.includes('placeholder')) {
        supabaseUrl = 'https://oezzrdomxzzuxqibqcko.supabase.co';
        supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lenpyZG9teHp6dXhxaWJxY2tvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyNzAwNTUsImV4cCI6MjA4Nzg0NjA1NX0.qnFuSRIcAaeKSA8XZdbjGoWTP3TP0Lx6Y0MhRURB3DA';
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
