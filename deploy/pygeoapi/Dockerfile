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

# Using gthread worker class to support prometheus metrics to work with multiple workers on a different port than the application port
ENV WSGI_WORKER_CLASS=gthread
ENV WSGI_WORKERS=2
ENV WSGI_THREADS=4

USER 150:150