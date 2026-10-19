import { Feature } from 'ol';
import GeoJSON from 'ol/format/GeoJSON';
import { fromExtent } from 'ol/geom/Polygon';
import { Vector as VectorLayer } from 'ol/layer';
import { transformExtent } from 'ol/proj';
import { Vector as VectorSource } from 'ol/source';
import { stylefunction } from 'ol-mapbox-style';
import { getLayer, getProjection } from './helpers';
import { bboxStyle, featureStyle } from './styles';

export function createFeaturesLayer(featureCollection) {
  const vectorLayer = createEmptyFeaturesLayer();

  setFeatures(vectorLayer, featureCollection);

  return vectorLayer;
}

export function createEmptyFeaturesLayer() {
  const vectorSource = new VectorSource();

  const vectorLayer = new VectorLayer({
    source: vectorSource,
    declutter: true,
  });

  vectorLayer.set('id', 'features');
  vectorLayer.setStyle(featureStyle);

  return vectorLayer;
}

export function createBboxFeatureLayer() {
  const vectorSource = new VectorSource();

  const vectorLayer = new VectorLayer({
    source: vectorSource,
  });

  vectorLayer.set('id', 'bbox');
  vectorLayer.setStyle(null);

  return vectorLayer;
}

export function setFeatures(vectorLayer, featureCollection) {
  const vectorSource = vectorLayer.getSource();
  vectorSource.clear();

  if (featureCollection.features.length === 0) {
    return;
  }

  const dataProjection = getProjection(featureCollection);
  const reader = new GeoJSON();

  const features = reader.readFeatures(featureCollection, {
    dataProjection,
    featureProjection: 'EPSG:3857',
  });

  vectorSource.addFeatures(features);
}

export function getGeoJsonStyleSourceId(styleDocument, collectionId) {
  const sources = Object.entries(styleDocument.sources ?? {});
  if (sources.length !== 1) return null;

  const [sourceId, source] = sources[0];
  if (source?.type !== 'geojson' || typeof source.data !== 'string') return null;

  if (
    !Array.isArray(styleDocument.layers) ||
    !styleDocument.layers.every((layer) => layer !== null && typeof layer === 'object' && !Array.isArray(layer))
  ) {
    console.error('Ugyldige lag i GeoJSON-stil.');
    return null;
  }

  const itemsPath = `/collections/${encodeURIComponent(collectionId)}/items`;
  let url;
  try {
    url = new URL(source.data, 'http://localhost');
  } catch (error) {
    if (!(error instanceof TypeError)) throw error;
    console.error('Ugyldig URL for GeoJSON-kilde:', error);
    return null;
  }
  const layers = styleDocument.layers?.filter((layer) => layer.source === sourceId);
  return (url.pathname === itemsPath || url.pathname === `${itemsPath}/`) &&
    layers?.length > 0 &&
    layers.every((layer) => layer['source-layer'] === undefined)
    ? sourceId
    : null;
}

export function applyGeoJsonStyle(vectorLayer, styleDocument, collectionId) {
  const sourceId = getGeoJsonStyleSourceId(styleDocument, collectionId);
  if (styleDocument.version !== 8 || !sourceId) {
    throw new Error(`Ugyldig GeoJSON-stil for ${collectionId}.`);
  }

  stylefunction(vectorLayer, styleDocument, sourceId);
}

export function setBboxFeature(map, bbox) {
  const vectorLayer = getLayer(map, 'bbox');
  const vectorSource = vectorLayer.getSource();

  if (bbox === null) {
    vectorSource.clear();
    return;
  }

  const transformed = transformExtent(bbox, 'EPSG:4326', 'EPSG:3857');
  const feature = createBboxFeature(transformed);

  vectorSource.clear();
  vectorSource.addFeature(feature);
}

export function toggleBboxFeature(map, show) {
  const vectorLayer = getLayer(map, 'bbox');
  const vectorSource = vectorLayer.getSource();
  const features = vectorSource.getFeatures();

  for (const feature of features) {
    feature.setStyle(show ? feature.get('_style') : null);
  }
}

function createBboxFeature(extent) {
  const polygon = fromExtent(extent);
  const feature = new Feature(polygon);

  feature.setStyle(bboxStyle);
  feature.set('_style', bboxStyle);

  return feature;
}
