import { createMetadata, fetchData } from './helpers';
import { Card, Heading, ListItem, ListUnordered } from '@digdir/designsystemet-react';
import { Breadcrumbs } from '@/components';
import styles from './page.module.css';


export const generateMetadata = async ({ params }) => createMetadata(params);

export default async function Queryables({ params }) {
    const { collection } = await params;
    const { data, status } = await fetchData(collection);

    if (status !== 200) {
        return <ErrorPage status={status} />;
    }

    function renderQueryable(property) {
        return (
            <>
                <span>{property.title}</span>
                <span>
                    (<span>{property.type}</span>)
                </span>
                {
                    'format' in property && (
                        <span>
                            (<span>{property.format}</span>)
                        </span>
                    )
                }
            </>
        );
    }

    return (
        <>
            <Breadcrumbs
                breadcrumbs={{
                    '/': 'Administrative enheter',
                    '/collections': 'Collections',
                    [`/collections/${collection}`]: data.collection.title,
                    [`/collections/${collection}/queryables`]: 'Queryables'
                }}
            />

            <div className={styles.page}>
                <Heading level={1} data-size="sm" className={styles.heading}>{data.collection.title}</Heading>

                <Card className={styles.queryables}>
                    <Heading level={2} data-size="2xs">Queryables</Heading>

                    <ListUnordered>
                        {
                            'geometry' in data.properties && (
                                <ListItem>geometry</ListItem>
                            )
                        }
                        {
                            Object.entries(data.properties)
                                .filter(entry => entry[0] !== 'geometry')
                                .map(entry => (
                                    <ListItem key={entry[1].title}>{renderQueryable(entry[1])}</ListItem>
                                ))
                        }
                    </ListUnordered>
                </Card>
            </div>
        </>
    );
}
