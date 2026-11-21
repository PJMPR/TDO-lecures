# Notatki do uruchomienia demo

## Ubuntu jako control node, Debian jako managed node

### 1. Sprawdź adres Debiana

W PowerShell:

```powershell
wsl -d Debian hostname -I
```

Wpisz otrzymany adres w `inventory.yml`:

```yaml
ansible_host: 172.30.77.151
```

Adres `172.30.77.151` jest tylko przykładem. W trybie NAT WSL może zmienić się po restarcie.

### 2. Uruchom SSH w Debianie

W terminalu Debiana:

```bash
sudo apt update
sudo apt install -y openssh-server python3 python3-apt
sudo service ssh start
sudo service ssh status
```

Upewnij się, że użytkownik `student` istnieje. Jeśli używasz innej nazwy, zmień `ansible_user` w `inventory.yml`.

### 3. Utwórz klucz SSH w Ubuntu

W terminalu Ubuntu:

```bash
ssh-keygen -t ed25519
```

Zaakceptuj domyślną ścieżkę:

```text
/home/aurbanow/.ssh/id_ed25519
```

### 4. Skopiuj klucz do Debiana

Podstaw aktualny adres Debiana:

```bash
ssh-copy-id student@172.30.77.151
```

Polecenie poprosi o hasło użytkownika `student` w Debianie. Hasła nie zapisujemy w inventory.

### 5. Sprawdź SSH i Ansible

Najpierw sprawdź samo SSH:

```bash
ssh student@172.30.77.151
```

Następnie uruchom Ansible. Nie dodawaj końcowego znaku `\\`, jeśli polecenie jest zapisane w jednej linii:

```bash
ansible debian_wsl -i inventory.yml -m ansible.builtin.ping
```

Oczekiwany wynik:

```text
debian_wsl | SUCCESS => {
    "changed": false,
    "ping": "pong"
}
```

Jeśli pojawi się `no such identity`, klucz nie istnieje pod ścieżką wskazaną w inventory. Jeśli pojawi się `Permission denied`, sprawdź użytkownika, hasło i ponownie wykonaj `ssh-copy-id`.

## Test handlera

W projekcie startowym rola `common` zapisuje `/tmp/ansible-demo.conf` i powiadamia handler tylko wtedy, gdy treść pliku się zmieni.

```bash
ssh student@ADRES_DEBIANA 'rm -f /tmp/ansible-demo.conf'
ansible-playbook -i inventory.yml site.yml --ask-become-pass
ansible-playbook -i inventory.yml site.yml --ask-become-pass
```

Pierwsze uruchomienie powinno pokazać `changed` oraz `RUNNING HANDLER`. Drugie powinno pokazać `ok`, bez uruchomienia handlera.

## Jednorazowy bootstrap Pythona przez Ansible

Ansible może wykonać polecenie `raw` przed zainstalowaniem Pythona na hoście zarządzanym. Przygotuj osobny plik `bootstrap.yml`:

```yaml
- name: Bootstrap Debiana
  hosts: debian_wsl
  gather_facts: false
  become: true

  tasks:
    - name: Zainstaluj Python i obsługę apt
      ansible.builtin.raw: apt-get update && apt-get install -y python3 python3-apt
```

Uruchom go jednorazowo bez trybu check:

```bash
ansible-playbook -i inventory.yml bootstrap.yml --ask-become-pass
```

Po bootstrapie można używać głównego playbooka z dry-run:

```bash
ansible-playbook -i inventory.yml site.yml --check --diff --ask-become-pass
```

`raw` nie wymaga Pythona na hoście, ale nie zapewnia prawdziwej symulacji w `--check`. Dlatego bootstrap wykonujemy osobno i tylko przed pierwszym użyciem głównego playbooka.
