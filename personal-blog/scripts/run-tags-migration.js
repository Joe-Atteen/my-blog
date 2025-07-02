// Script to run tag migrations against Supabase database
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import dotenv from "dotenv";

// Load environment variables from .env file if running locally
dotenv.config();

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase environment variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Get current file path and directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
  try {
    // Read the migration file
    const migrationFile = path.join(__dirname, "migrations/01-create-tags.sql");
    console.log(`Reading migration file from: ${migrationFile}`);

    if (!fs.existsSync(migrationFile)) {
      console.error(`Migration file not found: ${migrationFile}`);
      process.exit(1);
    }

    const sql = fs.readFileSync(migrationFile, "utf8");

    console.log("Running tags migration...");

    // Execute the SQL directly using the Supabase REST API
    const { error } = await supabase.rpc("exec_sql", { sql_query: sql });

    if (error) {
      throw error;
    }

    console.log("Tags migration completed successfully.");

    // Verify tables were created
    const { error: tagError } = await supabase
      .from("tags")
      .select("count")
      .limit(1);

    if (tagError) {
      console.warn("Warning: Could not verify tags table:", tagError.message);
    } else {
      console.log("Tags table created successfully.");
    }

    const { error: postTagError } = await supabase
      .from("posts_tags")
      .select("count")
      .limit(1);

    if (postTagError) {
      console.warn(
        "Warning: Could not verify posts_tags table:",
        postTagError.message
      );
    } else {
      console.log("Posts_tags table created successfully.");
    }
  } catch (error) {
    console.error("Error running tags migration:", error);
    process.exit(1);
  }
}

runMigration();
