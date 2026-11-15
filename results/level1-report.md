# Практична робота №1 — Рівень 1 (базовий)

> Звіт сформовано автоматично скриптом `npm start`.
> Дата генерації: 2026-11-15T15:55:27.443Z

## 1. Середовище виконання

| Параметр | Значення |
| --- | --- |
| Node.js | v24.17.0 |
| Платформа | win32 / x64 |
| curl | curl 8.21.0 (Windows) libcurl/8.21.0 Schannel zlib/1.3.2 WinIDN WinLDAP |

## 2. CRUD-запити (аналог колекції Postman)

| Запит | Статус | Час, мс | Розмір тіла, Б | Ключові поля відповіді |
| --- | --- | --- | --- | --- |
| `GET /products/1` | 200 | 187.14 | 1510 | id=1, title=Essence Mascara Lash Princess, price=9.99, category=beauty |
| `POST /products/add` | 201 | 169.9 | 95 | id=195, title=TypeScript: повний практичний посібник, price=499 |
| `PUT /products/1` | 200 | 595.24 | 583 | id=1, title=TypeScript: посібник (оновлено через PUT) |
| `DELETE /products/1` | 200 | 168.92 | 1566 | id=1, isDeleted=true, deletedOn=2026-11-15T15:55:24.785Z |

## 3. Структура запиту (DevTools → Network)

### General

| Параметр | Значення |
| --- | --- |
| Request URL | `https://dummyjson.com/products?limit=5` |
| Request Method | GET |
| Status Code | 200 |
| Remote Address | 172.67.205.42:443 |

### Response Headers

| Заголовок | Значення |
| --- | --- |
| content-type | application/json; charset=utf-8 |
| date | Sun, 15 Nov 2026 15:55:25 GMT |
| server | cloudflare |
| etag | W/"1cf6-agDAibd7HrmB27QuB7R1PM4ue8A" |
| cache-control |  |

### Request Headers

| Заголовок | Значення |
| --- | --- |
| accept | application/json |
| user-agent | web-rozrobka-lab1/1.0 |
| accept-encoding | gzip, deflate, br |

### Timing

| Фаза | Час, мс |
| --- | --- |
| DNS Lookup | 5.243 |
| Initial connection (TCP) | 34.652 |
| TLS handshake | 71.63 |
| Waiting for server response (TTFB) | 225.706 |
| Content Download | 0.812 |
| Total | 226.518 |

## 4. Результати перевірок

| Перевірка | Результат |
| --- | --- |
| Node.js версії 18+ | ✅ пройдено |
| Вбудований fetch доступний | ✅ пройдено |
| Утиліта curl доступна | ✅ пройдено |
| GET /products/1 повертає 200 OK | ✅ пройдено |
| Тіло містить id, title і price | ✅ пройдено |
| POST /products/add повертає 201 Created | ✅ пройдено |
| Сервер згенерував числовий id | ✅ пройдено |
| Створений товар має переданий title | ✅ пройдено |
| PUT /products/1 повертає 200 OK | ✅ пройдено |
| Поле title оновлено | ✅ пройдено |
| DELETE /products/1 повертає 200 OK | ✅ пройдено |
| Відповідь містить isDeleted: true | ✅ пройдено |
| Відповідь містить дату видалення deletedOn | ✅ пройдено |
| Network-запит повертає 200 OK | ✅ пройдено |
| Content-Type = application/json | ✅ пройдено |
| Присутній заголовок date | ✅ пройдено |
| Присутній заголовок server | ✅ пройдено |
| Присутній заголовок etag | ✅ пройдено |
| DNS-резолвінг зафіксовано | ✅ пройдено |
| TLS-рукостискання зафіксовано | ✅ пройдено |
| TTFB більший за час з'єднання | ✅ пройдено |
