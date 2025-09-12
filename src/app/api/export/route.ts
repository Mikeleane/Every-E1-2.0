import { Document, HeadingLevel, Packer, Paragraph, TextRun, PageBreak } from "docx";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Sections = {
  standard: string;
  adaptive: string;
  teacher: string;
  meta: {
    level: string;
    outputType: string;
    outputLanguage: string;
    isPublic: boolean;
    examStyle?: string;
    sourceUrl?: string;
    youtubeUrl?: string;
    imageQuery?: string;
  };
};

export async function POST(req: Request): Promise<Response> {
  const body = (await req.json()) as Sections;

  const toParas = (txt: string) =>
    txt.split(/\r?\n/).map((line) =>
      new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: line, size: 24 })] })
    );

  const meta: string[] = [
    "Level: " + body.meta.level,
    "Type: " + body.meta.outputType,
    "Language: " + body.meta.outputLanguage,
    "Public school: " + (body.meta.isPublic ? "Yes" : "No"),
  ];
  if (body.meta.examStyle && body.meta.examStyle !== "None") meta.push("Exam style: " + body.meta.examStyle);
  if (body.meta.sourceUrl) meta.push("Source: " + body.meta.sourceUrl);
  if (body.meta.youtubeUrl) meta.push("YouTube: " + body.meta.youtubeUrl);
  if (body.meta.imageQuery) meta.push("Images: https://www.google.com/images?q=" + encodeURIComponent(body.meta.imageQuery));

  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({ text: "Aontas Activity", heading: HeadingLevel.TITLE }),
        ...meta.map((m) => new Paragraph({ children: [new TextRun({ text: m })] })),
        new PageBreak(),
        new Paragraph({ text: "Standard content", heading: HeadingLevel.HEADING_1 }),
        ...toParas(body.standard),
        new PageBreak(),
        new Paragraph({ text: "Adaptive content (LD)", heading: HeadingLevel.HEADING_1 }),
        ...toParas(body.adaptive),
        new PageBreak(),
        new Paragraph({ text: "Teacher notes + Answer key", heading: HeadingLevel.HEADING_1 }),
        ...toParas(body.teacher),
      ],
    }],
  });

  const buffer = await Packer.toBuffer(doc);
  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": "attachment; filename=\"aontas-activity.docx\"",
    },
    status: 200,
  });
}