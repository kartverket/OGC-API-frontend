FROM geopython/pygeoapi:latest

# Add your custom process script
COPY distinct_values.py /pygeoapi/distinct_values.py

COPY entrypoint.py /pygeoapi/pygeoapi/entrypoint_dnd.py
COPY gunicorn_conf.py /pygeoapi/gunicorn_conf_dnd.py
COPY entrypoint.sh /entrypoint.sh
RUN  chmod +x /entrypoint.sh

RUN /venv/bin/python3 -m pip install prometheus_client prometheus_flask_exporter

EXPOSE 5000 9090
# CMD ["python", "/app/entrypoint.py"]


ENV PYTHONPATH="/pygeoapi:${PYTHONPATH}"
ENV WSGI_APP=pygeoapi.entrypoint_dnd:app

# Using gthread worker class to support prometheus metrics to work with multiple workers on a different port than the application port
ENV WSGI_WORKER_CLASS=gthread
ENV WSGI_WORKERS=2
ENV WSGI_THREADS=4
