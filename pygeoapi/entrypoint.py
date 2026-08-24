# /pygeoapi/entrypoint.py
import mimetypes
import os
import re
from pathlib import Path
from typing import Optional

from modify_openapi import remove_post_endpoints

_COLLECTIONS_ITEMS_PATTERN = re.compile(r'/collections/[^/]+/items/?$')

# Remove POST endpoints from /collections/{id}/items in the generated OpenAPI spec.
# This MUST run before importing APP, because pygeoapi reads and caches openapi.yml
# into memory at import time. Modifying the file afterwards has no effect.
remove_post_endpoints(_COLLECTIONS_ITEMS_PATTERN)

from prometheus_flask_exporter.multiprocess import GunicornInternalPrometheusMetrics
from flask import request, make_response, jsonify, send_file
from pygeoapi.flask_app import APP as app

metrics = GunicornInternalPrometheusMetrics(app, path='/actuator/metrics')

# Restrict assets endpoint to known safe image types.
_ALLOWED_IMAGE_EXTENSIONS = {'.png', '.jpg', '.jpeg', '.webp', '.gif'}
# Base directory inside the container where frontend preview assets are served from.
_ASSETS_ROOT = Path(os.environ.get('PYGEOAPI_ASSETS_ROOT', '/pygeoapi/data')).resolve()


def _resolve_asset_path(asset_path: str) -> Optional[Path]:
    if not asset_path:
        return None

    resolved_path = (_ASSETS_ROOT / Path(asset_path)).resolve()

    # Block path traversal attempts such as ../../etc/passwd.
    try:
        resolved_path.relative_to(_ASSETS_ROOT)
    except ValueError:
        return None

    if resolved_path.suffix.lower() not in _ALLOWED_IMAGE_EXTENSIONS:
        return None

    if not resolved_path.is_file():
        return None

    return resolved_path


@app.get('/assets/<path:asset_path>')
def get_asset_image(asset_path):
    # Serve preview images referenced by collection links (rel=preview).
    image_path = _resolve_asset_path(asset_path)
    if image_path is None:
        response = make_response(
            jsonify({
                "error": "Not Found",
                "message": "Requested asset image was not found"
            }),
            404
        )
        return response

    # Infer content type from extension; default to octet-stream if unknown.
    mimetype = mimetypes.guess_type(str(image_path))[0] or 'application/octet-stream'
    return send_file(image_path, mimetype=mimetype)

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
