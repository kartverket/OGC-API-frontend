FROM geopython/pygeoapi:0.24.0@sha256:a62895f2585ef1fcd1fc97ec35bf13177becc1334a622172a2c5c4d2145b8f0a AS dependencies

COPY --from=ghcr.io/astral-sh/uv:0.13.5 /uv /usr/local/bin/uv

COPY pyproject.toml uv.lock /tmp/pygeoapi-dependencies/

WORKDIR /tmp/pygeoapi-dependencies
RUN uv export --locked --no-emit-project --format requirements-txt > requirements.txt && \
    uv pip install --python /venv/bin/python3 --no-deps --require-hashes -r requirements.txt

# --- Dependency CVE/CA fixes (TEMPORARY: revisit on new pygeoapi version, e.g. 0.24.1+) ---
#   fsspec     - uninstalled entirely: CVE-2026-104851, no patched release yet.
#   aiohttp    - upgraded: CVE-2026-111066 (multipart FD exhaustion).
#   botocore   - upgraded: vendors its own cacert.pem, and the version pulled in by pygeoapi's
#                requirements-docker.txt (botocore>1.42) still ships eMudhra's distrusted
#                "emSign ECC Root CA - G3" / "AAA Certificate Services" roots.
#   pip/setuptools/wheel - uninstalled entirely: pip is a build-time tool only and the running
#                image never invokes it, so rather than patching it in place (CVE-2026-8643,
#                same eMudhra roots in its vendored certifi) we strip it from /venv so it can't
#                be flagged at all.
RUN /venv/bin/python -m pip uninstall -y fsspec \
 && /venv/bin/python -m pip install --upgrade "aiohttp>=3.14.4" "botocore>=1.43.121" \
 && /venv/bin/python -m pip uninstall -y pip setuptools wheel

FROM geopython/pygeoapi:0.24.0@sha256:a62895f2585ef1fcd1fc97ec35bf13177becc1334a622172a2c5c4d2145b8f0a

# --- OS package CVE/CA fixes (TEMPORARY: revisit on new pygeoapi version, e.g. 0.24.1+) ---
#   openssl/libssl3t64 - upgraded: CVE-2026-84782.
#   libnss3    - upgraded: its compiled-in trust module (libnssckbi.so) still ships eMudhra's
#                distrusted "emSign ECC Root CA - G3" / "AAA Certificate Services" roots on the
#                base image's version; Ubuntu's 2026-10-21 security update drops both.
#   python3-pip / python3-pip-whl - purged: pip is a build-time tool only, installed system-wide
#                by the base image via apt. python3-pip-whl is a separate Debian/Ubuntu package
#                (pulled in by python3-venv) shipping just the ensurepip bootstrap wheel, at
#                /usr/share/python-wheels/pip-*.whl - independent of /venv's pip and python3-pip.
RUN apt-get update \
 && apt-get install -y --no-install-recommends --only-upgrade openssl libssl3t64 libnss3 \
 && apt-get purge -y python3-pip python3-pip-whl \
 && rm -rf /var/lib/apt/lists/*

# TEMPORARY: deselect eMudhra's distrusted "emSign ECC Root CA - G3" from the OS trust store.
# Debian/Ubuntu's ca-certificates package still ships the Mozilla source cert even though it's
# no longer trusted upstream; `!`-prefixing it in ca-certificates.conf and regenerating is the
# distro-native way to mark it disabled instead of trusted.
RUN sed -i 's#^mozilla/emSign_ECC_Root_CA_-_G3.crt#!mozilla/emSign_ECC_Root_CA_-_G3.crt#' /etc/ca-certificates.conf \
 && update-ca-certificates

# `COPY` merges into an existing destination directory rather than replacing it, and this
# stage's base image already ships its own /venv (including pip-24.0). Clear it first so the
# copy below is a full replacement, not a merge that resurrects files removed in `dependencies`.
RUN rm -rf /venv
COPY --from=dependencies /venv /venv

# TEMPORARY: the system (apt-installed) python3-certifi package is stuck at 2023.11.17 on Ubuntu
# Noble with no newer release upstream, and still bundles eMudhra's distrusted roots. Purging it
# risks breaking other apt packages (e.g. python3-requests, used via this image's
# --system-site-packages venv) that depend on it, so instead overwrite its CA bundle with the
# one from our own venv's certifi, which is already pinned to a clean release.
RUN cp /venv/lib/python3.12/site-packages/certifi/cacert.pem /usr/lib/python3/dist-packages/certifi/cacert.pem

# Custom Python scripts
COPY distinct_values.py /pygeoapi/distinct_values.py
COPY modify_openapi.py /pygeoapi/modify_openapi.py
COPY schema_provider.py /pygeoapi/schema_provider.py
COPY formatter_jsonfg.py /pygeoapi/formatter_jsonfg.py

# Custom entrypoint and gunicorn config
COPY entrypoint.py /pygeoapi/pygeoapi/entrypoint_dnd.py
COPY gunicorn_conf.py /pygeoapi/gunicorn_conf_dnd.py

# pygeoapi configuration
COPY pygeoapi-config.yml /pygeoapi/pygeoapi-config.yml
COPY schemas/ /pygeoapi/schemas/
COPY resources/definitions/tiles/EPSG3575Quad.json /pygeoapi/pygeoapi/resources/definitions/tiles/EPSG3575Quad.json
COPY resources/definitions/tiles/EuropeanETRS89_LAEAQuad.json /pygeoapi/pygeoapi/resources/definitions/tiles/EuropeanETRS89_LAEAQuad.json
COPY resources/definitions/styles/ /pygeoapi/resources/definitions/styles/

# Collection and frontpage preview assets used by frontend via /assets/...
COPY data/collection-images/ /pygeoapi/data/collection-images/
COPY data/dataset-images/ /pygeoapi/data/dataset-images/

# Process plugins
COPY processes/ /pygeoapi/processes/

# Custom templates
COPY templates/ /pygeoapi/custom_templates/

# Disable Swagger UI syntax highlighting, which crashes on large GeoJSON responses.
# Patches pygeoapi's built-in template; the grep fails the build if the sed no longer matches.
RUN sed -i "s/deepLinking: true,/deepLinking: true,\n        syntaxHighlight: false,/" \
      /pygeoapi/pygeoapi/templates/openapi/swagger.html \
 && grep -q "syntaxHighlight: false" /pygeoapi/pygeoapi/templates/openapi/swagger.html

# MapServer config (fonts, styles)
COPY mapserver/fonts.txt /pygeoapi/fonts.txt
COPY mapserver/styles/ /pygeoapi/styles/

COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

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

USER ${USER_NAME}

ENTRYPOINT ["/docker-entrypoint.sh"]
