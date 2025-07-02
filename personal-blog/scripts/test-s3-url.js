// Test S3 URL Fix
// This script tests if the S3 URL format works better than default Supabase URL

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

// Check for required environment variables
if (
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
) {
  console.error("❌ Missing required environment variables!");
  console.error(
    "Please make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in your .env.local file"
  );
  process.exit(1);
}

// Create a Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Get bucket name from env var or use default
const BUCKET_NAME = process.env.NEXT_PUBLIC_STORAGE_BUCKET || "blog-images";

// Test image path
const TEST_PATH = "blog/test-image.png";

// Function to check if URL is accessible
async function checkUrlAccess(url) {
  try {
    const response = await fetch(url, { method: "HEAD" });
    return {
      status: response.status,
      ok: response.ok,
    };
  } catch (e) {
    return {
      status: 0,
      ok: false,
      error: e.message,
    };
  }
}

async function run() {
  console.log("🔍 Testing Different URL Formats");
  console.log("---------------------------------------");

  // First, check if image exists
  try {
    console.log(`Checking if ${TEST_PATH} exists...`);
    const { data: fileListData, error: fileListError } = await supabase.storage
      .from(BUCKET_NAME)
      .list("blog", {
        search: TEST_PATH.split("/").pop(),
      });

    if (fileListError) {
      console.error(`❌ Error listing files: ${fileListError.message}`);
    } else if (!fileListData || fileListData.length === 0) {
      console.log(`⚠️ File ${TEST_PATH} doesn't exist in the bucket`);
      console.log("Uploading a test image...");

      // Create a simple 1x1 transparent PNG
      const base64Image =
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z/C/HgAGgwJ/lK3Q6wAAAABJRU5ErkJggg==";
      const buffer = Buffer.from(base64Image, "base64");

      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(TEST_PATH, buffer, {
          contentType: "image/png",
          upsert: true,
        });

      if (uploadError) {
        console.error(`❌ Failed to upload test image: ${uploadError.message}`);
      } else {
        console.log("✅ Test image uploaded successfully!");
      }
    } else {
      console.log(`✅ File ${TEST_PATH} exists in the bucket`);
    }
  } catch (e) {
    console.error(`❌ Error checking file: ${e.message}`);
  }

  // Test 1: Standard Supabase URL
  try {
    console.log("\n1️⃣ Testing standard Supabase URL:");
    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(TEST_PATH);
    const standardUrl = data.publicUrl;
    console.log(`URL: ${standardUrl}`);

    const standardResult = await checkUrlAccess(standardUrl);
    console.log(
      `Access result: ${
        standardResult.ok ? "✅ SUCCESS" : "❌ FAILED"
      } (Status: ${standardResult.status})`
    );

    if (!standardResult.ok) {
      console.log(
        "Standard URL is not accessible. This could be a permissions or CORS issue."
      );
    }
  } catch (e) {
    console.error(`❌ Error with standard URL: ${e.message}`);
  }

  // Test 2: S3-style URL
  try {
    console.log("\n2️⃣ Testing S3-style URL:");
    const baseUrl = supabaseUrl;
    const s3Url = `${baseUrl}/storage/v1/s3/object/public/${BUCKET_NAME}/${TEST_PATH}`;
    console.log(`URL: ${s3Url}`);

    const s3Result = await checkUrlAccess(s3Url);
    console.log(
      `Access result: ${s3Result.ok ? "✅ SUCCESS" : "❌ FAILED"} (Status: ${
        s3Result.status
      })`
    );

    if (s3Result.ok) {
      console.log(
        "✅ S3 URL format works! Consider updating your URL generation logic."
      );
    }
  } catch (e) {
    console.error(`❌ Error with S3 URL: ${e.message}`);
  }

  // Test 3: Direct Object URL
  try {
    console.log("\n3️⃣ Testing direct object URL:");
    const baseUrl = supabaseUrl;
    const directUrl = `${baseUrl}/storage/v1/object/${BUCKET_NAME}/${TEST_PATH}`;
    console.log(`URL: ${directUrl}`);

    const directResult = await checkUrlAccess(directUrl);
    console.log(
      `Access result: ${
        directResult.ok ? "✅ SUCCESS" : "❌ FAILED"
      } (Status: ${directResult.status})`
    );

    if (directResult.ok) {
      console.log("✅ Direct object URL works!");
    }
  } catch (e) {
    console.error(`❌ Error with direct URL: ${e.message}`);
  }

  // Summary and Recommendation
  console.log("\n📋 Summary and Recommendation:");
  console.log(
    "If any of the above formats worked, you should update your image URL generation code"
  );
  console.log("to use that format. Here are potential fixes:");

  console.log(
    "\n1. Try updating the getCorrectImageUrl function in supabase-image-utils.ts to use the working URL format."
  );
  console.log(
    "2. Check that your bucket permissions are correctly set to public."
  );
  console.log(
    "3. Verify CORS settings are allowing requests from your domain."
  );
  console.log(
    "4. Make sure the Next.js image config in next.config.js includes the correct URL pattern."
  );

  console.log("\n---------------------------------------");
  console.log("✨ Testing complete");
}

run().catch((error) => {
  console.error("❌ Unexpected error:", error);
  process.exit(1);
});
