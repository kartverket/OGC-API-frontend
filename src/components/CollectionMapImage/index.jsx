'use client'

import Image from 'next/image';
import { useMapImage } from '@/hooks';
import { Skeleton } from '@digdir/designsystemet-react';

export default function CollectionMapImage({ featureCollection }) {
    const options = {
        width: 480,
        height: 640,
        padding: [6, 6, 6, 6],
        constrainResolution: false
    };

    const { image, loading } = useMapImage(featureCollection, options);

    return loading ?
        <Skeleton width={318} height={397} /> :
        <Image src={image} alt='Kart' width={options.width} height={options.height} unoptimized />;
}
