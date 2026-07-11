"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
  return (
    <button
      id="logout-button"
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="flex items-center gap-2 px-4 py-2 rounded-xl text-slate-500 font-semibold text-sm hover:bg-red-50 hover:text-red-600 transition w-full"
    >
      <LogOut size={16} />
      Sign Out
    </button>
  );
}
