# Запуск в GitHub Codespaces

В репозитории есть devcontainer для .NET 10 и Node.js 22. Создайте Codespace из ветки `master` и дождитесь завершения первичной настройки (восстановление NuGet и `npm ci`). После подключения Codespaces автоматически запустит API и Angular dev-сервер.

- Вкладка/порт **4200** — веб-приложение. Откройте его по ссылке в панели **Ports**.
- Порт **5000** — Scalar API: `/scalar/v1`.
- Angular проксирует `/api` и `/uploads` на сервер, поэтому дополнительная настройка адреса API не нужна.
- При первом старте сервер применяет EF Core-миграции и создает SQLite-базу.

Если нужно перезапустить оба сервиса, выполните в терминале:

```bash
bash .devcontainer/start.sh
```

Логи доступны в `/tmp/movie-catalog-api.log` и `/tmp/movie-catalog-client.log`.

Для ручного запуска: API — `cd server && ASPNETCORE_URLS=http://0.0.0.0:5000 dotnet run --no-launch-profile`; клиент — `cd client && npm start -- --host 0.0.0.0`.
