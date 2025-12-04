import MouseWheelZoom from 'ol/interaction/MouseWheelZoom';
import { transformExtent as _transformExtent } from 'ol/proj';


export function getSizeAndPositionFromExtent(map, extent) {
    const minXminY = [extent[0], extent[1]];
    const bottomLeft = map.getPixelFromCoordinate(minXminY);

    const maxXMaxY = [extent[2], extent[3]];
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

export function getExtentFromSizeAndPosition(map, { x, y, width, height }) {
    const bottomLeft = [x, y + height];
    const topRight = [x + width, y];

    const minXminY = map.getCoordinateFromPixel(bottomLeft);
    const maxXMaxY = map.getCoordinateFromPixel(topRight);

    return transformExtent([minXminY[0], minXminY[1], maxXMaxY[0], maxXMaxY[1]], 'EPSG:3857', 'EPSG:4326', 6);
}

export function transformExtent(extent, sourceProj, destProj, precision = -1) {
    const transformed = _transformExtent(extent, sourceProj, destProj);

    if (precision === -1) {
        return transformed;
    }

    return [
        roundDecimals(transformed[0], precision),
        roundDecimals(transformed[1], precision),
        roundDecimals(transformed[2], precision),
        roundDecimals(transformed[3], precision)
    ];
}

export function getMouseWheelZoomInteraction(map) {
    return map.getInteractions()
        .getArray()
        .find(interaction => interaction instanceof MouseWheelZoom);
}

export function roundDecimals(number, precision) {
    const factor = Math.pow(10, precision);
    return Math.round(number * factor) / factor;
}

export function debounce(func, delay) {
    let timeoutId;

    return function (...args) {
        clearTimeout(timeoutId);

        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
}

export function throttle(func, delay) {
    let inThrottle;
    let lastArgs;
    let lastThis;

    return function (...args) {
        lastArgs = args;
        lastThis = this;

        if (!inThrottle) {
            func.apply(lastThis, lastArgs);
            inThrottle = true;

            setTimeout(() => {
                inThrottle = false;

                if (lastArgs) {
                    func.apply(lastThis, lastArgs);
                    lastArgs = null;
                    lastThis = null;
                }
            }, delay);
        }
    };
}