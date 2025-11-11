import { fetchHome, fetchItem } from '@/utils/api';
import React from 'react';
import { Heading } from '@digdir/designsystemet-react';
import { Breadcrumbs } from '@/components';
import styles from './page.module.scss';
import { MapImage } from '@/components';

async function fetchPageData(collection, itemId) {
    const promises = [
        fetchHome(),
        fetchItem(collection, itemId)
    ];

    const result = await Promise.all(promises);       

    return {
        ...result[1],
        datasetTitle: result[0].title
    }
}

export default async function Item({ params }) {
    const { collection, item } = await params;
    const data = await fetchPageData(collection, item);
    const collectionTitle = data.links.find(link => link.rel === 'collection').title;
    const feature = data;


function ItemDetails({ data }) {
  if (!data) return <p>Ingen data</p>;

  const obj =
    data.type === "Feature" ? data.properties :
    data.type === "FeatureCollection" ? data.features[0]?.properties :
    data;

  if (!obj || typeof obj !== "object") return <p>Ingen data</p>;

  return (
    <div className={styles.details}>
        <div className={styles.header}>
            <div>Property</div><div>Value</div>
        </div>
      
        {Object.entries(obj).map(([k, v]) => (
          <React.Fragment key={k}>
                <div className={styles.key}>{k}</div>
                <div className={styles.val}>
                    {typeof v === "object" ? JSON.stringify(v) : String(v ?? "")}
                </div>
            </React.Fragment>
        ))}
</div>
  );
}


    return (
        <>
            <Breadcrumbs
                breadcrumbs={{
                    '/': data.datasetTitle,
                    '/collections': 'Collections',
                    [`/collections/${collection}`]: collectionTitle,
                    [`/collections/${collection}/items`]: 'Items',
                    [`/collections/${collection}/items/${data.id}`]: data.id,
                }}
            />

            <div className={styles.page}>
                <Heading level={1} data-size="sm" className={styles.heading}>{data.id}</Heading>
                <div className={styles.content}>
                     <div className={styles.map}>
                    <MapImage
                        featureCollection={data.geometry}
                        options={{
                            
                            padding: [30, 30, 30, 30],
                            constrainResolution: false
                        }}
                    />
                    </div>       
                    <div className={styles.infocard}>
                        <ItemDetails data={data.properties} />                        
                    </div>
                            
                </div>
            </div>
        </>
    );
}