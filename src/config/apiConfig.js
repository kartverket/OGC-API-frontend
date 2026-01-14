
// Use api subdomain clientside, API_BASE_URL serverside
export function getApiBaseUrl() {
  // Client-side: derive API URL from current domain
  if (typeof window !== "undefined") {
    // NEXT_PUBLIC_API_BASE_URL used for local development only
    if (process.env.NEXT_PUBLIC_API_BASE_URL) {
      return process.env.NEXT_PUBLIC_API_BASE_URL;
    }

    // Production: construct api.mydomain from current domain
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    return `${protocol}//api.${hostname}`;
  }

  // Server-side: use absolute URL from environment
  if (process.env.API_BASE_URL) {
    return process.env.API_BASE_URL;
  }

  console.warn("Missing API_BASE_URL env var");
  return undefined;
}

export function buildApiUrl(path) {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) {
    throw new Error('API base URL is not configured properly.');
  }
  // Remove trailing slash from baseUrl and ensure path starts with /
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  console.log(`path: ${cleanBaseUrl}${cleanPath}`)
  return `${cleanBaseUrl}${cleanPath}`;
}
