#!/usr/bin/env node

/**
 * A script to verify admin access by checking profiles and auth data
 *
 * Usage:
 * node scripts/verify-admin-access.js [email]
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
    const email = process.argv[2] || "joeyatteen@gmail.com";
    console.log(`\nVerifying admin access for: ${email}\n`);

    // First check if user exists and get their ID
    console.log("Step 1: Checking auth.users table via auth API");
    const { data: userResult, error: userError } =
      await supabase.auth.signInWithOtp({
        email,
        options: {
          // This doesn't send an email, just checks if the user exists
          shouldCreateUser: false,
        },
      });

    if (userError && userError.message !== "User already registered") {
      console.error("Error checking user:", userError.message);
      // Continue anyway as we might find the profile directly
    } else {
      console.log(`User check result: ${userResult ? "Found" : "Not Found"}`);
    }

    // Check profiles table by email
    console.log("\nStep 2: Checking profiles table by email");
    const { data: profilesByEmail, error: profileEmailError } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", email);

    if (profileEmailError) {
      console.error(
        `Error querying profiles by email: ${profileEmailError.message}`
      );
      return;
    }

    console.log(`Found ${profilesByEmail.length} profiles with this email`);

    if (profilesByEmail.length > 0) {
      console.log("\nProfile details:");
      profilesByEmail.forEach((profile, index) => {
        console.log(`\n--- Profile ${index + 1} ---`);
        console.log(`ID: ${profile.id}`);
        console.log(`Email: ${profile.email || "Not set"}`);
        console.log(`Admin Status: ${profile.is_admin ? "YES" : "NO"}`);
        console.log(`Created: ${profile.created_at || "Unknown"}`);
      });

      // Check if any profiles have admin access
      const adminProfiles = profilesByEmail.filter((p) => p.is_admin);
      if (adminProfiles.length > 0) {
        console.log("\n✅ User has admin access in at least one profile.");
      } else {
        console.log("\n❌ User does not have admin access in any profiles.");

        // Ask to fix the profile
        console.log(
          "\nWould you like to grant admin access to all profiles for this email? (y/N)"
        );
        const response = await new Promise((resolve) => {
          process.stdin.once("data", (data) => {
            resolve(data.toString().trim().toLowerCase());
          });
        });

        if (response === "y") {
          for (const profile of profilesByEmail) {
            console.log(`\nUpdating profile ${profile.id}...`);
            const { error: updateError } = await supabase
              .from("profiles")
              .update({ is_admin: true })
              .eq("id", profile.id);

            if (updateError) {
              console.error(`Error updating profile: ${updateError.message}`);
            } else {
              console.log(
                "Profile updated successfully - user is now an admin"
              );
            }
          }
        }
      }
    } else {
      console.log("No profiles found for this email.");
    }

    // Verify the middleware logic directly
    console.log("\nStep 3: Testing middleware logic");
    console.log(
      "This simulates the check that the middleware will perform when a user tries to access /admin"
    );

    if (profilesByEmail.length > 0) {
      const profile = profilesByEmail[0];
      console.log(`\nMiddleware check for profile ID: ${profile.id}`);
      console.log(
        `Admin Status: ${
          profile.is_admin ? "Will Allow Access" : "Will Deny Access"
        }`
      );

      if (!profile.is_admin) {
        console.log("\nThe user will be redirected to /unauthorized");
      }
    } else {
      console.log(
        "\nNo profile found - middleware will deny access due to missing profile"
      );
    }

    console.log("\nVerification complete.");
    console.log("If you're still having issues accessing the admin page:");
    console.log("1. Make sure cookies are being properly set in your browser");
    console.log(
      "2. Try accessing /debug-session to see your current session status"
    );
    console.log("3. Try logging out and back in again after fixing profiles");
  } catch (error) {
    console.error("Error during verification:", error);
  }
}

main();
