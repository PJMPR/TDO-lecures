# Space Fleet — demo .NET + MySQL

Mała aplikacja prowadzącego do demonstracji obrazu, sieci, wolumenu, healthcheck i Docker Compose.

## Start

1. Skopiuj `.env.example` do `.env` i ustaw hasła.
2. Uruchom:

```bash
docker compose up --build -d
docker compose ps
docker compose logs -f api
```

API: `http://localhost:8080/api/spaceships`  
Health: `http://localhost:8080/health`  
OpenAPI JSON: `http://localhost:8080/openapi/v1.json`  
MySQL dla DataGrip: `localhost:3307`

## Demo bez Compose

Utwórz sieć i wolumen, uruchom MySQL poleceniem `docker run`, następnie zbuduj obraz API i uruchom go w tej samej sieci. W connection string hostem bazy musi być nazwa kontenera, nie `localhost`.

## Reset

```bash
docker compose down
docker compose down -v  # usuwa również dane demonstracyjne
```

Schemat i dwa rekordy przykładowe są tworzone przy pierwszym starcie przez Entity Framework Core.

