import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import AppShell from "@/components/layout/AppShell";
import {
  Users,
  Sparkles,
  TrendingUp,
  Activity,
  Shield,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string }> = {
    COMPLETED: { label: "Done", color: "bg-green-100 text-green-700" },
    FAILED: { label: "Failed", color: "bg-red-100 text-red-600" },
    PROCESSING: { label: "Processing", color: "bg-blue-100 text-blue-600" },
    PENDING: { label: "Pending", color: "bg-yellow-100 text-yellow-700" },
  };
  const c = map[status] ?? map.PENDING;
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${c.color}`}>
      {c.label}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminPanel() {
  // Guard: Admin only
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Fetch real stats
  const [
    totalUsers,
    totalGenerations,
    completedGenerations,
    failedGenerations,
    recentUsers,
    recentGenerations,
    topFeatures,
  ] = await Promise.all([
    db.user.count(),
    db.generation.count(),
    db.generation.count({ where: { status: "COMPLETED" } }),
    db.generation.count({ where: { status: "FAILED" } }),
    db.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, name: true, email: true, credits: true, role: true, createdAt: true },
    }),
    db.generation.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        user: { select: { name: true, email: true } },
        feature: { select: { name: true } },
      },
    }),
    db.generation.groupBy({
      by: ["featureId"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    }),
  ]);

  const creditsConsumed = await db.creditTransaction.aggregate({
    where: { type: "DEDUCT" },
    _sum: { amount: true },
  });
  const totalCreditsUsed = Math.abs(creditsConsumed._sum.amount ?? 0);

  const stats = [
    { label: "Total Users", value: totalUsers, icon: Users, color: "bg-indigo-50 text-indigo-600" },
    { label: "Generations", value: totalGenerations, icon: Sparkles, color: "bg-purple-50 text-purple-600" },
    { label: "Success Rate", value: totalGenerations > 0 ? `${Math.round((completedGenerations / totalGenerations) * 100)}%` : "—", icon: TrendingUp, color: "bg-green-50 text-green-600" },
    { label: "Credits Used", value: totalCreditsUsed.toFixed(1), icon: Activity, color: "bg-orange-50 text-orange-600" },
  ];

  return (
    <AppShell>
      <div className="space-y-8 max-w-6xl">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
            <Shield size={22} />
          </div>
          <div>
            <h1 className="text-4xl font-black">Admin Panel</h1>
            <p className="text-sm text-slate-500">Platform management & analytics</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-5">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="bg-white rounded-3xl border p-6 shadow-sm">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${s.color}`}>
                  <Icon size={18} />
                </div>
                <p className="mt-4 text-xs text-slate-400 font-semibold uppercase tracking-wide">{s.label}</p>
                <p className="text-3xl font-black mt-1">{s.value}</p>
              </div>
            );
          })}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-3 gap-6">

          {/* Recent Users */}
          <div className="col-span-1 bg-white rounded-3xl border p-6">
            <h2 className="font-black text-lg mb-5">Recent Users</h2>
            <div className="space-y-3">
              {recentUsers.map((user) => (
                <div key={user.id} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-white flex items-center justify-center font-black text-xs shrink-0">
                    {user.name?.[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm truncate">{user.name ?? "—"}</p>
                    <p className="text-xs text-slate-400 truncate">{user.email}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-black text-indigo-600">{user.credits.toFixed(0)}</p>
                    {user.role === "ADMIN" && (
                      <span className="text-xs text-orange-500 font-bold">ADMIN</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Generations */}
          <div className="col-span-2 bg-white rounded-3xl border p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-black text-lg">Recent Generations</h2>
              <div className="flex items-center gap-3 text-xs font-semibold text-slate-400">
                <span className="flex items-center gap-1">
                  <CheckCircle2 size={12} className="text-green-500" /> {completedGenerations}
                </span>
                <span className="flex items-center gap-1">
                  <XCircle size={12} className="text-red-400" /> {failedGenerations}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={12} className="text-yellow-500" /> {totalGenerations - completedGenerations - failedGenerations}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              {recentGenerations.map((gen) => (
                <div
                  key={gen.id}
                  className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {gen.outputUrl ? (
                      <img
                        src={gen.outputUrl}
                        alt=""
                        className="w-9 h-9 rounded-xl object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-xl bg-slate-100 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{gen.feature.name}</p>
                      <p className="text-xs text-slate-400 truncate">{gen.user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <StatusPill status={gen.status} />
                    <span className="text-xs text-slate-400">{gen.creditUsed}cr</span>
                  </div>
                </div>
              ))}

              {recentGenerations.length === 0 && (
                <p className="text-center text-slate-400 py-10 text-sm">No generations yet.</p>
              )}
            </div>
          </div>

        </div>

        {/* Feature management table */}
        <div className="bg-white rounded-3xl border p-8">
          <h2 className="font-black text-xl mb-6">Feature Catalog</h2>
          <FeatureTable />
        </div>

      </div>
    </AppShell>
  );
}

// ─── Feature Table (Server Component) ────────────────────────────────────────

async function FeatureTable() {
  const features = await db.feature.findMany({
    orderBy: [{ module: "asc" }, { creditCost: "asc" }],
    include: { _count: { select: { generations: true } } },
  });

  const MODULE_COLORS: Record<string, string> = {
    A: "bg-blue-100 text-blue-700",
    B: "bg-indigo-100 text-indigo-700",
    C: "bg-purple-100 text-purple-700",
    D: "bg-pink-100 text-pink-700",
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-slate-400 uppercase tracking-wide border-b border-slate-100">
            <th className="pb-3 font-semibold">Feature</th>
            <th className="pb-3 font-semibold">Module</th>
            <th className="pb-3 font-semibold">Credit</th>
            <th className="pb-3 font-semibold">Safety</th>
            <th className="pb-3 font-semibold">Generations</th>
            <th className="pb-3 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody>
          {features.map((f) => (
            <tr key={f.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition">
              <td className="py-3.5">
                <div>
                  <p className="font-bold">{f.name}</p>
                  <p className="text-xs text-slate-400">{f.slug}</p>
                </div>
              </td>
              <td className="py-3.5">
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${MODULE_COLORS[f.module] ?? ""}`}>
                  Module {f.module}
                </span>
              </td>
              <td className="py-3.5 font-black text-indigo-600">{f.creditCost}</td>
              <td className="py-3.5">
                <span className={`font-semibold ${f.safetyLevel === 3 ? "text-red-500" : f.safetyLevel === 2 ? "text-yellow-600" : "text-green-600"}`}>
                  L{f.safetyLevel}
                </span>
              </td>
              <td className="py-3.5 font-semibold">{f._count.generations}</td>
              <td className="py-3.5">
                {f.active ? (
                  <span className="flex items-center gap-1 text-green-600 font-semibold">
                    <CheckCircle2 size={13} /> Active
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-red-400 font-semibold">
                    <XCircle size={13} /> Inactive
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
