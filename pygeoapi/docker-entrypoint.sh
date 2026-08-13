#!/bin/sh
# Remove GOOGLE_APPLICATION_CREDENTIALS from the environment to avoid GDAL trying to use it for authentication.
# Unset the variable before executing the original entrypoint script.
unset GOOGLE_APPLICATION_CREDENTIALS
exec /entrypoint.sh "$@"
