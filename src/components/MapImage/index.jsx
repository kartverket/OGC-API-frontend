'use client'

import { useEffect, useRef, useState } from 'react';
import { createMapImage } from '@/utils/map/mapImage';


export default function MapImage({ featureCollection, options }) {
    const [image, setImage] = useState(null);
    const initRef = useRef(true);

    useEffect(
        () => {
            if (!initRef.current) {
                return;
            }

            initRef.current = false;

            (async () => {
                const base64 = await createMapImage(featureCollection, options);
                setImage(base64);
            })();
        },
        [featureCollection, options]
    );

    return image !== null && (
        <img src={image} alt="Kart" />
    );
}