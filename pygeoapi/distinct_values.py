import logging
import psycopg2
from psycopg2 import sql
import os
import yaml
from pygeoapi.process.base import BaseProcessor, ProcessorExecuteError

LOGGER = logging.getLogger(__name__)

# This must be defined before the class starts
PROCESS_METADATA = {
    "version": "0.2.2",
    "id": "get-distinct-values",
    "title": "Distinct Values by Resource",
    "description": "Returns unique values for a queryable by referencing a resource name.",
    "keywords": ["postgis", "distinct", "resource"],
    "inputs": {
        "resource_name": {
            "title": "Resource ID",
            "description": "The ID of the resource in config.yml (e.g., kommuner)",
            "schema": {"type": "string"},
            "minOccurs": 1,
            "maxOccurs": 1,
        },
        "queryable": {
            "title": "Queryable Property",
            "description": "The attribute name to get unique values for (e.g., kommunenummer)",
            "schema": {"type": "string"},
            "minOccurs": 1,
            "maxOccurs": 1,
        },
    },
    "outputs": {"values": {"title": "Unique Values", "schema": {"type": "array"}}},
}


class DistinctValuesProcessor(BaseProcessor):
    def __init__(self, processor_def):
        super().__init__(processor_def, PROCESS_METADATA)

        # Load the config from the environment variable path
        config_path = os.getenv("PYGEOAPI_CONFIG", "/pygeoapi/local.config.yml")
        try:
            with open(config_path, "r") as f:
                self.config = yaml.safe_load(f)
        except Exception as e:
            LOGGER.error(f"Could not load config at {config_path}: {e}")
            self.config = {}

        # DB Credentials from Env
        self.db_host = os.getenv("POSTGRES_HOST", "postgis")
        self.db_name = os.getenv("POSTGRES_DB", "pygeoapi_test")
        self.db_user = os.getenv("POSTGRES_USER", "postgres")
        self.db_pass = os.getenv("POSTGRES_PASSWORD", "qwer1234")

    def execute(self, data, **kwargs):
        resource_id = data.get("resource_name")
        queryable = data.get("queryable")

        if not resource_id or not queryable:
            raise ProcessorExecuteError("Missing resource_name or queryable")

        # 1. Look up the resource
        resources = self.config.get("resources", {})
        resource_config = resources.get(resource_id)

        if not resource_config:
            available = ", ".join(resources.keys())
            raise ProcessorExecuteError(
                f"Resource '{resource_id}' not found. Available: {available}"
            )

        # 2. Extract Table and Schema
        providers = resource_config.get("providers", [])
        provider_info = {}
        for p in providers:
            if p.get("type") == "feature" or p.get("name") == "PostgreSQL":
                provider_info = p
                break

        table_name = provider_info.get("table")
        data_info = provider_info.get("data", {})
        search_path = data_info.get("search_path", [])
        schema_name = (
            search_path[0]
            if isinstance(search_path, list) and search_path
            else "public"
        )

        if not table_name:
            raise ProcessorExecuteError(
                f"Resource '{resource_id}' has no table defined."
            )

        # 3. DB Query
        conn = None
        try:
            conn = psycopg2.connect(
                host=self.db_host,
                database=self.db_name,
                user=self.db_user,
                password=self.db_pass,
            )
            cur = conn.cursor()

            table_id = sql.Identifier(schema_name, table_name)
            query = sql.SQL(
                "SELECT DISTINCT {col} FROM {tab} WHERE {col} IS NOT NULL ORDER BY {col}"
            ).format(col=sql.Identifier(queryable), tab=table_id)

            cur.execute(query)

            distinct_list = [row[0] for row in cur.fetchall()]
            cur.close()
            return "application/json", {"id": "values", "value": distinct_list}

        except Exception as e:
            LOGGER.error(f"Database error querying {resource_id}.{queryable}: {e}")
            raise ProcessorExecuteError(
                f"Unable to retrieve distinct values for '{queryable}' from resource '{resource_id}'"
            )
        finally:
            if conn:
                conn.close()
