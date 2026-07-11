import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { getCreditHistory, getBalance } from "@/lib/credit/engine";
import PurchaseButton from "@/components/billing/PurchaseButton";
import { Zap, CreditCard, TrendingUp, ArrowUpRight, ArrowDownRight, Gift } from "lucide-react";

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    credits: 50,
    price: "Rp49.000",
    priceNum: 49000,
    popular: false,
    color: "from-slate-600 to-slate-800",
    features: ["50 AI Credits", "All 27 AI Tools", "Supabase Storage", "No expiry"],
  },
  {
    id: "creator",
    name: "Creator",
    credits: 150,
    price: "Rp119.000",
    priceNum: 119000,
    popular: true,
    color: "from-indigo-600 to-purple-600",
    features: ["150 AI Credits", "All 27 AI Tools", "Priority generation", "No expiry"],
  },
  {
    id: "agency",
    name: "Agency",
    credits: 500,
    price: "Rp299.000",
    priceNum: 299000,
    popular: false,
    color: "from-purple-700 to-pink-600",
    features: ["500 AI Credits", "All 27 AI Tools", "Batch generation", "API access (soon)"],
  },
];

const TX_ICONS: Record<string, React.ReactNode> = {
  PURCHASE: <ArrowUpRight size={14} className="text-green-500" />,
  DEDUCT: <ArrowDownRight size={14} className="text-red-400" />,
  REFUND: <ArrowUpRight size={14} className="text-blue-500" />,
  BONUS: <Gift size={14} className="text-purple-500" />,
};

const TX_COLORS: Record<string, string> = {
  PURCHASE: "text-green-600",
  DEDUCT: "text-red-500",
  REFUND: "text-blue-600",
  BONUS: "text-purple-600",
};

export default async function BillingPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");

  const [balance, history] = await Promise.all([
    getBalance(userId),
    getCreditHistory(userId, 15),
  ]);

  return (
    <AppShell>
      <div className="space-y-10 max-w-5xl">

        {/* Header */}
        <div>
          <h1 className="text-4xl font-black">Billing & Credits</h1>
          <p className="mt-2 text-slate-500">Top up credits to continue creating.</p>
        </div>

        {/* Balance card */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-8 text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-indigo-200 text-sm font-semibold">Current Balance</p>
              <div className="flex items-end gap-3 mt-2">
                <span className="text-6xl font-black">{(balance ?? 0).toFixed(1)}</span>
                <div className="flex items-center gap-1.5 mb-2">
                  <Zap size={18} className="text-yellow-300" />
                  <span className="text-indigo-200 font-semibold">credits</span>
                </div>
              </div>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center">
              <CreditCard size={28} />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-4">
            {[
              { label: "Total Transactions", value: history.length },
              { label: "Credits Spent", value: history.filter(t => t.type === "DEDUCT").reduce((s, t) => s + Math.abs(t.amount), 0).toFixed(1) },
              { label: "Credits Purchased", value: history.filter(t => t.type === "PURCHASE").reduce((s, t) => s + t.amount, 0).toFixed(1) },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/10 rounded-2xl p-4">
                <p className="text-xs text-indigo-200">{stat.label}</p>
                <p className="text-2xl font-black mt-1">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Plans */}
        <div>
          <h2 className="text-2xl font-black mb-6">Choose a Package</h2>
          <div className="grid grid-cols-3 gap-6">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`relative rounded-3xl overflow-hidden border-2 ${plan.popular ? "border-indigo-500 shadow-xl shadow-indigo-500/20" : "border-slate-200"}`}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0 bg-indigo-600 text-white text-xs font-black text-center py-2">
                    MOST POPULAR
                  </div>
                )}

                <div className={`bg-gradient-to-br ${plan.color} p-8 ${plan.popular ? "pt-12" : ""} text-white`}>
                  <p className="font-black text-2xl">{plan.name}</p>
                  <div className="flex items-end gap-1 mt-3">
                    <Zap size={20} className="text-yellow-300 mb-1" />
                    <span className="text-4xl font-black">{plan.credits}</span>
                    <span className="text-white/70 mb-1">credits</span>
                  </div>
                  <p className="text-xl font-bold mt-1 text-white/90">{plan.price}</p>
                </div>

                <div className="bg-white p-6">
                  <ul className="space-y-2.5 mb-6">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm">
                        <div className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                          <TrendingUp size={10} />
                        </div>
                        <span className="text-slate-700">{f}</span>
                      </li>
                    ))}
                  </ul>

                  <PurchaseButton
                    packageId={plan.id}
                    name={plan.name}
                    popular={plan.popular}
                  />
                </div>
              </div>
            ))}
          </div>

          <p className="mt-4 text-center text-xs text-slate-400">
            Pembayaran via Midtrans · Visa, Mastercard, GoPay, OVO, DANA, Transfer Bank
          </p>
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-3xl border p-8">
          <h2 className="text-xl font-black mb-6">Transaction History</h2>

          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mb-4">
                <CreditCard size={24} className="text-slate-400" />
              </div>
              <p className="font-bold text-slate-600">No transactions yet</p>
              <p className="text-sm text-slate-400 mt-1">
                Transactions will appear here after your first purchase or generation.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center">
                      {TX_ICONS[tx.type] ?? TX_ICONS.DEDUCT}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-slate-800">
                        {tx.description ?? tx.type}
                      </p>
                      <p className="text-xs text-slate-400">
                        {new Date(tx.createdAt).toLocaleString("id-ID")}
                        {tx.feature && ` · ${tx.feature.name}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-black text-sm ${TX_COLORS[tx.type] ?? "text-slate-600"}`}>
                      {tx.amount > 0 ? "+" : ""}{tx.amount.toFixed(1)}
                    </p>
                    <p className="text-xs text-slate-400">
                      Balance: {tx.balanceAfter.toFixed(1)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
