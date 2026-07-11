import { AIProvider } from "./types";
import { ReplicateProvider } from "./replicate";

export * from "./types";

/**
 * Get the configured AI provider instance.
 * Uses Replicate for professional background removal, face swap, and style transfer,
 * while utilizing Gemini's free tier for multimodal description.
 */
export function getProvider(): AIProvider {
  const replicateToken = process.env.REPLICATE_API_TOKEN;
  const geminiApiKey = process.env.GOOGLE_API_KEY;

  if (!replicateToken) {
    throw new Error(
      "REPLICATE_API_TOKEN is not configured. Set it in your .env.local file."
    );
  }

  if (!geminiApiKey) {
    throw new Error(
      "GOOGLE_API_KEY is not configured. Set it in your .env.local file."
    );
  }

  return new ReplicateProvider(replicateToken, geminiApiKey);
}
