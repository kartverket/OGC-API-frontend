'use client';

// Needs to be a client component to use usePathname

import { Link } from '@digdir/designsystemet-react';
import Image from 'next/image';
import NextLink from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import styles from './Header.module.css';

export default function Header() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isCollectionMapPage = /^\/collections\/[^/]+\/map\/?$/.test(pathname);

  const jsonLink = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('f', 'json');
    return `${pathname}?${params.toString()}`;
  }, [pathname, searchParams]);

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
        {!isCollectionMapPage && (
          <Link asChild data-size="sm">
            <NextLink
              href={jsonLink || '#'}
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
        )}
      </div>
    </div>
  );
}
