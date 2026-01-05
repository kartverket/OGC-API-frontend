import { roundDecimals } from '@/utils/helper';
import { transformExtent } from '@/utils/map/helpers';
import bboxPolygon from '@turf/bbox-polygon';
import booleanContains from '@turf/boolean-contains';
import MouseWheelZoom from 'ol/interaction/MouseWheelZoom';


export function getSizeAndPositionFromBbox(map, bbox) {
    const minXminY = [bbox[0], bbox[1]];
    const bottomLeft = map.getPixelFromCoordinate(minXminY);

    const maxXMaxY = [bbox[2], bbox[3]];
    const topRight = map.getPixelFromCoordinate(maxXMaxY);

    const width = roundDecimals(topRight[0] - bottomLeft[0], 0);
    const height = roundDecimals(bottomLeft[1] - topRight[1], 0);
    const x = roundDecimals(bottomLeft[0], 0);
    const y = roundDecimals(topRight[1], 0);

    return {
        width,
        height,
        x,
        y
    };
}

export function getBboxFromSizeAndPosition(map, { x, y, width, height }) {
    const bottomLeft = [x, y + height];
    const topRight = [x + width, y];

    const minXminY = map.getCoordinateFromPixel(bottomLeft);
    const maxXMaxY = map.getCoordinateFromPixel(topRight);

    return transformExtent([minXminY[0], minXminY[1], maxXMaxY[0], maxXMaxY[1]], 'EPSG:3857', 'EPSG:4326', 6);
}

export function bboxWithinView(map, bbox) {
    const view = map.getView();
    const extent = view.calculateExtent(map.getSize());
    const viewPoly = bboxPolygon(extent);        
    const bboxPoly = bboxPolygon(bbox);

    return booleanContains(viewPoly, bboxPoly);
}

export function getMouseWheelZoomInteraction(map) {
    return map.getInteractions()
        .getArray()
        .find(interaction => interaction instanceof MouseWheelZoom);
}
