export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

import { NextResponse } from "next/server";

type Seg = { id:number; text:string };

export async function POST(req: Request){
  const idemp = req.headers.get("x-idempotency-key") || undefined;
  const { sentences = [], to = "en", from = "" } = await req.json().catch(()=>({}));
  if (!Array.isArray(sentences)) {
    return NextResponse.json({ ok:false, error:"BAD_INPUT", idempotencyKey:idemp }, { status: 400 });
  }

  // STUB: we simply echo back for now (plug provider later)
  const out: Seg[] = sentences.map((s:Seg) => ({ id: s.id, text: s.text }));
  return NextResponse.json({ ok:true, provider:"stub", from: from || "auto", to, sentences: out, idempotencyKey:idemp });
}