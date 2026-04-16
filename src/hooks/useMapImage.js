'use client'

import { useEffect, useState } from 'react';
import { createMapImage } from '@/utils/map/mapImage';

export default function useMapImage(featureCollection, options = {}) {
    const [image, setImage] = useState(null);
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        (async () => {
            const base64 = await createMapImage(featureCollection, options);
            setImage(base64);
            setLoading(false);
        })();
    }, [featureCollection, options]);

    return {
        image,
        loading        
    };
}
