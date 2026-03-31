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

### Konfigurasjonsfil (pygeoapi-config.yml)

Frontenden leser per nå metadata fra pygeoapi sin YAML-konfigurasjonsfil for å vise informasjon om datasettet.

**Filplassering:**
- **I Docker:** `/pygeoapi/pygeoapi-config.yml` (default)
- **Lokal utvikling:** Sett miljøvariabelen `PYGEOAPI_CONFIG_PATH_FRONTEND` i `.env.local`:
  ```
  PYGEOAPI_CONFIG_PATH_FRONTEND=./pygeoapi/pygeoapi-config.yml
  API_BASE_URL=http://localhost:5001
  API_BASE_URL_PUBLIC=http://localhost:5001
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

### OGC API - Maps (pygeoapi)

Backend er satt opp med OGC API - Maps for `fylker` og `kommuner` via en custom provider:
- Providerkode: `pygeoapi/postgis_mapscript.py`
- Konfig: `pygeoapi/pygeoapi-config.yml` (`providers: - type: map`)

Prøv f.eks. http://localhost:5001/collections/fylker/map?f=png&width=1000&height=1000&bbox=4,57,35,72&bbox-crs=http://www.opengis.net/def/crs/OGC/1.3/CRS84&crs=http://www.opengis.net/def/crs/EPSG/0/25833

OBS! Vi har modifisert pygeoapis `maps.py` for å håndtere CRS fra parameter i requesten,
dette må vi ta hensyn til ved oppgradering av pygeoapi – eller få inn endringen i en PR til pygeoapi!

```
    query_args['crs'] = (
        request.params.get('crs')
        or collection_def.get('crs', DEFAULT_CRS)
    )
```


### Styling (optional SLD)

Hvis du vil bruke egen stil per map-provider, sett `options.style` i `pygeoapi-config.yml`.
Stifilen må finnes inne i pygeoapi-containeren (for eksempel `/pygeoapi/styles/fylker.inc`).

Typisk oppsett:
- Legg stilfiler i `pygeoapi/mapserver/styles/`
- Referer til absolutt containersti i `options.style`
