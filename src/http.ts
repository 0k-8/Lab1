/**
 * Універсальна обгортка над вбудованим fetch (Node.js 18+).
 * Вимірює час виконання запиту та розмір тіла відповіді,
 * а також збирає заголовки у звичайний об'єкт.
 */
import { performance } from "node:perf_hooks";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";

export interface HttpResult<T> {
  method: HttpMethod;
  url: string;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: T;
  durationMs: number;
  /** Розмір тіла відповіді у байтах (уже розпакованого, якщо був gzip). */
  sizeBytes: number;
}

export interface RequestOptions {
  method?: HttpMethod;
  /** Тіло запиту: об'єкт буде серіалізовано у JSON автоматично. */
  body?: unknown;
  /** Додаткові заголовки запиту. */
  headers?: Record<string, string>;
}

const DEFAULT_HEADERS: Record<string, string> = {
  Accept: "application/json",
  "User-Agent": "web-rozrobka-lab1/1.0 (Node.js fetch)",
};

/**
 * Виконує HTTP-запит і повертає статус, заголовки, тіло та метрики.
 *
 * @example
 * const result = await request<Product>(`${BASE_URL}/products/1`);
 * console.log(result.status, result.data.title);
 */
export async function request<T>(url: string, options: RequestOptions = {}): Promise<HttpResult<T>> {
  const method: HttpMethod = options.method ?? "GET";
  const headers: Record<string, string> = { ...DEFAULT_HEADERS, ...options.headers };

  const init: RequestInit = { method, headers };

  if (options.body !== undefined) {
    // Явно вказуємо формат тіла, як цього вимагає сервер.
    if (headers["Content-Type"] === undefined) {
      headers["Content-Type"] = "application/json";
    }
    init.body = JSON.stringify(options.body);
  }

  const startedAt = performance.now();
  const response = await fetch(url, init);
  const rawBody = await response.text();
  const durationMs = performance.now() - startedAt;

  // Серіалізуємо заголовки у простий об'єкт «ключ: значення».
  const responseHeaders: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    responseHeaders[key] = value;
  });

  let data: T;
  try {
    data = (rawBody.length > 0 ? JSON.parse(rawBody) : undefined) as T;
  } catch {
    // Деякі ендпоінти можуть повертати не-JSON (наприклад, plain text).
    data = rawBody as unknown as T;
  }

  return {
    method,
    url,
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
    data,
    durationMs: Math.round(durationMs * 100) / 100,
    sizeBytes: Buffer.byteLength(rawBody, "utf8"),
  };
}

/** Друкує стислий опис HTTP-обміну у стилі консолі curl / DevTools. */
export function printExchange<T>(result: HttpResult<T>, bodyLines?: number): void {
  console.log(`> ${result.method} ${new URL(result.url).pathname}${new URL(result.url).search} HTTP/1.1`);
  console.log(`> Host: ${new URL(result.url).host}`);
  console.log("");
  console.log(`< HTTP/1.1 ${result.status} ${result.statusText}`);
  for (const [key, value] of Object.entries(result.headers)) {
    // Показуємо лише найважливіші заголовки, щоб вивід був читабельним.
    if (["content-type", "content-length", "etag", "date", "server", "cache-control"].includes(key)) {
      console.log(`< ${key}: ${value}`);
    }
  }
  console.log("");

  const text = typeof result.data === "string" ? result.data : JSON.stringify(result.data, null, 2);
  const lines = text.split("\n");
  const shown = bodyLines === undefined ? lines : lines.slice(0, bodyLines);
  console.log(shown.join("\n"));
  if (bodyLines !== undefined && lines.length > bodyLines) {
    console.log(`... (показано ${bodyLines} з ${lines.length} рядків)`);
  }

  console.log(`\n[метрики] час: ${result.durationMs} мс | розмір тіла: ${result.sizeBytes} Б`);
}
