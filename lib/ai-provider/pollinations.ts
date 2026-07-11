import {
  AIProvider,
  GenerateImageOptions,
  GenerateImageResult,
  DescribeImageOptions,
  DescribeImageResult,
} from "./types";
import { GeminiProvider, FEATURE_PROMPTS } from "./gemini";

export class PollinationsProvider implements AIProvider {
  name = "pollinations-ai";
  private gemini: GeminiProvider;

  constructor(geminiApiKey: string) {
    this.gemini = new GeminiProvider(geminiApiKey);
  }

  async generateImage(options: GenerateImageOptions & { featureSlug?: string }): Promise<GenerateImageResult> {
    let systemPrompt =
      FEATURE_PROMPTS[(options as any).featureSlug ?? ""] ??
      "Generate a high quality image based on the user prompt.";

    systemPrompt = systemPrompt.replace("{PROMPT}", options.prompt ?? "");

    // If there is a reference image, use Gemini's free tier to describe it
    // and append that description to the prompt so the Flux model can replicate it.
    let referenceDescription = "";
    if (options.referenceImages && options.referenceImages.length > 0) {
      try {
        const firstImg = options.referenceImages[0];
        const descResult = await this.gemini.describeImage({
          imageUrl: firstImg.startsWith("http") ? firstImg : undefined,
          imageBase64: firstImg.startsWith("data:") ? firstImg.split(",")[1] : undefined,
          mimeType: firstImg.startsWith("data:") ? firstImg.match(/:(.*?);/)?.[1] : undefined,
        });
        if (descResult && descResult.description) {
          referenceDescription = descResult.description;
        }
      } catch (err) {
        console.error("Failed to describe reference image with Gemini:", err);
      }
    }

    if (referenceDescription) {
      systemPrompt = `${systemPrompt}. The generated output must resemble this subject: ${referenceDescription}`;
    }

    // Encode prompt safely
    const encodedPrompt = encodeURIComponent(systemPrompt);
    const width = options.width ?? 1024;
    const height = options.height ?? 1024;
    const seed = Math.floor(Math.random() * 1000000);

    // Pollinations AI endpoint using state-of-the-art Flux model (100% free, no key required)
    const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&nologo=true&private=true&feed=true&seed=${seed}&model=flux`;

    const resp = await fetch(url);
    if (!resp.ok) {
      throw new Error(`Pollinations API error ${resp.status}: Failed to generate image`);
    }

    const buf = await resp.arrayBuffer();
    const base64 = Buffer.from(buf).toString("base64");
    const mimeType = resp.headers.get("content-type") ?? "image/jpeg";

    return {
      imageBase64: base64,
      mimeType,
      provider: this.name,
      model: "flux",
    };
  }

  async describeImage(options: DescribeImageOptions): Promise<DescribeImageResult> {
    // Fall back to Gemini since Gemini's text/multimodal capability is free on AI Studio free tier
    return this.gemini.describeImage(options);
  }
}
