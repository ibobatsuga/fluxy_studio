"use client";

import { useState } from "react";
import { aiFeatures } from "@/lib/features/tools";
import FeatureCard from "@/components/studio/FeatureCard";
import Link from "next/link";
import { Sparkles, Search } from "lucide-react";

const CATEGORIES = [
  "All",
  "Vision AI",
  "Edit Cepat",
  "Creative",
  "Professional",
  "Special Moments",
  "Marketing",
];

export default function StudioCatalogClient() {
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");

  const filtered = aiFeatures.filter((item) => {
    const matchCat = category === "All" || item.category === category;
    const matchSearch =
      search === "" ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-black">Magic Studio AI</h1>
          <p className="text-slate-500 mt-2">
            27 AI tools for professional visual creation.
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search tools..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-11 pr-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm font-medium w-64 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition"
          />
        </div>
      </div>

      {/* Category filter */}
      <div className="flex gap-3 flex-wrap">
        {CATEGORIES.map((item) => (
          <button
            key={item}
            onClick={() => setCategory(item)}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition ${
              category === item
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      {/* Feature grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <Sparkles size={28} className="text-slate-400" />
          </div>
          <p className="font-bold text-slate-600">No tools found</p>
          <p className="text-sm text-slate-400 mt-1">
            Try a different search or category.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((feature) => (
            <Link key={feature.id} href={`/studio/${feature.id}`}>
              <FeatureCard
                feature={feature}
                onSelect={() => {}}
              />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
