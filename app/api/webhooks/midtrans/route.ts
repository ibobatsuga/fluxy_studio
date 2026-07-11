import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { addCredits } from "@/lib/credit/engine";
import crypto from "crypto";

const PACKAGES: Record<string, { credits: number; name: string }> = {
  starter: { credits: 50, name: "Starter" },
  creator: { credits: 150, name: "Creator" },
  agency: { credits: 500, name: "Agency" },
};

/**
 * Midtrans payment notification webhook.
 * Called by Midtrans when a payment is completed/failed/pending.
 *
 * Set webhook URL in Midtrans Dashboard to:
 * https://yourdomain.com/api/webhooks/midtrans
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
    } = body;

    // ── 1. Verify signature ─────────────────────────────────────────────────
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    if (!serverKey) {
      return NextResponse.json({ error: "Midtrans not configured" }, { status: 500 });
    }

    const expectedSignature = crypto
      .createHash("sha512")
      .update(`${order_id}${status_code}${gross_amount}${serverKey}`)
      .digest("hex");

    if (signature_key !== expectedSignature) {
      console.error("[Webhook] Invalid Midtrans signature", order_id);
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }

    // ── 2. Extract user ID from order ID ────────────────────────────────────
    // Format: FLUXY-{userId_last6}-{timestamp}
    // We need to look up by order_id from a payment record
    // For MVP, we store order_id in metadata of a pending transaction

    const isPaid =
      (transaction_status === "capture" && fraud_status === "accept") ||
      transaction_status === "settlement";

    const isFailed =
      transaction_status === "cancel" ||
      transaction_status === "deny" ||
      transaction_status === "expire";

    // Find matching pending payment record
    // Look for a transaction with this order_id in description
    const pendingTx = await db.creditTransaction.findFirst({
      where: {
        description: { contains: order_id },
        type: "PURCHASE",
        amount: 0, // pending payments have amount = 0 initially
      },
    });

    if (!pendingTx) {
      // Try to extract from order_id pattern
      console.log("[Webhook] No pending transaction found for:", order_id);
      return NextResponse.json({ received: true });
    }

    if (isPaid && pendingTx.amount === 0) {
      // Determine package from gross_amount
      const amountMap: Record<number, string> = {
        49000: "starter",
        119000: "creator",
        299000: "agency",
      };
      const packageId = amountMap[parseInt(gross_amount)] ?? "starter";
      const pkg = PACKAGES[packageId];

      // Add credits to user
      await addCredits(pendingTx.userId, pkg.credits, {
        type: "PURCHASE" as any,
        description: `Purchase: ${pkg.name} Package (${order_id})`,
      });

      // Audit log
      await db.auditLog.create({
        data: {
          userId: pendingTx.userId,
          action: "PAYMENT_SUCCESS",
          resource: "creditTransaction",
          metadata: { orderId: order_id, amount: gross_amount, credits: pkg.credits },
        },
      });
    } else if (isFailed) {
      await db.auditLog.create({
        data: {
          userId: pendingTx.userId,
          action: "PAYMENT_FAILED",
          resource: "creditTransaction",
          metadata: { orderId: order_id, status: transaction_status },
        },
      });
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("[Midtrans Webhook Error]", err);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
