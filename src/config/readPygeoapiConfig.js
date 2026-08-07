import "server-only";
import { readFileSync } from 'fs';
import { parse } from 'yaml';

const CONFIG_PATH = process.env.PYGEOAPI_CONFIG_PATH_FRONTEND || '/volumes/pygeoapi-config.yml';
const EXPORT_PROCESSORS = process.env.EXPORT_PROCESSORS;

let cachedConfig = null;
let cacheTimestamp = 0;
const CACHE_TTL = 600 * 1000; // 10 minutes

function readConfigFile() {
    const now = Date.now();

    if (cachedConfig && (now - cacheTimestamp) < CACHE_TTL) {
        return cachedConfig;
    }

    try {
        const fileContent = readFileSync(CONFIG_PATH, 'utf8');
        cachedConfig = parse(fileContent);
        cacheTimestamp = now;
        return cachedConfig;
    } catch (error) {
        console.error(`Failed to read pygeoapi config from ${CONFIG_PATH}:`, error.message);
        return null;
    }
}

export function getPygeoapiConfig() {
    return readConfigFile();
}

export function getMetadata() {
    const config = readConfigFile();
    return config?.metadata || null;
}

export function getResources() {
    const config = readConfigFile();
    return config?.resources || null;
}

export function getCollections() {
    const resources = getResources();
    if (!resources) return [];

    return Object.entries(resources)
        .filter(([_, resource]) => resource.type === 'collection')
        .map(([id, resource]) => ({
            id,
            title: resource.title?.en || resource.title || id,
            description: resource.description?.en || resource.description?.no || resource.description || '',
            keywords: resource.keywords?.en || resource.keywords?.no || resource.keywords || [],
            bbox: resource.extents?.spatial?.bbox || {}
        }));
}

export function getCollection(collectionId) {
    const resources = getResources();
    if (!resources) return null;

    const resource = resources[collectionId];
    if (!resource || resource.type !== 'collection') return null;

    return {
        id: collectionId,
        title: resource.title?.en || resource.title || collectionId,
        description: resource.description?.en || resource.description?.no || resource.description || '',
        keywords: resource.keywords?.en || resource.keywords?.no || resource.keywords || [],
        bbox: resource.extents?.spatial?.bbox || {}
    };
}

export function getDatasetTitle() {
    const metadata = getMetadata();
    return metadata?.identification?.title?.en || metadata?.identification?.title || 'Dataset';
}

export function getDatasetDescription() {
    const metadata = getMetadata();
    return metadata?.identification?.description?.en || metadata?.identification?.description || '';
}

export function getCollectionDownloadConfig(collectionId) {
    const resources = getResources();
    if (!resources) return null;
    const resource = resources[collectionId];
    if (!resource || resource.type !== 'collection') return null;
    return resource.download ?? null;
}

export function collectionHasMapProvider(collectionId) {
    const resources = getResources();
    if (!resources) return false;

    const resource = resources[collectionId];
    if (!resource || resource.type !== 'collection') return false;

    return Array.isArray(resource.providers) && resource.providers.some(p => p.type === 'map');
}

export function collectionHasCoverageProvider(collectionId) {
    const resources = getResources();
    if (!resources) return false;

    const resource = resources[collectionId];
    if (!resource || resource.type !== 'collection') return false;

    return Array.isArray(resource.providers) && resource.providers.some(p => p.type === 'coverage');
}

function _isFileReference(value) {
    if (typeof value !== 'string') return false;

    // Ignore connection strings like "host=... dbname=...".
    if (value.includes('=') && value.includes(' ')) return false;

    return /\.(tif|tiff|vrt|nc|grib2?|asc|gpkg|geojson|json|csv|parquet|mbtiles|sqlite)$/i.test(value);
}

function _collectFileReferences(value, output) {
    if (typeof value === 'string') {
        if (_isFileReference(value)) output.add(value);
        return;
    }

    if (Array.isArray(value)) {
        value.forEach(entry => _collectFileReferences(entry, output));
        return;
    }

    if (value && typeof value === 'object') {
        Object.values(value).forEach(entry => _collectFileReferences(entry, output));
    }
}

export function getCollectionReferencedFileCount(collectionId) {
    const resources = getResources();
    if (!resources) return 0;

    const resource = resources[collectionId];
    if (!resource || resource.type !== 'collection') return 0;

    const refs = new Set();
    for (const provider of (resource.providers ?? [])) {
        _collectFileReferences(provider?.data, refs);
    }

    return refs.size;
}

export function hasExportProcessors() {
    const resources = getResources();
    if (!resources) return false;

    const exportProcessors = (EXPORT_PROCESSORS ?? '').split(',').map(p => p.trim()).filter(Boolean);

    if (exportProcessors.length === 0) {
        return false;
    }

    return Object.values(resources)
        .some(value => value.type === 'process' && exportProcessors
            .some(processor => {
                const name = value.processor?.name?.trim() ?? '';
                return name.endsWith(processor)
            }));
}

export function getCollectionFeatureIdField(collectionId) {
    const resources = getResources();
    if (!resources) return null;

    const resource = resources[collectionId];
    if (!resource || resource.type !== 'collection') return null;

    const provider = (resource.providers ?? [])
        .find(p => p.type === 'feature');

    return provider?.id_field ?? null;
}

export function getCollectionFeatureTitleField(collectionId) {
    const resources = getResources();
    if (!resources) return null;

    const resource = resources[collectionId];
    if (!resource || resource.type !== 'collection') return null;

    const provider = (resource.providers ?? [])
        .find(p => p.type === 'feature');

    return provider?.title_field ?? null;
}
