# ansible-demo-end

Końcowa wersja minimalnego projektu z wykładu. Ubuntu WSL jest control node, a Debian WSL jest hostem zarządzanym przez SSH. Projekt pokazuje zmienne, rolę, facts, walidację, handler i check mode.

## Przygotowanie Debiana

```powershell
wsl --install -d Debian
wsl -d Debian hostname -I
```

W Debianie:

```bash
sudo apt update
sudo apt install -y openssh-server python3 python3-apt
sudo service ssh start
```

W `inventory.yml` zastąp przykładowy adres IP adresem Debiana. Następnie z Ubuntu utwórz klucz i skopiuj go do Debiana:

```bash
ssh-keygen -t ed25519
ssh-copy-id student@ADRES_DEBIANA
```

## Uruchomienie

```bash
ansible --version
ansible-inventory -i inventory.yml --graph
ansible debian_wsl -i inventory.yml -m ansible.builtin.ping
ansible-playbook -i inventory.yml site.yml --ask-become-pass
ansible-playbook -i inventory.yml site.yml --ask-become-pass
ansible-playbook -i inventory.yml site.yml --check --diff
```

Drugie wykonanie powinno nie instalować ponownie pakietu. Handler uruchamia się tylko wtedy, gdy plik demonstracyjny zostanie zmieniony.
