"use client";
// Needs to be a client component to use usePathname

import { usePathname, useSearchParams } from "next/navigation";
import Image from "next/image";
import NextLink from "next/link";
import { Link } from "@digdir/designsystemet-react";
import styles from "./Header.module.css";
import { useMemo } from "react";
import { useApiBaseUrlSWR } from "@/config/apiConfig.swr";
import { joinApiUrl } from "@/config/apiConfig";


export default function Header() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { apiBaseUrl } = useApiBaseUrlSWR();

  const jsonLink = useMemo(() => {
    if (!apiBaseUrl) return "";
    const params = new URLSearchParams(searchParams.toString());
    params.set("f", "json");
    return `${joinApiUrl(apiBaseUrl, pathname)}?${params.toString()}`;
  }, [apiBaseUrl, pathname, searchParams]);

  return (
    <div className={styles.header}>
      <div className={styles.left}>
        <NextLink href="/">
          <Image src="/gfx/logo.svg" width={117} height={40} alt="Logo" />
        </NextLink>
        <div className={styles.divider}></div>
        <div className={styles.title}>OGC API</div>
        <div className={styles.breadcrumbs}></div>
      </div>

      <div className={styles.links}>
        <Link asChild data-size="sm">
          <NextLink
            href={jsonLink || "#"}
            target="_blank"
            aria-disabled={!jsonLink}
            // optional: make it actually non-clickable when disabled
            onClick={(e) => {
              if (!jsonLink) e.preventDefault();
            }}
          >
            JSON
          </NextLink>
        </Link>
      </div>
    </div>
  );
}
