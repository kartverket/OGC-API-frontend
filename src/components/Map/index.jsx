'use client'

import { useEffect, useRef, useState } from 'react';
import styles from './Map.module.scss';
import createMap from '@/utils/map/map';
import { getLayer } from '@/utils/map/helpers';

export default function Map({ featureCollection }) {
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
                const olMap = await createMap(featureCollection);
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
        <div className={styles.mapContainer}>
            <div ref={mapElementRef} className={styles.map}></div>
        </div>
    );
}