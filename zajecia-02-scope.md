# Zajęcia nr 2 — CI i SDLC

- Materiały: [wykład podzielony na sekcje](lectures/ci/index.html) i osobna [instrukcja laboratorium 02](labs/ci/index.html).
- Podstawa: sylabus — „Podstawy CI i SDLC” oraz konfiguracja CI i zabezpieczenie repozytorium.
- Organizacja: rdzeń i moduły rozszerzające do pracy w kolejnych blokach; pełny bank nie mieści się w jednym wykładzie 90-minutowym.
- Laboratorium ma jedną progresję 23 zadań. Macierze statyczna i dynamiczna są jej finałem, po ćwiczeniu LaTeX i wydań PDF.

## Wykład — podstawy CI i SDLC

### Kontekst: po co uruchamiamy CI

- SDLC: wymagania, projektowanie, implementacja, testowanie, wydanie, utrzymanie i informacja zwrotna.
- Miejsce CI w SDLC: automatyczna weryfikacja każdej zmiany i skracanie czasu uzyskania informacji zwrotnej.
- Continuous Integration jako praktyka pracy zespołu, a nie tylko narzędzie lub plik YAML.
- Małe zmiany, częsta integracja, krótkotrwałe gałęzie i utrzymywanie działającej gałęzi głównej.
- Przepływ zmiany: zadanie → gałąź → commit → pull request → CI → code review → merge.
- CI a CD: różnica odpowiedzialności; poprawny build nie oznacza wdrożenia aplikacji.

### Wprowadzenie do strategii gałęzi

- Strategia jako umowa zespołu: stabilna gałąź, początek i cel zmiany, warunki scalenia, wydania i pilne poprawki.
- Prosty układ `main` + krótkie `feature/*`: diagram historii, utworzenie gałęzi, commit, push, PR do main, CI, review i zakończenie pracy.
- GitHub Flow jako lekki proces wykorzystujący podobną topologię; draft PR, kolejne poprawki i usuwanie zakończonych gałęzi.
- Git Flow: role `main`, `develop`, `feature/*`, `release/*` i `hotfix/*`; diagram feature → develop → release → main oraz synchronizacja poprawek.
- Hotfix wydanej wersji bez wydawania niestabilnego develop; przeniesienie poprawki do przyszłej wersji i uwzględnienie aktywnego release.
- Porównanie zastosowań i kosztów: częsta integracja kontra osobna stabilizacja wersjonowanych wydań; Git Flow nie jest obowiązkowym standardem.
- Strategia a CI: gałąź docelowa PR-a, ochrona main/develop/release i właściwe filtry zdarzeń.
- Na laboratorium przyjmujemy main + krótkie gałęzie zmian i PR-y w duchu GitHub Flow; nie dodajemy develop ani release bez potrzeby.

### GitHub Actions: tworzenie workflow od zera

- Punkt wyjścia: puste repozytorium lub projekt bez CI; gdzie umieścić `.github/workflows/ci.yml` i jak GitHub wykrywa workflow.
- Składnia YAML potrzebna do samodzielnej pracy: mapy, listy, wcięcia, cytowanie tekstu, komentarze, wartości logiczne i wieloliniowe polecenia.
- Poziomy workflow, job i step; dozwolone klucze na każdym poziomie oraz różnica między poprawnym YAML a poprawnym workflow Actions.
- Identyfikatory workflow, jobs i steps a wyświetlane nazwy; `run-name`, `defaults.run`, `shell` i nadpisywanie katalogu roboczego.
- Osobna anatomia pól: `permissions`, `run-name`, `name`, deklaracje `inputs`, mapa `jobs`, wybór `runs-on`, `strategy.matrix` oraz `defaults.run`, z pełnym przykładem ich współdziałania.
- Zakresy i nadpisywanie: workflow/job/step, reset niewymienionych permissions, konteksty dozwolone w run-name, typy dispatch/call inputs oraz defaults dotyczące wyłącznie run.
- Model wykonania: zdarzenie → workflow run → jobs → steps; rozróżnienie workflow, action i pojedynczego uruchomienia.
- Osobna mapa pojęć: run step i uses step, typy implementacji action (JavaScript, Docker, composite), zwykły/reusable workflow oraz matrix jako strategia powielania jobs.
- Granice runtime, workspace i odpowiedzialności; action nie jest jobem, Docker action nie jest kontenerem całego joba, a reusable workflow nie jest wywołaniem step.
- Przykłady metadata `runs.using`, miejsc wywołania i mały matrix 2 × 2; bez przenoszenia linuksowych testów MySQL na nieobsługiwany runner.
- Pierwszy kompletny workflow: `name`, `on`, `jobs`, identyfikator zadania, `runs-on`, `steps` i proste polecenie `run`.
- Zapisanie konfiguracji, commit i push; odnalezienie pierwszego uruchomienia w zakładce Actions i odczytanie logu kroku.
- Zdarzenia `push`, `pull_request` i `workflow_dispatch`; dobór zdarzenia do celu oraz wymóg obecności workflow w gałęzi domyślnej przy ręcznym uruchamianiu.
- Pełny przegląd triggerów: PR kontra uprzywilejowany kontekst PR target, push gałęzi/tagów, schedule/cron/timezone, ręczny dispatch i workflow_call.
- Skip przez komunikat commita dla push/PR: obsługiwane znaczniki, brak wpływu na PR target/schedule/dispatch oraz ryzyko brakującego wymaganego checka.
- Filtrowanie gałęzi i ścieżek; znaczenie filtra gałęzi docelowej dla PR-a oraz ryzyko pominięcia workflow wymaganego do merge.
- Osobne filtry ścieżek frontendu/backendu i współdzielonej konfiguracji; paths filtruje zmiany w repo, nie inputs.
- Wariant dwóch opcjonalnych workflow z osobnymi paths oraz jawną wspólną `name: required` w jobs; reguła wybiera rzeczywistą nazwę checka, nie sam job ID.
- Zweryfikowana próba bez bypass, także dla administratora: 0 workflow → BLOCKED; 1 udany → CLEAN; 2 z success + in progress → BLOCKED; 2 sukcesy → CLEAN; success + failure → BLOCKED. Pierwszy sukces nie przykrywa trwającego ani nieudanego drugiego joba.
- Pułapka zerowego pokrycia paths: brak wymaganego wyniku. Trzeba zapewnić zawsze uruchamiane sprawdzenie lub przejść na unikalny gate, nie używać force merge jako dowodu poprawności. Wynik wariantu należy sprawdzić dla rzeczywistych nazw i bieżącego SHA we własnym repozytorium.
- Bezpieczna alternatywa: caller bez paths, detekcja zmian, warunkowe jobs/reusable workflows i jeden jednoznaczny gate oceniający sukces wszystkich istotnych części.
- Runner jako środowisko wykonania: wybór systemu, dostępne narzędzia i brak współdzielonego katalogu roboczego między jobs.
- Pobranie kodu przez checkout: dlaczego runner nie ma automatycznie plików repozytorium i jaki kod sprawdzamy przy uruchomieniu dla PR-a.
- `uses` a `run`: wykorzystanie gotowej action, jej parametry `with`, wybór wersji i przypinanie zewnętrznych actions do commit SHA.
- Przygotowanie .NET SDK i Node.js, instalacja zależności i powtarzalność budowania; deklaracje zależności a lockfiles zapisujące rozwiązane wersje zależności bezpośrednich i przechodnich.
- Generowanie i aktualizowanie lockfiles jako świadoma zmiana w repozytorium; różnica między pierwszym restore/install a odtwarzaniem zależności w CI w trybie zablokowanym.
- Dodawanie kroków buildu i testów; `working-directory`, wybór powłoki oraz tryb nieinteraktywny i headless dla testów.
- Kody zakończenia poleceń i propagacja błędu do statusu kroku, zadania i workflow; dlaczego nie maskujemy błędów testów.
- Zmienne `env`, konfiguracja `vars`, sekrety `secrets` i konteksty, np. `github`; podstawy wyrażeń `${{ ... }}`.
- Przekazywanie wartości między krokami przez `GITHUB_ENV` i `GITHUB_OUTPUT`; różnica między zmienną środowiskową a outputem kroku.
- Podział na jobs: kolejność kroków, równoległe zadania i zależności `needs`; osobna weryfikacja backendu i frontendu.
- Warunki `if`, domyślne pomijanie kolejnych kroków po błędzie i użycie `always()` do zebrania raportów bez ukrywania niepowodzenia CI.
- Raporty testów i pliki wynikowe jako artefakty workflow; pobieranie wyników oraz rozróżnienie artefaktu CI, publikacji w rejestrze i wdrożenia.
- Diagnostyka: niepoprawny YAML, niewłaściwy katalog, brak narzędzia, błąd zależności, kompilacji lub testu; ponowne uruchomienie a poprawka przez nowy commit.
- Powiązanie nazw jobs ze status checks w PR-ze; zielony workflow potwierdza tylko to, co rzeczywiście skonfigurowaliśmy do sprawdzania.

### Konteksty i GitHub expressions

- Trzy etapy interpretacji: YAML, planowanie i wyrażenia GitHub Actions, a następnie powłoka na runnerze; `${{ ... }}` nie jest składnią Bash ani JavaScript.
- Mapa kontekstów: `github`, `env`, `vars`, `secrets`, `inputs`, `runner`, `job`, `steps`, `needs`, `jobs`, `matrix` i `strategy`.
- Dostępność zależna od miejsca i czasu: `jobs.<id>.if` przed przydzieleniem runnera, outputy zakończonych kroków, jawne zależności `needs` i kontekst `jobs` przy outputach reusable workflow.
- `github.ref`, `ref_name`, `sha`, `head_ref`, `base_ref` i payload zdarzenia; różnice między push a PR-em oraz merge ref a gałęzią autora.
- Odczyt właściwości przez kropkę i indeks; brakująca właściwość jako pusty tekst, a nie gwarantowany błąd konfiguracji.
- Pierwszeństwo `env` na poziomie workflow, joba i kroku; zmienne środowiskowe runnera a konteksty oraz przekazywanie wartości do kolejnych kroków.
- Literały, operatory, porównania, cytowanie tekstu w wyrażeniach i konwersje typów; pułapki tekstów `'false'`, `'0'` i outputów kroków.
- Funkcje tekstowe i kolekcje: `contains`, `startsWith`, `endsWith`, `format` i `join`, z przykładami wyników i zasadami cytowania klamer.
- `toJSON`, `fromJSON` i `hashFiles`: typy danych, serializacja, odciski wielu plików oraz jawna obsługa braku danych; bez dumpowania całych kontekstów.
- Nowa funkcja `case`: uporządkowane pary warunek/wartość, końcowy default, zachowanie false/0/pustego tekstu oraz różnica względem `A && B || C`.
- Kompletny mały workflow z asercjami wartości wybranych przez `case`; rozdzielenie oceny wyrażenia GitHub od wykonania Bash.
- Warunki `if`, domyślne `success()`, `failure()`, `cancelled()`, `always()` oraz pułapki skrótu `A && B || C`.
- Ograniczenia użycia expressions w poszczególnych polach; statyczne referencje `uses`, a dynamiczne wartości przekazywane przez `with`.

### Gdy expressions nie wystarczają — Bash i github-script

- Dobór mechanizmu: expression do warunków i wartości, Bash do CLI/plików, github-script do API i logiki na danych, osobny plik do rosnącej lub współdzielonej logiki.
- Inline Bash: `run: |`, jawny `shell`, przekazywanie danych przez `env`, cytowanie, zmienne, pętle i walidacja kilku lockfiles.
- Kody zakończenia, `-e`, `pipefail`, opcjonalne `set -u`, pipeline z `tee` oraz wyjątki od automatycznego fail-fast; brak maskowania błędów testów.
- `actions/github-script`: ciało funkcji async, wstrzyknięte `github`, `context`, `core`, runtime action a runtime aplikacji i domyślny GITHUB_TOKEN.
- Odczyt plików PR-a przez Octokit i paginację, minimalne uprawnienia, outputs i kodowanie wyniku; return false nie jest błędem kroku.
- Operacje zapisu, np. komentarz do PR-a: osobny job, ograniczony token, ograniczenia forków i unikanie powielania komentarzy przy rerun.
- Bezpieczne dane wejściowe w Bash i JavaScript; brak interpolacji niezaufanego tekstu do kodu, brak dumpów tokenów i brak uprzywilejowanego obejścia przez pull_request_target.
- Wydzielenie skryptu Bash lub modułu CommonJS do repozytorium: checkout, jawne zależności, await oraz różnica względem composite/reusable.

### Inputs i outputs na granicach wykonania

- Typowane deklaracje inputs tylko w workflow_dispatch/workflow_call; inputs akcji, outputs oraz env przekazują tekst.
- Rozróżnienie tekstowego kanału od typów wewnątrz expressions/JavaScript; jawne fromJSON/JSON.parse i walidacja formatu oraz schematu.
- Step → step: id producenta, GITHUB_OUTPUT i jawne mapowanie do env/with konsumenta.
- Step → job → needs: obowiązkowe wystawienie job outputu, bez automatycznego współdzielenia plików i zmiennych.
- Composite: with → inputs, wewnętrzny step → metadata outputs.value → steps callera; oddzielne zakresy id.
- Reusable workflow: typowane wejście i wyjściowy łańcuch step → job → workflow_call.outputs → needs callera.
- Konwersja stringa outputu do wymaganego boolean/number przy wywołaniu workflow_call.
- Niezależne workflows/runs: brak globalnych outputs/needs, jawny artefakt i id run producenta, token, kontrola źródła i granicy zaufania.
- Sekrety nie są metadanymi do publikowania w outputs lub artefaktach; brak wykonywania niezaufanego kodu pobranego jako wynik innego workflow.

### Referencje do akcji i reużywanie automatyzacji

- `owner/repo@ref`, `owner/repo/path@ref`, lokalna ścieżka `./...` i `docker://...`; folder akcji i plik metadata `action.yml`.
- Gałąź, tag główny, tag wydania i pełny SHA; mutowalność referencji, weryfikacja autora, pinning i świadome aktualizacje.
- Rozróżnienie `uses: ...@ref`, `checkout.with.ref`, `github.ref` oraz wersji narzędzia instalowanego przez action.
- Composite action: `inputs`, `outputs`, `runs.using: composite`, kroki `run`/`uses`, wymagany `shell` i jawna walidacja wymaganych danych.
- Wywołanie composite action w kroku po checkout; wspólny runner i workspace, outputy, `github.action_path` i jawne przekazywanie potrzebnych sekretów.
- Reusable workflow: `on.workflow_call`, typowane inputs, deklaracje secrets i outputs, własne jobs oraz wywołanie na poziomie `jobs.<id>.uses`.
- Caller a callee: kod pobierany z repozytorium wywołującego, uprawnienia, jawne przekazywanie sekretów, brak automatycznego dziedziczenia workflow `env`.
- Łańcuch outputów: step → job → reusable workflow → `needs` w callerze; output ścieżki nie przesyła pliku między runnerami.
- Porównanie composite action i reusable workflow: zakres reużycia, miejsce wywołania, runner, interfejs, sekrety i koszt utrzymania.

### Cache zależności jako część CI

- Podstawowy cache npm i NuGet omawiamy na zajęciach nr 2, obok lockfiles i powtarzalnego buildu, zamiast odkładać jego wprowadzenie do rejestrów paczek.
- Cache a artefakt: przyspieszenie kolejnego uruchomienia kontra raport lub PDF przeznaczony do pobrania.
- Cykl `actions/cache`: restore przed instalacją, exact hit, odtworzenie po prefiksie, miss i zapis po udanym jobie; nowa zawartość wymaga nowego klucza.
- Projektowanie `key` i `restore-keys`: namespace, system, architektura, runtime i hash lockfiles; brak pliku a pusty wynik `hashFiles`.
- Cache pobranych paczek npm i NuGet, nie `node_modules`, `bin`, `obj`, raportów czy sekretów.
- `cache-hit` jako tekst: porównanie z `'true'`; odtworzenie cache nie zastępuje `npm ci`, locked restore, buildu ani testów.
- Ręczna konfiguracja `actions/cache` a wygodny cache w `setup-node` i `setup-dotnet`; jeden właściciel cache dla danej ścieżki.
- Granice zaufania, dostęp PR-ów i forków, ryzyko cache poisoning oraz rozdzielenie cache access od `permissions`.
- Weryfikacja optymalizacji: dwa uruchomienia, zmiana lockfile i zimny build; mierzymy wynik, nie zakładamy gwarantowanego przyspieszenia.

### Kontrola jakości i bezpieczeństwo

- Rodzaje testów: jednostkowe, integracyjne i end-to-end; krótki przegląd ich roli i kosztu, bez nauki frameworków testowych.
- Quality gates: wymagane status checks, wymagane PR-y, code review i blokowanie merge przy niespełnionych warunkach.
- Status checks GitHub: commit statuses kontra check runs, status kontra conclusion, wynik per SHA, required/optional oraz skipped/neutral kontra brak uruchomienia i Expected/Pending.
- Granice zaufania w CI: kod z PR-a, uprawnienia `GITHUB_TOKEN`, konfiguracja `permissions` i zasada najmniejszych uprawnień.
- Ochrona sekretów: konfiguracja poza kodem, GitHub Actions Secrets, ryzyko wycieku w logach i ograniczenia dla PR-ów z forków.

### Przegląd innych systemów CI

- GitHub Actions, GitLab CI/CD, Jenkins i Azure Pipelines: typowe zastosowania i integracja z repozytorium.
- Wspólne pojęcia mimo różnic narzędzi: zdarzenia, zadania, runner lub agent, logi, statusy i artefakty.
- Kryteria wyboru: usługa zarządzana a własna infrastruktura, utrzymanie, uprawnienia i ekosystem integracji; bez nauki kolejnych składni konfiguracji.

### Use case'y: CI nie tylko dla aplikacji

- Aplikacja: build i testy jako warunek scalenia PR-a; powiązanie z zadaniem laboratoryjnym.
- Praca dyplomowa w LaTeX jako główny przykład poza aplikacją: rzeczywisty szablon [pantadeusz/pjatk_latex](https://github.com/pantadeusz/pjatk_latex), wersjonowanie źródeł, kompilacja w ustalonym środowisku oraz PDF do oceny przez promotora.
- LaTeX: demonstracja poprawnego i błędnego buildu; rozróżnienie błędów kompilacji od ostrzeżeń o brakujących cytowaniach i odwołaniach.
- GitHub Releases: prerelease PDF z TeX-only PR-a z tego repozytorium i pełne wydanie PDF po push/main, z unikalnymi tagami i assetami. Najpierw bootstrap workflow na main; PR zmieniający workflow jest artefakt-only. To wydanie dokumentu, nie wdrożenie aplikacji.
- Oddzielny job kompilacji bez sekretów i praw zapisu; publikacja tylko dla dozwolonego zdarzenia. Fork PR może kompilować, ale nie publikować wydania.
- Krótkie przykłady dodatkowe: weryfikacja linków i budowanie dokumentacji oraz wykonanie notebooka lub skryptu generującego raport.

## Laboratorium — workflow CI i ochrona repozytorium

### Przygotowanie w domu i dostęp do platformy

- Konto GitHub i własne **publiczne repozytorium** z włączonym Actions; właściciel/admin może zarządzać rulesets, variables i secrets. W Classroom/organizacji potrzebne uprawnienia zapewnia prowadzący.
- Standardowe GitHub-hosted Actions compute jest bezpłatne dla repozytoriów publicznych, bez stałego przydziału darmowych minut. Większe runnery i storage mają osobne zasady/limity; prywatny miesięczny przydział zależy od planu.
- Git, edytor z pomocą dla YAML/Actions (VS Code lub JetBrains), SDK z `global.json`, Node z `.nvmrc` i npm oraz Docker Linux Engine. Rancher Desktop używa dockerd/moby; `gh` lokalnie jest opcjonalny.
- Kontrole wersji, dostępności serwera Docker i próbny kontener przed zajęciami. Lokalne polecenia build/test są opisane w instrukcji, nie rozproszone po wykładzie.
- Środowisko TeX można przygotować wyłącznie na runnerze; lokalna instalacja nie jest warunkiem rozpoczęcia zajęć.

### Materiał startowy i rozdzielenie publikacji

- [Starter Mission Control](projects/docker-lab-starter/README.md): .NET 10, Angular 21/Vitest i MySQL 8.4 przez Testcontainers. Testy są gotowe, prawdziwe sekrety ani własna baza nie są potrzebne.
- Rozwiązanie `MissionControl.slnx`, proste `dotnet build --configuration Release` i `dotnet test --configuration Release`, domyślne raporty oraz locked restore również przy zwykłym build/test w CI.
- Bez gotowego workflow, composite/reusable, Dockerfile/Compose aplikacji, lokalnych zależności, raportów i lockfiles rozwiązania. Studenci nie piszą frameworków ani testów od zera.
- Student generuje i commituje trzy lockfiles: `backend/packages.lock.json`, `backend.tests/packages.lock.json`, `frontend/package-lock.json`. Nie są ignorowane przez Git.
- Punktem startowym jest [archiwum czystego startera](assets/downloads/z2-ci-starter.zip), importowane do nowego publicznego repozytorium bez historii prowadzącego. Alternatywą jest publiczny template/Classroom od prowadzącego. Po zmianach startera należy odświeżyć archiwum; prywatnej gałęzi nie da się po prostu sforkować publicznie.
- Publiczny materiał nie zawiera linków do prywatnego rozwiązania ani jego historii. Rozwiązanie prowadzącego pozostaje oddzielnie, a publikacja kursu następuje po przeglądzie.
- Wszystkie wykonywalne zadania korzystają ze standardowego runnera `ubuntu-24.04`. Przed udostępnieniem startera sprawdzenie na nim czystego generowania lockfiles, locked restore, buildu, testów i domyślnych raportów.

### Jedna progresja zadań

Każde zadanie w instrukcji zawiera „Zrób”, „Czego się uczysz” i obserwowalne „Sprawdź”,
a przy nowym narzędziu także wymagania. Krótkie fragmenty i zwijane podpowiedzi pomagają
zbudować własny workflow; nie są kompletnym rozwiązaniem do skopiowania.

**Rdzeń — zadania 1–13**

1. Pierwszy push: `.github/workflows/ci.yml`, jeden job `ubuntu-24.04`, dwa nazwane kroki run i odczyt logów.
2. Checkout, setup-dotnet/setup-node według plików projektu, kontrola plików i wersji na runnerze.
3. Feature branch, PR do main i push/main jako różne zdarzenia; review, merge i nowy run po integracji.
4. Ręczny dispatch: typed choice konfiguracji i boolean diagnostyki, run-name, if i env; najpierw merge definicji do gałęzi domyślnej, potem formularz.
5. Kontrolowany błąd, workflow commands/annotations, kod zakończenia i naprawa przez commit bez maskowania błędu.
6. Wygenerowanie trzech lockfiles, lokalny locked restore, build i komplet gotowych testów; commit plików zależności.
7. Backend: weryfikacja lockfiles, standardowy `ubuntu-24.04`/Docker, locked restore, build/test i Testcontainers bez własnych sekretów.
8. Frontend: osobny niezależny job, ponowny checkout/SDK, npm ci/build/test, właściwy working-directory i widoczna równoległość.
9. Regresja w aplikacji przy niezmienionych testach oraz osobno nieaktualny lockfile; dwa różne czerwone wyniki i ich poprawki.
10. Raporty/artefakty także po błędzie testu przez always(), unikalne nazwy i retencja bez zmiany czerwonego CI na zielone.
11. Jawne vars, obecność fikcyjnego sekretu bez jego ujawniania, env i minimalne permissions; build/test działa bez sekretów.
12. Aktywna ochrona main dopiero po istniejących runach: required PR, rzeczywiste nazwy checks, review w parze i dowód blokady bez bypass.
13. Cache npm/NuGet: cold/warm/nowy lockfile, klucze, hashFiles, tekstowe cache-hit, fallback i poprawny build bez cache.

**Rozszerzenie — zadania 14–21**

14. Nazwa raportu przez GITHUB_OUTPUT do kolejnego run i uses; kontrast z GITHUB_ENV i zakresem joba.
15. Job outputs, needs i przesłanie rzeczywistych plików artefaktami między niezależnymi runnerami.
16. github-script: paginowana lista plików PR-a, obsługa rename/limitów/błędów, front/back outputs i krótki komentarz tylko dla same-repo PR.
17. Własna composite action z konfiguracją i wynikiem: walidacja tekstowego inputu, jawny shell, zachowanie testów i raportów.
18. Reusable workflow backendu: typed inputs konfiguracji/publikacji/retencji, pełny łańcuch outputów i ponowna kontrola required check names.
19. Porównanie zweryfikowanego triku wspólnej wymaganej nazwy w dwóch workflow i pułapki zera uruchomień; docelowo warunkowe komponenty bez workflow-level paths oraz jeden unikalny zawsze obecny wymagany gate. Próby: 0/1/2 komponenty, failure, świadome i nieoczekiwane skipped.
20. Niezależne workflow i workflow_run: plik konsumenta na default branch, artefakt z dokładnego ID producenta, kontrola repo/event/branch/conclusion/SHA oraz walidacja danych bez ich wykonywania.
21. Własna treść LaTeX w `thesis/` i osobno pobrany przypięty upstream bez kopiowania nielicencjonowanych przykładów: latexmk/pdfLaTeX/Biber, PDF, bootstrap workflow na main, prerelease z TeX-only PR i pełny release z main.

**Finał — macierze są ostatnimi zadaniami**

22. Osobny manualny workflow: statyczna macierz Debug/Release backendu na `ubuntu-24.04`, pełne testy, fail-fast:false/max-parallel:2, unikalne raporty oraz podsumowanie Matrix. Kontrolowany błąd Debug daje czerwony ręczny run, nie dowód blokady PR. Wariant porównawczy: configuration × collect_reports, jedno exclude i metadane diagnostyki przez include; wyłączenie raportu nie wyłącza testów.
23. W tym samym ręcznym workflow typowany include-debug wybiera Release albo Release+Debug. Job plan waliduje input i `{include: [{configuration, lane}, …]}`, wystawia JSON przez krok → job output, a job zależny używa fromJSON. Zły plan lub błąd wariantu powoduje czerwone zawsze obecne podsumowanie Matrix. Bez dynamicznego grafu front/back, wykrywania braku pracy i zmiany wymaganej ochrony PR.

Macierze są końcowym, rzadziej potrzebnym eksperymentem, nie przebudową podstawowego CI.
Można zestawić obie grupy dla porównania w jednym manualnym runie albo zastąpić grupę statyczną
dynamiczną po udokumentowaniu zadania 22. Nie uruchamiamy ich automatycznie dla każdego PR-a
i nie dodajemy ich nazw do required checks; aktywny gate z zadania 19 nadal chroni main.

### Kontrakt ćwiczenia LaTeX

- Źródło: `https://github.com/pantadeusz/pjatk_latex`, commit `e660b9ee1e637a843c9084774abdc9b3ecdaae4c`; `engineer.tex` → `engineer.pdf`, lokalna klasa `sprz.cls`, pdfLaTeX przez latexmk, bibliografia Biber. Nie `main.tex`/minted.
- Pakiety Ubuntu 24.04: `latexmk biber texlive-latex-extra texlive-bibtex-extra texlive-fonts-recommended texlive-lang-polish texlive-science`.
- Komenda w `thesis/`, z klasą pobraną tylko na czas pracy runnera: `latexmk -norc -pdf -interaction=nonstopmode -halt-on-error -file-line-error -no-shell-escape engineer.tex`; wynik `thesis/engineer.pdf`.
- Upstream nie zawiera wyraźnej licencji. Nie vendoryzujemy przykładowej pracy, logo ani klasy do kursu/startera i nie nadajemy im własnej licencji. Możliwy jest GitHub fork upstream, ale nie oznacza on ogólnego prawa do eksportu lub relicencjonowania treści.
- Dedykowany `thesis/` przechowuje własny dokument studenta i opis pochodzenia/praw. Szablon jest osobnym, przypiętym checkout na runnerze; tylko niezmieniona `sprz.cls`, z nagłówkiem autorstwa, jest roboczo kopiowana obok własnego dokumentu, bez zapisu w historii Gita.
- Minimalny wariant pomija `maketitle`, `makeprojectcard`, `makedeclaration`, `makethesisattachments`, bibliografię i obrazy upstream. Publikowany PDF nie zawiera przykładowej pracy ani cudzego logo; nie jest to deklaracja swobodnej licencji klasy.
- Kompilacja PR head SHA/push SHA bez sekretów i praw zapisu; osobne jobs publikacji bez checkout, z minimalnym `contents: write`, bez wykonywania źródeł PR-a.
- Ograniczenie GITHUB_TOKEN: nie może utworzyć wydania wskazującego PR commit z inną zawartością `.github/workflows` niż default branch. Najpierw workflow trafia przez PR na main, następnie świeży TeX-only PR tworzy prerelease; workflow-editing PR jest artefakt-only z komunikatem.
- Prerelease tylko dla same-repo PR z potwierdzoną zgodnością workflow z main; pełne wydanie tylko dla push/main. Fork PR i PR Dependabota mogą wyłącznie kompilować i udostępniać artefakt runa. Bez `pull_request_target` wykonującego PR TeX i bez obejścia przez szerszy PAT.
- Unikalne tagi prerelease i wersji main, run ID/attempt i dokładny SHA własnego dokumentu oraz PDF jako asset GitHub Release, bez nadpisywania immutable releases. Pin zewnętrznego szablonu to pochodzenie zależności, nie docelowy commit taga studenta. Sam upload artefaktu Actions nie spełnia zadania wydania.
- Wydanie utworzone za pomocą GITHUB_TOKEN nie uruchamia automatycznie dalszych workflow przez `on: release`.

### Dowody ukończenia i organizacja czasu

- README studenta zawiera zwięzły dziennik: PR/run, SHA, oczekiwany i rzeczywisty wynik, w tym czerwone runy i ich naprawy.
- Kryteria obejmują faktycznie uruchomione testy, raporty także po failure, pomiary cache oraz blokadę merge bez obejścia reguł. Sekrety, zależności i wyniki budowania nie trafiają do Gita.
- Ochronę aktualizuje się po refaktorach z zadań 18–19 na podstawie nowych istniejących checks. Manualne macierze mają własne podsumowanie i nie zastępują wymaganego gate'a PR ani nie stają się wymaganymi checks.
- Po ostatnim zadaniu znajdują się kryteria, diagnostyka i pytania do samokontroli; pytania nie są dodatkowymi zadaniami implementacyjnymi.
- Sekcje wykładu i rdzeń/rozszerzenia laboratorium pozwalają rozłożyć materiał na kolejne bloki. Nie deklarujemy, że pełna progresja mieści się w jednym spotkaniu 90/135 minut.
- Pierwszeństwo podczas zajęć ma samodzielne utworzenie i diagnozowanie CI, gotowe testy i ochrona PR; przygotowanie narzędzi oraz lokalne kontrole wykonuje się wcześniej w domu.

## Poza zakresem zajęć nr 2

- Wdrażanie aplikacji, środowiska i zatwierdzanie wdrożeń — zajęcia nr 5. Pełny release PDF w tym laboratorium nie jest wdrożeniem aplikacji.
- Publikowanie paczek i pełna polityka wersjonowania wydań — zajęcia nr 8; podstawowy cache zależności oraz ograniczone ćwiczenie GitHub Releases dla dokumentu są już częścią zajęć nr 2.
- Pełna konfiguracja GitHub Advanced Security, CodeQL i skanowania zależności — zajęcia nr 7.
- Kubernetes, Terraform i Ansible — osobne zajęcia zgodnie z sylabusem.
- Pisanie testów i konfiguracja frameworków testowych od zera — testy oraz ich konfigurację dostarcza prowadzący.
- Rozbudowana konfiguracja Git, self-hosted runners, wielosystemowe macierze z nieobsługiwanymi zależnościami, wielopoziomowe zagnieżdżanie reusable workflows i zaawansowane strategie pipeline. Prosta macierz statyczna i dynamiczna należą do finału tego laboratorium.
