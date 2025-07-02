"use client";

import { useState } from "react";
import {
  FacebookIcon,
  TwitterIcon,
  LinkedinIcon,
  MailIcon,
  LinkIcon,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface SocialShareProps {
  title: string;
  url: string;
}

export function SocialShare({ title, url }: SocialShareProps) {
  const [showDropdown, setShowDropdown] = useState(false);

  const encodedTitle = encodeURIComponent(title);
  const encodedUrl = encodeURIComponent(url);

  const sharePlatforms = [
    {
      name: "Facebook",
      icon: <FacebookIcon className="h-4 w-4 mr-2" />,
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      name: "Twitter",
      icon: <TwitterIcon className="h-4 w-4 mr-2" />,
      url: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    },
    {
      name: "LinkedIn",
      icon: <LinkedinIcon className="h-4 w-4 mr-2" />,
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    },
    {
      name: "Email",
      icon: <MailIcon className="h-4 w-4 mr-2" />,
      url: `mailto:?subject=${encodedTitle}&body=${encodedUrl}`,
    },
  ];

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy link");
      console.error("Failed to copy link:", error);
    }
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-1"
      >
        <Share2 className="w-4 h-4 mr-1" />
        Share
      </Button>

      {showDropdown && (
        <div
          className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-card border border-border z-50"
          onMouseLeave={() => setShowDropdown(false)}
        >
          <div className="py-1">
            {sharePlatforms.map((platform) => (
              <a
                key={platform.name}
                href={platform.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center px-4 py-2 text-sm hover:bg-secondary cursor-pointer"
              >
                {platform.icon}
                {platform.name}
              </a>
            ))}

            <button
              className="w-full flex items-center px-4 py-2 text-sm hover:bg-secondary cursor-pointer"
              onClick={copyToClipboard}
            >
              <LinkIcon className="h-4 w-4 mr-2" />
              Copy Link
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
