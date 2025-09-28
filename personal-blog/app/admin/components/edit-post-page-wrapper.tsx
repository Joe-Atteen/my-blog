"use client";

import { useRouter } from "next/navigation";
import { EditPostForm } from "./edit-post-form";
import { Post } from "@/lib/types";

interface EditPostPageWrapperProps {
  post: Post;
}

export function EditPostPageWrapper({ post }: EditPostPageWrapperProps) {
  const router = useRouter();

  const handleClose = () => {
    router.push("/admin");
  };

  return (
    <div className="max-w-4xl">
      <EditPostForm post={post} onClose={handleClose} />
    </div>
  );
}
