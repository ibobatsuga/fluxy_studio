"use client";

import Link from "next/link";
import {
  Sparkles,
  WandSparkles,
  ArrowRight,
  Zap,
  Shield,
  ImageIcon,
  Star,
  CheckCircle2,
  Users,
  TrendingUp,
  Images,
} from "lucide-react";

// ─── Data ─────────────────────────────────────────────────────────────────────

const features = [
  {
    icon: ImageIcon,
    title: "Remove Background",
    desc: "Hapus background foto dalam hitungan detik. Akurasi tinggi dengan AI.",
    credit: 1,
    module: "B",
  },
  {
    icon: Users,
    title: "Face Swap",
    desc: "Tukar wajah dengan referensi foto apapun secara natural.",
    credit: 3,
    module: "C",
  },
  {
    icon: Star,
    title: "Product Studio",
    desc: "Foto produk profesional tanpa kamera mahal dan studio sewa.",
    credit: 3,
    module: "C",
  },
  {
    icon: Sparkles,
    title: "AI Retouch",
    desc: "Perbaikan kulit, pencahayaan, dan detail wajah secara otomatis.",
    credit: 1,
    module: "B",
  },
  {
    icon: TrendingUp,
    title: "Banner Generator",
    desc: "Banner promosi marketing siap pakai dengan desain profesional.",
    credit: 5,
    module: "D",
  },
  {
    icon: Images,
    title: "Virtual Try-On",
    desc: "Pasangkan pakaian virtual ke model foto tanpa pemotretan ulang.",
    credit: 3,
    module: "C",
  },
];

const plans = [
  { name: "Starter", credits: 50, price: "Rp49.000", color: "from-slate-700 to-slate-900" },
  { name: "Creator", credits: 150, price: "Rp119.000", popular: true, color: "from-indigo-600 to-purple-600" },
  { name: "Agency", credits: 500, price: "Rp299.000", color: "from-purple-700 to-pink-600" },
];

const testimonials = [
  {
    name: "Rinda Sari",
    role: "Online Seller, Shopee",
    text: "Foto produk saya jadi jauh lebih profesional. Omzet naik 3x dalam sebulan!",
    avatar: "RS",
  },
  {
    name: "Budi Santoso",
    role: "Digital Agency, Jakarta",
    text: "Menghemat biaya fotografer dan editor. Tim kami kini 5x lebih produktif.",
    avatar: "BS",
  },
  {
    name: "Kiki Rahayu",
    role: "Content Creator, TikTok",
    text: "Konten saya selalu viral sekarang. Fluxy AI beneran game changer!",
    avatar: "KR",
  },
];

const MODULE_COLORS: Record<string, string> = {
  B: "bg-indigo-50 text-indigo-600",
  C: "bg-purple-50 text-purple-600",
  D: "bg-pink-50 text-pink-600",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">

      {/* ── NAVBAR ────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 h-16 flex items-center px-8">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition">
              <WandSparkles size={18} />
            </div>
            <span className="font-black text-xl">Fluxy AI</span>
          </Link>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-6">
            {["Features", "Pricing", "About"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition"
              >
                {item}
              </a>
            ))}
          </div>

          {/* CTA */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 rounded-xl text-sm font-bold text-slate-700 hover:text-indigo-600 transition"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-600/20"
            >
              Coba Gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-28 px-6 overflow-hidden">
        {/* Background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="animate-blob absolute -top-32 -left-32 w-[700px] h-[700px] bg-indigo-200/30 rounded-full blur-3xl" />
          <div className="animate-blob absolute top-20 -right-40 w-[600px] h-[600px] bg-purple-200/25 rounded-full blur-3xl" style={{ animationDelay: "3s" }} />
          <div className="animate-blob absolute bottom-0 left-1/2 w-[500px] h-[500px] bg-pink-200/20 rounded-full blur-3xl" style={{ animationDelay: "6s" }} />
        </div>

        <div className="relative max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-sm font-bold mb-8 animate-fadeIn">
            <Sparkles size={14} className="animate-pulse" />
            Powered by Google Gemini 2.0 Flash
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-black leading-[1.08] tracking-tight animate-fadeIn" style={{ animationDelay: "0.1s" }}>
            Edit Foto{" "}
            <span className="gradient-text">AI Professional</span>
            <br />untuk Semua Orang
          </h1>

          <p className="mt-6 text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed animate-fadeIn" style={{ animationDelay: "0.2s" }}>
            27 AI tools — hapus background, retouch wajah, foto produk, face swap,
            banner promosi, dan lebih banyak lagi. Tanpa keahlian desain.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center animate-fadeIn" style={{ animationDelay: "0.3s" }}>
            <Link
              href="/register"
              className="group flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-indigo-600 text-white font-black text-lg hover:bg-indigo-700 transition shadow-2xl shadow-indigo-600/30 hover:shadow-indigo-600/40 hover:scale-[1.02]"
            >
              Mulai Gratis — 25 Kredit
              <ArrowRight size={18} className="group-hover:translate-x-1 transition" />
            </Link>
            <Link
              href="/studio"
              className="flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-white border-2 border-slate-200 text-slate-700 font-bold text-lg hover:border-indigo-300 hover:text-indigo-600 transition"
            >
              Lihat Demo Tools
            </Link>
          </div>

          {/* Social proof */}
          <div className="mt-12 flex items-center justify-center gap-8 text-sm text-slate-400 animate-fadeIn" style={{ animationDelay: "0.4s" }}>
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {["#818cf8","#a78bfa","#f472b6"].map((c, i) => (
                  <div key={i} className="w-7 h-7 rounded-full border-2 border-white" style={{ background: c }} />
                ))}
              </div>
              <span><strong className="text-slate-700">2.000+</strong> pengguna</span>
            </div>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={14} className="text-yellow-400 fill-yellow-400" />
              ))}
              <span className="ml-1"><strong className="text-slate-700">4.9</strong>/5</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Shield size={14} className="text-green-500" />
              <span>No Subscription</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-indigo-600 font-bold text-sm uppercase tracking-widest mb-3">27 AI Tools</p>
            <h2 className="text-4xl font-black">Satu Platform, Semua Kebutuhan Visual</h2>
            <p className="mt-4 text-slate-500 text-lg max-w-2xl mx-auto">
              Dari edit standar hingga generasi kreatif kompleks — semuanya ada.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f) => {
              const Icon = f.icon;
              const colors = MODULE_COLORS[f.module] ?? MODULE_COLORS.B;
              return (
                <div
                  key={f.title}
                  className="bg-white rounded-3xl p-8 border border-slate-200 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-300 group"
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${colors} mb-5 group-hover:scale-110 transition-transform`}>
                    <Icon size={22} />
                  </div>
                  <h3 className="text-xl font-black">{f.title}</h3>
                  <p className="mt-2 text-slate-500 text-sm leading-relaxed">{f.desc}</p>
                  <div className="mt-5 flex items-center gap-1.5 text-sm font-bold text-slate-400">
                    <Zap size={13} className="text-yellow-500" />
                    {f.credit} credit
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-indigo-600 font-bold text-sm uppercase tracking-widest mb-3">Simple Process</p>
          <h2 className="text-4xl font-black mb-16">3 Langkah Mudah</h2>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* connector line */}
            <div className="hidden md:block absolute top-8 left-1/3 right-1/3 h-px bg-gradient-to-r from-indigo-200 to-purple-200" />

            {[
              { step: "01", title: "Upload Foto", desc: "Upload gambar kamu (JPG, PNG, WebP — maks 10MB)" },
              { step: "02", title: "Pilih AI Tool", desc: "Pilih dari 27 tool AI sesuai kebutuhanmu" },
              { step: "03", title: "Download Hasil", desc: "Hasil siap dalam hitungan detik, langsung download" },
            ].map((item) => (
              <div key={item.step} className="relative flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white font-black text-xl flex items-center justify-center mb-5 shadow-lg shadow-indigo-500/25">
                  {item.step}
                </div>
                <h3 className="font-black text-xl">{item.title}</h3>
                <p className="mt-2 text-slate-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-indigo-600 font-bold text-sm uppercase tracking-widest mb-3">Transparent Pricing</p>
            <h2 className="text-4xl font-black">Bayar Sesuai Pemakaian</h2>
            <p className="mt-4 text-slate-500 max-w-xl mx-auto">
              Tidak ada subscription bulanan. Beli kredit sekali, pakai kapanpun. Kredit tidak kadaluarsa.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-3xl overflow-hidden ${plan.popular ? "shadow-2xl shadow-indigo-500/25 scale-[1.03]" : "shadow-md"}`}
              >
                {plan.popular && (
                  <div className="bg-indigo-600 text-white text-xs font-black text-center py-2.5 tracking-wide">
                    ✦ PALING POPULER
                  </div>
                )}
                <div className={`bg-gradient-to-br ${plan.color} p-8 text-white`}>
                  <h3 className="text-2xl font-black">{plan.name}</h3>
                  <div className="flex items-baseline gap-1.5 mt-3">
                    <Zap size={18} className="text-yellow-300" />
                    <span className="text-5xl font-black">{plan.credits}</span>
                    <span className="text-white/60">credits</span>
                  </div>
                  <p className="text-2xl font-bold mt-2 text-white/90">{plan.price}</p>
                </div>
                <div className="bg-white p-8">
                  <ul className="space-y-3 mb-8">
                    {[
                      `${plan.credits} AI Credits`,
                      "Semua 27 AI Tools",
                      "Supabase Storage",
                      "Tidak ada kadaluarsa",
                    ].map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-sm">
                        <CheckCircle2 size={16} className="text-indigo-500 shrink-0" />
                        <span className="text-slate-700">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/register"
                    className={`block w-full py-3.5 rounded-xl font-black text-sm text-center transition ${
                      plan.popular
                        ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-600/25"
                        : "bg-slate-900 text-white hover:bg-slate-700"
                    }`}
                  >
                    Beli {plan.name}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-indigo-600 font-bold text-sm uppercase tracking-widest mb-3">Testimonials</p>
            <h2 className="text-4xl font-black">Dipercaya Ribuan Kreator</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-slate-50 rounded-3xl p-8 border border-slate-100 hover:border-indigo-200 hover:shadow-lg transition-all">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} className="text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-slate-700 text-sm leading-relaxed italic">"{t.text}"</p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white flex items-center justify-center font-black text-sm shrink-0">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-bold text-sm">{t.name}</p>
                    <p className="text-xs text-slate-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────────────────── */}
      <section className="py-28 px-6 relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-700 to-slate-900 text-white">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="animate-blob absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="animate-blob absolute bottom-0 left-0 w-80 h-80 bg-indigo-400/10 rounded-full blur-3xl" style={{ animationDelay: "4s" }} />
        </div>

        <div className="relative max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-sm font-bold mb-8">
            <Zap size={14} className="text-yellow-300" />
            25 kredit gratis untuk pengguna baru
          </div>
          <h2 className="text-5xl font-black leading-tight">
            Buat Visual Profesional<br />Hari Ini Juga
          </h2>
          <p className="mt-5 text-indigo-200 text-lg">
            Daftar gratis · Tidak perlu kartu kredit · 25 kredit langsung aktif
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="group flex items-center justify-center gap-2.5 px-10 py-5 rounded-2xl bg-white text-indigo-600 font-black text-xl hover:bg-indigo-50 transition shadow-2xl"
            >
              Mulai Sekarang Gratis
              <ArrowRight size={20} className="group-hover:translate-x-1 transition" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer className="bg-slate-900 text-white py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-start justify-between gap-8">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <WandSparkles size={16} />
                </div>
                <span className="font-black text-lg">Fluxy AI Studio</span>
              </div>
              <p className="text-slate-400 text-sm max-w-xs leading-relaxed">
                Platform AI Photo Editor SaaS berbasis kredit untuk semua kreator digital Indonesia.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-8 text-sm">
              <div>
                <p className="font-bold mb-3 text-slate-300">Product</p>
                <div className="space-y-2 text-slate-400">
                  <Link href="/studio" className="block hover:text-white transition">AI Studio</Link>
                  <a href="#pricing" className="block hover:text-white transition">Pricing</a>
                  <a href="#features" className="block hover:text-white transition">Features</a>
                </div>
              </div>
              <div>
                <p className="font-bold mb-3 text-slate-300">Account</p>
                <div className="space-y-2 text-slate-400">
                  <Link href="/register" className="block hover:text-white transition">Register</Link>
                  <Link href="/login" className="block hover:text-white transition">Login</Link>
                  <Link href="/billing" className="block hover:text-white transition">Billing</Link>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <p>© {new Date().getFullYear()} Fluxy AI Studio. All rights reserved.</p>
            <p className="flex items-center gap-1.5">
              <Shield size={12} /> Pembayaran aman via Midtrans
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}