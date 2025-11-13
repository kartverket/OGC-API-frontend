import proj4 from 'proj4';
import { register } from 'ol/proj/proj4';
import projections from '@/config/projections.json';

projections.forEach(projection => {
    proj4.defs(projection.code, projection.proj4);
    proj4.defs(projection.uri, proj4.defs(projection.code));
});

register(proj4);