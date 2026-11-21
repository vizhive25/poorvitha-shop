"use client";
import { useActionState } from "react";
import { applyBulk, previewBulk, type BulkState } from "@/app/admin/(panel)/bulk-actions";
import { inr } from "@/lib/shop";

const show = (v: { price: number; priceOnRequest: boolean }) => (v.priceOnRequest ? "on request" : inr(v.price));

export default function BulkPrices() {
  const [state, action, pending] = useActionState<BulkState, FormData>(previewBulk, {});
  return (
    <div className="space-y-4">
      <form action={action} className="space-y-3 rounded-2xl border bg-white p-5 shadow-sm">
        <input type="file" name="file" accept=".csv,text/csv" required className="text-sm" />
        <button disabled={pending} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-400">{pending ? "Checking…" : "Check the file (nothing is saved yet)"}</button>
      </form>

      {state.error && <p role="alert" className="rounded bg-red-100 px-3 py-2 text-sm text-red-800">{state.error}</p>}
      {state.problems && state.problems.length > 0 && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          <p className="font-semibold">{state.problems.length} row(s) skipped:</p>
          <ul className="mt-1 list-disc pl-5">{state.problems.slice(0, 30).map((p) => <li key={p}>{p}</li>)}</ul>
          {state.problems.length > 30 && <p className="mt-1">…and {state.problems.length - 30} more.</p>}
        </div>
      )}
      {state.changes && (
        <div className="space-y-3 rounded-2xl border bg-white p-5 shadow-sm">
          <p className="font-semibold">{state.changes.length} product(s) will change{state.unchanged ? `, ${state.unchanged} already match` : ""}.</p>
          {state.changes.length > 0 && (
            <>
              <div className="max-h-96 overflow-auto rounded border">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-2">Product</th><th>Price</th><th>MRP</th><th>Stock</th><th>Live</th></tr></thead>
                  <tbody className="divide-y">
                    {state.changes.map((c) => (
                      <tr key={c.slug}>
                        <td className="p-2">{c.name}</td>
                        <td>{show(c.old)} → <b>{show(c.next)}</b></td>
                        <td>{c.old.mrp === c.next.mrp ? "—" : `${inr(c.old.mrp)} → ${inr(c.next.mrp)}`}</td>
                        <td>{c.old.stock === c.next.stock ? "—" : `${c.old.stock} → ${c.next.stock}`}</td>
                        <td>{c.old.active === c.next.active ? "—" : c.next.active ? "yes" : "no"}</td>
                      </tr>))}
                  </tbody>
                </table>
              </div>
              <form action={applyBulk}>
                <input type="hidden" name="changes" value={JSON.stringify(state.changes)} />
                <button className="rounded-lg bg-indigo-700 px-5 py-2 font-semibold text-white">Save these {state.changes.length} changes</button>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
}
