# ansible-demo-start

Projekt startowy używany podczas wykładu. Ubuntu WSL jest control node, a Debian WSL jest hostem zarządzanym przez SSH. Playbook zaczyna się pusty i jest uzupełniany krok po kroku zgodnie ze slajdami.

## Wymagania

- WSL 2 z Ubuntu 24.04,
- WSL 2 z Debianem,
- Ansible,
- konto `student` w Debianie z dostępem do `sudo`,
- połączenie z Internetem.

## Przygotowanie Debiana

W PowerShell zainstaluj dystrybucję i sprawdź jej adres:

```powershell
wsl --install -d Debian
wsl -d Debian hostname -I
```

W Debianie zainstaluj SSH i Pythona:

```bash
sudo apt update
sudo apt install -y openssh-server python3 python3-apt
sudo service ssh start
```

W `inventory.yml` zastąp przykładowy adres IP adresem zwróconym przez `hostname -I`. Z Ubuntu utwórz klucz i przekaż go do Debiana:

```bash
ssh-keygen -t ed25519
ssh-copy-id student@ADRES_DEBIANA
```

## Stan początkowy

W katalogu znajdują się tylko inventory oraz pusty playbook. Po przygotowaniu SSH sprawdź połączenie:

```bash
ansible-inventory -i inventory.yml --graph
ansible debian_wsl -i inventory.yml -m ansible.builtin.ping
```

Kolejne zadania dopisujemy podczas wykładu.
