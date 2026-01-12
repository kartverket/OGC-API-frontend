FROM geopython/pygeoapi:0.22.0


# Add your custom process script
COPY distinct_values.py /pygeoapi/distinct_values.py

COPY entrypoint.py /pygeoapi/pygeoapi/entrypoint_dnd.py
COPY gunicorn_conf.py /pygeoapi/gunicorn_conf_dnd.py
COPY entrypoint.sh /entrypoint.sh
RUN  chmod +x /entrypoint.sh

RUN /venv/bin/python3 -m pip install prometheus_client prometheus_flask_exporter

EXPOSE 5000 9090

ENV PYTHONPATH="/pygeoapi"
ENV WSGI_APP=pygeoapi.entrypoint_dnd:app
ENV PROMETHEUS_MULTIPROC_DIR=/tmp


USER 150:150

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD [ "python3", "-c", "import urllib.request, sys; sys.exit(0) if urllib.request.urlopen('http://localhost:5000/').getcode() == 200 else sys.exit(1)" ]