-- 1. Profiles tablosuna eksik olan kolonları ekliyoruz.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birth_time TIME;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS zodiac_sign TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ascendant_sign TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS interests TEXT[];

-- 2. Supabase'in şema önbelleğini (schema cache) yenilemek için bir fonksiyon çalıştırıyoruz (genelde kolon ekleyince otomatik yenilenir ama bu garanti eder).
-- Not: Eğer PostgREST cache hatası devam ederse Supabase Dashboard'dan 'Reload PostgREST' tuşuna basılması gerekebilir.
NOTIFY pgrst, 'reload schema';
