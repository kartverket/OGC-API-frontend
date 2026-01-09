'use client'

import { useEffect, useRef } from 'react';
import Zoom from './Zoom';
import ZoomToExtent from './ZoomToExtent';
import styles from './Map.module.scss';

export default function Map({ map, width, height }) {
    const mapElementRef = useRef(null);

    useEffect(
        () => {
            if (map === null) {
                return;
            }

            map.setTarget(mapElementRef.current);
        },
        [map]
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