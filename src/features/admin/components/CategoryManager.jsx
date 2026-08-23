"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addCategory, deleteCategory } from "../actions";
import { Button, Input, Card } from "@/components/ui";

// Manage the category list that drives the board chips and the suggest form.
// 📘 Client component calling Server Actions — same pattern as PendingQueue.
export default function CategoryManager({ categories }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();

  // 📘 The Server Action already revalidates /admin, and router.refresh()
  // re-fetches the list. We deliberately DON'T tie the button to the
  // transition's pending flag: that flag only clears once the whole page
  // has re-rendered, so on a busy dev server the button looked "stuck" even
  // though the row was already saved. The button re-enables the moment the
  // action resolves; the list catches up as soon as the refresh lands.
  const run = async (action, after) => {
    setError("");
    setBusy(true);
    try {
      await action();
      after?.();
      startTransition(() => router.refresh());
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <h3 className="mb-3 font-semibold text-title">
        <i className="uil uil-apps text-accent" /> Categories
      </h3>
      <div className="mb-4 flex flex-wrap gap-2">
        {categories.map((c) => (
          <span
            key={c.id}
            className="flex items-center gap-1.5 rounded-full border border-solid border-line bg-field px-3 py-1 text-sm text-title"
          >
            {/* the category's auto-assigned color, used across the board */}
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: `hsl(${c.hue ?? 210} 70% 50%)` }}
            />
            {c.name}
            <button
              type="button"
              aria-label={`Delete ${c.name}`}
              disabled={busy}
              onClick={() => run(() => deleteCategory(c.id))}
              className="cursor-pointer border-none bg-transparent text-body-light hover:text-red-500"
            >
              <i className="uil uil-times" />
            </button>
          </span>
        ))}
        {!categories.length && (
          <span className="text-sm text-body-light">No categories yet.</span>
        )}
      </div>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          run(() => addCategory(name), () => setName(""));
        }}
      >
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New category…"
          className="!py-2 text-sm"
        />
        <Button type="submit" disabled={busy || !name.trim()} className="!py-2 text-sm">
          {busy ? "Adding…" : "Add"}
        </Button>
      </form>
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </Card>
  );
}
