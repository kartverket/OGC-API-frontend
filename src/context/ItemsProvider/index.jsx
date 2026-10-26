'use client';

import { useSearchParams } from 'next/navigation';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { getBbox, isBboxValid, parseBboxStr, transformExtent } from '@/utils/map/helpers';

function getInitialBbox(data, searchParams) {
  const bboxStr = searchParams.get('bbox');
  const bbox = bboxStr !== null ? parseBboxStr(bboxStr) : null;

  if (isBboxValid(bbox)) {
    return bbox;
  }

  const extent = data.collection.extent;
  return transformExtent(getBbox(extent.bbox, extent.crs), extent.crs, 'OGC:CRS84');
}

export default function ItemsProvider({ data, children }) {
  const searchParams = useSearchParams();
  const [bbox, setBbox] = useState(() => getInitialBbox(data, searchParams));
  const [bboxEdit, setBboxEdit] = useState(false);
  const [sizeAndPosition, setSizeAndPosition] = useState(null);
  const sizeAndPositionRef = useRef(null);

  useEffect(() => {
    setBbox(getInitialBbox(data, searchParams));
  }, [data, searchParams]);

  return (
    <ItemsContext.Provider
      value={{
        bbox,
        setBbox,
        bboxEdit,
        setBboxEdit,
        sizeAndPosition,
        setSizeAndPosition,
        sizeAndPositionRef,
      }}
    >
      {children}
    </ItemsContext.Provider>
  );
}

export const ItemsContext = createContext({});
export const useItems = () => useContext(ItemsContext);
