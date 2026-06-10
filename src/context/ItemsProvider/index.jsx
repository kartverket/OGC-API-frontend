'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { getBbox, isBboxValid, parseBboxStr, transformExtent } from '@/utils/map/helpers';


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
                const extent = data.collection.extent;
                bbox = transformExtent(getBbox(extent.bbox, extent.crs), extent.crs, 'OGC:CRS84');
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