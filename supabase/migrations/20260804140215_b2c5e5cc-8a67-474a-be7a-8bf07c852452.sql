CREATE POLICY "Anyone can upload page assets"
ON storage.objects FOR INSERT TO anon, authenticated
WITH CHECK (bucket_id = 'page-assets');

CREATE POLICY "Anyone can read page assets"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'page-assets');