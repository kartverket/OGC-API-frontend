# /pygeoapi/entrypoint.py

# Remove GOOGLE_APPLICATION_CREDENTIALS from the environment to avoid GDAL
# trying to use it for authentication.
import os
print("BEFORE POP:", os.environ.get("GOOGLE_APPLICATION_CREDENTIALS"), flush=True)
os.environ.pop("GOOGLE_APPLICATION_CREDENTIALS", None)
print("AFTER POP:", os.environ.get("GOOGLE_APPLICATION_CREDENTIALS"), flush=True)
print("PID:", os.getpid(), flush=True)

import re
from modify_openapi import remove_post_endpoints

_COLLECTIONS_ITEMS_PATTERN = re.compile(r'/collections/[^/]+/items/?$')

# Remove POST endpoints from /collections/{id}/items in the generated OpenAPI spec.
# This MUST run before importing APP, because pygeoapi reads and caches openapi.yml
# into memory at import time. Modifying the file afterwards has no effect.
remove_post_endpoints(_COLLECTIONS_ITEMS_PATTERN)

from prometheus_flask_exporter.multiprocess import GunicornInternalPrometheusMetrics
from flask import request, make_response, jsonify
from pygeoapi.flask_app import APP as app

metrics = GunicornInternalPrometheusMetrics(app, path='/actuator/metrics')

# Blocking POST endpoints /collections/{id}/items, as they are not standard
@app.before_request
def block_post_to_collection_items():
    if request.method == 'POST':
        if _COLLECTIONS_ITEMS_PATTERN.search(request.path):
            response = make_response(
                jsonify({
                    "error": "Method Not Allowed",
                    "message": f"POST requests to {request.path} are not supported"
                }),
                405
            )
            response.headers['Allow'] = 'GET, HEAD, OPTIONS'
            return response
