/**
 * РІВЕНЬ 1 (базовий).
 *
 * Що робить цей модуль:
 *  1. Перевіряє середовище (Node.js, fetch, curl).
 *  2. Виконує повний CRUD-цикл над ресурсом «товар» у dummyjson.com:
 *     GET → POST → PUT → DELETE (аналог запитів у Postman / REST Client).
 *  3. Збирає дані, які в DevTools відображаються на вкладці Network:
 *     General, Response Headers, Request Headers, Timing.
 *  4. Зберігає результати у results/level1.json та results/level1-report.md.
 */
import { execFileSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { lookup } from "node:dns/promises";

import { BASE_URL, RESULTS_DIR } from "../config";
import { printExchange, request } from "../http";
import { probe, type ProbeTimings } from "../httpsProbe";
import { check, kv, note, section } from "../logger";
import type { CreatedProduct, DeletedProduct, Product, ProductsResponse } from "../types";

interface CheckResult {
  name: string;
  ok: boolean;
}

interface CrudSummary {
  status: number;
  durationMs: number;
  sizeBytes: number;
  fields: Record<string, string | number | boolean>;
}

interface DevToolsSummary {
  requestUrl: string;
  requestMethod: string;
  statusCode: number;
  remoteAddress: string;
  responseHeaders: Record<string, string>;
  requestHeaders: Record<string, string>;
  timings: ProbeTimings;
  sizeBytes: number;
}

interface Level1Report {
  generatedAt: string;
  environment: {
    node: string;
    platform: string;
    curl: string;
  };
  crud: {
    get: CrudSummary;
    post: CrudSummary;
    put: CrudSummary;
    delete: CrudSummary;
  };
  devtools: DevToolsSummary;
  checks: CheckResult[];
}

const NEW_PRODUCT_TITLE = "TypeScript: повний практичний посібник";
const UPDATED_PRODUCT_TITLE = "TypeScript: посібник (оновлено через PUT)";

export async function runLevel1(): Promise<number> {
  const checks: CheckResult[] = [];

  /** Виконує перевірку, друкує її результат і запам'ятовує для звіту. */
  const verify = (name: string, ok: boolean, details = ""): boolean => {
    check(name, ok, details);
    checks.push({ name, ok });
    return ok;
  };

  // ---------------------------------------------------------------------------
  // Завдання 1. Підготовка середовища
  // ---------------------------------------------------------------------------
  section("ЗАВДАННЯ 1. ПЕРЕВІРКА СЕРЕДОВИЩА");

  const curl = curlVersion();
  kv("Node.js", process.version);
  kv("Платформа", `${process.platform} / ${process.arch}`);
  kv("fetch доступний", typeof fetch === "function" ? "так" : "ні");
  kv("curl", curl);

  verify("Node.js версії 18+", Number(process.versions.node.split(".")[0]) >= 18, process.version);
  verify("Вбудований fetch доступний", typeof fetch === "function");
  verify("Утиліта curl доступна", !curl.startsWith("не знайдено"), curl.split(" ").slice(0, 2).join(" "));

  // ---------------------------------------------------------------------------
  // Завдання 2. CRUD-запити (Postman / REST Client)
  // ---------------------------------------------------------------------------
  section("ЗАВДАННЯ 2. CRUD-ЗАПИТИ ДО DUMMYJSON");

  // 2.1 GET — отримання одного товару.
  console.log("\n--- GET /products/1 ---");
  const getResult = await request<Product>(`${BASE_URL}/products/1`);
  printExchange(getResult);

  verify("GET /products/1 повертає 200 OK", getResult.status === 200, `status=${getResult.status}`);
  verify(
    "Тіло містить id, title і price",
    typeof getResult.data.id === "number" &&
      typeof getResult.data.title === "string" &&
      typeof getResult.data.price === "number",
  );

  // 2.2 POST — створення нового товару.
  console.log("\n--- POST /products/add ---");
  const postResult = await request<CreatedProduct>(`${BASE_URL}/products/add`, {
    method: "POST",
    body: { title: NEW_PRODUCT_TITLE, price: 499 },
  });
  printExchange(postResult);

  verify("POST /products/add повертає 201 Created", postResult.status === 201, `status=${postResult.status}`);
  verify("Сервер згенерував числовий id", typeof postResult.data.id === "number", `id=${postResult.data.id}`);
  verify("Створений товар має переданий title", postResult.data.title === NEW_PRODUCT_TITLE);

  // 2.3 PUT — повне оновлення товару за фіксованим URI.
  console.log("\n--- PUT /products/1 ---");
  const putResult = await request<Product>(`${BASE_URL}/products/1`, {
    method: "PUT",
    body: { title: UPDATED_PRODUCT_TITLE },
  });
  printExchange(putResult);

  verify("PUT /products/1 повертає 200 OK", putResult.status === 200, `status=${putResult.status}`);
  verify("Поле title оновлено", putResult.data.title === UPDATED_PRODUCT_TITLE, putResult.data.title);

  // 2.4 DELETE — видалення товару.
  console.log("\n--- DELETE /products/1 ---");
  const deleteResult = await request<DeletedProduct>(`${BASE_URL}/products/1`, { method: "DELETE" });
  printExchange(deleteResult);

  verify("DELETE /products/1 повертає 200 OK", deleteResult.status === 200, `status=${deleteResult.status}`);
  verify("Відповідь містить isDeleted: true", deleteResult.data.isDeleted === true);
  verify("Відповідь містить дату видалення deletedOn", typeof deleteResult.data.deletedOn === "string");

  // ---------------------------------------------------------------------------
  // Завдання 3. Структура запиту як у DevTools → Network
  // ---------------------------------------------------------------------------
  section("ЗАВДАННЯ 3. АНАЛІЗ СТРУКТУРИ ЗАПИТУ (DevTools → Network)");

  const networkUrl = `${BASE_URL}/products?limit=5`;
  const probed = await probe(networkUrl);
  const remoteIp = await lookup("dummyjson.com", { family: 4 })
    .then((address) => address.address)
    .catch(() => "невідомо");

  const body = JSON.parse(probed.body) as ProductsResponse;

  console.log("\nGeneral");
  kv("Request URL", networkUrl);
  kv("Request Method", "GET");
  kv("Status Code", `${probed.status} ${probed.statusText}`);
  kv("Remote Address", `${remoteIp}:443`);

  console.log("\nResponse Headers");
  printHeader("content-type", probed.headers["content-type"]);
  printHeader("date", probed.headers["date"]);
  printHeader("server", probed.headers["server"]);
  printHeader("etag", probed.headers["etag"]);
  printHeader("cache-control", probed.headers["cache-control"]);

  console.log("\nRequest Headers");
  printHeader("accept", probed.requestHeaders["Accept"]);
  printHeader("user-agent", probed.requestHeaders["User-Agent"]);
  printHeader("accept-encoding", probed.requestHeaders["Accept-Encoding"]);

  console.log("\nTiming");
  kv("DNS Lookup", `${probed.timings.dnsMs} мс`);
  kv("Initial connection (TCP)", `${probed.timings.tcpMs} мс`);
  kv("TLS handshake", `${probed.timings.tlsMs} мс`);
  kv("Waiting for server response (TTFB)", `${probed.timings.ttfbMs} мс`);
  kv("Content Download", `${probed.timings.downloadMs} мс`);
  kv("Total", `${probed.timings.totalMs} мс`);
  kv("Розмір тіла", `${probed.sizeBytes} Б`);
  kv("Товарів у відповіді", body.products.length);

  verify("Network-запит повертає 200 OK", probed.status === 200, `status=${probed.status}`);
  verify("Content-Type = application/json", (probed.headers["content-type"] ?? "").includes("application/json"));
  verify("Присутній заголовок date", probed.headers["date"] !== undefined);
  verify("Присутній заголовок server", probed.headers["server"] !== undefined);
  verify("Присутній заголовок etag", probed.headers["etag"] !== undefined);
  verify("DNS-резолвінг зафіксовано", probed.timings.dnsMs > 0, `${probed.timings.dnsMs} мс`);
  verify("TLS-рукостискання зафіксовано", probed.timings.tlsMs > 0, `${probed.timings.tlsMs} мс`);
  verify("TTFB більший за час з'єднання", probed.timings.ttfbMs >= probed.timings.tlsMs);

  // ---------------------------------------------------------------------------
  // Підсумок і збереження звіту
  // ---------------------------------------------------------------------------
  const report: Level1Report = {
    generatedAt: new Date().toISOString(),
    environment: {
      node: process.version,
      platform: `${process.platform} / ${process.arch}`,
      curl,
    },
    crud: {
      get: summarize(getResult.status, getResult.durationMs, getResult.sizeBytes, {
        id: getResult.data.id,
        title: getResult.data.title,
        price: getResult.data.price,
        category: getResult.data.category,
      }),
      post: summarize(postResult.status, postResult.durationMs, postResult.sizeBytes, {
        id: postResult.data.id,
        title: postResult.data.title,
        price: postResult.data.price,
      }),
      put: summarize(putResult.status, putResult.durationMs, putResult.sizeBytes, {
        id: putResult.data.id,
        title: putResult.data.title,
      }),
      delete: summarize(deleteResult.status, deleteResult.durationMs, deleteResult.sizeBytes, {
        id: deleteResult.data.id,
        isDeleted: deleteResult.data.isDeleted,
        deletedOn: deleteResult.data.deletedOn,
      }),
    },
    devtools: {
      requestUrl: networkUrl,
      requestMethod: "GET",
      statusCode: probed.status,
      remoteAddress: `${remoteIp}:443`,
      responseHeaders: {
        "content-type": probed.headers["content-type"] ?? "",
        date: probed.headers["date"] ?? "",
        server: probed.headers["server"] ?? "",
        etag: probed.headers["etag"] ?? "",
        "cache-control": probed.headers["cache-control"] ?? "",
      },
      requestHeaders: probed.requestHeaders,
      timings: probed.timings,
      sizeBytes: probed.sizeBytes,
    },
    checks,
  };

  await saveReport(report);

  section("ПІДСУМОК РІВНЯ 1");
  const failed = checks.filter((item) => !item.ok);
  kv("Виконано перевірок", checks.length);
  kv("Успішних", checks.length - failed.length);
  kv("Невдалих", failed.length);
  if (failed.length > 0) {
    for (const item of failed) {
      note(`не пройдено: ${item.name}`);
    }
  }
  console.log("\nЗвіт збережено у папці results/ (level1.json, level1-report.md)\n");

  return failed.length;
}

// -----------------------------------------------------------------------------
// Допоміжні функції
// -----------------------------------------------------------------------------

function curlVersion(): string {
  try {
    const output = execFileSync("curl", ["--version"], { encoding: "utf8" });
    return (output.split("\n")[0] ?? "curl").trim();
  } catch {
    return "не знайдено (встановіть curl)";
  }
}

function printHeader(name: string, value: string | undefined): void {
  kv(name, value !== undefined && value !== "" ? value : "—");
}

function summarize(
  status: number,
  durationMs: number,
  sizeBytes: number,
  fields: Record<string, string | number | boolean>,
): CrudSummary {
  return { status, durationMs, sizeBytes, fields };
}

async function saveReport(report: Level1Report): Promise<void> {
  await mkdir(RESULTS_DIR, { recursive: true });
  await writeFile(join(RESULTS_DIR, "level1.json"), JSON.stringify(report, null, 2), "utf8");
  await writeFile(join(RESULTS_DIR, "level1-report.md"), buildMarkdown(report), "utf8");
}

function buildMarkdown(report: Level1Report): string {
  const { environment, crud, devtools, checks } = report;

  const crudRows = [
    ["GET /products/1", crud.get],
    ["POST /products/add", crud.post],
    ["PUT /products/1", crud.put],
    ["DELETE /products/1", crud.delete],
  ] as const;

  const crudTable = crudRows
    .map(([label, item]) => {
      const fields = Object.entries(item.fields)
        .map(([key, value]) => `${key}=${String(value)}`)
        .join(", ");
      return `| \`${label}\` | ${item.status} | ${item.durationMs} | ${item.sizeBytes} | ${fields} |`;
    })
    .join("\n");

  const timingRows = [
    ["DNS Lookup", devtools.timings.dnsMs],
    ["Initial connection (TCP)", devtools.timings.tcpMs],
    ["TLS handshake", devtools.timings.tlsMs],
    ["Waiting for server response (TTFB)", devtools.timings.ttfbMs],
    ["Content Download", devtools.timings.downloadMs],
    ["Total", devtools.timings.totalMs],
  ]
    .map(([label, value]) => `| ${label} | ${value} |`)
    .join("\n");

  const checkRows = checks
    .map((item) => `| ${item.name} | ${item.ok ? "✅ пройдено" : "❌ не пройдено"} |`)
    .join("\n");

  return `# Практична робота №1 — Рівень 1 (базовий)

> Звіт сформовано автоматично скриптом \`npm start\`.
> Дата генерації: ${report.generatedAt}

## 1. Середовище виконання

| Параметр | Значення |
| --- | --- |
| Node.js | ${environment.node} |
| Платформа | ${environment.platform} |
| curl | ${environment.curl.replaceAll("|", "\\|")} |

## 2. CRUD-запити (аналог колекції Postman)

| Запит | Статус | Час, мс | Розмір тіла, Б | Ключові поля відповіді |
| --- | --- | --- | --- | --- |
${crudTable}

## 3. Структура запиту (DevTools → Network)

### General

| Параметр | Значення |
| --- | --- |
| Request URL | \`${devtools.requestUrl}\` |
| Request Method | ${devtools.requestMethod} |
| Status Code | ${devtools.statusCode} |
| Remote Address | ${devtools.remoteAddress} |

### Response Headers

| Заголовок | Значення |
| --- | --- |
| content-type | ${devtools.responseHeaders["content-type"]} |
| date | ${devtools.responseHeaders.date} |
| server | ${devtools.responseHeaders.server} |
| etag | ${devtools.responseHeaders.etag} |
| cache-control | ${devtools.responseHeaders["cache-control"]} |

### Request Headers

| Заголовок | Значення |
| --- | --- |
| accept | ${devtools.requestHeaders.Accept} |
| user-agent | ${devtools.requestHeaders["User-Agent"]} |
| accept-encoding | ${devtools.requestHeaders["Accept-Encoding"]} |

### Timing

| Фаза | Час, мс |
| --- | --- |
${timingRows}

## 4. Результати перевірок

| Перевірка | Результат |
| --- | --- |
${checkRows}
`;
}
