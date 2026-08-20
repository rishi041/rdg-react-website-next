"use client";

import { useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { createClient } from "@/lib/supabase/client";
import { Button, Input, Textarea, Select, Label, Card, Chip } from "@/components/ui";

// 📘 NEXT_PUBLIC_ env vars are inlined into the client bundle at build time,
// so this check also works in the browser. Until real Supabase credentials
// are in .env.local there is no database — surface that instead of a
// confusing "could not submit" error.
const isBackendConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("http")
);

// 📘 Client component: file input + form state + toasts all need the browser.
// The insert runs with the PUBLIC anon key — Row Level Security only allows
// inserting rows with status='pending', so nobody can self-approve.
export default function SuggestForm({ categories = [] }) {
  const EMPTY = {
    name: "",
    link: "",
    location: "",
    category: categories[0] ?? "Other",
    description: "",
    image_url: "",
  };
  const [form, setForm] = useState(EMPTY);
  const [imageMode, setImageMode] = useState("upload"); // "upload" | "url"
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const set = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.link.trim()) {
      toast.error("Please fill in at least the product name and link.");
      return;
    }

    setSubmitting(true);
    const supabase = createClient();
    try {
      let imageUrl = imageMode === "url" ? form.image_url.trim() : "";

      if (imageMode === "upload" && file) {
        const ext = file.name.split(".").pop();
        const path = `suggestions/${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(path, file);
        if (uploadError) throw uploadError;
        imageUrl = supabase.storage.from("product-images").getPublicUrl(path)
          .data.publicUrl;
      }

      const { error } = await supabase.from("products").insert({
        name: form.name.trim(),
        link: form.link.trim(),
        location: form.location.trim() || null,
        category: form.category,
        description: form.description.trim() || null,
        image_url: imageUrl || null,
        status: "pending",
      });
      if (error) throw error;

      toast.success("Thanks! Your suggestion is waiting for approval.");
      setForm(EMPTY);
      setFile(null);
    } catch (err) {
      console.error(err);
      toast.error("Could not submit your suggestion. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="mx-auto w-full max-w-xl">
      {!isBackendConfigured && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-solid border-yellow-500/40 bg-yellow-500/10 px-4 py-3 text-sm text-body">
          <i className="uil uil-exclamation-triangle mt-0.5 text-yellow-500" />
          <span>
            Submissions are disabled — the database isn&apos;t connected yet.
            Add your Supabase keys to <code>.env.local</code> (see SETUP.md).
          </span>
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <Label htmlFor="name">Product name *</Label>
          <Input id="name" value={form.name} onChange={set("name")} placeholder="e.g. Adjustable dumbbell" />
        </div>
        <div>
          <Label htmlFor="link">Purchase link *</Label>
          <Input id="link" type="url" value={form.link} onChange={set("link")} placeholder="https://…" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="location">Location</Label>
            <Input id="location" value={form.location} onChange={set("location")} placeholder="e.g. Pune" />
          </div>
          <div>
            <Label htmlFor="category">Category</Label>
            <Select id="category" value={form.category} onChange={set("category")}>
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
          <div className="mb-2 flex gap-2">
            <Chip active={imageMode === "upload"} onClick={() => setImageMode("upload")}>
              Upload
            </Chip>
            <Chip active={imageMode === "url"} onClick={() => setImageMode("url")}>
              Paste URL
            </Chip>
          </div>
          {/* 📘 key forces a fresh <input> per mode — a file input is
              uncontrolled while the URL input is controlled, and React warns
              if one DOM element switches between the two */}
          {imageMode === "upload" ? (
            <Input
              key="upload"
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="!py-2 file:mr-3 file:cursor-pointer file:rounded-md file:border-none file:bg-accent file:px-3 file:py-1.5 file:text-sm file:text-white"
            />
          ) : (
            <Input
              key="url"
              type="url"
              value={form.image_url}
              onChange={set("image_url")}
              placeholder="https://…/image.jpg"
            />
          )}
        </div>
        <div>
          <Label htmlFor="description">Note (optional)</Label>
          <Textarea
            id="description"
            rows={4}
            value={form.description}
            onChange={set("description")}
            placeholder="Why do you recommend it?"
          />
        </div>
        <Button
          type="submit"
          disabled={submitting || !isBackendConfigured}
          className="mt-2 self-start px-8"
        >
          {submitting ? "Submitting…" : "Submit suggestion"}{" "}
          <i className="uil uil-message" />
        </Button>
      </form>
      <ToastContainer position="top-right" autoClose={5000} theme="dark" />
    </Card>
  );
}
