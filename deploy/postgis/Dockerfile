FROM postgis/postgis:17-3.6-alpine

RUN apk --update add unzip

ENV POSTGRES_USER=postgres
ENV POSTGRES_PASSWORD=qwer1234

COPY ./dumps/* /tmp/dumps/
COPY initdb.sh /docker-entrypoint-initdb.d/initdb.sh

RUN cd /tmp/dumps \
    && unzip -p fylker.zip > fylker.sql \
    && unzip -p kommuner.zip > kommuner.sql \
    && rm *.zip \
    && chmod +x /docker-entrypoint-initdb.d/initdb.sh

EXPOSE 5432
