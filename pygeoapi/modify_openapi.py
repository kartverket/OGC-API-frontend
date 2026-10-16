import os
import time
import yaml
import fcntl
from copy import deepcopy

_MAX_RETRIES = 20
_RETRY_INTERVAL = 1  # seconds

def _wait_for_file(filepath):
    """
    Wait for a file to appear on disk, retrying up to _MAX_RETRIES times.

    Args:
        filepath (str): Path to the file to wait for.

    Returns:
        bool: True if the file exists, False if it was not found after retries.
    """
    for attempt in range(1, _MAX_RETRIES + 1):
        if os.path.exists(filepath):
            return True
        print(
            f"OpenAPI spec not found at {filepath} "
            f"(attempt {attempt}/{_MAX_RETRIES}). "
            f"Retrying in {_RETRY_INTERVAL}s..."
        )
        time.sleep(_RETRY_INTERVAL)
    return False

def add_styles_paths(spec, config):
    paths = spec['paths']
    error_schema = {
        'type': 'object',
        'required': ['code', 'description'],
        'properties': {
            'code': {'type': 'string'},
            'description': {'type': 'string'},
        },
    }
    not_found = {
        'description': 'Collection or style not found',
        'content': {'application/json': {'schema': error_schema}},
    }

    styles_list = {
        'get': {
            'summary': 'List styles for a collection',
            'parameters': [{'$ref': '#/components/parameters/lang'}],
            'responses': {
                '200': {
                    'description': 'Available styles',
                    'content': {'application/json': {'schema': {
                        'type': 'object',
                        'required': ['styles'],
                        'properties': {
                            'styles': {
                                'type': 'array',
                                'items': {
                                    'type': 'object',
                                    'required': ['id', 'title', 'description', 'links'],
                                    'properties': {
                                        'id': {'type': 'string'},
                                        'title': {'type': 'string'},
                                        'description': {'type': 'string'},
                                        'links': {
                                            'type': 'array',
                                            'items': {
                                                'type': 'object',
                                                'required': ['rel', 'href', 'type'],
                                                'properties': {
                                                    'rel': {'type': 'string'},
                                                    'href': {'type': 'string'},
                                                    'type': {'type': 'string'},
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                            'default': {'type': 'string'},
                        },
                    }}},
                },
                '404': not_found,
            },
        },
    }
    style_document = {
        'get': {
            'summary': 'Get a Mapbox style document',
            'parameters': [{
                'name': 'styleId',
                'in': 'path',
                'required': True,
                'schema': {'type': 'string'},
            }, {
                'name': 'f',
                'in': 'query',
                'required': False,
                'schema': {
                    'type': 'string',
                    'enum': ['mbs', 'mapbox'],
                    'default': 'mbs',
                },
            }],
            'responses': {
                '200': {
                    'description': 'Mapbox style document (version 8)',
                    'content': {
                        'application/vnd.mapbox.style+json': {
                            'schema': {
                                'type': 'object',
                                'properties': {
                                    'version': {'type': 'integer'},
                                    'sources': {'type': 'object'},
                                    'layers': {'type': 'array', 'items': {'type': 'object'}},
                                },
                            },
                        },
                    },
                },
                '400': {
                    'description': 'Unsupported style format',
                    'content': {'application/json': {'schema': error_schema}},
                },
                '404': not_found,
                '500': {
                    'description': 'Style document is not valid JSON',
                    'content': {'application/json': {'schema': error_schema}},
                },
            },
        },
    }

    for collection_id, resource in config['resources'].items():
        collection_path = f'/collections/{collection_id}'
        if resource.get('type') != 'collection' or not resource.get('styles') or collection_path not in paths:
            continue

        list_path = deepcopy(styles_list)
        list_path['get']['tags'] = [collection_id]
        list_path['get']['operationId'] = f'get{collection_id.capitalize()}Styles'
        paths[f'{collection_path}/styles'] = list_path

        document_path = deepcopy(style_document)
        document_path['get']['tags'] = [collection_id]
        document_path['get']['operationId'] = f'get{collection_id.capitalize()}Style'
        paths[f'{collection_path}/styles/{{styleId}}'] = document_path


def remove_post_endpoints(pattern):
    """
    Remove POST endpoints from the OpenAPI spec file if they match the given pattern.

    Waits for the file to appear on disk (it is generated by pygeoapi on startup)
    before attempting modification.

    Args:
        pattern (re.Pattern): Compiled regex pattern to match paths against.
    """
    openapi_file = os.environ.get('PYGEOAPI_OPENAPI')
    if not openapi_file:
        print("PYGEOAPI_OPENAPI environment variable is not set. Skipping POST endpoint removal.")
        return

    if not _wait_for_file(openapi_file):
        print(
            f"WARNING: OpenAPI spec file not found at {openapi_file} after "
            f"{_MAX_RETRIES * _RETRY_INTERVAL}s. POST endpoints will NOT be "
            f"removed from the spec. This may happen on a fresh deployment if "
            f"pygeoapi has not yet generated the file."
        )
        return

    print(f"Modifying OpenAPI spec at {openapi_file} to remove POST endpoints matching pattern")
    try:
        with open(openapi_file, 'r+') as _f:
            # Acquire an exclusive lock to prevent race conditions properly
            fcntl.flock(_f, fcntl.LOCK_EX)
            try:
                _spec = yaml.safe_load(_f)

                if isinstance(_spec, dict):
                    paths = _spec.get('paths', {})
                    paths_to_modify = [
                        p for p in paths
                        if pattern.search(p) and 'post' in paths[p]
                    ]

                    for p in paths_to_modify:
                        paths[p].pop('post')

                    if paths_to_modify:
                        # Move pointer to beginning of file and truncate it
                        _f.seek(0)
                        _f.truncate()
                        yaml.safe_dump(_spec, _f, allow_unicode=True, sort_keys=False)
                elif _spec is not None:
                    print(f"OpenAPI spec at {openapi_file} is not a valid dictionary. Skipping modification.")
            finally:
                # Release the lock
                fcntl.flock(_f, fcntl.LOCK_UN)
    except yaml.YAMLError as exc:
        print(f"Failed to parse OpenAPI spec at {openapi_file}: {exc}")
    except Exception as e:
        print(f"Failed to modify OpenAPI spec at {openapi_file}: {e}")


def add_styles_to_openapi():
    """Document custom Styles endpoints in the generated OpenAPI spec."""
    openapi_file = os.environ.get('PYGEOAPI_OPENAPI')
    config_file = os.environ.get('PYGEOAPI_CONFIG')
    if not openapi_file:
        print("PYGEOAPI_OPENAPI environment variable is not set. Skipping Styles documentation.")
        return
    if not config_file:
        raise RuntimeError("PYGEOAPI_CONFIG environment variable is not set")

    if not _wait_for_file(openapi_file):
        print(f"WARNING: OpenAPI spec file not found at {openapi_file}. Styles endpoints will NOT be documented.")
        return

    try:
        with open(config_file, 'r') as config_stream:
            config = yaml.safe_load(config_stream)
        if not isinstance(config, dict) or not isinstance(config.get('resources'), dict):
            raise ValueError('pygeoapi config must contain resources')

        with open(openapi_file, 'r+') as _f:
            fcntl.flock(_f, fcntl.LOCK_EX)
            try:
                spec = yaml.safe_load(_f)
                if not isinstance(spec, dict) or not isinstance(spec.get('paths'), dict):
                    raise ValueError('OpenAPI spec must contain a paths object')

                add_styles_paths(spec, config)
                _f.seek(0)
                yaml.safe_dump(spec, _f, allow_unicode=True, sort_keys=False)
                _f.truncate()
            finally:
                fcntl.flock(_f, fcntl.LOCK_UN)
    except (OSError, yaml.YAMLError, ValueError) as exc:
        raise RuntimeError(f"Failed to document Styles endpoints in OpenAPI spec at {openapi_file}") from exc