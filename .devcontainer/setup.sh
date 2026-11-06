#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "Restoring the .NET API..."
dotnet restore "$ROOT/server/server.csproj"

echo "Installing Angular dependencies..."
npm --prefix "$ROOT/client" ci

echo "Codespaces setup complete. The API and frontend start when the workspace attaches."
