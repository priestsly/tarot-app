-- 1. Müşterilerin (anonim olanların) oturumlara bağlanabilmesi için client_id sütunundaki zorunluluğu kaldırıyoruz.
ALTER TABLE public.sessions ALTER COLUMN client_id DROP NOT NULL;
