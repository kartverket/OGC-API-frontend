"""
schema_provider.py

A PostgreSQL feature provider that derives /schema, /queryables, and /sortables
from a pre-generated JSON Schema file instead of live database introspection.

Configuration (in pygeoapi-config.yml):

    providers:
      - type: feature
        name: schema_provider.SchemaPostgreSQLProvider
        schema_file: /apiconfig/schemas/<collection>.json  # optional
        data:
          ...   (same as regular PostgreSQL provider)
        id_field: objid
        table: ...
        geom_field: ...

Schema file format (standard JSON Schema with optional OGC extensions):

    {
      "$schema": "https://json-schema.org/draft/2020-12/schema",
      "type": "object",
      "title": "My Collection",
      "properties": {
        "my_field": {
          "type": "string",
          "title": "My Field",
          "description": "A human-readable description.",
          "x-ogc-sortable": true,
          "x-ogc-filterable": true
        }
      }
    }

Supported JSON Schema keywords per property:
  type          – string | integer | number | boolean  (required)
  format        – e.g. "date", "date-time", "uri"      (optional)
  title         – human-readable label                  (optional)
  description   – longer description                    (optional)
  enum          – list of allowed values                (optional)

Custom OGC extension keywords (all optional, default to True):
  x-ogc-sortable   – whether the field appears in /sortables
  x-ogc-filterable – whether the field appears in /queryables
"""

import json
import logging

from geoalchemy2.elements import WKBElement
from shapely import wkb as shapely_wkb
from shapely.geometry import mapping

from pygeoapi.provider.base import BaseProvider
from pygeoapi.provider.sql import PostgreSQLProvider

LOGGER = logging.getLogger(__name__)

# Map JSON Schema primitive types to the type strings pygeoapi expects
_JSONSCHEMA_TO_PYGEOAPI_TYPE = {
    "string": "string",
    "integer": "integer",
    "number": "number",
    "boolean": "boolean",
    "object": "object",
    "array": "array",
}


def _parse_fields(schema: dict) -> dict:
    """
    Convert a JSON Schema ``properties`` map into the dict format that
    pygeoapi expects from ``BaseProvider.get_fields()``.

    Args:
        schema: Parsed JSON Schema document (a dict with a ``properties`` key).

    Returns:
        Dict mapping field names to their pygeoapi field descriptors.
    """
    fields = {}
    for name, prop in schema.get("properties", {}).items():
        raw_type = prop.get("type", "string")

        # Handle nullable union types: {"type": ["string", "null"]}
        if isinstance(raw_type, list):
            non_null = [t for t in raw_type if t != "null"]
            raw_type = non_null[0] if non_null else "string"

        field = {
            "type": _JSONSCHEMA_TO_PYGEOAPI_TYPE.get(raw_type, "string"),
        }

        for optional_key in ("title", "description", "format", "enum", "x-ogc-example"):
            if optional_key in prop:
                field[optional_key] = prop[optional_key]

        field["sortable"] = prop.get("x-ogc-sortable", True)
        field["filterable"] = prop.get("x-ogc-filterable", True)

        fields[name] = field

    return fields


class SchemaPostgreSQLProvider(BaseProvider):
    """
    PostgreSQL feature provider that reads field definitions from a
    pre-generated JSON Schema file when configured.

    Inherits from BaseProvider only. The real PostgreSQLProvider (which
    connects to the database) is created lazily on the first data call so
    that OpenAPI / schema generation never triggers a database connection.

    If ``schema_file`` is omitted, field definitions fall back to the
    underlying PostgreSQLProvider's database introspection behavior.

    All data operations (query, get, create, update, delete) are forwarded
    to the lazily-created PostgreSQLProvider delegate.
    """

    def __init__(self, provider_def: dict):
        # BaseProvider.__init__ sets the standard attributes (name, type,
        # data, id_field, storage_crs, etc.) without touching the database.
        super().__init__(provider_def)

        schema_file = provider_def.get("schema_file")
        self._fields = None

        if schema_file:
            LOGGER.debug("Loading JSON Schema from %s", schema_file)
            with open(schema_file, encoding="utf-8") as fh:
                raw_schema = json.load(fh)

            # Store in _fields so the BaseProvider.fields property also works.
            self._fields = _parse_fields(raw_schema)

            LOGGER.info(
                "Loaded %d field(s) from %s",
                len(self._fields),
                schema_file,
            )
        else:
            LOGGER.info(
                "No schema_file configured for %s; falling back to PostgreSQL introspection",
                provider_def.get("table", self.name),
            )

        # Keep provider_def for lazy delegate creation.
        self._provider_def = provider_def
        self._delegate: PostgreSQLProvider | None = None

    # ------------------------------------------------------------------
    # Lazy delegate – only connects to the database when data is needed
    # ------------------------------------------------------------------

    def _get_delegate(self) -> PostgreSQLProvider:
        """Return (and lazily create) the real PostgreSQLProvider."""
        if self._delegate is None:
            LOGGER.debug("Initializing PostgreSQLProvider delegate")
            self._delegate = PostgreSQLProvider(self._provider_def)
        return self._delegate

    @property
    def fields(self) -> dict:
        """Ensure callers of ``provider.fields`` get fallback behavior too."""
        return self.get_fields()

    # ------------------------------------------------------------------
    # Schema endpoints – served from the static JSON file
    # ------------------------------------------------------------------

    def get_fields(self) -> dict:
        """Return fields from schema_file or fall back to PostgreSQL introspection."""
        if self._fields is not None:
            return self._fields

        return self._get_delegate().get_fields()

    def _sanitize_value(self, value):
        """Convert non-JSON-safe geometry objects into serializable values."""
        if isinstance(value, WKBElement):
            try:
                # Convert WKB to GeoJSON geometry dict.
                return mapping(shapely_wkb.loads(bytes(value.data)))
            except Exception:  # pragma: no cover - defensive fallback
                LOGGER.debug("Failed to decode WKBElement", exc_info=True)
                return None

        if isinstance(value, dict):
            return {k: self._sanitize_value(v) for k, v in value.items()}

        if isinstance(value, list):
            return [self._sanitize_value(v) for v in value]

        return value

    def _sanitize_response(self, response):
        """Recursively sanitize delegated responses for JSON serialization."""
        return self._sanitize_value(response)

    # ------------------------------------------------------------------
    # Data endpoints – delegated to the real PostgreSQLProvider
    # ------------------------------------------------------------------

    def query(self, **kwargs):
        return self._sanitize_response(self._get_delegate().query(**kwargs))

    def get(self, identifier, **kwargs):
        return self._sanitize_response(self._get_delegate().get(identifier, **kwargs))

    def create(self, item):
        return self._get_delegate().create(item)

    def update(self, identifier, item):
        return self._get_delegate().update(identifier, item)

    def delete(self, identifier):
        return self._get_delegate().delete(identifier)
