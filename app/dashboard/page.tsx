import { auth } from "@/auth";
import { db } from "@/lib/db";
import AppShell from "@/components/layout/AppShell";
import Link from "next/link";
import {
  ImageIcon,
  Sparkles,
  TrendingUp,
  Clock,
  ArrowRight,
  Zap,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";

// ─── Status badge helper ──────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
    COMPLETED: {
      icon: <CheckCircle2 size={12} />,
      color: "text-green-600 bg-green-50",
      label: "Done",
    },
    FAILED: {
      icon: <XCircle size={12} />,
      color: "text-red-500 bg-red-50",
      label: "Failed",
    },
    PROCESSING: {
      icon: <Loader2 size={12} className="animate-spin" />,
      color: "text-blue-500 bg-blue-50",
      label: "Processing",
    },
    PENDING: {
      icon: <Clock size={12} />,
      color: "text-yellow-600 bg-yellow-50",
      label: "Pending",
    },
  };

  const config = map[status] ?? map.PENDING;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${config.color}`}>
      {config.icon} {config.label}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function Dashboard() {
  const session = await auth();

  // Middleware handles redirect, but add a safety guard here too
  const userId = session?.user?.id;
  if (!userId) {
    const { redirect } = await import("next/navigation");
    redirect("/login");
  }

  const userName = session?.user?.name ?? "there";
  const credits = session?.user?.credits ?? 0;

  // Fetch real stats
  const [totalGenerations, successfulGenerations, recentGenerations] =
    await Promise.all([
      db.generation.count({ where: { userId } }),
      db.generation.count({
        where: { userId, status: "COMPLETED" },
      }),
      db.generation.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 6,
        include: {
          feature: { select: { name: true, slug: true } },
        },
      }),
    ]);

  const totalCreditsUsed = await db.creditTransaction.aggregate({
    where: { userId, type: "DEDUCT" },
    _sum: { amount: true },
  });
  const creditsUsed = Math.abs(totalCreditsUsed._sum.amount ?? 0);

  const stats = [
    {
      title: "Photos Created",
      value: totalGenerations.toString(),
      icon: ImageIcon,
      color: "bg-indigo-50 text-indigo-600",
    },
    {
      title: "AI Tools",
      value: "27",
      icon: Sparkles,
      color: "bg-purple-50 text-purple-600",
    },
    {
      title: "Credits Used",
      value: creditsUsed.toFixed(1),
      icon: TrendingUp,
      color: "bg-orange-50 text-orange-600",
    },
    {
      title: "Success Rate",
      value:
        totalGenerations > 0
          ? `${Math.round((successfulGenerations / totalGenerations) * 100)}%`
          : "—",
      icon: Clock,
      color: "bg-green-50 text-green-600",
    },
  ];

  const quickTools = [
    { name: "Hapus Background", slug: "remove-bg" },
    { name: "AI Retouch", slug: "retouch" },
    { name: "Product Studio", slug: "product-studio" },
  ];

  return (
    <AppShell>
      <div className="space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-4xl font-black">
            Welcome back, {userName.split(" ")[0]} 👋
          </h1>
          <p className="mt-2 text-slate-500">
            Create professional visuals with Fluxy AI.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-6">
          {stats.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition"
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${item.color}`}>
                  <Icon size={20} />
                </div>
                <p className="mt-5 text-sm text-slate-400">{item.title}</p>
                <h2 className="text-3xl font-black mt-1">{item.value}</h2>
              </div>
            );
          })}
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-3 gap-6">

          {/* Quick Actions */}
          <div className="col-span-2 bg-white rounded-3xl border p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black">Quick AI Actions</h2>
              <Link
                href="/studio"
                className="text-sm text-indigo-600 font-semibold hover:text-indigo-700 flex items-center gap-1"
              >
                All tools <ArrowRight size={14} />
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {quickTools.map((tool) => (
                <Link
                  key={tool.slug}
                  href={`/studio/${tool.slug}`}
                  className="p-5 rounded-2xl bg-slate-50 font-bold text-sm hover:bg-indigo-50 hover:text-indigo-600 transition cursor-pointer"
                >
                  {tool.name}
                </Link>
              ))}
            </div>

            {/* Recent Generations */}
            {recentGenerations.length > 0 && (
              <div className="mt-8">
                <h3 className="font-black mb-4">Recent Generations</h3>
                <div className="space-y-3">
                  {recentGenerations.map((gen) => (
                    <div
                      key={gen.id}
                      className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        {gen.outputUrl ? (
                          <img
                            src={gen.outputUrl}
                            alt={gen.feature.name}
                            className="w-10 h-10 rounded-xl object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                            <ImageIcon size={16} className="text-slate-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-sm">{gen.feature.name}</p>
                          <p className="text-xs text-slate-400">
                            {new Date(gen.createdAt).toLocaleDateString("id-ID")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusBadge status={gen.status} />
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Zap size={11} />
                          {gen.creditUsed}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {recentGenerations.length === 0 && (
              <div className="mt-8 flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4">
                  <Sparkles size={28} className="text-indigo-400" />
                </div>
                <p className="font-bold text-slate-700">No generations yet</p>
                <p className="text-sm text-slate-400 mt-1">
                  Pick a tool and create your first AI image!
                </p>
                <Link
                  href="/studio"
                  className="mt-4 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition"
                >
                  Start Creating
                </Link>
              </div>
            )}
          </div>

          {/* Upgrade card */}
          <div className="flex flex-col gap-6">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl p-8 text-white">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-4">
                <Zap size={20} />
              </div>
              <h2 className="font-black text-xl">
                {credits < 10 ? "Running low!" : "Upgrade Creator"}
              </h2>
              <p className="mt-3 text-indigo-100 text-sm">
                {credits < 10
                  ? `Only ${credits.toFixed(1)} credits left. Top up now!`
                  : "Get more credits and premium AI models."}
              </p>
              <div className="mt-4 text-3xl font-black">
                {credits.toFixed(1)}
                <span className="text-lg font-normal text-indigo-200 ml-1">
                  credits
                </span>
              </div>
              <Link
                href="/billing"
                className="mt-6 block w-full py-3 rounded-xl bg-white text-indigo-600 font-bold text-sm text-center hover:bg-indigo-50 transition"
              >
                Top Up Credits
              </Link>
            </div>

            {/* Feature count card */}
            <div className="bg-white border rounded-3xl p-6 flex-1">
              <h3 className="font-black mb-4">Modules Active</h3>
              {[
                { label: "Module A — Vision", count: 1, color: "bg-blue-500" },
                { label: "Module B — Edit Cepat", count: 9, color: "bg-indigo-500" },
                { label: "Module C — Professional", count: 15, color: "bg-purple-500" },
                { label: "Module D — Marketing", count: 2, color: "bg-pink-500" },
              ].map((m) => (
                <div key={m.label} className="flex items-center gap-3 mb-3">
                  <div className={`w-2 h-2 rounded-full ${m.color}`} />
                  <span className="text-xs text-slate-600 flex-1">{m.label}</span>
                  <span className="text-xs font-bold text-slate-800">{m.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}