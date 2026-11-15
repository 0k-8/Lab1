/**
 * Низькорівневий HTTPS-запит на базі модуля node:https.
 *
 * На відміну від fetch, цей модуль дає доступ до фаз з'єднання,
 * тому саме він використовується для побудови таблиці Timing,
 * аналогічної вкладці Network → Timing у DevTools.
 */
import https from "node:https";
import zlib from "node:zlib";
import { performance } from "node:perf_hooks";

export interface ProbeTimings {
  /** Час DNS-резолвінгу доменного імені. */
  dnsMs: number;
  /** Час встановлення TCP-з'єднання. */
  tcpMs: number;
  /** Час рукостискання TLS (від TCP до готового захищеного каналу). */
  tlsMs: number;
  /** Час до отримання першого байта відповіді (TTFB). */
  ttfbMs: number;
  /** Час завантаження тіла відповіді. */
  downloadMs: number;
  /** Загальний час запиту. */
  totalMs: number;
}

export interface ProbeResult {
  url: string;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  /** Заголовки, які реально надіслав клієнт. */
  requestHeaders: Record<string, string>;
  timings: ProbeTimings;
  /** Розмір отриманого тіла у байтах (до розпакування). */
  sizeBytes: number;
  body: string;
}

/** Надсилає GET-запит і фіксує таймінги фаз з'єднання. */
export function probe(url: string): Promise<ProbeResult> {
  return new Promise<ProbeResult>((resolve, reject) => {
    const startedAt = performance.now();

    let dnsMs = 0;
    let tcpMs = 0;
    let tlsMs = 0;
    let ttfbMs = 0;

    const requestHeaders: Record<string, string> = {
      Accept: "application/json",
      "User-Agent": "web-rozrobka-lab1/1.0",
      "Accept-Encoding": "gzip, deflate, br",
    };

    const req = https.request(
      url,
      {
        method: "GET",
        headers: requestHeaders,
        // agent: false — щоразу нове з'єднання, щоб таймінги були чесними.
        agent: false,
      },
      (res) => {
        ttfbMs = performance.now() - startedAt;

        const chunks: Buffer[] = [];
        let sizeBytes = 0;

        res.on("data", (chunk: Buffer) => {
          chunks.push(chunk);
          sizeBytes += chunk.length;
        });

        res.on("end", () => {
          const totalMs = performance.now() - startedAt;
          const headers: Record<string, string> = {};
          for (const [key, value] of Object.entries(res.headers)) {
            headers[key] = Array.isArray(value) ? value.join(", ") : String(value ?? "");
          }

          const raw = Buffer.concat(chunks);
          const encoding = headers["content-encoding"] ?? "";
          const body = decodeBody(raw, encoding).toString("utf8");

          resolve({
            url,
            status: res.statusCode ?? 0,
            statusText: res.statusMessage ?? "",
            headers,
            requestHeaders,
            timings: {
              dnsMs: round(dnsMs),
              tcpMs: round(tcpMs),
              tlsMs: round(tlsMs),
              ttfbMs: round(ttfbMs),
              downloadMs: round(totalMs - ttfbMs),
              totalMs: round(totalMs),
            },
            sizeBytes,
            body,
          });
        });
      },
    );

    // Фази з'єднання доступні через події сокета.
    req.on("socket", (socket) => {
      socket.on("lookup", () => {
        dnsMs = performance.now() - startedAt;
      });
      socket.on("connect", () => {
        tcpMs = performance.now() - startedAt;
      });
      socket.on("secureConnect", () => {
        tlsMs = performance.now() - startedAt;
      });
    });

    req.on("error", reject);
    req.end();
  });
}

function decodeBody(raw: Buffer, encoding: string): Buffer {
  switch (encoding) {
    case "gzip":
      return zlib.gunzipSync(raw);
    case "deflate":
      return zlib.inflateSync(raw);
    case "br":
      return zlib.brotliDecompressSync(raw);
    default:
      return raw;
  }
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}
