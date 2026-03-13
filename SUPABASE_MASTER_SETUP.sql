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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profilleri herkes görebilir" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Kullanıcılar kendi profilini güncelleyebilir" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Sistem profil oluşturabilir" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. CONSULTANTS TABLOSU (Danışmanlar)
CREATE TABLE IF NOT EXISTS public.consultants (
    id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
    display_name TEXT NOT NULL,
    rating FLOAT DEFAULT 5.0,
    is_online BOOLEAN DEFAULT false,
    specialties TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.consultants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Danışmanları herkes görebilir" ON public.consultants FOR SELECT USING (true);
CREATE POLICY "Danışman kendi bilgisini güncelleyebilir" ON public.consultants FOR UPDATE USING (auth.uid() = id);

-- 3. SESSIONS TABLOSU (Görüşme Odaları)
CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, active, completed, cancelled
    consultant_id UUID REFERENCES public.consultants(id) ON DELETE CASCADE,
    client_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    client_info JSONB, -- {name, birth, focus, pkgId, cards...}
    room_state JSONB, -- Kartların son durumu (x, y, flipped vb.)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Katılımcılar seansları görebilir" ON public.sessions 
    FOR SELECT USING (auth.uid() = client_id OR auth.uid() = consultant_id OR client_id IS NULL);

CREATE POLICY "Herkes seans oluşturabilir" ON public.sessions 
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Katılımcılar seansları güncelleyebilir" ON public.sessions 
    FOR UPDATE USING (auth.uid() = client_id OR auth.uid() = consultant_id OR client_id IS NULL);

-- 4. OTOMATİK PROFİL OLUŞTURUCU (Auth Trigger)
-- Yeni bir kullanıcı kayıt olduğunda otomatik olarak profiles tablosuna ekler
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, avatar_url)
    VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. REALTIME AKTİF ETME
-- Bu tabloların anlık güncellenmesi için gereklidir
ALTER PUBLICATION supabase_realtime ADD TABLE public.sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.consultants;

-- Şema önbelleğini tazele
NOTIFY pgrst, 'reload schema';
