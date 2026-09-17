# OGC API front-end

### Lokal kjøring
Hele applikasjonen kan kjøres med:

```shell
cd dev
docker compose --profile with-frontend up -d
```

Under utvikling er det digg å kjøre frontenden utenfor docker:
fra prosjektroot:
```shell
docker compose -f dev/docker-compose.yml up -d
npm run dev
```

Av og til må man kanskje ta ned alt (også volumes) og bygge helt på nytt:
```shell
cd dev
docker compose down -v
docker compose up --build
```

### PostGIS-funksjoner

MVT-funksjonen `public.tellekrets_laea(z integer, x integer, y integer)` defineres
i `dev/postgis/tellekrets_mvt.sql`. Den transformerer data fra lagrings-CRS-et
EPSG:25833 til EPSG:3035 og lager fliser i `EuropeanETRS89_LAEAQuad`.

Ved en ny database (nytt `postgres_data`-volume) kjører `initdb.sh` funksjonen
automatisk etter at PostGIS-dumpene er importert.

En vanlig rebuild eller gjenopprettelse av containeren beholder databasen i volumet.
Funksjonen beholdes derfor, men endringer i SQL-filen kjøres ikke automatisk mot en
allerede opprettet database. Etter rebuild kan endringen installeres manuelt:

```shell
docker compose -f dev/docker-compose.yml exec -T postgis sh -c \
  'psql -v ON_ERROR_STOP=1 -U postgres -d pygeoapi_test -f /tmp/tellekrets_mvt.sql'
```

Kommandoen kjører filstien inne i containeren og fungerer derfor også fra Git Bash på
Windows. Start Martin på nytt etter at funksjonen er installert, slik at den oppdager
funksjonen:

```shell
docker compose -f dev/docker-compose.yml restart martin
```

Sjekk at funksjonen er installert:

```shell
docker compose -f dev/docker-compose.yml exec -T postgis \
  psql -U postgres -d pygeoapi_test -c "SELECT to_regprocedure('public.tellekrets_laea(integer,integer,integer)');"
```

### Vector tiles med Martin

Prosjektet bruker `martin` for vektorflisservering.

- Compose-service: `martin` (port `3030:3000`)
- Konfigurasjon: `martin/martin.yaml`
- Tile-endepunkt brukt av pygeoapi: `http://martin:3000/tellekrets_laea/{z}/{x}/{y}`

Enkel sjekk lokalt etter oppstart:

```shell
curl -I http://localhost:3030/health
```

Start martin:

```shell
docker compose -f dev/docker-compose.yml up -d martin
```

### Egendefinerte flisrutenett

Den spesielle vektorflis-collectionen er `tellekrets_laea`, som bruker det offisielle
`EuropeanETRS89_LAEAQuad`-rutenettet i EPSG:3035. Definisjonen ligger i
`pygeoapi/resources/definitions/tiles/EuropeanETRS89_LAEAQuad.json`.

For å legge til et nytt egendefinert rutenett:

1. Legg TileMatrixSet-JSON i `pygeoapi/resources/definitions/tiles/`.
2. Kopier filen i `pygeoapi/Dockerfile` og bind-mount den i `dev/docker-compose.yml`.
3. Lag en PostGIS-funksjon i `dev/postgis/tellekrets_mvt.sql`. `ST_TileEnvelope` må
  få zoom-0-utstrekningen fra TileMatrixSet-definisjonen, mens `ST_Transform` skal
  transformere kildedata til rutenettets CRS før `ST_AsMVTGeom`.
4. Registrer funksjonen i `martin/martin.yaml` og collectionen med samme
  TileMatrixSet-ID i `pygeoapi/pygeoapi-config.yml`.
5. Bygg og start tjenestene. Ved eksisterende databasevolum, last SQL-filen manuelt
  og restart Martin som beskrevet over.

Frontenden henter TileMatrixSet-definisjonen fra OGC API-et og lager en standard
OpenLayers `TileGrid` fra den. Definisjoner med `orderedAxes: ["Y", "X"]`, slik som
`EuropeanETRS89_LAEAQuad`, normaliseres til OpenLayers sin `X,Y`-rekkefølge.

### Konfigurasjonsfil (pygeoapi-config.yml)

Frontenden leser per nå metadata fra pygeoapi sin YAML-konfigurasjonsfil for å vise informasjon om datasettet.

**Filplassering:**
- **I Docker:** `/pygeoapi/pygeoapi-config.yml` (default)
- **Lokal utvikling:** Sett miljøvariabelen `PYGEOAPI_CONFIG_PATH_FRONTEND` i `.env.local`:
  ```
  PYGEOAPI_CONFIG_PATH_FRONTEND=./pygeoapi/pygeoapi-config.yml
  API_BASE_URL=http://localhost:5001
  BASE_URL_PUBLIC=http://localhost:3000
  ```
- Om man kjører lokalt med Colima må man starte med `colima start --arch x86_64`

**Arkitektur:**

Konfigurasjonsfilen leses kun server-side via `src/config/readPygeoapiConfig.js`. Attributter leses inn til pages og passes som props til komponenter.

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  pygeoapi.js    │────▶│  pageData.js     │────▶│  Page (server)  │
│  (fs.readFile)  │     │  (data fetching) │     │                 │
└─────────────────┘     └──────────────────┘     └────────┬────────┘
                                                          │ props
                                                          ▼
                                                 ┌─────────────────┐
                                                 │  Component      │
                                                 │  (client/server)│
                                                 └─────────────────┘
```

**Bruk i komponenter:**

Data fra konfigurasjonsfilen sendes som props til komponenter:

```jsx
// I page.jsx (server component)
const { data } = await fetchHomePageData();
return <ServiceInfoCard metadata={data.metadata} />;
```

**Tilgjengelige funksjoner i `@/config/readPygeoapiConfig`:**
- `getMetadata()` - Henter metadata-seksjonen (tilbyder, kontakt, lisens, nøkkelord)
- `getResources()` - Henter alle ressurser/collections
- `getCollections()` - Henter collections med id, tittel, beskrivelse, bbox
- `getCollection(id)` - Henter en spesifikk collection
- `getDatasetTitle()` - Henter datasettets tittel
- `getDatasetDescription()` - Henter datasettets beskrivelse

### Eget collection-bilde (venstre thumbnail)

Du kan sette et eget bilde per collection i `pygeoapi/pygeoapi-config.yml`:

```yaml
resources:
  kommuner:
    type: collection
    links:
      - type: image/png
        rel: preview
        href: /assets/collection-images/kommuner.png
```

- Bruk standard `links` med `rel: preview` og `type: image/*`
- Bildet må finnes inne i pygeoapi-containeren under `/pygeoapi/data` (eller path satt i `PYGEOAPI_ASSETS_ROOT`)
- Frontenden bruker dette bildet på venstre side av collection-siden
- Hvis preview-link mangler, brukes standard thumbnail som fallback

### OGC API - Maps (pygeoapi)

Backend er satt opp med OGC API - Maps for `fylker` og `kommuner` via MapScript provider:
- Konfig: `pygeoapi/pygeoapi-config.yml` (`providers: - type: map`)

Prøv f.eks. http://localhost:5001/collections/fylker/map?f=png&width=1000&height=1000&bbox=4,57,35,72&bbox-crs=http://www.opengis.net/def/crs/OGC/1.3/CRS84&crs=http://www.opengis.net/def/crs/EPSG/0/25833


### Styling (optional SLD)

Hvis du vil bruke egen stil per map-provider, sett `options.style` i `pygeoapi-config.yml`.
Stifilen må finnes inne i pygeoapi-containeren (for eksempel `/pygeoapi/styles/fylker.inc`).

Typisk oppsett:
- Legg stilfiler i `pygeoapi/mapserver/styles/`
- Referer til absolutt containersti i `options.style`
