"use server";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { z } from "zod";

const PurchaseSchema = z.object({
  packageId: z.enum(["starter", "creator", "agency"]),
});

const PACKAGES = {
  starter: { credits: 50, price: 49000, name: "Starter" },
  creator: { credits: 150, price: 119000, name: "Creator" },
  agency: { credits: 500, price: 299000, name: "Agency" },
};

/**
 * Initiates a Midtrans payment for a credit package.
 * Returns the Midtrans Snap payment URL.
 *
 * NOTE: Midtrans integration is a stub. Fill in MIDTRANS_SERVER_KEY
 * in .env.local and complete the Snap token creation.
 */
export async function purchaseCredits(
  prevState: { error?: string; paymentUrl?: string } | null,
  formData: FormData
) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const packageId = formData.get("packageId") as string;
  const parsed = PurchaseSchema.safeParse({ packageId });

  if (!parsed.success) {
    return { error: "Invalid package selected." };
  }

  const pkg = PACKAGES[parsed.data.packageId];
  const orderId = `FLUXY-${session.user.id.slice(-6).toUpperCase()}-${Date.now()}`;

  const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY;

  if (!MIDTRANS_SERVER_KEY || MIDTRANS_SERVER_KEY === "") {
    // Midtrans not yet configured — return a placeholder
    return {
      error: "Midtrans payment gateway belum dikonfigurasi. Set MIDTRANS_SERVER_KEY di .env.local.",
    };
  }

  try {
    // Midtrans Snap API
    const response = await fetch(
      "https://app.sandbox.midtrans.com/snap/v1/transactions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${Buffer.from(`${MIDTRANS_SERVER_KEY}:`).toString("base64")}`,
        },
        body: JSON.stringify({
          transaction_details: {
            order_id: orderId,
            gross_amount: pkg.price,
          },
          item_details: [
            {
              id: packageId,
              price: pkg.price,
              quantity: 1,
              name: `Fluxy AI ${pkg.name} — ${pkg.credits} Credits`,
            },
          ],
          customer_details: {
            email: session.user.email ?? "",
            first_name: session.user.name ?? "User",
          },
          callbacks: {
            finish: `${process.env.NEXTAUTH_URL}/billing?status=success&order=${orderId}`,
            error: `${process.env.NEXTAUTH_URL}/billing?status=error`,
            pending: `${process.env.NEXTAUTH_URL}/billing?status=pending`,
          },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      return { error: `Midtrans error: ${err}` };
    }

    const data = await response.json();
    return { paymentUrl: data.redirect_url };
  } catch (err: any) {
    return { error: err.message ?? "Payment initiation failed" };
  }
}
