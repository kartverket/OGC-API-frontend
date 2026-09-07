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

### Vector tiles med Martin

Prosjektet bruker `martin` for vektorflisservering.

- Compose-service: `martin` (port `3030:3000`)
- Konfigurasjon: `martin/martin.yaml`
- Tile-endepunkt brukt av pygeoapi: `http://martin:3000/tellekretser/{z}/{x}/{y}`

Enkel sjekk lokalt etter oppstart:

```shell
curl -I http://localhost:3030/health
```

Start martin:

```shell
docker compose -f dev/docker-compose.yml up -d martin
```

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
