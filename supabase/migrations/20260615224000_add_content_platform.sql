-- ========== CONTENT PLATFORM ==========
-- Blog Posts & Resources
CREATE TABLE public.content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  type TEXT NOT NULL DEFAULT 'blog', -- 'blog' or 'resource'
  image TEXT,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.content TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content TO authenticated;
GRANT ALL ON public.content TO service_role;
ALTER TABLE public.content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view published content" ON public.content
  FOR SELECT TO authenticated, anon USING (is_published = true);

CREATE POLICY "Admins can manage all content" ON public.content
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER content_touch BEFORE UPDATE ON public.content
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();