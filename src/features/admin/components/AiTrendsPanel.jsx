"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { regenerateAiTrends } from "../actions";
import { Button, Card, Badge } from "@/components/ui";

// Control panel for the board's "AI trending this week" strip.
// The strip auto-refreshes weekly (lazy, on the first visit after expiry);
// this button forces a refresh NOW — useful right after adding a category.
export default function AiTrendsPanel({ generatedAt, itemCount, hasKey }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const regenerate = () => {
    setError("");
    setDone(false);
    startTransition(async () => {
      try {
        await regenerateAiTrends();
        setDone(true);
        router.refresh();
      } catch (err) {
        setError(err.message);
      }
    });
  };

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-title">
            <i className="uil uil-robot text-accent" /> AI trending
          </h3>
          <p className="mt-1 text-sm text-body-light">
            {generatedAt ? (
              <>
                Last generated{" "}
                {new Date(generatedAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                · {itemCount} picks · auto-refreshes weekly using your category
                list
              </>
            ) : (
              "No picks cached yet — generates from your category list, then auto-refreshes weekly."
            )}
          </p>
        </div>
        <Button
          disabled={isPending || !hasKey}
          onClick={regenerate}
          className="!py-2 text-sm"
        >
          {isPending ? "Generating…" : "Regenerate now"}
        </Button>
      </div>
      {!hasKey && (
        <p className="mt-3 rounded-lg border border-solid border-yellow-500/40 bg-yellow-500/10 px-3 py-2 text-sm text-body">
          <i className="uil uil-exclamation-triangle" /> Gemini key missing —
          set <code className="text-title">GOOGLE_GENERATIVE_AI_API_KEY</code>{" "}
          in <code className="text-title">.env.local</code> (get one free at
          aistudio.google.com/apikey), restart the dev server, and this section
          plus the board strip will activate.
        </p>
      )}
      {done && (
        <p className="mt-3 text-sm text-green-500">
          <Badge color="green">done</Badge> Fresh picks are live on the board.
        </p>
      )}
      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
    </Card>
  );
}
