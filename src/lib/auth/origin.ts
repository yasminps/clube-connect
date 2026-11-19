import "server-only";

export function appOrigin() {
  const configured = process.env.CLUB_APP_URL;
  if (!configured && process.env.NODE_ENV === "development") return "http://localhost:3000";
  if (!configured) throw new Error("Configure CLUB_APP_URL.");
  const url = new URL(configured);
  if (url.protocol !== "https:" && !(url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname))) {
    throw new Error("Use HTTPS para CLUB_APP_URL.");
  }
  if (url.username || url.password || url.pathname !== "/" || url.search || url.hash) throw new Error("Use somente a origem em CLUB_APP_URL.");
  return url.origin;
}