import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // Build sırasında anahtarlar eksikse hatayı engellemek için null dönebiliriz 
    // veya kütüphaneyi çağırmadan sahte bir nesne dönebiliriz.
    if (!supabaseUrl || !supabaseKey) {
        // Build sırasında patlamasın diye kütüphaneyi hiç çağırmıyoruz
        return null as any;
    }

    return createBrowserClient(supabaseUrl, supabaseKey)
}
