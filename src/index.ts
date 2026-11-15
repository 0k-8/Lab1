/**
 * Точка входу програми.
 *
 * Запуск:  npm start
 * Перевірка типів:  npm run typecheck
 */
import { runLevel1 } from "./tasks/level1";

async function main(): Promise<void> {
  const startedAt = Date.now();

  console.log("Практична робота №1: дослідження мережевих протоколів HTTP/HTTPS");
  console.log("Рівень 1 (базовий): DevTools / Postman / TypeScript-клієнт\n");

  const failedChecks = await runLevel1();

  const elapsedSeconds = ((Date.now() - startedAt) / 1000).toFixed(2);
  console.log(`Загальний час виконання: ${elapsedSeconds} с`);

  if (failedChecks > 0) {
    console.error(`\nЗавершено з помилками: ${failedChecks} перевірок не пройдено.`);
    process.exitCode = 1;
  } else {
    console.log("Усі перевірки пройдено успішно.");
  }
}

main().catch((error: unknown) => {
  console.error("\nКритична помилка виконання:");
  console.error(error);
  process.exitCode = 1;
});
