import TileLayer from 'ol/layer/Tile';
import WMTS, { optionsFromCapabilities } from 'ol/source/WMTS';
import { WMTSCapabilities } from 'ol/format';
import { get } from 'ol/proj';
import basemap from '@/config/basemap';

let _wmtsOptions = null;


export async function createBaseMap() {
    const options = await getWmtsOptions();

    if (options === null) {
        return null;
    }

    const tileLayer = new TileLayer({
        source: new WMTS(options),
        minZoom: basemap.minZoom,
        maxZoom: basemap.maxZoom
    });

    tileLayer.set('id', 'basemap');

    return tileLayer;
}

async function getWmtsOptions() {
    if (_wmtsOptions !== null) {
        return _wmtsOptions;
    }

    let response;

    try {
        response = await fetch(basemap.url);
    } catch {
        return null;
    }

    const xml = await response.text();
    const capabilities = new WMTSCapabilities().read(xml);

    const options = optionsFromCapabilities(capabilities, {
        layer: basemap.layer,
        projection: get(basemap.projection),
        matrixSet: basemap.projection,
    });

    _wmtsOptions = {
        ...options,
        crossOrigin: 'anonymous'
    };

    return _wmtsOptions;
}