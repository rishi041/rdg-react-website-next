// Preset "Top picks in India" topics shown on the main board (no search
// needed). Shared by the server route (which term to ask Gemini for + daily
// TTL) and the client tabs (labels). Keys are what travel in the URL
// (/api/shop-picks?topic=trending-today) — never the raw prompt text.
export const PICK_TOPICS = [
  {
    key: "trending-today",
    label: "Trending today",
    icon: "uil-fire",
    term: "today's trending products in India",
  },
  {
    key: "daily-use",
    label: "Top 10 daily-use",
    icon: "uil-home",
    term: "top 10 daily use products in India",
  },
  {
    key: "high-demand",
    label: "Top 10 high demand",
    icon: "uil-chart-line",
    term: "top 10 high demand products in India",
  },
];

export const TOPIC_PICK_COUNT = 10;
// preset topics refresh once a day; searched terms keep their forever cache
export const TOPIC_TTL_MS = 24 * 60 * 60 * 1000;

export const getTopic = (key) => PICK_TOPICS.find((t) => t.key === key);
