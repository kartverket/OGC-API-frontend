'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { isBboxValid, parseBboxStr, transformExtent } from '@/utils/map/helpers';


export default function ItemsProvider({ data, children }) {
    const [bbox, setBbox] = useState(null);
    const [bboxEdit, setBboxEdit] = useState(false);
    const [sizeAndPosition, setSizeAndPosition] = useState(null);
    const sizeAndPositionRef = useRef(null);
    const searchParams = useSearchParams();

    useEffect(
        () => {
            if (data === null) {
                return;
            }

            const bboxStr = searchParams.get('bbox');
            let bbox = bboxStr !== null ? parseBboxStr(bboxStr) : null;

            if (!isBboxValid(bbox)) {
                bbox = transformExtent(data.collection.extent.bbox, data.collection.extent.crs, 'EPSG:4326');
            }

            setBbox(bbox);
        },
        [data, searchParams]
    );

    if (bbox === null) {
        return null;
    }

    return (
        <ItemsContext.Provider
            value={{
                bbox,
                setBbox,
                bboxEdit,
                setBboxEdit,
                sizeAndPosition,
                setSizeAndPosition,
                sizeAndPositionRef
            }}
        >
            {children}
        </ItemsContext.Provider>
    );
}

export const ItemsContext = createContext({});
export const useItems = () => useContext(ItemsContext);