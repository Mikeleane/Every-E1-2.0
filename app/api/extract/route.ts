export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

import { NextResponse } from "next/server";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import { cache } from "../../../lib/lru";

function stripTags(raw:string){
  return (raw || "")
    .replace(/<script[\s\S]*?<\/script>/gi,"")
    .replace(/<style[\s\S]*?<\/style>/gi,"")
    .replace(/<\/?[^>]+>/g," ")
    .replace(/&nbsp;/g," ")
    .replace(/&amp;/g,"&")
    .replace(/&quot;/g,'"')
    .replace(/&#39;/g,"'")
    .replace(/&lt;/g,"<")
    .replace(/&gt;/g,">")
    .replace(/\s+/g," ")
    .trim();
}

export async function POST(req: Request){
  const idemp = req.headers.get("x-idempotency-key") || undefined;
  const { url="", html="", text="" } = await req.json().catch(()=>({}));

  if (!url && !html && !text) {
    return NextResponse.json({ ok:false, error:"NO_INPUT", idempotencyKey:idemp }, { status: 400 });
  }

  if (text) {
    return NextResponse.json({ ok:true, source:"text", title:"Text", text, idempotencyKey:idemp });
  }

  if (html) {
    const doc = new JSDOM(html, { pretendToBeVisual:true }).window.document;
    const art = new Readability(doc).parse();
    const plain = art?.textContent || stripTags(html);
    return NextResponse.json({ ok:true, source:"html", title: art?.title || "Extracted", text: plain, idempotencyKey:idemp });
  }

  // URL path (cached)
  const key = `extract:${url}`;
  const hit = cache.get(key);
  if (hit) return NextResponse.json({ ok:true, source:"cache", ...hit, idempotencyKey:idemp });

  let body = "";
  try{
    const res = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 Every-E1/1.0" } });
    body = await res.text();
    body = body
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<link[^>]+rel=["']stylesheet["'][^>]*>/gi, "");
    const doc = new JSDOM(body, { url, pretendToBeVisual: true }).window.document;
    const art = new Readability(doc).parse();
    const out = { title: art?.title || "Extracted", text: art?.textContent || stripTags(body) };
    cache.set(key, out);
    return NextResponse.json({ ok:true, source:"url", ...out, idempotencyKey:idemp });
  } catch {
    const out = { title:"Link", text: stripTags(body || url) };
    cache.set(key, out);
    return NextResponse.json({ ok:true, source:"fallback", ...out, idempotencyKey:idemp });
  }
}