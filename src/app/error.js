'use client'

import { useRouter } from 'next/navigation';
import NextLink from 'next/link';
import { Heading, Link, Paragraph } from '@digdir/designsystemet-react';
import styles from '@/components/ErrorPage/ErrorPage.module.scss';


export default function Error() {
    const router = useRouter();

    function goBack(event) {
        event.preventDefault();
        router.back();
    }

    return (
        <>
            <div className={styles.page}>
                <Heading level={1} data-size="sm" className={styles.heading}>500: Ubehandlet feil</Heading>

                <Paragraph data-size="sm">
                    En ubehandlet feil har oppstått.<br/>
                    <Link href="#" onClick={goBack}>Gå tilbake</Link> eller til <Link asChild><NextLink href="/">forsiden</NextLink></Link> for å komme bort fra denne siden.
                </Paragraph>
            </div>
        </>
    );
}