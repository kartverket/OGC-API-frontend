FROM geopython/pygeoapi:0.24.0@sha256:a62895f2585ef1fcd1fc97ec35bf13177becc1334a622172a2c5c4d2145b8f0a

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
COPY resources/definitions/tiles/EPSG3575Quad.json /pygeoapi/resources/definitions/tiles/EPSG3575Quad.json

# Process plugins
COPY processes/ /pygeoapi/processes/

# Custom templates
COPY templates/ /pygeoapi/custom_templates/

# MapServer config (fonts, styles)
COPY mapserver/fonts.txt /pygeoapi/fonts.txt
COPY mapserver/styles/ /pygeoapi/styles/

# TEMPORARY: Patch pip inside the base image's venv for CVE-2026-8643 (fixed in pip 26.1.2).
# Remove once upstream base image ships a patched pip, hopefully any version after 0.24.0
RUN /venv/bin/python3 -m pip install --no-cache-dir --upgrade "pip>=26.1.2"

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

EXPOSE 5000

ENV CONTAINER_PORT=5000
ENV PYTHONPATH="/pygeoapi"
ENV WSGI_APP=pygeoapi.entrypoint_dnd:app
ENV GUNICORN_CMD_ARGS="--config /pygeoapi/gunicorn_conf_dnd.py"
ENV PROMETHEUS_MULTIPROC_DIR=/tmp
ENV PYGEOAPI_CONFIG=/pygeoapi/pygeoapi-config.yml
ENV PYGEOAPI_OPENAPI=/tmp/openapi.yml
# Kubernetes manages horizontal scaling. Consider more workers if pod upscaling is considered too slow.
ENV WSGI_WORKERS=1
ENV WSGI_WORKER_CLASS=gevent
# Remove GOOGLE_APPLICATION_CREDENTIALS from the environment to avoid GDAL
# trying to use it for authentication.
ENV GOOGLE_APPLICATION_CREDENTIALS=""

USER ${USER_NAME}

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD [ "python3", "-c", "import urllib.request, sys; sys.exit(0) if urllib.request.urlopen('http://localhost:5000/').getcode() == 200 else sys.exit(1)" ]
