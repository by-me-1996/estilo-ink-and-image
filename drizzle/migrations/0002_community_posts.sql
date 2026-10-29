ALTER TABLE public.posts ADD COLUMN source text NOT NULL DEFAULT 'mine' CHECK (source IN ('mine','community'));
ALTER TABLE public.posts ADD COLUMN contributor_name text;
ALTER TABLE public.submissions ADD COLUMN status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','draft','published'));
GRANT UPDATE ON public.submissions TO authenticated;
CREATE POLICY "Admin updates submissions" ON public.submissions FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));