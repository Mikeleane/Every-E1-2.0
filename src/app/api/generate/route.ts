export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Level = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
type LengthPreset = "Brief" | "Standard" | "Extended" | "Exam pack";

type Body = {
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
  lengthPreset?: LengthPreset;
};

const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

function lengths(preset: LengthPreset | undefined) {
  const P = preset ?? "Standard";
  const map: Record<LengthPreset, { std: number; ad: number; teacher: number; q: number }> = {
    "Brief":    { std: 160, ad: 100, teacher: 180, q: 3 },
    "Standard": { std: 350, ad: 200, teacher: 300, q: 5 },
    "Extended": { std: 700, ad: 350, teacher: 500, q: 8 },
    "Exam pack":{ std: 600, ad: 300, teacher: 650, q: 10 },
  };
  return map[P];
}

function makePrompt(b: Body) {
  const L = lengths(b.lengthPreset);
  const aims = [
    `Audience: school classroom (${b.isPublic ? "public" : "non-public"}).`,
    `CEFR level: ${b.level}.`,
    `Output type: ${b.outputType}.`,
    `Language: ${b.outputLanguage}.`,
    b.examStyle && b.examStyle !== "None" ? `Exam style: ${b.examStyle}.` : "",
    b.vocab.length ? `Include/teach vocabulary: ${b.vocab.join(", ")}.` : "",
    b.grammar.length ? `Target grammar: ${b.grammar.join(", ")}.` : "",
    b.preActivities.length ? `Pre-activities: ${b.preActivities.join(", ")}.` : "",
    b.activityTypes.length ? `Activity types in/after text: ${b.activityTypes.join(", ")}.` : "",
    b.youtubeUrl ? `Pair with YouTube: ${b.youtubeUrl}.` : "",
    b.imageQuery ? `Suggested images search: ${b.imageQuery}.` : "",
    b.sourceUrl ? `Source URL: ${b.sourceUrl}.` : "",
    `Length preset: ${b.lengthPreset ?? "Standard"} (targets — standard:${L.std}, adaptive:${L.ad}, teacher:${L.teacher}, questions:${L.q}).`,
  ].filter(Boolean).join("\n");

  const src = (b.sourceText || "").trim() || "(no inline source text provided)";

  return `
You are an inclusive language-education assistant. Create classroom materials that are safe, age-appropriate, culturally respectful, and CEFR-aligned.

Return a SINGLE JSON object with keys:
- "standard": string   (AT LEAST ${L.std} words; include headings and short paragraphs.)
- "adaptive": string   (AT LEAST ${L.ad} words; for dyslexia/ADHD/autism: short sentences, explicit headings, bullet points, key ideas first; avoid idioms; plain vocabulary.)
- "teacher": string    (AT LEAST ${L.teacher} words; include CEFR rationale, accessibility notes, inclusion/representation review, a clear answer key for the chosen activities, and alternatives if any language is sensitive for ${b.level}. If a Source URL is provided, include a one-line citation.)
All values MUST be plain text (no JSON/arrays/{} inside the values). Use simple Markdown only (## headings, - bullets), never code fences or JSON blocks.

If Exam style is provided, mirror common task types for that exam and include at least ${L.q} questions across the activity types. Use the output language for all student-facing text.

Design notes by teacher:
${aims}

Source text (use or summarize appropriately):
${src}

ADAPTIVE OUTPUT RULES (LD):
• Plain language; active voice. Avoid idioms/figurative language; if one appears, add a literal explanation immediately.
• Sentence length: average ≤ 15 words; never exceed 25 words.
• Paragraphs: 1–3 short sentences; one idea per paragraph.
• Structure: put the most important idea first; add a heading every ~80–120 words.
• Lists: use bullet lists (3–6 bullets) for enumerations; numbered steps (1., 2., 3.) for procedures.
• Formatting hints for readers (assumed by UI): left-aligned, no full justification, bold for keywords only, no italics or ALL-CAPS.
• Add a short “Vocabulary Preview” box with 3–5 key words + student-friendly meanings.
• After each section, include 1–2 micro-questions (yes/no or 1–2 short MCQs, ≤3 options).
• ADHD support: predictable pattern (Heading → 2–3 sentences → tiny task); limit choices.
• Autism support: avoid ambiguous phrasing (“maybe, sort of”); be explicit about who does what; keep sensory details neutral and brief.
• End with a 5–10 item word bank (glossary) of difficult words from the text.
Ensure all of the above while staying at the requested CEFR level. If a higher-level word is necessary, define it inline.
`.trim();
}).`,
    `CEFR level: ${b.level}.`,
    `Output type: ${b.outputType}.`,
    `Language: ${b.outputLanguage}.`,
    b.examStyle && b.examStyle !== "None" ? `Exam style: ${b.examStyle}.` : "",
    b.vocab.length ? `Include/teach vocabulary: ${b.vocab.join(", ")}.` : "",
    b.grammar.length ? `Target grammar: ${b.grammar.join(", ")}.` : "",
    b.preActivities.length ? `Pre-activities: ${b.preActivities.join(", ")}.` : "",
    b.activityTypes.length ? `Activity types in/after text: ${b.activityTypes.join(", ")}.` : "",
    b.youtubeUrl ? `Pair with YouTube: ${b.youtubeUrl}.` : "",
    b.imageQuery ? `Suggested images search: ${b.imageQuery}.` : "",
    b.sourceUrl ? `Source URL: ${b.sourceUrl}.` : "",
    `Length preset: ${b.lengthPreset ?? "Standard"} (targets â€” standard:${L.std}, adaptive:${L.ad}, teacher:${L.teacher}, questions:${L.q}).`,
  ].filter(Boolean).join("\n");

  const src = (b.sourceText || "").trim() || "(no inline source text provided)";

  return `
You are an inclusive language-education assistant. Create classroom materials that are safe, age-appropriate, culturally respectful, and CEFR-aligned.

Return a SINGLE JSON object with keys:
- "standard": string   (AT LEAST ${L.std} words; include headings and short paragraphs.)
- "adaptive": string   (AT LEAST ${L.ad} words; for dyslexia/ADHD/autism: short sentences, explicit headings, bullet points, key ideas first; avoid idioms; plain vocabulary.)
- "teacher": string    (AT LEAST ${L.teacher} words; include CEFR rationale, accessibility notes, inclusion/representation review, a clear answer key for the chosen activities, and alternatives if any language is sensitive for ${b.level}. If a Source URL is provided, include a one-line citation.)

If Exam style is provided, mirror common task types for that exam and include at least ${L.q} questions across the activity types. Use the output language for all student-facing text.

Never include backticks or extra commentaryâ€”JSON only.

Design notes by teacher:
${aims}

Source text (use or summarize appropriately):
${src}
`.trim();
}

const S = (v: unknown) => (typeof v === "string" ? v : JSON.stringify(v, null, 2));

export async function POST(req: Request): Promise<Response> {
  const API = process.env.OPENAI_API_KEY;
  if (!API) return new Response(JSON.stringify({ error: "Missing OPENAI_API_KEY" }), { status: 500 });

  const body = (await req.json()) as Body;
  const prompt = makePrompt(body);

  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${API}` },
    body: JSON.stringify({
      model: MODEL,
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 2000,
      messages: [
        { role: "system", content: "You produce K-12/ELT classroom materials that are inclusive and CEFR-aligned." },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!r.ok) {
    const txt = await r.text();
    return new Response(JSON.stringify({ error: `Upstream ${r.status}: ${txt}` }), { status: 500 });
  }

  const data = await r.json();
  const content = data?.choices?.[0]?.message?.content ?? "{}";

  let parsed: any;
  try { parsed = JSON.parse(content); }
  catch { parsed = { standard: "", adaptive: "", teacher: content }; }

  const out = { standard: S(parsed.standard), adaptive: S(parsed.adaptive), teacher: S(parsed.teacher) };
  return new Response(JSON.stringify(out), { headers: { "Content-Type": "application/json" }, status: 200 });
}