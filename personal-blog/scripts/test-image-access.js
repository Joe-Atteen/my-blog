#!/usr/bin/env node

// Script to test Supabase image access
// Usage: node test-image-access.js [image-path]
// Example: node test-image-access.js blog/fafa49b5-d6bc-4d08-87fe-3db939da871b.png

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

// Load environment variables from .env.local
try {
  config({ path: new URL("../.env.local", import.meta.url).pathname });
} catch (e) {
  console.error("Error loading .env.local file:", e.message);
}

// Check environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const ADMIN_SECRET = process.env.ADMIN_SECRET;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    "\x1b[31mError: Missing Supabase credentials in .env.local file\x1b[0m"
  );
  process.exit(1);
}

// Get the bucket name from environment variables or fallback to default
const BUCKET_NAME = process.env.NEXT_PUBLIC_STORAGE_BUCKET || "blog-images";

async function main() {
  // Get image path from command line args or use default
  const imagePath = process.argv[2] || "blog/test-image.png";

  console.log("\x1b[36m%s\x1b[0m", "🔍 Testing Supabase Storage Access");
  console.log("---------------------------------------");

  try {
    // Create anonymous client (what the front-end uses)
    const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Create service role client if admin secret is available
    let serviceClient = null;
    if (ADMIN_SECRET) {
      serviceClient = createClient(SUPABASE_URL, ADMIN_SECRET, {
        auth: { persistSession: false },
      });
    }

    // Test 1: Check if bucket exists
    console.log("\x1b[33m%s\x1b[0m", "📦 Testing bucket existence...");
    try {
      const { data: buckets, error: bucketError } =
        await anonClient.storage.listBuckets();
      if (bucketError) throw bucketError;

      const hasBucket = buckets.some((bucket) => bucket.name === BUCKET_NAME);
      if (hasBucket) {
        console.log("\x1b[32m✓ Bucket exists\x1b[0m");
      } else {
        console.log("\x1b[31m✗ Bucket not found\x1b[0m");
        if (serviceClient) {
          console.log("Attempting to create bucket with service role...");
          await serviceClient.storage.createBucket(BUCKET_NAME, {
            public: true,
            fileSizeLimit: 1024 * 1024 * 10, // 10MB
          });
          console.log("\x1b[32m✓ Bucket created\x1b[0m");
        }
      }
    } catch (error) {
      console.error(
        "\x1b[31m✗ Failed to check buckets:",
        error.message,
        "\x1b[0m"
      );
    }

    // Test 2: Check bucket permissions
    console.log("\n\x1b[33m%s\x1b[0m", "🔒 Testing bucket permissions...");
    try {
      const { data: permissions, error: permissionError } =
        await anonClient.storage.getBucket(BUCKET_NAME);
      if (permissionError) throw permissionError;

      console.log("Bucket settings:", {
        public: permissions.public ? "✓ Public" : "✗ Private",
        allowedMimeTypes: permissions.allowedMimeTypes || "All",
      });

      if (!permissions.public) {
        console.log(
          "\x1b[33m⚠️ Bucket is not public, images might not be accessible\x1b[0m"
        );
        if (serviceClient) {
          console.log("Attempting to set bucket to public...");
          await serviceClient.storage.updateBucket(BUCKET_NAME, {
            public: true,
          });
          console.log("\x1b[32m✓ Bucket set to public\x1b[0m");
        }
      }
    } catch (error) {
      console.error(
        "\x1b[31m✗ Failed to check permissions:",
        error.message,
        "\x1b[0m"
      );
    }

    // Test 3: Try to list bucket contents
    console.log("\n\x1b[33m%s\x1b[0m", "📁 Listing files in bucket...");
    try {
      const { data: files, error: listError } = await anonClient.storage
        .from(BUCKET_NAME)
        .list();
      if (listError) throw listError;

      console.log(`Found ${files.length} files/folders at root level`);
      if (files.length > 0) {
        console.log("First few items:");
        files.slice(0, 5).forEach((file) => {
          console.log(`- ${file.name} ${file.id ? "(file)" : "(folder)"}`);
        });
      }
    } catch (error) {
      console.error(
        "\x1b[31m✗ Failed to list files:",
        error.message,
        "\x1b[0m"
      );
    }

    // Test 4: Check specific image path
    console.log(
      "\n\x1b[33m%s\x1b[0m",
      `🖼️ Testing specific image path: ${imagePath}`
    );
    try {
      // Try to get a signed URL first
      const { data: signedData, error: signedError } = await anonClient.storage
        .from(BUCKET_NAME)
        .createSignedUrl(imagePath, 60);

      if (signedError) {
        console.log(
          "\x1b[33m⚠️ Could not create signed URL, checking if file exists...\x1b[0m"
        );

        // Check if the file exists by trying to get metadata
        const { data: metadata, error: metadataError } =
          await anonClient.storage.from(BUCKET_NAME).getPublicUrl(imagePath);

        if (metadataError) {
          console.error(
            "\x1b[31m✗ File does not exist or is not accessible\x1b[0m"
          );
        } else {
          console.log(
            "\x1b[32m✓ File exists, public URL:",
            metadata.publicUrl,
            "\x1b[0m"
          );
          console.log(
            "\nTry fetching the URL directly in browser to verify access."
          );
        }
      } else {
        console.log(
          "\x1b[32m✓ File exists, signed URL:",
          signedData.signedUrl,
          "\x1b[0m"
        );
        console.log("\nThis signed URL will work for 60 seconds.");
      }
    } catch (error) {
      console.error(
        "\x1b[31m✗ Error checking image:",
        error.message,
        "\x1b[0m"
      );
    }

    // Test 5: Check CORS settings
    console.log("\n\x1b[33m%s\x1b[0m", "🌐 Testing CORS configuration...");
    if (serviceClient) {
      try {
        // Get current CORS settings
        const { data: corsData, error: corsError } =
          await serviceClient.storage.getBucketCorsRules(BUCKET_NAME);

        if (corsError) throw corsError;

        if (!corsData || corsData.length === 0) {
          console.log(
            "\x1b[33m⚠️ No CORS rules defined, adding permissive rule for development\x1b[0m"
          );

          // Add a permissive CORS rule
          await serviceClient.storage.updateBucketCorsRules(BUCKET_NAME, [
            {
              allowedOrigins: ["*"],
              allowedMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
              allowedHeaders: ["*"],
              maxAgeSeconds: 3600,
            },
          ]);
          console.log("\x1b[32m✓ Added permissive CORS rule\x1b[0m");
        } else {
          console.log(`Found ${corsData.length} CORS rules:`);
          console.log(JSON.stringify(corsData, null, 2));

          // Check if there's already a rule that allows all origins
          const hasPermissiveRule = corsData.some(
            (rule) =>
              rule.allowedOrigins.includes("*") &&
              rule.allowedMethods.includes("GET")
          );

          if (!hasPermissiveRule) {
            console.log(
              "\x1b[33m⚠️ No permissive CORS rule found for GET requests\x1b[0m"
            );
          } else {
            console.log("\x1b[32m✓ Permissive CORS rule exists\x1b[0m");
          }
        }
      } catch (error) {
        console.error(
          "\x1b[31m✗ Failed to check CORS settings:",
          error.message,
          "\x1b[0m"
        );
      }
    } else {
      console.log(
        "\x1b[33m⚠️ Admin secret not provided, skipping CORS check\x1b[0m"
      );
    }

    console.log("\n---------------------------------------");
    console.log("\x1b[36m%s\x1b[0m", "✨ Storage test complete");
  } catch (error) {
    console.error("\x1b[31mUnexpected error:", error, "\x1b[0m");
    process.exit(1);
  }
}

main();
