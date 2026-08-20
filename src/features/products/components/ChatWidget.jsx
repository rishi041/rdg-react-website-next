"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Spinner } from "@/components/ui";

// Turn the model's [text](url) links into real elements — but ONLY the two
// URL shapes our system prompt allows (own product pages + Google search).
// 📘 Never dangerouslySetInnerHTML model output: parse it into React elements
// so a malicious/hallucinated URL can't become clickable markup.
function renderWithLinks(text) {
  const parts = text.split(/\[([^\]]+)\]\(([^)]+)\)/g);
  // split with 2 capture groups yields [plain, label, url, plain, label, url, …]
  return parts.map((chunk, i) => {
    if (i % 3 === 0) return chunk; // plain text between links
    if (i % 3 === 2) return null; // url — consumed by its label below
    const url = parts[i + 1] ?? "";
    const label = chunk;
    if (url.startsWith("/products/")) {
      return (
        <Link key={i} href={url} className="font-medium underline">
          {label}
        </Link>
      );
    }
    if (url.startsWith("https://www.google.com/search")) {
      return (
        <a
          key={i}
          href={url}
          target="_blank"
          rel="noreferrer noopener"
          className="font-medium underline"
        >
          {label} <i className="uil uil-external-link-alt text-xs" />
        </a>
      );
    }
    return label; // anything else: show the label, drop the link
  });
}

// Floating shopping-assistant chat (lab Project 1 pattern, board edition).
// 📘 useChat does the heavy lifting: it POSTs the message history to
// /api/chat, parses the SSE stream, and re-renders `messages` as text deltas
// arrive — `status` walks ready → submitted → streaming → ready, and stop()
// aborts the fetch mid-stream (the route forwards that abort to Gemini).
export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const { messages, sendMessage, status, stop, error } = useChat();
  const bottomRef = useRef(null);

  const isBusy = status === "submitted" || status === "streaming";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, open]);

  return (
    <>
      {/* launcher — sits below the portfolio's scroll-up arrow (bottom: 5rem) */}
      <button
        type="button"
        aria-label={
          open ? "Close shopping assistant" : "Open shopping assistant"
        }
        onClick={() => setOpen((v) => !v)}
        className="fixed right-4 bottom-16 z-40 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full border-none bg-accent text-2xl text-white shadow-lg transition-all hover:bg-accent-alt hover:shadow-xl"
      >
        <i className={`uil ${open ? "uil-times" : "uil-comment-alt-lines"}`} />
      </button>

      {open && (
        <div className="fixed right-4 bottom-32 z-40 flex h-[min(40rem,calc(100dvh-10rem))] w-[calc(100vw-2rem)] max-w-lg flex-col overflow-hidden rounded-xl border border-solid border-line/70 bg-surface shadow-2xl">
          <div className="flex items-center gap-2 border-b border-solid border-line/70 px-4 py-3">
            <i className="uil uil-robot text-xl text-accent" />
            <div className="min-w-0">
              <div className="text-base font-semibold text-title">
                Shopping assistant
              </div>
              <div className="text-xs text-body-light">
                Knows every product on this board
              </div>
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-3 py-3">
            {messages.length === 0 && (
              <p className="mt-8 px-4 text-center text-sm leading-relaxed text-body-light">
                Ask me anything — &ldquo;what&rsquo;s good for a home
                workout?&rdquo; or &ldquo;help me pick earphones&rdquo;.
              </p>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-base leading-relaxed whitespace-pre-wrap ${
                    message.role === "user"
                      ? "rounded-br-sm bg-accent text-white"
                      : "rounded-bl-sm bg-field text-body [&_a]:text-accent [&_a:hover]:text-accent-alt"
                  }`}
                >
                  {/* 📘 v6 messages are PARTS (text, tool calls, files…) —
                      this basic chat only renders the text parts */}
                  {message.parts.map((part, i) =>
                    part.type === "text" ? (
                      <span key={i}>{renderWithLinks(part.text)}</span>
                    ) : null,
                  )}
                </div>
              </div>
            ))}

            {status === "submitted" && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm bg-field px-4 py-2.5 text-sm text-body-light">
                  <Spinner className="h-3 w-3" /> thinking…
                </div>
              </div>
            )}

            {error && (
              <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-500">
                Something went wrong — try again.
              </p>
            )}

            <div ref={bottomRef} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!input.trim() || isBusy) return;
              sendMessage({ text: input });
              setInput("");
            }}
            className="flex gap-2 border-t border-solid border-line/70 p-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask something…"
              className="min-w-0 flex-1 rounded-lg border border-solid border-line bg-field px-4 py-2.5 text-base text-title outline-none placeholder:text-body-light focus:border-accent"
            />
            {isBusy ? (
              <button
                type="button"
                onClick={stop}
                className="cursor-pointer rounded-lg border-none bg-red-500 px-4 py-2.5 text-base text-white hover:bg-red-600"
              >
                <i className="uil uil-square-shape text-xs" /> Stop
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                className="cursor-pointer rounded-lg border-none bg-accent px-4 py-2.5 text-base text-white transition-colors hover:bg-accent-alt disabled:cursor-not-allowed disabled:opacity-40"
              >
                <i className="uil uil-message" />
              </button>
            )}
          </form>
        </div>
      )}
    </>
  );
}
