import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    // Railway'den gelen değerleri al, tırnakları ve boşlukları temizle
    const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
    const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

    // Eğer NEXT_PUBLIC değişkenleri Next.js build aşamasında yoksa SSR kütüphanesi hata verir.
    // Build'i geçmesi için placeholder verdik, fakat runtime'da gerçek anahtarlar çalışacak.
    const supabaseUrl = rawUrl.replace(/['"]/g, '').trim();
    const supabaseKey = rawKey.replace(/['"]/g, '').trim();

    // Doğrudan oluştur. Hata verirse, Railway'de env de yok demektir. (Proxy yok)
    return createBrowserClient(supabaseUrl, supabaseKey);
}

