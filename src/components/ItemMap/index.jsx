'use client'

import { useEffect, useRef, useState } from 'react';
import { createItemMap, zoomToExtent } from '@/utils/map/map';
import { Map } from '@/components';
import { Skeleton } from '@digdir/designsystemet-react';


const MAP_WIDTH = 618;
const MAP_HEIGHT = 735;

export default function ItemMap({ data }) {
    const [map, setMap] = useState(null);
    const initRef = useRef(true);

    useEffect(
        () => {
            if (!initRef.current) {
                return;
            }

            initRef.current = false;

            (async () => {
                setMap(await createItemMap(data));
            })();
        },
        [data]
    );

    useEffect(
        () => {
            if (map === null) {
                return;
            }

            zoomToExtent(map);

            return () => {
                map.setTarget(null);
                map.dispose();
            };
        },
        [map]
    );

    if (map === null) {
        return (
            <Skeleton
                width={MAP_WIDTH}
                height={MAP_HEIGHT}
            />
        );
    }

    return (
        <Map
            map={map}
            width={MAP_WIDTH}
            height={MAP_HEIGHT}
        />
    );
}