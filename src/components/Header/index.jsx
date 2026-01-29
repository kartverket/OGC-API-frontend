"use client";
// Needs to be a client component to use usePathname

import { usePathname } from "next/navigation";
import Image from "next/image";
import NextLink from "next/link";
import { Link } from "@digdir/designsystemet-react";
import { buildApiUrl } from "@/config/apiConfig";
import styles from "./Header.module.css";
import { useEffect, useState } from "react";

export default function Header() {
  const pathname = usePathname();
  const [jsonLink, setJsonLink] = useState("");

  // Need to use useEffect here to avoid hydration mismatch on page refresh
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const url = await buildApiUrl(pathname);
      const next = `${url}?f=json`;

      if (!cancelled) {
        setJsonLink(prev => prev === next ? prev : next);
      }
    })();

    return () => { cancelled = true; };
  }, [pathname]);

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
          <NextLink href={jsonLink || "#"} target="_blank" aria-disabled={!jsonLink}>
            JSON
          </NextLink>
        </Link>
      </div>
    </div>
  );
}
