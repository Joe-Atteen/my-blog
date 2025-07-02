#!/usr/bin/env node

/**
 * A script to test profile admin status in your Supabase database
 *
 * Usage:
 * node scripts/test-profile-admin.js [email]
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

async function checkForEmptyProfiles() {
  const { data, error } = await supabase.from("profiles").select("*");

  if (error) {
    console.error("Error fetching profiles:", error);
    return;
  }

  console.log(`Found ${data.length} profiles:`);
  data.forEach((profile) => {
    console.log(
      `- ${profile.email || "No email"} (ID: ${profile.id}, Admin: ${
        profile.is_admin ? "YES" : "NO"
      })`
    );
  });
}

async function main() {
  try {
    console.log("Testing Supabase Profile Admin Status...");

    // Get email from command line or use default
    const testEmail = process.argv[2] || "joeyatteen@gmail.com";
    console.log(`\nChecking admin status for email: ${testEmail}`);

    console.log("Checking profiles table for email...");

    // Query the profiles table directly with the email
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", testEmail)
      .single();

    if (profileError) {
      if (profileError.code === "PGRST116") {
        console.log(`No profile found for email: ${testEmail}`);

        console.log(
          "\nWould you like to create a profile with admin privileges? (Y/n)"
        );
        const response = await new Promise((resolve) => {
          process.stdin.once("data", (data) => {
            resolve(data.toString().trim().toLowerCase());
          });
        });

        if (response === "y" || response === "") {
          console.log("Creating profile with admin privileges...");

          // Get the current date in ISO format for the created_at field
          const now = new Date().toISOString();

          // Create a new profile with the provided email and admin privileges
          const { data: newProfile, error: insertError } = await supabase
            .from("profiles")
            .insert({
              email: testEmail,
              is_admin: true,
              created_at: now,
            })
            .select();

          if (insertError) {
            console.error("Error creating profile:", insertError);
          } else {
            console.log("Profile created successfully with admin=true");
            console.log("New profile:", newProfile);
          }
        }
      } else {
        console.error(
          `Error fetching profile by email: ${profileError.message}`
        );
      }

      await checkForEmptyProfiles();
      return;
    }

    console.log("Profile details:");
    console.log(`- Email: ${profileData.email || "Not set"}`);
    console.log(`- ID: ${profileData.id}`);
    console.log(`- Admin status: ${profileData.is_admin ? "YES" : "NO"}`);

    // Now check for profile

    if (profileData.is_admin === false) {
      console.log(
        "\nUser is not an admin. Would you like to make them an admin? (Y/n)"
      );
      const response = await new Promise((resolve) => {
        process.stdin.once("data", (data) => {
          resolve(data.toString().trim().toLowerCase());
        });
      });

      if (response === "y" || response === "") {
        console.log("Updating admin status...");

        const { error: updateError } = await supabase
          .from("profiles")
          .update({ is_admin: true })
          .eq("email", testEmail);

        if (updateError) {
          console.error("Error updating profile:", updateError);
        } else {
          console.log("Profile updated successfully - user is now an admin");

          // Fetch the updated profile to confirm
          const { data: updatedProfile } = await supabase
            .from("profiles")
            .select("*")
            .eq("email", testEmail)
            .single();

          if (updatedProfile) {
            console.log(
              "Updated profile admin status:",
              updatedProfile.is_admin ? "YES" : "NO"
            );
          }
        }
      }
    }
  } catch (error) {
    console.error("Error running test:", error);
  }
}

main();
