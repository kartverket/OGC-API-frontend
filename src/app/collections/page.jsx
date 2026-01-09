import { fetchHome } from '@/utils/api';
import { fetchData } from './helpers';
import { Heading } from '@digdir/designsystemet-react';
import { Breadcrumbs, CollectionCard, ErrorPage } from '@/components';
import styles from './page.module.scss';


export async function generateMetadata() {
    const data = await fetchHome();

    return {
        title: `Collections | ${data.title}  | OGC API | Kartverket`,
    };
}

export default async function Collections() {
    const { data, status } = await fetchData();

    if (status !== 200) {
        return <ErrorPage status={status} />;
    }

    return (
        <>
            <Breadcrumbs
                breadcrumbs={{
                    '/': data.dataset.title,
                    '/collections': 'Collections'
                }}
            />

            <div className={styles.page}>
                <Heading level={1} data-size="sm" className={styles.heading}>Innhold i datasettet</Heading>

                <div className={styles.collections}>
                    {data.collections.map(collection => <CollectionCard key={collection.id} collection={collection} />)}
                </div>
            </div>
        </>
    );
}
