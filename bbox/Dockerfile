FROM sourcepole/bbox-tile-server:v0.6.2

COPY bbox.toml /bbox.toml
COPY assets /assets

USER root
RUN mkdir -p /var/cache/bbox/tellekretser && \
    chown -R 150:150 /var/cache/bbox

EXPOSE 8080

USER 150:150

CMD ["bbox-tile-server", "-c", "/bbox.toml", "serve"]