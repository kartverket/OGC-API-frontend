FROM sourcepole/bbox-tile-server:v0.6.2

COPY bbox.toml /bbox.toml
COPY assets /assets

EXPOSE 8080

USER 150:150

CMD ["bbox-tile-server", "-c", "/bbox.toml", "serve"]
