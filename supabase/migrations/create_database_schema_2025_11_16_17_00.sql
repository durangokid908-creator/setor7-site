-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create stories table for supernatural reports
CREATE TABLE public.stories_2025_11_16_17_00 (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  location TEXT,
  date_occurred DATE,
  category TEXT DEFAULT 'outros',
  author_id UUID REFERENCES public.profiles_2025_11_16_17_00(id) ON DELETE CASCADE,
  image_urls TEXT[],
  video_urls TEXT[],
  is_verified BOOLEAN DEFAULT FALSE,
  credibility_score INTEGER DEFAULT 0,
  investigation_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create investigations table for user theories and evidence
CREATE TABLE public.investigations_2025_11_16_17_00 (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  story_id UUID REFERENCES public.stories_2025_11_16_17_00(id) ON DELETE CASCADE,
  investigator_id UUID REFERENCES public.profiles_2025_11_16_17_00(id) ON DELETE CASCADE,
  theory TEXT NOT NULL,
  evidence TEXT,
  evidence_urls TEXT[],
  votes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create comments table
CREATE TABLE public.comments_2025_11_16_17_00 (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  story_id UUID REFERENCES public.stories_2025_11_16_17_00(id) ON DELETE CASCADE,
  author_id UUID REFERENCES public.profiles_2025_11_16_17_00(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create votes table for investigations
CREATE TABLE public.investigation_votes_2025_11_16_17_00 (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  investigation_id UUID REFERENCES public.investigations_2025_11_16_17_00(id) ON DELETE CASCADE,
  voter_id UUID REFERENCES public.profiles_2025_11_16_17_00(id) ON DELETE CASCADE,
  vote_type INTEGER CHECK (vote_type IN (-1, 1)), -- -1 for downvote, 1 for upvote
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(investigation_id, voter_id)
);

-- Create storage bucket for media files
INSERT INTO storage.buckets (id, name, public) VALUES ('story-media', 'story-media', true);

-- RLS Policies
ALTER TABLE public.profiles_2025_11_16_17_00 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories_2025_11_16_17_00 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investigations_2025_11_16_17_00 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments_2025_11_16_17_00 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investigation_votes_2025_11_16_17_00 ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles_2025_11_16_17_00
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON public.profiles_2025_11_16_17_00
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles_2025_11_16_17_00
  FOR UPDATE USING (auth.uid() = id);

-- Stories policies
CREATE POLICY "Stories are viewable by everyone" ON public.stories_2025_11_16_17_00
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create stories" ON public.stories_2025_11_16_17_00
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own stories" ON public.stories_2025_11_16_17_00
  FOR UPDATE USING (auth.uid() = author_id);

-- Investigations policies
CREATE POLICY "Investigations are viewable by everyone" ON public.investigations_2025_11_16_17_00
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create investigations" ON public.investigations_2025_11_16_17_00
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own investigations" ON public.investigations_2025_11_16_17_00
  FOR UPDATE USING (auth.uid() = investigator_id);

-- Comments policies
CREATE POLICY "Comments are viewable by everyone" ON public.comments_2025_11_16_17_00
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create comments" ON public.comments_2025_11_16_17_00
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Votes policies
CREATE POLICY "Votes are viewable by everyone" ON public.investigation_votes_2025_11_16_17_00
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can vote" ON public.investigation_votes_2025_11_16_17_00
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own votes" ON public.investigation_votes_2025_11_16_17_00
  FOR UPDATE USING (auth.uid() = voter_id);

CREATE POLICY "Users can delete their own votes" ON public.investigation_votes_2025_11_16_17_00
  FOR DELETE USING (auth.uid() = voter_id);

-- Storage policies
CREATE POLICY "Anyone can view story media" ON storage.objects
  FOR SELECT USING (bucket_id = 'story-media');

CREATE POLICY "Authenticated users can upload story media" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'story-media' AND auth.role() = 'authenticated');

-- Function to handle user registration
CREATE OR REPLACE FUNCTION public.handle_new_user_2025_11_16_17_00()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles_2025_11_16_17_00 (id, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user registration
CREATE OR REPLACE TRIGGER on_auth_user_created_2025_11_16_17_00
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_2025_11_16_17_00();

-- Function to update investigation votes count
CREATE OR REPLACE FUNCTION public.update_investigation_votes_2025_11_16_17_00()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.investigations_2025_11_16_17_00 
    SET votes = votes + NEW.vote_type
    WHERE id = NEW.investigation_id;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE public.investigations_2025_11_16_17_00 
    SET votes = votes - OLD.vote_type + NEW.vote_type
    WHERE id = NEW.investigation_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.investigations_2025_11_16_17_00 
    SET votes = votes - OLD.vote_type
    WHERE id = OLD.investigation_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for vote counting
CREATE OR REPLACE TRIGGER on_investigation_vote_change_2025_11_16_17_00
  AFTER INSERT OR UPDATE OR DELETE ON public.investigation_votes_2025_11_16_17_00
  FOR EACH ROW EXECUTE FUNCTION public.update_investigation_votes_2025_11_16_17_00();