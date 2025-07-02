#!/usr/bin/env node

/**
 * A script to verify database structure and setup for the blog
 *
 * Usage:
 * node scripts/check-database.js
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// Load environment variables from .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, "../.env.local");

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log("Loaded environment from .env.local");
} else {
  dotenv.config();
  console.log("No .env.local found, using default environment");
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "Missing Supabase configuration. Please check your .env.local file."
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("Checking database structure and configuration...\n");

  try {
    // List all tables to check if profiles exists
    console.log("Checking available tables:");
    const { data: tables, error: tablesError } = await supabase
      .from("_metadata")
      .select("tables");

    if (tablesError) {
      console.error("Error checking tables:", tablesError.message);
      console.log("Trying alternative method to check for profiles table...");

      // Try to query the profiles table directly to see if it exists
      const { error: profilesError } = await supabase
        .from("profiles")
        .select("count")
        .limit(1);

      if (profilesError && profilesError.code === "42P01") {
        console.error("❌ The profiles table does not exist!");
        console.log("You need to create the profiles table. Here's the SQL:");
        console.log(`
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX profiles_email_idx ON public.profiles (email);

-- Set RLS policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow public reads
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT USING (true);

-- Allow users to update their own profiles
CREATE POLICY "Users can update their own profiles" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Allow service role to manage all profiles
CREATE POLICY "Service role can manage all profiles" 
ON public.profiles USING (auth.role() = 'service_role');

-- Grant permissions
GRANT ALL ON public.profiles TO service_role;
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
        `);
      } else {
        console.log("✅ Profiles table exists");
      }
    } else {
      console.log("Available tables:", tables);

      // Check for profiles table
      const hasProfilesTable = tables?.tables?.some(
        (t) => t.name === "profiles"
      );
      if (hasProfilesTable) {
        console.log("✅ Profiles table exists");
      } else {
        console.error("❌ Profiles table not found!");
      }
    }

    // Check for any existing profiles
    console.log("\nChecking existing profiles:");
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("*");

    if (profilesError) {
      console.error("Error checking profiles:", profilesError.message);
    } else {
      console.log(`Found ${profiles.length} profiles`);

      if (profiles.length > 0) {
        profiles.forEach((profile, index) => {
          console.log(`\nProfile ${index + 1}:`);
          console.log(`- ID: ${profile.id}`);
          console.log(`- Email: ${profile.email}`);
          console.log(`- Admin: ${profile.is_admin ? "YES" : "NO"}`);
          console.log(`- Created: ${profile.created_at}`);
        });
      }
    }

    // Checking auth configuration
    console.log("\nChecking auth configuration:");
    // We can't directly check auth config with anon key, so we'll just try to sign in
    const testEmail = "test@example.com";
    const { error: signInError } = await supabase.auth.signInWithOtp({
      email: testEmail,
      options: {
        shouldCreateUser: false,
      },
    });

    if (signInError && signInError.message.includes("User not found")) {
      console.log("✅ Auth system is responding correctly");
    } else if (signInError) {
      console.warn(
        "⚠️ Auth system returned unexpected error:",
        signInError.message
      );
    } else {
      console.log("✅ Auth system is responding");
    }

    console.log("\nDatabase check complete.");
  } catch (error) {
    console.error("Error during database check:", error);
  }
}

main();
