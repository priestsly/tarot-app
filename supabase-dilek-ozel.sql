-- Dilek Özel Mesaj Tablosu Oluşturma
CREATE TABLE IF NOT EXISTS public.dilek_ozel_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL, -- 'user' veya 'assistant'
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS (Satır Bazlı Güvenlik) Aktifleştirme
ALTER TABLE public.dilek_ozel_messages ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar sadece kendi mesajlarını görebilir
DROP POLICY IF EXISTS "Users can read their own dilek messages" ON public.dilek_ozel_messages;
CREATE POLICY "Users can read their own dilek messages" ON public.dilek_ozel_messages
FOR SELECT USING (auth.uid() = user_id);

-- Kullanıcılar mesaj ekleyebilir
DROP POLICY IF EXISTS "Users can insert their own dilek messages" ON public.dilek_ozel_messages;
CREATE POLICY "Users can insert their own dilek messages" ON public.dilek_ozel_messages
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Gerçek zamanlı (Realtime) desteği (opsiyonel ama iyi olur)
ALTER PUBLICATION supabase_realtime ADD TABLE public.dilek_ozel_messages;
