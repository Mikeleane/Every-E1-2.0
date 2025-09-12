"use client";

import React, { useState } from "react";
import PrintButton from "@/components/PrintButton";

type Level = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

type GeneratePayload = {
  isPublic: boolean;
  level: Level;
  outputType: string;
  outputLanguage: string;
  sourceText?: string;
  sourceUrl?: string;
  youtubeUrl?: string;
  imageQuery?: string;
  preActivities: string[];
  vocab: string[];
  grammar: string[];
  activityTypes: string[];
  examStyle?: string;
  dyslexicFriendly: boolean;
};

const LEVELS: Level[] = ["A1","A2","B1","B2","C1","C2"];
const OUTPUT_TYPES = ["Informal email","Formal email","Blog post","Report","Story","Article"];
const OUTPUT_LANGS = ["English","Spanish","French","German","Italian","Portuguese"];
const PRE_ACTIVITIES = ["Vocabulary preview","Prediction","K-W-L","Discussion prompt"];
const ACTIVITIES = ["Cloze (gap-fill)","Fill in the gaps","Modify the word","True/False","Short answer"];
const EXAMS = ["None","Cambridge","Trinity","TOEFL","Linguaskill","APTIS"];

const DEFAULT_PAYLOAD: GeneratePayload = {
  isPublic: true,
  level: "B1",
  outputType: "Article",
  outputLanguage: "English",
  sourceText: "",
  sourceUrl: "",
  youtubeUrl: "",
  imageQuery: "",
  preActivities: [],
  vocab: [],
  grammar: [],
  activityTypes: [],
  examStyle: "None",
  dyslexicFriendly: false,
};

export default function GeneratePage() {
  const [payload, setPayload] = useState<GeneratePayload>(DEFAULT_PAYLOAD);
  const [outputs, setOutputs] = useState<{ standard: string; adaptive: string; teacher: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [levelIdx, setLevelIdx] = useState(LEVELS.indexOf(DEFAULT_PAYLOAD.level));

  const update = <K extends keyof GeneratePayload>(key: K, value: GeneratePayload[K]) =>
    setPayload(p => ({ ...p, [key]: value }));

  const toggleArr = (key: "preActivities" | "activityTypes", value: string) =>
    setPayload(p => {
      const set = new Set(p[key]);
      set.has(value) ? set.delete(value) : set.add(value);
      return { ...p, [key]: Array.from(set) };
    });

  async function generate() {
    setLoading(true);
    setErr(null);
    setOutputs(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const raw = await res.json() as any;
const norm = (v: unknown) => (typeof v === "string" ? v : JSON.stringify(v, null, 2));
const data = { standard: norm(raw.standard), adaptive: norm(raw.adaptive), teacher: norm(raw.teacher) };
setOutputs(data);

    } catch (e: unknown) {
      setErr((e as Error).message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function simplifyOnce() {
    const nextIdx = Math.max(0, levelIdx - 1);
    if (nextIdx === levelIdx) return;
    setLevelIdx(nextIdx);
    const nextLevel = LEVELS[nextIdx];
    update("level", nextLevel);
    await generate();
  }

  async function exportDocx() {
    if (!outputs) return;
    const res = await fetch("/api/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        standard: outputs.standard,
        adaptive: outputs.adaptive,
        teacher: outputs.teacher,
        meta: {
          level: payload.level,
          outputType: payload.outputType,
          outputLanguage: payload.outputLanguage,
          isPublic: payload.isPublic,
          examStyle: payload.examStyle,
          sourceUrl: payload.sourceUrl,
          youtubeUrl: payload.youtubeUrl,
          imageQuery: payload.imageQuery,
        },
      }),
    });
    if (!res.ok) {
      alert("Export failed");
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aontas-${payload.level}.docx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="p-6 space-y-6">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Aontas — Builder</h1>
        <div className="flex items-center gap-2">
          <PrintButton />
          <button
            type="button"
            className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
            onClick={() => void exportDocx()}
            disabled={!outputs}
            title="Export sections to Word (.docx)"
          >
            Export .docx
          </button>
        </div>
      </header>

      <form
        className="grid md:grid-cols-2 gap-6"
        onSubmit={(e) => {
          e.preventDefault();
          void generate();
        }}
      >
        {/* Left: Controls */}
        <section className="space-y-4 print:hidden">
          <div className="flex items-center gap-3">
            <label className="font-medium">Public school</label>
            <input
              type="checkbox"
              className="h-5 w-5"
              checked={payload.isPublic}
              onChange={(e) => update("isPublic", e.target.checked)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="space-y-1">
              <span className="block text-sm font-medium">CEFR level</span>
              <select
                className="border rounded-md p-2 w-full"
                value={payload.level}
                onChange={(e) => {
                  const lv = e.target.value as Level;
                  update("level", lv);
                  setLevelIdx(LEVELS.indexOf(lv));
                }}
              >
                {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </label>

            <label className="space-y-1">
              <span className="block text-sm font-medium">Output type</span>
              <select
                className="border rounded-md p-2 w-full"
                value={payload.outputType}
                onChange={(e) => update("outputType", e.target.value)}
              >
                {OUTPUT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>

            <label className="space-y-1">
              <span className="block text-sm font-medium">Output language</span>
              <select
                className="border rounded-md p-2 w-full"
                value={payload.outputLanguage}
                onChange={(e) => update("outputLanguage", e.target.value)}
              >
                {OUTPUT_LANGS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>

            <label className="space-y-1">
              <span className="block text-sm font-medium">Exam style</span>
              <select
                className="border rounded-md p-2 w-full"
                value={payload.examStyle}
                onChange={(e) => update("examStyle", e.target.value)}
              >
                {EXAMS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
          </div>

          <div className="space-y-2">
            <span className="block text-sm font-medium">Source</span>
            <textarea
              className="border rounded-md p-2 w-full h-28"
              placeholder="Paste source text here…"
              value={payload.sourceText}
              onChange={(e) => update("sourceText", e.target.value)}
            />
            <input
              type="url"
              className="border rounded-md p-2 w-full"
              placeholder="…or provide a source URL"
              value={payload.sourceUrl}
              onChange={(e) => update("sourceUrl", e.target.value)}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <label className="space-y-1">
              <span className="block text-sm font-medium">YouTube link (optional)</span>
              <input
                className="border rounded-md p-2 w-full"
                placeholder="https://www.youtube.com/watch?v=..."
                value={payload.youtubeUrl}
                onChange={(e) => update("youtubeUrl", e.target.value)}
              />
            </label>
            <label className="space-y-1">
              <span className="block text-sm font-medium">Image search (optional)</span>
              <input
                className="border rounded-md p-2 w-full"
                placeholder="keywords for Google Images"
                value={payload.imageQuery}
                onChange={(e) => update("imageQuery", e.target.value)}
              />
            </label>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <label className="space-y-1">
              <span className="block text-sm font-medium">Key vocabulary (comma-separated)</span>
              <input
                className="border rounded-md p-2 w-full"
                placeholder="e.g., ecosystem, habitat, biodiversity"
                onChange={(e) => update("vocab", e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
              />
            </label>
            <label className="space-y-1">
              <span className="block text-sm font-medium">Grammar targets (comma-separated)</span>
              <input
                className="border rounded-md p-2 w-full"
                placeholder="e.g., past simple, conditionals"
                onChange={(e) => update("grammar", e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
              />
            </label>
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Pre-activities</legend>
            <div className="grid grid-cols-2 gap-2">
              {PRE_ACTIVITIES.map(a => (
                <label key={a} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={payload.preActivities.includes(a)}
                    onChange={() => toggleArr("preActivities", a)}
                  />
                  <span>{a}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Activity types</legend>
            <div className="grid grid-cols-2 gap-2">
              {ACTIVITIES.map(a => (
                <label key={a} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={payload.activityTypes.includes(a)}
                    onChange={() => toggleArr("activityTypes", a)}
                  />
                  <span>{a}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="flex items-center gap-3">
            <label className="font-medium">Dyslexic-friendly</label>
            <input
              type="checkbox"
              className="h-5 w-5"
              checked={payload.dyslexicFriendly}
              onChange={(e) => update("dyslexicFriendly", e.target.checked)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="submit"
              className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Generating…" : "Generate"}
            </button>
            <button
              type="button"
              className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
              onClick={() => void simplifyOnce()}
              disabled={loading || levelIdx === 0}
              title="Tap to simplify one level"
            >
              Simplify (now {payload.level})
            </button>
          </div>
        </section>

        {/* Right: Output */}
        <section className={payload.dyslexicFriendly ? "space-y-4 leading-8 tracking-wide" : "space-y-4"}>
          <article className="border rounded-xl p-4">
            <h2 className="font-semibold mb-2">Standard content</h2>
            <p className="whitespace-pre-wrap">{outputs?.standard ?? "—"}</p>
          </article>
          <article className="border rounded-xl p-4">
            <h2 className="font-semibold mb-2">Adaptive content (LD)</h2>
            <p className="whitespace-pre-wrap">{outputs?.adaptive ?? "—"}</p>
          </article>
          <article className="border rounded-xl p-4 page-break-before print:break-before-page">
            <h2 className="font-semibold mb-2">Teacher notes + Answer key</h2>
            <p className="whitespace-pre-wrap">{outputs?.teacher ?? "—"}</p>
          </article>
        </section>
      </form>
    </main>
  );
}