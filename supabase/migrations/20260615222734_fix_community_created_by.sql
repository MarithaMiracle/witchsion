ALTER TABLE public.community_groups ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE public.community_groups DROP CONSTRAINT community_groups_created_by_fkey;
ALTER TABLE public.community_groups ADD CONSTRAINT community_groups_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;