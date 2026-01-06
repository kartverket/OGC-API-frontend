FROM geopython/pygeoapi:latest

RUN apt update -y \
    && apt install -y git \
    && /venv/bin/python3 -m pip install --no-cache-dir git+https://github.com/Arkitektum/pygeoapi.provider.postgresql_ext@main
