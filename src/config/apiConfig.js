
// Use relative URL clientside, API_BASE_URL serverside
export function getApiBaseUrl() {
  // Client-side: use runtime config if available, otherwise fallback
  if (typeof window !== "undefined") {
    // Next public api base url only for easier local development
    return process.env.NEXT_PUBLIC_API_BASE_URL || "/api";
  }

  // Server-side: use absolute URL from environment
  if (process.env.API_BASE_URL) {
    return process.env.API_BASE_URL;
  }

  // Fallback 
  console.warn("Missing API_BASE_URL env var, using default /api");
  return "/api";
}

export function buildApiUrl(path) {
  const baseUrl = getApiBaseUrl();
  return `${baseUrl}${path}`;
}
