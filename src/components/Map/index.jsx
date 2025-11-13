'use client'

import { useEffect, useRef, useState } from 'react';
import { createMap, setFeatureCollection, zoomToExtent } from '@/utils/map/map';
import Zoom from './Zoom';
import ZoomToExtent from './ZoomToExtent';
import styles from './Map.module.scss';

export default function Map({ featureCollection, defaultExtent, width, height }) {
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
                setMap(await createMap());
            })();
        },
        [featureCollection]
    );

    useEffect(
        () => {
            if (map === null) {
                return;
            }

            return () => {
                map.setTarget(null);
                map.dispose();
            };
        },
        [map]
    );

    useEffect(
        () => {
            if (map === null) {
                return;
            }

            map.setTarget(mapElementRef.current);
            zoomToExtent(map, defaultExtent);
        },
        [map, defaultExtent]
    );

    useEffect(
        () => {
            if (map === null) {
                return;
            }

            setFeatureCollection(map, featureCollection);
            zoomToExtent(map, defaultExtent);
        },
        [map, defaultExtent, featureCollection]
    );

    return (
        <div className={styles.mapContainer} style={{ width, height }}>
            <div ref={mapElementRef} className={styles.map}></div>

            <div className={styles.buttons}>
                <Zoom map={map} />
                <ZoomToExtent map={map} />
            </div>
        </div>
    );
}