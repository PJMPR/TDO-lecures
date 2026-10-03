# Technologie DevOps — wykłady i laboratoria

Statyczna strona kursu przygotowana do publikacji przez GitHub Pages.

## Zawartość

- `index.html` — strona główna
- `lectures/docker/` — prezentacja Docker i Docker Compose
- `labs/docker/` — instrukcja laboratorium
- `projects/docker-lab-starter/` — projekt startowy do osobnego repozytorium GitHub Classroom
- `demos/dotnet-mysql/` — demonstracja ASP.NET Core + MySQL

## Podgląd lokalny

Uruchom dowolny statyczny serwer HTTP w katalogu repozytorium, np.:

```bash
npx serve .
```

Niektóre przeglądarki ograniczają skrypty uruchomione bezpośrednio z `file://`, dlatego serwer lokalny jest zalecany.

## GitHub Pages

Workflow `.github/workflows/pages.yml` publikuje stronę po wysłaniu zmian na gałąź `main`. W ustawieniach repozytorium wybierz **Settings → Pages → Source: GitHub Actions**.

## Prezentacja

Strzałki, Page Up/Page Down i spacja zmieniają slajd. Home/End przechodzą na początek lub koniec, a klawisz F uruchamia pełny ekran.
