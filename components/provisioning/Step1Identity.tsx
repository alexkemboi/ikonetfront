"use client";

import React, { useState } from "react";

interface Props {
 onContinue: (identity: string) => void;
 onCancel: () => void;
}

export function Step1Identity({ onContinue, onCancel }: Props) {
 const [identity, setIdentity] = useState("MikroTik1");

 function handleSubmit(e: React.FormEvent) {
 e.preventDefault();
 if (identity.trim()) {
 onContinue(identity.trim());
 }
 }

 return (
 <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-6 shadow-xl space-y-6">
 <div className="border-b border-border pb-3">
 <h2 className="text-base font-semibold text-foreground">Router identity</h2>
 <p className="text-xs text-muted-foreground">The identity shown in Winbox under System → Identity.</p>
 </div>

 <div>
 <label className="text-xs font-mono text-muted-foreground">MikroTik identity *</label>
 <input
 type="text"
 required
 value={identity}
 onChange={(e) => setIdentity(e.target.value)}
 placeholder="MikroTik1"
 className="mt-1 w-full rounded-lg border border-border bg-muted p-3 text-sm text-foreground focus:border-amber-500 focus:outline-none"
 />
 <p className="mt-2 text-xs text-muted-foreground">
 Letters, numbers, and spaces — must start and end with a letter or number.
 </p>
 </div>

 <div className="flex justify-end gap-3 border-t border-border pt-4">
 <button
 type="button"
 onClick={onCancel}
 className="rounded-lg border border-border px-5 py-2.5 text-xs font-semibold text-muted-foreground hover:bg-accent"
 >
 Cancel
 </button>
 <button
 type="submit"
 className="rounded-lg bg-amber-500 px-6 py-2.5 text-xs font-semibold text-black hover:bg-amber-400 transition"
 >
 Continue →
 </button>
 </div>
 </form>
 );
}