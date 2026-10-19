'use client';

import { useSearchParams } from 'next/navigation';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { applyGeoJsonStyle, setBboxFeature } from '@/utils/map/featuresLayer';
import { getLayer, isBboxValid, parseBboxStr } from '@/utils/map/helpers';
import { createItemsMap, setFeatureCollection, zoomToExtent } from '@/utils/map/map';
import { featureStyle } from '@/utils/map/styles';

const CRS84_URI = 'http://www.opengis.net/def/crs/OGC/1.3/CRS84';

export default function ItemsMapProvider({
  data,
  featureCollection,
  styleDocument,
  collectionId,
  onStyleError,
  children,
}) {
  const [map, setMap] = useState(null);
  const searchParams = useSearchParams();
  const bboxStr = searchParams.get('bbox');
  const { bbox: collectionBbox, crs: collectionCrs } = data.collection.extent;
  const [minX, minY, maxX, maxY] = collectionBbox;
  const initRef = useRef(true);

  useEffect(() => {
    if (!initRef.current) {
      return;
    }

    initRef.current = false;

    (async () => {
      setMap(await createItemsMap());
    })();
  }, []);

  useEffect(() => {
    if (map === null) {
      return;
    }

    return () => {
      map.setTarget(null);
      map.dispose();
    };
  }, [map]);

  useEffect(() => {
    if (map !== null && featureCollection !== null) {
      setFeatureCollection(map, featureCollection);
    }
  }, [map, featureCollection]);

  useEffect(() => {
    if (map === null) return;

    const layer = getLayer(map, 'features');
    layer.setStyle(featureStyle);
    onStyleError(null);
    if (styleDocument) {
      try {
        applyGeoJsonStyle(layer, styleDocument, collectionId);
      } catch (error) {
        layer.setStyle(featureStyle);
        console.error('Kunne ikke bruke GeoJSON-stil:', error);
        onStyleError(error.message);
      }
    }
  }, [map, styleDocument, collectionId, onStyleError]);

  useEffect(() => {
    if (map === null || featureCollection === null) {
      return;
    }

    const bbox = bboxStr !== null ? parseBboxStr(bboxStr) : null;
    const bboxValid = isBboxValid(bbox);
    let extent = { bbox: [minX, minY, maxX, maxY], crs: collectionCrs };

    if (bboxValid || bbox === null) {
      setBboxFeature(map, bbox);
    }

    if (bboxValid && featureCollection.features.length === 0) {
      extent = {
        bbox,
        crs: CRS84_URI,
      };
    }

    zoomToExtent(map, extent);
  }, [map, featureCollection, bboxStr, collectionCrs, minX, minY, maxX, maxY]);

  return <ItemsMapContext.Provider value={map}>{children}</ItemsMapContext.Provider>;
}

export const ItemsMapContext = createContext({});
export const useItemsMap = () => useContext(ItemsMapContext);
