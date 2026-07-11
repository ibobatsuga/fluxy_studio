import Link from "next/link";
import { auth } from "@/auth";
import LogoutButton from "./LogoutButton";
import {
  LayoutDashboard,
  Sparkles,
  CreditCard,
  Activity,
  Settings,
  WandSparkles,
  Zap,
} from "lucide-react";

const menus = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Magic Studio",
    href: "/studio",
    icon: Sparkles,
  },
  {
    name: "Billing",
    href: "/billing",
    icon: CreditCard,
  },
  {
    name: "Audit Log",
    href: "/dashboard",
    icon: Activity,
  },
  {
    name: "Admin Panel",
    href: "/admin",
    icon: Settings,
  },
];

export default async function Sidebar() {
  const session = await auth();
  const user = session?.user;

  // Initials for avatar
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  const credits = user?.credits ?? 0;
  const name = user?.name ?? "User";
  const email = user?.email ?? "";

  return (
    <aside className="w-72 min-h-screen bg-white border-r border-slate-200 p-6 flex flex-col">

      {/* Logo */}
      <div className="flex items-center gap-3 mb-10">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg">
          <WandSparkles />
        </div>
        <div>
          <h1 className="font-black text-xl">Fluxy AI</h1>
          <p className="text-xs font-bold text-indigo-600">PHOTO STUDIO</p>
        </div>
      </div>

      {/* Credit card */}
      <div className="rounded-3xl bg-gradient-to-br from-indigo-700 to-slate-950 p-6 text-white mb-8">
        <p className="text-xs text-indigo-200">Available Credit</p>

        <div className="flex items-end gap-2 mt-2">
          <div className="text-4xl font-black">{credits}</div>
          <Zap size={16} className="text-indigo-300 mb-1" />
        </div>

        <p className="text-xs text-slate-300 mt-1">credits</p>

        <Link
          href="/billing"
          className="mt-5 block w-full py-2 rounded-xl bg-white text-indigo-700 font-bold text-sm text-center hover:bg-indigo-50 transition"
        >
          Top Up
        </Link>
      </div>

      {/* Navigation */}
      <nav className="space-y-1 flex-1">
        {menus.map((item) => {
          const Icon = item.icon;
          // Hide admin panel for non-admin users
          if (item.name === "Admin Panel" && user?.role !== "ADMIN") return null;

          return (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 font-semibold text-sm hover:bg-indigo-50 hover:text-indigo-600 transition"
            >
              <Icon size={20} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User info + logout */}
      <div className="border-t pt-5 mt-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white flex items-center justify-center font-black text-sm shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm text-slate-800 truncate">{name}</p>
            <p className="text-xs text-slate-400 truncate">{email}</p>
          </div>
        </div>

        <LogoutButton />
      </div>

    </aside>
  );
}