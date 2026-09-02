// Suspense fallback for the board's streamed AI sections: the section header
// (so the layout doesn't jump when the real content arrives) + three
// card-shaped shimmer blocks (`.shimmer` utility in globals.css).
// 📘 Server component on purpose — it's part of the FIRST flush of streaming
// SSR, shown while the async section next to it is still awaiting its data.
export default function SectionSkeleton({ icon, title }) {
  return (
    <section aria-hidden="true">
      <div className="mb-3 flex items-center gap-2">
        <i className={`uil ${icon} text-accent`} />
        <h2 className="text-sm font-semibold tracking-wide uppercase text-body">
          {title}
        </h2>
        <span className="text-xs text-body-light">loading…</span>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="shimmer h-36 rounded-2xl border border-solid border-line/60 bg-surface"
          />
        ))}
      </div>
    </section>
  );
}
