'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { createMap, setFeatureCollection, zoomToExtent } from '@/utils/map/map';
import { useSearchParams } from 'next/navigation';
import { isBboxValid, parseBboxStr } from '@/components/FilterCard/helpers';
import { setBboxFeature } from '@/utils/map/featuresLayer';


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

            setFeatureCollection(map, data);
            zoomToExtent(map, data.collection.extent)
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

            if (isBboxValid(bbox) || bbox === null) {
                setBboxFeature(map, bbox)
            }
        },
        [map, data, searchParams]
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

    return (
        <MapContext.Provider value={map}>
            {children}
        </MapContext.Provider>
    );
}

export const MapContext = createContext({});
export const useMap = () => useContext(MapContext);