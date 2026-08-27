FROM sourcepole/bbox-tile-server:v0.6.2

COPY bbox.toml /bbox.toml
COPY assets /assets

ENV RUST_LOG=info,bbox_map_server::wms_fcgi_backend=error,bbox_core::pg_ds=error

EXPOSE 8080

USER 150:150

CMD ["sh", "-c", "bbox-tile-server -c /bbox.toml seed --tileset=tellekretser --maxzoom=8 && bbox-tile-server -c /bbox.toml seed --tileset=tellekrets_polar --maxzoom=8 && exec bbox-tile-server -c /bbox.toml serve"]
