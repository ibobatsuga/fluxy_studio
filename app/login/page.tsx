"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login, LoginState } from "@/app/actions/auth";
import { WandSparkles, Mail, Lock, ArrowRight, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const [state, action, pending] = useActionState<LoginState, FormData>(
    login,
    undefined
  );

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center relative overflow-hidden">

      {/* Animated gradient blobs */}
      <div className="absolute top-[-200px] left-[-200px] w-[600px] h-[600px] rounded-full bg-indigo-600/20 blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-200px] right-[-200px] w-[600px] h-[600px] rounded-full bg-purple-600/20 blur-[120px] animate-pulse" style={{ animationDelay: "1s" }} />

      <div className="relative z-10 w-full max-w-md px-6">

        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <WandSparkles className="text-white" size={22} />
          </div>
          <div>
            <h1 className="font-black text-xl text-white tracking-tight">Fluxy AI</h1>
            <p className="text-xs font-bold text-indigo-400">PHOTO STUDIO</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">

          <div className="mb-8">
            <h2 className="text-2xl font-black text-white">Welcome back</h2>
            <p className="mt-1 text-slate-400 text-sm">Sign in to continue creating</p>
          </div>

          {/* Global error message */}
          {state?.message && (
            <div className="mb-6 flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3">
              <AlertCircle className="text-red-400 shrink-0" size={16} />
              <p className="text-red-400 text-sm font-medium">{state.message}</p>
            </div>
          )}

          <form action={action} className="space-y-4">

            {/* Email */}
            <div>
              <label htmlFor="login-email" className="block text-sm font-semibold text-slate-300 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder:text-slate-600 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                />
              </div>
              {state?.errors?.email && (
                <p className="mt-1.5 text-red-400 text-xs">{state.errors.email[0]}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="login-password" className="block text-sm font-semibold text-slate-300">
                  Password
                </label>
                <span className="text-xs text-indigo-400 cursor-pointer hover:text-indigo-300 transition">
                  Forgot password?
                </span>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  id="login-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder:text-slate-600 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                />
              </div>
              {state?.errors?.password && (
                <p className="mt-1.5 text-red-400 text-xs">{state.errors.password[0]}</p>
              )}
            </div>

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={pending}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
            >
              {pending ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={16} />
                </>
              )}
            </button>

          </form>

        </div>

        {/* Register link */}
        <p className="text-center mt-6 text-slate-500 text-sm">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-indigo-400 font-semibold hover:text-indigo-300 transition">
            Create free account
          </Link>
        </p>

        {/* Free credits badge */}
        <div className="mt-4 flex items-center justify-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <p className="text-xs text-slate-500">New accounts get <span className="text-green-400 font-semibold">25 free credits</span></p>
        </div>

      </div>
    </div>
  );
}
