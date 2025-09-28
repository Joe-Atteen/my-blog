"use client";

import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";

interface EditPostProps {
  onToggle: () => void;
}

export function EditPost({ onToggle }: EditPostProps) {
  return (
    <Button size="sm" variant="outline" onClick={onToggle}>
      <Pencil className="h-4 w-4 mr-1" /> Edit
    </Button>
  );
}
