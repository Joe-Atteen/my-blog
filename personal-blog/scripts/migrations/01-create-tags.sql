-- Create tags table
CREATE TABLE IF NOT EXISTS public.tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create posts_tags relationship table
CREATE TABLE IF NOT EXISTS public.posts_tags (
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_posts_tags_post_id ON public.posts_tags(post_id);
CREATE INDEX IF NOT EXISTS idx_posts_tags_tag_id ON public.posts_tags(tag_id);

-- Insert some sample tags
INSERT INTO public.tags (name, slug) VALUES
  ('Technology', 'technology'),
  ('Design', 'design'),
  ('Productivity', 'productivity'),
  ('Web Development', 'web-development'),
  ('Personal', 'personal')
ON CONFLICT (slug) DO NOTHING;
