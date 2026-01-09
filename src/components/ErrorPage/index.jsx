'use client'

import NextLink from 'next/link';
import { notFound, useRouter } from 'next/navigation';
import { Heading, Link, Paragraph } from '@digdir/designsystemet-react';
import { getErrorData } from './helpers';
import styles from './ErrorPage.module.scss';


export default function ErrorPage({ status }) {
    if (status === 404) {
        notFound()
    }

    const router = useRouter();

    function goBack(event) {
        event.preventDefault();
        router.back();
    }

    const { code, text, title } = getErrorData(status);

    return (
        <>
            <div className={styles.page}>
                <Heading level={1} data-size="sm" className={styles.heading}>{code}: {title}</Heading>

                <Paragraph data-size="sm">
                    {text}<br />
                    <Link href="#" onClick={goBack}>Gå tilbake</Link> eller til <Link asChild><NextLink href="/">forsiden</NextLink></Link> for å komme bort fra denne siden.
                </Paragraph>
            </div>
        </>
    );
}