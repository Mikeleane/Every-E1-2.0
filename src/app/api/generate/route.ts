export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Level = "A1"|"A2"|"B1"|"B2"|"C1"|"C2";
type OutputType = "Informal email"|"Formal email"|"Blog post"|"Report"|"Story"|"Article";
type ExamStyle = "None"|"Cambridge"|"Trinity"|"TOEFL"|"Linguaskill"|"APTIS";
type LengthPreset = "Brief"|"Standard"|"Extended"|"Exam pack";

type Body = {
  isPublic: boolean;
  level: Level;
  outputType: OutputType;
  outputLanguage: string;
  sourceText?: string;
  sourceUrl?: string;
  youtubeUrl?: string;
  imageQuery?: string;
  preActivities: string[];
  vocab: string[];
  grammar: string[];
  activityTypes: string[];
  examStyle: ExamStyle;
  dyslexicFriendly?: boolean;
  lengthPreset?: LengthPreset;
};

function lengths(preset?: LengthPreset) {
  switch (preset) {
    case "Brief":      return { std: 120, ad: 100, teacher: 120, q: 3 };
    case "Extended":   return { std: 300, ad: 220, teacher: 220, q: 8 };
    case "Exam pack":  return { std: 400, ad: 280, teacher: 260, q: 12 };
    default:           return { std: 200, ad: 160, teacher: 180, q: 6 }; // Standard
  }
}

function makePrompt(b: Body) {
  const L = lengths(b.lengthPreset);
  const aims = [
  `Audience: school classroom (${b.isPublic ? "public" : "non-public"}).`,
  `CEFR level: ${b.level}.`,
  `Output type: ${b.outputType}.`,
  `Language: ${b.outputLanguage}.`,
  `Exam style: ${b.examStyle}.`,
  `Dyslexia-friendly: ${b.dyslexia ? "on" : "off"}.`,
  `Vocabulary to include: ${(b.vocab || []).join(", ") || "(none)"}`,
  `Grammar to include: ${(b.grammar || []).join(", ") || "(none)"}`,
  `Activities: ${(b.activities || []).join(", ") || "(none)"}`,
  `YouTube pairing: ${b.youtubeUrl || "(none)"}`,
  `Suggested images search: ${b.imageQuery || "(none)"}`,
  `Source URL: ${b.sourceUrl || "(none)"}`,
  `Length preset: ${b.lengthPreset ?? "Standard"} (targets — standard:${L.std}, adaptive:${L.ad}, teacher:${L.teacher}, questions:${L.q}).`,
].filter(Boolean).join("\n");

  const src = (b.sourceText || "").trim() || "(no inline source text provided)";

  return [
    "You are an inclusive language-education assistant. Create classroom materials that are safe, age-appropriate, culturally respectful, and CEFR-aligned.",
    "",
    `Return a SINGLE JSON object with keys:
- "standard": string   (AT LEAST ${L.std} words; include headings and short paragraphs.)
- "adaptive": string   (AT LEAST ${L.ad} words; for dyslexia/ADHD/autism: short sentences, explicit headings, bullet points, key ideas first; avoid idioms; plain vocabulary.)
- "teacher": string    (AT LEAST ${L.teacher} words; include CEFR rationale, accessibility notes, inclusion/representation review, a clear answer key for the chosen activities, and alternatives if any language is sensitive for ${b.level}. If a Source URL is provided, include a one-line citation.)
All values MUST be plain text (no JSON/arrays/{} inside the values). Use simple Markdown only (## headings, - bullets), never code fences or JSON blocks.`,
    "",
    b.examStyle && b.examStyle !== "None"
      ? `If Exam style is provided ("${b.examStyle}"), mirror common task types for that exam and include at least ${L.q} questions across the activity types. Use the output language for all student-facing text.`
      : `Include at least ${L.q} questions across the chosen activity types. Use the output language for all student-facing text.`,
    "",
    "Design notes by teacher:",
    aims,
    "",
    "Source text (use or summarize appropriately):",
    src,
    "",
    `ADAPTIVE OUTPUT RULES (LD):
ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ Plain language; active voice. Avoid idioms/figurative language; if one appears, add a literal explanation immediately.
ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ Sentence length: average ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â°Ãƒâ€šÃ‚Â¤ 15 words; never exceed 25 words.
ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ Paragraphs: 1ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ3 short sentences; one idea per paragraph.
ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ Structure: put the most important idea first; add a heading every ~80ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ120 words.
ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ Lists: use bullet lists (3ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ6 bullets) for enumerations; numbered steps (1., 2., 3.) for procedures.
ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ Formatting hints for readers (assumed by UI): left-aligned, no full justification, bold for keywords only, no italics or ALL-CAPS.
ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ Add a short "Vocabulary Preview" box with 3ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ5 key words + student-friendly meanings.
ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ After each section, include 1ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ2 micro-questions (yes/no or 1ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ2 short MCQs, ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â°Ãƒâ€šÃ‚Â¤3 options).
ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ ADHD support: predictable pattern (Heading ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ 2ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ3 sentences ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ tiny task); limit choices.
ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ Autism support: avoid ambiguous phrasing ("maybe, sort of"); be explicit about who does what; keep sensory details neutral and brief.
ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ End with a 5ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ10 item word bank (glossary) of difficult words from the text.
Ensure all of the above while staying at the requested CEFR level. If a higher-level word is necessary, define it inline.`
  ].join("\n");
}

function S(v: unknown) {
  return typeof v === "string" ? v : JSON.stringify(v, null, 2);
}

async function generateViaOpenAI(prompt: string): Promise<{ standard: string; adaptive: string; teacher: string }> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return {
      standard: `[DEMO] No OPENAI_API_KEY. Echoing prompt start:\n\n${prompt.slice(0, 400)}ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦`,
      adaptive: `[DEMO] Simplified for LD.\n\n${prompt.slice(0, 300)}ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦`,
      teacher: `[DEMO] Teacher notes + answer key placeholder.`,
    };
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "You return ONLY valid JSON with keys standard, adaptive, teacher." },
        { role: "user", content: prompt },
      ],
    }),
  });

  const json: any = await res.json();
  const content: string = json?.choices?.[0]?.message?.content ?? "";
  let parsed: any = {};
  try { parsed = JSON.parse(content); } catch { parsed = {}; }

  return {
    standard: S(parsed.standard || ""),
    adaptive: S(parsed.adaptive || ""),
    teacher:  S(parsed.teacher  || ""),
  };
}

function wc(s: string) { return s.trim().split(/\s+/).filter(Boolean).length; }
function countQs(s: string) { return (s.match(/\n\d+[\.)]\s/g) || []).length; }

async function enforceMinimums(b: Body, out: {standard:string; adaptive:string; teacher:string}) {
  const L = lengths(b.lengthPreset);
  const tooShort = {
    standard: wc(out.standard) < L.std,
    adaptive: wc(out.adaptive) < L.ad,
    teacher: wc(out.teacher) < L.teacher,
  };
  const totalQs = countQs(out.standard + "\n" + out.adaptive);
  const needQs = totalQs < L.q;

  if (tooShort.standard || tooShort.adaptive || tooShort.teacher || needQs) {
    const ask = `Please expand ONLY the missing pieces:
- Targets: standard ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â°Ãƒâ€šÃ‚Â¥ ${L.std} words, adaptive ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â°Ãƒâ€šÃ‚Â¥ ${L.ad}, teacher ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â°Ãƒâ€šÃ‚Â¥ ${L.teacher}.
- Ensure total questions ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â°Ãƒâ€šÃ‚Â¥ ${L.q} (add micro-questions after each section).
Return a JSON object with any changed keys (standard/adaptive/teacher).`;

    const more = await generateViaOpenAI(makePrompt(b) + "\n\n" + ask);
    out = { ...out, ...more };
  }
  return out;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const prompt = makePrompt(body);
    const out0 = await generateViaOpenAI(prompt);
    const out  = await enforceMinimums(body, out0);
    return new Response(JSON.stringify(out), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: String(err?.message ?? err) }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
}