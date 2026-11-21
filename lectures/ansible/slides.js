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

  const remoteDemoSlide = `<section class="slide" data-title="Demo — przygotowanie Debiana"><div class="content"><div class="kicker">Demo 02a // managed node</div><h2>Przygotowujemy Debiana do połączenia SSH</h2><div class="code-demo" data-code-title="Instalacja Debiana"><button class="code-expand" type="button" aria-label="Powiększ kod">⛶</button><ol class="code-lines"><li data-info-title="Instalacja dystrybucji" data-info="Polecenie wykonujemy w PowerShellu. Dodaje Debian jako drugą dystrybucję WSL obok Ubuntu." data-options="--no-launch — instaluje bez automatycznego uruchomienia; wsl --list --online — pokazuje dostępne nazwy dystrybucji"><span class="line-no">1</span><code>wsl --install -d Debian</code><button class="code-info" type="button" aria-label="Objaśnij linię 1">ⓘ</button></li><li data-info-title="Odświeżenie pakietów" data-info="Polecenie wykonujemy już w terminalu Debiana. Pobiera aktualne informacje o pakietach." data-options="-y — automatycznie potwierdza pytania; full-upgrade — aktualizuje cały system"><span class="line-no">2</span><code>sudo apt update</code><button class="code-info" type="button" aria-label="Objaśnij linię 2">ⓘ</button></li><li data-info-title="SSH, Python i check mode" data-info="Ansible potrzebuje serwera SSH oraz Pythona. Moduł apt wymaga dodatkowo python3-apt, aby działać w trybie --check." data-options="openssh-client — klient SSH; openssh-server — serwer SSH; python3 — interpreter modułów Ansible; python3-apt — obsługa modułu apt w check mode"><span class="line-no">3</span><code>sudo apt install -y openssh-server python3 python3-apt</code><button class="code-info" type="button" aria-label="Objaśnij linię 3">ⓘ</button></li><li data-info-title="Uruchomienie SSH" data-info="Uruchamia serwer SSH w Debianie. W WSL polecenie service działa także bez włączonego systemd." data-options="sudo service ssh status — sprawdzenie stanu; sudo systemctl enable ssh — start przy uruchomieniu systemd"><span class="line-no">4</span><code>sudo service ssh start</code><button class="code-info" type="button" aria-label="Objaśnij linię 4">ⓘ</button></li><li data-info-title="Adres Debiana" data-info="Adres wpisujemy później do ansible_host w inventory Ubuntu. W domyślnym trybie NAT może zmienić się po restarcie WSL." data-options="hostname -I — adres dostępny dla innych dystrybucji; ip addr — pełne informacje o interfejsach"><span class="line-no">5</span><code>hostname -I</code><button class="code-info" type="button" aria-label="Objaśnij linię 5">ⓘ</button></li></ol></div><p class="note">Następnie z Ubuntu tworzymy klucz SSH i używamy <code>ssh-copy-id student@ADRES_DEBIANA</code>.</p></div></section>`;

const inventoryDemo = document.querySelector('[data-title="Demo — pierwszy inventory"]');
if (inventoryDemo) {
  inventoryDemo.querySelector("h2").textContent = "Opisujemy Debiana jako hosta zarządzanego";
  inventoryDemo.querySelector(".code-lines").innerHTML = `<li data-info-title="Grupa all" data-info="Grupa all obejmuje wszystkie hosty z inventory." data-options="children — grupuje inne grupy; hosts — definiuje hosty bezpośrednio"><span class="line-no">1</span><code>all:</code><button class="code-info" type="button" aria-label="Objaśnij linię 1">ⓘ</button></li><li data-info-title="Lista hostów" data-info="Sekcja hosts zawiera aliasy hostów, których używamy w poleceniach i playbookach." data-options="children — przechowuje podgrupy; vars — ustawia zmienne grupy"><span class="line-no">2</span><code>  hosts:</code><button class="code-info" type="button" aria-label="Objaśnij linię 2">ⓘ</button></li><li data-info-title="Alias Debiana" data-info="debian_wsl to nazwa używana przez Ansible. Nie musi być nazwą DNS." data-options="ansible_host — adres docelowy; ansible_user — użytkownik SSH"><span class="line-no">3</span><code>    debian_wsl:</code><button class="code-info" type="button" aria-label="Objaśnij linię 3">ⓘ</button></li><li data-info-title="Adres hosta" data-info="To adres zwrócony przez hostname -I uruchomione w Debianie. W trybie NAT może zmienić się po restarcie WSL." data-options="nazwa DNS — stabilniejszy alias; IP — bezpośredni adres dystrybucji WSL"><span class="line-no">4</span><code>      ansible_host: 172.25.10.5</code><button class="code-info" type="button" aria-label="Objaśnij linię 4">ⓘ</button></li><li data-info-title="Użytkownik SSH" data-info="Użytkownik, którym Ubuntu loguje się do Debiana." data-options="ansible_user — użytkownik połączenia; remote_user — odpowiednik ustawiany w playbooku"><span class="line-no">5</span><code>      ansible_user: student</code><button class="code-info" type="button" aria-label="Objaśnij linię 5">ⓘ</button></li><li data-info-title="Transport SSH" data-info="Wymusza komunikację przez serwer SSH działający w Debianie." data-options="ssh — systemowy klient SSH; paramiko — klient Python; local — wykonanie na Ubuntu"><span class="line-no">6</span><code>      ansible_connection: ssh</code><button class="code-info" type="button" aria-label="Objaśnij linię 6">ⓘ</button></li><li data-info-title="Klucz prywatny" data-info="Wskazuje klucz prywatny utworzony w Ubuntu i dodany do authorized_keys w Debianie." data-options="ansible_password — hasło, którego nie zapisujemy jawnie; ssh-agent — przechowuje klucz w agencie"><span class="line-no">7</span><code>      ansible_ssh_private_key_file: ~/.ssh/id_ed25519</code><button class="code-info" type="button" aria-label="Objaśnij linię 7">ⓘ</button></li>`;
  const inventoryLines = inventoryDemo.querySelectorAll(".code-lines > li");
  inventoryDemo.insertAdjacentHTML("beforebegin", remoteDemoSlide);
}

const requirementsDemo = document.querySelector('[data-title="Demo — wymagania"]');
requirementsDemo?.querySelector("h2") && (requirementsDemo.querySelector("h2").textContent = "Ubuntu jest control node");
requirementsDemo?.querySelector(".note") && (requirementsDemo.querySelector(".note").textContent = "Ubuntu uruchamia Ansible, a Debian WSL będzie hostem zarządzanym przez SSH.");

const pingDemo = document.querySelector('[data-title="Demo — sprawdzenie hosta"]');
if (pingDemo) {
  pingDemo.querySelector("h2").textContent = "Najpierw sprawdzamy połączenie z Debianem";
  const pingLines = pingDemo.querySelectorAll(".code-lines > li");
  pingLines[1].querySelector("code").textContent = "ansible debian_wsl -i inventory.yml -m ansible.builtin.ping";
  pingLines[1].dataset.info = "Uruchamia moduł ping na hoście debian_wsl. To test wykonania modułu przez Ansible, a nie test ICMP.";
}

const playbookDemo = document.querySelector('[data-title="Demo — pierwszy playbook"]');
if (playbookDemo) {
  playbookDemo.querySelector("h2").textContent = "Playbook wybiera Debiana i uruchamia zadanie";
  const playbookLines = playbookDemo.querySelectorAll(".code-lines > li");
  playbookLines[1].querySelector("code").textContent = "  hosts: debian_wsl";
  playbookLines[1].dataset.info = "Play zostanie wykonany na hoście debian_wsl z inventory.";
  playbookLines[1].dataset.options = "all — wszystkie hosty; nazwa hosta — jeden host; wzorzec grupy — wybrany fragment inventory";
}

const runDemo = document.querySelector('[data-title="Demo — uruchomienie i idempotencja"]');
if (runDemo) {
  runDemo.querySelector("h2").textContent = "Najpierw dry-run, potem zmiana i ponowne wykonanie";
  runDemo.querySelector(".code-lines").innerHTML = `<li data-info-title="Dry-run" data-info="Ansible przewiduje zmiany i nie modyfikuje Debiana. To moment na sprawdzenie planu przed zastosowaniem." data-options="--check — przewiduj zmiany; --diff — pokaż różnice; --syntax-check — sprawdź składnię"><span class="line-no">1</span><code>ansible-playbook -i inventory.yml site.yml --check --diff --ask-become-pass</code><button class="code-info" type="button" aria-label="Objaśnij linię 1">ⓘ</button></li><li data-info-title="Zastosowanie zmiany" data-info="Po zaakceptowaniu wyniku dry-run uruchamiamy playbook w trybie wykonującym. Pakiet gh zostanie zainstalowany na Debianie, jeśli go brakuje." data-options="--ask-become-pass — pytaj o hasło sudo; --limit — ogranicz hosty; --tags — ogranicz zadania"><span class="line-no">2</span><code>ansible-playbook -i inventory.yml site.yml --ask-become-pass</code><button class="code-info" type="button" aria-label="Objaśnij linię 2">ⓘ</button></li><li data-info-title="Ponowne wykonanie" data-info="Uruchamiamy tę samą komendę drugi raz. Poprawny playbook nie powinien ponownie zmieniać hosta." data-options="--check — ponownie sprawdź bez zmian; --diff — pokaż różnice; --verbose — więcej szczegółów"><span class="line-no">3</span><code>ansible-playbook -i inventory.yml site.yml --ask-become-pass</code><button class="code-info" type="button" aria-label="Objaśnij linię 3">ⓘ</button></li></ol>`;
  runDemo.querySelector(".note").textContent = "Proces: sprawdź (--check) → zastosuj → uruchom ponownie → potwierdź changed=0.";
}

const architectureSlide = document.querySelector('[data-title="Architektura Ansible"]');
if (architectureSlide) {
  architectureSlide.querySelector("h2").textContent = "Kontroler Ubuntu wysyła zadania do Debiana";
  architectureSlide.querySelector(".note").textContent = "Ubuntu WSL jest control node. Debian WSL jest managed node i przyjmuje zadania przez SSH.";
  architectureSlide.querySelector(".agent-map .node").innerHTML = "control node<br><small>Ubuntu WSL + Ansible</small>";
  architectureSlide.querySelector(".agent-map .managed").innerHTML = "managed node<br><small>Debian WSL + SSH</small>";
}

const modelSlide = document.querySelector('[data-title="Model bez agenta"]');
if (modelSlide) modelSlide.querySelector(".note").textContent = "W tym demo Ubuntu jest kontrolerem, a Debian hostem zarządzanym przez SSH. Na hoście nie instalujemy demona Ansible.";

const ghDemo = document.querySelector('[data-title="Demo — instalacja gh"]');
ghDemo?.querySelector(".note")?.remove();

const inventoryConcept = document.querySelector('[data-title="Inventory"]');
if (inventoryConcept) inventoryConcept.querySelector("pre code").textContent = "all:\n  hosts:\n    debian_wsl:\n      ansible_host: 172.25.10.5\n      ansible_user: student\n      ansible_connection: ssh";

const nodeVariablesSlides = `<section class="slide" data-title="Demo — zmienne Node.js"><div class="content"><div class="kicker">Demo 09 // zmienne</div><h2>Wersja Node.js jest polityką projektu</h2><div class="code-demo" data-code-title="group_vars/all.yml — Node.js"><button class="code-expand" type="button" aria-label="Powiększ kod">⛶</button><ol class="code-lines"><li data-info-title="Pakiet Node.js" data-info="Nazwa pakietu jest zmienną, więc zadanie instalacyjne nie musi znać konkretnej nazwy pakietu." data-options="nodejs — pakiet systemowy; nodejs=wersja — dokładna wersja z repozytorium; nodejs_package — własna nazwa zmiennej"><span class="line-no">1</span><code>nodejs_package: nodejs</code><button class="code-info" type="button" aria-label="Objaśnij linię 1">ⓘ</button></li><li data-info-title="Pakiet npm" data-info="npm instalujemy jako osobny pakiet Debiana. Jego wersja jest dobierana zgodnie z repozytorium systemowym." data-options="npm — pakiet systemowy; npm_package — własna nazwa zmiennej; community.general.npm — moduł do pakietów npm"><span class="line-no">2</span><code>npm_package: npm</code><button class="code-info" type="button" aria-label="Objaśnij linię 2">ⓘ</button></li><li data-info-title="Wymagana główna wersja" data-info="Ta wartość służy do walidacji po instalacji. W Debianie 13 repozytorium dostarcza Node.js 20.x." data-options="20 — Node.js 20; 22 — nowsza linia, jeśli repozytorium ją udostępnia; exact — pełna wersja wymaga przypiętego repozytorium"><span class="line-no">3</span><code>nodejs_major_version: &quot;20&quot;</code><button class="code-info" type="button" aria-label="Objaśnij linię 3">ⓘ</button></li></ol></div></div></section><section class="slide" data-title="Demo — instalacja Node.js i npm"><div class="content"><div class="kicker">Demo 10 // zadanie</div><h2>Jedno zadanie używa obu zmiennych</h2><div class="code-demo" data-code-title="roles/common/tasks/main.yml — Node.js"><button class="code-expand" type="button" aria-label="Powiększ kod">⛶</button><ol class="code-lines"><li data-info-title="Nazwa zadania" data-info="Nazwa opisuje efekt, który zobaczymy w raporcie Ansible." data-options="when — warunkowe wykonanie; tags — filtrowanie zadań; notify — handler po zmianie"><span class="line-no">1</span><code>- name: Zainstaluj Node.js i npm</code><button class="code-info" type="button" aria-label="Objaśnij linię 1">ⓘ</button></li><li data-info-title="Moduł apt" data-info="Moduł apt zarządza pakietami Debiana i sprawdza, czy wymagany stan już istnieje." data-options="ansible.builtin.package — moduł ogólny; ansible.builtin.apt — Debian/Ubuntu; state: latest — najnowsza wersja z repozytorium"><span class="line-no">2</span><code>  ansible.builtin.apt:</code><button class="code-info" type="button" aria-label="Objaśnij linię 2">ⓘ</button></li><li data-info-title="Lista pakietów ze zmiennych" data-info="Lista pozwala zmienić pakiety w group_vars/all.yml bez edycji zadania." data-options="name: pakiet — jeden pakiet; lista — wiele pakietów; loop — osobne wykonanie"><span class="line-no">3</span><code>    name:</code><button class="code-info" type="button" aria-label="Objaśnij linię 3">ⓘ</button></li><li data-info-title="Node.js" data-info="Odwołanie do nazwy pakietu z group_vars/all.yml." data-options="{{ nodejs_package }} — wartość zmiennej; nodejs — wartość wpisana bezpośrednio"><span class="line-no">4</span><code>      - &quot;{{ nodejs_package }}&quot;</code><button class="code-info" type="button" aria-label="Objaśnij linię 4">ⓘ</button></li><li data-info-title="npm" data-info="Drugi pakiet jest zarządzany przez ten sam moduł i również pochodzi ze zmiennej." data-options="{{ npm_package }} — wartość zmiennej; npm — wartość wpisana bezpośrednio"><span class="line-no">5</span><code>      - &quot;{{ npm_package }}&quot;</code><button class="code-info" type="button" aria-label="Objaśnij linię 5">ⓘ</button></li><li data-info-title="Stan pakietów" data-info="present oznacza, że pakiety mają być zainstalowane, ale nie wymusza każdorazowej aktualizacji." data-options="present — zainstalowany; absent — usunięty; latest — najnowszy dostępny"><span class="line-no">6</span><code>    state: present</code><button class="code-info" type="button" aria-label="Objaśnij linię 6">ⓘ</button></li></ol></div></div></section><section class="slide" data-title="Demo — walidacja Node.js"><div class="content"><div class="kicker">Demo 11 // dowód wersji</div><h2>Instalację kończymy sprawdzeniem wersji</h2><div class="code-demo" data-code-title="site.yml — walidacja Node.js"><button class="code-expand" type="button" aria-label="Powiększ kod">⛶</button><ol class="code-lines"><li data-info-title="Pobranie wersji Node.js" data-info="Polecenie odczytuje wersję zainstalowaną na Debianie. Nie zmienia hosta." data-options="node --version — wersja Node.js; npm --version — wersja npm; register — zapisz wynik"><span class="line-no">1</span><code>- name: Sprawdź Node.js</code><button class="code-info" type="button" aria-label="Objaśnij linię 1">ⓘ</button></li><li data-info-title="Polecenie node" data-info="node --version zwraca wersję w formacie v20.x.y." data-options="command — uruchom program; shell — uruchom przez powłokę"><span class="line-no">2</span><code>  ansible.builtin.command: node --version</code><button class="code-info" type="button" aria-label="Objaśnij linię 2">ⓘ</button></li><li data-info-title="Brak zmiany" data-info="Sprawdzenie wersji jest diagnostyką, więc nie powinno być oznaczone jako changed." data-options="changed_when: false — raportuj brak zmiany; failed_when — własny warunek błędu"><span class="line-no">3</span><code>  changed_when: false</code><button class="code-info" type="button" aria-label="Objaśnij linię 3">ⓘ</button></li><li data-info-title="Walidacja wersji" data-info="Warunek może przerwać playbook, jeśli Debian nie ma wymaganej głównej wersji Node.js." data-options="assert — jawny warunek; failed_when — warunek błędu; regex — wzorzec wersji"><span class="line-no">4</span><code>  failed_when: node_version.stdout is not regex('^v' ~ nodejs_major_version)</code><button class="code-info" type="button" aria-label="Objaśnij linię 4">ⓘ</button></li></ol></div></div></section>`;
const factsSlide = document.querySelector('[data-title="Facts"]');
factsSlide?.insertAdjacentHTML("beforebegin", nodeVariablesSlides);

const factsDemoSlides = `<section class="slide" data-title="Demo — odczyt Facts"><div class="content"><div class="kicker">Demo 12 // facts</div><h2>Najpierw odczytujemy informacje o Debianie</h2><div class="code-demo" data-code-title="Polecenie setup — Facts"><button class="code-expand" type="button" aria-label="Powiększ kod">⛶</button><ol class="code-lines"><li data-info-title="Cel polecenia" data-info="Moduł setup zbiera facts, czyli informacje wykryte na hoście zarządzanym." data-options="ansible.builtin.setup — zbiera facts; ansible.builtin.gather_facts — automatyczne zbieranie w playbooku; gather_facts: false — wyłączenie zbierania"><span class="line-no">1</span><code>ansible debian_wsl -i inventory.yml -m ansible.builtin.setup \</code><button class="code-info" type="button" aria-label="Objaśnij linię 1">ⓘ</button></li><li data-info-title="Filtrowanie facts" data-info="Filtr ogranicza wynik do informacji o dystrybucji, dzięki czemu raport jest czytelny." data-options="filter=ansible_distribution* — nazwa i wersja dystrybucji; filter=ansible_architecture — architektura; filter=ansible_* — wszystkie facts ansible"><span class="line-no">2</span><code>  -a 'filter=ansible_distribution*'</code><button class="code-info" type="button" aria-label="Objaśnij linię 2">ⓘ</button></li></ol></div><p class="note">Facts są zbierane automatycznie na początku playa, chyba że wyłączymy je przez <code>gather_facts: false</code>.</p></div></section><section class="slide" data-title="Demo — walidacja Facts"><div class="content"><div class="kicker">Demo 13 // warunek</div><h2>Facts pozwalają sprawdzić założenia środowiska</h2><div class="code-demo" data-code-title="site.yml — assert Facts"><button class="code-expand" type="button" aria-label="Powiększ kod">⛶</button><ol class="code-lines"><li data-info-title="Nazwa zadania" data-info="Zadanie dokumentuje, jakie środowisko jest wymagane przez demo." data-options="assert — sprawdza warunki; debug — tylko wyświetla informacje; fail — kończy zadanie błędem"><span class="line-no">1</span><code>- name: Sprawdź środowisko Debian x86_64</code><button class="code-info" type="button" aria-label="Objaśnij linię 1">ⓘ</button></li><li data-info-title="Moduł assert" data-info="Moduł assert przerywa wykonanie hosta, jeśli którykolwiek warunek w that jest fałszywy." data-options="that — lista warunków; success_msg — komunikat sukcesu; fail_msg — komunikat błędu"><span class="line-no">2</span><code>  ansible.builtin.assert:</code><button class="code-info" type="button" aria-label="Objaśnij linię 2">ⓘ</button></li><li data-info-title="Lista warunków" data-info="Wszystkie warunki muszą być spełnione. Wartości pochodzą z facts zebranych przez Ansible." data-options="ansible_distribution — nazwa systemu; ansible_distribution_version — wersja; ansible_architecture — architektura"><span class="line-no">3</span><code>    that:</code><button class="code-info" type="button" aria-label="Objaśnij linię 3">ⓘ</button></li><li data-info-title="System operacyjny" data-info="Demo wymaga Debiana, więc playbook nie powinien uruchomić się na innym systemie." data-options="Debian — wartość dla Debiana; Ubuntu — inna dystrybucja; ansible_os_family — rodzina systemu"><span class="line-no">4</span><code>      - ansible_distribution == 'Debian'</code><button class="code-info" type="button" aria-label="Objaśnij linię 4">ⓘ</button></li><li data-info-title="Architektura CPU" data-info="Demo zakłada x86_64, ponieważ pakiety są przygotowane dla tej architektury." data-options="x86_64 — Intel/AMD 64-bit; aarch64 — ARM 64-bit; ansible_machine — alternatywny fact architektury"><span class="line-no">5</span><code>      - ansible_architecture == 'x86_64'</code><button class="code-info" type="button" aria-label="Objaśnij linię 5">ⓘ</button></li><li data-info-title="Komunikat błędu" data-info="Czytelny komunikat ułatwia zrozumienie, dlaczego playbook został zatrzymany." data-options="fail_msg — komunikat błędu; success_msg — komunikat sukcesu; quiet — ograniczenie komunikatów"><span class="line-no">6</span><code>    fail_msg: Projekt wymaga Debian x86_64.</code><button class="code-info" type="button" aria-label="Objaśnij linię 6">ⓘ</button></li></ol></div></div></section>`;
factsSlide?.insertAdjacentHTML("afterend", factsDemoSlides);
const nodeValidationDemo = document.querySelector('[data-title="Demo — walidacja Node.js"]');
if (nodeValidationDemo) {
  const validationLines = nodeValidationDemo.querySelectorAll(".code-lines > li");
  const registerLine = document.createElement("li");
  registerLine.dataset.infoTitle = "Zapisanie wyniku";
  registerLine.dataset.info = "register zapisuje wynik polecenia w zmiennej node_version, której używamy później w warunku failed_when.";
  registerLine.dataset.options = "register — nazwa zmiennej wyniku; stdout — standardowe wyjście; rc — kod zakończenia";
  registerLine.innerHTML = `<span class="line-no">3</span><code>  register: node_version</code><button class="code-info" type="button" aria-label="Objaśnij linię 3">ⓘ</button>`;
  validationLines[2].before(registerLine);
  [...nodeValidationDemo.querySelectorAll(".code-lines > li")].forEach((line, index) => {
    line.querySelector(".line-no").textContent = String(index + 1);
    line.querySelector(".code-info").setAttribute("aria-label", `Objaśnij linię ${index + 1}`);
  });
  const versionCondition = nodeValidationDemo.querySelectorAll(".code-lines > li")[4];
  versionCondition.querySelector("code").textContent = "  failed_when: not node_version.stdout.startswith('v' ~ nodejs_major_version ~ '.')";
  versionCondition.dataset.options = "startswith — sprawdza początek tekstu; failed_when — warunek błędu; nodejs_major_version — wymagana główna wersja";
}

const handlersSlide = document.querySelector('[data-title="Handlers"]');
const handlersDemoSlides = `<section class="slide" data-title="Demo — zadanie z notify"><div class="content"><div class="kicker">Demo 14 // handler</div><h2>Zadanie zgłasza zmianę przez notify</h2><div class="code-demo" data-code-title="roles/common/tasks/main.yml — notify"><button class="code-expand" type="button" aria-label="Powiększ kod">⛶</button><ol class="code-lines"><li data-info-title="Nazwa zadania" data-info="Zadanie zapisuje demonstracyjną konfigurację na Debianie." data-options="copy — zapisuje plik; template — generuje plik z szablonu; lineinfile — zarządza pojedynczą linią"><span class="line-no">1</span><code>- name: Zapisz demonstracyjną konfigurację</code><button class="code-info" type="button" aria-label="Objaśnij linię 1">ⓘ</button></li><li data-info-title="Moduł copy" data-info="Moduł copy porównuje istniejący plik z deklarowaną treścią i zapisuje go tylko wtedy, gdy treść się różni." data-options="src — kopiuj plik źródłowy; content — treść podana inline; backup — utwórz kopię przed zmianą"><span class="line-no">2</span><code>  ansible.builtin.copy:</code><button class="code-info" type="button" aria-label="Objaśnij linię 2">ⓘ</button></li><li data-info-title="Ścieżka pliku" data-info="Ścieżka jest zmienną z group_vars/all.yml, więc można ją zmienić bez edycji zadania." data-options="dest — plik docelowy; directory_mode — prawa katalogu; force — wymuś zastąpienie pliku"><span class="line-no">3</span><code>    dest: "{{ demo_config_path }}"</code><button class="code-info" type="button" aria-label="Objaśnij linię 3">ⓘ</button></li><li data-info-title="Deklarowana treść" data-info="Treść pliku korzysta ze zmiennej demo_packages. Zmiana tej wartości może uruchomić handler." data-options="content — treść inline; newline_sequence — rodzaj końca linii; decrypt — odszyfrowanie Vault"><span class="line-no">4</span><code>    content: "demo_packages={{ demo_packages | join(',') }}\\n"</code><button class="code-info" type="button" aria-label="Objaśnij linię 4">ⓘ</button></li><li data-info-title="Prawa pliku" data-info="Ustawia prawa odczytu i zapisu dla właściciela oraz odczytu dla pozostałych użytkowników." data-options="mode: '0644' — właściciel zapisuje, pozostali czytają; owner — właściciel; group — grupa"><span class="line-no">5</span><code>    mode: '0644'</code><button class="code-info" type="button" aria-label="Objaśnij linię 5">ⓘ</button></li><li data-info-title="Powiadomienie handlera" data-info="Handler o tej nazwie zostanie uruchomiony na końcu playa, ale tylko jeśli copy faktycznie zmieni plik." data-options="notify — uruchom handler po zmianie; listen — alternatywna etykieta handlera; changed_when — kontrola statusu zmiany"><span class="line-no">6</span><code>  notify: Pokaż zmianę konfiguracji</code><button class="code-info" type="button" aria-label="Objaśnij linię 6">ⓘ</button></li></ol></div></div></section><section class="slide" data-title="Demo — definicja handlera"><div class="content"><div class="kicker">Demo 15 // handler</div><h2>Handler reaguje tylko na zmianę</h2><div class="code-demo" data-code-title="roles/common/handlers/main.yml"><button class="code-expand" type="button" aria-label="Powiększ kod">⛶</button><ol class="code-lines"><li data-info-title="Nazwa handlera" data-info="Nazwa musi być identyczna z wartością notify w zadaniu." data-options="name — nazwa handlera; listen — dodatkowa etykieta powiadomienia; meta: flush_handlers — wcześniejsze uruchomienie"><span class="line-no">1</span><code>- name: Pokaż zmianę konfiguracji</code><button class="code-info" type="button" aria-label="Objaśnij linię 1">ⓘ</button></li><li data-info-title="Moduł debug" data-info="Debug tylko wyświetla komunikat. W realnym przykładzie handler może zrestartować usługę." data-options="ansible.builtin.service — restart usługi; ansible.builtin.systemd — zarządzanie systemd; debug — komunikat demonstracyjny"><span class="line-no">2</span><code>  ansible.builtin.debug:</code><button class="code-info" type="button" aria-label="Objaśnij linię 2">ⓘ</button></li><li data-info-title="Komunikat" data-info="Wartość demo_config_path pochodzi ze zmiennych i pokazuje, który plik został zmieniony." data-options="msg — komunikat; var — wyświetl wartość zmiennej; verbosity — pokaż przy określonym poziomie -v"><span class="line-no">3</span><code>    msg: "Zmieniono {{ demo_config_path }}"</code><button class="code-info" type="button" aria-label="Objaśnij linię 3">ⓘ</button></li></ol></div><p class="note">Pierwsze wykonanie może uruchomić handler. Drugie, gdy plik się nie zmienił, nie uruchomi go ponownie.</p></div></section>`;
handlersSlide?.insertAdjacentHTML("afterend", handlersDemoSlides);

const roleSlide = document.querySelector('[data-title="Role"]');
const roleDemoSlides = `<section class="slide" data-title="Demo — struktura roli Java"><div class="content"><div class="kicker">Demo 16 // role</div><h2>Rola Java ma własną odpowiedzialność</h2><div class="code-demo" data-code-title="roles/java/"><button class="code-expand" type="button" aria-label="Powiększ kod">⛶</button><ol class="code-lines"><li data-info-title="Defaults roli" data-info="Domyślne wartości pakietów są zapisane wewnątrz roli, ale można je nadpisać w group_vars." data-options="defaults/main.yml — wartości domyślne; vars/main.yml — wartości o wyższym priorytecie; group_vars/all.yml — konfiguracja grupy"><span class="line-no">1</span><code>roles/java/defaults/main.yml</code><button class="code-info" type="button" aria-label="Objaśnij linię 1">ⓘ</button></li><li data-info-title="Zadania roli" data-info="Główna logika instalacji znajduje się w tasks/main.yml. Playbook nie musi znać szczegółów modułu apt." data-options="tasks/main.yml — zadania; handlers/main.yml — reakcje na zmianę; templates/ — szablony plików"><span class="line-no">2</span><code>roles/java/tasks/main.yml</code><button class="code-info" type="button" aria-label="Objaśnij linię 2">ⓘ</button></li><li data-info-title="Włączenie roli" data-info="Playbook uruchamia rolę przez nazwę java. Ansible automatycznie ładuje jej defaults i tasks." data-options="roles — lista ról; include_role — rola warunkowa; import_role — rola importowana wcześniej"><span class="line-no">3</span><code>roles:</code><button class="code-info" type="button" aria-label="Objaśnij linię 3">ⓘ</button></li><li data-info-title="Rola java" data-info="Ta jedna linia uruchamia całą odpowiedzialność roli Java." data-options="java — nazwa katalogu roli; common — narzędzia wspólne; role dependencies — zależności w meta/main.yml"><span class="line-no">4</span><code>  - java</code><button class="code-info" type="button" aria-label="Objaśnij linię 4">ⓘ</button></li></ol></div></div></section><section class="slide" data-title="Demo — instalacja Java i Maven"><div class="content"><div class="kicker">Demo 17 // zadanie roli</div><h2>Rola instaluje Java i Maven przez zmienne</h2><div class="code-demo" data-code-title="roles/java/tasks/main.yml"><button class="code-expand" type="button" aria-label="Powiększ kod">⛶</button><ol class="code-lines"><li data-info-title="Nazwa zadania" data-info="Opisuje efekt roli i pojawi się w raporcie wykonania." data-options="name — nazwa zadania; tags — filtrowanie; when — warunek wykonania"><span class="line-no">1</span><code>- name: Zainstaluj Java i Maven</code><button class="code-info" type="button" aria-label="Objaśnij linię 1">ⓘ</button></li><li data-info-title="Moduł apt" data-info="Moduł apt zarządza pakietami Debiana i jest idempotentny." data-options="ansible.builtin.package — moduł ogólny; ansible.builtin.apt — Debian/Ubuntu; update_cache — odśwież indeks pakietów"><span class="line-no">2</span><code>  ansible.builtin.apt:</code><button class="code-info" type="button" aria-label="Objaśnij linię 2">ⓘ</button></li><li data-info-title="Lista pakietów" data-info="Rola instaluje dwa pakiety wskazane przez zmienne z defaults/main.yml." data-options="name — jeden pakiet lub lista; loop — iteracja; package — nazwa pakietu systemowego"><span class="line-no">3</span><code>    name:</code><button class="code-info" type="button" aria-label="Objaśnij linię 3">ⓘ</button></li><li data-info-title="Java" data-info="openjdk-21-jdk dostarcza JDK, czyli środowisko potrzebne do kompilowania aplikacji Java." data-options="openjdk-21-jdk — JDK 21; openjdk-17-jdk — JDK 17; default-jdk — domyślne JDK dystrybucji"><span class="line-no">4</span><code>      - "{{ java_package }}"</code><button class="code-info" type="button" aria-label="Objaśnij linię 4">ⓘ</button></li><li data-info-title="Maven" data-info="Pakiet maven dostarcza polecenie mvn i narzędzia do budowania projektów Java." data-options="maven — Maven z repozytorium; gradle — alternatywne narzędzie budowania; maven_version — własna zmienna wersji"><span class="line-no">5</span><code>      - "{{ maven_package }}"</code><button class="code-info" type="button" aria-label="Objaśnij linię 5">ⓘ</button></li><li data-info-title="Stan pakietów" data-info="present zapewnia obecność pakietów, ale nie wykonuje ponownej instalacji, gdy już istnieją." data-options="present — zainstalowany; absent — usunięty; latest — najnowszy dostępny"><span class="line-no">6</span><code>    state: present</code><button class="code-info" type="button" aria-label="Objaśnij linię 6">ⓘ</button></li></ol></div></div></section><section class="slide" data-title="Demo — walidacja Java i Maven"><div class="content"><div class="kicker">Demo 18 // walidacja</div><h2>Na końcu potwierdzamy dostępność narzędzi</h2><div class="code-demo" data-code-title="site.yml — walidacja Java i Maven"><button class="code-expand" type="button" aria-label="Powiększ kod">⛶</button><ol class="code-lines"><li data-info-title="Wersja Java" data-info="java --version zwraca wersję JDK zainstalowanego przez rolę." data-options="java --version — wersja Java; javac --version — wersja kompilatora; changed_when: false — test bez zmiany"><span class="line-no">1</span><code>- name: Sprawdź Java</code><button class="code-info" type="button" aria-label="Objaśnij linię 1">ⓘ</button></li><li data-info-title="Polecenie Java" data-info="command uruchamia program na Debianie i zwraca jego wynik." data-options="command — bez powłoki; shell — przez powłokę; register — zapisz wynik"><span class="line-no">2</span><code>  ansible.builtin.command: java --version</code><button class="code-info" type="button" aria-label="Objaśnij linię 2">ⓘ</button></li><li data-info-title="Wersja Maven" data-info="mvn --version potwierdza Maven oraz pokazuje używaną wersję Java." data-options="mvn --version — wersja Maven i Java; mvn -q --version — krótszy wynik; changed_when: false — brak zmiany"><span class="line-no">3</span><code>- name: Sprawdź Maven</code><button class="code-info" type="button" aria-label="Objaśnij linię 3">ⓘ</button></li><li data-info-title="Polecenie Maven" data-info="Test nie zmienia hosta, więc raportujemy ok zamiast changed." data-options="register — zapisz wynik; failed_when — własny warunek błędu; changed_when — ustaw stan zadania"><span class="line-no">4</span><code>  ansible.builtin.command: mvn --version</code><button class="code-info" type="button" aria-label="Objaśnij linię 4">ⓘ</button></li></ol></div></div></section>`;
roleSlide?.insertAdjacentHTML("afterend", roleDemoSlides);

const secretsSlide = document.querySelector('[data-title="Sekrety"]');
const secretsDemoSlides = `<section class="slide" data-title="Demo — Ansible Vault"><div class="content"><div class="kicker">Demo 19 // sekret</div><h2>Szyfrujemy zmienne przed zapisaniem do repozytorium</h2><div class="code-demo" data-code-title="Ansible Vault — terminal"><button class="code-expand" type="button" aria-label="Powiększ kod">⛶</button><ol class="code-lines"><li data-info-title="Utworzenie pliku Vault" data-info="Tworzy plik zmiennych i od razu otwiera go w edytorze. Zawartość zostanie zaszyfrowana przez Ansible Vault." data-options="create — utwórz nowy zaszyfrowany plik; encrypt — zaszyfruj istniejący plik; edit — edytuj zaszyfrowany plik"><span class="line-no">1</span><code>ansible-vault create group_vars/vault.yml</code><button class="code-info" type="button" aria-label="Objaśnij linię 1">ⓘ</button></li><li data-info-title="Podgląd pliku" data-info="Wyświetla zawartość po podaniu hasła Vault, ale nie zapisuje jej w jawnym tekście." data-options="view — odczyt bez edycji; decrypt — odszyfruj plik na stałe; rekey — zmień hasło Vault"><span class="line-no">2</span><code>ansible-vault view group_vars/vault.yml</code><button class="code-info" type="button" aria-label="Objaśnij linię 2">ⓘ</button></li><li data-info-title="Uruchomienie z Vault" data-info="Playbook otrzymuje hasło do odszyfrowania zmiennych podczas uruchomienia. Hasła nie zapisujemy w inventory." data-options="--ask-vault-pass — pytaj o hasło; --vault-password-file — pobierz z pliku; --vault-id — wybierz identyfikator Vault"><span class="line-no">3</span><code>ansible-playbook -i inventory.yml site.yml --ask-vault-pass</code><button class="code-info" type="button" aria-label="Objaśnij linię 3">ⓘ</button></li></ol></div><p class="note">Hasło Vault przechowujemy poza repozytorium. Do repozytorium trafia wyłącznie zaszyfrowany plik.</p></div></section><section class="slide" data-title="Demo — użycie sekretu"><div class="content"><div class="kicker">Demo 20 // no_log</div><h2>Sekret nie powinien pojawić się w raporcie</h2><div class="code-demo" data-code-title="roles/common/tasks/main.yml — sekret"><button class="code-expand" type="button" aria-label="Powiększ kod">⛶</button><ol class="code-lines"><li data-info-title="Zadanie korzystające z sekretu" data-info="Zmienna demo_secret pochodzi z zaszyfrowanego group_vars/vault.yml." data-options="vars — zmienna jawna; group_vars — zmienne grupy; vault.yml — zaszyfrowane zmienne"><span class="line-no">1</span><code>- name: Użyj sekretu w zadaniu</code><button class="code-info" type="button" aria-label="Objaśnij linię 1">ⓘ</button></li><li data-info-title="Polecenie" data-info="Przykładowe polecenie używa sekretu jako argumentu. W prawdziwym zadaniu może to być rejestracja usługi lub konfiguracja narzędzia." data-options="command — bez powłoki; shell — przez powłokę; template — zapis do pliku konfiguracyjnego"><span class="line-no">2</span><code>  ansible.builtin.command: /usr/bin/true</code><button class="code-info" type="button" aria-label="Objaśnij linię 2">ⓘ</button></li><li data-info-title="Sekret jako argument" data-info="Zmienna jest dostępna dla zadania, ale nie powinna być wypisywana wprost w komunikacie." data-options="{{ demo_secret }} — wartość sekretna; no_log — ukryj dane w raporcie; environment — przekaż zmienną środowiskową"><span class="line-no">3</span><code>  environment:</code><button class="code-info" type="button" aria-label="Objaśnij linię 3">ⓘ</button></li><li data-info-title="Ukrycie logów" data-info="no_log: true ukrywa argumenty i wynik zadania, aby sekret nie trafił do terminala ani logów CI." data-options="true — ukryj dane; false — jawny raport, niewłaściwe dla sekretów; module_defaults — ustawienie domyślne dla grupy zadań"><span class="line-no">4</span><code>  no_log: true</code><button class="code-info" type="button" aria-label="Objaśnij linię 4">ⓘ</button></li></ol></div></div></section>`;
secretsSlide?.insertAdjacentHTML("afterend", secretsDemoSlides);
const secretDemo = document.querySelector('[data-title="Demo — użycie sekretu"]');
if (secretDemo) {
  const secretLines = secretDemo.querySelectorAll(".code-lines > li");
  secretLines[1].querySelector("code").textContent = "  ansible.builtin.command: /usr/bin/true";
  const environmentLine = document.createElement("li");
  environmentLine.dataset.infoTitle = "Wartość sekretu";
  environmentLine.dataset.info = "Sekret jest przekazywany jako zmienna środowiskowa, a nie wpisywany jawnie do komendy.";
  environmentLine.dataset.options = "environment — zmienne środowiskowe zadania; DEMO_SECRET — nazwa zmiennej procesu; no_log — ukrycie raportu";
  environmentLine.innerHTML = `<span class="line-no">4</span><code>    DEMO_SECRET: "{{ demo_secret }}"</code><button class="code-info" type="button" aria-label="Objaśnij linię 4">ⓘ</button>`;
  secretLines[2].after(environmentLine);
  [...secretDemo.querySelectorAll(".code-lines > li")].forEach((line, index) => {
    line.querySelector(".line-no").textContent = String(index + 1);
    line.querySelector(".code-info").setAttribute("aria-label", `Objaśnij linię ${index + 1}`);
  });
}

const demoLocations = [
  ["Demo — wymagania", "PowerShell oraz terminal Ubuntu WSL — bez modyfikacji pliku"],
  ["Demo — instalacja Ansible", "terminal Ubuntu WSL — bez modyfikacji pliku"],
  ["Demo — przygotowanie Debiana", "PowerShell i terminal Debian WSL — bez modyfikacji pliku"],
  ["Demo — pierwszy inventory", "inventory.yml"],
  ["Demo — sprawdzenie hosta", "terminal Ubuntu WSL, bieżący katalog ansible-demo-start"],
  ["Demo — pierwszy playbook", "site.yml"],
  ["Demo — instalacja gh", "site.yml"],
  ["Demo — uruchomienie i idempotencja", "terminal Ubuntu WSL, bieżący katalog"]
];
demoLocations.push(
  ["Demo — zmienne Node.js", "group_vars/all.yml"],
  ["Demo — instalacja Node.js i npm", "roles/common/tasks/main.yml"],
  ["Demo — walidacja Node.js", "site.yml"],
  ["Demo — odczyt Facts", "terminal Ubuntu WSL, bieżący katalog"],
  ["Demo — walidacja Facts", "site.yml"],
  ["Demo — zadanie z notify", "roles/common/tasks/main.yml"],
  ["Demo — definicja handlera", "roles/common/handlers/main.yml"],
  ["Demo — struktura roli Java", "roles/java/ oraz site.yml"],
  ["Demo — instalacja Java i Maven", "roles/java/tasks/main.yml"],
  ["Demo — walidacja Java i Maven", "site.yml"],
  ["Demo — Ansible Vault", "group_vars/vault.yml"],
  ["Demo — użycie sekretu", "roles/common/tasks/main.yml"]
);
for (const [title, location] of demoLocations) {
  const demoSlide = [...document.querySelectorAll(".slide")].find((slide) => slide.dataset.title === title);
  if (!demoSlide || demoSlide.querySelector(".demo-location")) continue;
  const heading = demoSlide.querySelector("h2");
  if (!heading) continue;
  const locationNote = document.createElement("p");
  locationNote.className = "demo-location";
  locationNote.innerHTML = `<span>Plik / miejsce:</span> <code>${location}</code>`;
  heading.after(locationNote);
}

const codeDialog = document.createElement("dialog");
codeDialog.className = "code-modal";
codeDialog.innerHTML = `<div class="code-modal__frame"><button class="code-modal__close" type="button" aria-label="Zamknij kod">×</button><button class="code-modal__copy" type="button" aria-label="Skopiuj kod">⧉</button><div class="code-modal__eyebrow"></div><h3 class="code-modal__title"></h3><div class="code-modal__body"></div></div>`;
document.body.append(codeDialog);

const codeDialogClose = codeDialog.querySelector(".code-modal__close");
const codeDialogEyebrow = codeDialog.querySelector(".code-modal__eyebrow");
const codeDialogTitle = codeDialog.querySelector(".code-modal__title");
const codeDialogBody = codeDialog.querySelector(".code-modal__body");
const codeDialogCopy = codeDialog.querySelector(".code-modal__copy");
let codeDialogOpener = null;
let codeDialogText = "";

const copyText = async (value, button) => {
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    const helper = document.createElement("textarea");
    helper.value = value;
    helper.setAttribute("readonly", "");
    helper.style.position = "fixed";
    helper.style.opacity = "0";
    document.body.append(helper);
    helper.select();
    document.execCommand("copy");
    helper.remove();
  }
  const original = button.textContent;
  button.textContent = "✓";
  button.setAttribute("aria-label", "Kod skopiowany");
  window.setTimeout(() => {
    button.textContent = original;
    button.setAttribute("aria-label", "Skopiuj kod");
  }, 1400);
};

const codeTextFromLines = (lines) => [...lines.querySelectorAll(":scope > li code")]
  .map((line) => line.textContent.replace(/\\$/u, ""))
  .join("\n");

const closeCodeDialog = () => {
  codeDialog.close();
  codeDialogOpener?.focus();
};

const openCodeInfo = (button) => {
  const line = button.closest(".code-lines > li");
  if (!line) return;
  codeDialogOpener = button;
  codeDialogCopy.hidden = true;
  codeDialogEyebrow.textContent = `Linia ${line.querySelector(".line-no")?.textContent || ""}`;
  codeDialogTitle.textContent = line.dataset.infoTitle || "Objaśnienie ustawienia";
  const options = line.dataset.options
    ? `<h4>Dostępne warianty</h4><ul>${line.dataset.options.split(";").map((option) => `<li>${option.trim()}</li>`).join("")}</ul>`
    : "";
  codeDialogBody.innerHTML = `<pre class="code-modal__snippet"><code></code></pre><p>${line.dataset.info || "Brak dodatkowego opisu."}</p>${options}`;
  codeDialogBody.querySelector("code").textContent = line.querySelector("code")?.textContent || "";
  codeDialog.showModal();
  codeDialogClose.focus();
};

const openCodeExpanded = (button) => {
  const demo = button.closest(".code-demo");
  const lines = demo?.querySelector(".code-lines");
  if (!demo || !lines) return;
  codeDialogOpener = button;
  codeDialogCopy.hidden = false;
  codeDialogEyebrow.textContent = "Kod demonstracyjny";
  codeDialogTitle.textContent = demo.dataset.codeTitle || "Kod";
  codeDialogBody.innerHTML = "";
  const expandedLines = lines.cloneNode(true);
  expandedLines.classList.add("code-lines--expanded");
  codeDialogText = codeTextFromLines(lines);
  codeDialogBody.append(expandedLines);
  codeDialog.showModal();
  codeDialogClose.focus();
};

document.addEventListener("click", (event) => {
  const infoButton = event.target.closest?.(".code-info");
  if (infoButton) openCodeInfo(infoButton);
  const expandButton = event.target.closest?.(".code-expand");
  if (expandButton) openCodeExpanded(expandButton);
});
document.querySelectorAll(".code-demo").forEach((demo) => {
  const expandButton = demo.querySelector(".code-expand");
  const isTerminalDemo = ["Wymagania", "Instalacja Ansible", "Instalacja Debiana", "Polecenie setup", "Ansible Vault", "Pierwsze polecenia", "Uruchomienie playbooka"]
    .some((prefix) => demo.dataset.codeTitle?.startsWith(prefix));
  if (isTerminalDemo) demo.classList.add("code-demo--terminal");
  const copyButton = document.createElement("button");
  copyButton.className = "code-copy";
  copyButton.type = "button";
  copyButton.textContent = "⧉";
  copyButton.setAttribute("aria-label", "Skopiuj kod");
  copyButton.addEventListener("click", () => copyText(codeTextFromLines(demo.querySelector(".code-lines")), copyButton));
  expandButton?.before(copyButton);
  if (isTerminalDemo) {
    demo.querySelectorAll(".code-lines > li").forEach((line) => {
      const lineCopyButton = document.createElement("button");
      lineCopyButton.className = "code-line-copy";
      lineCopyButton.type = "button";
      lineCopyButton.textContent = "⧉";
      lineCopyButton.setAttribute("aria-label", `Skopiuj komendę z linii ${line.querySelector(".line-no")?.textContent || ""}`);
      lineCopyButton.addEventListener("click", () => copyText(line.querySelector("code")?.textContent || "", lineCopyButton));
      line.append(lineCopyButton);
    });
  }
});
codeDialogCopy.addEventListener("click", () => copyText(codeDialogText, codeDialogCopy));
codeDialogClose.addEventListener("click", closeCodeDialog);
codeDialog.addEventListener("click", (event) => {
  if (event.target === codeDialog) closeCodeDialog();
});
codeDialog.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeCodeDialog();
});

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
