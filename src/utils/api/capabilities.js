const ITEMS_REL = 'items';
const MAP_REL = 'http://www.opengis.net/def/rel/ogc/1.0/map';
const COVERAGE_REL = 'http://www.opengis.net/def/rel/ogc/1.0/coverage';
const TILES_VECTOR_REL = 'http://www.opengis.net/def/rel/ogc/1.0/tilesets-vector';
const STYLES_REL = 'http://www.opengis.net/def/rel/ogc/1.0/styles';

function hasLinkRel(links, rel) {
  return Array.isArray(links) && links.some((link) => link.rel === rel);
}

export function collectionHasFeatureCapability(links) {
  return hasLinkRel(links, ITEMS_REL);
}

export function collectionHasMapCapability(links) {
  return hasLinkRel(links, MAP_REL);
}

export function collectionHasCoverageCapability(links) {
  return hasLinkRel(links, COVERAGE_REL);
}

export function collectionHasVectorTileCapability(links) {
  return hasLinkRel(links, TILES_VECTOR_REL);
}

export function collectionHasStylesCapability(links) {
  return hasLinkRel(links, STYLES_REL);
}
