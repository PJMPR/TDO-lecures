# Mission Control — rozwiązanie laboratorium Kubernetes

Ten katalog jest kompletnym rozwiązaniem zadań z `labs/kubernetes/index.html`.
Powstał przez wykonanie instrukcji na kopii projektu startowego. Manifesty znajdują
się w katalogu `k8s/` i są numerowane w kolejności stosowania.

## Uruchomienie rozwiązania Kubernetes

Najpierw zbuduj lokalne obrazy i zwolnij port używany przez Compose:

~~~powershell
docker compose up --build -d
docker compose down
~~~

Sprawdź, czy aktywnym kontekstem jest lokalny Rancher Desktop, a następnie zastosuj
manifesty:

~~~powershell
kubectl config current-context
kubectl apply -f k8s/00-namespace.yaml
kubectl apply -f k8s/10-config.yaml
kubectl apply -f k8s/20-database.yaml
kubectl wait --for=condition=Available deployment/db -n mission-control --timeout=180s
kubectl apply -f k8s/30-api.yaml
kubectl rollout status deployment/api -n mission-control --timeout=180s
kubectl apply -f k8s/40-frontend.yaml
kubectl rollout status deployment/frontend -n mission-control --timeout=180s
kubectl apply -f k8s/50-ingress.yaml
~~~

Jeżeli Ingress nie jest dostępny, użyj przewidzianego w instrukcji planu B:

~~~powershell
kubectl port-forward -n mission-control service/frontend 8088:80
~~~

Aplikacja będzie wtedy dostępna pod `http://localhost:8088`.

## Zawartość katalogu k8s

| Plik | Zasoby |
|---|---|
| `00-namespace.yaml` | Namespace `mission-control` |
| `10-config.yaml` | ConfigMap i lokalny Secret ćwiczeniowy |
| `20-database.yaml` | PVC, Service i Deployment MySQL |
| `30-api.yaml` | Service i dwureplikowy Deployment API |
| `40-frontend.yaml` | Service i dwureplikowy Deployment frontendu |
| `50-ingress.yaml` | Traefik Ingress: `/api` i `/health` do API, `/` do frontendu |

Secret zawiera wyłącznie lokalne dane ćwiczeniowe zgodne z `compose.yaml`. Nie należy
używać tych wartości w środowisku współdzielonym ani produkcyjnym.

## Protokół wykonania instrukcji

Weryfikację wykonano 5 listopada 2026 na Rancher Desktop, Kubernetes
`v1.33.5+k3s1`, z domyślną StorageClass `local-path`.

| Zadanie | Wykonane polecenie / operacja | Oczekiwany rezultat | Zaobserwowany rezultat |
|---|---|---|---|
| 1. Compose | `docker compose up --build -d` i wywołania HTTP | trzy usługi, zdrowe API | obrazy zbudowane; `/health` i `/api/missions` zwróciły 200 |
| 2. Obrazy | `docker compose down`, kontrola lokalnych tagów | obrazy pozostają lokalnie | oba obrazy `1.0.0` zostały użyte przez klaster |
| 3. Namespace | `kubectl apply -f k8s/00-namespace.yaml` | aktywny Namespace | `mission-control` miał stan `Active` |
| 4. Konfiguracja | `kubectl apply -f k8s/10-config.yaml` | ConfigMap i Secret | oba zasoby utworzone; Secret miał trzy klucze |
| 5. Baza | apply i oczekiwanie na Deployment | Ready Pod i Bound PVC | Pod `1/1`, PVC `Bound`, Service miał endpoint 3306 |
| 6. API | apply i `rollout status` | dwie gotowe repliki | Deployment osiągnął `2/2`, Service miał dwa endpointy |
| 7. Frontend | apply, rollout i port-forward | dwie repliki, działający UI/API | Deployment `2/2`; `/health` i CRUD działały przez port 8088 |
| 8. Ingress | apply manifestu klasy Traefik | routing dla `mission.local` | lokalny, osierocony webhook nginx blokował wszystkie nowe Ingressy; użyto udokumentowanego planu B |
| 9. Trwałość | POST rekordu i dwukrotne usunięcie Poda DB | rekord pozostaje | rekord `Kubernetes Lab Verification` pozostał na PVC; pierwsze żądanie po restarcie było przejściowo 500, kolejne poprawne |
| 10. Self-healing | usunięcie Poda API i skala do 3 | odtworzenie i trzy endpointy | Pod został odtworzony, Deployment `3/3`, EndpointSlice zawierał trzy adresy |
| 11. Rollout | tag `1.1.0-broken`, następnie undo | kontrolowany błąd i rollback | `ErrImageNeverPull`, stare repliki działały, rollback zakończył się `3/3` |
| 12. Diagnostyka | get/describe/logs/events | przyczyny widoczne w Events | Events wskazały dokładnie brak obrazu i `imagePullPolicy: Never` |

### Uwaga o lokalnym Ingress

Na sprawdzanym komputerze pozostała konfiguracja walidującego webhooka nginx, lecz
usługa `ingress-nginx-controller-admission` nie istniała. API Server odrzucał przez
to każdy nowy Ingress — również należący do klasy Traefik. Nie jest to błąd manifestu
projektu. Naprawa wymaga uporządkowania globalnej instalacji kontrolera w Rancher
Desktop. Do czasu naprawy poprawnym sposobem realizacji ćwiczenia jest `port-forward`.

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

