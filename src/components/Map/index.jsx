'use client'

import { useEffect, useRef, useState } from 'react';
import { createMap, setFeatureCollection } from '@/utils/map/map';
import { getLayer } from '@/utils/map/helpers';
import styles from './Map.module.scss';

export default function Map({ featureCollection, width, height }) {
    const [map, setMap] = useState(null);
    const mapElementRef = useRef(null);
    const initRef = useRef(true);

    useEffect(
        () => {
            if (!initRef.current) {
                return;
            }

            initRef.current = false;

            (async () => {
                const olMap = await createMap();
                setMap(olMap);
            })();
        },
        [featureCollection]
    );

    useEffect(
        () => {
            if (map === null) {
                return;
            }
            
            setFeatureCollection(map, featureCollection);
        },
        [map, featureCollection]
    );

    useEffect(
        () => {
            if (map === null) {
                return;
            }

            map.setTarget(mapElementRef.current);

            const vectorLayer = getLayer(map, 'features');
            const vectorSource = vectorLayer.getSource();
            const view = map.getView();
            const extent = vectorSource.getExtent();

            view.fit(extent, map.getSize());

            return () => {
                map.setTarget(null)
                map.dispose();
            }
        },
        [map]
    );

    return (
        <div className={styles.mapContainer} style={{ width, height }}>
            <div ref={mapElementRef} className={styles.map}></div>
        </div>
    );
}