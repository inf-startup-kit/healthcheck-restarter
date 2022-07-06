# Healthcheck-restarter

## Информация

Перезагрузка нездоровых docker контейнеров.

## Оглавление

- [Использование](#install)
- [Ключи запуска](#launch)
- [Конфигурация](#configuration)
- [HTTP API](#api)

## <a name="install"></a> Использование

пример строки запуска: `node /healthcheck-restarter/app.js -c config.toml`

## <a name="launch"></a> Таблица ключей запуска

Ключ | Описание
------------ | -------------
--version, -v | вывести номер версии приложения
--help, -h | вызвать справку по ключам запуска
--config, -c | путь к файлу конфигурации в формате toml или json, (переменная среды: HEALTHCHECK_RESTARTER_CONFIG_PATH)

## <a name="configuration"></a> Конфигурация

Программа настраивается через файл конфигурации в формате TOML, YAML или JSON. Так же можно настраивать через переменные среды, которые будут считаться первичными.

### Секции файла конфигурации

- **logger** - настройка логгера (переменная среды: HEALTHCHECK_RESTARTER_LOGGER)
- **api** - настройка API (переменная среды: HEALTHCHECK_RESTARTER_API)
- **healthcheck** - настройки проверки здоровья (переменная среды: HEALTHCHECK_RESTARTER_HEALTHCHECK)
- **docker** - настройки докера (переменная среды: HEALTHCHECK_RESTARTER_DOCKER)

### Пример файла конфигурации config.toml

```toml
[logger]                    # настройка логгера
    name = ""               # имя логгера
    enable = true           # активация
    level = "error"         # уровень (fatal, info, error , warn, debug, trace)
    timestamp = "none"      # вывод времени full, short, unix и none

[api]
    enable = false              # активация API сервера
    logging = false             # логирование запросов (ключ logger.level = "debug" или ниже)
    hostname = "0.0.0.0"        # хост
    port = 3001                 # порт
    backlog = 511               # очередь баклога
    prefix = "/api"             # префикс
    connection_timeout = 0      # таймаут сервера в миллисекундах
    keep_alive_timeout = 5000   # таймаут keep-alive сервера в миллисекундах
    body_limit = "1mb"          # максимальный размер тела запроса (b, kb, mb)
    trust_proxy = false         # доверие proxy заголовку

[healthcheck]                               # настройки проверки здоровья
    enable = false                          # активация
    label = "healthcheck.restarter=true"    # метка поиска
    check_interval = "10s"                  # интервал проверки
    
[docker]                            # настройки докера
    socket = "/var/run/docker.sock" # путь к сокету docker (игнорируются если указан ключ host)
    host = ""                       # хост подключения
    port = 2375                     # порт подключения
    protocol = "http"               # протокол http, https и ssh
    ca = ""                         # путь файла до файла CA
    cert = ""                       # путь до файла сертификата
    key = ""                        # путь до файла ключа
    version = "v1.38"               # версия api docker
    ping_interval = "10s"           # интервал проверки
```

### Настройка через переменные среды

Ключи конфигурации можно задать через переменные среды ОС. Имя переменной среды формируется из двух частей, префикса `HEALTHCHECK_RESTARTER_` и имени переменной в верхнем реестре. Если переменная вложена, то это обозначается символом `_`. Переменные среды имеют высший приоритет.

пример для переменной **logger.mode**: `HEALTHCHECK_RESTARTER_LOGGER_MODE`

пример для переменной **api.ips_count**: `HEALTHCHECK_RESTARTER_API_IPS_COUNT`

## <a name="api"></a> API

Сервис предоставляет API, который настраивается в секции файла настройки **api**. API доступно по протоколу HTTP.

### Примеры применения

проверить доступность сервера: `curl -i http://localhost:3001/api/healthcheck`

### API информации сервиса

| URL | Метод | Код | Описание | Пример ответа/запроса |
| ----- | ----- | ----- | ----- | ----- |
| /_ping | GET | 200 | проверить здоровье сервиса | OK |
| /healthcheck | GET | 200 | проверить здоровье сервиса | OK |
| /healthcheck/liveness | GET | 200 | проверить здоровье сервиса | OK |
| /healthcheck/readiness | GET | 200 | проверить готовность сервиса | OK |
