'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { createMap } from '@/utils/map/map';


export default function MapProvider({ featureCollection, children }) {
    const [map, setMap] = useState(null);
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

    return (
        <MapContext.Provider value={map}>
            {children}
        </MapContext.Provider>
    );
}

export const MapContext = createContext({});
export const useMap = () => useContext(MapContext);