/**
 * Gets the API base URL based on the current environment.
 * - Client-side: Uses NEXT_PUBLIC_API_BASE_URL if set, otherwise derives from window.location
 * - Server-side: Uses API_BASE_URL environment variable
 * @returns {string|undefined} The API base URL
 */
export function getApiBaseUrl() {
  // Client-side: derive API URL from current domain
  if (typeof window !== "undefined") {
    // NEXT_PUBLIC_API_BASE_URL used for local development
    if (process.env.NEXT_PUBLIC_API_BASE_URL) {
      return process.env.NEXT_PUBLIC_API_BASE_URL;
    }

    // Localhost fallback for development without env var
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      console.warn('No NEXT_PUBLIC_API_BASE_URL set for localhost. Using default.');
      return 'http://localhost:5000';
    }

    // Production: construct api.mydomain from current domain
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

/**
 * Builds a complete API URL from a path.
 * @param {string} path - The API path (e.g., '/collections' or 'collections')
 * @returns {string} The complete API URL
 * @throws {Error} If API base URL is not configured
 */
export function buildApiUrl(path) {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) {
    throw new Error('API base URL is not configured properly.');
  }
  // Remove trailing slash from baseUrl and ensure path starts with /
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${cleanBaseUrl}${cleanPath}`;
}

/**
 * Builds the API URL for fetching collection items with query parameters.
 * @param {string} collection - The collection name
 * @param {Object} searchParams - Query parameters (limit, offset, filters, etc.)
 * @returns {string} The complete API URL
 */
export function buildItemsApiUrl(collection, searchParams) {
  const baseUrl = buildApiUrl(`/collections/${collection}/items?f=json`);

  const queryStr = Object.entries(searchParams)
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

  return queryStr !== '' ? `${baseUrl}&${queryStr}` : baseUrl;
}
