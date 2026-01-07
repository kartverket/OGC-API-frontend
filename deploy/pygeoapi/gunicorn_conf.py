# /pygeoapi/gunicorn_conf.py

from prometheus_client import start_http_server


# Start Prometheus metrics server on port 9090 when the gunicorn application is ready (but before it is forked)
def when_ready(server):
    start_http_server(9090, addr="0.0.0.0")
    print("Prometheus metrics server started on :9090")
