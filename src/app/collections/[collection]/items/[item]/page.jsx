import { Fragment } from 'react';
import NextLink from 'next/link';
import { fetchData } from './helpers';
import { Card, Heading, Link } from '@digdir/designsystemet-react';
import { Breadcrumbs, ErrorPage, ItemMap } from '@/components';
import { ArrowLeftIcon, ArrowRightIcon } from '@navikt/aksel-icons';
import styles from './page.module.css';


export default async function Item({ params }) {
    const { collection, item } = await params;
    const { data, status } = await fetchData(collection, item);

    if (status !== 200) {
        return <ErrorPage status={status} />;
    }

    function renderValue(value) {
        return value !== null && value !== '' ?
            value.toString() :
            '-';
    }

    function renderDetails() {
        return (
            <Card className={styles.itemCard}>
                <div className={styles.details}>
                    <div className={styles.header}>
                        <div>Egenskap</div>
                        <div>Verdi</div>
                    </div>

                    <div className={styles.property}>id</div>
                    <div className={styles.value}>{data.id}</div>

                    {
                        Object.entries(data.properties).map(([propName, value]) => (
                            <Fragment key={propName}>
                                <div className={styles.property}>{propName}</div>
                                <div className={styles.value}>{renderValue(value)}</div>
                            </Fragment>
                        ))
                    }
                </div>
            </Card>
        );
    }

    return (
        <>
            <Breadcrumbs
                breadcrumbs={{
                    '/': data.dataset.title,
                    '/collections': 'Collections',
                    [`/collections/${collection}`]: data.collection.title,
                    [`/collections/${collection}/items`]: 'Items',
                    [`/collections/${collection}/items/${data.id}`]: data.id,
                }}
            />

            <div className={styles.page}>
                <Heading level={1} data-size="sm" className={styles.heading}>{data.id}</Heading>

                <div className={styles.content}>
                    <div className={styles.map}>
                        <ItemMap data={data} />
                    </div>

                    <div className={styles.infoCard}>
                        {renderDetails()}

                        <div className={styles.nextPrevLinks}>
                            <Link asChild>
                                <NextLink href={`/collections/${collection}/items/${data.prev}`}>
                                    <ArrowLeftIcon fontSize="28px" />
                                    Forrige item
                                </NextLink>
                            </Link>

                            <Link asChild>
                                <NextLink href={`/collections/${collection}/items/${data.next}`}>
                                    Neste item
                                    <ArrowRightIcon fontSize="28px" />
                                </NextLink>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}