# Kontrakt API

Base URL: `/api/missions`

| Metoda | Ścieżka | Rezultat |
|---|---|---|
| `GET` | `/api/missions` | `200`, lista misji uporządkowana według ID |
| `GET` | `/api/missions/{id}` | `200`, pojedyncza misja; `404`, jeśli nie istnieje |
| `POST` | `/api/missions` | `201`, utworzona misja i nagłówek `Location` |
| `PUT` | `/api/missions/{id}` | `200`, zmieniona misja; `404`, jeśli nie istnieje |
| `DELETE` | `/api/missions/{id}` | `204`; `404`, jeśli misja nie istnieje |

Body dla `POST` i `PUT`:

```json
{"name":"Lunar Gateway","status":"READY","launchDate":"2027-11-04"}
```

- `name`: wymagane, nie może składać się wyłącznie z białych znaków, maksymalnie 120 znaków.
- `status`: `PLANNED`, `READY`, `ACTIVE` lub `COMPLETED`.
- `launchDate`: data w formacie `YYYY-MM-DD` albo `null`; `null` w `PUT` usuwa wcześniejszą datę.
- `id`: nadawany przez bazę; klient nie przekazuje go w body.
- Niepoprawne dane zwracają `400` i `application/problem+json` z błędami pól w `errors`; odrzucona aktualizacja nie zmienia danych.

Przy starcie API tworzy brakujący schemat, a jeśli tabela misji jest pusta,
uzupełnia ją przykładami Orbital Relay i Europa Survey.
`EnsureCreated` służy temu niewielkiemu ćwiczeniu; nie zastępuje migracji schematu produkcyjnej aplikacji.

Healthcheck z kontrolą połączenia z MySQL: `GET /health`.
Kontrakt OpenAPI: `GET /openapi/v1.json`.
