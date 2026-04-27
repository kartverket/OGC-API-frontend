import { fetchSchemaPageData } from '@/services/pageData';
import { createSchemaMetadata } from '@/services/pageMetadata';
import { Card, Heading, Tag } from '@digdir/designsystemet-react';
import { Breadcrumbs, ErrorPage } from '@/components';
import { Details, DetailsContent, DetailsSummary } from '@/components';
import styles from './page.module.css';

export async function generateMetadata({ params }) {
    const { collection } = await params;
    return createSchemaMetadata(collection);
}

export default async function Schema({ params }) {
    const { collection } = await params;
    const { data, status } = await fetchSchemaPageData(collection);

    if (status !== 200) {
        return <ErrorPage status={status} />;
    }

    const properties = data.schema?.properties ?? {};
    const entries = Object.entries(properties).filter(([key]) => key !== 'geometry');

    return (
        <>
            <Breadcrumbs
                breadcrumbs={{
                    '/': data.dataset.title,
                    '/collections': 'Collections',
                    [`/collections/${collection}`]: data.collection.title,
                    [`/collections/${collection}/schema`]: 'Skjema',
                }}
            />

            <div className={styles.page}>
                <Heading level={1} data-size="sm" className={styles.heading}>
                    Skjema — {data.collection.title}
                </Heading>

                <Card className={styles.schemaCard}>
                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Egenskap</th>
                                    <th>Type</th>
                                    <th>Format</th>
                                    <th>Tittel</th>
                                    <th>Beskrivelse</th>
                                    <th>Eksempel</th>
                                    <th>Kodeliste</th>
                                </tr>
                            </thead>
                            <tbody>
                                {'geometry' in properties && (
                                    <tr>
                                        <td><code>geometry</code></td>
                                        <td colSpan={6} className={styles.geometryCell}>
                                            {properties.geometry?.['$ref'] || properties.geometry?.type || '—'}
                                        </td>
                                    </tr>
                                )}
                                {entries.map(([name, prop]) => {
                                    const hasEnum = Array.isArray(prop.enum) && prop.enum.length > 0;
                                    return (
                                        <tr key={name}>
                                            <td><code>{name}</code></td>
                                            <td>
                                                <Tag data-size="sm" data-color="info" className={styles.typeTag}>
                                                    {prop.type ?? '—'}
                                                </Tag>
                                            </td>
                                            <td className={styles.subtle}>{prop.format ?? '—'}</td>
                                            <td>{prop.title ?? '—'}</td>
                                            <td>{prop.description ?? '—'}</td>
                                            <td>
                                                {prop['x-ogc-example'] != null
                                                    ? <code className={styles.example}>{String(prop['x-ogc-example'])}</code>
                                                    : '—'
                                                }
                                            </td>
                                            <td>
                                                {hasEnum
                                                    ? (
                                                        <Details className={styles.enumDetails}>
                                                            <DetailsSummary>
                                                                {prop.enum.length} verdier
                                                            </DetailsSummary>
                                                            <DetailsContent>
                                                                <ul className={styles.enumList}>
                                                                    {prop.enum.map(val => (
                                                                        <li key={val}><code>{String(val)}</code></li>
                                                                    ))}
                                                                </ul>
                                                            </DetailsContent>
                                                        </Details>
                                                    )
                                                    : '—'
                                                }
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </>
    );
}
