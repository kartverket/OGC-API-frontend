FROM sourcepole/t-rex:v0.14.3@sha256:c7c633cfbd2496737db809d9713c2a855df4cff4e16d346638d12b9021f68d3e

COPY t-rex.toml /var/data/t-rex.toml

EXPOSE 8080

USER 150:150

CMD ["serve", "--config", "/var/data/t-rex.toml"]
