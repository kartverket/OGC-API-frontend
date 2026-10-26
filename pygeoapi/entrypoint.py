# /pygeoapi/entrypoint.py
import mimetypes
import os
import re
from pathlib import Path
from urllib.parse import quote, urlsplit

from modify_openapi import add_styles_to_openapi, remove_post_endpoints

_COLLECTIONS_ITEMS_PATTERN = re.compile(r'/collections/[^/]+/items/?$')

# Remove POST endpoints from /collections/{id}/items in the generated OpenAPI spec.
# This MUST run before importing APP, because pygeoapi reads and caches openapi.yml
# into memory at import time. Modifying the file afterwards has no effect.
remove_post_endpoints(_COLLECTIONS_ITEMS_PATTERN)
add_styles_to_openapi()

import pygeoapi.api.itemtypes as itemtypes_api
from flask import Response, jsonify, make_response, request, send_file
from prometheus_flask_exporter.multiprocess import GunicornInternalPrometheusMetrics
from pygeoapi import l10n
from pygeoapi.api import APIRequest
from pygeoapi.flask_app import APP as app
from pygeoapi.flask_app import api_

metrics = GunicornInternalPrometheusMetrics(app, path='/actuator/metrics')

# Patch: allow custom formatters (e.g. JSON-FG) to work on single item endpoints.
# Workaround for upstream limitations:
# 1. The Flask adapter may reject custom formats before the handler runs (no skip_valid_check)
# 2. get_collection_item doesn't support custom formatters (only get_collection_items does)
# This hook intercepts such requests, gets GeoJSON, and applies the formatter.
import json as json_mod

from pygeoapi.util import filter_dict_by_key_value, get_dataset_formatters

_SINGLE_ITEM_PATTERN = re.compile(r'/collections/[^/]+/items/[^/]+$')


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
    collections = filter_dict_by_key_value(api_.config['resources'], 'type', 'collection')
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
    api_request = APIRequest.from_flask(request, api_.locales)
    api_request._format = 'json'
    headers, status, content = itemtypes_api.get_collection_item(api_, api_request, collection_id, item_id)

    if status != 200:
        resp = make_response(content, status)
        if headers:
            for key, value in headers.items():
                if key.lower() not in ('content-type', 'content-length'):
                    resp.headers[key] = value
        return resp

    # Apply the formatter to transform GeoJSON to the requested format
    try:
        geojson_data = json_mod.loads(content)
        content_crs = headers.get('Content-Crs', '')
        formatted = formatter.write(data=geojson_data, options={'content_crs': content_crs})
        result = make_response(json_mod.dumps(formatted, default=str), 200)
        result.headers['Content-Type'] = formatter.mimetype
        for key, value in headers.items():
            if key.lower() not in ('content-type', 'content-length'):
                result.headers[key] = value
        return result
    except Exception:
        app.logger.exception('Failed to apply formatter "%s" for %s', f_param, request.path)
        return make_response(jsonify({'error': 'Internal Server Error', 'message': 'Failed to render response'}), 500)


# Restrict assets endpoint to known safe image types.
_ALLOWED_IMAGE_EXTENSIONS = {'.png', '.jpg', '.jpeg', '.webp', '.gif'}
# Base directory inside the container where frontend preview assets are served from.
_ASSETS_ROOT = Path(os.environ.get('PYGEOAPI_ASSETS_ROOT', '/pygeoapi/data')).resolve()


def _resolve_asset_path(asset_path: str) -> Path | None:
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
        response = make_response(jsonify({'error': 'Not Found', 'message': 'Requested asset image was not found'}), 404)
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
                jsonify(
                    {'error': 'Method Not Allowed', 'message': f'POST requests to {request.path} are not supported'}
                ),
                405,
            )
            response.headers['Allow'] = 'GET, HEAD, OPTIONS'
            return response


STYLE_MEDIA_TYPE = 'application/vnd.mapbox.style+json'


def collection_config(collection_id):
    collections = filter_dict_by_key_value(api_.config['resources'], 'type', 'collection')
    return collections.get(collection_id)


def configured_styles(collection_id):
    collection = collection_config(collection_id)
    if collection is None:
        return None

    return collection.get('styles', [])


def find_style(collection_id, style_id):
    styles = configured_styles(collection_id)
    if styles is None:
        return None

    for style in styles:
        if style.get('id') == style_id:
            return style

    return None


def read_style_document(style):
    style_path = Path(style['path'])

    with style_path.open('r', encoding='utf-8') as style_file:
        return json_mod.load(style_file)


def absolute_style_tile_urls(style_document):
    base_url = api_.config['server']['url'].rstrip('/')

    for source in style_document.get('sources', {}).values():
        if 'tiles' in source:
            source['tiles'] = [
                f'{base_url}{tile_url}' if tile_url.startswith('/') and not tile_url.startswith('//') else tile_url
                for tile_url in source['tiles']
            ]

    return style_document


def style_links(collection_id, style):
    style_id = style['id']

    return [
        {
            'rel': 'stylesheet',
            'href': f'/collections/{collection_id}/styles/{style_id}?f=mbs',
            'type': STYLE_MEDIA_TYPE,
        }
    ]


def style_keywords(style_document, collection_id):
    if not isinstance(style_document, dict):
        raise ValueError('Invalid style document')

    collection_path = f'/collections/{quote(collection_id, safe="")}'
    sources = style_document.get('sources', {})
    layers = style_document.get('layers', [])
    if not isinstance(sources, dict) or not isinstance(layers, list):
        raise ValueError('Invalid style sources or layers')

    if style_document.get('version') != 8 or len(sources) != 1:
        return []

    source_id, source = next(iter(sources.items()))
    if not isinstance(source, dict) or not all(isinstance(layer, dict) for layer in layers):
        return []

    source_layers = [layer for layer in layers if layer.get('source') == source_id]
    if not source_layers:
        return []

    if source.get('type') == 'geojson' and isinstance(source.get('data'), str):
        if urlsplit(source['data']).path.rstrip('/') == f'{collection_path}/items' and all(
            'source-layer' not in layer for layer in source_layers
        ):
            return ['items']
    elif source.get('type') == 'vector' and isinstance(source.get('tiles'), list):
        if any(
            isinstance(tile_url, str) and urlsplit(tile_url).path.startswith(f'{collection_path}/tiles/')
            for tile_url in source['tiles']
        ) and all(layer.get('source-layer') == collection_id for layer in source_layers):
            return ['vector-tiles']

    return []


@app.get('/collections/<collection_id>/styles')
def get_collection_styles(collection_id):
    styles = configured_styles(collection_id)

    if styles is None:
        return jsonify(
            {
                'code': 'NotFound',
                'description': f'Unknown collection: {collection_id}',
            }
        ), 404

    locale = APIRequest.from_flask(request, api_.locales).locale
    descriptions = []
    for style in styles:
        try:
            document = read_style_document(style)
            keywords = style_keywords(document, collection_id)
        except (OSError, json_mod.JSONDecodeError, ValueError, TypeError):
            app.logger.exception('Could not classify style: %s', style.get('path'))
            keywords = []

        descriptions.append(
            {
                'id': style['id'],
                'title': l10n.translate(style.get('title') or style['id'], locale),
                'description': l10n.translate(style.get('description') or '', locale),
                'links': style_links(collection_id, style),
                **({'keywords': keywords} if keywords else {}),
            }
        )

    response = {'styles': descriptions}

    default_style = next(
        (style['id'] for style in styles if style.get('default') is True),
        None,
    )

    if default_style is not None:
        response['default'] = default_style

    return jsonify(response)


@app.get('/collections/<collection_id>/styles/<style_id>')
def get_collection_style(collection_id, style_id):
    style = find_style(collection_id, style_id)

    if style is None:
        return jsonify(
            {
                'code': 'NotFound',
                'description': f'Unknown style: {style_id}',
            }
        ), 404

    requested_format = request.args.get('f', 'mbs')

    if requested_format not in ('mbs', 'mapbox'):
        return jsonify(
            {
                'code': 'InvalidParameterValue',
                'description': (f'Unsupported style format: {requested_format}'),
            }
        ), 400

    try:
        style_document = read_style_document(style)
    except FileNotFoundError:
        app.logger.exception(
            'Style file not found: %s',
            style.get('path'),
        )

        return jsonify(
            {
                'code': 'NotFound',
                'description': f'Style file not found: {style_id}',
            }
        ), 404
    except json_mod.JSONDecodeError:
        app.logger.exception(
            'Invalid style JSON: %s',
            style.get('path'),
        )

        return jsonify(
            {
                'code': 'InternalServerError',
                'description': 'Style document is not valid JSON',
            }
        ), 500

    style_document = absolute_style_tile_urls(style_document)

    return Response(
        json_mod.dumps(style_document, ensure_ascii=False),
        status=200,
        content_type=STYLE_MEDIA_TYPE,
    )


# The /styles endpoints above are implemented outside of pygeoapi's own
# provider system, so pygeoapi has no way of knowing they exist and will
# not advertise them on /conformance. Patch the JSON response here instead.
_STYLES_CONFORMANCE_CLASSES = [
    'http://www.opengis.net/spec/ogcapi-styles-1/1.0/conf/core',
    'http://www.opengis.net/spec/ogcapi-styles-1/1.0/conf/resources',
    'http://www.opengis.net/spec/ogcapi-styles-1/1.0/conf/mapbox-styles',
]


@app.after_request
def add_styles_conformance_classes(response):
    if request.path != '/conformance' or request.method != 'GET':
        return response

    content_type = response.content_type or ''
    media_type = content_type.partition(';')[0].strip().lower()
    if media_type != 'application/json':
        return response

    if response.status_code != 200:
        return response

    try:
        payload = json_mod.loads(response.get_data(as_text=True))
    except (ValueError, TypeError):
        return response

    conforms_to = set(payload.get('conformsTo', []))
    conforms_to.update(_STYLES_CONFORMANCE_CLASSES)
    payload['conformsTo'] = sorted(conforms_to)

    response.set_data(json_mod.dumps(payload))
    return response


# Same rationale as above: pygeoapi's collection responses have no knowledge
# of the custom /styles endpoints, so they won't link to them. Patch the
# link in here for any collection that has styles configured.
_STYLES_REL = 'http://www.opengis.net/def/rel/ogc/1.0/styles'
_COLLECTION_PATTERN = re.compile(r'^/collections/([^/]+)/?$')


@app.after_request
def add_styles_link_to_collection(response):
    if request.method != 'GET':
        return response

    match = _COLLECTION_PATTERN.match(request.path)
    if match is None:
        return response

    content_type = response.content_type or ''
    media_type = content_type.partition(';')[0].strip().lower()
    if media_type != 'application/json':
        return response

    if response.status_code != 200:
        return response

    collection_id = match.group(1)
    styles = configured_styles(collection_id)
    if not styles:
        return response

    try:
        payload = json_mod.loads(response.get_data(as_text=True))
    except (ValueError, TypeError):
        return response

    links = payload.setdefault('links', [])
    base_url = api_.config['server']['url'].rstrip('/')
    styles_href = f'{base_url}/collections/{collection_id}/styles'

    if not any(link.get('rel') == _STYLES_REL for link in links):
        links.append(
            {
                'rel': _STYLES_REL,
                'type': 'application/json',
                'title': 'Styles',
                'href': styles_href,
            }
        )

    response.set_data(json_mod.dumps(payload))
    return response
