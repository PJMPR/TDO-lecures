# Mission Control — starter do laboratorium CI

Aplikacja .NET + Angular z bazą MySQL i gotowymi testami. Zadaniem studenta jest
wygenerowanie lockfiles, utworzenie workflow GitHub Actions od zera, dodanie cache zależności
i zabezpieczenie repozytorium.
Nie trzeba pisać testów ani konfigurować frameworków testowych.

Wersja z zajęć nr 1 (Spring Boot + PostgreSQL) jest zachowana pod tagiem `Z1` w repozytorium
materiałów kursu. Tag nie jest automatycznie kopiowany do nowych repozytoriów GitHub Classroom.

## Wymagania

- .NET SDK 10.0.401 lub nowsza poprawka w tej samej serii 10.0.4xx; wersję określa `global.json`.
- Node.js 26.1.0 i npm; wersję Node określa `.nvmrc`.
- Git i działający Docker Engine z obsługą kontenerów Linux.
- Dla Rancher Desktop: silnik **dockerd (moby)**, nie containerd. Kubernetes nie jest potrzebny.
- Internet do pobrania paczek i obrazów przy pierwszym uruchomieniu.

Testy backendu korzystają z Testcontainers: same uruchamiają odizolowany MySQL 8.4 na losowym
porcie i usuwają go po zakończeniu. Nie wymagają własnej bazy, `.env` ani prawdziwych sekretów.
Pierwsze uruchomienie może potrwać dłużej przez pobieranie obrazów. Brak działającego Dockera
powoduje błąd testów, nie ich pominięcie.

## Moduły

- `backend/` — ASP.NET Core 10, Entity Framework Core, REST API misji.
- `backend.tests/` — testy HTTP API: CRUD, walidacja, daty, brakujące rekordy, healthcheck i OpenAPI.
- `frontend/` — Angular 21; testy interfejsu z symulowanymi odpowiedziami HTTP, bez uruchamiania API.
- `MissionControl.slnx` — rozwiązanie zawierające API i jego testy.
- `docs/api.md` — kontrakt API.

## Model pracy

- Stabilny `main`, krótkie gałęzie `feature/*` i PR-y kierowane do main — lekki model w duchu GitHub Flow.
- Jedna niezależna zmiana na gałąź; CI i review przed scaleniem, potem usunięcie zakończonej gałęzi.
- Nie tworzymy `develop`, `release/*` ani osobnego procesu Git Flow na potrzeby tego ćwiczenia.
- Filtr `pull_request.branches` dotyczy main jako bazy PR-a, a nie nazwy gałęzi feature.

## 1. Sprawdzenie środowiska

Polecenia wykonuj w katalogu tego startera:

```bash
dotnet --version
node --version
npm --version
docker version
docker info
```

`docker version` musi pokazać klienta i działający serwer.
`NuGet.Config` wskazuje publiczny rejestr NuGet, niezależnie od prywatnych źródeł skonfigurowanych na komputerze.

## 2. Wygenerowanie lockfiles — zadanie studenta

Starter celowo nie zawiera `packages.lock.json` ani `package-lock.json`.
Nie dodawaj ich do `.gitignore`; są częścią rozwiązania, w przeciwieństwie do `bin`, `obj` i `node_modules`.

```bash
dotnet restore MissionControl.slnx --use-lock-file
cd frontend
npm install
cd ..
```

Powstaną trzy pliki: `backend/packages.lock.json`, `backend.tests/packages.lock.json`
oraz `frontend/package-lock.json`. Dodaj je do Gita i zapisz w commicie.

## 3. Powtarzalny build i gotowe testy

Po wygenerowaniu lockfiles:

```bash
dotnet restore MissionControl.slnx --locked-mode
dotnet build MissionControl.slnx --configuration Release
dotnet test MissionControl.slnx --configuration Release
cd frontend
npm ci
npm run build
npm test
cd ..
```

Raporty: `TestResults/backend.trx`, `frontend/test-results/junit.xml`
i `frontend/test-results/results.json`. To pliki wynikowe do udostępnienia jako artefakty CI,
nie do commitowania. Nieudany test musi zachować niezerowy kod zakończenia.
Projekt testowy wskazuje `backend.tests/test.runsettings` przez `RunSettingsFilePath`.
Plik ustawia logger TRX i katalog wyników względem swojego położenia, więc zwykłe
`dotnet test MissionControl.slnx --configuration Release` zapisuje raport bez dodatkowych flag.
Gotowe zestawy obejmują 19 testów backendu i 11 testów frontendu.

W CI najpierw sprawdź obecność **wszystkich trzech** lockfiles, następnie użyj `npm ci`
i `dotnet restore --locked-mode`. CI nie może generować brakujących lockfiles ani aktualizować ich za studenta.
GitHub Actions ustawia zmienną środowiskową `CI=true`. Wtedy `Directory.Build.props`
włącza `RestoreLockedMode` także dla implicit restore wykonywanego przez zwykłe `dotnet build`
i `dotnet test`; nie trzeba dopisywać `--no-restore` ani `--no-build`.
`Directory.Build.targets` dodatkowo przerywa restore/build, jeśli projektowi brakuje
`packages.lock.json`, zamiast pozwolić NuGetowi utworzyć go w CI.
Przy odtwarzaniu CI lokalnie lub w innym systemie ustaw `CI=true`; bez tej zmiennej
początkowe `dotnet restore --use-lock-file` pozostaje zadaniem studenta.
Kontrola w MSBuild dotyczy tylko projektów .NET — workflow nadal musi sprawdzać także
`frontend/package-lock.json` przed instalacją i odczytem cache.
Job backendu musi mieć dostęp do działającego Dockera; wystarczy standardowy runner GitHub-hosted Ubuntu.
Testcontainers zarządza MySQL, więc nie trzeba dodatkowo deklarować serwisu MySQL w workflow.

Zmiana deklaracji zależności wymaga świadomego ponownego wygenerowania lockfiles,
przejrzenia różnic i commita. Zmiana zależności bez aktualizacji lockfile powinna dać czerwone CI.

### Kolejny etap: cache zależności

Najpierw doprowadź workflow do zielonego wyniku bez cache. Dopiero wtedy porównuj optymalizację:

- Cache pobranych paczek npm lub NuGet; nie zapisuj `node_modules`, `bin`, `obj` ani raportów testów.
- Sprawdź lockfiles **przed** utworzeniem klucza; uwzględnij runtime, system/architekturę i hash zależności.
- Wybierz `actions/cache` albo cache udostępniany przez `setup-node`/`setup-dotnet`, bez podwójnego cache tej samej ścieżki.
- Wykonaj dwa uruchomienia tego samego kodu i porównaj logi, `cache-hit` oraz czas instalacji.
- Zmień zależność wraz z lockfile, sprawdź nowy klucz i uruchomienie z zimnym cache.
- Nie pomijaj `npm ci`, `dotnet restore --locked-mode`, buildu ani testów po cache hit.

`cache-hit` jest tekstowym outputem action; dokładne trafienie sprawdzaj przez porównanie z `'true'`.
Cache może zniknąć lub być niedostępny — aplikacja musi się budować i przechodzić testy również bez niego.
Nie zapisuj sekretów, `.env`, `.npmrc` ani konfiguracji prywatnych rejestrów w cache.

### Rozszerzenie: reużywanie

Wydziel powtarzalne kroki do composite action albo cały job do reusable workflow.
Composite action wywołujesz w `steps`, reusable workflow w `jobs.<id>.uses`.
Zdefiniuj potrzebne inputs i outputs oraz sprawdź, czy błąd nadal daje czerwone CI.
Nie dodawaj sekretów, jeśli wydzielony proces ich nie potrzebuje.

## 4. Uruchomienie aplikacji do demonstracji

Testy nie wymagają tych kroków. Do korzystania z aplikacji w przeglądarce potrzebna jest osobna baza.

Uruchom demonstracyjny MySQL, publikując port tylko na interfejsie lokalnym:

```bash
docker run -d --name mission-control-lab-db -p 127.0.0.1:3307:3306 -e MYSQL_DATABASE=mission_control -e MYSQL_USER=mission -e MYSQL_PASSWORD=mission-local-password -e MYSQL_ROOT_PASSWORD=mission-local-root-password mysql:8.4
docker logs mission-control-lab-db
```

Poczekaj, aż baza będzie gotowa do połączeń. Podane hasła są wyłącznie przykładowymi
danymi do lokalnego ćwiczenia — nie używaj ich w innych środowiskach.

W PowerShellu:

```powershell
$env:ConnectionStrings__MissionDb = "Server=localhost;Port=3307;Database=mission_control;User=mission;Password=mission-local-password"
dotnet run --project backend --no-restore --urls http://localhost:8080
```

W Bash:

```bash
export ConnectionStrings__MissionDb='Server=localhost;Port=3307;Database=mission_control;User=mission;Password=mission-local-password'
dotnet run --project backend --no-restore --urls http://localhost:8080
```

W drugim terminalu, z katalogu startera:

```bash
cd frontend
npm start
```

Frontend: `http://localhost:4200`. API: `http://localhost:8080/api/missions`.
Health: `http://localhost:8080/health`. OpenAPI JSON: `http://localhost:8080/openapi/v1.json`.
Angular przekazuje `/api` do backendu przez proxy. Backend nie odczytuje automatycznie pliku `.env`;
połączenie przekazujesz przez konfigurację `ConnectionStrings__MissionDb`.

Po zatrzymaniu API i frontendu usuń wyłącznie własny kontener demonstracyjny:

```bash
docker stop mission-control-lab-db
docker rm mission-control-lab-db
```

## Zakres zadania CI

- Utwórz `.github/workflows/ci.yml` od pustego pliku.
- Dodaj uruchamianie dla PR-ów i zmian gałęzi głównej, osobne jobs backendu i frontendu, locked restore, build oraz testy.
- Zapisz raporty także przy niepowodzeniu testów, nie ukrywając błędu CI.
- Wprowadź kontrolowaną regresję, np. usuń walidację pustej nazwy, zobacz czerwone CI i popraw kod.
- Sprawdź niezgodność deklaracji zależności z lockfile i jej naprawę.
- Dodaj i zmierz cache zależności, zachowując poprawny build oraz testy także po cache miss.
- W wariancie rozszerzonym wydziel composite action lub reusable workflow, bez zmiany semantyki sprawdzeń.
- Skonfiguruj wymagane PR-y i checks oraz minimalne uprawnienia workflow; potrzebne uprawnienia do ochrony gałęzi ustal z prowadzącym.
- Nie dodawaj prawdziwych sekretów do kodu, logów ani historii Gita.

Starter nie zawiera gotowego workflow CI, composite action, reusable workflow, Dockerfile ani Compose.
Szkielety w `docs/mockups` są opcjonalnym materiałem do konteneryzacji obecnego wariantu .NET + MySQL,
a nie rozwiązaniem zadania CI.
