FROM postgis/postgis:17-3.6-alpine

COPY ./dumps/* /tmp/dumps/
COPY initdb.sh /docker-entrypoint-initdb.d/initdb.sh

WORKDIR /tmp/dumps

# Normalize line endings so init scripts run on Linux even from Windows checkouts.
RUN apk --update add --no-cache unzip \
    && unzip '*.zip' \
    && rm *.zip \
    && sed -i 's/\r$//' /docker-entrypoint-initdb.d/initdb.sh \
    && chown -R postgres:postgres /tmp/dumps \
    && chmod +x /docker-entrypoint-initdb.d/initdb.sh

USER postgres

EXPOSE 5432

HEALTHCHECK --interval=5s --timeout=5s --retries=5 --start-period=20s \
    CMD ["pg_isready", "-U", "$${POSTGRES_USER}", "-d", "$${DB_NAME}", "-h", "127.0.0.1"]
