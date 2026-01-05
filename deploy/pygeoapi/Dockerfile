FROM geopython/pygeoapi:latest

# Add your custom process script
COPY distinct_values.py /pygeoapi/distinct_values.py

# Ensure the PYTHONPATH includes the directory
ENV PYTHONPATH="/pygeoapi:${PYTHONPATH}"
