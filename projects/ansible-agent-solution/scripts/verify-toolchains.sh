#!/usr/bin/env bash
set -euo pipefail

work_dir="$(mktemp -d)"
trap 'rm -rf "$work_dir"' EXIT

dotnet new console -n SmokeDotnet -o "$work_dir/dotnet" >/dev/null
dotnet build "$work_dir/dotnet" --nologo

mkdir -p "$work_dir/node"
printf '{"scripts":{"build":"node -e \\"console.log(42)\\""}}\n' > "$work_dir/node/package.json"
npm --prefix "$work_dir/node" run build

ng new smoke-angular --directory "$work_dir/angular" --defaults --skip-git --skip-install --style=css
npm --prefix "$work_dir/angular" install
npm --prefix "$work_dir/angular" run build

mkdir -p "$work_dir/terraform"
printf 'terraform { required_version = ">= 1.17.0" }\n' > "$work_dir/terraform/main.tf"
terraform -chdir="$work_dir/terraform" init -backend=false
terraform -chdir="$work_dir/terraform" fmt -check
terraform -chdir="$work_dir/terraform" validate

echo 'Wszystkie cztery toolchainy działają.'

