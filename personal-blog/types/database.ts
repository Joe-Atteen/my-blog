export type BlogPost = {
  id: string;
  title: string;
  content: string;
  slug: string;
  image_url?: string | null;
  created_at: string;
  updated_at: string;
  published: boolean;
  author_id: string;
};

export type User = {
  id: string;
  email: string;
  is_admin: boolean;
};

export type Database = {
  public: {
    Tables: {
      posts: {
        Row: BlogPost;
        Insert: Omit<BlogPost, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<BlogPost, "id" | "created_at" | "updated_at">>;
      };
      profiles: {
        Row: User;
        Insert: Omit<User, "id">;
        Update: Partial<Omit<User, "id">>;
      };
    };
  };
};
