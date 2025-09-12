"use client";
import PrintButton from "@/components/PrintButton";

import React from "react";

type QA = { q: string; a?: string };
type Pack = {
  title: string; cefr: string; goal: string;
  standard: string; adapted: string; teacher: string[];
  questions: QA[];
};

export default function GeneratePage() {
  const [title, setTitle]   = React.useState("Sample pack");
  const [cefr, setCefr]     = React.useState("B2");
  const [goal, setGoal]     = React.useState("Comprehension");
  const [url, setUrl]       = React.useState("");
  const [text, setText]     = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError]     = React.useState<string | null>(null);
  const [pack, setPack]       = React.useState<Pack | null>(null);
  const [showQs, setShowQs]   = React.useState(true);

  async function generate() {
    setLoading(true); setError(null); setPack(null);
    try {
      if (!text.trim() && !url.trim()) {
        setError("Paste text or provide a URL.");
        setLoading(false);
        return;
      }
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, cefr, goal, url, text }),
      });

      const raw = await res.text();
      let json:any = null; try { json = JSON.parse(raw); } catch {}
      if (!res.ok || !json || json.ok === false) {
        const msg = (json && (json.error || json.message))
          ? String(json.error || "") + (json.message ? (": " + json.message) : "")
          : `HTTP ${res.status} ${res.statusText}: ${raw?.slice(0,200)}`;
        setError(msg); setLoading(false); return;
      }
      setPack(json.pack ?? json);
    } catch (e:any) {
      setError(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{maxWidth:880,margin:"32px auto",padding:"0 12px",fontFamily:"system-ui, sans-serif"}}>
      <h1 style={{fontSize:24,fontWeight:600,marginBottom:8}}>Generate Pack</h1>

      {error && (
        <div role="alert" style={{border:"1px solid #c00",background:"#fff6f6",padding:10,marginBottom:12}}>
          {error}
        </div>
      )}

      <div style={{display:"grid",gap:8}}>
        <label>Title
          <input value={title} onChange={e=>setTitle(e.target.value)} style={{width:"100%"}}/>
        </label>
        <label>CEFR
          <select value={cefr} onChange={e=>setCefr(e.target.value)} style={{width:120}}>
            {["A2","B1","B2","C1"].map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </label>
        <label>Goal
          <input value={goal} onChange={e=>setGoal(e.target.value)} style={{width:"100%"}}/>
        </label>
        <label>URL (optional)
          <input placeholder="https://example.com/article" value={url} onChange={e=>setUrl(e.target.value)} style={{width:"100%"}}/>
        </label>
        <label>Text
          <textarea placeholder="Paste any article or text hereÃ¢â‚¬Â¦" value={text} onChange={e=>setText(e.target.value)} rows={8} style={{width:"100%"}}/>
        </label>
        <div style={{display:"flex",gap:8}}>
          <button type="button" onClick={generate} disabled={loading} style={{padding:"8px 14px"}}>
            {loading ? "GeneratingÃ¢â‚¬Â¦" : "Generate"}
          </button>
          <button type="button" onClick={()=>setShowQs(s=>!s)} style={{padding:"8px 14px"}}>
            {showQs ? "Hide questions" : "Show questions"}
          </button>
        </div>
      </div>

      {pack && (
        <section style={{marginTop:24}}>
          <h2 style={{fontSize:18,fontWeight:700}}>{pack.title} ({pack.cefr})</h2>
          <p><b>Goal:</b> {pack.goal}</p>

          <h3 style={{fontWeight:700}}>Standard</h3>
          <p>{pack.standard}</p>

          <h3 style={{fontWeight:700}}>Adapted</h3>
          <p>{pack.adapted}</p>

          <h3 style={{fontWeight:700}}>Teacher Tasks</h3>
          <ul>{pack.teacher?.map((t,i)=><li key={i}>{t}</li>)}</ul>

          {showQs && (
            <>
              <h3 style={{fontWeight:700}}>Questions</h3>
              <ol>{pack.questions?.map((qa,i)=><li key={i}><b>{qa.q}</b>{qa.a ? ` Ã¢â‚¬â€ ${qa.a}` : ""}</li>)}</ol>
            </>
          )}
        </section>
      )}
    </main>
  );
}