"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  approveProduct,
  rejectProduct,
  updateProduct,
  generateProductDigest,
} from "../actions";
import ProductImage from "@/features/products/components/ProductImage";
import { createClient } from "@/lib/supabase/client";
import {
  Button,
  Input,
  Textarea,
  Select,
  Label,
  Chip,
  Card,
  Badge,
  EmptyState,
} from "@/components/ui";

// Upload an image from the browser exactly like the Suggest form does (same
// public bucket + "suggestions/" folder the storage policy allows) and return
// its public URL. 📘 Storage upload stays client-side: the file never has to
// travel through a Server Action.
async function uploadImage(file) {
  const supabase = createClient();
  const ext = file.name.split(".").pop();
  const path = `suggestions/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("product-images").upload(path, file);
  if (error) throw error;
  return supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
}

// Status-aware product list for the admin dashboard.
//   mode="pending"  → Approve / Reject / Edit actions
//   mode="approved" → Edit / Unpublish actions + clicks/views stats
// 📘 Client component calling Server Actions directly — no fetch(), no API
// route. useTransition gives a pending flag while the action runs on the
// server; router.refresh() then refetches the revalidated dashboard data.
export default function ProductQueue({
  items,
  categories = [],
  hues = {},
  mode = "pending",
  hasKey = false,
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({});
  // image editing: "keep" current | "upload" a file | "url" paste | "remove"
  const [imageMode, setImageMode] = useState("keep");
  const [file, setFile] = useState(null);

  const startEdit = (p) => {
    setEditingId(p.id);
    setDraft({
      name: p.name ?? "",
      link: p.link ?? "",
      location: p.location ?? "",
      category: p.category ?? categories[0] ?? "Other",
      description: p.description ?? "",
      image_url: p.image_url ?? "",
    });
    setImageMode(p.image_url ? "keep" : "upload");
    setFile(null);
  };

  // Save = (maybe upload the image in the browser) → one Server Action with
  // every field, same shape as a suggestion
  const save = async (p) => {
    let image_url = p.image_url ?? null;
    if (imageMode === "remove") image_url = null;
    else if (imageMode === "url") image_url = draft.image_url.trim() || null;
    else if (imageMode === "upload" && file) image_url = await uploadImage(file);
    await updateProduct(p.id, { ...draft, image_url });
  };

  const run = (id, action) => {
    setBusyId(id);
    startTransition(async () => {
      try {
        await action();
        router.refresh();
      } catch (err) {
        console.error(err);
        // server actions throw readable messages (e.g. grounding quota) —
        // surface them instead of a generic failure
        alert(err?.message || "Action failed — check the console.");
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
              className="h-24 w-24 shrink-0 self-start rounded-lg"
            />
            <div className="min-w-0 flex-1">
              {editing ? (
                <div className="flex flex-col gap-3">
                  <div>
                    <Label htmlFor={`name-${p.id}`}>Product name *</Label>
                    <Input
                      id={`name-${p.id}`}
                      value={draft.name}
                      onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                      placeholder="e.g. Adjustable dumbbell"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`link-${p.id}`}>Purchase link *</Label>
                    <Input
                      id={`link-${p.id}`}
                      type="url"
                      value={draft.link}
                      onChange={(e) => setDraft({ ...draft, link: e.target.value })}
                      placeholder="https://…"
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label htmlFor={`location-${p.id}`}>Location</Label>
                      <Input
                        id={`location-${p.id}`}
                        value={draft.location}
                        onChange={(e) => setDraft({ ...draft, location: e.target.value })}
                        placeholder="e.g. Pune"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`category-${p.id}`}>Category</Label>
                      <Select
                        id={`category-${p.id}`}
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
                  </div>
                  <div>
                    <Label>Image</Label>
                    <div className="mb-2 flex flex-wrap gap-2">
                      {p.image_url && (
                        <Chip active={imageMode === "keep"} onClick={() => setImageMode("keep")}>
                          Keep current
                        </Chip>
                      )}
                      <Chip active={imageMode === "upload"} onClick={() => setImageMode("upload")}>
                        Upload
                      </Chip>
                      <Chip active={imageMode === "url"} onClick={() => setImageMode("url")}>
                        Paste URL
                      </Chip>
                      {p.image_url && (
                        <Chip active={imageMode === "remove"} onClick={() => setImageMode("remove")}>
                          Remove
                        </Chip>
                      )}
                    </div>
                    {/* 📘 key per mode: the file input is uncontrolled, the
                        URL input controlled — never let one DOM node switch */}
                    {imageMode === "upload" && (
                      <Input
                        key="upload"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                        className="!py-2 file:mr-3 file:cursor-pointer file:rounded-md file:border-none file:bg-accent file:px-3 file:py-1.5 file:text-sm file:text-white"
                      />
                    )}
                    {imageMode === "url" && (
                      <Input
                        key="url"
                        type="url"
                        value={draft.image_url}
                        onChange={(e) => setDraft({ ...draft, image_url: e.target.value })}
                        placeholder="https://…/image.jpg"
                      />
                    )}
                    {imageMode === "keep" && (
                      <p className="text-xs text-body-light">Keeping the current image.</p>
                    )}
                    {imageMode === "remove" && (
                      <p className="text-xs text-body-light">
                        The image will be removed — the card falls back to the category colour.
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor={`description-${p.id}`}>Note (optional)</Label>
                    <Textarea
                      id={`description-${p.id}`}
                      rows={3}
                      value={draft.description}
                      onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                      placeholder="Why is it recommended?"
                    />
                  </div>
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
                        {p.review_digest ? (
                          <span title="Grounded buyer summary is live on the product page">
                            <i className="uil uil-comments-alt" /> buyer summary ✓
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={busy || !hasKey}
                            title={
                              hasKey
                                ? "Generate a Google-Search-grounded 'What buyers are saying' summary"
                                : "Needs a Gemini API key"
                            }
                            onClick={() => run(p.id, () => generateProductDigest(p.id))}
                            className="cursor-pointer border-none bg-transparent p-0 text-xs text-accent hover:text-accent-alt disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <i className="uil uil-comments-alt" />{" "}
                            {busy ? "Generating…" : "Generate buyer summary"}
                          </button>
                        )}
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
                    onClick={() => run(p.id, () => save(p))}
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
                    onClick={() => startEdit(p)}
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
