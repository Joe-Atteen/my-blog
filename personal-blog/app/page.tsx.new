import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { NewsletterSubscription } from "@/components/ui/newsletter-subscription";
import { HomePosts } from "@/components/ui/home-posts";

export const metadata: Metadata = {
  title: "My Blog | Personal Thoughts & Ideas",
  description:
    "A modern blog showcasing my thoughts on technology, design, and productivity",
};

export default function Home() {
  return (
    <>
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-background to-secondary/10 py-16 md:py-24">
        <div className="absolute inset-0 z-0 opacity-20">
          <svg className="h-full w-full" viewBox="0 0 800 800">
            <defs>
              <pattern
                id="pattern"
                patternUnits="userSpaceOnUse"
                width="60"
                height="60"
                patternTransform="scale(2) rotate(0)"
              >
                <path d="M0 0h60v60H0z" fill="none" />
                <path
                  d="M20 15a5 5 0 110 10 5 5 0 010-10zm20 20a5 5 0 110 10 5 5 0 010-10z"
                  fill="currentColor"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#pattern)" />
          </svg>
        </div>

        <div className="container relative z-10 mx-auto max-w-7xl px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="animate-fade-in-up bg-gradient-to-r from-primary via-accent-foreground to-primary bg-clip-text text-5xl font-extrabold leading-tight tracking-tighter text-transparent sm:text-6xl">
              Welcome to My Blog
            </h1>
            <p className="animate-fade-in-up animation-delay-200 mt-6 text-xl text-muted-foreground">
              A personal corner of the web where I share my thoughts, ideas, and
              discoveries.
            </p>
            <div className="animate-fade-in-up animation-delay-300 mt-10 flex flex-wrap justify-center gap-4">
              <Button asChild>
                <Link href="/posts">Explore Posts</Link>
              </Button>
              <Button variant="outline" asChild>
                <a href="#newsletter">Subscribe</a>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Posts Section - Using client component for real-time updates */}
      <HomePosts />

      {/* Featured Categories Section */}
      <div className="container mx-auto max-w-7xl px-4 py-16 md:py-24">
        <h2 className="mb-10 text-center text-3xl font-bold tracking-tight">
          Featured Topics
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {["Technology", "Design", "Productivity"].map((category) => (
            <div
              key={category}
              className="group rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="m15 9-6 6" />
                  <path d="m9 9 6 6" />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-semibold">{category}</h3>
              <p className="text-muted-foreground">
                Explore articles about {category.toLowerCase()} and related
                topics.
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Coming Soon / Newsletter Section */}
      <div id="newsletter" className="bg-secondary/20 py-16 scroll-mt-16">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="mx-auto max-w-2xl rounded-xl border bg-card p-8 shadow-lg">
            <div className="text-center">
              <h2 className="text-2xl font-semibold">
                New Content Coming Soon
              </h2>
              <p className="mt-4 text-muted-foreground">
                I&apos;m working on exciting new content. Subscribe to get
                notified when it&apos;s ready.
              </p>
              <div className="mt-6">
                <NewsletterSubscription />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
