/**
 * Прості допоміжні функції для форматування виводу в консоль.
 * Стиль виводу повторює приклад очікуваного результату з методички.
 */

const LINE = "=".repeat(64);

/** Друкує заголовок розділу. */
export function section(title: string): void {
  console.log(`\n${LINE}\n  ${title}\n${LINE}`);
}

/** Друкує пару «підпис — значення». */
export function kv(label: string, value: string | number): void {
  console.log(`${label.padEnd(30, ".")} ${value}`);
}

/** Друкує об'єкт у форматі JSON із відступами. */
export function json(value: unknown): void {
  console.log(JSON.stringify(value, null, 2));
}

/**
 * Перевірка очікування (аналог assert, але не зупиняє програму).
 * Повертає true, якщо перевірка пройдена.
 */
export function check(name: string, ok: boolean, details = ""): boolean {
  const mark = ok ? "[OK]  " : "[FAIL]";
  const suffix = details.length > 0 ? ` (${details})` : "";
  console.log(`${mark} ${name}${suffix}`);
  return ok;
}

/** Друкує текстовий рядок із відступом. */
export function note(text: string): void {
  console.log(`       ${text}`);
}
