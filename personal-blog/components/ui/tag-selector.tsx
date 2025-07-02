"use client";

import { useState, useEffect } from "react";
import { Tag } from "@/lib/types";
import { createBrowserClient } from "@/app/supabase-browser";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TagSelectorProps {
  selectedTags: Tag[];
  onChange: (tags: Tag[]) => void;
}

export function TagSelector({ selectedTags, onChange }: TagSelectorProps) {
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inputValue, setInputValue] = useState("");
  const supabase = createBrowserClient();

  useEffect(() => {
    async function fetchTags() {
      try {
        setIsLoading(true);

        const { data, error } = await supabase
          .from("tags")
          .select("*")
          .order("name");

        if (error) throw error;

        setAvailableTags(data || []);
      } catch (error) {
        console.error("Error fetching tags:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTags();
  }, [supabase]);

  const filteredTags = availableTags.filter(
    (tag) =>
      tag.name.toLowerCase().includes(inputValue.toLowerCase()) &&
      !selectedTags.some((selected) => selected.id === tag.id)
  );

  const handleAddTag = (tag: Tag) => {
    onChange([...selectedTags, tag]);
  };

  const handleRemoveTag = (tagId: string) => {
    onChange(selectedTags.filter((tag) => tag.id !== tagId));
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedTags.map((tag) => (
          <Badge
            key={tag.id}
            variant="secondary"
            className="flex items-center gap-1"
          >
            {tag.name}
            <button
              type="button"
              onClick={() => handleRemoveTag(tag.id)}
              className="text-muted-foreground hover:text-foreground"
              aria-label={`Remove ${tag.name} tag`}
            >
              <X size={14} />
            </button>
          </Badge>
        ))}
        {selectedTags.length === 0 && (
          <span className="text-sm text-muted-foreground">
            No tags selected
          </span>
        )}
      </div>

      <div className="relative">
        <input
          type="text"
          placeholder="Search tags..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />

        {inputValue && filteredTags.length > 0 && (
          <div className="absolute z-10 mt-1 w-full max-h-48 overflow-auto rounded-md border border-border bg-background py-1 shadow-lg">
            {filteredTags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => {
                  handleAddTag(tag);
                  setInputValue("");
                }}
                className="w-full text-left px-3 py-2 hover:bg-secondary flex items-center justify-between"
              >
                {tag.name}
              </button>
            ))}
          </div>
        )}

        {inputValue && filteredTags.length === 0 && !isLoading && (
          <div className="absolute z-10 mt-1 w-full rounded-md border border-border bg-background py-1 shadow-lg">
            <p className="px-3 py-2 text-sm text-muted-foreground">
              No matching tags found
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
