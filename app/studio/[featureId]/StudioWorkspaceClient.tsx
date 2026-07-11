"use client";

import { useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { aiFeatures } from "@/lib/features/tools";
import Link from "next/link";
import {
  Upload,
  X,
  Sparkles,
  Download,
  ArrowLeft,
  Zap,
  ImageIcon,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Plus,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

type GenerateState = "idle" | "uploading" | "generating" | "done" | "error";

interface UploadedImage {
  file: File;
  preview: string;
  url?: string;
}

// ─── Module Badge ──────────────────────────────────────────────────────────────

const MODULE_COLORS: Record<string, string> = {
  A: "bg-blue-100 text-blue-700",
  B: "bg-indigo-100 text-indigo-700",
  C: "bg-purple-100 text-purple-700",
  D: "bg-pink-100 text-pink-700",
};

// ─── Component ─────────────────────────────────────────────────────────────────

export default function StudioWorkspaceClient() {
  const params = useParams();
  const featureId = params.featureId as string;

  const feature = aiFeatures.find((f) => f.id === featureId);

  const [images, setImages] = useState<UploadedImage[]>([]);
  const [prompt, setPrompt] = useState("");
  const [state, setState] = useState<GenerateState>("idle");
  const [result, setResult] = useState<string | null>(null);
  const [resultType, setResultType] = useState<"image" | "text">("image");
  const [error, setError] = useState<string | null>(null);
  const [creditUsed, setCreditUsed] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const multiFileInputRef = useRef<HTMLInputElement>(null);

  // ── File handling ────────────────────────────────────────────────────────────

  const handleFileSelect = useCallback(
    (files: FileList | null, replace = false) => {
      if (!files || files.length === 0) return;

      // Clear any existing error when a new file is selected
      setError(null);

      const newImages: UploadedImage[] = Array.from(files)
        .slice(0, feature?.multiImage ? 5 : 1)
        .map((file) => ({
          file,
          preview: URL.createObjectURL(file),
        }));

      setImages((prev) =>
        replace ? newImages : [...prev, ...newImages].slice(0, 5)
      );
    },
    [feature]
  );

  const removeImage = (index: number) => {
    setImages((prev) => {
      const next = [...prev];
      URL.revokeObjectURL(next[index].preview);
      next.splice(index, 1);
      return next;
    });
  };

  // ── Generate ─────────────────────────────────────────────────────────────────

  const handleGenerate = async () => {
    if (!feature) return;

    // Text-only features (banner, carousel) require a prompt instead of image
    const isTextOnly = feature.id === "banner" || feature.id === "carousel";
    if (images.length === 0 && !isTextOnly) {
      setError("Please upload at least one image.");
      return;
    }
    if (isTextOnly && !prompt.trim()) {
      setError("Please enter a prompt to describe what you want to create.");
      return;
    }

    setError(null);
    setResult(null);
    setState("uploading");

    try {
      // 1. Upload images
      const uploadedUrls: string[] = [];
      for (const img of images) {
        const fd = new FormData();
        fd.append("file", img.file);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error ?? "Upload failed");
        }
        const { url } = await res.json();
        uploadedUrls.push(url);
      }

      // 2. Generate
      setState("generating");
      const genRes = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          featureSlug: feature.id,
          prompt,
          inputUrls: uploadedUrls,
        }),
      });

      if (!genRes.ok) {
        const err = await genRes.json();
        throw new Error(err.error ?? "Generation failed");
      }

      const data = await genRes.json();
      setResult(data.outputUrl ?? data.result);
      setResultType(data.type ?? "image");
      setCreditUsed(data.creditUsed ?? feature.credit);
      setState("done");
    } catch (err: any) {
      setError(err.message ?? "Something went wrong. Please try again.");
      setState("error");
    }
  };

  const handleDownload = async () => {
    if (!result || resultType !== "image") return;
    const a = document.createElement("a");
    a.href = result;
    a.download = `fluxy-${featureId}-${Date.now()}.webp`;
    a.click();
  };

  const handleReset = () => {
    setResult(null);
    setState("idle");
    setError(null);
  };

  // ── Feature not found ─────────────────────────────────────────────────────────

  if (!feature) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <p className="font-black text-2xl text-slate-700">Feature not found</p>
        <Link
          href="/studio"
          className="mt-4 text-indigo-600 font-semibold hover:text-indigo-700"
        >
          ← Back to Studio
        </Link>
      </div>
    );
  }

  const isLoading = state === "uploading" || state === "generating";

  return (
    <div className="max-w-5xl mx-auto">

      {/* Back + Title */}
      <div className="flex items-start gap-4 mb-8">
        <Link
          href="/studio"
          className="mt-1 p-2 rounded-xl hover:bg-slate-100 transition"
        >
          <ArrowLeft size={20} className="text-slate-600" />
        </Link>
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-black">{feature.name}</h1>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${MODULE_COLORS[feature.module]}`}>
              Module {feature.module}
            </span>
          </div>
          <p className="text-slate-500 text-sm">{feature.description}</p>
        </div>
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-5 gap-6">

        {/* ── LEFT PANEL ── */}
        <div className="col-span-2 space-y-5">

          {/* Upload zone */}
          <div className="bg-white rounded-3xl border p-6">
            <h2 className="font-black mb-4">
              {feature.multiImage ? "Reference Images" : "Upload Image"}
            </h2>

            {/* Image previews */}
            {images.length > 0 && (
              <div className="grid grid-cols-2 gap-3 mb-4">
                {images.map((img, i) => (
                  <div key={i} className="relative rounded-2xl overflow-hidden group">
                    <img
                      src={img.preview}
                      alt={`ref-${i}`}
                      className="w-full h-28 object-cover"
                    />
                    <button
                      onClick={() => removeImage(i)}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}

                {/* Add more (multi-image only) */}
                {feature.multiImage && images.length < 5 && (
                  <button
                    onClick={() => multiFileInputRef.current?.click()}
                    className="h-28 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 hover:border-indigo-400 hover:text-indigo-500 transition"
                  >
                    <Plus size={20} />
                  </button>
                )}
              </div>
            )}

            {/* Drop zone */}
            {images.length === 0 && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-40 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:border-indigo-400 hover:text-indigo-500 hover:bg-indigo-50/50 transition"
              >
                <Upload size={28} className="mb-2" />
                <p className="font-semibold text-sm">Click to upload</p>
                <p className="text-xs mt-1">JPG, PNG, WebP · Max 10MB</p>
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files, true)}
            />
            <input
              ref={multiFileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files, false)}
            />
          </div>

          {/* Prompt input */}
          <div className="bg-white rounded-3xl border p-6">
            <h2 className="font-black mb-3">Prompt / Instruction</h2>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                feature.id === "magic-edit"
                  ? "e.g. Remove the person on the left..."
                  : feature.id === "image-to-prompt"
                  ? "Optional: specify focus area..."
                  : feature.id === "banner" || feature.id === "carousel"
                  ? "Describe what you want to create..."
                  : "Optional: add specific instructions..."
              }
              rows={4}
              className="w-full resize-none border border-slate-200 rounded-2xl p-3 text-sm focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition"
            />
          </div>

          {/* Credit cost + Generate */}
          <div className="bg-white rounded-3xl border p-6">
            <div className="flex items-center justify-between mb-5">
              <span className="text-sm text-slate-500 font-medium">Credit cost</span>
              <span className="flex items-center gap-1.5 font-black text-lg text-indigo-600">
                <Zap size={16} />
                {feature.credit}
              </span>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-2xl px-4 py-3 mb-4">
                <AlertCircle size={14} className="text-red-500 shrink-0" />
                <p className="text-red-600 text-xs font-medium">{error}</p>
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={isLoading}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
            >
              {state === "uploading" ? (
                <><Loader2 size={18} className="animate-spin" /> Uploading...</>
              ) : state === "generating" ? (
                <><Loader2 size={18} className="animate-spin" /> Generating AI...</>
              ) : (
                <><Sparkles size={18} /> Generate</>
              )}
            </button>
          </div>

        </div>

        {/* ── RIGHT PANEL — Result ── */}
        <div className="col-span-3 bg-white rounded-3xl border p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-black text-lg">Result Preview</h2>
            {state === "done" && (
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition"
              >
                <Download size={14} />
                Download
              </button>
            )}
          </div>

          {/* States */}
          {state === "idle" && (
            <div className="flex flex-col items-center justify-center h-96 text-center">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mb-5">
                <ImageIcon size={36} className="text-indigo-400" />
              </div>
              <p className="font-black text-slate-700 text-lg">Result will appear here</p>
              <p className="text-sm text-slate-400 mt-2">
                Upload an image and click Generate
              </p>
            </div>
          )}

          {(state === "uploading" || state === "generating") && (
            <div className="flex flex-col items-center justify-center h-96 text-center">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-5 shadow-lg shadow-indigo-500/30">
                <Sparkles size={36} className="text-white animate-pulse" />
              </div>
              <p className="font-black text-slate-700 text-lg">
                {state === "uploading" ? "Uploading image..." : "AI is working..."}
              </p>
              <p className="text-sm text-slate-400 mt-2">
                This usually takes 10–30 seconds
              </p>
              <div className="mt-6 w-48 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animate-pulse w-2/3" />
              </div>
            </div>
          )}

          {state === "error" && (
            <div className="flex flex-col items-center justify-center h-96 text-center">
              <div className="w-20 h-20 rounded-3xl bg-red-50 flex items-center justify-center mb-5">
                <AlertCircle size={36} className="text-red-400" />
              </div>
              <p className="font-black text-red-600 text-lg">Generation Failed</p>
              <p className="text-sm text-slate-400 mt-2 max-w-xs">{error}</p>
              <button
                onClick={handleReset}
                className="mt-5 px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-700 transition"
              >
                Try Again
              </button>
            </div>
          )}

          {state === "done" && result && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600 font-semibold text-sm">
                <CheckCircle2 size={16} />
                Generated successfully · {creditUsed} credit used
              </div>

              {resultType === "image" ? (
                <div className="relative rounded-2xl overflow-hidden bg-slate-50">
                  <img
                    src={result}
                    alt="AI Generated Result"
                    className="w-full object-contain max-h-[480px]"
                  />
                </div>
              ) : (
                <div className="bg-slate-50 rounded-2xl p-6">
                  <p className="text-sm font-semibold text-slate-600 mb-3">Generated Prompt:</p>
                  <p className="text-slate-800 leading-relaxed text-sm font-mono">{result}</p>
                  <button
                    onClick={() => navigator.clipboard.writeText(result)}
                    className="mt-4 px-4 py-2 rounded-xl bg-indigo-50 text-indigo-600 font-bold text-xs hover:bg-indigo-100 transition"
                  >
                    Copy Prompt
                  </button>
                </div>
              )}

              <button
                onClick={handleReset}
                className="w-full py-3 rounded-2xl border-2 border-dashed border-slate-200 text-slate-500 font-bold text-sm hover:border-indigo-300 hover:text-indigo-600 transition"
              >
                Generate Again
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
