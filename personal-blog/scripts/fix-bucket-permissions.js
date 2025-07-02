// Fix Bucket Permissions
// This script fixes bucket permissions to make images public

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

// Check for required environment variables
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.ADMIN_SECRET;

if (
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  !serviceRoleKey
) {
  console.error("❌ Missing required environment variables!");
  console.error(
    "Please make sure these variables are set in your .env.local file:"
  );
  console.error("- NEXT_PUBLIC_SUPABASE_URL");
  console.error("- NEXT_PUBLIC_SUPABASE_ANON_KEY");
  console.error(
    "- Either SUPABASE_SERVICE_ROLE_KEY or ADMIN_SECRET (needed to update bucket permissions)"
  );
  process.exit(1);
}

// Create Supabase clients
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Regular client for basic operations
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for privileged operations
const adminClient = createClient(supabaseUrl, serviceRoleKey);

// Get bucket name from env var or use default
const BUCKET_NAME = process.env.NEXT_PUBLIC_STORAGE_BUCKET || "blog-images";

// Function to execute SQL directly (requires service role key)
async function executeSql(sql) {
  try {
    const { data, error } = await adminClient.rpc("exec_sql", { query: sql });

    if (error) throw error;
    return data;
  } catch (e) {
    console.error(`SQL execution failed: ${e.message}`);
    return null;
  }
}

// Function to check if policy exists
async function policyExists(policyName) {
  try {
    const sql = `
      SELECT * FROM pg_policies 
      WHERE policyname = '${policyName}'
    `;

    const result = await executeSql(sql);
    return result && result.length > 0;
  } catch (e) {
    console.error(`Error checking policy: ${e.message}`);
    return false;
  }
}

async function run() {
  console.log("🔧 Fixing Storage Bucket Permissions");
  console.log("---------------------------------------");

  // Step 1: Verify and fix bucket settings
  console.log("\n1️⃣ Checking bucket settings...");
  try {
    const { data: bucket, error } = await adminClient.storage.getBucket(
      BUCKET_NAME
    );

    if (error) {
      console.error(`❌ Error getting bucket: ${error.message}`);

      // Try to create the bucket
      console.log(`Creating bucket ${BUCKET_NAME}...`);
      const { error: createError } = await adminClient.storage.createBucket(
        BUCKET_NAME,
        {
          public: true,
        }
      );

      if (createError) {
        console.error(`❌ Failed to create bucket: ${createError.message}`);
      } else {
        console.log("✅ Bucket created successfully!");
      }
    } else {
      console.log(`Bucket details: ${JSON.stringify(bucket, null, 2)}`);

      // Update bucket to be public if it's not
      if (!bucket.public) {
        console.log("Updating bucket to be public...");
        const { error: updateError } = await adminClient.storage.updateBucket(
          BUCKET_NAME,
          {
            public: true,
          }
        );

        if (updateError) {
          console.error(
            `❌ Failed to make bucket public: ${updateError.message}`
          );
        } else {
          console.log("✅ Bucket updated to public successfully!");
        }
      } else {
        console.log("✅ Bucket is already public");
      }
    }
  } catch (e) {
    console.error(`❌ Error managing bucket: ${e.message}`);
  }

  // Step 2: Fix RLS policies for anonymous access
  console.log("\n2️⃣ Setting up security policies for anonymous access...");

  // Define the policies we need
  const policies = [
    {
      name: "Allow public read access",
      sql: `
        CREATE POLICY "Allow public read access" ON storage.objects
        FOR SELECT USING (bucket_id = '${BUCKET_NAME}');
      `,
    },
    {
      name: "Allow authenticated users to upload",
      sql: `
        CREATE POLICY "Allow authenticated users to upload" ON storage.objects
        FOR INSERT WITH CHECK (
          bucket_id = '${BUCKET_NAME}' 
          AND auth.role() = 'authenticated'
        );
      `,
    },
    {
      name: "Allow authenticated users to update own objects",
      sql: `
        CREATE POLICY "Allow authenticated users to update own objects" ON storage.objects
        FOR UPDATE USING (
          bucket_id = '${BUCKET_NAME}'
          AND auth.uid() = owner
        );
      `,
    },
    {
      name: "Allow authenticated users to delete own objects",
      sql: `
        CREATE POLICY "Allow authenticated users to delete own objects" ON storage.objects
        FOR DELETE USING (
          bucket_id = '${BUCKET_NAME}'
          AND auth.uid() = owner
        );
      `,
    },
  ];

  // Create each policy if it doesn't exist
  for (const policy of policies) {
    try {
      const exists = await policyExists(policy.name);

      if (exists) {
        console.log(`✓ Policy "${policy.name}" already exists`);
      } else {
        console.log(`Creating policy "${policy.name}"...`);
        const result = await executeSql(policy.sql);

        if (result !== null) {
          console.log(`✅ Policy "${policy.name}" created successfully`);
        } else {
          console.log(`⚠️ Failed to create policy "${policy.name}"`);
        }
      }
    } catch (e) {
      console.error(`❌ Error with policy "${policy.name}": ${e.message}`);
    }
  }

  // Step 3: Set up CORS for the bucket
  console.log("\n3️⃣ Setting up CORS configuration...");

  try {
    const corsRules = [
      {
        // Allow requests from any origin
        allowed_origins: ["*"],
        allowed_methods: ["GET"],
        allowed_headers: ["*"],
        expose_headers: ["Content-Length", "Content-Type"],
        max_age_seconds: 86400,
      },
    ];

    // Update CORS configuration using REST API since SDK doesn't support CORS management
    const corsResponse = await fetch(`${supabaseUrl}/storage/v1/cors`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(corsRules),
    });

    if (corsResponse.ok) {
      console.log("✅ CORS configuration updated successfully");
    } else {
      console.error(`❌ Failed to update CORS: ${corsResponse.statusText}`);
      const errorText = await corsResponse.text();
      console.error(errorText);
    }
  } catch (e) {
    console.error(`❌ Error updating CORS: ${e.message}`);
  }

  // Step 4: Upload test image to check permissions
  console.log("\n4️⃣ Uploading test image to check permissions...");

  const testPath = "blog/test-image.png";

  try {
    // Create a simple 1x1 transparent PNG
    const base64Image =
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z/C/HgAGgwJ/lK3Q6wAAAABJRU5ErkJggg==";
    const buffer = Buffer.from(base64Image, "base64");

    // Try admin upload first
    const { error: adminUploadError } = await adminClient.storage
      .from(BUCKET_NAME)
      .upload(testPath, buffer, {
        contentType: "image/png",
        upsert: true,
      });

    if (adminUploadError) {
      console.error(`❌ Admin upload failed: ${adminUploadError.message}`);
    } else {
      console.log("✅ Admin upload successful!");

      // Check public access
      const { data } = adminClient.storage
        .from(BUCKET_NAME)
        .getPublicUrl(testPath);
      const publicUrl = data.publicUrl;

      console.log(`Public URL: ${publicUrl}`);
      console.log("Testing if URL is accessible...");

      try {
        const response = await fetch(publicUrl, { method: "HEAD" });
        if (response.ok) {
          console.log(
            `✅ SUCCESS! Image is publicly accessible (Status: ${response.status})`
          );
          console.log("Your image URL generation is now working correctly!");
        } else {
          console.log(
            `❌ FAILED! Image is not publicly accessible (Status: ${response.status})`
          );
          console.log("There may still be issues with your configuration.");
        }
      } catch (e) {
        console.error(`❌ Error testing URL: ${e.message}`);
      }
    }
  } catch (e) {
    console.error(`❌ Error in test upload: ${e.message}`);
  }

  // Summary and next steps
  console.log("\n✅ Permission setup complete!");
  console.log("\nNext Steps:");
  console.log("1. Try restarting your development server");
  console.log("2. Clear your browser cache or use incognito mode");
  console.log(
    "3. If issues persist, check the supabase-image-utils.ts file to ensure it's using the correct URL format"
  );

  console.log("\n---------------------------------------");
  console.log("✨ Setup complete");
}

run().catch((error) => {
  console.error("❌ Unexpected error:", error);
  process.exit(1);
});
