# Docker Lab Starter

Projekt do laboratorium: Angular + Spring Boot + PostgreSQL.

## Cel

Kod aplikacji jest gotowy. Twoim zadaniem jest utworzenie Dockerfile dla obu aplikacji, uruchomienie wszystkich komponentów osobno, a następnie przygotowanie pliku `compose.yaml`.

## Moduły

- `backend/` — REST API, Java 21, Spring Boot i Maven
- `frontend/` — Angular, wywołuje względną ścieżkę `/api`
- `docs/` — kontrakt API oraz szkielety konfiguracji

## Konfiguracja backendu

| Zmienna | Domyślna wartość |
|---|---|
| `DB_URL` | `jdbc:postgresql://localhost:5432/mission_control` |
| `DB_USERNAME` | `mission` |
| `DB_PASSWORD` | `mission` |
| `ALLOWED_ORIGINS` | `http://localhost:4200,http://localhost:8081` |

Swagger: `http://localhost:8080/swagger-ui.html`  
Health: `http://localhost:8080/actuator/health`

## Ważne

Repozytorium startowe celowo nie zawiera Dockerfile ani Compose. Pliki w `docs/mockups` są tylko szkieletami.

Przy konteneryzacji frontendu utwórz plik `frontend/nginx.conf` na podstawie
`docs/mockups/nginx.conf.mockup`. Istniejący `frontend/proxy.conf.json` służy wyłącznie
lokalnemu serwerowi `ng serve` i nie jest konfiguracją nginx.
