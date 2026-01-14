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