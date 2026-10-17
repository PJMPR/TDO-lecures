# Technologie DevOps — wykłady i laboratoria

Statyczna strona kursu przygotowana do publikacji przez GitHub Pages.

## Zawartość

- `index.html` — strona główna
- `lectures/docker/` — prezentacja Docker i Docker Compose
- `lectures/ci/` — podzielona na sekcje prezentacja CI, SDLC i GitHub Actions
- `labs/docker/` — instrukcja laboratorium nr 1, zgodna ze starterem z tagu `Z1`
- [Laboratorium 02 — CI i GitHub Actions](labs/ci/index.html) — osobna instrukcja z 23 stopniowymi zadaniami, kryteriami i podpowiedziami
- [Zajęcia nr 2 — CI i SDLC](zajecia-02-scope.md) — zakres wykładu, rdzenia i modułów rozszerzających laboratorium
- `projects/docker-lab-starter/` — starter .NET + Angular + MySQL do laboratorium CI; gotowe testy, bez lockfiles i gotowego workflow
- `demos/dotnet-mysql/` — demonstracja ASP.NET Core + MySQL
- `scripts/build-site.mjs` — statyczny build strony i kolorowanie bloków kodu w materiałach

## Wersje startera

Tag `Z1` zachowuje materiały i aplikację z zajęć nr 1 (Spring Boot + PostgreSQL).
W repozytorium materiałów kursu możesz je odtworzyć poleceniem `git switch --detach Z1`.
Tag trzeba opublikować w zdalnym repozytorium, aby był dostępny dla studentów.

Bieżący starter jest przygotowany do zajęć nr 2: backend .NET z testami HTTP API na MySQL
uruchamianym przez Testcontainers oraz Angular z testami interfejsu.
Wymagania i komendy znajdują się w [instrukcji startera](projects/docker-lab-starter/README.md).
Do publicznego template, zadania GitHub Classroom albo czystego eksportu przenieś zawartość
startera, bez wyników budowania, cache, gotowych workflow i lockfiles generowanych przez studentów.
Prywatnej gałęzi prowadzącego nie można po prostu sforkować publicznie. Rozwiązania prowadzącego
pozostają poza publicznym starterem i materiałami studenta. Workflow publikujący tę stronę
nie jest częścią startera.

[Pobierz starter CI (.zip)](assets/downloads/z2-ci-starter.zip) i zaimportuj go do nowego
publicznego repozytorium według [instrukcji przygotowania](labs/ci/index.html#szablon-startowy).
Archiwum pochodzi z czystego, sprawdzonego startera: zawiera pliki aplikacji, bez historii Git,
lockfiles i gotowych workflow. **Po zmianach startera odśwież archiwum** i ponownie sprawdź,
że nie zawiera rozwiązania ani wyników budowania. Prowadzący może alternatywnie udostępnić
publiczny template lub Classroom; prywatny adres repozytorium nie jest potrzebny studentowi.

## Przygotowanie do laboratorium 02

Student potrzebuje konta GitHub, **publicznego repozytorium** z włączonym Actions oraz praw
właściciela/admina do rulesets, variables i secrets. Standardowy czas obliczeniowy GitHub-hosted
Actions w publicznych repozytoriach jest bezpłatny, a nie rozliczany ze stałego przydziału
darmowych minut. Większe runnery i przechowywanie danych mają osobne zasady/limity;
miesięczny przydział w repozytoriach prywatnych zależy od planu.
Wykonywalne zadania używają standardowego runnera `ubuntu-24.04`, zgodnego ze sprawdzonym
środowiskiem testów aplikacji i pakietów LaTeX.

Lokalnie: Git, edytor (np. VS Code/JetBrains), .NET SDK z `global.json` startera,
Node.js z jego `.nvmrc` i npm oraz Docker Linux Engine
(Rancher Desktop: **dockerd/moby**). `gh` jest opcjonalny do pracy lokalnej.
Testcontainers sam uruchamia MySQL 8.4; testy API nie wymagają sekretów, Dockerfile ani Compose.
Testy UI są gotowe i używają Vitest. Student generuje i commituje dwa `packages.lock.json`
oraz `frontend/package-lock.json`, a build/test .NET uruchamia z rozwiązania `MissionControl.slnx`.
Kontrole środowiska i polecenia znajdują się w instrukcji laboratorium i README startera.
Lokalna instalacja LaTeX nie jest wymagana, jeśli PDF jest budowany na runnerze.

## Podgląd lokalny

Zainstaluj Node.js w wersji z `.nvmrc`, a następnie zbuduj stronę:

```bash
npm ci
npm test
npm run build
python3 -m http.server 8000 --directory dist/site
```

Screenshoty wykładu są przechowywane w **Git LFS**. Przed pierwszym pobraniem materiałów
zainstaluj Git LFS i wykonaj `git lfs install`, a w sklonowanym repozytorium `git lfs pull`.
Zwykłe archiwum źródeł może zawierać same wskaźniki LFS; build zgłosi wtedy błąd
zamiast opublikować niedziałające obrazy. Workflow podglądu i GitHub Pages pobierają LFS
podczas checkoutu.

Otwórz `http://localhost:8000`. Po edycji materiałów powtórz `npm run build`.
Możesz użyć innego statycznego serwera wskazującego `dist/site`.
Build wymaga Git: kopiuje wyłącznie wersjonowane i nieignorowane pliki z katalogów materiałów,
bez `.git`, wyników budowania, zależności i konfiguracji narzędzi strony.
Źródła HTML pozostają niezmienione, a `dist/` nie jest commitowany.

Prezentacje i instrukcja CI używają **Shiki** z **`@shikijs/colorized-brackets`**.
Kolorowanie jest generowane podczas builda, także dla zagnieżdżonych nawiasów.
Przeglądarka otrzymuje gotowy HTML — bez Shiki, WASM i żądań do zewnętrznego CDN.
Bloki muszą mieć jedną klasę `language-*`, np. `language-yaml`, `language-bash`,
`language-dockerfile`, `language-powershell`, `language-json` albo `language-text` dla diagramów.
Brak lub nieobsługiwany język przerywa build z komunikatem.

Główny `package-lock.json` jest lockfile narzędzi publikujących stronę i należy do repozytorium.
Nie zastępuje lockfiles aplikacji laboratoryjnej, które studenci nadal generują samodzielnie.

### Screenshoty wykładu

`npm run screenshots -- --login` otwiera zainstalowany Google Chrome z **oddzielnym,
trwałym profilem poza repozytorium**. Zaloguj się ręcznie do GitHuba, także przez 2FA.
Skrypt nie odczytuje hasła ani nie eksportuje cookies. Profil zachowuje logowanie;
nie udostępniaj go ani nie commituj. Nie jest to Twój codzienny profil Chrome.
Okno pozostaje otwarte, aż je zamkniesz lub przerwiesz polecenie.

W drugim terminalu uruchom:

```bash
npm run screenshots -- --config /sciezka/do/prywatnego/manifest.json \
  --cdp http://127.0.0.1:18574
```

Bez `--cdp` skrypt sam otwiera ten sam profil (wcześniejsze okno musi być zamknięte)
i czeka na logowanie, jeśli sesja wygasła. `--only hello-run` ponawia pojedynczy kadr.
Po pierwszym przekazaniu `--config` manifest jest pamiętany w prywatnym profilu;
przy kolejnych uruchomieniach można pominąć ten argument.
Domyślnie zapisuje PNG w `lectures/ci/screenshots/`, w rozdzielczości 2×,
z natywnym ciemnym motywem GitHuba i viewportem 1440×1000.
W GitHub → Settings → Appearance wybierz **Sync with system** z ciemnym motywem Dark
(albo stały Dark). Skrypt emuluje ciemny motyw systemu i przerywa, jeśli strona nadal
używa jasnego motywu; nie odwraca kolorów gotowych zdjęć.
Opcja `--profile` wybiera inny prywatny profil.
Port debugowania udostępnia sesję tylko lokalnie; zamknij przeglądarkę po zakończeniu.

Manifest trzymaj **poza repozytorium**: zawiera prywatne adresy i selektory konkretnego
interfejsu. Każdy kadr musi wskazać obszar i tekst, którego widoczność sprawdzamy:

```json
{
  "captures": [{
    "id": "hello-run",
    "url": "https://github.com/OWNER/REPO/actions/runs/RUN_ID",
    "selector": "main",
    "expect": ["Powitanie"],
    "actions": [{
      "type": "expand",
      "selector": "button[aria-expanded=\"false\"]"
    }]
  }]
}
```

Akcje `click`, `expand`, `wait`, `scroll` używają selektorów Playwright.
`mask` to opcjonalna lista selektorów danych do zasłonięcia. Skrypt przerywa przy
brakującym elemencie lub oczekiwanym tekście zamiast zapisywać mylący kadr.
Opcjonalne `bounds` zawiera selektory wewnątrz obszaru: skrypt kadruje prostokąt
obejmujący wskazane elementy i sprawdza, że oczekiwany tekst nie został odcięty.
Alternatywne `padding`, np. `{"top":24,"right":24,"bottom":24,"left":88}`, dodaje
rzeczywiste otoczenie kadru, także awatar i obramowanie poza zaznaczonym elementem.
Dla większego obszaru ustaw `viewport`, np. `{"width":1600,"height":1400}`.
Marginesy muszą mieścić się w oknie; skrypt zgłosi błąd zamiast je przyciąć.
Raport z URL i czasem powstaje obok prywatnego manifestu, **nie w publikowanej stronie**.
Skrypt nie scala PR-ów ani nie zmienia ustawień; potrzebne reruny wykonuj jawnie
przez `gh run rerun RUN_ID --repo OWNER/REPO`, a ich stan sprawdzaj przez `gh run view`.
Alternatywnie wpis `workflow` może przygotować stan przez `gh`:
`{"repo":"OWNER/REPO","runId":"123","rerun":true,"status":"in_progress"}`.
Wymaga to jawnego `--rerun` oraz wcześniejszego zalogowania `gh` do właściwego konta.
Kolejny kadr z `rerun:false,status:"completed"` czeka na zielony wynik tego samego runa.
`controls`, np. `[{"selector":"button:has-text(\"Merge pull request\")","enabled":false}]`,
sprawdza także rzeczywistą blokadę przycisku. Nie odtwarzaj w ten sposób starego CI
aplikacji; reruny służą wyłącznie izolowanym scenariuszom przygotowanym do zdjęć.
Zdjęcia prawdziwego IDE (language injection i autocomplete) wymagają osobnego kadru
w IDE — automatyzacja przeglądarki ich nie imituje.

## GitHub Pages

Workflow `.github/workflows/pages.yml` instaluje zależności, sprawdza kolorowanie, buduje i publikuje
`dist/site` po wysłaniu zmian na gałąź `main`. W ustawieniach repozytorium wybierz **Settings → Pages → Source: GitHub Actions**.

## Prezentacja

Menu **Wybierz wykład** na stronie głównej i **Prezentacje** w stopce slajdów
pozwala przełączać się między zachowanym wykładem nr 1 a wykładem nr 2.
Menu działa również bez JavaScript; Escape zamyka rozwinięte menu, gdy JavaScript jest włączony.

Strzałki, Page Up/Page Down i spacja zmieniają slajd. Home/End przechodzą na początek lub koniec, a klawisz F uruchamia pełny ekran.
Skróty slajdów nie przechwytują klawiszy podczas obsługi menu, pól formularzy i przewijania kodu.
Bloki kodu można fokusować klawiszem Tab; spacja na przyciskach zachowuje ich standardowe działanie.
Adres z fragmentem, np. `lectures/ci/index.html#20`, otwiera konkretny slajd.

Wykład nr 2 jest bankiem slajdów w sekcjach tematycznych: SDLC i strategie gałęzi,
pierwszy workflow i YAML, zdarzenia i inputs, runner i weryfikacja aplikacji,
expressions/skrypty/API, przepływ danych, cache i reużywanie oraz polityka checks.
Obejmuje typowane inputs workflow i tekstowe outputs/env, Bash i `actions/github-script`,
funkcje JSON/tekstowe/`hashFiles`/`case`, composite actions, reusable workflows i granice zaufania
między niezależnymi runs. Rozróżnia commit statuses i check runs; pokazuje też wariant dwóch
opcjonalnych workflow ze wspólną wymaganą **nazwą** checka: jeden uruchomiony musi przejść,
a przy dwóch wymagane są oba sukcesy. Pending/failure drugiego nadal blokuje merge.
Osobno omawia pułapkę zera uruchomionych workflow i jednoznaczną alternatywę ze stałym gate'em.

Polecenia i kolejność wykonania ćwiczeń są w **oddzielnej instrukcji laboratorium 02**.
Rdzeń (1–13) prowadzi od pierwszego push do CI .NET/Angular, gotowych testów, raportów,
ochrony PR i pomiarów cache. Rozszerzenie (14–21) obejmuje outputs, API GitHuba,
composite/reusable, jeden stały required gate, przekazanie artefaktu między runs i rzeczywisty
szablon [pantadeusz/pjatk_latex](https://github.com/pantadeusz/pjatk_latex).
Szablon jest przypięty do `e660b9ee1e637a843c9084774abdc9b3ecdaae4c`:
`engineer.tex` → `engineer.pdf`, klasa `sprz.cls`, latexmk/pdfLaTeX i Biber.
Upstream nie ma wyraźnej licencji, więc nie kopiujemy jego pracy, logo ani klasy do startera.
Student zapisuje własną treść w `thesis/`, dokumentuje pochodzenie i ograniczenia praw,
a przypięty szablon pobiera oddzielnie na runnerze. Niezmieniona klasa trafia obok dokumentu
tylko na czas kompilacji; wynik to `thesis/engineer.pdf`. Minimalny dokument pomija makra
tytułu, karty projektu, deklaracji i załączników zawierające branding lub gotowe teksty.

Ćwiczenie LaTeX publikuje PDF jako asset prerelease z TeX-only PR-a i pełnego wydania z main.
Najpierw trzeba wprowadzić workflow na main: PR zmieniający `.github/workflows` jest artefakt-only,
ponieważ `GITHUB_TOKEN` nie może utworzyć wydania dla takiego commita PR-a.
Fork PR i PR Dependabota również kompilują bez publikacji. Zapis działa w osobnym jobie bez checkout,
z unikalnymi tagami i bez przekazania tokenu zapisu kompilatorowi. To wyjątek dotyczący wydania dokumentu,
**nie wdrożenie aplikacji**. Macierze statyczna i dynamiczna są **ostatnimi zadaniami (22–23)**:
osobny, ręczny eksperyment Debug/Release na `ubuntu-24.04`, z typowanym `include-debug`,
JSON z poprzedniego joba i podsumowaniem wyników. Wariant porównawczy pokazuje include/exclude
na metadanych i zbieraniu raportów, bez zmiany architektury CI aplikacji.
Ręcznych macierzy ani ich podsumowania nie dodajemy do required checks PR-a;
ochrona z zadania 19 pozostaje aktywna. Kryteria, diagnostyka i pytania są po zadaniu 23.

Pracujemy w modelu main + krótkie gałęzie zmian, PR, review i CI. Pełen bank wykładu i zadań
nie mieści się w jednym wykładzie 90-minutowym. Prowadzący dobiera rdzeń i kolejne moduły;
przygotowanie narzędzi oraz kontrole środowiska wykonuje się wcześniej w domu.
