import { fetchQueryablesPageData } from '@/services/pageData';
import { createQueryablesMetadata } from '@/services/pageMetadata';
import { Card, Heading, Tag } from '@digdir/designsystemet-react';
import { Breadcrumbs, ErrorPage } from '@/components';
import styles from './page.module.css';

export async function generateMetadata({ params }) {
    const { collection } = await params;
    return createQueryablesMetadata(collection);
}

export default async function Queryables({ params }) {
    const { collection } = await params;
    const { data, status } = await fetchQueryablesPageData(collection);

    if (status !== 200) {
        return <ErrorPage status={status} />;
    }

    const properties = data.properties ?? {};
    const entries = Object.entries(properties).filter(([key]) => key !== 'geometry');

    return (
        <>
            <Breadcrumbs
                breadcrumbs={{
                    '/': data.dataset.title,
                    '/collections': 'Collections',
                    [`/collections/${collection}`]: data.collection.title,
                    [`/collections/${collection}/queryables`]: 'Queryables',
                }}
            />

            <div className={styles.page}>
                <Heading level={1} data-size="sm" className={styles.heading}>
                    Queryables — {data.collection.title}
                </Heading>

                <Card className={styles.queryablesCard}>
                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Egenskap</th>
                                    <th>Type</th>
                                    <th>Format</th>
                                    <th>Tittel</th>
                                </tr>
                            </thead>
                            <tbody>
                                {'geometry' in properties && (
                                    <tr>
                                        <td><code>geometry</code></td>
                                        <td colSpan={3} className={styles.geometryCell}>
                                            {properties.geometry?.['$ref'] || properties.geometry?.type || '—'}
                                        </td>
                                    </tr>
                                )}
                                {entries.map(([name, prop]) => (
                                    <tr key={name}>
                                        <td><code>{name}</code></td>
                                        <td>
                                            <Tag data-size="sm" data-color="info" className={styles.typeTag}>
                                                {prop.type ?? '—'}
                                            </Tag>
                                        </td>
                                        <td className={styles.subtle}>{prop.format ?? '—'}</td>
                                        <td>{prop.title ?? '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </>
    );
}
