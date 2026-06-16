-- Add parent_id to content_comments for nested replies
ALTER TABLE public.content_comments ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.content_comments(id) ON DELETE CASCADE;

-- Add parent_id to community_comments for nested replies
ALTER TABLE public.community_comments ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.community_comments(id) ON DELETE CASCADE;

-- Content Comment Likes
CREATE TABLE IF NOT EXISTS public.content_comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES public.content_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

ALTER TABLE public.content_comment_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can view comment likes" ON public.content_comment_likes;
CREATE POLICY "Everyone can view comment likes" ON public.content_comment_likes
  FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "Users can create their own comment likes" ON public.content_comment_likes;
CREATE POLICY "Users can create their own comment likes" ON public.content_comment_likes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own comment likes" ON public.content_comment_likes;
CREATE POLICY "Users can delete their own comment likes" ON public.content_comment_likes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

GRANT SELECT, INSERT, DELETE ON public.content_comment_likes TO authenticated;
GRANT SELECT ON public.content_comment_likes TO anon;
GRANT ALL ON public.content_comment_likes TO service_role;