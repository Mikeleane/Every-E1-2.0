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
    b.examStyle && b.examStyle !== "None" ? `Exam style: ${b.examStyle}.` : "",
    b.vocab?.length ? `Include/teach vocabulary: ${b.vocab.join(", ")}.` : "",
    b.grammar?.length ? `Target grammar: ${b.grammar.join(", ")}.` : "",
    b.preActivities?.length ? `Pre-activities: ${b.preActivities.join(", ")}.` : "",
    b.activityTypes?.length ? `Activity types in/after text: ${b.activityTypes.join(", ")}.` : "",
    b.youtubeUrl ? `Pair with YouTube: ${b.youtubeUrl}.` : "",
    b.imageQuery ? `Suggested images search: ${b.imageQuery}.` : "",
    b.sourceUrl ? `Source URL: ${b.sourceUrl}.` : "",
    `Length preset: ${b.lengthPreset ?? "Standard"} (targets ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â standard:${L.std}, adaptive:${L.ad}, teacher:${L.teacher}, questions:${L.q),
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
ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢ Plain language; active voice. Avoid idioms/figurative language; if one appears, add a literal explanation immediately.
ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢ Sentence length: average ÃƒÂ¢Ã¢â‚¬Â°Ã‚Â¤ 15 words; never exceed 25 words.
ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢ Paragraphs: 1ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“3 short sentences; one idea per paragraph.
ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢ Structure: put the most important idea first; add a heading every ~80ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“120 words.
ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢ Lists: use bullet lists (3ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“6 bullets) for enumerations; numbered steps (1., 2., 3.) for procedures.
ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢ Formatting hints for readers (assumed by UI): left-aligned, no full justification, bold for keywords only, no italics or ALL-CAPS.
ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢ Add a short "Vocabulary Preview" box with 3ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“5 key words + student-friendly meanings.
ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢ After each section, include 1ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“2 micro-questions (yes/no or 1ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“2 short MCQs, ÃƒÂ¢Ã¢â‚¬Â°Ã‚Â¤3 options).
ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢ ADHD support: predictable pattern (Heading ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ 2ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“3 sentences ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ tiny task); limit choices.
ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢ Autism support: avoid ambiguous phrasing ("maybe, sort of"); be explicit about who does what; keep sensory details neutral and brief.
ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢ End with a 5ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“10 item word bank (glossary) of difficult words from the text.
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
      standard: `[DEMO] No OPENAI_API_KEY. Echoing prompt start:\n\n${prompt.slice(0, 400)}ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦`,
      adaptive: `[DEMO] Simplified for LD.\n\n${prompt.slice(0, 300)}ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦`,
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
- Targets: standard ÃƒÂ¢Ã¢â‚¬Â°Ã‚Â¥ ${L.std} words, adaptive ÃƒÂ¢Ã¢â‚¬Â°Ã‚Â¥ ${L.ad}, teacher ÃƒÂ¢Ã¢â‚¬Â°Ã‚Â¥ ${L.teacher}.
- Ensure total questions ÃƒÂ¢Ã¢â‚¬Â°Ã‚Â¥ ${L.q} (add micro-questions after each section).
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