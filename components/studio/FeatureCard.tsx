"use client";

import { Sparkles, Images, Zap } from "lucide-react";
import type { AIFeature } from "@/lib/features/tools";

const MODULE_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  A: { bg: "bg-blue-50", text: "text-blue-600", dot: "bg-blue-500" },
  B: { bg: "bg-indigo-50", text: "text-indigo-600", dot: "bg-indigo-500" },
  C: { bg: "bg-purple-50", text: "text-purple-600", dot: "bg-purple-500" },
  D: { bg: "bg-pink-50", text: "text-pink-600", dot: "bg-pink-500" },
};

export default function FeatureCard({
  feature,
  onSelect,
}: {
  feature: AIFeature;
  onSelect: (id: string) => void;
}) {
  const colors = MODULE_COLORS[feature.module] ?? MODULE_COLORS.B;

  return (
    <button
      onClick={() => onSelect(feature.id)}
      className="text-left w-full bg-white border border-slate-200 rounded-3xl p-6 hover:border-indigo-400 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-0.5 transition-all duration-200 group"
    >
      {/* Icon row */}
      <div className="flex justify-between items-start">
        <div
          className={`w-12 h-12 rounded-2xl ${colors.bg} ${colors.text} flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}
        >
          <Sparkles size={20} />
        </div>
        {feature.multiImage && (
          <Images size={16} className="text-slate-400 group-hover:text-purple-500 transition" />
        )}
      </div>

      {/* Name + description */}
      <h3 className="mt-5 font-black text-lg leading-tight">{feature.name}</h3>
      <p className="mt-2 text-sm text-slate-500 leading-relaxed">{feature.description}</p>

      {/* Footer */}
      <div className="mt-5 flex items-center justify-between">
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${colors.bg} ${colors.text}`}>
          Module {feature.module}
        </span>
        <span className="flex items-center gap-1 text-xs font-black text-slate-600">
          <Zap size={11} className="text-yellow-500" />
          {feature.credit}
        </span>
      </div>
    </button>
  );
}