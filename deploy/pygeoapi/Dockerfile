FROM geopython/pygeoapi:latest

# Add your custom process script
COPY distinct_values.py /pygeoapi/distinct_values.py
COPY modify_openapi.py /pygeoapi/modify_openapi.py

COPY entrypoint.py /pygeoapi/pygeoapi/entrypoint_dnd.py
COPY gunicorn_conf.py /pygeoapi/gunicorn_conf_dnd.py
RUN /venv/bin/python3 -m pip install prometheus_client prometheus_flask_exporter

EXPOSE 5000

ENV PYTHONPATH="/pygeoapi"
# Use our custom entrypoint for gunicorn which imports the pygeoapi flask app and adds prometheus metrics
# Note: this is not the same as docker entrypoint
ENV WSGI_APP=pygeoapi.entrypoint_dnd:app
# Gunicorn config providing cleanup of prometheus metrics on worker exit
ENV GUNICORN_CMD_ARGS="--config /pygeoapi/gunicorn_conf_dnd.py"
ENV PROMETHEUS_MULTIPROC_DIR=/tmp


USER 150:150

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD [ "python3", "-c", "import urllib.request, sys; sys.exit(0) if urllib.request.urlopen('http://localhost:5000/').getcode() == 200 else sys.exit(1)" ]