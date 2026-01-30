let _cachedBaseUrl = null;
let _inFlight = null;


/**
 * Gets the API base URL based on the current environment.
 * - Client-side: fetches runtime config from Next server
 * - Server-side: returns process.env.API_BASE_URL (since this file must remain client-safe, we avoid server-only imports)
 * @returns {Promise<string|undefined>} The API base URL
 */
export async function getApiBaseUrl() {
  // Client-side: ask server for runtime config
  if (typeof window !== "undefined") {
    if (_cachedBaseUrl) {
      return _cachedBaseUrl;
    }

    if (_inFlight) {
      return await _inFlight;
    }

    _inFlight = (async () => {
      const response = await fetch('/api/runtime-config', { cache: 'no-store' });

      if (!response.ok) {
        console.warn('Failed to load runtime-config:', response.status, response.statusText);
        return undefined;
      }

      const data = await response.json();
      const url = data?.apiBaseUrl;

      if (url && typeof url === 'string' && url.trim().length > 0) {
        _cachedBaseUrl = url.replace(/\/+$/, '');
        return _cachedBaseUrl;
      }

      return undefined;
    })();

    return await _inFlight;
  }

  // Server-side fallback (only used if this module is executed server-side)
  const url = process.env.API_BASE_URL;
  if (url && typeof url === 'string' && url.trim().length > 0) {
    return url.replace(/\/+$/, '');
  }

  console.warn("Missing API_BASE_URL env var");
  return undefined;
}

/**
 * Builds a complete API URL from a path.
 * @param {string} path - The API path (e.g., '/collections' or 'collections')
 * @returns {Promise<string>} The complete API URL
 * @throws {Error} If API base URL is not configured
 */
export async function buildApiUrl(path) {
  const baseUrl = await getApiBaseUrl();
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
 * @returns {Promise<string>} The complete API URL
 */
export async function buildItemsApiUrl(collection, searchParams) {
  const baseUrl = await buildApiUrl(`/collections/${collection}/items?f=json`);

  const queryStr = Object.entries(searchParams)
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

  return queryStr !== '' ? `${baseUrl}&${queryStr}` : baseUrl;
}

export function joinApiUrl(baseUrl, path) {
  const cleanBaseUrl = (baseUrl || "").replace(/\/+$/, "");
  const cleanPath = path && path.startsWith("/") ? path : `/${path || ""}`;
  return `${cleanBaseUrl}${cleanPath}`;
}