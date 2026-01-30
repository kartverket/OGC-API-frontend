// src/config/apiConfig.swr.js
"use client";

import useSWRImmutable from "swr/immutable";


let _cachedBaseUrl = null;

async function fetchRuntimeConfigBaseUrl() {
  const response = await fetch("/api/config", { cache: "no-store" });

  if (!response.ok) {
    console.warn("Failed to load config:", response.status, response.statusText);
    return undefined;
  }

  const data = await response.json();
  const url = data?.apiBaseUrl;

  if (url && typeof url === "string" && url.trim().length > 0) {
    return url.replace(/\/+$/, "");
  }

  return undefined;
}

export function useApiBaseUrlSWR() {
  const { data, error, isLoading } = useSWRImmutable(
    "runtime-config:apiBaseUrl",
    async () => {
      if (_cachedBaseUrl) return _cachedBaseUrl;
      const url = await fetchRuntimeConfigBaseUrl();
      if (url) _cachedBaseUrl = url;
      return url;
    },
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    }
  );

  return { apiBaseUrl: data, error, isLoading };
}
