import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function run() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
    process.exit(1);
  }

  const supabase = createClient(url, key);

  console.log("Checking bucket 'fluxy-assets'...");
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  
  if (listError) {
    console.error("Error listing buckets:", listError.message);
    process.exit(1);
  }

  const exists = buckets.some(b => b.name === "fluxy-assets");
  if (exists) {
    console.log("Bucket 'fluxy-assets' already exists!");
    process.exit(0);
  }

  console.log("Creating bucket 'fluxy-assets' (public)...");
  const { data, error } = await supabase.storage.createBucket("fluxy-assets", {
    public: true,
    fileSizeLimit: 15 * 1024 * 1024, // 15MB
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"]
  });

  if (error) {
    console.error("Error creating bucket:", error.message);
    process.exit(1);
  }

  console.log("Bucket 'fluxy-assets' created successfully!", data);
}

run().catch(console.error);
