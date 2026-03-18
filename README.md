# OGC API front-end

### Lokal kjøring
Hele applikasjonen kan kjøres med:

```shell
cd deploy
docker compose --profile with-frontend up -d
```

Under utvikling er det digg å kjøre frontenden utenfor docker:
fra prosjektroot:
```shell
docker compose -f deploy/docker-compose.yml up -d
npm run dev
```

### Konfigurasjonsfil (pygeoapi-config.yml)

Frontenden leser per nå metadata fra pygeoapi sin YAML-konfigurasjonsfil for å vise informasjon om datasettet.

**Filplassering:**
- **I Docker:** `/volumes/pygeoapi-config.yml` (default)
- **Lokal utvikling:** Sett miljøvariabelen `PYGEOAPI_CONFIG_PATH_FRONTEND` i `.env.local`:
  ```
  PYGEOAPI_CONFIG_PATH_FRONTEND=./deploy/volumes/pygeoapi-config.yml
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
- Providerkode: `deploy/pygeoapi/postgis_mapscript.py`
- Konfig: `deploy/volumes/pygeoapi-config.yml` (`providers: - type: map`)

### Styling (optional SLD)

Hvis du vil bruke egen stil per map-provider, sett `options.style` i `pygeoapi-config.yml`.
Stifilen må finnes inne i pygeoapi-containeren (for eksempel `/pygeoapi/styles/fylker.sld`).

Typisk oppsett:
- Legg stilfiler i `deploy/pygeoapi/styles/`
- Kopier mappen i `deploy/pygeoapi/Dockerfile` (til `/pygeoapi/styles/`)
- Referer til absolutt containersti i `options.style`
