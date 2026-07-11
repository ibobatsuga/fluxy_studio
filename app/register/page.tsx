"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { register, RegisterState } from "@/app/actions/auth";
import {
  WandSparkles,
  Mail,
  Lock,
  User,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

// Simple password strength helper
function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { score, label: "Weak", color: "bg-red-500" };
  if (score === 2) return { score, label: "Fair", color: "bg-yellow-500" };
  if (score === 3) return { score, label: "Good", color: "bg-blue-500" };
  return { score, label: "Strong", color: "bg-green-500" };
}

export default function RegisterPage() {
  const [state, action, pending] = useActionState<RegisterState, FormData>(
    register,
    undefined
  );

  const [password, setPassword] = useState("");
  const strength = getPasswordStrength(password);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center relative overflow-hidden py-12">

      {/* Animated gradient blobs */}
      <div className="absolute top-[-200px] right-[-200px] w-[600px] h-[600px] rounded-full bg-purple-600/20 blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-200px] left-[-200px] w-[600px] h-[600px] rounded-full bg-indigo-600/20 blur-[120px] animate-pulse" style={{ animationDelay: "0.5s" }} />

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
            <h2 className="text-2xl font-black text-white">Create your account</h2>
            <p className="mt-1 text-slate-400 text-sm">Start with 25 free credits. No card required.</p>
          </div>

          {/* Global error */}
          {state?.message && (
            <div className="mb-6 flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3">
              <AlertCircle className="text-red-400 shrink-0" size={16} />
              <p className="text-red-400 text-sm font-medium">{state.message}</p>
            </div>
          )}

          <form action={action} className="space-y-4">

            {/* Name */}
            <div>
              <label htmlFor="register-name" className="block text-sm font-semibold text-slate-300 mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  id="register-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Your name"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder:text-slate-600 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                />
              </div>
              {state?.errors?.name && (
                <p className="mt-1.5 text-red-400 text-xs">{state.errors.name[0]}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="register-email" className="block text-sm font-semibold text-slate-300 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  id="register-email"
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
              <label htmlFor="register-password" className="block text-sm font-semibold text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  id="register-password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder:text-slate-600 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                />
              </div>

              {/* Strength meter */}
              {password.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all ${
                          i <= strength.score ? strength.color : "bg-white/10"
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`mt-1 text-xs font-medium ${
                    strength.score <= 1 ? "text-red-400" :
                    strength.score === 2 ? "text-yellow-400" :
                    strength.score === 3 ? "text-blue-400" :
                    "text-green-400"
                  }`}>
                    {strength.label} password
                  </p>
                </div>
              )}

              {state?.errors?.password && (
                <div className="mt-2 space-y-1">
                  {state.errors.password.map((err) => (
                    <p key={err} className="text-red-400 text-xs flex items-center gap-1">
                      <AlertCircle size={12} />
                      {err}
                    </p>
                  ))}
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="register-confirm" className="block text-sm font-semibold text-slate-300 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  id="register-confirm"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Repeat your password"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder:text-slate-600 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                />
              </div>
              {state?.errors?.confirmPassword && (
                <p className="mt-1.5 text-red-400 text-xs">{state.errors.confirmPassword[0]}</p>
              )}
            </div>

            {/* Benefits */}
            <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-2xl px-4 py-3 space-y-1.5">
              {[
                "25 free credits on sign up",
                "Access to 30+ AI tools",
                "No credit card required",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-indigo-400 shrink-0" />
                  <span className="text-xs text-indigo-300">{item}</span>
                </div>
              ))}
            </div>

            {/* Submit */}
            <button
              id="register-submit"
              type="submit"
              disabled={pending}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
            >
              {pending ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Create Free Account
                  <ArrowRight size={16} />
                </>
              )}
            </button>

          </form>

        </div>

        {/* Login link */}
        <p className="text-center mt-6 text-slate-500 text-sm">
          Already have an account?{" "}
          <Link href="/login" className="text-indigo-400 font-semibold hover:text-indigo-300 transition">
            Sign in
          </Link>
        </p>

      </div>
    </div>
  );
}
