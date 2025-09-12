export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Level = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

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
};

const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini"; // override via env if you want
const API_KEY = process.env.OPENAI_API_KEY;

function makePrompt(b: Body) {
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
  ].filter(Boolean).join("\n");

  const src = (b.sourceText || "").trim() || "(no inline source text provided)";

  return `
You are an inclusive language-education assistant. Create classroom materials that are safe, age-appropriate, culturally respectful, and CEFR-aligned.

Return a SINGLE JSON object with keys:
- "standard": string
- "adaptive": string   (for dyslexia/ADHD/autism: short sentences, explicit headings, bullet points, key ideas first; avoid idioms; plain vocabulary.)
- "teacher": string    (CEFR rationale, accessibility notes, inclusion/representation review, answer key for chosen activities, and alternatives if any language is sensitive for ${b.level}. If a Source URL is provided, include a one-line citation.)

Never include backticks or extra commentary—JSON only.

Design notes by teacher:
${aims}

Source text (use or summarize appropriately):
${src}
`.trim();
}

export async function POST(req: Request): Promise<Response> {
  if (!API_KEY) {
    return new Response(JSON.stringify({ error: "Missing OPENAI_API_KEY" }), { status: 500 });
  }
  const body = (await req.json()) as Body;
  const prompt = makePrompt(body);

  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      response_format: { type: "json_object" },
      temperature: 0.7,
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
  const content = data?.choices?.[0]?.message?.content || "{}";

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    parsed = { standard: "", adaptive: "", teacher: content }; // resilient fallback
  }

  return new Response(JSON.stringify(parsed), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
}