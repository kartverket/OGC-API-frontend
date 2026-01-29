import "server-only";

export function getApiBaseUrlServer() {
  const url = process.env.API_BASE_URL;

  if (url && typeof url === "string" && url.trim().length > 0) {
    return url.replace(/\/+$/, "");
  }

  console.warn("[getApiBaseUrlServer] Missing API_BASE_URL env var");
  return undefined;
}
