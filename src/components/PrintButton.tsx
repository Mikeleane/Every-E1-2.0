"use client";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50 print:hidden"
      aria-label="Print this page"
    >
      Print
    </button>
  );
}