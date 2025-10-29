import { Map, View } from 'ol';
import { createBaseMap } from './baseMap';
import { createFeaturesLayer } from './featuresLayer';
import { getProjection } from './helpers';
import basemap from '@/config/basemap';
import './setup';

const MAP_PADDING = [50, 50, 50, 50];

export async function createMapImage(featureCollection, options = {}) {
    const { 
        width = 640, 
        height = 480, 
        padding = MAP_PADDING, 
        constrainResolution = true
    } = options;

    const [map, mapElement] = await createTempMap(featureCollection, width, height, padding, constrainResolution);

    return new Promise((resolve) => {
        map.once('rendercomplete', () => {
            const base64 = exportToPngImage(map);
            map.dispose();
            mapElement.remove();

            resolve(base64);
        })
    });
}

async function createTempMap(featureCollection, width, height, padding, constrainResolution) {
    const dataProjection = getProjection(featureCollection);
    const featuresLayer = createFeaturesLayer(featureCollection, dataProjection);

    const map = new Map({
        layers: [
            await createBaseMap(),
            featuresLayer
        ]
    });

    map.setView(new View({
        padding,
        projection: basemap.projection,
        maxZoom: basemap.maxZoom,
        constrainResolution
    }));

    const mapElement = document.createElement('div');
    Object.assign(mapElement.style, { position: 'absolute', top: '-9999px', left: '-9999px', width: `${width}px`, height: `${height}px` });
    document.getElementsByTagName('body')[0].appendChild(mapElement);

    map.setTarget(mapElement);

    const extent = featuresLayer.getSource().getExtent();
    map.getView().fit(extent, map.getSize());

    return [map, mapElement];
}

function exportToPngImage(map) {
    const mapCanvas = document.createElement('canvas');
    const size = map.getSize();

    mapCanvas.width = size[0];
    mapCanvas.height = size[1];

    const mapContext = mapCanvas.getContext('2d');
    const canvases = map.getViewport().querySelectorAll('.ol-layer canvas, canvas.ol-layer');

    canvases.forEach(canvas => {
        if (canvas.width === 0) {
            return;
        }

        const opacity = canvas.parentNode.style.opacity || canvas.style.opacity;
        mapContext.globalAlpha = opacity === '' ? 1 : Number(opacity);
        const transform = canvas.style.transform;
        let matrix;

        if (transform) {
            matrix = transform
                .match(/^matrix\(([^(]*)\)$/)[1]
                .split(',')
                .map(Number);
        } else {
            matrix = [parseFloat(canvas.style.width) / canvas.width, 0, 0, parseFloat(canvas.style.height) / canvas.height, 0, 0];
        }

        CanvasRenderingContext2D.prototype.setTransform.apply(mapContext, matrix);
        const backgroundColor = canvas.parentNode.style.backgroundColor;

        if (backgroundColor) {
            mapContext.fillStyle = backgroundColor;
            mapContext.fillRect(0, 0, canvas.width, canvas.height);
        }

        mapContext.drawImage(canvas, 0, 0);
    });

    mapContext.globalAlpha = 1;
    mapContext.setTransform(1, 0, 0, 1, 0, 0);

    return mapCanvas.toDataURL();
}