# Agent budujący Ansible — rozwiązanie

Kompletne rozwiązanie przygotowuje lokalne Ubuntu 24.04 x86_64 w WSL do budowania
projektów .NET, Node.js, Angular i Terraform. Ten sam playbook może działać na zdalnym
hoście po zmianie inventory.

## Uruchomienie w WSL

~~~bash
sudo apt update
sudo apt install -y software-properties-common
sudo add-apt-repository --yes --update ppa:ansible/ansible
sudo apt install -y ansible

cd projects/ansible-agent-solution
ansible-galaxy collection install -r requirements.yml
ansible-inventory --graph
ansible build_agents -m ansible.builtin.ping
ansible-playbook playbooks/agent.yml --ask-become-pass
~~~

Drugie wykonanie powinno zakończyć się bez zmian. Pełny test budowania pobiera zależności
Angular z npm, dlatego wymaga dostępu do Internetu:

~~~bash
chmod +x scripts/verify-toolchains.sh
./scripts/verify-toolchains.sh
~~~

## Opcjonalny GitHub Actions runner

W GitHub otwórz **Settings → Actions → Runners → New self-hosted runner**. Skopiuj URL
paczki, jej sumę SHA-256 i krótkotrwały token z instrukcji GitHuba. Nie zapisuj tokenu
w pliku ani historii powłoki. Najbezpieczniej wczytać wartości do zmiennych środowiskowych
i uruchomić playbook bez logowania polecenia przez powłokę:

~~~bash
read -r -p 'Repository URL: ' RUNNER_URL
read -r -p 'Runner package URL: ' RUNNER_PACKAGE_URL
read -r -p 'Runner SHA-256: ' RUNNER_SHA256
read -r -s -p 'Registration token: ' RUNNER_TOKEN; echo

ansible-playbook playbooks/register-github-runner.yml --ask-become-pass \
  -e "github_runner_url=$RUNNER_URL" \
  -e "github_runner_download_url=$RUNNER_PACKAGE_URL" \
  -e "github_runner_sha256=$RUNNER_SHA256" \
  -e "github_runner_token=$RUNNER_TOKEN"
unset RUNNER_TOKEN
~~~

Domyślnie runner nie jest instalowany jako usługa. Uruchom go interaktywnie:

~~~bash
sudo -u actions /opt/actions-runner/run.sh
~~~

Jeśli WSL ma włączony `systemd`, można dodać
`-e github_runner_install_service=true`. WSL musi pozostać uruchomiony, aby runner
odbierał zadania. Self-hosted runner powinien obsługiwać wyłącznie zaufany kod.

## Źródła decyzji instalacyjnych

- Ansible na Ubuntu: https://docs.ansible.com/projects/ansible/latest/installation_guide/installation_distros.html
- .NET na Ubuntu 24.04: https://learn.microsoft.com/dotnet/core/install/linux-ubuntu-install
- Node.js: https://nodejs.org/download/release/v24.11.1/
- Terraform: https://developer.hashicorp.com/terraform/install
- GitHub runner: https://docs.github.com/actions/how-tos/manage-runners/self-hosted-runners/add-runners

