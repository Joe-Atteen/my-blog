-- Create comments table
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  approved BOOLEAN NOT NULL DEFAULT true,
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Everyone can read approved comments
CREATE POLICY "Anyone can read approved comments"
  ON public.comments
  FOR SELECT
  USING (approved = true);

-- Authenticated users can create comments
CREATE POLICY "Authenticated users can create comments"
  ON public.comments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can read their own unapproved comments
CREATE POLICY "Users can read their own unapproved comments"
  ON public.comments
  FOR SELECT
  USING (auth.uid() = user_id);

-- Only admins can update or delete comments
CREATE POLICY "Only admins can update or delete comments"
  ON public.comments
  FOR UPDATE
  USING ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Only admins can delete comments"
  ON public.comments
  FOR DELETE
  USING ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()));
