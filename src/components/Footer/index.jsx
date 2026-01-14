import Image from 'next/image';
import NextLink from 'next/link';
import { Divider, Link } from '@digdir/designsystemet-react';
import styles from './Footer.module.css';


export default function Footer() {
    return (
        <>
            <Divider className={styles.divider} />

            <div className={styles.footer}>
                <div className={styles.content}>
                    <Image
                        src="/gfx/logo.svg"
                        width={117}
                        height={40}
                        alt="Logo"
                    />

                    <div className={styles.links}>
                        <Link asChild data-size="sm">
                            <NextLink href="#">Tilgjengelighetserklæring</NextLink>
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}