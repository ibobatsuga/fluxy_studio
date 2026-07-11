/**
 * Credit Engine — Core Business Logic
 *
 * RULE: Frontend tidak boleh mengurangi kredit.
 * Only this backend module may modify credit balances.
 */

import { db } from "@/lib/db";
import { TransactionType } from "@prisma/client";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CreditResult =
  | { success: true; balance: number }
  | { success: false; error: string };

// ─── Check ────────────────────────────────────────────────────────────────────

/**
 * Check if user has enough credits for an operation.
 * Does NOT modify the database.
 */
export async function checkCredits(
  userId: string,
  amount: number
): Promise<{ sufficient: boolean; balance: number }> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { credits: true },
  });

  if (!user) {
    return { sufficient: false, balance: 0 };
  }

  return {
    sufficient: user.credits >= amount,
    balance: user.credits,
  };
}

// ─── Deduct ───────────────────────────────────────────────────────────────────

/**
 * Atomically deduct credits from a user and record the transaction.
 * Uses a DB transaction to prevent race conditions.
 */
export async function deductCredits(
  userId: string,
  amount: number,
  options: {
    featureId?: string;
    generationId?: string;
    description?: string;
  } = {}
): Promise<CreditResult> {
  try {
    const result = await db.$transaction(async (tx) => {
      // Re-read inside transaction to prevent race conditions
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { credits: true },
      });

      if (!user) throw new Error("User not found");
      if (user.credits < amount) throw new Error("Insufficient credits");

      const balanceBefore = user.credits;
      const balanceAfter = user.credits - amount;

      // Update user balance
      const updated = await tx.user.update({
        where: { id: userId },
        data: { credits: { decrement: amount } },
        select: { credits: true },
      });

      // Record transaction
      await tx.creditTransaction.create({
        data: {
          userId,
          type: TransactionType.DEDUCT,
          amount: -amount,
          balanceBefore,
          balanceAfter,
          description:
            options.description ?? `AI generation credit deduction`,
          featureId: options.featureId ?? null,
          generationId: options.generationId ?? null,
        },
      });

      return updated.credits;
    });

    return { success: true, balance: result };
  } catch (err: any) {
    return { success: false, error: err.message ?? "Credit deduction failed" };
  }
}

// ─── Add ──────────────────────────────────────────────────────────────────────

/**
 * Add credits to a user account (purchase, bonus, refund).
 */
export async function addCredits(
  userId: string,
  amount: number,
  options: {
    type?: TransactionType;
    description?: string;
    generationId?: string;
  } = {}
): Promise<CreditResult> {
  try {
    const result = await db.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { credits: true },
      });

      if (!user) throw new Error("User not found");

      const balanceBefore = user.credits;
      const balanceAfter = user.credits + amount;

      const updated = await tx.user.update({
        where: { id: userId },
        data: { credits: { increment: amount } },
        select: { credits: true },
      });

      await tx.creditTransaction.create({
        data: {
          userId,
          type: options.type ?? TransactionType.BONUS,
          amount: amount,
          balanceBefore,
          balanceAfter,
          description: options.description ?? `Credits added`,
          generationId: options.generationId ?? null,
        },
      });

      return updated.credits;
    });

    return { success: true, balance: result };
  } catch (err: any) {
    return { success: false, error: err.message ?? "Credit addition failed" };
  }
}

// ─── Refund ───────────────────────────────────────────────────────────────────

/**
 * Refund credits when a generation fails.
 */
export async function refundCredits(
  userId: string,
  amount: number,
  generationId: string
): Promise<CreditResult> {
  return addCredits(userId, amount, {
    type: TransactionType.REFUND,
    description: `Refund for failed generation`,
    generationId,
  });
}

// ─── Get Balance ──────────────────────────────────────────────────────────────

/**
 * Get current credit balance for a user.
 */
export async function getBalance(userId: string): Promise<number | null> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { credits: true },
  });
  return user?.credits ?? null;
}

// ─── Get History ─────────────────────────────────────────────────────────────

/**
 * Get credit transaction history for a user.
 */
export async function getCreditHistory(userId: string, limit = 20) {
  return db.creditTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      feature: { select: { name: true, slug: true } },
    },
  });
}
