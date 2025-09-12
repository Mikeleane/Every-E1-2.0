export const dynamic = "force-dynamic";

type Level = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

type Body = {
  isPublic: boolean;
  level: Level;
  outputType: string;
  outputLanguage: string;
  sourceText?: string;
  sourceUrl?: string;
  preActivities: string[];
  vocab: string[];
  grammar: string[];
  activityTypes: string[];
  examStyle?: string;
  dyslexicFriendly: boolean;
};

function snippet(text: string, n = 240) {
  return text.length <= n ? text : text.slice(0, n).trimEnd() + "…";
}

export async function POST(req: Request): Promise<Response> {
  const body = (await req.json()) as Body;

  const src = (body.sourceText?.trim() || "") + (body.sourceUrl ? ` [URL: ${body.sourceUrl}]` : "");
  const srcSnip = snippet(src || "No source provided.");

  const standard =
    `Level: ${body.level}\n` +
    `Type: ${body.outputType}\n` +
    `Language: ${body.outputLanguage}\n\n` +
    `Source:\n${srcSnip}\n\n` +
    (body.vocab.length ? `Include vocabulary: ${body.vocab.join(", ")}\n` : "") +
    (body.grammar.length ? `Target grammar: ${body.grammar.join(", ")}\n` : "") +
    (body.activityTypes.length ? `Activities: ${body.activityTypes.join(", ")}\n` : "") +
    (body.preActivities.length ? `Pre-activities: ${body.preActivities.join(", ")}\n` : "") +
    (body.examStyle && body.examStyle !== "None" ? `Exam style: ${body.examStyle}\n` : "");

  const adaptive =
    `Simplified (${body.level}) version for LD (dyslexia/ADHD/autism):\n` +
    `• Short sentences.\n• Clear structure.\n• Key ideas first.\n\n` +
    `${snippet(src.replace(/\s+/g, " ").replace(/([,;:])\s*/g, "$1 "), 200)}`;

  const teacher =
    `CEFR rationale: ${body.level} — placeholder justification.\n` +
    `Accessibility notes: ${body.dyslexicFriendly ? "Dyslexic-friendly formatting enabled." : "Default formatting."}\n` +
    (body.sourceUrl ? `Original source: ${body.sourceUrl}\n` : "") +
    `Inclusion review: placeholder scan for othering/sensitive language.\n` +
    `Answer key: placeholder answers for chosen activities.\n`;

  return new Response(JSON.stringify({ standard, adaptive, teacher }), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
}