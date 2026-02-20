# /pygeoapi/gunicorn_conf.py

# Docs: https://github.com/rycus86/prometheus_flask_exporter under the WSGI-section

from prometheus_flask_exporter.multiprocess import GunicornInternalPrometheusMetrics


def child_exit(server, worker):
    GunicornInternalPrometheusMetrics.mark_process_dead_on_child_exit(worker.pid)
