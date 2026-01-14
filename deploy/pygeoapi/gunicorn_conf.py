# /pygeoapi/gunicorn_conf.py

# Docs: https://github.com/rycus86/prometheus_flask_exporter under the WSGI-section

from prometheus_flask_exporter.multiprocess import GunicornPrometheusMetrics


# Start Prometheus metrics server on separate port
def when_ready(server):
    GunicornPrometheusMetrics.start_http_server_when_ready(8181)


def child_exit(server, worker):
    GunicornPrometheusMetrics.mark_process_dead_on_child_exit(worker.pid)
