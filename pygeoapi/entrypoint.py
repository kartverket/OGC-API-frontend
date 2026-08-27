# /pygeoapi/entrypoint.py
import re
from modify_openapi import remove_post_endpoints

_COLLECTIONS_ITEMS_PATTERN = re.compile(r'/collections/[^/]+/items/?$')

# Remove POST endpoints from /collections/{id}/items in the generated OpenAPI spec.
# This MUST run before importing APP, because pygeoapi reads and caches openapi.yml
# into memory at import time. Modifying the file afterwards has no effect.
remove_post_endpoints(_COLLECTIONS_ITEMS_PATTERN)

from prometheus_flask_exporter.multiprocess import GunicornInternalPrometheusMetrics
from flask import request, make_response, jsonify
from pygeoapi.flask_app import APP as app, api_, execute_from_flask
import pygeoapi.api.itemtypes as itemtypes_api

metrics = GunicornInternalPrometheusMetrics(app, path='/actuator/metrics')

# Patch: allow custom formatters (e.g. JSON-FG) to work on single item endpoints.
# pygeoapi 0.23.4 has a bug where:
# 1. The Flask adapter rejects custom formats before the handler runs (no skip_valid_check)
# 2. get_collection_item doesn't support custom formatters (only get_collection_items does)
# This hook intercepts such requests, gets GeoJSON, and applies the formatter.
import json as json_mod
from pygeoapi.util import get_dataset_formatters, filter_dict_by_key_value

_SINGLE_ITEM_PATTERN = re.compile(
    r'/collections/[^/]+/items/[^/]+$'
)


@app.before_request
def allow_custom_format_on_single_item():
    """Handle custom formatters for single item requests."""
    if request.method != 'GET':
        return None
    if not _SINGLE_ITEM_PATTERN.search(request.path):
        return None

    f_param = request.args.get('f', '').strip()
    if not f_param or f_param in ('json', 'html', 'jsonld'):
        return None

    # Extract collection_id and item_id from the URL path
    parts = request.path.strip('/').split('/')
    try:
        col_idx = parts.index('collections')
        collection_id = parts[col_idx + 1]
        item_id = parts[col_idx + 3]
    except (ValueError, IndexError):
        return None

    # Check if this collection has a formatter for the requested format
    collections = filter_dict_by_key_value(
        api_.config['resources'], 'type', 'collection')
    if collection_id not in collections:
        return None

    dataset_formatters = get_dataset_formatters(collections[collection_id])
    formatter = None
    for v in dataset_formatters.values():
        if v.f == f_param:
            formatter = v
            break

    if formatter is None:
        return None  # let normal routing return format error

    # Fetch the item as GeoJSON (skip format check, handler returns JSON)
    # Override the format to 'json' so get_collection_item doesn't choke
    # on the unknown 'jsonfg' format when building response links.
    from pygeoapi.api import APIRequest
    api_request = APIRequest.from_flask(request, api_.locales)
    api_request._format = 'json'
    headers, status, content = itemtypes_api.get_collection_item(
        api_, api_request, collection_id, item_id)

    if status != 200:
        resp = make_response(content, status)
        if headers:
            resp.headers = headers
        return resp

    # Apply the formatter to transform GeoJSON to the requested format
    try:
        geojson_data = json_mod.loads(content)
        content_crs = headers.get('Content-Crs', '')
        formatted = formatter.write(
            data=geojson_data,
            options={'content_crs': content_crs})
        result = make_response(
            json_mod.dumps(formatted, default=str),
            200
        )
        result.headers['Content-Type'] = formatter.mimetype
        for key, value in headers.items():
            if key.lower() not in ('content-type', 'content-length'):
                result.headers[key] = value
        return result
    except Exception as err:
        app.logger.exception(
            'Failed to apply formatter "%s" for %s', f_param, request.path)
        return make_response(
            jsonify({'error': 'Internal Server Error', 'message': 'Failed to render response'}),
            500
        )


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
