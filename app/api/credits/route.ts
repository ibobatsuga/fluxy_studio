import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { getBalance, getCreditHistory } from "@/lib/credit/engine";

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

export async function GET() {
  // Auth check FIRST — no DB touched until authenticated
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [balance, history] = await Promise.all([
      getBalance(session.user.id),
      getCreditHistory(session.user.id, 10),
    ]);

    return NextResponse.json(
      { balance, history },
      {
        headers: {
          "Cache-Control": "private, no-cache, no-store, must-revalidate",
        },
      }
    );
  } catch (err: any) {
    console.error("[Credits API]", err.message);
    return NextResponse.json(
      { error: "Failed to fetch credits" },
      { status: 500 }
    );
  }
}
