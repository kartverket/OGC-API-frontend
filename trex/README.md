# t-rex

t-rex er en vektorflis-tjener som serverer MVT-tiles (Mapbox Vector Tiles) fra PostGIS.

### Lokal kjøring

t-rex kjøres som en del av docker-compose-oppsettet:

```shell
cd dev
docker compose up -d
```

Tiles er tilgjengelige på `http://localhost:8080/{tileset}/{z}/{x}/{y}.pbf`.

### Konfigurasjon

Konfigurasjonsfilen `t-rex.toml` styrer tilkobling til database, tileset-definisjon, cache og webserver.
Miljøvariabler injiseres med `{{env.VARIABEL}}`-syntaks.

### Caching

#### Hvordan cachen fungerer

Når en tile blir forespurt, sjekker t-rex om filen allerede finnes i cache-katalogen. Ved treff serveres
filen direkte uten databaseoppslag. Ved miss genereres tilen fra databasen, skrives til disk og serveres.

Filene lagres etter mønsteret: `<base>/<tileset>/<z>/<x>/<y>.pbf`

#### Cache-ugyldiggjøring

t-rex har **ingen innebygd mekanisme for cache-ugyldiggjøring**. Det finnes ingen TTL, ingen utløpstid
og ingen automatisk deteksjon av endringer i underliggende data. En cachet tile blir værende på disk
til den slettes manuelt eller cache-katalogen tømmes.

Per nå brukes `emptyDir` i miljøet, som betyr at cachen nullstilles hver gang poden restartes eller
redeployes. Med to replikaer bygger hver pod sin egen cache uavhengig av den andre.

#### Cache i dette prosjektet

Filbasert cache er konfigurert i `t-rex.toml`:

```toml
[cache.file]
base = "/var/cache/mvtcache"
```

Cache-katalogen `/var/cache/mvtcache` opprettes og settes til rett eier i `Dockerfile`.

#### Konfigurasjonsalternativer

**Ingen cache**
Utelat `[cache.file]`-blokken helt, eller sett `no_cache = true` i `cache_limits`.
Alle tiles genereres live fra databasen ved hver forespørsel.

**Filbasert cache**
```toml
[cache.file]
base = "/var/cache/mvtcache"
```
Tiles caches til disk ved første forespørsel. Krever at cache-katalogen er skrivbar for prosessen.

**Zoom-begrenset cache**
```toml
[[tileset]]
name = "tellekretser"
cache_limits = { minzoom = 0, maxzoom = 10, no_cache = false }
```
Bare tiles innenfor det angitte zoom-intervallet caches. Tiles utenfor intervallet genereres alltid live.

**S3-basert cache**
```toml
[cache.s3]
endpoint = "https://storage.googleapis.com"
bucket = "your-bucket-name"
region = "europe-north1"
access_key = "{{env.GCS_ACCESS_KEY}}"
secret_key = "{{env.GCS_SECRET_KEY}}"
```
Tiles lagres i objektlagring i stedet for lokal disk. Cachen overlever pod-restarter og deles på tvers
av replikaer. Ugyldiggjøring er fortsatt manuell.

**S3-basert cache med zoom-begrensning og baseurl**
```toml
[cache.s3]
endpoint = "https://storage.googleapis.com"
bucket = "your-bucket-name"
region = "europe-north1"
access_key = "{{env.GCS_ACCESS_KEY}}"
secret_key = "{{env.GCS_SECRET_KEY}}"
baseurl = "https://cdn.example.com/mvtcache"

[[tileset]]
name = "tellekretser"
minzoom = 0
maxzoom = 22
cache_limits = { minzoom = 0, maxzoom = 10, no_cache = false }
```
Kombinerer S3-lagring med zoom-begrenset caching. `baseurl` brukes når tiles serveres direkte fra
objektlagring eller CDN, slik at t-rex publiserer korrekte tile-URLer i metadata.

#### Forhåndsgenerering av cache

t-rex støtter forhåndsgenerering av tiles via en egen kommando (separat fra `serve`):

```shell
t_rex generate --config /var/data/t-rex.toml \
  --tileset tellekretser \
  --minzoom 0 --maxzoom 14 \
  --extent "4.0,57.0,32.0,72.0" \
  --overwrite false
```

Dette kan for eksempel kjøres som en init-container i Kubernetes for å varme opp cachen før tjenesten starter.
