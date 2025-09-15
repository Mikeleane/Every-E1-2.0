import type { NextApiRequest, NextApiResponse } from "next";

type Body = {
  level?: string;
  outputType?: string;
  outputLanguage?: string;
  isPublic?: boolean | string;
  lengthPreset?: string;
  sourceText?: string;
  sourceUrl?: string;
  youtubeUrl?: string;
  imageQuery?: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET" && req.query.health === "1") {
    res.status(200).json({ ok: true, route: "/api/generate (pages)", allow: ["GET","POST"] });
    return;
  }
  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    res.status(405).json({ ok:false, error:"Use POST /api/generate" });
    return;
  }

  let body: Body | string = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = { sourceText: body }; }
  }
  const src = (typeof body === "object" && body?.sourceText ? String(body.sourceText) : "").trim();
  if (!src) {
    res.status(400).json({ ok:false, error:"Empty input (provide text)." });
    return;
  }

  const standard = `Hi!
I wanted to update you about the club meeting you missed.
We planned a charity bake sale for next Friday.
Could you bring cookies?
We need two posters and a sign-up sheet.
Mr. Patel asked us to help.
Are you free to help on Wednesday?
Please reply if you can help. Thanks!
### Questions
1) What event did we plan?
2) When is it?
3) What should you bring?
4) Who asked us to help?
5) How many posters do we need?
6) What extra document is needed?
7) When do we need help?
8) What should you do now?`;

  const adaptive = `Hi!
We planned a bake sale. It is next Friday.
Please bring cookies.
We need two posters and a sign-up sheet.
Mr. Patel asked us to help.
Can you help on Wednesday?
Please reply. Thanks!
### Questions
1) Did we plan a bake sale? (Yes/No)
2) Is it next Friday? (Yes/No)
3) Should you bring cookies? (Yes/No)
4) Who asked us to help? (a) Mr. Patel (b) the principal (c) a student
5) Posters needed? (a) two (b) none (c) five
6) Extra item needed? (a) sign-up sheet (b) tickets (c) permission slip
7) Help day? (a) Wednesday (b) Sunday (c) Saturday
8) What should you do now? (a) reply (b) ignore (c) wait a week)`;

  const teacher = `### Answers
1) charity bake sale
2) next Friday
3) cookies
4) Mr. Patel
5) two posters
6) a sign-up sheet
7) Wednesday
8) reply`;

  res.status(200).json({ ok:true, standard, adaptive, teacher });
}