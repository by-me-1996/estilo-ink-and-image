CREATE TYPE public.app_role AS ENUM ('admin');
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own roles readable" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- The first account ever created becomes the owner/admin
CREATE OR REPLACE FUNCTION public.assign_first_admin()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_first_admin AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.assign_first_admin();

DROP POLICY IF EXISTS "Authors insert own" ON public.posts;
CREATE POLICY "Admin inserts posts" ON public.posts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = author_id AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users upload own blog images" ON storage.objects;
CREATE POLICY "Admin uploads blog images" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'blog-images' AND (storage.foldername(name))[1] = auth.uid()::text AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone uploads submission images" ON storage.objects FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'blog-images' AND (storage.foldername(name))[1] = 'submissions');
DROP POLICY IF EXISTS "Blog images public read" ON storage.objects;
CREATE POLICY "Blog images public read" ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'blog-images' AND ((storage.foldername(name))[1] <> 'submissions' OR public.has_role(auth.uid(), 'admin')));

CREATE TABLE public.submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  image_paths text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.submissions TO anon, authenticated;
GRANT SELECT, DELETE ON public.submissions TO authenticated;
GRANT ALL ON public.submissions TO service_role;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit" ON public.submissions FOR INSERT TO anon, authenticated
  WITH CHECK (length(name) BETWEEN 1 AND 120 AND length(email) BETWEEN 3 AND 255 AND length(title) BETWEEN 1 AND 200 AND length(message) BETWEEN 1 AND 20000 AND cardinality(image_paths) <= 6);
CREATE POLICY "Admin reads submissions" ON public.submissions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin deletes submissions" ON public.submissions FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));