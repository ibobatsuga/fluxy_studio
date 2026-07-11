import { AIProvider } from "./types";
import { PollinationsProvider } from "./pollinations";

export * from "./types";

/**
 * Get the configured AI provider instance.
 * Switch to Pollinations to allow free, high-quality image generation (no billing constraints)
 * while utilizing Gemini's free tier for multimodal description.
 */
export function getProvider(): AIProvider {
  const apiKey = process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    throw new Error(
      "GOOGLE_API_KEY is not configured. Set it in your .env.local file."
    );
  }

  return new PollinationsProvider(apiKey);
}
