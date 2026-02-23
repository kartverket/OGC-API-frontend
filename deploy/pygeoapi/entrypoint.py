# /pygeoapi/entrypoint.py
import os
import re
import yaml

_COLLECTIONS_ITEMS_PATTERN = re.compile(r'/collections/[^/]+/items$')

# Remove POST endpoints from /collections/{id}/items in the generated OpenAPI spec.
# This MUST run before importing APP, because pygeoapi reads and caches openapi.yml
# into memory at import time. Modifying the file afterwards has no effect on what
# the API serves.
_openapi_file = os.environ.get('PYGEOAPI_OPENAPI')
if _openapi_file and os.path.exists(_openapi_file):
    print(f"Modifying OpenAPI spec at {_openapi_file} to remove POST endpoints from /collections/{{id}}/items")
    try:
        with open(_openapi_file) as _f:
            _spec = yaml.safe_load(_f)
    except yaml.YAMLError as exc:
        print(f"Failed to parse OpenAPI spec at {_openapi_file}: {exc}")
        _spec = None

    if isinstance(_spec, dict):
        paths = _spec.get('paths', {})
        paths_to_modify = [
            p for p in paths
            if _COLLECTIONS_ITEMS_PATTERN.search(p) and 'post' in paths[p]
        ]

        for p in paths_to_modify:
            paths[p].pop('post')

        if paths_to_modify:
            with open(_openapi_file, 'w') as _f:
                yaml.dump(_spec, _f, allow_unicode=True, sort_keys=False)


from prometheus_flask_exporter.multiprocess import GunicornInternalPrometheusMetrics
from flask import request, make_response, jsonify
from pygeoapi.flask_app import APP as app

# Blocking POST endpoints /collections/{id}/items, as they are not standard
@app.before_request
def block_post_to_collection_items():
    if request.method == 'POST':
        if _COLLECTIONS_ITEMS_PATTERN.search(request.path):
            response = make_response(
                jsonify({
                    "error": "Method Not Allowed",
                    "message": "POST requests to /collections/{id}/items are not supported"
                }),
                405
            )
            response.headers['Allow'] = 'GET, OPTIONS'
            return response
