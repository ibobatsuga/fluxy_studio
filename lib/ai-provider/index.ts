import { AIProvider } from "./types";
import { GeminiProvider } from "./gemini";

export * from "./types";

/**
 * Get the configured AI provider instance.
 * Currently defaults to Gemini. Can be extended with provider selection logic.
 */
export function getProvider(): AIProvider {
  const apiKey = process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    throw new Error(
      "GOOGLE_API_KEY is not configured. Set it in your .env.local file."
    );
  }

  return new GeminiProvider(apiKey);
}
