-- Update community groups policy to allow anon users
DROP POLICY IF EXISTS "Everyone can view groups" ON public.community_groups;
CREATE POLICY "Everyone can view groups" ON public.community_groups
  FOR SELECT TO authenticated, anon USING (true);

-- Update community posts policy to allow anon users
DROP POLICY IF EXISTS "Everyone can view posts" ON public.community_posts;
CREATE POLICY "Everyone can view posts" ON public.community_posts
  FOR SELECT TO authenticated, anon USING (true);

-- Update community comments policy to allow anon users
DROP POLICY IF EXISTS "Everyone can view comments" ON public.community_comments;
CREATE POLICY "Everyone can view comments" ON public.community_comments
  FOR SELECT TO authenticated, anon USING (true);

-- Update community reactions policy to allow anon users
DROP POLICY IF EXISTS "Everyone can view reactions" ON public.community_reactions;
CREATE POLICY "Everyone can view reactions" ON public.community_reactions
  FOR SELECT TO authenticated, anon USING (true);

-- Grant SELECT access to anon users
GRANT SELECT ON public.community_groups TO anon;
GRANT SELECT ON public.community_posts TO anon;
GRANT SELECT ON public.community_comments TO anon;
GRANT SELECT ON public.community_reactions TO anon;