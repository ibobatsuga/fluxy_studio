import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// ─── Method guards ────────────────────────────────────────────────────────────

export async function POST() {
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

// ─── Handler ─────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  // Auth FIRST
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);

    // Safe parse with bounds
    const rawLimit = parseInt(searchParams.get("limit") ?? "20");
    const limit = Math.max(1, Math.min(isNaN(rawLimit) ? 20 : rawLimit, 50));
    const cursor = searchParams.get("cursor") ?? undefined;

    // Validate cursor is a valid cuid-like string (alphanumeric)
    const safeCursor =
      cursor && /^[a-z0-9]+$/i.test(cursor) && cursor.length < 50
        ? cursor
        : undefined;

    const generations = await db.generation.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: limit,
      ...(safeCursor ? { skip: 1, cursor: { id: safeCursor } } : {}),
      include: {
        feature: { select: { name: true, slug: true, module: true } },
      },
    });

    const nextCursor =
      generations.length === limit
        ? generations[generations.length - 1].id
        : null;

    return NextResponse.json({ generations, nextCursor });
  } catch (err: any) {
    console.error("[History API]", err.message);
    return NextResponse.json(
      { error: "Failed to fetch history" },
      { status: 500 }
    );
  }
}
