export interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  image_url?: string;
  published: boolean;
  author_id: string;
  created_at: string;
  updated_at: string;
  excerpt?: string;
  tags?: Tag[];
}

export interface PostFormData {
  title: string;
  content: string;
  image_url?: string;
  excerpt?: string;
  published: boolean;
  tags?: Tag[];
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id?: string;
  name: string;
  email: string;
  content: string;
  approved: boolean;
  created_at: string;
  updated_at: string;
}

export interface CommentFormData {
  name: string;
  email: string;
  content: string;
}

export interface Profile {
  id: string;
  email: string;
  is_admin: boolean;
  created_at: string;
}
