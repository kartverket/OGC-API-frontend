// Internal cluster URL for server-side fetching (SSR)
export function getApiBaseUrlServer() {
  const url = process.env.API_BASE_URL;

  if (url && typeof url === "string" && url.trim().length > 0) {
    return url.replace(/\/+$/, "");
  }

  console.error("[getApiBaseUrlServer] Missing API_BASE_URL env var");
  return undefined;
}

// Public ingress URL for client-side requests
export function getApiBaseUrlPublic() {
  const url = process.env.API_BASE_URL_PUBLIC;

  if (url && typeof url === "string" && url.trim().length > 0) {
    return url.replace(/\/+$/, "");
  }

  console.error("[getApiBaseUrlPublic] Missing API_BASE_URL_PUBLIC env var");
  return undefined;
}
