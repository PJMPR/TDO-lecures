# Mission Control — starter do laboratorium Kubernetes

## Otrzymanie projektu

Prowadzący udostępnia ten projekt jako assignment w Classroom50. Student powinien:

1. zaakceptować assignment za pomocą linku przekazanego przez prowadzącego,
2. poczekać na utworzenie indywidualnego repozytorium,
3. sklonować utworzone repozytorium na swój komputer,
4. wykonywać zadania i zapisywać kolejne etapy w commitach w tym repozytorium.

~~~powershell
git clone ADRES_TWOJEGO_REPOZYTORIUM
cd NAZWA_TWOJEGO_REPOZYTORIUM
git status
~~~

Nie należy tworzyć osobnego repozytorium ani kopiować projektu innego studenta.

Działająca aplikacja referencyjna składa się z trzech usług:

- **frontend** — Angular 21 zbudowany do plików statycznych i obsługiwany przez nginx,
- **api** — ASP.NET Core 10 + Entity Framework Core,
- **db** — MySQL 8.4 z trwałym wolumenem.

Projekt zawiera kompletne Dockerfile, konfigurację nginx oraz działający `compose.yaml`.
To punkt wyjścia do migracji na Kubernetes. **Starter celowo nie zawiera katalogu `k8s/`
ani gotowych manifestów Kubernetes.**

## Wymagania

- Rancher Desktop z włączonym Kubernetes,
- runtime **dockerd (moby)**,
- `docker`, `docker compose` i `kubectl`,
- .NET SDK i Node.js tylko do opcjonalnego uruchamiania testów poza kontenerami.

Sprawdź:

~~~powershell
docker version
docker compose version
kubectl config current-context
kubectl get nodes
~~~

## Architektura Compose

~~~text
przeglądarka :8088
       │
       ▼
frontend / nginx :80
       │ /api
       ▼
api / ASP.NET Core :8080
       │ ConnectionStrings__MissionDb
       ▼
db / MySQL :3306 ─── mysql-data
~~~

Tylko frontend publikuje port na hosta. API i baza komunikują się po nazwach usług
w prywatnej sieci projektu Compose.

## Uruchomienie rozwiązania bazowego

Opcjonalnie skopiuj wartości przykładowe:

~~~powershell
Copy-Item .env.example .env
~~~

Następnie:

~~~powershell
docker compose config
docker compose up --build -d
docker compose ps
docker compose logs -f
~~~

Otwórz `http://localhost:8088`. Health API jest dostępny przez frontend pod
`http://localhost:8088/health`.

Zatrzymanie bez utraty danych:

~~~powershell
docker compose down
~~~

Pełny reset danych ćwiczenia:

~~~powershell
docker compose down --volumes
~~~

Ostatnie polecenie usuwa wolumen MySQL tego projektu.

## Obrazy używane w Kubernetes

Compose buduje obrazy z tagami wymaganymi w laboratorium:

~~~powershell
docker image inspect mission-control-api:1.0.0
docker image inspect mission-control-frontend:1.0.0
~~~

Przy runtime dockerd obrazy są widoczne dla lokalnego klastra Rancher Desktop.
W manifestach laboratoryjnych użyj `imagePullPolicy: Never`, aby Kubernetes nie próbował
pobierać prywatnych obrazów z rejestru.

## Konfiguracja do przeniesienia

| Compose | Kubernetes |
|---|---|
| usługa `db` | StatefulSet lub Deployment + Service + PVC |
| usługa `api` | Deployment + ClusterIP Service |
| usługa `frontend` | Deployment + ClusterIP Service |
| port `8088:80` | Ingress lub port-forward |
| `environment` | ConfigMap i Secret |
| `healthcheck` | readinessProbe i livenessProbe |
| named volume | PersistentVolumeClaim |
| `depends_on` | sondy gotowości i odporność aplikacji na start zależności |

## Kontrakt aplikacji

- frontend: port 80,
- API: port 8080,
- health API: `GET /health`,
- endpointy CRUD: `/api/missions`,
- baza: MySQL 8.4 na porcie 3306,
- connection string: `ConnectionStrings__MissionDb`,
- nginx oczekuje API pod nazwą DNS `api`.

Nazwa Service backendu w Kubernetes powinna więc pozostać `api`, o ile nie zmienisz
również `frontend/nginx.conf`.

## Zadanie studenta

Utwórz katalog `k8s/` i przygotuj manifesty zgodnie z
[instrukcją laboratorium](../../labs/kubernetes/index.html). Nie kopiuj gotowego rozwiązania:
każdy etap ma zostać zastosowany, zweryfikowany i udokumentowany osobno.

