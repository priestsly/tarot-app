-- 1. Consultants tablosu için Realtime (Gerçek Zamanlı) desteğini açıyoruz
ALTER PUBLICATION supabase_realtime ADD TABLE consultants;

-- 2. Sessions tablosu için Realtime desteğini açıyoruz (Eğer önceden açık değilse)
ALTER PUBLICATION supabase_realtime ADD TABLE sessions;

-- 3. Replica Identity FULL yapıyoruz ki UPDATE işlemlerinde eski ve yeni veri tam olarak gelsin
ALTER TABLE consultants REPLICA IDENTITY FULL;
ALTER TABLE sessions REPLICA IDENTITY FULL;
