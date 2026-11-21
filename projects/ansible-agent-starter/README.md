# Agent budujący Ansible — projekt startowy

Celem jest przygotowanie lokalnego Ubuntu 24.04 x86_64 w WSL do budowania projektów
.NET, Node.js, Angular i Terraform. Starter zawiera inventory, zmienne, pustą strukturę
ról i listę zadań. Nie zawiera gotowego rozwiązania ani rejestracji GitHub runnera.

## Start

Wewnątrz Ubuntu w WSL:

~~~bash
sudo apt update
sudo apt install -y software-properties-common
sudo add-apt-repository --yes --update ppa:ansible/ansible
sudo apt install -y ansible

cd projects/ansible-agent-starter
cp inventories/local.example.yml inventories/local.yml
ansible-galaxy collection install -r requirements.yml
ansible-inventory --graph
ansible build_agents -m ansible.builtin.ping
~~~

Następnie uzupełniaj role w kolejności `common`, `dotnet`, `node`, `terraform`,
`validation`. Po każdym etapie użyj tagu, na przykład:

~~~bash
ansible-playbook playbooks/agent.yml --ask-become-pass --tags common
ansible-playbook playbooks/agent.yml --ask-become-pass --tags dotnet
~~~

## Kryteria ukończenia

- playbook odrzuca system inny niż Ubuntu 24.04 x86_64,
- pobierany Node.js ma przypiętą wersję i zweryfikowaną sumę SHA-256,
- repozytorium HashiCorp jest podpisane wskazanym kluczem,
- playbook instaluje .NET SDK, Node.js, npm, Angular CLI i Terraform,
- rola `validation` nie raportuje zmian,
- drugie pełne wykonanie kończy się `changed=0`,
- `scripts/verify-toolchains.sh` buduje cztery minimalne projekty,
- w repozytorium nie ma haseł sudo, tokenów GitHub ani prywatnych kluczy SSH.

Po wykonaniu porównaj rezultat z `../ansible-agent-solution/`.

