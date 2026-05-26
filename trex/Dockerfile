FROM sourcepole/t-rex:v0.14.3@sha256:c7c633cfbd2496737db809d9713c2a855df4cff4e16d346638d12b9021f68d3e

COPY t-rex.toml /var/data/t-rex.toml

EXPOSE 8080

ENV USER_ID=150 \
    USER_NAME=apprunner \
    TZ=Europe/Oslo

USER root
RUN groupadd -g ${USER_ID} ${USER_NAME} && \
    useradd --system --no-create-home -u ${USER_ID} -g ${USER_NAME} ${USER_NAME} && \
    mkdir -p /var/cache/mvtcache && \
    chown ${USER_ID}:${USER_ID} /var/cache/mvtcache

USER ${USER_NAME}

ENTRYPOINT ["/bin/sh", "-c", "/usr/bin/t_rex generate --config /var/data/t-rex.toml & exec /usr/bin/t_rex serve --config /var/data/t-rex.toml"]
