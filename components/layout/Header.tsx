import { auth } from "@/auth";
import { Zap } from "lucide-react";

export default async function Header() {
  const session = await auth();
  const user = session?.user;

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  const credits = user?.credits ?? 0;

  return (
    <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between">

      <div>
        <h2 className="font-black text-xl">Dashboard</h2>
        <p className="text-sm text-slate-400">AI Creative Workspace</p>
      </div>

      <div className="flex items-center gap-5">

        {/* Credits badge */}
        <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-50 text-indigo-600 font-bold text-sm">
          <Zap size={14} />
          {credits} Credits
        </div>

        {/* Avatar */}
        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white flex items-center justify-center font-black text-sm">
          {initials}
        </div>

      </div>

    </header>
  );
}