import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "fluxy-assets";

// ─── Lazy singleton — avoids crash on module load if env vars are missing ─────

let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (_client) return _client;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || url === "YOUR_SUPABASE_PROJECT_URL" || !url.startsWith("http")) {
    throw new Error(
      "SUPABASE_URL is not configured. Set it in .env.local to enable file uploads."
    );
  }
  if (!key || key === "YOUR_SUPABASE_SERVICE_ROLE_KEY") {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not configured. Set it in .env.local to enable file uploads."
    );
  }

  _client = createClient(url, key);
  return _client;
}

/**
 * Upload a file buffer to Supabase Storage.
 * Returns the public URL.
 */
export async function uploadFile(
  buffer: Buffer,
  path: string,
  mimeType: string
): Promise<{ url: string; path: string }> {
  const supabase = getClient(); // will throw a clear error if not configured

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, path };
}

/**
 * Get the public URL for an existing file.
 */
export function getPublicUrl(path: string): string {
  const supabase = getClient();
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Delete a file from storage.
 */
export async function deleteFile(path: string): Promise<void> {
  const supabase = getClient();
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) {
    console.error("Storage delete failed:", error.message);
  }
}

/**
 * Build a user's input path.
 */
export function buildInputPath(userId: string, filename: string): string {
  return `users/${userId}/input/${Date.now()}-${filename}`;
}

/**
 * Build a user's output path.
 */
export function buildOutputPath(userId: string, generationId: string): string {
  return `users/${userId}/output/${generationId}.webp`;
}
