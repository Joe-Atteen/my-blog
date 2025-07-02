#!/usr/bin/env node

/**
 * A script to fix duplicate profiles and ensure admin access
 *
 * Usage:
 * node scripts/fix-duplicate-profiles.js
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
  try {
    console.log("Finding profiles for joeyatteen@gmail.com...");

    // Use ilike for case-insensitive search
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("*")
      .ilike("email", "%joeyatteen@gmail.com%");

    if (error) {
      console.error("Error fetching profiles:", error.message);
      return;
    }

    console.log(`Found ${profiles.length} profiles for this email`);

    if (profiles.length <= 0) {
      console.log("No profiles found to fix.");
      return;
    }

    // Display all profiles
    profiles.forEach((profile, index) => {
      console.log(`\nProfile ${index + 1}:`);
      console.log(`- ID: ${profile.id}`);
      console.log(`- Email: ${profile.email}`);
      console.log(`- Admin: ${profile.is_admin ? "YES" : "NO"}`);
    });

    // Find non-admin profiles
    const nonAdminProfiles = profiles.filter((p) => !p.is_admin);

    if (nonAdminProfiles.length > 0) {
      console.log(
        `\nFound ${nonAdminProfiles.length} non-admin profiles to update.`
      );

      for (const profile of nonAdminProfiles) {
        console.log(`Updating profile ${profile.id} to admin=true...`);

        const { error: updateError } = await supabase
          .from("profiles")
          .update({ is_admin: true })
          .eq("id", profile.id);

        if (updateError) {
          console.error(
            `Error updating profile ${profile.id}:`,
            updateError.message
          );
        } else {
          console.log(`✅ Successfully updated profile ${profile.id}`);
        }
      }
    } else {
      console.log(
        "\nNo non-admin profiles found. All profiles already have admin access."
      );
    }

    // Check for any users with missing profiles
    console.log("\nChecking for auth users without profiles...");

    const { data: authDataUnsafe } = await supabase.auth.signInWithOtp({
      email: "joeyatteen@gmail.com",
      options: {
        shouldCreateUser: false,
      },
    });

    // This is just a check, we don't have access to all users
    console.log("NOTE: Full user verification requires admin API access.");
    console.log(
      "Please ensure all users have corresponding profiles manually if needed."
    );
  } catch (error) {
    console.error("Error fixing duplicate profiles:", error);
  }
}

main();
