-- Sessions tablosuna room_state kolonu ekle (kartları kalıcı tutmak için)
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS room_state JSONB DEFAULT NULL;

-- Yorum: room_state, odadaki kartların JSON dizisini tutar.
-- Sayfa yenilendiğinde kartlar bu kolondan geri yüklenir.
