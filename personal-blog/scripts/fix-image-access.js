#!/usr/bin/env node

// Script to fix image access issues for Supabase storage
// Usage: node fix-image-access.js

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

// Load environment variables
dotenv.config({ path: ".env.local" });
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.ADMIN_SECRET;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const BUCKET_NAME = process.env.NEXT_PUBLIC_STORAGE_BUCKET || "blog-images";

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing required environment variables!");
  console.error(
    "Please make sure NEXT_PUBLIC_SUPABASE_URL and either SUPABASE_SERVICE_ROLE_KEY or ADMIN_SECRET are set in your .env.local file"
  );
  process.exit(1);
}

// Create admin client with service role
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Create public client with anon key for testing
const supabasePublic = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log("\n🔧 Image Access Troubleshooting Tool");
  console.log("---------------------------------------");

  try {
    // 1. Check bucket existence and configuration
    console.log("1️⃣ Checking bucket existence and settings...");

    // List all buckets
    const { data: buckets, error: bucketsError } =
      await supabaseAdmin.storage.listBuckets();

    if (bucketsError) {
      console.error("Error listing buckets:", bucketsError.message);
      process.exit(1);
    }

    // Find our bucket
    const bucket = buckets.find((b) => b.name === BUCKET_NAME);

    if (!bucket) {
      console.log(`⚠️ Bucket ${BUCKET_NAME} not found. Creating it...`);

      // Create the bucket with public access
      const { error: createError } = await supabaseAdmin.storage.createBucket(
        BUCKET_NAME,
        {
          public: true,
          fileSizeLimit: 10485760, // 10MB
        }
      );

      if (createError) {
        console.error("Error creating bucket:", createError.message);
      } else {
        console.log(
          `✅ Bucket ${BUCKET_NAME} created successfully with public access`
        );
      }
    } else {
      console.log(`✅ Bucket ${BUCKET_NAME} exists`);

      // Check public setting
      try {
        // Update bucket to ensure it's public
        const { error: updateError } = await supabaseAdmin.storage.updateBucket(
          BUCKET_NAME,
          {
            public: true,
          }
        );

        if (updateError) {
          console.error("Error updating bucket:", updateError.message);
        } else {
          console.log(`✅ Bucket ${BUCKET_NAME} set to public`);
        }
      } catch (err) {
        console.log("⚠️ Could not update bucket settings:", err.message);
      }
    }

    // 2. Check CORS configuration
    console.log("\n2️⃣ Setting up CORS configuration...");

    const corsRules = [
      {
        // Allow requests from all origins
        origin: "*",
        methods: ["GET", "HEAD", "PUT", "POST", "DELETE"],
        allowedHeaders: ["*"],
        exposedHeaders: ["Content-Range", "Content-Length", "Content-Type"],
      },
    ];

    // Handle storage.uploadToStorage approach
    try {
      console.log("Trying to update CORS rules...");

      // Use updateBucket method to set CORS rules
      const { error: corsError } = await supabaseAdmin.storage.updateBucket(
        BUCKET_NAME,
        {
          public: true,
          allowedMimeTypes: [
            "image/png",
            "image/jpeg",
            "image/gif",
            "image/webp",
            "image/svg+xml",
          ],
          corsRules: corsRules,
        }
      );

      if (corsError) {
        console.error("Error updating CORS settings:", corsError.message);
      } else {
        console.log("✅ CORS rules updated successfully");
      }
    } catch (err) {
      console.log("⚠️ Error updating CORS configuration:", err.message);
      console.log("Trying alternative approach...");

      // Direct API request as fallback if SDK doesn't support CORS updates
      try {
        // This is a backup approach that might work with some Supabase versions
        const response = await fetch(
          `${supabaseUrl}/storage/buckets/${BUCKET_NAME}/cors`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${supabaseServiceKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(corsRules),
          }
        );

        if (response.ok) {
          console.log("✅ CORS rules updated via API");
        } else {
          console.error(`⚠️ Failed to update CORS via API: ${response.status}`);
        }
      } catch (apiErr) {
        console.error("⚠️ API request failed:", apiErr.message);
      }
    }

    // 3. Create a test image if none exists
    console.log("\n3️⃣ Checking for test images...");

    const { data: files, error: listError } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .list("blog");

    if (listError) {
      console.error("Error listing files:", listError.message);
    } else {
      console.log(`Found ${files.length} items in blog/ folder`);

      if (
        files.length === 0 ||
        !files.some(
          (file) => file.name.endsWith(".png") || file.name.endsWith(".jpg")
        )
      ) {
        console.log("No test images found. Creating a test image...");

        // Create a simple test image or upload one
        const testImagePath = path.join(
          process.cwd(),
          "public",
          "test-image.png"
        );
        let imageData;

        try {
          // Check if we have a test image in public folder
          if (fs.existsSync(testImagePath)) {
            imageData = fs.readFileSync(testImagePath);
            console.log("Found test image in public folder");
          } else {
            // Fallback to creating a 1x1 transparent pixel as PNG
            // This is a base64 encoded 1x1 transparent PNG
            const base64Image =
              "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
            imageData = Buffer.from(base64Image, "base64");
            console.log("Created minimal test image");
          }

          // Upload test image
          const testFilePath = `blog/test-image-${Date.now()}.png`;

          const { error: uploadError } = await supabaseAdmin.storage
            .from(BUCKET_NAME)
            .upload(testFilePath, imageData, {
              contentType: "image/png",
              cacheControl: "public, max-age=31536000",
              upsert: true,
            });

          if (uploadError) {
            console.error("Error uploading test image:", uploadError.message);
          } else {
            const { data } = supabaseAdmin.storage
              .from(BUCKET_NAME)
              .getPublicUrl(testFilePath);
            console.log("✅ Uploaded test image:", testFilePath);
            console.log("📝 Public URL:", data.publicUrl);

            // Test accessing the image
            try {
              const response = await fetch(data.publicUrl, { method: "HEAD" });
              console.log(
                `🔍 Image access test: ${
                  response.ok ? "✅ Success" : "❌ Failed"
                } (Status: ${response.status})`
              );
            } catch (fetchErr) {
              console.error("❌ Could not access image:", fetchErr.message);
            }
          }
        } catch (err) {
          console.error("Error with test image:", err.message);
        }
      } else {
        console.log("✅ Test images already exist");
        const testFile = files.find(
          (file) => file.name.endsWith(".png") || file.name.endsWith(".jpg")
        );

        if (testFile) {
          const { data } = supabaseAdmin.storage
            .from(BUCKET_NAME)
            .getPublicUrl(`blog/${testFile.name}`);
          console.log("📝 Example image path:", `blog/${testFile.name}`);
          console.log("📝 Public URL:", data.publicUrl);

          // Test accessing the image
          try {
            const response = await fetch(data.publicUrl, { method: "HEAD" });
            console.log(
              `🔍 Image access test: ${
                response.ok ? "✅ Success" : "❌ Failed"
              } (Status: ${response.status})`
            );

            if (!response.ok) {
              console.log("Attempting to fix permission issues...");
              // Try updating permissions by re-applying public setting
              await supabaseAdmin.storage.updateBucket(BUCKET_NAME, {
                public: true,
              });
            }
          } catch (fetchErr) {
            console.error("❌ Could not access image:", fetchErr.message);
          }
        }
      }
    }

    // 4. Check loading from a client perspective
    console.log("\n4️⃣ Testing image retrieval from client perspective...");

    const { data: publicFiles, error: publicListError } =
      await supabasePublic.storage.from(BUCKET_NAME).list("blog");

    if (publicListError) {
      console.error("❌ Client could not list files:", publicListError.message);
      console.log("This suggests permission issues with public access");
    } else {
      console.log(`✅ Client successfully listed ${publicFiles.length} files`);

      if (publicFiles.length > 0) {
        const testFile = publicFiles.find(
          (file) => file.name.endsWith(".png") || file.name.endsWith(".jpg")
        );

        if (testFile) {
          const { data } = supabasePublic.storage
            .from(BUCKET_NAME)
            .getPublicUrl(`blog/${testFile.name}`);
          console.log("Testing client access to:", data.publicUrl);

          try {
            const response = await fetch(data.publicUrl, { method: "HEAD" });
            console.log(
              `Client access test: ${
                response.ok ? "✅ Success" : "❌ Failed"
              } (Status: ${response.status})`
            );
          } catch (fetchErr) {
            console.error(
              "❌ Client could not access image:",
              fetchErr.message
            );
          }
        }
      }
    }

    // 5. Update middleware settings if needed
    console.log("\n5️⃣ Recommendations:");
    console.log(
      "- Make sure middleware/image-cors.ts includes your Supabase domain in matchers"
    );
    console.log(`- Current Supabase URL: ${supabaseUrl}`);
    console.log(
      "- Check components/ui/supabase-image.tsx for proper error handling"
    );
    console.log(
      "- Ensure you're storing just the path (e.g., 'blog/image.jpg') in your database, not full URLs"
    );
  } catch (error) {
    console.error("Unexpected error:", error);
  }

  console.log("\n---------------------------------------");
  console.log("✨ Troubleshooting complete");
}

main().catch(console.error);
