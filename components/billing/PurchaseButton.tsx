"use client";

import { useActionState, useEffect } from "react";
import { purchaseCredits } from "@/app/actions/billing";
import { Loader2 } from "lucide-react";

interface PurchaseBtnProps {
  packageId: string;
  name: string;
  popular?: boolean;
}

export default function PurchaseButton({ packageId, name, popular }: PurchaseBtnProps) {
  const [state, action, isPending] = useActionState(purchaseCredits, null);

  // Redirect to Midtrans Snap on success
  useEffect(() => {
    if (state?.paymentUrl) {
      window.location.href = state.paymentUrl;
    }
  }, [state?.paymentUrl]);

  return (
    <form action={action}>
      <input type="hidden" name="packageId" value={packageId} />
      {state?.error && (
        <p className="text-red-500 text-xs font-medium mb-2 text-center">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={isPending}
        className={`w-full py-3.5 rounded-xl font-black text-sm transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
          popular
            ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-600/25"
            : "bg-slate-900 text-white hover:bg-slate-700"
        }`}
      >
        {isPending ? (
          <><Loader2 size={14} className="animate-spin" /> Processing...</>
        ) : (
          `Buy ${name}`
        )}
      </button>
    </form>
  );
}
