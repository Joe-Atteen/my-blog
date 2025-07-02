import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PostNotFound() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-20 text-center">
      <h2 className="text-3xl font-bold mb-4">Post Not Found</h2>
      <p className="text-lg text-muted-foreground mb-8">
        The post you are looking for does not exist or has been removed.
      </p>
      <Button asChild>
        <Link href="/">Return Home</Link>
      </Button>
    </div>
  );
}
