"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { approveProduct, rejectProduct, updateProduct } from "../actions";
import ProductImage from "@/features/products/components/ProductImage";
import { Button, Input, Select, Card, Badge, EmptyState } from "@/components/ui";

// Status-aware product list for the admin dashboard.
//   mode="pending"  → Approve / Reject / Edit actions
//   mode="approved" → Edit / Unpublish actions + clicks/views stats
// 📘 Client component calling Server Actions directly — no fetch(), no API
// route. useTransition gives a pending flag while the action runs on the
// server; router.refresh() then refetches the revalidated dashboard data.
export default function ProductQueue({ items, categories = [], hues = {}, mode = "pending" }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({});

  const run = (id, action) => {
    setBusyId(id);
    startTransition(async () => {
      try {
        await action();
        router.refresh();
      } catch (err) {
        console.error(err);
        alert("Action failed — check the console.");
      } finally {
        setBusyId(null);
        setEditingId(null);
      }
    });
  };

  if (!items.length) {
    return mode === "pending" ? (
      <EmptyState icon="uil-check-circle" title="No pending suggestions">
        New submissions will show up here.
      </EmptyState>
    ) : (
      <EmptyState icon="uil-box" title="No approved products yet">
        Approve a suggestion and it will appear here (and on the board).
      </EmptyState>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {items.map((p) => {
        const busy = isPending && busyId === p.id;
        const editing = editingId === p.id;
        return (
          <Card key={p.id} className="flex flex-col gap-4 sm:flex-row">
            <ProductImage
              src={p.image_url}
              alt={p.name}
              hue={hues[p.category] ?? 210}
              className="h-24 w-24 shrink-0 rounded-lg"
            />
            <div className="min-w-0 flex-1">
              {editing ? (
                <div className="flex flex-col gap-2">
                  <Input
                    value={draft.name}
                    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                    placeholder="Name"
                  />
                  <Input
                    value={draft.link}
                    onChange={(e) => setDraft({ ...draft, link: e.target.value })}
                    placeholder="Link"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={draft.location ?? ""}
                      onChange={(e) => setDraft({ ...draft, location: e.target.value })}
                      placeholder="Location"
                    />
                    <Select
                      value={draft.category}
                      onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                    >
                      {categories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <Input
                    value={draft.description ?? ""}
                    onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                    placeholder="Description"
                  />
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-title">{p.name}</h3>
                    {p.status === "pending" ? (
                      <Badge color="yellow">pending</Badge>
                    ) : (
                      <Badge color="green">approved</Badge>
                    )}
                    <Badge>{p.category}</Badge>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-body">
                    {p.description || "No description"}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-4">
                    <a
                      href={p.link}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block max-w-60 truncate text-sm text-accent hover:text-accent-alt"
                    >
                      {p.link}
                    </a>
                    {mode === "approved" && (
                      <span className="flex items-center gap-3 text-xs text-body-light">
                        <span title="Buy clicks">
                          <i className="uil uil-mouse-alt" /> {p.clicks} clicks
                        </span>
                        <span title="Detail-page views">
                          <i className="uil uil-eye" /> {p.views} views
                        </span>
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
            <div className="flex shrink-0 flex-row gap-2 sm:flex-col">
              {editing ? (
                <>
                  <Button
                    disabled={busy}
                    onClick={() => run(p.id, () => updateProduct(p.id, draft))}
                    className="!py-2 text-sm"
                  >
                    Save
                  </Button>
                  <Button
                    variant="ghost"
                    disabled={busy}
                    onClick={() => setEditingId(null)}
                    className="!py-2 text-sm"
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  {mode === "pending" && (
                    <Button
                      disabled={busy}
                      onClick={() => run(p.id, () => approveProduct(p.id))}
                      className="!py-2 text-sm"
                    >
                      {busy ? "Working…" : "Approve"}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    disabled={busy}
                    onClick={() => {
                      setEditingId(p.id);
                      setDraft({
                        name: p.name,
                        link: p.link,
                        location: p.location,
                        category: p.category,
                        description: p.description,
                      });
                    }}
                    className="!py-2 text-sm"
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    disabled={busy}
                    onClick={() => run(p.id, () => rejectProduct(p.id))}
                    className="!py-2 text-sm"
                  >
                    {busy
                      ? "Working…"
                      : mode === "pending"
                        ? "Reject"
                        : "Unpublish"}
                  </Button>
                </>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
