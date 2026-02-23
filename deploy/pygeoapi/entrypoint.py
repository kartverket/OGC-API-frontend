# /pygeoapi/entrypoint.py
import os
import re
import yaml

# Remove POST endpoints from /collections/{id}/items in the generated OpenAPI spec.
# This MUST run before importing APP, because pygeoapi reads and caches openapi.yml
# into memory at import time. Modifying the file afterwards has no effect on what
# the API serves.
_openapi_file = os.environ.get('PYGEOAPI_OPENAPI')
if _openapi_file and os.path.exists(_openapi_file):
    print(f"Modifying OpenAPI spec at {_openapi_file} to remove POST endpoints from /collections/{{id}}/items")
    with open(_openapi_file) as _f:
        _spec = yaml.safe_load(_f)

    paths = _spec.get('paths', {}) if isinstance(_spec, dict) else {}
    removed_any = False
    for p in paths:
        if re.search(r'/collections/[^/]+/items$', p) and 'post' in paths[p]:
            paths[p].pop('post')
            removed_any = True

    if removed_any:
        with open(_openapi_file, 'w') as _f:
            yaml.dump(_spec, _f, allow_unicode=True, sort_keys=False)


from prometheus_flask_exporter.multiprocess import GunicornInternalPrometheusMetrics
from flask import request, make_response
from pygeoapi.flask_app import APP as app

# Blocking POST endpoints /items, as they are not standard
@app.before_request
def block_unwanted_post():
    if request.method == 'POST':
        if request.path.endswith('/items'):
            return make_response('Method Not Allowed', 405)

metrics = GunicornInternalPrometheusMetrics(app, path='/actuator/metrics')

