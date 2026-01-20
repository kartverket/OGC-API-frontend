"use client";
// Needs to be a client component to use usePathname

import { usePathname } from "next/navigation";
import Image from "next/image";
import NextLink from "next/link";
import { Link } from "@digdir/designsystemet-react";
import { buildApiUrl } from "@/config/apiConfig";
import styles from "./Header.module.css";

export default function Header() {
  const jsonLink = `${buildApiUrl(usePathname())}?f=json`;

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
          <NextLink href={jsonLink} target="_blank">
            JSON
          </NextLink>
        </Link>
      </div>
    </div>
  );
}
