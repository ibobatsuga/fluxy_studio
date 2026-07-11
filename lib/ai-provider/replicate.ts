import Replicate from "replicate";
import {
  AIProvider,
  GenerateImageOptions,
  GenerateImageResult,
  DescribeImageOptions,
  DescribeImageResult,
} from "./types";
import { GeminiProvider, FEATURE_PROMPTS } from "./gemini";

export class ReplicateProvider implements AIProvider {
  name = "replicate";
  private replicate: Replicate;
  private gemini: GeminiProvider;

  constructor(replicateToken: string, geminiApiKey: string) {
    this.replicate = new Replicate({
      auth: replicateToken,
    });
    this.gemini = new GeminiProvider(geminiApiKey);
  }

  async generateImage(options: GenerateImageOptions & { featureSlug?: string }): Promise<GenerateImageResult> {
    const slug = options.featureSlug ?? "";
    const refImages = options.referenceImages ?? [];

    let systemPrompt =
      FEATURE_PROMPTS[slug] ??
      "Generate a high quality image based on the user prompt.";
    systemPrompt = systemPrompt.replace("{PROMPT}", options.prompt ?? "");

    // ─── 1. BACKGROUND REMOVAL (remove-bg) ──────────────────────────────────
    if (slug === "remove-bg") {
      if (refImages.length === 0) {
        throw new Error("Reference image is required for background removal");
      }

      console.log("[Replicate] Removing background...");
      const output = await this.replicate.run(
        "lucataco/remove-bg:95fcc2a26d3899cd6c2691c900465aaeff466285a65c14638cc5f36f34befaf1",
        {
          input: {
            image: refImages[0],
          },
        }
      );

      return this.downloadOutput(output, "remove-bg", "tracer-b7");
    }

    // ─── 2. FACE SWAP (face-swap) ───────────────────────────────────────────
    if (slug === "face-swap") {
      if (refImages.length === 0) {
        throw new Error("At least one face reference image is required for face swap");
      }

      let targetUrl = refImages[0];
      let swapUrl = refImages[1] ?? refImages[0];

      // If only 1 image provided, generate a target background first, then swap face onto it
      if (refImages.length === 1) {
        console.log("[Replicate] Generating base target scene for face swap...");
        const targetOutput = await this.replicate.run(
          "stability-ai/sdxl:7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc",
          {
            input: {
              prompt: systemPrompt,
              width: options.width ?? 1024,
              height: options.height ?? 1024,
            },
          }
        );
        const generatedTarget = Array.isArray(targetOutput) ? (targetOutput[0] as string) : (targetOutput as unknown as string);
        if (!generatedTarget) {
          throw new Error("Failed to generate target scene for face swap");
        }
        targetUrl = generatedTarget;
      }

      console.log("[Replicate] Performing face swap...");
      const output = await this.replicate.run(
        "lucataco/faceswap:9a4298548422074c3f57258c5d544497314ae4112df80d116f0d2109e843d20d",
        {
          input: {
            target_image: targetUrl,
            swap_image: swapUrl,
          },
        }
      );

      return this.downloadOutput(output, "faceswap", "roop");
    }

    // ─── 3. IMAGE-TO-IMAGE / STYLE TRANSFER (sketch, caricature, umroh, etc.) ─
    if (refImages.length > 0) {
      console.log(`[Replicate] Running Image-to-Image for feature: ${slug}`);

      // Set prompt strength based on feature to keep original face structure/pose
      let promptStrength = 0.7; // default
      if (slug === "retouch") promptStrength = 0.2;
      if (slug === "photo-enhance") promptStrength = 0.15;
      if (slug === "sketch") promptStrength = 0.75;
      if (slug === "caricature") promptStrength = 0.65;
      if (slug === "umroh") promptStrength = 0.55;
      if (slug === "prewedding") promptStrength = 0.55;
      if (slug === "child" || slug === "baby") promptStrength = 0.6;

      // Expand prompt with Gemini gender/appearance context for human photo replacements
      let finalPrompt = systemPrompt;
      if (["umroh", "prewedding", "barber", "maternity", "sketch", "caricature"].includes(slug)) {
        try {
          const desc = await this.gemini.describeImage({
            imageUrl: refImages[0].startsWith("http") ? refImages[0] : undefined,
            imageBase64: refImages[0].startsWith("data:") ? refImages[0].split(",")[1] : undefined,
            mimeType: refImages[0].startsWith("data:") ? refImages[0].match(/:(.*?);/)?.[1] : undefined,
          });
          if (desc && desc.description) {
            finalPrompt = `${systemPrompt}. The subject is: ${desc.description}`;
          }
        } catch (e) {
          console.error("Gemini description skipped:", e);
        }
      }

      const output = await this.replicate.run(
        "stability-ai/sdxl:7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc",
        {
          input: {
            prompt: finalPrompt,
            image: refImages[0],
            prompt_strength: promptStrength,
            width: options.width ?? 1024,
            height: options.height ?? 1024,
          },
        }
      );

      return this.downloadOutput(output, "sdxl", "sdxl-img2img");
    }

    // ─── 4. TEXT-TO-IMAGE FALLBACK ───────────────────────────────────────────
    console.log("[Replicate] Running Text-to-Image...");
    const output = await this.replicate.run(
      "stability-ai/sdxl:7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc",
      {
        input: {
          prompt: systemPrompt,
          width: options.width ?? 1024,
          height: options.height ?? 1024,
        },
      }
    );

    return this.downloadOutput(output, "sdxl", "sdxl-txt2img");
  }

  async describeImage(options: DescribeImageOptions): Promise<DescribeImageResult> {
    return this.gemini.describeImage(options);
  }

  // Helper: Download Replicate URL and convert to Base64
  private async downloadOutput(output: any, providerName: string, modelName: string): Promise<GenerateImageResult> {
    const imageUrl = Array.isArray(output) ? output[0] : (output as string);
    if (!imageUrl) {
      throw new Error("No output image generated from Replicate");
    }

    const resp = await fetch(imageUrl);
    if (!resp.ok) {
      throw new Error(`Failed to download image from Replicate: HTTP ${resp.status}`);
    }

    const buf = await resp.arrayBuffer();
    const base64 = Buffer.from(buf).toString("base64");
    const mimeType = resp.headers.get("content-type") ?? "image/jpeg";

    return {
      imageBase64: base64,
      mimeType,
      provider: providerName,
      model: modelName,
    };
  }
}
