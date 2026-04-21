import proj4 from 'proj4';
import { get as getProjectionByCode } from 'ol/proj';
import { register } from 'ol/proj/proj4';
import projections from '@/config/projections.json';

const GEOGRAPHIC_WORLD_EXTENT = [-180, -90, 180, 90];

projections.forEach(projection => {
    proj4.defs(projection.code, projection.proj4);
    proj4.defs(projection.uri, proj4.defs(projection.code));
});

register(proj4);

['OGC:CRS84', 'OGC:CRS84H', 'EPSG:4258'].forEach((projectionCode) => {
    const projection = getProjectionByCode(projectionCode);

    if (!projection) {
        return;
    }

    projection.setExtent(GEOGRAPHIC_WORLD_EXTENT);
    projection.setWorldExtent(GEOGRAPHIC_WORLD_EXTENT);
});
