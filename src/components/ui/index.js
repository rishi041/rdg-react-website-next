// Shared UI atoms (atomic design: the smallest reusable pieces).
// Colors come from the portfolio's CSS variables via the Tailwind tokens in
// globals.css (accent/title/body/surface/field/line) — so every atom follows
// the site's random hue AND dark mode automatically. Borders (border-line) do
// the heavy lifting in dark mode, where shadows are invisible.

export function Button({
  variant = "primary",
  className = "",
  type = "button",
  ...props
}) {
  const variants = {
    primary:
      "bg-accent text-white shadow-sm hover:bg-accent-alt hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed",
    ghost:
      "border border-solid border-line bg-surface text-title hover:border-accent hover:text-accent disabled:opacity-60 disabled:cursor-not-allowed",
    danger:
      "bg-red-500 text-white shadow-sm hover:bg-red-600 disabled:opacity-60",
  };
  return (
    <button
      type={type}
      className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border-none px-5 py-3 text-[0.938rem] font-medium transition-all duration-200 active:scale-[0.98] ${variants[variant]} ${className}`}
      {...props}
    />
  );
}

const fieldClasses =
  "w-full rounded-lg border border-solid border-line bg-field px-4 py-3 text-[0.938rem] text-title outline-none transition-colors placeholder:text-body-light focus:border-accent focus:ring-2 focus:ring-accent/25";

export function Input({ className = "", ...props }) {
  return <input className={`${fieldClasses} ${className}`} {...props} />;
}

export function Textarea({ className = "", ...props }) {
  return (
    <textarea className={`${fieldClasses} resize-y ${className}`} {...props} />
  );
}

export function Select({ className = "", children, ...props }) {
  return (
    <select className={`${fieldClasses} cursor-pointer ${className}`} {...props}>
      {children}
    </select>
  );
}

export function Label({ className = "", children, ...props }) {
  return (
    <label
      className={`mb-1 block text-sm font-medium text-title ${className}`}
      {...props}
    >
      {children}
    </label>
  );
}

export function Card({ className = "", children, ...rest }) {
  return (
    <div
      className={`rounded-xl border border-solid border-line/70 bg-surface p-5 shadow-sm ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

export function Chip({ active = false, className = "", children, ...props }) {
  return (
    <button
      type="button"
      className={`cursor-pointer rounded-full border border-solid px-3 py-1.5 text-xs font-medium transition-all duration-200 active:scale-95 ${
        active
          ? "border-accent bg-accent/15 text-accent"
          : "border-line bg-surface text-body hover:border-accent hover:text-accent"
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Badge({ color = "accent", className = "", children }) {
  const colors = {
    accent: "bg-accent-lighter text-accent-alt",
    yellow: "bg-yellow-100 text-yellow-700",
    green: "bg-green-100 text-green-700",
    red: "bg-red-100 text-red-700",
  };
  return (
    <span
      className={`inline-block rounded-full px-3 py-0.5 text-xs font-semibold ${colors[color]} ${className}`}
    >
      {children}
    </span>
  );
}

export function Spinner({ className = "h-5 w-5" }) {
  return (
    <span
      className={`inline-block animate-spin rounded-full border-2 border-accent border-t-transparent ${className}`}
      role="status"
      aria-label="loading"
    />
  );
}

export function EmptyState({ icon = "uil-box", title, children, action }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-line py-16 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-field">
        <i className={`uil ${icon} text-3xl text-accent`} />
      </span>
      <p className="font-medium text-title">{title}</p>
      {children && <p className="text-sm text-body-light">{children}</p>}
      {action}
    </div>
  );
}
