'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createMap, setFeatureCollection, zoomToExtent } from '@/utils/map/map';
import { isBboxValid, parseBboxStr } from '@/components/FilterCard/helpers';
import { setBboxFeature } from '@/utils/map/featuresLayer';


const CRS84_URI = 'http://www.opengis.net/def/crs/OGC/1.3/CRS84';

export default function MapProvider({ data, children }) {
    const [map, setMap] = useState(null);
    const searchParams = useSearchParams();
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
        []
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
            if (map !== null && data !== null) {
                setFeatureCollection(map, data);
            }
        },
        [map, data]
    );

    useEffect(
        () => {
            if (map === null || data === null) {
                return;
            }

            const bboxStr = searchParams.get('bbox');
            const bbox = bboxStr !== null ? parseBboxStr(bboxStr) : null;
            const bboxValid = isBboxValid(bbox);
            let extent = data.collection.extent;

            if (bboxValid || bbox === null) {
                setBboxFeature(map, bbox);
            }

            if (bboxValid && data.features.length === 0) {
                extent = {
                    bbox,
                    crs: CRS84_URI
                };
            }

            zoomToExtent(map, extent);
        },
        [map, data, searchParams]
    );

    return (
        <MapContext.Provider value={map}>
            {children}
        </MapContext.Provider>
    );
}

export const MapContext = createContext({});
export const useMap = () => useContext(MapContext);