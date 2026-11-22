# Laboratorium Ansible — rozwiązanie

Rozwiązanie zadań obowiązkowych. Uruchamiaj je z Ubuntu WSL jako `ansible-control`, a Debian WSL wykorzystuj jako host zarządzany przez SSH z użytkownikiem `ansible-managed`.

Przed pierwszym uruchomieniem ustaw adres Debiana i dane SSH w `inventory.yml`.

```bash
ansible all -i inventory.yml -m ansible.builtin.ping
ansible-playbook -i inventory.yml site.yml --check --diff --ask-become-pass
ansible-playbook -i inventory.yml site.yml --ask-become-pass
cat /tmp/ansible-lab-report.txt
```

Terraform, Angular i Vault są opisane jako zadania rozszerzające w tutorialu i nie są częścią tego rozwiązania.
