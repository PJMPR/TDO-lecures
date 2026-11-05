const explanations = {
  "Problem orkiestracji": ["Dlaczego orkiestracja?", "Docker uruchamia pojedyncze kontenery, ale nie koordynuje samodzielnie wielu instancji na wielu maszynach. Orkiestrator stale obserwuje system i reaguje na awarie, wzrost ruchu oraz zmianę wersji."],
  "Czym jest Kubernetes": ["Orkiestracja", "Kubernetes jest warstwą sterującą nad runtime kontenerów. Użytkownik deklaruje oczekiwany rezultat, a platforma wybiera miejsce uruchomienia i pilnuje zgodności klastra z deklaracją."],
  "Deklaratywny model": ["Pętla uzgadniania", "Kontroler porównuje stan oczekiwany z rzeczywistym. Jeśli brakuje repliki, tworzy ją; jeśli jest ich za dużo, usuwa nadmiarową. Ta pętla działa stale, nie tylko podczas wdrożenia."],
  "Jak działa kontroler": ["Kontroler Kubernetes", "Kontroler to stale działająca pętla sterująca. Obserwuje wybrany rodzaj obiektów API, porównuje ich specyfikację ze stanem klastra i wykonuje działania prowadzące do zgodności."],
  "Rodzaje kontrolerów": ["Kontrolery i operatory", "Kontrolery różnią się odpowiedzialnością, lecz korzystają z tego samego modelu obserwacji i uzgadniania. Operator jest kontrolerem rozszerzonym o wiedzę dotyczącą cyklu życia konkretnej aplikacji."],
  "Kubernetes w deployment pipeline": ["Rola Kubernetes w CI/CD", "CI weryfikuje kod i buduje niezmienny obraz. CD wskazuje jego nową wersję. Kubernetes doprowadza środowisko do nowego stanu i utrzymuje aplikację po wdrożeniu."],
  "Podstawowe funkcje": ["Automatyzacja operacyjna", "Scheduler rozmieszcza Pody, kontrolery je odtwarzają i skalują, Service zapewnia stabilny adres, a Deployment kontroluje wymianę wersji."],
  "Architektura klastra": ["Control plane i nody robocze", "Control plane przechowuje stan i podejmuje decyzje. Worker nodes wykonują workloady. Dzięki temu wieloma maszynami zarządza się jak jednym klastrem."],
  "Pod": ["Dlaczego Pod?", "Pod jest jednostką planowania. Jego kontenery są zawsze umieszczane razem i mogą komunikować się przez localhost. Najczęściej Pod zawiera jeden główny kontener aplikacji."],
  "Deployment": ["Łańcuch odpowiedzialności", "Deployment opisuje wersję i strategię aktualizacji. Tworzy ReplicaSet odpowiedzialny za liczbę replik, a ReplicaSet tworzy Pody."],
  "Labels i selektory": ["Dynamiczne powiązanie", "Etykieta to metadana klucz–wartość. Selektor wybiera pasujące obiekty, dlatego nowy Pod automatycznie może trafić za ten sam Service."],
  "Service": ["Stabilny punkt dostępu", "Pody są wymienne i zmieniają adresy. Service ma stałą nazwę DNS i kieruje ruch do aktualnie gotowych Podów pasujących do selektora."],
  "Ingress": ["Routing HTTP", "Ingress opisuje reguły hostów i ścieżek. Faktyczny ruch obsługuje Ingress Controller, który konfiguruje reverse proxy prowadzące do Service."],
  "Konfiguracja Ingress": ["Manifest Ingress", "Reguła Ingress dopasowuje host i ścieżkę żądania HTTP, a następnie wskazuje nazwę Service oraz jego port. Service odpowiada za dalsze przekazanie ruchu do gotowego Poda."],
  "ConfigMap i Secret": ["Konfiguracja poza obrazem", "Ten sam obraz może działać w wielu środowiskach. ConfigMap przechowuje zwykłe ustawienia, a Secret dane wymagające ograniczenia dostępu. Base64 nie jest szyfrowaniem."],
  "Namespace": ["Namespace Kubernetes", "Namespace tworzy logiczną przestrzeń nazw dla zasobów namespaced. Pozwala grupować obiekty, rozdzielać identyczne nazwy oraz stosować reguły dostępu, limity i polityki do wybranego obszaru klastra."],
  "Probes": ["Trzy niezależne sygnały", "Startup chroni wolny start. Readiness steruje dopuszczeniem ruchu. Liveness wykrywa proces, który wymaga restartu."],
  "Zasoby i skalowanie": ["Requests, limits i repliki", "Request pomaga schedulerowi zarezerwować miejsce. Limit wyznacza górną granicę. Skalowanie poziome dodaje Pody, ale nie zastępuje właściwego doboru zasobów instancji."],
  "Dane i inne workloady": ["Kontroler dobrany do cyklu życia", "Deployment pasuje do wymiennych instancji stateless. StatefulSet zachowuje tożsamość, DaemonSet wiąże workload z nodami, a Job kończy się po wykonaniu zadania."],
  "Podsumowanie": ["Przepływ żądania", "Ingress przyjmuje ruch HTTP i wybiera Service. Service wybiera gotowy Pod. Deployment nie obsługuje ruchu — pilnuje liczby Podów i wersji obrazu."]
};

const conceptDefinitions = {
  "desired state yaml / api": "Stan oczekiwany to deklaracja zapisana w obiektach API Kubernetes. Opisuje rezultat, który ma być stale utrzymywany, na przykład liczbę replik i wersję obrazu.",
  "controller loop": "Pętla kontrolera cyklicznie porównuje deklarację ze stanem klastra i wykonuje działania naprawcze. Jest podstawowym mechanizmem automatyzacji Kubernetes.",
  "obserwuj api": "Kontroler śledzi zdarzenia i bieżące obiekty udostępnione przez API Server. Interesuje go zwykle konkretny rodzaj zasobu, na przykład Deployment albo Node.",
  "porównaj stany": "Kontroler zestawia stan oczekiwany zapisany w specyfikacji obiektu ze stanem rzeczywistym zaobserwowanym w klastrze.",
  "wykonaj zmianę": "Gdy występuje różnica, kontroler tworzy, aktualizuje lub usuwa zasoby. Następnie ponownie obserwuje rezultat — dlatego mechanizm tworzy zamkniętą pętlę.",
  "kontroler": "Kontroler implementuje jedną odpowiedzialność, np. utrzymanie replik. Nie wykonuje całego Kubernetes — współpracuje z innymi kontrolerami przez wspólne API.",
  "operator": "Operator zwykle łączy kontroler z własnymi typami zasobów CRD. Może automatyzować aktualizację aplikacji, zmianę konfiguracji lub wykonywanie kopii zapasowej.",
  "kontroler wbudowana pętla pilnująca konkretnego stanu, np. liczby replik.": "Kontroler implementuje jedną odpowiedzialność, np. utrzymanie replik. Nie wykonuje całego Kubernetes — współpracuje z innymi kontrolerami przez wspólne API.",
  "operator niestandardowy kontroler z wiedzą operacyjną o konkretnej aplikacji.": "Operator zwykle łączy kontroler z własnymi typami zasobów CRD. Może automatyzować aktualizację klastra bazy, zmianę konfiguracji lub wykonywanie kopii zapasowej.",
  "ingress controller odczytuje reguły ingress i konfiguruje obsługę ruchu http.": "Ingress Controller obserwuje obiekty Ingress i przekłada reguły na konfigurację proxy lub load balancera. Bez niego sam obiekt Ingress nie obsłuży żądania.",
  "actual state klaster": "Stan rzeczywisty to to, co obecnie działa w klastrze: istniejące Pody, ich kondycja, rozmieszczenie oraz dostępne zasoby.",
  "commit": "Commit jest konkretną, wersjonowaną zmianą kodu. Stanowi jednoznaczne wejście procesu CI/CD.",
  "ci: test": "CI automatycznie kompiluje i testuje zmianę. Zatrzymuje wadliwy kod, zanim powstanie artefakt przeznaczony do wdrożenia.",
  "image": "Obraz kontenera jest niezmiennym pakietem aplikacji i jej runtime. Tag lub digest wskazuje wersję uruchamianą przez Kubernetes.",
  "registry": "Registry przechowuje i udostępnia obrazy kontenerów. Nody klastra pobierają z niego wersję wskazaną w manifeście.",
  "kubernetes": "Na tym etapie Kubernetes pobiera obraz, tworzy Pody, wykonuje rollout i utrzymuje zadeklarowaną liczbę zdrowych replik.",
  "scheduling": "Scheduling to wybór noda, na którym może działać Pod. Scheduler uwzględnia wymagane zasoby, ograniczenia i aktualne obciążenie klastra.",
  "self-healing": "Self-healing oznacza automatyczne odtwarzanie brakujących replik oraz restartowanie kontenerów zgodnie z polityką i wynikami sond.",
  "service discovery": "Service discovery zapewnia stabilną nazwę DNS usługi, mimo że Pody i ich adresy IP mogą się zmieniać.",
  "scaling": "Skalowanie zmienia liczbę replik aplikacji. Może być wykonane ręcznie albo automatycznie na podstawie metryk.",
  "rollout": "Rollout to kontrolowana wymiana starej wersji Podów na nową, z obserwacją gotowości i możliwością wycofania zmiany.",
  "configuration": "Konfiguracja jest dostarczana niezależnie od obrazu, najczęściej przez ConfigMap, Secret, zmienne środowiskowe lub wolumeny.",
  "oom — out of memory": "OOM oznacza brak dostępnej pamięci. Gdy kontener przekroczy limit pamięci, jądro systemu może zakończyć proces. W statusie Poda często pojawi się wtedy przyczyna OOMKilled.",
  "hpa — horizontal pod autoscaler": "HPA to kontroler automatycznego skalowania poziomego. Obserwuje metryki i zmienia pole replicas w zarządzanym workloadzie, aby dopasować liczbę Podów do obciążenia.",
  "kube-apiserver": "API Server jest centralnym punktem komunikacji z klastrem. Waliduje żądania i udostępnia obiekty Kubernetes wszystkim pozostałym komponentom.",
  "etcd": "etcd jest silnie spójną bazą klucz–wartość przechowującą stan i konfigurację klastra.",
  "scheduler": "Scheduler obserwuje Pody bez przypisanego noda i wybiera dla nich najlepsze miejsce uruchomienia.",
  "controller-manager": "Controller Manager uruchamia kontrolery, które uzgadniają stan Deploymentów, ReplicaSetów, nodów i innych obiektów.",
  "kubelet": "Kubelet jest agentem na nodzie. Odbiera deklarację Poda i współpracuje z runtime, aby uruchomić oraz monitorować kontenery.",
  "container runtime": "Runtime kontenerów pobiera obrazy i uruchamia procesy kontenerów. Kubernetes komunikuje się z nim przez standard CRI.",
  "sieć klastra": "Sieć klastra umożliwia komunikację Pod–Pod i implementację routingu Service bez ręcznego zarządzania adresami.",
  "pody aplikacji": "Pody aplikacji są rzeczywistymi jednostkami wykonawczymi działającymi na nodzie i zarządzanymi przez kubelet.",
  "deployment": "Deployment deklaruje wersję aplikacji, liczbę replik oraz strategię aktualizacji Podów stateless.",
  "replicaset": "ReplicaSet pilnuje, aby stale istniała określona liczba Podów zgodnych z szablonem.",
  "pod × n": "To zbiór wymiennych instancji aplikacji. Każdy Pod ma osobny cykl życia, ale wszystkie powstają z tego samego szablonu.",
  "service selector": "Service używa selektora etykiet, aby dynamicznie znaleźć Pody, do których może kierować ruch.",
  "pod a app=hello-k8s": "Pod A jest jedną z równorzędnych instancji. Etykieta app=hello-k8s powoduje włączenie go do endpointów Service.",
  "pod b app=hello-k8s": "Pod B zwiększa dostępność i przepustowość usługi. Service może rozdzielać żądania między gotowe repliki.",
  "hello.local/api": "To publiczny host i ścieżka HTTP dopasowywane przez regułę Ingress.",
  "ingress controller": "Ingress Controller jest działającym reverse proxy. Obserwuje obiekty Ingress i na ich podstawie konfiguruje routing.",
  "service": "Service zapewnia stabilny punkt dostępu i wybiera gotowe Pody na podstawie etykiet.",
  "pod": "Pod jest najmniejszą jednostką wdrożenia i zawiera jeden lub kilka ściśle współpracujących kontenerów.",
  "configmap": "ConfigMap przechowuje niewrażliwą konfigurację i może dostarczać ją do Poda jako zmienne środowiskowe lub pliki.",
  "namespace": "Namespace jest logiczną przestrzenią nazw wewnątrz jednego klastra. Większość zasobów aplikacyjnych należy do Namespace, ale nody, PersistentVolume i sam obiekt Namespace mają zasięg całego klastra.",
  "secret": "Secret przechowuje dane wymagające ograniczenia dostępu. Samo kodowanie Base64 nie zabezpiecza ich kryptograficznie.",
  "startup": "Startup probe daje aplikacji czas na uruchomienie. Dopóki nie przejdzie, pozostałe sondy nie powodują przedwczesnych restartów.",
  "readiness": "Readiness probe określa, czy Pod może otrzymywać ruch. Nieudana sonda usuwa go z endpointów Service.",
  "liveness": "Liveness probe wykrywa stan wymagający restartu kontenera, na przykład zakleszczenie procesu.",
  "statefulset": "StatefulSet zarządza Podami o stabilnych nazwach, kolejności i trwałych wolumenach.",
  "daemonset": "DaemonSet zapewnia uruchomienie Poda na każdym wybranym nodzie, co pasuje np. do agentów logów i monitoringu.",
  "job / cronjob": "Job wykonuje zadanie do skutku, a CronJob tworzy takie zadania według harmonogramu.",
  "pvc — persistentvolumeclaim": "PVC jest deklaracją zapotrzebowania na storage, np. 5 GiB i określony tryb dostępu. Kubernetes wiąże ją z istniejącym PersistentVolume albo dynamicznie tworzy wolumen przez StorageClass. Pod odwołuje się do PVC, nie do fizycznego dysku."
};

const modal = document.createElement("dialog");
modal.className = "concept-modal";
modal.setAttribute("aria-labelledby", "concept-modal-title");
modal.innerHTML = '<div class="concept-modal__frame"><button class="concept-modal__close" type="button" aria-label="Zamknij objaśnienie">×</button><div class="concept-modal__eyebrow">Objaśnienie pojęcia</div><h3 id="concept-modal-title"></h3><p class="concept-modal__body"></p></div>';
document.body.append(modal);

const modalTitle = modal.querySelector("#concept-modal-title");
const modalBody = modal.querySelector(".concept-modal__body");
const closeButton = modal.querySelector(".concept-modal__close");
let opener = null;

function conceptLabel(block) {
  const clone = block.cloneNode(true);
  clone.querySelectorAll("button").forEach((button) => button.remove());
  return [...clone.childNodes]
    .map((node) => node.textContent)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function conceptTitle(block) {
  const heading = block.querySelector(":scope > h3");
  if (heading) return heading.textContent.trim();

  if (block.classList.contains("node")) {
    const clone = block.cloneNode(true);
    clone.querySelectorAll("button, small").forEach((element) => element.remove());
    return [...clone.childNodes]
      .filter((node) => node.nodeName !== "BR")
      .map((node) => node.textContent)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
  }

  const label = conceptLabel(block);
  const firstSentence = label.match(/^.*?[.!?](?:\s|$)/)?.[0] || label;
  return firstSentence.replace(/[.!?]$/, "").trim();
}

function openExplanation(button, block) {
  const slideTitle = block.closest(".slide")?.dataset.title || "Pojęcie";
  const label = conceptLabel(block);
  const title = conceptTitle(block);
  const key = label.toLocaleLowerCase("pl-PL");
  const titleKey = title.toLocaleLowerCase("pl-PL");
  const body = conceptDefinitions[key] || conceptDefinitions[titleKey] || explanations[slideTitle]?.[1] || "Ten element jest częścią większego mechanizmu pokazanego na slajdzie.";
  opener = button;
  modalTitle.textContent = title;
  modalBody.textContent = body;
  modal.showModal();
  closeButton.focus();
}

document.querySelectorAll(".node, .panel, .architecture span, .term-card, .note, .warning").forEach((block) => {
  if (block.closest(".concept-modal") || block.querySelector(":scope > .concept-help")) return;
  block.classList.add("has-concept-help");
  const button = document.createElement("button");
  button.type = "button";
  button.className = "concept-help";
  button.textContent = "+";
  button.setAttribute("aria-label", "Pokaż objaśnienie tego elementu");
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    openExplanation(button, block);
  });
  block.append(button);
});

function closeModal() {
  modal.close();
  opener?.focus();
}
closeButton.addEventListener("click", closeModal);
modal.addEventListener("click", (event) => {
  if (event.target === modal) closeModal();
});
modal.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeModal();
});
const diagramModal = document.createElement("dialog");
diagramModal.className = "diagram-modal";
diagramModal.setAttribute("aria-labelledby", "diagram-modal-title");
diagramModal.innerHTML = '<div class="diagram-modal__frame"><header class="diagram-modal__header"><div><div class="diagram-modal__eyebrow">Efekt konfiguracji</div><h3 id="diagram-modal-title"></h3></div><button type="button" class="diagram-modal__close" aria-label="Zamknij diagram">×</button></header><div class="diagram-modal__content"></div></div>';
document.body.append(diagramModal);

const diagramModalTitle = diagramModal.querySelector("#diagram-modal-title");
const diagramModalContent = diagramModal.querySelector(".diagram-modal__content");
const diagramModalClose = diagramModal.querySelector(".diagram-modal__close");
let diagramModalOpener = null;

function openDiagramModal(diagram, button) {
  diagramModalOpener = button;
  diagramModalTitle.textContent = diagram.closest(".slide")?.dataset.title || "Diagram konfiguracji";
  const preview = diagram.cloneNode(true);
  preview.querySelectorAll("button").forEach((control) => control.remove());
  preview.classList.add("diagram-preview");
  diagramModalContent.replaceChildren(preview);
  diagramModal.showModal();
  diagramModalClose.focus();
}

function closeDiagramModal() {
  diagramModal.close();
  diagramModalOpener?.focus();
}

document.querySelectorAll(".config-effect").forEach((diagram) => {
  diagram.classList.add("has-diagram-expand");
  const button = document.createElement("button");
  button.type = "button";
  button.className = "diagram-expand";
  button.textContent = "Powiększ diagram";
  button.addEventListener("click", () => openDiagramModal(diagram, button));
  diagram.append(button);
});

diagramModalClose.addEventListener("click", closeDiagramModal);
diagramModal.addEventListener("click", (event) => {
  if (event.target === diagramModal) closeDiagramModal();
});
diagramModal.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeDiagramModal();
});


const codeModal = document.createElement("dialog");
codeModal.className = "code-modal";
codeModal.setAttribute("aria-labelledby", "code-modal-title");
codeModal.innerHTML = '<div class="code-modal__frame"><header class="code-modal__header"><div><div class="code-modal__eyebrow">Kod źródłowy</div><h3 id="code-modal-title">Powiększony kod</h3></div><div class="code-modal__actions"><button type="button" class="code-modal__copy">Kopiuj</button><button type="button" class="code-modal__close" aria-label="Zamknij powiększony kod">×</button></div></header><div class="code-modal__content"></div></div>';
document.body.append(codeModal);

const codeModalContent = codeModal.querySelector(".code-modal__content");
const codeModalTitle = codeModal.querySelector("#code-modal-title");
const codeModalCopy = codeModal.querySelector(".code-modal__copy");
const codeModalClose = codeModal.querySelector(".code-modal__close");
let codeModalOpener = null;
let currentCode = "";

function codeLanguage(code) {
  const languageClass = [...code.classList].find((name) => name.startsWith("language-"));
  return languageClass ? languageClass.slice("language-".length).toUpperCase() : "Kod";
}

function rawCode(code) {
  const clone = code.cloneNode(true);
  clone.querySelectorAll(".command-line__copy").forEach((button) => button.remove());
  return clone.textContent;
}

async function copySingleCommand(command, button) {
  try {
    await navigator.clipboard.writeText(command);
  } catch {
    const area = document.createElement("textarea");
    area.value = command;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.append(area);
    area.select();
    document.execCommand("copy");
    area.remove();
  }
  button.classList.add("copied");
  button.setAttribute("aria-label", "Skopiowano komendę");
  button.title = "Skopiowano ✓";
  window.setTimeout(() => {
    button.classList.remove("copied");
    button.setAttribute("aria-label", "Kopiuj tę komendę");
    button.title = "Kopiuj tę komendę";
  }, 1600);
}

async function copyCode(text, button) {
  const originalLabel = button.textContent;
  try {
    await navigator.clipboard.writeText(text);
    button.textContent = "Skopiowano ✓";
    button.classList.add("copied");
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.append(area);
    area.select();
    document.execCommand("copy");
    area.remove();
    button.textContent = "Skopiowano ✓";
    button.classList.add("copied");
  }
  window.setTimeout(() => {
    button.textContent = originalLabel;
    button.classList.remove("copied");
  }, 1600);
}

function openCodeModal(pre, opener) {
  const code = pre.querySelector("code");
  currentCode = rawCode(code);
  codeModalOpener = opener;
  codeModalTitle.textContent = codeLanguage(code);
  const enlargedPre = pre.cloneNode(true);
  enlargedPre.querySelectorAll(".command-line__copy").forEach((button) => button.remove());
  enlargedPre.removeAttribute("tabindex");
  codeModalContent.replaceChildren(enlargedPre);
  codeModal.showModal();
  codeModalClose.focus();
}

function closeCodeModal() {
  codeModal.close();
  codeModalOpener?.focus();
}

document.querySelectorAll(".slide code.language-bash").forEach((code) => {
  const lines = code.innerHTML.split("\n");
  code.replaceChildren();
  lines.forEach((lineHtml, index) => {
    const line = document.createElement("span");
    line.className = "command-line";
    line.innerHTML = lineHtml;
    const command = line.textContent.trim();
    if (command) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "command-line__copy";
      button.setAttribute("aria-label", "Kopiuj tę komendę");
      button.title = "Kopiuj tę komendę";
      button.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M8 7V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2v2a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3v-8a3 3 0 0 1 3-3h3Zm2 0h4a3 3 0 0 1 3 3v4h2V5h-9v2Zm4 2H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1Z"/></svg>';
      button.addEventListener("click", () => copySingleCommand(command, button));
      line.append(button);
    }
    code.append(line);
    if (index < lines.length - 1) code.append(document.createTextNode("\n"));
  });
});

document.querySelectorAll(".slide pre").forEach((pre) => {
  const code = pre.querySelector(":scope > code");
  if (!code || pre.closest(".code-modal")) return;

  const wrapper = document.createElement("div");
  wrapper.className = "code-block";
  pre.parentNode.insertBefore(wrapper, pre);
  wrapper.append(pre);

  const controls = document.createElement("div");
  controls.className = "code-block__actions";

  const enlarge = document.createElement("button");
  enlarge.type = "button";
  enlarge.className = "code-action code-action--enlarge";
  enlarge.textContent = "Powiększ";
  enlarge.setAttribute("aria-label", "Powiększ ten blok kodu");
  enlarge.addEventListener("click", () => openCodeModal(pre, enlarge));

  const copy = document.createElement("button");
  copy.type = "button";
  copy.className = "code-action code-action--copy";
  copy.textContent = "Kopiuj";
  copy.setAttribute("aria-label", "Skopiuj ten blok kodu do schowka");
  copy.addEventListener("click", () => copyCode(rawCode(code), copy));

  controls.append(enlarge, copy);
  wrapper.append(controls);
});

codeModalCopy.addEventListener("click", () => copyCode(currentCode, codeModalCopy));
codeModalClose.addEventListener("click", closeCodeModal);
codeModal.addEventListener("click", (event) => {
  if (event.target === codeModal) closeCodeModal();
});
codeModal.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeCodeModal();
});
