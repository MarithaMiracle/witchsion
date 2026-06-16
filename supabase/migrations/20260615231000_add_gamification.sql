-- /Users/decagon/witchsion/witchsion/supabase/migrations/20260615231000_add_gamification.sql

-- Badges table
CREATE TABLE IF NOT EXISTS public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  image TEXT,
  criteria TEXT NOT NULL, -- e.g., "first_purchase", "5_orders", "community_posts_10"
  points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User Badges table (many-to-many)
CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- User Points table
CREATE TABLE IF NOT EXISTS public.user_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL DEFAULT 0,
  reason TEXT NOT NULL, -- e.g., "purchase", "badge_earned", "community_post"
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Function to get total points for a user
CREATE OR REPLACE FUNCTION public.get_user_total_points(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN COALESCE((SELECT SUM(points) FROM public.user_points WHERE user_id = user_uuid), 0);
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Badges: everyone can view
CREATE POLICY "Everyone can view badges" ON public.badges
  FOR SELECT TO authenticated, anon USING (true);

-- User Badges: users can view their own, admins can view all
CREATE POLICY "Users can view their own badges" ON public.user_badges
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all user badges" ON public.user_badges
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- User Points: users can view their own, admins can view all
CREATE POLICY "Users can view their own points" ON public.user_points
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all user points" ON public.user_points
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Grant permissions
GRANT SELECT ON public.badges TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.badges TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_badges TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_points TO authenticated;
GRANT ALL ON public.badges TO service_role;
GRANT ALL ON public.user_badges TO service_role;
GRANT ALL ON public.user_points TO service_role;

-- Triggers to update updated_at
CREATE TRIGGER badges_touch BEFORE UPDATE ON public.badges
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();