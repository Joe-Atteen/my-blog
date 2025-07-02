// This script approves all existing comments
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Supabase credentials not found in environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function approveAllComments() {
  console.log("Approving all pending comments...");

  const { data, error } = await supabase
    .from("comments")
    .update({ approved: true })
    .eq("approved", false);

  if (error) {
    console.error("Error approving comments:", error);
    return;
  }

  console.log("Success! All pending comments are now approved.");
}

approveAllComments().catch(console.error);
