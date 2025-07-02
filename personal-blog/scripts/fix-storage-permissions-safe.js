// Fix Storage Permissions Script (Safe Version)
// This script properly configures the Supabase Storage bucket for public access
// without requiring a service role key

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const BUCKET_NAME = process.env.NEXT_PUBLIC_STORAGE_BUCKET || "blog-images";

// Create client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log("🔧 Creating Test Image for Bucket");
  console.log("---------------------------------------");

  try {
    // Step 1: Check bucket exists
    console.log(`\n1️⃣ Checking if bucket "${BUCKET_NAME}" exists...`);
    const { data, error } = await supabase.storage.getBucket(BUCKET_NAME);

    if (error) {
      console.error(`❌ Cannot access bucket: ${error.message}`);
      console.log("\n---------------------------------------");
      console.log("🔑 You need Supabase Dashboard Access");
      console.log("\nTo fix the permissions permanently:");
      console.log("1. Go to Supabase Dashboard: https://app.supabase.com");
      console.log("2. Select your project");
      console.log("3. Go to Storage > Buckets > blog-images");
      console.log("4. Click 'Settings' for the bucket");
      console.log("5. Make sure 'Public bucket' is enabled");
      console.log("6. Go to 'Policies' tab");
      console.log("7. Create these policies if they don't exist:");
      console.log(
        "   - SELECT: Allow access for all users (anon, authenticated)"
      );
      console.log("   - INSERT: Allow authenticated users to upload");
      console.log("8. Go to Project Settings > API > CORS");
      console.log("9. Add * to allowed origins");
      console.log(
        "\nAfter making these changes, your images should work without signed URLs"
      );
      return;
    }

    // Step 2: Try to upload a test file to see if it works
    console.log(`\n2️⃣ Uploading test file to bucket "${BUCKET_NAME}"...`);

    // Create a simple 1x1 transparent PNG
    const base64Image =
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z/C/HgAGgwJ/lK3Q6wAAAABJRU5ErkJggg==";
    const buffer = Buffer.from(base64Image, "base64");

    const testPath = "test-bucket-access.png";

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(testPath, buffer, {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) {
      console.error(`❌ Cannot upload to bucket: ${uploadError.message}`);
      console.log("\n---------------------------------------");
      console.log(
        "🔑 You need Supabase Dashboard Access - see instructions above"
      );
      return;
    }

    // Step 3: Get public URL and test it
    console.log(`\n3️⃣ Testing public access to uploaded file...`);
    const { data: urlData } = await supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(testPath);

    console.log(`Public URL: ${urlData.publicUrl}`);

    // Try accessing the URL
    try {
      const response = await fetch(urlData.publicUrl, { method: "HEAD" });
      if (response.ok) {
        console.log(
          "✅ Success! The bucket is correctly configured for public access."
        );
        console.log(
          "Your images should work with standard public URLs now without requiring signed URLs."
        );
      } else {
        console.error(
          `❌ Cannot access file publicly: ${response.status} ${response.statusText}`
        );
        console.log("\n---------------------------------------");
        console.log(
          "🔑 You need Supabase Dashboard Access - see instructions above"
        );
      }
    } catch (e) {
      console.error(`❌ Error testing URL: ${e.message}`);
      console.log("\n---------------------------------------");
      console.log(
        "🔑 You need Supabase Dashboard Access - see instructions above"
      );
    }

    // Clean up the test file
    await supabase.storage.from(BUCKET_NAME).remove([testPath]);
  } catch (e) {
    console.error(`❌ Unexpected error: ${e.message}`);
  }
}

run().catch((error) => {
  console.error("❌ Unexpected error:", error);
  process.exit(1);
});
