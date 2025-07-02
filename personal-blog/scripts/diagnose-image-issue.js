// Diagnose Image Issue Script
// This script diagnoses issues with Supabase Storage images not displaying

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// Check for required environment variables
if (
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
) {
  console.error("❌ Missing required environment variables!");
  console.error(
    "Please make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in your .env file"
  );
  process.exit(1);
}

// Create a Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// If service role key is available, create admin client too
const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminClient = hasServiceKey
  ? createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null;

// Get bucket name from env var or use default
const BUCKET_NAME = process.env.NEXT_PUBLIC_STORAGE_BUCKET || "blog-images";

// Test image paths to check
const TEST_PATHS = ["blog/test-image.png", "post-images/test-image.png"];

// Format URLs for console output
const formatUrl = (url) => {
  if (process.stdout.isTTY) {
    return `\x1b[34m${url}\x1b[0m`;
  }
  return url;
};

async function run() {
  console.log("🔍 Diagnosing Image Display Issues");
  console.log("---------------------------------------");

  // Step 1: Check if bucket exists
  console.log("📦 Step 1: Checking if bucket exists...");
  try {
    const { data, error } = await supabase.storage.getBucket(BUCKET_NAME);

    if (error) {
      console.error(`❌ Bucket not found: ${error.message}`);

      // Try creating bucket if we have admin access
      if (adminClient) {
        console.log("🛠️ Attempting to create bucket with admin access...");
        const { error: createError } = await adminClient.storage.createBucket(
          BUCKET_NAME,
          {
            public: true,
            allowedMimeTypes: ["image/*"],
          }
        );

        if (createError) {
          console.error(`❌ Failed to create bucket: ${createError.message}`);
        } else {
          console.log("✅ Bucket created successfully!");
        }
      } else {
        console.log(
          "⚠️ No admin access to create bucket. Please create bucket manually in Supabase dashboard."
        );
      }
    } else {
      console.log(`✅ Bucket "${BUCKET_NAME}" exists`);
      console.log(`📊 Bucket info: ${JSON.stringify(data, null, 2)}`);

      // Check if bucket is public
      if (data?.public) {
        console.log("✅ Bucket is configured as public");
      } else {
        console.error(
          "❌ Bucket is NOT public. This will prevent images from displaying."
        );

        // Try to update bucket if we have admin access
        if (adminClient) {
          console.log("🛠️ Attempting to update bucket to public...");
          const { error: updateError } = await adminClient.storage.updateBucket(
            BUCKET_NAME,
            {
              public: true,
            }
          );

          if (updateError) {
            console.error(`❌ Failed to update bucket: ${updateError.message}`);
          } else {
            console.log("✅ Bucket updated to public successfully!");
          }
        } else {
          console.log(
            "⚠️ No admin access to update bucket. Please update bucket to public in Supabase dashboard."
          );
        }
      }
    }
  } catch (e) {
    console.error(`❌ Error checking bucket: ${e.message}`);
  }

  // Step 2: Check CORS configuration
  console.log("\n🌐 Step 2: Checking CORS configuration...");
  try {
    const corsResponse = await fetch(`${supabaseUrl}/storage/v1/cors`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${
          hasServiceKey
            ? process.env.SUPABASE_SERVICE_ROLE_KEY
            : supabaseAnonKey
        }`,
      },
    });

    if (corsResponse.ok) {
      const corsData = await corsResponse.json();
      console.log("✅ CORS configuration retrieved");
      console.log(JSON.stringify(corsData, null, 2));

      // Check if CORS is configured correctly
      const hasCorsForImages = corsData.some(
        (rule) =>
          rule.allowed_origins.includes("*") ||
          (rule.allowed_origins.includes(process.env.NEXT_PUBLIC_SITE_URL) &&
            rule.allowed_methods.includes("GET") &&
            rule.max_age_seconds > 0)
      );

      if (!hasCorsForImages) {
        console.log("⚠️ CORS may not be configured correctly for images.");

        // Try to fix CORS if we have admin access
        if (adminClient) {
          console.log("🛠️ Setting up proper CORS configuration...");

          const corsRules = [
            {
              allowed_origins: ["*"],
              allowed_methods: ["GET"],
              allowed_headers: ["*"],
              max_age_seconds: 3600,
            },
          ];

          try {
            await fetch(`${supabaseUrl}/storage/v1/cors`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify(corsRules),
            });
            console.log("✅ CORS configuration updated");
          } catch (e) {
            console.error(`❌ Failed to update CORS: ${e.message}`);
          }
        }
      } else {
        console.log("✅ CORS appears to be configured correctly");
      }
    } else {
      console.error(
        `❌ Failed to get CORS configuration: ${corsResponse.statusText}`
      );
    }
  } catch (e) {
    console.error(`❌ Error checking CORS: ${e.message}`);
  }

  // Step 3: Check Image URLs
  console.log("\n🖼️ Step 3: Checking specific image URLs...");

  for (const testPath of TEST_PATHS) {
    console.log(`\nTesting path: ${testPath}`);

    // Get public URL
    try {
      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(testPath);
      console.log(`Public URL: ${formatUrl(urlData.publicUrl)}`);

      // Check if image file exists
      const { data: fileData, error: fileError } = await supabase.storage
        .from(BUCKET_NAME)
        .list(testPath.split("/").slice(0, -1).join("/") || "", {
          search: testPath.split("/").pop(),
        });

      if (fileError) {
        console.error(`❌ Error checking if file exists: ${fileError.message}`);
      } else if (!fileData || fileData.length === 0) {
        console.log(`⚠️ File ${testPath} doesn't exist in the bucket`);

        // Try to upload a test image if admin client is available
        if (adminClient) {
          try {
            // Create a simple 1x1 transparent PNG
            const base64Image =
              "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z/C/HgAGgwJ/lK3Q6wAAAABJRU5ErkJggg==";
            const buffer = Buffer.from(base64Image, "base64");

            console.log(`🛠️ Attempting to upload test image to ${testPath}...`);
            const { error: uploadError } = await adminClient.storage
              .from(BUCKET_NAME)
              .upload(testPath, buffer, {
                contentType: "image/png",
                upsert: true,
              });

            if (uploadError) {
              console.error(
                `❌ Failed to upload test image: ${uploadError.message}`
              );
            } else {
              console.log("✅ Test image uploaded successfully!");

              // Get the URL again after upload
              const { data: newUrlData } = supabase.storage
                .from(BUCKET_NAME)
                .getPublicUrl(testPath);
              console.log(`New public URL: ${formatUrl(newUrlData.publicUrl)}`);
            }
          } catch (e) {
            console.error(`❌ Error uploading test image: ${e.message}`);
          }
        }
      } else {
        console.log(`✅ File ${testPath} exists in the bucket`);

        // Check file metadata
        const { data: metadata, error: metadataError } = await supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(testPath);

        if (metadataError) {
          console.error(
            `❌ Error getting file metadata: ${metadataError.message}`
          );
        } else {
          console.log(
            `✅ Public URL generated: ${formatUrl(metadata.publicUrl)}`
          );

          // Test URL accessibility
          try {
            const response = await fetch(metadata.publicUrl, {
              method: "HEAD",
              // No-cors mode won't tell us if there are CORS issues
              // but will tell us if the resource exists
              mode: "no-cors",
            });

            if (response.ok) {
              console.log("✅ URL is accessible");
            } else {
              console.error(
                `❌ URL returned status: ${response.status} ${response.statusText}`
              );
            }
          } catch (e) {
            console.error(`❌ Error testing URL accessibility: ${e.message}`);
          }
        }
      }
    } catch (e) {
      console.error(`❌ Error getting public URL: ${e.message}`);
    }
  }

  // Step 4: Check Next.js image configuration
  console.log("\n🔧 Step 4: Checking Next.js image configuration...");
  try {
    const nextConfigPath = path.resolve("./next.config.js");
    if (fs.existsSync(nextConfigPath)) {
      const configContent = fs.readFileSync(nextConfigPath, "utf8");
      console.log("Next.js configuration found");

      // Check if config has proper image domains
      if (
        configContent.includes("remotePatterns") &&
        configContent.includes("supabase.co") &&
        configContent.includes("/storage/")
      ) {
        console.log(
          "✅ Next.js config appears to have Supabase image configuration"
        );
      } else if (
        configContent.includes("domains") &&
        configContent.includes("supabase.co")
      ) {
        console.log("✅ Next.js config has Supabase domain in images.domains");
      } else {
        console.log(
          "⚠️ Next.js config might not be properly configured for Supabase images"
        );
        console.log(
          "Check if your next.config.js includes proper remotePatterns or domains for Supabase"
        );
      }
    } else {
      console.log("⚠️ Next.js config file not found");
    }
  } catch (e) {
    console.error(`❌ Error checking Next.js config: ${e.message}`);
  }

  // Step 5: Provide recommendations
  console.log("\n📋 Summary and Recommendations:");
  console.log("1. Check that the bucket exists and is set to public");
  console.log(
    "2. Verify CORS is configured correctly to allow requests from your site"
  );
  console.log("3. Make sure image files actually exist in the bucket");
  console.log(
    "4. Confirm Next.js is configured to allow Supabase image domains"
  );
  console.log(
    "5. Verify the image URLs you're using in your application match one of these patterns:"
  );
  console.log('   - Storage path format: "blog/image.png"');
  console.log("   - Full public URL from Supabase");
  console.log(
    "\nTry accessing a public URL directly in your browser to see if it works:"
  );
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl("blog/test-image.png");
  console.log(formatUrl(urlData.publicUrl));

  console.log("\n---------------------------------------");
  console.log("✨ Diagnosis complete");
}

run().catch((error) => {
  console.error("❌ Unexpected error:", error);
  process.exit(1);
});
