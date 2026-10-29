CREATE TABLE public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL,
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  excerpt text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  cover_url text,
  category text NOT NULL DEFAULT 'Journal',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts TO authenticated;
GRANT ALL ON public.posts TO service_role;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Posts are public" ON public.posts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Authors insert own" ON public.posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors update own" ON public.posts FOR UPDATE TO authenticated USING (auth.uid() = author_id);
CREATE POLICY "Authors delete own" ON public.posts FOR DELETE TO authenticated USING (auth.uid() = author_id);

CREATE POLICY "Blog images public read" ON storage.objects FOR SELECT USING (bucket_id = 'blog-images');
CREATE POLICY "Users upload own blog images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'blog-images' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users delete own blog images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'blog-images' AND (storage.foldername(name))[1] = auth.uid()::text);