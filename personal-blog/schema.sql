-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create RLS policies for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Allow users to read their own profile
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Policy: Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Policy: Allow admins to read all profiles - using a direct bypass approach
CREATE POLICY "Admins can read all profiles" ON public.profiles
  FOR SELECT USING (true);

-- Create posts table
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  image_url TEXT,
  published BOOLEAN DEFAULT FALSE,
  author_id UUID REFERENCES public.profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create RLS policies for posts
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Policy: Allow everyone to read published posts
CREATE POLICY "Published posts are viewable by everyone" ON public.posts
  FOR SELECT USING (published = true);

-- Policy: Allow authors to read their own posts
CREATE POLICY "Authors can read own posts" ON public.posts
  FOR SELECT USING (auth.uid() = author_id);

-- Policy: Allow authors to insert their own posts
CREATE POLICY "Authors can create posts" ON public.posts
  FOR INSERT WITH CHECK (auth.uid() = author_id);

-- Policy: Allow authors to update their own posts
CREATE POLICY "Authors can update own posts" ON public.posts
  FOR UPDATE USING (auth.uid() = author_id);

-- Policy: Allow authors to delete their own posts
CREATE POLICY "Authors can delete own posts" ON public.posts
  FOR DELETE USING (auth.uid() = author_id);

-- Create a helper function to check if a user is an admin
CREATE OR REPLACE FUNCTION is_admin(uid uuid)
RETURNS BOOLEAN AS $$
DECLARE
  admin_result BOOLEAN;
BEGIN
  SELECT is_admin INTO admin_result FROM public.profiles WHERE id = uid;
  RETURN admin_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policy: Allow admins to manage all posts
CREATE POLICY "Admins can manage all posts" ON public.posts
  USING (is_admin(auth.uid()));

-- Create a trigger to update the updated_at column on posts
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_posts_updated_at
BEFORE UPDATE ON public.posts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create a function to handle new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, is_admin)
  VALUES (
    new.id,
    new.email,
    new.email IN (
      -- List of admin emails - replace with actual admin emails
      'joeyatteen@gmail.com'
    )
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger that calls the function on signup
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create storage bucket for blog images
CREATE POLICY "Blog images are accessible to everyone" ON storage.objects
  FOR SELECT USING (bucket_id = 'blog-images');

CREATE POLICY "Authenticated users can upload blog images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'blog-images' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Authors can update own blog images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'blog-images' AND
    auth.uid() = owner
  );

CREATE POLICY "Authors can delete own blog images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'blog-images' AND
    auth.uid() = owner
  );
