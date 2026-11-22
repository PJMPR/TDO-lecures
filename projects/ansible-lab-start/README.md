# Laboratorium Ansible — projekt startowy

Projekt wykonuj z Ubuntu WSL jako control node. Debian WSL jest hostem zarządzanym przez SSH. Tutorial zakłada konto `ansible-control` w Ubuntu i osobne konto `ansible-managed` w Debianie.

## Start

1. Skopiuj projekt do własnego katalogu roboczego.
2. W `inventory.yml` ustaw adres IP Debiana, użytkownika SSH i ścieżkę do klucza.
3. Sprawdź połączenie:

```bash
ansible all -i inventory.yml -m ansible.builtin.ping
```

4. Uzupełniaj pliki oznaczone `TODO` zgodnie z tutorialem.
5. Uruchamiaj playbook z katalogu projektu:

```bash
ansible-playbook -i inventory.yml site.yml --check --diff --ask-become-pass
ansible-playbook -i inventory.yml site.yml --ask-become-pass
```

Nie zapisuj haseł, prywatnych kluczy ani plików Vault w repozytorium.
