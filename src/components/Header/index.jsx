'use client'

import { usePathname } from 'next/navigation';
import Image from 'next/image';
import NextLink from 'next/link';
import { Link } from '@digdir/designsystemet-react';
import { API_BASE_URL } from '@/config/constants.client';
import styles from './Header.module.scss';


export default function Header() {
    const pathname = usePathname();
    const jsonLink = `${API_BASE_URL}${pathname}?f=json`

    return (
        <div className={styles.header}>
            <div className={styles.left}>
                <NextLink href="/">
                    <Image
                        src="/gfx/logo.svg"
                        width={117}
                        height={40}
                        alt="Logo"
                    />
                </NextLink>
                <div className={styles.divider}></div>
                <div className={styles.title}>OGC API</div>
                <div className={styles.breadcrumbs}></div>
            </div>

            <div className={styles.links}>
                <Link asChild data-size="sm">
                    <NextLink href={jsonLink} target="_blank">JSON</NextLink>
                </Link>
            </div>
        </div>
    );
}