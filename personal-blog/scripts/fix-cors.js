#!/usr/bin/env node

// Script to verify and fix CORS configuration for Supabase storage
// Usage: node fix-cors.js

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

// Get site URL for CORS configuration
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://atteen-blog.vercel.app/";
const BUCKET_NAME = process.env.NEXT_PUBLIC_STORAGE_BUCKET || "blog-images";

// Create interactive readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Create service role client
const supabase = createClient(SUPABASE_URL, ADMIN_SECRET, {
  auth: { persistSession: false },
});

async function main() {
  console.log("\x1b[36m%s\x1b[0m", "🔧 CORS Configuration Helper");
  console.log("---------------------------------------");

  try {
    // Get current CORS rules
    console.log(
      "\x1b[33m%s\x1b[0m",
      "📊 Fetching current CORS configuration..."
    );

    // Check bucket exists first
    const { data: buckets, error: bucketError } =
      await supabase.storage.listBuckets();
    if (bucketError) throw bucketError;

    const bucket = buckets.find((b) => b.name === BUCKET_NAME);
    if (!bucket) {
      console.log(`\x1b[31m✗ Bucket ${BUCKET_NAME} not found\x1b[0m`);

      const createBucket = await askQuestion("Create bucket now? [y/N]: ");
      if (createBucket.toLowerCase() === "y") {
        await supabase.storage.createBucket(BUCKET_NAME, {
          public: true,
          fileSizeLimit: 10485760, // 10MB
        });
        console.log(`\x1b[32m✓ Bucket ${BUCKET_NAME} created\x1b[0m`);
      } else {
        console.log("Exiting without creating bucket");
        return;
      }
    }

    try {
      const { data: corsRules } = await supabase.storage.getBucket(BUCKET_NAME);

      console.log("\nCurrent bucket settings:");
      console.log(
        `- Public: ${
          corsRules.public ? "\x1b[32mYes\x1b[0m" : "\x1b[31mNo\x1b[0m"
        }`
      );
      console.log(
        `- File size limit: ${formatFileSize(corsRules.fileSizeLimit)}`
      );

      // Get CORS rules if function exists
      let corsData = [];
      try {
        const { data } = await supabase.storage.getBucketCorsRules(BUCKET_NAME);
        corsData = data || [];
      } catch (corsError) {
        console.log(
          "\x1b[33m⚠️ Could not get CORS rules - older Supabase version\x1b[0m"
        );
        console.log("Will proceed with updating bucket settings only.");
      }

      if (corsData && corsData.length > 0) {
        console.log("\nCurrent CORS Rules:");
        console.log(JSON.stringify(corsData, null, 2));
      } else {
        console.log("\n\x1b[33m⚠️ No CORS rules configured\x1b[0m");
      }

      // Configuration options
      console.log("\n\x1b[36m%s\x1b[0m", "🔧 CORS Configuration Options:");
      console.log("1. Open Access (allow all origins) - good for development");
      console.log("2. Production Setup (specific origins) - more secure");
      console.log("3. Skip CORS changes");

      const option = await askQuestion("\nSelect option [1-3]: ");

      if (option === "3") {
        console.log("Skipping CORS changes");
      } else {
        // Update bucket to be public if it isn't already
        if (!corsRules.public) {
          console.log("\n\x1b[33m%s\x1b[0m", "🔒 Setting bucket to public...");
          await supabase.storage.updateBucket(BUCKET_NAME, {
            public: true,
          });
          console.log("\x1b[32m✓ Bucket set to public\x1b[0m");
        }

        // Prepare CORS rules based on option
        const corsRules = [];

        if (option === "1") {
          // Open access
          corsRules.push({
            allowedOrigins: ["*"],
            allowedMethods: ["GET", "OPTIONS"],
            allowedHeaders: ["*"],
            maxAgeSeconds: 3600,
            exposedHeaders: ["Content-Type", "Content-Length", "Content-Range"],
          });

          console.log("\n\x1b[33m%s\x1b[0m", "🌐 Setting open CORS access...");
        } else if (option === "2") {
          // Production setup
          const origins = [SITE_URL];

          // Ask for any additional domains
          console.log("\nEnter additional domains (leave blank to finish):");
          let addingDomains = true;
          let domainCounter = 1;

          while (addingDomains) {
            const domain = await askQuestion(
              `Domain ${domainCounter} (blank to stop): `
            );
            if (!domain) {
              addingDomains = false;
            } else {
              origins.push(domain);
              domainCounter++;
            }
          }

          corsRules.push({
            allowedOrigins: origins,
            allowedMethods: ["GET", "OPTIONS"],
            allowedHeaders: ["*"],
            maxAgeSeconds: 3600,
            exposedHeaders: ["Content-Type", "Content-Length", "Content-Range"],
          });

          console.log(
            `\n\x1b[33m%s\x1b[0m`,
            "🌐 Setting production CORS rules..."
          );
          console.log("Allowed origins:");
          origins.forEach((origin) => console.log(`- ${origin}`));
        }

        // Try to update CORS rules if we have any and the function exists
        if (corsRules.length > 0) {
          try {
            await supabase.storage.updateBucketCorsRules(
              BUCKET_NAME,
              corsRules
            );
            console.log("\x1b[32m✓ CORS rules updated\x1b[0m");
          } catch (corsError) {
            console.log(
              "\x1b[33m⚠️ Could not update CORS rules - older Supabase version\x1b[0m"
            );
            console.log("Please update CORS rules in the Supabase dashboard.");
          }
        }
      }

      // Check and update cache settings
      console.log("\n\x1b[33m%s\x1b[0m", "📦 Checking cache settings...");
      if (corsRules.defaultCacheControl) {
        console.log(`Current cache control: ${corsRules.defaultCacheControl}`);
      } else {
        console.log("\x1b[33m⚠️ No default cache control set\x1b[0m");
      }

      const updateCache = await askQuestion("Update cache settings? [y/N]: ");
      if (updateCache.toLowerCase() === "y") {
        await supabase.storage.updateBucket(BUCKET_NAME, {
          defaultCacheControl: "public, max-age=604800, immutable",
        });
        console.log("\x1b[32m✓ Cache settings updated to 1 week\x1b[0m");
      }

      console.log("\n\x1b[32m✓ Configuration complete\x1b[0m");
      console.log("\nReminder: Changes may take a few minutes to propagate.");
      console.log("Test your images with the 'test-image-access.js' script.");
    } catch (error) {
      console.error(
        "\x1b[31mError getting bucket information:\x1b[0m",
        error.message
      );
    }
  } catch (error) {
    console.error("\x1b[31mUnexpected error:\x1b[0m", error.message);
  } finally {
    rl.close();
  }
}

// Helper function to ask questions
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Format file size helper
function formatFileSize(bytes) {
  if (bytes === null || bytes === undefined) return "Unknown";
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// Run the main function
main();

// Handle readline close
rl.on("close", () => {
  console.log("\n---------------------------------------");
  console.log("\x1b[36m%s\x1b[0m", "🚀 Setup complete");
});
