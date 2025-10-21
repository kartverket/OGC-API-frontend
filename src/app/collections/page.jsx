import { fetchCollections } from '@/utils/api';
import { Heading } from '@digdir/designsystemet-react';
import { Breadcrumbs, CollectionCard } from '@/components';
import styles from './page.module.scss';


export const metadata = {
    title: 'Collections | Administrative enheter | OGC API | Kartverket',
    icons: {
        icon: '/gfx/favicon.png'
    }
};

export default async function Collections() {
    const page = await fetchCollections()

    return (
        <>
            <Breadcrumbs
                breadcrumbs={{
                    '/': 'Administrative enheter',
                    '/collections': 'Collections'
                }}
            />

            <div className={styles.page}>
                <Heading level={1} data-size="sm" className={styles.heading}>Innhold i datasettet</Heading>

                <div className={styles.collections}>
                    {
                        page.collections.map(collection => <CollectionCard key={collection.id} collection={collection} />)
                    }
                </div>
            </div>
        </>
    );
}
