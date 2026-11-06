#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

start_service() {
  local name="$1"
  local pid_file="/tmp/movie-catalog-${name}.pid"
  local log_file="/tmp/movie-catalog-${name}.log"

  if [[ -f "$pid_file" ]] && kill -0 "$(cat "$pid_file")" 2>/dev/null; then
    echo "${name} is already running (PID $(cat "$pid_file"))."
    return
  fi

  rm -f "$pid_file"
  case "$name" in
    api)
      (
        cd "$ROOT/server"
        nohup env ASPNETCORE_URLS="http://0.0.0.0:5000" dotnet run --no-launch-profile \
          >"$log_file" 2>&1 </dev/null &
        echo $! >"$pid_file"
      )
      ;;
    client)
      (
        cd "$ROOT/client"
        nohup npm start -- --host 0.0.0.0 \
          >"$log_file" 2>&1 </dev/null &
        echo $! >"$pid_file"
      )
      ;;
  esac
  echo "Started ${name}; logs: ${log_file}"
}

start_service api
start_service client
