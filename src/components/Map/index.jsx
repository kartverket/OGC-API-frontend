'use client'

import { useEffect, useRef } from 'react';
import { zoomToExtent } from '@/utils/map/map';
import { useMap } from '@/context/MapProvider';
import Zoom from './Zoom';
import ZoomToExtent from './ZoomToExtent';
import styles from './Map.module.scss';


export default function Map({ defaultExtent, width, height }) {
    const map = useMap();
    const mapElementRef = useRef(null);

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