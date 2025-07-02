// Fix Storage Permissions Script
// This script properly configures the Supabase Storage bucket for public access

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
// Use native fetch API (Node.js now supports fetch natively)

// Check for required environment variables
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Missing SUPABASE_SERVICE_ROLE_KEY environment variable!");
  console.error(
    "This script requires admin access to update bucket permissions"
  );
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET_NAME = process.env.NEXT_PUBLIC_STORAGE_BUCKET || "blog-images";

// Create admin client
const adminClient = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("🔧 Fixing Storage Bucket Permissions");
  console.log("---------------------------------------");

  // Step 1: Update bucket to be public
  console.log(`\n1️⃣ Setting bucket "${BUCKET_NAME}" to public...`);
  try {
    const { error } = await adminClient.storage.updateBucket(BUCKET_NAME, {
      public: true,
      allowedMimeTypes: ["image/*"],
      fileSizeLimit: 10485760, // 10MB
    });

    if (error) {
      console.error(`❌ Failed to update bucket: ${error.message}`);
    } else {
      console.log("✅ Bucket updated to public successfully!");
    }
  } catch (e) {
    console.error(`❌ Error updating bucket: ${e.message}`);
  }

  // Step 2: Update CORS configuration
  console.log("\n2️⃣ Setting up proper CORS configuration...");
  try {
    const corsRules = [
      {
        allowed_origins: ["*"],
        allowed_methods: ["GET", "HEAD", "PUT", "POST", "OPTIONS"],
        allowed_headers: ["*"],
        max_age_seconds: 86400, // 24 hours
      },
    ];

    const corsResponse = await fetch(`${supabaseUrl}/storage/v1/cors`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(corsRules),
    });

    if (corsResponse.ok) {
      console.log("✅ CORS configuration updated successfully!");
    } else {
      console.error(`❌ Failed to update CORS: ${await corsResponse.text()}`);
    }
  } catch (e) {
    console.error(`❌ Error updating CORS: ${e.message}`);
  }

  // Step 3: Set public access policy
  console.log("\n3️⃣ Setting up public access policy for images...");
  try {
    // First remove any existing policies that might conflict
    await adminClient
      .rpc("storage_admin.delete_all_policies", {
        bucket_name: BUCKET_NAME,
      })
      .catch(() => {
        console.log(
          "Note: Could not delete existing policies. This is normal if none exist."
        );
      });

    // Add policy for public read access
    const { error } = await adminClient.storage
      .from(BUCKET_NAME)
      .createPolicy("public-read-policy", {
        name: "Public Read Policy",
        definition: {
          statements: [
            {
              action: "SELECT",
              effect: "ALLOW",
              role: "anon",
              condition: "",
            },
          ],
          check: "",
        },
      });

    if (error) {
      console.error(`❌ Failed to create policy: ${error.message}`);
    } else {
      console.log("✅ Public read policy created successfully!");
    }
  } catch (e) {
    console.error(`❌ Error setting policy: ${e.message}`);
  }

  console.log("\n---------------------------------------");
  console.log("✨ Bucket permission setup complete");
  console.log(
    "\nYour images should now be accessible without requiring signed URLs."
  );
  console.log(
    "If issues persist, verify your database RLS policies and check that your next.config.js"
  );
  console.log(
    "has the correct remotePatterns configuration for Supabase image domains."
  );
}

run().catch((error) => {
  console.error("❌ Unexpected error:", error);
  process.exit(1);
});
