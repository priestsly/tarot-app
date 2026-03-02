-- profiles tablosundaki eksik TÜM kolonları tek seferde ekliyoruz.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birth_time TIME;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS zodiac_sign TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ascendant_sign TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS interests TEXT[];

-- RLS (Row Level Security) Politikaları
-- Kullanıcıların kendi profillerini görebilmesi ve güncelleyebilmesi için
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Eğer politika zaten varsa hata vermemesi için önce silebiliriz (opsiyonel)
-- DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
-- DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Şema önbelleğini yenile
NOTIFY pgrst, 'reload schema';
