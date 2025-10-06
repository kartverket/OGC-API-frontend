export function getLayer(map, id) {
    return map
        .getLayers()
        .getArray()
        .find(layer => layer.get('id') === id) || null;
}