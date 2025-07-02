import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function PostsNotFound() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-24 text-center">
      <h2 className="text-2xl font-bold mb-4">Page not found</h2>
      <p className="mb-8">
        The blog page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Button asChild>
        <Link href="/posts">Browse All Posts</Link>
      </Button>
    </div>
  );
}
