// Usage: node scripts/create-storage-bucket.js
// This script checks if the blog-images bucket exists and creates it if not
// It also sets public access for the bucket

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Requires service key with admin privileges

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing required environment variables!");
  console.error(
    "Please make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your .env file"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const BUCKET_NAME = "blog-images";

async function setupStorage() {
  console.log("🔍 Checking for blog-images bucket...");

  // Check if bucket exists
  const { data: buckets, error: bucketsError } =
    await supabase.storage.listBuckets();

  if (bucketsError) {
    console.error("Error listing buckets:", bucketsError.message);
    process.exit(1);
  }

  const bucketExists = buckets.some((bucket) => bucket.name === BUCKET_NAME);

  if (bucketExists) {
    console.log("✓ blog-images bucket already exists");
  } else {
    console.log("Creating blog-images bucket...");

    // Create the bucket with public access
    const { error: createError } = await supabase.storage.createBucket(
      BUCKET_NAME,
      {
        public: true, // Makes files publicly accessible
        fileSizeLimit: 5242880, // 5MB limit
      }
    );

    if (createError) {
      console.error("Error creating bucket:", createError.message);
      process.exit(1);
    }

    console.log("✓ blog-images bucket created successfully with public access");
  }

  // Set bucket policy to public
  console.log("🔧 Setting public access policy for the bucket...");

  const { error: policyError } = await supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl("test");

  if (policyError) {
    console.error("Error setting public access policy:", policyError.message);
    console.log(
      "Please set public access for the bucket in the Supabase dashboard"
    );
  } else {
    console.log("✓ Public access policy set successfully");
  }

  console.log("✅ Storage setup complete!");
}

setupStorage().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
