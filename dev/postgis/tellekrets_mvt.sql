CREATE OR REPLACE FUNCTION public.tellekrets_laea(z integer, x integer, y integer)
RETURNS bytea AS $$
DECLARE
    mvt bytea;
    grid_bounds geometry := ST_MakeEnvelope(2000000, 1000000, 6500000, 5500000, 3035);
    tile_bounds geometry := ST_TileEnvelope(z, x, y, grid_bounds);
BEGIN
    SELECT INTO mvt ST_AsMVT(tile, 'tellekrets', 4096, 'geometry')
    FROM (
        SELECT
            ST_AsMVTGeom(ST_Transform(t.geometry, 3035), tile_bounds, 4096, 64, true) AS geometry,
            t.id,
            t.navn
        FROM public.tellekrets AS t
        WHERE t.geometry && ST_Transform(
            ST_TileEnvelope(z, x, y, grid_bounds, margin => 64.0 / 4096),
            25833
        )
    ) AS tile;

    RETURN mvt;
END;
$$ LANGUAGE plpgsql STABLE PARALLEL SAFE;