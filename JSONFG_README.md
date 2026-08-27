# JSON-FG Support for pygeoapi (Branch: jsonfg)

This branch adds [OGC Features and Geometries JSON (JSON-FG)](https://docs.ogc.org/is/21-045r1/21-045r1.html) as an output format for the OGC API Features service powered by pygeoapi 0.24.0.

## Summary of Changes

### New File: `pygeoapi/formatter_jsonfg.py`

A custom pygeoapi **formatter plugin** that transforms standard GeoJSON responses into JSON-FG (OGC 21-045r1, version 1.0.0).

**Key behaviours:**

| Scenario | `geometry` | `place` | `coordRefSys` |
|----------|-----------|---------|---------------|
| CRS is WGS84 / CRS84 | Geometry (unchanged) | `null` | _(omitted)_ |
| CRS is non-WGS84 (e.g. EPSG:25833) | `null` | Geometry | Set to CRS URI |

**Conformance classes declared:**

- `http://www.opengis.net/spec/json-fg-1/1.0/conf/core` — always
- `http://www.opengis.net/spec/json-fg-1/1.0/conf/types-schemas` — when `featureType` can be determined

**Additional JSON-FG members added:**

- `conformsTo` — required by the spec on the root object
- `time` — set to `null` per feature (no temporal data in current collections)
- `place` — geometry in non-WGS84 CRS, or `null` for WGS84
- `featureType` — extracted from the `rel=collection` link in the response
- `coordRefSys` — CRS URI, only when geometry is not in WGS84

**CRS detection:**

The formatter accepts CRS info via the `options` dict:
- `options['content_crs']` — the value of the `Content-Crs` response header (used by the single-item entrypoint hook)
- `options['crs_uri']` — direct CRS URI string

Both WGS84 URI variants are recognized (`/OGC/0/CRS84`, `/OGC/1.3/CRS84`, and EPSG:4326).

---

### Modified File: `pygeoapi/entrypoint.py`

Added a Flask `before_request` hook (`allow_custom_format_on_single_item`) that works around **two bugs in pygeoapi 0.23.4**:

1. **Flask-level format rejection**: The `execute_from_flask()` function validates the `f` query parameter against only built-in formats (json, html, jsonld) *before* the handler runs. For single-item requests (`/collections/{id}/items/{itemId}`), it does NOT pass `skip_valid_check=True` — unlike the items-list endpoint which does.

2. **No formatter support in `get_collection_item`**: Even if validation passed, the `get_collection_item` handler does not load or apply dataset-specific formatters. Only `get_collection_items` (plural) does.

**How the hook works:**

1. Detects GET requests to single-item endpoints with a custom format parameter (e.g. `f=jsonfg`)
2. Loads the collection's configured formatters to find a matching one
3. Calls `get_collection_item` directly with format forced to `'json'` so it produces clean GeoJSON without crashing on the unknown format
4. Extracts the `Content-Crs` header from the response
5. Passes the GeoJSON and CRS info to the formatter's `write()` method
6. Returns the formatted JSON-FG response with the correct `Content-Type`

---

### Modified File: `pygeoapi/Dockerfile`

Added a single line to copy the formatter plugin into the container:

```dockerfile
COPY formatter_jsonfg.py /pygeoapi/formatter_jsonfg.py
```

The formatter is importable because `PYTHONPATH="/pygeoapi"` is already set in the Dockerfile.

---

### Modified File: `pygeoapi/pygeoapi-config.yml`

Added a `formatters` section to the `fylker` collection:

```yaml
    formatters:
      - name: formatter_jsonfg.JsonFgFormatter
```

This registers the JSON-FG formatter for that collection. The same block needs to be added to any other collection that should support JSON-FG output.

---

## Usage

### Items list (natively supported by pygeoapi's formatter mechanism)

```
GET /collections/fylker/items?f=jsonfg
GET /collections/fylker/items?f=jsonfg&crs=http://www.opengis.net/def/crs/EPSG/0/25833
```

### Single item (supported via the entrypoint hook)

```
GET /collections/fylker/items/03?f=jsonfg
GET /collections/fylker/items/03?f=jsonfg&crs=http://www.opengis.net/def/crs/EPSG/0/25833
```

### Content negotiation via Accept header

```
Accept: application/vnd.ogc.fg+json
```

---

## Enabling JSON-FG on Additional Collections

Add the following to any collection in `pygeoapi-config.yml`:

```yaml
    formatters:
      - name: formatter_jsonfg.JsonFgFormatter
```

Place it at the same indentation level as `providers:` within the collection definition.

---

## Validated Against

The output passes the OGC JSON-FG validator for the following conformance classes:

- `json-fg-1/1.0/conf/core`
- `json-fg-1/1.0/conf/types-schemas`

---

## Dependencies

No additional Python packages required. The formatter uses only:
- `copy.deepcopy` (stdlib)
- `pygeoapi.formatter.base.BaseFormatter` (already in pygeoapi 0.23.4)
