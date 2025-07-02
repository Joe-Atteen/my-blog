#!/usr/bin/env node

// Script to set up optimal storage cache settings
// Usage: node setup-storage-cache.js

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import readline from "readline";

// Load environment variables from .env.local
try {
  config({ path: new URL("../.env.local", import.meta.url).pathname });
} catch (e) {
  console.error("Error loading .env.local file:", e.message);
}

// Check for admin secret
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ADMIN_SECRET = process.env.ADMIN_SECRET;

if (!SUPABASE_URL || !ADMIN_SECRET) {
  console.error(
    "\x1b[31mError: Missing Supabase URL or admin secret in .env.local file\x1b[0m"
  );
  console.log(
    "To use this script, add ADMIN_SECRET=your_service_role_key to your .env.local file"
  );
  process.exit(1);
}

// Get the bucket name from environment variables or fallback to default
const BUCKET_NAME = process.env.NEXT_PUBLIC_STORAGE_BUCKET || "blog-images";

// Create interactive readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Create service role client
const serviceClient = createClient(SUPABASE_URL, ADMIN_SECRET, {
  auth: { persistSession: false },
});

async function main() {
  console.log(
    "\x1b[36m%s\x1b[0m",
    "🔧 Setting up Supabase Storage Cache Settings"
  );
  console.log("---------------------------------------");

  try {
    // Check if bucket exists
    console.log("\x1b[33m%s\x1b[0m", "📦 Checking bucket...");
    const { data: buckets, error: bucketError } =
      await serviceClient.storage.listBuckets();
    if (bucketError) throw bucketError;

    const bucket = buckets.find((b) => b.name === BUCKET_NAME);
    if (!bucket) {
      console.log(`\x1b[31m✗ Bucket ${BUCKET_NAME} not found\x1b[0m`);
      return;
    }

    console.log(`\x1b[32m✓ Bucket ${BUCKET_NAME} found\x1b[0m`);

    // Ask for confirmation
    rl.question(
      "\n\x1b[33mDo you want to update cache settings for this bucket? [y/N]: \x1b[0m",
      async (answer) => {
        if (answer.toLowerCase() !== "y") {
          console.log("Operation cancelled.");
          rl.close();
          return;
        }

        try {
          console.log("\x1b[33m%s\x1b[0m", "\n⚙️ Updating bucket settings...");

          // Update bucket with cache settings
          await serviceClient.storage.updateBucket(BUCKET_NAME, {
            public: true, // Ensure bucket is public
            fileSizeLimit: 10485760, // 10MB limit
            allowedMimeTypes: [
              "image/jpeg",
              "image/png",
              "image/gif",
              "image/webp",
              "image/svg+xml",
            ],
            // Cache control headers - 1 week for public images
            defaultCacheControl: "public, max-age=604800, immutable",
          });

          console.log("\x1b[32m✓ Bucket cache settings updated\x1b[0m");
          console.log("\n\x1b[32mNew cache settings:\x1b[0m");
          console.log("- Public access: enabled");
          console.log("- File size limit: 10MB");
          console.log("- Allowed types: jpeg, png, gif, webp, svg");
          console.log(
            "- Cache control: public, max-age=604800 (1 week), immutable"
          );

          console.log(
            "\n\x1b[33mNote: These settings apply to newly uploaded files.\x1b[0m"
          );
          console.log(
            "To update existing files, you would need to re-upload them or use the Supabase admin dashboard."
          );
        } catch (error) {
          console.error(
            "\x1b[31mError updating bucket settings:\x1b[0m",
            error.message
          );
        } finally {
          rl.close();
        }
      }
    );
  } catch (error) {
    console.error("\x1b[31mUnexpected error:\x1b[0m", error.message);
    rl.close();
  }
}

main();

// Handle readline close
rl.on("close", () => {
  console.log("\n---------------------------------------");
  console.log("\x1b[36m%s\x1b[0m", "✨ Storage setup complete");
});
