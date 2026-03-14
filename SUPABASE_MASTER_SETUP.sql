-- ==========================================
-- MASTER SUPABASE SETUP SQL
-- Bu kodu yeni projenizin SQL Editor kısmına yapıştırıp RUN diyerek 
-- tüm tablo yapısını saniyeler içinde kurabilirsiniz.
-- ==========================================

-- 1. PROFILES TABLOSU (Kullanıcı Bilgileri)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    role TEXT DEFAULT 'client', -- 'consultant' veya 'client'
    full_name TEXT,
    birth_date DATE,
    birth_time TIME,
    zodiac_sign TEXT,
    ascendant_sign TEXT,
    avatar_url TEXT,
    interests TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. CONSULTANTS TABLOSU (Danışmanlar)
CREATE TABLE IF NOT EXISTS public.consultants (
    id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
    display_name TEXT NOT NULL,
    rating FLOAT DEFAULT 5.0,
    is_online BOOLEAN DEFAULT false,
    specialties TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. SESSIONS TABLOSU (Görüşme Odaları)
CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, active, completed, cancelled
    consultant_id UUID REFERENCES public.consultants(id) ON DELETE CASCADE,
    client_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    client_info JSONB, -- {name, birth, focus, pkgId, cards...}
    room_state JSONB, -- Kartların son durumu (x, y, flipped vb.)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- updated_at Sütunlarını Mevcut Tablolara Ekle (Eğer yoksa)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='updated_at') THEN
        ALTER TABLE public.profiles ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='consultants' AND column_name='updated_at') THEN
        ALTER TABLE public.consultants ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sessions' AND column_name='updated_at') THEN
        ALTER TABLE public.sessions ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Otomatik update_at Fonksiyonu
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggerları Kur
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_consultants_updated_at ON public.consultants;
CREATE TRIGGER update_consultants_updated_at BEFORE UPDATE ON public.consultants FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_sessions_updated_at ON public.sessions;
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON public.sessions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- RLS POLICIES (Görünürlük için tekrar çalıştırılması sağlıklı olur)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Profiller (Genişletilmiş politika)
DROP POLICY IF EXISTS "Profilleri herkes görebilir" ON public.profiles;
CREATE POLICY "Profilleri herkes görebilir" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Kullanıcılar kendi profilini güncelleyebilir" ON public.profiles;
CREATE POLICY "Kullanıcılar kendi profilini güncelleyebilir" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Danışmanlar
DROP POLICY IF EXISTS "Danışmanları herkes görebilir" ON public.consultants;
CREATE POLICY "Danışmanları herkes görebilir" ON public.consultants FOR SELECT USING (true);
DROP POLICY IF EXISTS "Danışman kendi bilgisini güncelleyebilir" ON public.consultants;
CREATE POLICY "Danışman kendi bilgisini güncelleyebilir" ON public.consultants FOR UPDATE USING (auth.uid() = id);

-- Seanslar
DROP POLICY IF EXISTS "Katılımcılar seansları görebilir" ON public.sessions;
CREATE POLICY "Katılımcılar seansları görebilir" ON public.sessions FOR SELECT USING (auth.uid() = client_id OR auth.uid() = consultant_id OR client_id IS NULL);
DROP POLICY IF EXISTS "Herkes seans oluşturabilir" ON public.sessions;
CREATE POLICY "Herkes seans oluşturabilir" ON public.sessions FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Katılımcılar seansları güncelleyebilir" ON public.sessions;
CREATE POLICY "Katılımcılar seansları güncelleyebilir" ON public.sessions FOR UPDATE USING (auth.uid() = client_id OR auth.uid() = consultant_id OR client_id IS NULL);

-- Auth Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, avatar_url)
    VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Realtime (Hata vermemesi için sadece yoksa ekle)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'sessions') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.sessions;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'consultants') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.consultants;
    END IF;
END $$;

NOTIFY pgrst, 'reload schema';
