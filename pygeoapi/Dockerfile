FROM geopython/pygeoapi:0.23.1@sha256:b3e68e4ba21cc3726d0488c174819e98dd4c9d895093678f692a191901f0f887

# Custom Python scripts
COPY distinct_values.py /pygeoapi/distinct_values.py
COPY modify_openapi.py /pygeoapi/modify_openapi.py
COPY postgis_mapscript.py /pygeoapi/postgis_mapscript.py
COPY schema_provider.py /pygeoapi/schema_provider.py

# Custom entrypoint and gunicorn config
COPY entrypoint.py /pygeoapi/pygeoapi/entrypoint_dnd.py
COPY gunicorn_conf.py /pygeoapi/gunicorn_conf_dnd.py

# Patched maps module
COPY maps.py /pygeoapi/pygeoapi/api/maps.py

# pygeoapi configuration
COPY pygeoapi-config.yml /pygeoapi/pygeoapi-config.yml
COPY schemas/ /pygeoapi/schemas/

# Process plugins
COPY processes/ /pygeoapi/processes/

# Custom templates
COPY templates/ /pygeoapi/custom_templates/

# MapServer config (fonts, styles)
COPY mapserver/fonts.txt /pygeoapi/fonts.txt
COPY mapserver/styles/ /pygeoapi/styles/

RUN /venv/bin/python3 -m pip install \
        prometheus_client \
        prometheus_flask_exporter \
        geopandas \
        fiona \
        SQLAlchemy \
        psycopg2-binary \
        GeoAlchemy2

ENV USER_ID=150 \
    USER_NAME=apprunner \
    TZ=Europe/Oslo

RUN groupadd -g ${USER_ID} ${USER_NAME} && \
    useradd --system --no-create-home -u ${USER_ID} -g ${USER_NAME} ${USER_NAME}

# Ensure OpenAPI output files are writable by the runtime user.
RUN mkdir -p /apiconfig \
        && touch /apiconfig/openapi.yml \
        && chown -R ${USER_ID}:${USER_ID} /apiconfig \
        && chmod -R 775 /apiconfig

EXPOSE 5000

ENV PYTHONPATH="/pygeoapi"
ENV WSGI_APP=pygeoapi.entrypoint_dnd:app
ENV GUNICORN_CMD_ARGS="--config /pygeoapi/gunicorn_conf_dnd.py"
ENV PROMETHEUS_MULTIPROC_DIR=/tmp
ENV PYGEOAPI_CONFIG=/pygeoapi/pygeoapi-config.yml
ENV PYGEOAPI_OPENAPI=/apiconfig/openapi.yml

USER ${USER_NAME}

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD [ "python3", "-c", "import urllib.request, sys; sys.exit(0) if urllib.request.urlopen('http://localhost:5000/').getcode() == 200 else sys.exit(1)" ]
