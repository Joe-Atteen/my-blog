"use client";

import { Post } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { EditPost, DeletePost } from ".";
import Link from "next/link";
import { Eye, Check, X } from "lucide-react";

interface PostListProps {
  posts: Post[];
}

export function PostList({ posts }: PostListProps) {
  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Updated</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {posts.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center py-10 text-muted-foreground"
              >
                No posts found. Create your first post to get started.
              </TableCell>
            </TableRow>
          ) : (
            posts.map((post) => (
              <TableRow key={post.id}>
                <TableCell className="font-medium">{post.title}</TableCell>
                <TableCell>
                  <div className="flex items-center">
                    {post.published ? (
                      <span className="flex items-center text-green-600">
                        <Check className="h-4 w-4 mr-1" /> Published
                      </span>
                    ) : (
                      <span className="flex items-center text-amber-600">
                        <X className="h-4 w-4 mr-1" /> Draft
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {formatDistanceToNow(new Date(post.created_at), {
                    addSuffix: true,
                  })}
                </TableCell>
                <TableCell>
                  {formatDistanceToNow(new Date(post.updated_at), {
                    addSuffix: true,
                  })}
                </TableCell>
                <TableCell className="flex justify-end space-x-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/posts/${post.slug}`} target="_blank">
                      <Eye className="h-4 w-4 mr-1" /> Preview
                    </Link>
                  </Button>
                  <EditPost post={post} />
                  <DeletePost post={post} />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
