import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

// Load environment variables from .env.local
const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env.local") });

async function testSupabaseConnection() {
  console.log("Testing Supabase Connection");

  // Create a Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );

  try {
    // Test connection by retrieving service status
    console.log("URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log("Checking Supabase connection...");

    const { error } = await supabase
      .from("profiles")
      .select("count", { count: "exact", head: true });

    if (error) {
      console.error("❌ Connection Error:", error.message);
      return;
    }

    console.log("✅ Successfully connected to Supabase!");

    // Test authentication
    console.log("\nTesting authentication with test user...");

    const testEmail = "test@example.com";
    const testPassword = "password123";

    // Try to sign up a test user (may fail if user already exists, which is fine)
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp(
      {
        email: testEmail,
        password: testPassword,
      }
    );

    if (signUpError) {
      console.log(
        "Sign up error (expected if user exists):",
        signUpError.message
      );
    } else {
      console.log("Created test user:", signUpData.user?.id);
    }

    // Try to sign in
    const { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      });

    if (signInError) {
      console.error("❌ Sign in failed:", signInError.message);
    } else {
      console.log("✅ Successfully signed in:", signInData.user?.email);
      console.log(
        "Access token:",
        signInData.session?.access_token?.substring(0, 10) + "..."
      );

      // Test profile access
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", signInData.user?.id)
        .single();

      if (profileError) {
        console.error("❌ Error accessing profile:", profileError.message);
      } else {
        console.log("✅ Profile retrieved:", profile);
      }

      // Sign out
      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) {
        console.error("❌ Sign out failed:", signOutError.message);
      } else {
        console.log("✅ Successfully signed out");
      }
    }
  } catch (error) {
    console.error("Unexpected error:", error);
  }
}

testSupabaseConnection().catch(console.error);
