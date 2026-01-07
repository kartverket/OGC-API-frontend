# /pygeoapi/entrypoint.py
from prometheus_flask_exporter import PrometheusMetrics

# Import the fully configured APP, this is what
from pygeoapi.flask_app import APP as app

# Just attach metrics to their existing app
metrics = PrometheusMetrics(app)
