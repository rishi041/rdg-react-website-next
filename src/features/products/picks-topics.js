// Preset "Top picks in India" topics shown on the main board (no search
// needed). Shared by the server route (which term to ask Gemini for, cache
// key, daily freshness) and the client tabs (labels + "see all" link). Keys
// are what travel in the URL (/api/shop-picks?topic=trending-today).
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

// Preset topics are "today's" lists: ONE generation per topic per calendar
// day (India time). The first visitor after midnight IST pays the Gemini
// call, the result is stored in search_picks, and everyone else that day
// reads it from Postgres. If Gemini is unavailable (daily free quota gone),
// the latest stored list is served instead — never an empty section.
const IST_DAY = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kolkata",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
export const istDayKey = (date = new Date()) => IST_DAY.format(date); // "2026-08-23"
export const isFreshToday = (isoDate) =>
  Boolean(isoDate) && istDayKey(new Date(isoDate)) === istDayKey();

export const getTopic = (key) => PICK_TOPICS.find((t) => t.key === key);
