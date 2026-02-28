import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    // Railway'den gelen değerleri al, tırnakları ve boşlukları temizle
    const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    const supabaseUrl = rawUrl.replace(/['"]/g, '').trim();
    const supabaseKey = rawKey.replace(/['"]/g, '').trim();

    // Doğrudan oluştur. Hata verirse, Railway'de env de yok demektir. (Proxy yok)
    return createBrowserClient(supabaseUrl, supabaseKey);
}
