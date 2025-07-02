// Usage: node scripts/test-storage.js
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing required environment variables!");
  console.error(
    "Please make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in your .env file"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const BUCKET_NAME = "blog-images";
const TEST_FILE_PATH = path.resolve("./public/vercel.svg"); // Using a built-in SVG for testing

async function testStorage() {
  console.log("🔍 Testing Supabase storage configuration...");

  // Check if bucket exists
  console.log("Checking if bucket exists...");
  const { data: buckets, error: bucketsError } =
    await supabase.storage.listBuckets();

  if (bucketsError) {
    console.error("❌ Error listing buckets:", bucketsError.message);
    process.exit(1);
  }

  const bucketExists = buckets.some((bucket) => bucket.name === BUCKET_NAME);

  if (!bucketExists) {
    console.error(
      `❌ Bucket '${BUCKET_NAME}' does not exist. Please run 'yarn setup:storage' first.`
    );
    process.exit(1);
  }

  console.log(`✓ Bucket '${BUCKET_NAME}' exists`);

  // Test listing files
  console.log("Testing bucket access...");
  const { data: files, error: listError } = await supabase.storage
    .from(BUCKET_NAME)
    .list();

  if (listError) {
    console.error("❌ Error listing files:", listError.message);
    process.exit(1);
  }

  console.log(`✓ Bucket access OK, contains ${files.length} files`);

  // Test file upload
  console.log("Testing file upload...");

  try {
    if (!fs.existsSync(TEST_FILE_PATH)) {
      console.error(`❌ Test file not found at ${TEST_FILE_PATH}`);
      process.exit(1);
    }

    const fileContent = fs.readFileSync(TEST_FILE_PATH);
    const filePath = `test-uploads/test-${Date.now()}.svg`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, fileContent);

    if (uploadError) {
      console.error("❌ Error uploading test file:", uploadError.message);
      process.exit(1);
    }

    console.log("✓ File upload successful");

    // Test getting public URL
    console.log("Testing public URL generation...");
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    if (!urlData || !urlData.publicUrl) {
      console.error("❌ Failed to get public URL");
      process.exit(1);
    }

    console.log(`✓ Public URL successfully generated: ${urlData.publicUrl}`);

    // Cleanup
    console.log("Cleaning up test file...");
    const { error: deleteError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (deleteError) {
      console.error("⚠️ Cleanup warning:", deleteError.message);
    } else {
      console.log("✓ Test file removed successfully");
    }
  } catch (e) {
    console.error("❌ Unexpected error during testing:", e);
    process.exit(1);
  }

  console.log("✅ Storage test completed successfully!");
  console.log("Your image upload feature should now be working correctly.");
}

testStorage().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
