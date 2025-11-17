-- Add admin system and user moderation
ALTER TABLE public.profiles_2025_11_16_17_00 
ADD COLUMN is_admin BOOLEAN DEFAULT FALSE,
ADD COLUMN is_banned BOOLEAN DEFAULT FALSE,
ADD COLUMN banned_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN banned_by UUID REFERENCES public.profiles_2025_11_16_17_00(id),
ADD COLUMN ban_reason TEXT;

-- Create admin logs table for tracking admin actions
CREATE TABLE public.admin_logs_2025_11_16_17_00 (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  admin_id UUID REFERENCES public.profiles_2025_11_16_17_00(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'ban_user', 'unban_user', 'delete_story', 'promote_admin', 'demote_admin'
  target_user_id UUID REFERENCES public.profiles_2025_11_16_17_00(id),
  target_story_id UUID REFERENCES public.stories_2025_11_16_17_00(id),
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add soft delete to stories
ALTER TABLE public.stories_2025_11_16_17_00 
ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN deleted_by UUID REFERENCES public.profiles_2025_11_16_17_00(id),
ADD COLUMN delete_reason TEXT;

-- RLS for admin logs
ALTER TABLE public.admin_logs_2025_11_16_17_00 ENABLE ROW LEVEL SECURITY;

-- Only admins can view admin logs
CREATE POLICY "Only admins can view admin logs" ON public.admin_logs_2025_11_16_17_00
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles_2025_11_16_17_00 
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Only admins can insert admin logs
CREATE POLICY "Only admins can insert admin logs" ON public.admin_logs_2025_11_16_17_00
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles_2025_11_16_17_00 
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Update stories policy to exclude deleted stories for regular users
DROP POLICY "Stories are viewable by everyone" ON public.stories_2025_11_16_17_00;
CREATE POLICY "Stories are viewable by everyone" ON public.stories_2025_11_16_17_00
  FOR SELECT USING (
    (is_deleted = FALSE) OR 
    (EXISTS (
      SELECT 1 FROM public.profiles_2025_11_16_17_00 
      WHERE id = auth.uid() AND is_admin = TRUE
    ))
  );

-- Update profiles policy to exclude banned users for regular users
DROP POLICY "Public profiles are viewable by everyone" ON public.profiles_2025_11_16_17_00;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles_2025_11_16_17_00
  FOR SELECT USING (
    (is_banned = FALSE) OR 
    (id = auth.uid()) OR
    (EXISTS (
      SELECT 1 FROM public.profiles_2025_11_16_17_00 
      WHERE id = auth.uid() AND is_admin = TRUE
    ))
  );

-- Prevent banned users from creating content
CREATE POLICY "Banned users cannot create stories" ON public.stories_2025_11_16_17_00
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND
    NOT EXISTS (
      SELECT 1 FROM public.profiles_2025_11_16_17_00 
      WHERE id = auth.uid() AND is_banned = TRUE
    )
  );

CREATE POLICY "Banned users cannot create investigations" ON public.investigations_2025_11_16_17_00
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND
    NOT EXISTS (
      SELECT 1 FROM public.profiles_2025_11_16_17_00 
      WHERE id = auth.uid() AND is_banned = TRUE
    )
  );

CREATE POLICY "Banned users cannot create comments" ON public.comments_2025_11_16_17_00
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND
    NOT EXISTS (
      SELECT 1 FROM public.profiles_2025_11_16_17_00 
      WHERE id = auth.uid() AND is_banned = TRUE
    )
  );

-- Function to create first admin (run once)
CREATE OR REPLACE FUNCTION public.make_first_admin_2025_11_16_17_00(user_email TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles_2025_11_16_17_00 
  SET is_admin = TRUE 
  WHERE id = (
    SELECT id FROM auth.users WHERE email = user_email LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;