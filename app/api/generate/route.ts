import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const clamp = (s: string | undefined, n: number) => (s ?? "").slice(0, n);

function decodeHtml(s: string): string {
  return (s || "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

// Try JSON-LD first (best for BBC/Guardian/etc.)
function extractFromHtml(html: string): { title: string; text: string } {
  const scrub = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "");

  let title = decodeHtml((scrub.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || "").trim());

  // Look for JSON-LD scripts
  const ldScripts = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const m of ldScripts) {
    try {
      const raw = m[1].trim();
      const json = JSON.parse(raw);
      const arr = Array.isArray(json) ? json : [json];
      for (const node of arr) {
        const type = (node['@type'] || node.type || "");
        const isArticle = Array.isArray(type) ? type.includes("NewsArticle") || type.includes("Article")
                                              : /NewsArticle|Article/i.test(String(type));
        if (isArticle) {
          const headline = (node.headline || node.name || "").toString();
          if (headline) title = headline;
          // articleBody can be a string or array of strings
          let body = "";
          if (typeof node.articleBody === "string") body = node.articleBody;
          else if (Array.isArray(node.articleBody)) body = node.articleBody.join(" ");
          else if (typeof node.description === "string") body = node.description;

          body = decodeHtml((body || "").replace(/\s+/g, " ").trim());
          if (body.length > 180) return { title, text: body };
        }
      }
    } catch { /* ignore JSON-LD parse errors */ }
  }

  // Pick best region: <article>, then <main>, else the largest <div> with many <p>
  const pickRegion = (rx: RegExp) => rx.exec(html)?.[1] || "";
  let region = pickRegion(/<article[^>]*>([\s\S]*?)<\/article>/i);
  if (!region) region = pickRegion(/<main[^>]*>([\s\S]*?)<\/main>/i);

  if (!region) {
    const divs = [...html.matchAll(/<div[^>]*>([\s\S]*?)<\/div>/gi)];
    let best = ""; let bestScore = -1;
    for (const d of divs) {
      const inner = d[1];
      const pCount = (inner.match(/<p[^>]*>[\s\S]*?<\/p>/gi) || []).length;
      const len = inner.length;
      const score = pCount * 1000 + len; // prefer many paragraphs
      if (pCount >= 3 && score > bestScore) { bestScore = score; best = inner; }
    }
    region = best || "";
  }

  const regionStr = (region || scrub);
  const meta = decodeHtml(regionStr.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i)?.[1] || "");
  const paragraphs = Array.from(regionStr.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi))
    .map(m => decodeHtml(m[1].replace(/<[^>]+>/g, "").trim()))
    .filter(p => p && !/^\s*By\s+|Share this|Follow us|Newsletter/i.test(p)); // drop boilerplate

  const joined = (meta + " " + paragraphs.slice(0, 10).join(" ")).replace(/\s+/g, " ").trim();
  return { title, text: joined };
}

function simplify(text: string): string {
  const s = (text || "").replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/[—–]/g, "-");
  const parts = s.split(/(?<=[\.!?])\s+/).map(t => t.trim()).filter(Boolean);
  const shorter = parts.map(p => (p.length > 160 ? p.replace(/[;:]\s*/g, ". ").replace(/\s{2,}/g, " ") : p));
  return shorter.slice(0, 6).join(" ");
}

const STOP = new Set(["the","and","that","with","this","from","have","been","into","about","there","their","which","your","what","when","where","because","could","would","should","while","after","before","through","over","under","also","more","most","many","much","very","some","such","than","then","them","they","you","for","are","was","were","is","be","to","of","in","on","as","by","it","at","an","a","or","we","our","us","he","she","his","her","its"]);
function topKeywords(text: string, k = 5): string[] {
  const words = (text.toLowerCase().match(/[a-z]{4,}/g) || []);
  const freq = new Map<string, number>();
  for (const w of words) if (!STOP.has(w)) freq.set(w, (freq.get(w) || 0) + 1);
  return [...freq.entries()].sort((a,b)=>b[1]-a[1]).slice(0,k).map(([w])=>w);
}
function pickVocab(text: string): string {
  const words = (text.match(/[A-Za-z]{7,}/g) || []);
  words.sort((a,b)=>a.length-b.length);
  return words[words.length - 1] || "";
}

export async function POST(req: NextRequest) {
  const t0 = Date.now();
  try {
    const raw = await req.text();
    const clean = raw.replace(/```json|```/g, "").trim();
    let body: any = {};
    try { body = JSON.parse(clean || "{}"); } catch {}

    let title = clamp(body?.title, 120) || "Untitled";
    const cefr  = clamp(body?.cefr, 8)   || "B2";
    const goal  = clamp(body?.goal, 40)  || "Comprehension";
    const url   = clamp(body?.url, 1024);
    let text    = clamp(body?.text, 50000);

    if (url && !text) {
      try {
        const ctrl = new AbortController();
        const to = setTimeout(() => ctrl.abort(), 10000);
        const r = await fetch(url, { headers: { "user-agent": "EveryE1/1.0 (+local)" }, cache: "no-store", signal: ctrl.signal });
        clearTimeout(to);
        const html = await r.text();
        const ex = extractFromHtml(html);
        if (!text && ex.text) text = clamp(ex.text, 50000);
        if (ex.title) title = ex.title.slice(0,120);
      } catch {}
    }

    if (!text || !text.trim()) {
      return NextResponse.json({ ok: false, error: "Empty input (provide text or a readable URL)." }, { status: 400 });
    }

    const standard = clamp(text.trim(), 1500);
    const adapted  = simplify(standard);
    const kws      = topKeywords(standard, 5);
    const vocab    = pickVocab(standard);

    const teacher = [
      "Identify the main idea in one sentence.",
      "Underline three key words and define them.",
      "Answer two comprehension questions from the text.",
      "Extension: Make a personal connection in 2–3 sentences."
    ];

    const questions = [
      { q: "What is the text mostly about?" },
      { q: `Name two key details about ${kws[0] ?? "the topic"}.` },
      { q: "How might this topic affect people or society?" },
      { q: `Choose a new word (e.g., “${vocab || "…"}”). What does it mean in this text?` }
    ];

    return NextResponse.json({ ok: true, ms: Date.now() - t0, pack: { title, cefr, goal, standard, adapted, teacher, questions }});
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}