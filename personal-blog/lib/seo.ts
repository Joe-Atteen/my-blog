import { Metadata } from "next";

interface SEOProps {
  title: string;
  description: string;
  ogImage?: string;
  url?: string;
  author?: string;
  publishedTime?: string;
  type?: "website" | "article" | "profile";
  noIndex?: boolean;
}

export function generateSEO({
  title,
  description,
  ogImage,
  url,
  author = "Blog Author",
  publishedTime,
  type = "article",
  noIndex = false,
}: SEOProps): Metadata {
  const siteName = "My Blog";
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://atteen-blog.vercel.app/";

  // Use the provided URL or construct it
  const canonicalUrl = url ? url : `${siteUrl}${url}`;

  // Use the provided OG image or default
  const openGraphImage = ogImage || `${siteUrl}/og-image.jpg`;

  return {
    title,
    description,
    authors: [{ name: author }],
    metadataBase: new URL(siteUrl),
    ...(noIndex && {
      robots: {
        index: false,
        follow: false,
      },
    }),
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName,
      images: [
        {
          url: openGraphImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: "en_US",
      type,
      ...(publishedTime &&
        type === "article" && {
          publishedTime,
        }),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [openGraphImage],
      creator: "@yourusername",
    },
  };
}
