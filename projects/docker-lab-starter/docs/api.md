# Kontrakt API

Base URL: `/api/missions`

- `GET /` — lista misji
- `GET /{id}` — pojedyncza misja
- `POST /` — nowa misja
- `PUT /{id}` — zmiana misji
- `DELETE /{id}` — usunięcie misji

Przykładowe body:

```json
{"name":"Lunar Gateway","status":"READY","launchDate":"2027-11-04"}
```

