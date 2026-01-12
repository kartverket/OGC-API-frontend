# /pygeoapi/entrypoint.py
from prometheus_flask_exporter.multiprocess import GunicornPrometheusMetrics

# Import the fully configured APP
from pygeoapi.flask_app import APP as app

# Attach metrics the existing app
metrics = GunicornPrometheusMetrics(app)
