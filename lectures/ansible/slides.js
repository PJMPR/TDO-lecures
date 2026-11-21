const tutorialStart = document.querySelector('[data-title="Projekt laboratoryjny"]');
const tutorialEnd = document.querySelector('[data-title="Granice Ansible"]');
if (tutorialStart && tutorialEnd) {
  let section = tutorialStart;
  while (section && section !== tutorialEnd) {
    const next = section.nextElementSibling;
    section.remove();
    section = next;
  }
}

const conceptGroups = [{
  slide: "Configuration as Code",
  eyebrow: "Konfiguracja jako kod",
  selector: ".panel",
  tabs: [
    { key: "manual", label: "Ręcznie" },
    { key: "ansible", label: "Z Ansible" },
    { key: "config", label: "Konfiguracja", code: true }
  ],
  details: {
  Deklaracja: {
    manual: "Administrator musiałby zapisać w instrukcji wymaganą wersję, zalogować się na każdy host i pilnować, aby wszystkie osoby wykonały te same polecenia. Zmiana wersji wymagałaby ponownego przejścia przez całą listę maszyn.",
    ansible: "Wymagany stan trafia do repozytorium. Jedna zmiana wartości obowiązuje wszystkie wybrane hosty, przechodzi przez przegląd kodu i pozostaje w historii Git.",
    config: "# group_vars/all.yml\nnode_version: 24.11.0\nnode_install_dir: /opt/node"
  },
  Automatyzacja: {
    manual: "Administrator sprawdzałby, czy pakiet jest zainstalowany, uruchamiał apt na każdym hoście i sam interpretował błędy. Musiałby też uważać, aby nie powtarzać operacji, które mogą zmienić działający system.",
    ansible: "Moduł sprawdza stan hosta i wykonuje tylko potrzebną zmianę. Ten sam playbook konfiguruje jedną maszynę lub całą grupę, a wynik każdego zadania ma jednolity format.",
    config: "- name: Zainstaluj .NET SDK\n  ansible.builtin.apt:\n    name: dotnet-sdk-10.0\n    state: present\n  become: true"
  },
  Weryfikacja: {
    manual: "Po instalacji trzeba byłoby zalogować się na każdy host, uruchomić polecenia sprawdzające wersje i ręcznie porównać wyniki. Taka kontrola daje tylko chwilowy obraz i trudno ją później powtórzyć identycznie.",
    ansible: "Zadania walidacyjne wykonują te same testy na wszystkich hostach. Drugie uruchomienie playbooka z wynikiem changed=0 potwierdza idempotencję, a błąd walidacji zatrzymuje wykonanie.",
    config: "- name: Sprawdź Node.js\n  ansible.builtin.command: node --version\n  register: node_result\n  changed_when: false\n  failed_when: node_result.rc != 0"
  }
  }
}, {
  slide: "Idempotencja",
  eyebrow: "Pętla idempotencji",
  selector: ".loop > div",
  title: (block) => block.textContent.replace(/^\d+/, "").trim(),
  tabs: [
    { key: "meaning", label: "Znaczenie" },
    { key: "ansible", label: "W Ansible" },
    { key: "config", label: "Przykład", code: true }
  ],
  details: {
    "odczytaj stan": {
      meaning: "Moduł najpierw ustala, co znajduje się na hoście. Bez odczytu stanu nie da się bezpiecznie zdecydować, czy zmiana jest potrzebna.",
      ansible: "Moduł apt sprawdza bazę pakietów, file bada plik, a service odczytuje stan usługi. Każdy moduł robi to w sposób właściwy dla zarządzanego zasobu.",
      config: "- name: Sprawdź, czy Git jest zainstalowany\n  ansible.builtin.command: git --version\n  register: git_version\n  changed_when: false"
    },
    "porównaj z deklaracją": {
      meaning: "Ansible zestawia stan wykryty na hoście z argumentami zadania, na przykład wymaganą wersją pakietu albo treścią pliku.",
      ansible: "Wartość state: present oznacza, że pakiet ma istnieć. Moduł sam rozstrzyga, czy host już spełnia tę deklarację.",
      config: "- name: Zapewnij obecność Git\n  ansible.builtin.apt:\n    name: git\n    state: present"
    },
    "zmień różnicę": {
      meaning: "Zmiana następuje tylko wtedy, gdy stan hosta różni się od deklaracji. Dzięki temu ponowne wykonanie nie powtarza niepotrzebnej pracy.",
      ansible: "Jeśli Git już jest zainstalowany, apt zwróci ok. Jeśli go brakuje, zainstaluje pakiet i zwróci changed.",
      config: "TASK [Zapewnij obecność Git]\nok: [localhost]"
    },
    "raportuj changed: 0": {
      meaning: "Podsumowanie bez zmian potwierdza, że host osiągnął oczekiwany stan i playbook jest zbieżny.",
      ansible: "Drugi przebieg powinien zakończyć się wartością changed=0. Wyjątek może wskazywać dryf, zadanie nieidempotentne albo celową aktualizację.",
      config: "PLAY RECAP\nlocalhost : ok=18 changed=0 unreachable=0 failed=0"
    }
  }
}, {
  slide: "Wyniki zadań",
  eyebrow: "Raport wykonania",
  selector: ".panel",
  tabs: [
    { key: "meaning", label: "Znaczenie" },
    { key: "when", label: "Kiedy powstaje" },
    { key: "config", label: "Przykład", code: true }
  ],
  details: {
    ok: {
      meaning: "Zadanie zakończyło się poprawnie i nie zmieniło hosta.",
      when: "Najczęściej oznacza, że wymagany stan już istniał. Takiego wyniku oczekujemy podczas kolejnego uruchomienia poprawnie napisanego playbooka.",
      config: "TASK [Zainstaluj Git]\nok: [localhost]"
    },
    changed: {
      meaning: "Zadanie zakończyło się poprawnie i wprowadziło zmianę na hoście.",
      when: "Wynik pojawia się na przykład po instalacji brakującego pakietu, zapisaniu nowej treści pliku albo restarcie usługi.",
      config: "TASK [Zainstaluj Git]\nchanged: [localhost]"
    },
    failed: {
      meaning: "Moduł nie osiągnął wymaganego stanu. Domyślnie Ansible przerywa dalsze zadania dla tego hosta.",
      when: "Przyczyną może być błędny argument, brak uprawnień, niedostępne repozytorium lub niespełniony warunek walidacyjny.",
      config: "TASK [Sprawdź wersję Node.js]\nfatal: [localhost]: FAILED! => {\"rc\": 1}"
    }
  }
}, {
  slide: "Sekrety",
  eyebrow: "Dane poufne",
  selector: ".two > div",
  tabs: [
    { key: "purpose", label: "Zastosowanie" },
    { key: "rules", label: "Zasady" },
    { key: "config", label: "Przykład", code: true }
  ],
  details: {
    "Ansible Vault": {
      purpose: "Vault szyfruje zmienne, które muszą być wersjonowane razem z projektem, ale nie mogą pozostać jawnym tekstem.",
      rules: "Hasło lub plik klucza przechowujemy poza repozytorium. W zadaniach używających sekretu warto dodać no_log: true, aby wartość nie trafiła do raportu.",
      config: "ansible-vault encrypt group_vars/vault.yml\nansible-playbook site.yml --ask-vault-pass"
    },
    "Token runnera": {
      purpose: "Token rejestracyjny pozwala jednorazowo dołączyć self-hosted runner do repozytorium lub organizacji GitHub.",
      rules: "Token pobieramy tuż przed rejestracją, nie zapisujemy go w inventory i nie dodajemy do Git. Po użyciu lub wygaśnięciu nie powinien być ponownie wykorzystywany.",
      config: "- name: Zarejestruj runner\n  ansible.builtin.command: ./config.sh --unattended --token {{ runner_token }}\n  no_log: true"
    }
  }
}];

for (const group of conceptGroups) {
  const conceptSlide = document.querySelector(`[data-title="${group.slide}"]`);
  if (!conceptSlide) continue;
  const modal = document.createElement("dialog");
  modal.className = "concept-modal";
  const modalTitleId = `concept-modal-title-${group.slide.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  modal.setAttribute("aria-labelledby", modalTitleId);
  modal.innerHTML = `<div class="concept-modal__frame"><button class="concept-modal__close" type="button" aria-label="Zamknij objaśnienie">×</button><div class="concept-modal__eyebrow">${group.eyebrow}</div><h3 id="${modalTitleId}"></h3><div class="concept-tabs" role="tablist" aria-label="Objaśnienie pojęcia">${group.tabs.map((tab) => `<button type="button" role="tab" data-tab="${tab.key}">${tab.label}</button>`).join("")}</div><div class="concept-tab-panel" role="tabpanel"><p class="concept-tab-text"></p><pre class="concept-tab-code" hidden><code></code></pre></div></div>`;
  document.body.append(modal);

  const title = modal.querySelector(`#${modalTitleId}`);
  const tabs = [...modal.querySelectorAll('[role="tab"]')];
  const tabText = modal.querySelector(".concept-tab-text");
  const tabCode = modal.querySelector(".concept-tab-code");
  const tabCodeContent = tabCode.querySelector("code");
  const close = modal.querySelector(".concept-modal__close");
  let opener = null;
  let currentDetails = null;

  const selectTab = (selected, focus = false) => {
    tabs.forEach((tab) => {
      const active = tab === selected;
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
    });
    const selectedDefinition = group.tabs.find((tab) => tab.key === selected.dataset.tab);
    const isCode = selectedDefinition?.code;
    tabText.hidden = isCode;
    tabCode.hidden = !isCode;
    if (isCode) tabCodeContent.textContent = currentDetails[selected.dataset.tab];
    else tabText.textContent = currentDetails[selected.dataset.tab];
    if (focus) selected.focus();
  };

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => selectTab(tab));
    tab.addEventListener("keydown", (event) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      let nextIndex = index;
      if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
      if (event.key === 'Home') nextIndex = 0;
      if (event.key === 'End') nextIndex = tabs.length - 1;
      selectTab(tabs[nextIndex], true);
    });
  });

  const closeModal = () => {
    modal.close();
    opener?.focus();
  };

  conceptSlide.querySelectorAll(group.selector).forEach((panel) => {
    const concept = group.title ? group.title(panel) : panel.querySelector("h3")?.textContent.trim();
    const details = group.details[concept];
    if (!details) return;

    panel.classList.add("has-concept-help");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "concept-help";
    button.textContent = "+";
    button.setAttribute("aria-label", `Pokaż objaśnienie i przykład: ${concept}`);
    button.addEventListener("click", () => {
      opener = button;
      currentDetails = details;
      title.textContent = concept;
      selectTab(tabs[0]);
      modal.showModal();
      tabs[0].focus();
    });
    panel.append(button);
  });

  close.addEventListener("click", closeModal);
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeModal();
  });
  modal.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeModal();
  });
}

const slides = [...document.querySelectorAll('.slide')];
const counter = document.querySelector('.slide-number');
const progress = document.querySelector('.progress span');
const previous = document.querySelector('[data-prev]');
const next = document.querySelector('[data-next]');
if (!slides.length || !counter || !progress || !previous || !next) throw new Error('Nieprawidłowa struktura prezentacji.');

let current = 0;
function show(index, updateHash = true) {
  current = Math.max(0, Math.min(slides.length - 1, Number.isFinite(index) ? Math.trunc(index) : 0));
  slides.forEach((slide, i) => {
    slide.classList.toggle('active', i === current);
    slide.setAttribute('aria-hidden', i === current ? 'false' : 'true');
  });
  counter.textContent = `${String(current + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
  progress.style.width = `${((current + 1) / slides.length) * 100}%`;
  document.title = `${slides[current].dataset.title || 'Ansible'} · Technologie DevOps`;
  if (updateHash) history.replaceState(null, '', `#${current + 1}`);
}

const move = (delta) => show(current + delta);
document.querySelectorAll('pre').forEach((block) => { block.tabIndex = 0; });
document.addEventListener('keydown', (event) => {
  if (event.altKey || event.ctrlKey || event.metaKey || event.target.closest?.('input,select,textarea,summary,pre,.presentation-picker,[contenteditable]')) return;
  if (['ArrowRight', 'ArrowDown', 'PageDown', ' '].includes(event.key)) { event.preventDefault(); move(1); }
  else if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(event.key)) { event.preventDefault(); move(-1); }
  else if (event.key === 'Home') { event.preventDefault(); show(0); }
  else if (event.key === 'End') { event.preventDefault(); show(slides.length - 1); }
  else if (event.key.toLowerCase() === 'f') document.documentElement.requestFullscreen?.();
});
previous.addEventListener('click', () => move(-1));
next.addEventListener('click', () => move(1));
window.addEventListener('hashchange', () => show(Number(location.hash.slice(1)) - 1, false));
show(Number(location.hash.slice(1)) - 1, false);
