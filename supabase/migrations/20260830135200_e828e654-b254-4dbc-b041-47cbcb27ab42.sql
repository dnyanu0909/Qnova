DROP POLICY IF EXISTS "Anyone can resolve active links" ON public.dynamic_links;

CREATE POLICY "Anyone can resolve links"
  ON public.dynamic_links
  FOR SELECT
  TO anon, authenticated
  USING (true);