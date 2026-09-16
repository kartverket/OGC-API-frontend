FROM ghcr.io/maplibre/martin:1.16.1
COPY martin.yaml /martin.yaml
COPY styles /styles

USER 150:150

CMD ["--config", "/martin.yaml"]
