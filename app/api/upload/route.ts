import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import { uploadFile, buildInputPath } from "@/lib/storage/supabase";

// ─── Method guards ────────────────────────────────────────────────────────────

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

// ─── Config ──────────────────────────────────────────────────────────────────

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const MAGIC_BYTES: Record<string, number[]> = {
  "image/jpeg": [0xff, 0xd8, 0xff],
  "image/png": [0x89, 0x50, 0x4e, 0x47],
  "image/webp": [0x52, 0x49, 0x46, 0x46],
};

function validateMagicBytes(buffer: Buffer, mimeType: string): boolean {
  const magic = MAGIC_BYTES[mimeType];
  if (!magic) return false;
  return magic.every((byte, i) => buffer[i] === byte);
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // ── 1. Auth FIRST ──────────────────────────────────────────────────────────
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── 2. Content-Type check ──────────────────────────────────────────────────
  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json(
      { error: "Content-Type must be multipart/form-data" },
      { status: 400 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // ── 3. MIME type check ────────────────────────────────────────────────────
    if (!ALLOWED_TYPES[file.type]) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPG, PNG, WebP" },
        { status: 400 }
      );
    }

    // ── 4. Size check ─────────────────────────────────────────────────────────
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: "File too large. Maximum 10MB" },
        { status: 413 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        { error: "File is empty" },
        { status: 400 }
      );
    }

    // ── 5. Read buffer + magic byte validation ────────────────────────────────
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (!validateMagicBytes(buffer, file.type)) {
      return NextResponse.json(
        { error: "Invalid file content. File signature mismatch." },
        { status: 400 }
      );
    }

    // ── 6. Upload to Supabase Storage ─────────────────────────────────────────
    const ext = ALLOWED_TYPES[file.type];
    const safeFilename = `upload.${ext}`;
    const storagePath = buildInputPath(session.user.id, safeFilename);

    const { url, path } = await uploadFile(buffer, storagePath, file.type);

    return NextResponse.json({ url, path, size: file.size, type: file.type });
  } catch (err: any) {
    console.error("[Upload Error]", err.message);
    return NextResponse.json(
      { error: err.message ?? "Upload failed" },
      { status: 500 }
    );
  }
}
