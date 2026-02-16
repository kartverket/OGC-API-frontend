# /pygeoapi/entrypoint.py
from prometheus_flask_exporter.multiprocess import GunicornInternalPrometheusMetrics

from pygeoapi.flask_app import APP as app

metrics = GunicornInternalPrometheusMetrics(app, path='/actuator/metrics')
