import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkCredits, deductCredits } from "@/lib/credit/engine";
import { getProvider } from "@/lib/ai-provider";
import { uploadFile, buildOutputPath } from "@/lib/storage/supabase";
import { GenerationStatus } from "@prisma/client";
import { z } from "zod";

// ─── Method guard ─────────────────────────────────────────────────────────────

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
export async function PUT() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
export async function PATCH() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
export async function DELETE() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

// ─── Request schema ───────────────────────────────────────────────────────────

const GenerateSchema = z.object({
  featureSlug: z.string().min(1).max(100),
  prompt: z.string().max(1000).optional().default(""),
  inputUrls: z.array(z.string().url()).max(5).optional().default([]),
});

const MAX_BODY_BYTES = 512 * 1024; // 512KB

// ─── Handler ─────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // ── 1. Authentication FIRST (before touching req body) ────────────────────
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  // ── 2. Body size guard ────────────────────────────────────────────────────
  const contentLength = req.headers.get("content-length");
  if (contentLength && parseInt(contentLength) > MAX_BODY_BYTES) {
    return NextResponse.json(
      { error: "Request body too large (max 512KB)" },
      { status: 413 }
    );
  }

  // ── 3. Parse + validate request ────────────────────────────────────────────
  let body: z.infer<typeof GenerateSchema>;
  try {
    const rawText = await req.text();
    if (!rawText || rawText.trim() === "") {
      return NextResponse.json(
        { error: "Request body is required" },
        { status: 400 }
      );
    }
    // Extra size check on raw text
    if (rawText.length > MAX_BODY_BYTES) {
      return NextResponse.json(
        { error: "Request body too large" },
        { status: 413 }
      );
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }
    body = GenerateSchema.parse(parsed);
  } catch (err: any) {
    return NextResponse.json(
      { error: "Invalid request", details: err.errors ?? err.message },
      { status: 400 }
    );
  }

  const { featureSlug, prompt, inputUrls } = body;

  // ── 4. Get feature from database ───────────────────────────────────────────
  const feature = await db.feature.findUnique({
    where: { slug: featureSlug, active: true },
  });

  if (!feature) {
    return NextResponse.json(
      { error: "Feature not found or inactive" },
      { status: 404 }
    );
  }

  // ── 5. Credit check ────────────────────────────────────────────────────────
  const { sufficient, balance } = await checkCredits(userId, feature.creditCost);
  if (!sufficient) {
    return NextResponse.json(
      {
        error: "Insufficient credits",
        required: feature.creditCost,
        balance,
      },
      { status: 402 }
    );
  }

  // ── 6. Create generation record (PENDING) ──────────────────────────────────
  const generation = await db.generation.create({
    data: {
      userId,
      featureId: feature.id,
      prompt: prompt || null,
      inputUrl: inputUrls[0] ?? null,
      creditUsed: feature.creditCost,
      status: GenerationStatus.PENDING,
      provider: "google-gemini",
      model: feature.aiModel ?? "gemini-2.0-flash",
    },
  });

  // ── 7. Update to PROCESSING ────────────────────────────────────────────────
  await db.generation.update({
    where: { id: generation.id },
    data: { status: GenerationStatus.PROCESSING },
  });

  // ── 8. Audit log ───────────────────────────────────────────────────────────
  await db.auditLog.create({
    data: {
      userId,
      action: "GENERATION_STARTED",
      resource: "generation",
      resourceId: generation.id,
      metadata: {
        featureSlug,
        creditCost: feature.creditCost,
        prompt: prompt?.slice(0, 100),
      },
    },
  });

  try {
    // ── 9. Call AI provider ─────────────────────────────────────────────────
    const provider = getProvider();

    let result;
    if (featureSlug === "image-to-prompt") {
      result = await provider.describeImage({ imageUrl: inputUrls[0] });

      await db.generation.update({
        where: { id: generation.id },
        data: {
          status: GenerationStatus.COMPLETED,
          outputUrl: null,
          metadata: { prompt: result.prompt },
        },
      });

      await deductCredits(userId, feature.creditCost, {
        featureId: feature.id,
        generationId: generation.id,
        description: `AI Generation: ${feature.name}`,
      });

      return NextResponse.json({
        id: generation.id,
        type: "text",
        result: result.prompt,
        creditUsed: feature.creditCost,
      });
    } else {
      const imageResult = await (provider as any).generateImage({
        prompt,
        referenceImages: inputUrls,
        featureSlug,
      });

      const outputBuffer = Buffer.from(imageResult.imageBase64, "base64");
      const outputPath = buildOutputPath(userId, generation.id);

      const { url: outputUrl } = await uploadFile(
        outputBuffer,
        outputPath,
        imageResult.mimeType
      );

      await db.generation.update({
        where: { id: generation.id },
        data: {
          status: GenerationStatus.COMPLETED,
          outputUrl,
          provider: imageResult.provider,
          model: imageResult.model,
        },
      });

      await deductCredits(userId, feature.creditCost, {
        featureId: feature.id,
        generationId: generation.id,
        description: `AI Generation: ${feature.name}`,
      });

      await db.auditLog.create({
        data: {
          userId,
          action: "GENERATION_COMPLETED",
          resource: "generation",
          resourceId: generation.id,
          metadata: { outputUrl, creditUsed: feature.creditCost },
        },
      });

      return NextResponse.json({
        id: generation.id,
        type: "image",
        outputUrl,
        creditUsed: feature.creditCost,
      });
    }
  } catch (err: any) {
    console.error("[Generation Error]", generation.id, err.message);

    await db.generation.update({
      where: { id: generation.id },
      data: {
        status: GenerationStatus.FAILED,
        error: err.message?.slice(0, 500) ?? "Unknown error",
      },
    });

    await db.auditLog.create({
      data: {
        userId,
        action: "GENERATION_FAILED",
        resource: "generation",
        resourceId: generation.id,
        metadata: { error: err.message?.slice(0, 200) },
      },
    });

    return NextResponse.json(
      {
        error: "Generation failed",
        details: err.message,
        generationId: generation.id,
      },
      { status: 500 }
    );
  }
}
