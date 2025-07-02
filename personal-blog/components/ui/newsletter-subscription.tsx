"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export function NewsletterSubscription() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Here you would integrate with a newsletter service like Mailchimp, ConvertKit, etc.
      // For now, we'll just simulate a successful subscription
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success(
        "Thanks for subscribing! We'll keep you updated on our latest posts."
      );
      setEmail("");
    } catch (error) {
      toast.error("Failed to subscribe. Please try again later.");
      console.error("Error subscribing:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col sm:flex-row gap-3 sm:gap-0"
    >
      <Input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full sm:rounded-r-none"
        disabled={isSubmitting}
        required
      />
      <Button
        type="submit"
        className="sm:rounded-l-none"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Subscribing..." : "Subscribe"}
      </Button>
    </form>
  );
}
