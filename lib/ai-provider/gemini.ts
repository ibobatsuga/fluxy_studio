import {
  AIProvider,
  GenerateImageOptions,
  GenerateImageResult,
  DescribeImageOptions,
  DescribeImageResult,
} from "./types";

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";

// Feature slug → Gemini system prompt
export const FEATURE_PROMPTS: Record<string, string> = {
  "remove-bg":
    "Remove the background from this image completely. Make the background fully transparent. Keep the subject sharp and intact.",
  "retouch":
    "Professionally retouch this portrait photo. Smooth skin blemishes, enhance facial features naturally, improve lighting and colors. Keep it realistic.",
  "photo-enhance":
    "Restore and enhance this photo. Fix blur, noise, low resolution, and fading. Make it sharp, clear, and vibrant.",
  "sketch":
    "Convert this photo into a detailed pencil sketch art style. Keep fine details and shading.",
  "caricature":
    "Transform this photo into a beautiful artistic illustration or caricature style. Keep recognizable features.",
  "anime-real":
    "Convert this anime/cartoon image into a realistic photographic style while keeping the person's features.",
  "magic-edit":
    "Edit this image based on the user's instruction: {PROMPT}. Make the change natural and seamless.",
  "change-angle":
    "Change the camera angle or perspective of this image as described: {PROMPT}. Keep the subject realistic.",
  "photo-merge":
    "Seamlessly merge these reference images into one cohesive composition: {PROMPT}.",
  "face-swap":
    "Carefully swap the face from the reference image onto the target. Keep natural lighting, skin tone, and realistic blending.",
  "product-studio":
    "Create a professional studio-quality product photo. Clean white/neutral background, perfect lighting: {PROMPT}.",
  "fashion-ai":
    "Create a professional fashion photo with the clothing item shown on a model: {PROMPT}.",
  "mockup":
    "Apply the design/logo onto the product mockup template naturally: {PROMPT}.",
  "virtual-tryon":
    "Virtually try on the clothing item from the reference image onto the person: {PROMPT}.",
  "pose-change":
    "Change the person's pose as described: {PROMPT}. Keep the person's identity and clothing intact.",
  "passport":
    "Create a professional passport/ID photo: white background, front-facing, formal attire, proper lighting.",
  "barber":
    "Apply the hairstyle from the reference image onto the person's photo: {PROMPT}.",
  "outpaint":
    "Extend and expand this image outward in all directions while maintaining the style and content naturally.",
  "prewedding":
    "Create a beautiful pre-wedding themed photo with romantic setting: {PROMPT}.",
  "couple":
    "Create a natural, romantic couple portrait photo: {PROMPT}.",
  "baby":
    "Create a cute, safe newborn studio photo with soft lighting and gentle colors: {PROMPT}.",
  "child":
    "Create a fun, natural child portrait photo with a suitable background: {PROMPT}.",
  "umroh":
    "Create a beautiful photo with Islamic/spiritual theme, Mecca setting or Masjid background: {PROMPT}.",
  "maternity":
    "Create an artistic, beautiful maternity portrait photo with soft lighting: {PROMPT}.",
  "banner":
    "Create a professional marketing banner image (no text). Vibrant colors, product-focused, clean design: {PROMPT}.",
  "carousel":
    "Create a consistent set of social media carousel slide backgrounds. Clean, branded design: {PROMPT}.",
  "image-to-prompt":
    "Analyze this image in detail and generate a comprehensive AI image generation prompt that would recreate it.",
};

export class GeminiProvider implements AIProvider {
  name = "google-gemini";
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateImage(options: GenerateImageOptions & { featureSlug?: string }): Promise<GenerateImageResult> {
    const model = "gemini-2.5-flash-image";

    // Build system prompt from feature
    let systemPrompt =
      FEATURE_PROMPTS[(options as any).featureSlug ?? ""] ??
      "Generate a high quality image based on the user prompt.";

    // Replace {PROMPT} placeholder with user prompt
    systemPrompt = systemPrompt.replace("{PROMPT}", options.prompt ?? "");

    // Build parts array
    const parts: any[] = [];

    // Add reference images if provided
    if (options.referenceImages && options.referenceImages.length > 0) {
      for (const img of options.referenceImages) {
        if (img.startsWith("data:")) {
          // Already base64 data URL
          const [header, data] = img.split(",");
          const mimeType = header.match(/:(.*?);/)?.[1] ?? "image/jpeg";
          parts.push({
            inlineData: { mimeType, data },
          });
        } else if (img.startsWith("http")) {
          // Fetch remote URL and convert to base64
          const resp = await fetch(img);
          const buf = await resp.arrayBuffer();
          const base64 = Buffer.from(buf).toString("base64");
          const mimeType = resp.headers.get("content-type") ?? "image/jpeg";
          parts.push({ inlineData: { mimeType, data: base64 } });
        }
      }
    }

    // Add the text prompt
    parts.push({ text: systemPrompt });

    const response = await fetch(
      `${GEMINI_API_BASE}/models/${model}:generateContent?key=${this.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts }],
          generationConfig: {
            responseModalities: ["IMAGE", "TEXT"],
          },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Gemini API error ${response.status}: ${err}`);
    }

    const data = await response.json();

    // Check for safety/prompt blocks
    const candidate = data.candidates?.[0];
    if (!candidate) {
      const blockReason = data.promptFeedback?.blockReason;
      throw new Error(
        blockReason
          ? `Request blocked by Gemini safety filter: ${blockReason}`
          : "Gemini returned no candidates — the request may have been filtered"
      );
    }

    const finishReason = candidate.finishReason;
    if (finishReason === "SAFETY") {
      throw new Error("Generation blocked by safety policy. Try a different image or prompt.");
    }

    const imagePart = candidate?.content?.parts?.find(
      (p: any) => p.inlineData?.mimeType?.startsWith("image/")
    );

    if (!imagePart) {
      // Gemini sometimes returns a text explanation instead of an image
      const textPart = candidate?.content?.parts?.find((p: any) => p.text);
      const hint = textPart?.text?.slice(0, 200) ?? "No image in response";
      throw new Error(
        `Gemini did not return an image. ${hint}. Try a different prompt or model.`
      );
    }

    return {
      imageBase64: imagePart.inlineData.data,
      mimeType: imagePart.inlineData.mimeType,
      provider: this.name,
      model,
      metadata: { candidateIndex: 0 },
    };
  }

  async describeImage(options: DescribeImageOptions): Promise<DescribeImageResult> {
    const model = "gemini-2.0-flash";

    const parts: any[] = [];

    // Add image
    if (options.imageBase64) {
      parts.push({
        inlineData: {
          mimeType: options.mimeType ?? "image/jpeg",
          data: options.imageBase64,
        },
      });
    } else if (options.imageUrl) {
      const resp = await fetch(options.imageUrl);
      const buf = await resp.arrayBuffer();
      const base64 = Buffer.from(buf).toString("base64");
      const mimeType = resp.headers.get("content-type") ?? "image/jpeg";
      parts.push({ inlineData: { mimeType, data: base64 } });
    }

    parts.push({
      text: "Analyze this image in detail and generate a comprehensive AI image generation prompt in English that would recreate it. Also provide a short description.",
    });

    const response = await fetch(
      `${GEMINI_API_BASE}/models/${model}:generateContent?key=${this.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts }],
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Gemini API error ${response.status}: ${err}`);
    }

    const data = await response.json();
    const text =
      data.candidates?.[0]?.content?.parts?.[0]?.text ?? "No description";

    return {
      prompt: text,
      description: text,
      provider: this.name,
      model,
    };
  }
}
