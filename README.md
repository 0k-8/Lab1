# Практична робота №1 — Рівень 1 (базовий)

**Тема:** дослідження мережевих протоколів HTTP та HTTPS засобами інструментів розробника.

**Мета:** навчитися формувати HTTP-запити різними методами (`GET`, `POST`, `PUT`, `DELETE`), аналізувати статуси, заголовки й таймінги відповідей, а також досліджувати роботу клієнт-серверної взаємодії.

Рівень 1 реалізовано як консольний TypeScript-проєкт: програма сама виконує всі запити до публічного REST API `dummyjson.com`, перевіряє очікувані статуси та формує звіт. Колекція запитів для Postman / VS Code REST Client також додається.

---

## 1. Що реалізовано

| Пункт методички | Реалізація |
| --- | --- |
| Перевірка `curl` і середовища | `src/tasks/level1.ts`, блок «Завдання 1» |
| `GET /products/1` | `src/tasks/level1.ts` → перевірка `200 OK`, аналіз JSON |
| `POST /products/add` | перевірка `201 Created` і згенерованого `id` |
| `PUT /products/1` | перевірка `200 OK` і оновленого `title` |
| `DELETE /products/1` | перевірка `isDeleted: true` та `deletedOn` |
| Колекція запитів | `requests.http` (VS Code REST Client) і `postman-collection.json` (Postman) |
| Аналіз структури в DevTools | `src/httpsProbe.ts` знімає General, Response Headers, Request Headers і Timing |
| Звітність | `README.md` + автогенеровані `results/level1.json` та `results/level1-report.md` |

---

## 2. Структура проєкту

```text
Lab1/
├── package.json              # залежності та npm-скрипти
├── tsconfig.json             # строгий режим TypeScript
├── requests.http             # колекція запитів для VS Code REST Client
├── postman-collection.json   # та сама колекція для імпорту в Postman
├── results/                  # звіти, які генерує програма
│   ├── level1.json
│   └── level1-report.md
└── src/
    ├── index.ts              # точка входу
    ├── config.ts             # адреси сервісів
    ├── types.ts              # типи Product, CreatedProduct, DeletedProduct
    ├── http.ts               # обгортка над fetch + вимірювання часу/розміру
    ├── httpsProbe.ts         # низькорівневий запит із таймінгами фаз
    ├── logger.ts             # форматування консольного виводу
    └── tasks/
        └── level1.ts         # усі завдання рівня 1
```

---

## 3. Запуск

Потрібен **Node.js 18+** (перевірено на Node.js 24) і будь-який термінал.

```bash
cd C:\Users\denys\Розробка WEB-застосувань\Lab1

npm install          # один раз
npm start            # виконати роботу
npm run typecheck    # перевірити типи (tsc --noEmit)
```

Після запуску в консолі з'являється покроковий звіт, а у папці `results/` — файли `level1.json` (сирі дані) і `level1-report.md` (готовий звіт у Markdown).

Приклад успішного завершення:

```text
Виконано перевірок............ 21
Успішних...................... 21
Невдалих...................... 0
Усі перевірки пройдено успішно.
```

---

## 4. Завдання 1. Перевірка середовища

| Параметр | Значення |
| --- | --- |
| Node.js | v24.17.0 |
| Платформа | win32 / x64 |
| `fetch` | доступний |
| `curl` | curl 8.21.0 (Windows) libcurl/8.21.0 Schannel |

Перевірити `curl` вручну можна командою:

```powershell
curl --version
```

---

## 5. Завдання 2. CRUD-запити (аналог Postman)

| Запит | Статус | Час, мс | Розмір тіла, Б | Ключові поля відповіді |
| --- | --- | --- | --- | --- |
| `GET https://dummyjson.com/products/1` | **200 OK** | 175.61 | 1510 | `id=1`, `title=Essence Mascara Lash Princess`, `price=9.99`, `category=beauty` |
| `POST https://dummyjson.com/products/add` | **201 Created** | 145.33 | 95 | `id=195`, `title=TypeScript: повний практичний посібник`, `price=499` |
| `PUT https://dummyjson.com/products/1` | **200 OK** | 228.65 | 583 | `id=1`, `title=TypeScript: посібник (оновлено через PUT)` |
| `DELETE https://dummyjson.com/products/1` | **200 OK** | 152.19 | 1566 | `id=1`, `isDeleted=true`, `deletedOn=2026-11-04T12:23:18.275Z` |

Висновки за результатами:

- `POST /products/add` повертає **201 Created** і новий `id` (у нашому запуску `195`) — сервер згенерував ідентифікатор самостійно.
- `PUT` повертає **200 OK** і повне представлення ресурсу з оновленим `title`, решта полів зберігається.
- `DELETE` повертає **200 OK** з прапорцем `isDeleted: true` і часом видалення `deletedOn`. Це особливість тестового API: фізичного видалення не відбувається, але контракт відповіді зберігається.
- Час відповіді найбільший у `PUT`, оскільки сервер повертає повне представлення ресурсу (583 Б проти 95 Б у `POST`).

> Числа в таблиці отримані під час запуску `npm start` і можуть трохи відрізнятися між запусками — це нормально для мережевих вимірювань.

---

## 6. Завдання 3. Аналіз структури запиту (DevTools → Network)

Дані збираються модулем `node:https`, який дає доступ до фаз з'єднання — саме тих, що показує вкладка **Timing** у DevTools.

### General

| Параметр | Значення |
| --- | --- |
| Request URL | `https://dummyjson.com/products?limit=5` |
| Request Method | `GET` |
| Status Code | `200 OK` |
| Remote Address | `104.21.61.23:443` |

### Response Headers

| Заголовок | Значення |
| --- | --- |
| `content-type` | `application/json; charset=utf-8` |
| `date` | `Wed, 04 Nov 2026 12:23:18 GMT` |
| `server` | `cloudflare` |
| `etag` | `W/"1cf6-agDAibd7HrmB27QuB7R1PM4ue8A"` |
| `cache-control` | для списку товарів не передається |

### Request Headers

| Заголовок | Значення |
| --- | --- |
| `accept` | `application/json` |
| `user-agent` | `web-rozrobka-lab1/1.0` |
| `accept-encoding` | `gzip, deflate, br` |

### Timing

| Фаза | Час, мс |
| --- | --- |
| DNS Lookup | 2.628 |
| Initial connection (TCP) | 39.583 |
| TLS handshake | 99.762 |
| Waiting for server response (TTFB) | 584.246 |
| Content Download | 0.588 |
| **Total** | **584.834** |

Що показують ці цифри:

- **DNS Lookup** — час перетворення доменного імені `dummyjson.com` на IP-адресу (кеш DNS робить цей етап дуже швидким).
- **Initial connection** — встановлення TCP-з'єднання (тристороннє рукостискання).
- **TLS handshake** — узгодження шифрування для HTTPS, приблизно 100 мс.
- **TTFB** — від початку запиту до першого байта відповіді; включає DNS, TCP, TLS, передачу запиту й час обробки на сервері.
- **Content Download** — час отримання тіла відповіді (майже миттєво, бо тіло маленьке).

### Той самий аналіз у браузері

1. Відкрити `https://dummyjson.com/products?limit=5`.
2. `F12` → вкладка **Network** → перезавантажити сторінку (`Ctrl+R`).
3. Вибрати запит `products?limit=5` і переглянути вкладки **Headers** (General, Response Headers, Request Headers) та **Timing**.
4. Значення збігатимуться за структурою з таблицями вище (конкретні мілісекунди залежать від мережі).

---

## 7. Колекція запитів

**Варіант А — VS Code REST Client (найпростіший):**

1. Встановити розширення **REST Client** (`humao.rest-client`).
2. Відкрити `requests.http`.
3. Натиснути **Send Request** над потрібним запитом.

**Варіант Б — Postman:**

1. `File → Import` → вибрати `postman-collection.json`.
2. Колекція «Практична №1 — dummyjson CRUD» міститиме 4 запити.

Еквівалентні команди `curl` (для швидкої перевірки з терміналу):

```bash
# GET
curl -i https://dummyjson.com/products/1

# POST
curl -i -X POST https://dummyjson.com/products/add \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"TypeScript: повний практичний посібник\",\"price\":499}"

# PUT
curl -i -X PUT https://dummyjson.com/products/1 \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"TypeScript: посібник (оновлено через PUT)\"}"

# DELETE
curl -i -X DELETE https://dummyjson.com/products/1
```

---

## 8. Відповіді на контрольні питання

**1. Стартовий рядок запиту vs статусний рядок відповіді.**
Стартовий рядок запиту: `МЕТОД /шлях HTTP/версія` (наприклад, `GET /api/v1/resource HTTP/1.1`) — містить метод, цільовий ресурс і версію протоколу. Статусний рядок відповіді: `HTTP/версія КОД ПОЯСНЕННЯ` (наприклад, `HTTP/1.1 200 OK`) — містить версію протоколу, тризначний код статусу та текстове пояснення. Обидва рядки — перший рядок повідомлення і завершуються `CRLF`.

**2. Безпечні та ідемпотентні методи.**
Безпечний метод не змінює стан сервера (лише читає). Ідемпотентний — при повторному виконанні дає той самий стан ресурсу, що й один раз.
`GET` — безпечний та ідемпотентний; `POST` — ні безпечний, ні ідемпотентний (створює новий ресурс щоразу); `PUT` — небезпечний, але ідемпотентний (повна заміна ресурсу); `DELETE` — небезпечний, але ідемпотентний (повторне видалення не змінює результат).

**3. Групи кодів стану.**
`2xx` — успіх; `3xx` — перенаправлення; `4xx` — помилка на боці клієнта; `5xx` — помилка на боці сервера.
`201 Created` — ресурс створено (наш `POST`); `301 Moved Permanently` — ресурс назавжди переміщено; `401 Unauthorized` — не надано або невірні облікові дані; `403 Forbidden` — клієнт автентифікований, але доступ заборонено; `404 Not Found` — ресурс не знайдено; `500 Internal Server Error` — непередбачена помилка сервера.

**4. `Content-Type` і `Accept`.**
`Content-Type` описує формат тіла, яке надсилає клієнт (або сервер у відповіді), наприклад `application/json; charset=utf-8`. `Accept` — це список форматів, які клієнт готовий прийняти. Узгодження (content negotiation) відбувається так: клієнт надсилає `Accept`, `Accept-Language`, `Accept-Encoding`; сервер вибирає найкращий підтримуваний варіант і повідомляє його у `Content-Type`. Якщо виконати запит неможливо — сервер повертає `406 Not Acceptable`.

**5. TLS Handshake і небезпека HTTP.**
Етапи: `ClientHello` (версії TLS, cipher suites, SNI, ключова частка) → `ServerHello` (вибір версії й шифру, сертифікат X.509, своя ключова частка) → перевірка сертифіката клієнтом (ланцюжок до довіреного CA, термін дії, відповідність домену через SAN) → узгодження сесійних ключів → `Finished` і перехід на симетричне шифрування (AES-GCM або ChaCha20).
HTTP передає дані відкритим текстом: будь-хто на шляху (Wi-Fi, провайдер, зловмисник) може читати паролі й токени та змінювати трафік (MITM). HTTPS шифрує канал і забезпечує цілісність та автентифікацію сервера.

**6. TTFB.**
Time To First Byte — час від початку запиту до отримання першого байта тіла відповіді. Складається з DNS-резолвінгу, встановлення TCP-з'єднання, TLS-рукостискання, передачі запиту, очікування в черзі та обробки на сервері. Саме тому TTFB — головний показник «швидкості сервера», а не швидкості завантаження файлу.

**7. Атрибути Cookie.**
`HttpOnly` — забороняє доступ до cookie з JavaScript (`document.cookie`), захищає від крадіжки сесії через XSS. `Secure` — cookie передається лише через HTTPS, захищає від перехоплення у відкритому каналі. `SameSite` (`Strict`, `Lax`, `None`) — визначає, чи надсилати cookie при міжсайтових запитах, захищає від CSRF.

**8. Preflight у CORS.**
Preflight — попередній запит `OPTIONS`, яким браузер питає сервер, чи дозволено виконати «непростий» запит. Він надсилається, якщо метод не `GET`/`HEAD`/`POST`, або є нестандартні заголовки, або `Content-Type` не `application/x-www-form-urlencoded`, `multipart/form-data`, `text/plain`. У запиті передаються `Origin`, `Access-Control-Request-Method`, `Access-Control-Request-Headers`, а сервер відповідає `Access-Control-Allow-Origin`, `Access-Control-Allow-Methods`, `Access-Control-Allow-Headers` зі статусом `200` або `204`.

---

## 9. Що залишилося зробити вручну

Код і звіт готові повністю, але два пункти з «Вимог до звітності» фізично потребують вашої участі:

1. **Скриншоти** (методичка вимагає їх обов'язково). Зробіть три знімки:
   - вікно терміналу з результатом `npm start` (видно «Усі перевірки пройдено успішно»);
   - Postman або VS Code з відповіддю на `GET /products/1`;
   - браузер із DevTools → Network → Timing.
2. **Git-репозиторій.** Якщо потрібно опублікувати код:

```bash
cd C:\Users\denys\Розробка WEB-застосувань\Lab1
git init
git add .
git commit -m "Практична №1: рівень 1 (HTTP/HTTPS, DevTools, Postman)"
git branch -M main
git remote add origin <URL_вашого_репозиторію>
git push -u origin main
```

> `node_modules/` уже додано до `.gitignore`, тому в репозиторій потрапить лише код і звіт.

---

## 10. Примітки

- Усі сервіси (`dummyjson.com`) публічні та не потребують API-ключа.
- `DELETE` у dummyjson не видаляє ресурс фізично — сервер лише повертає `isDeleted: true`.
- Якщо мережа блокує запити, перевірте проксі/VPN: програма звертається до `https://dummyjson.com` через стандартний порт 443.
- Розширити проєкт до рівнів 2 і 3 (curl-метрики, `-w` таймінги, TLS-сертифікати, cookie jar, CORS preflight) можна в окремих модулях `src/tasks/level2.ts` і `src/tasks/level3.ts`.
