import assert from "node:assert/strict";
import { getVideoProcessingHistory } from "../../server/db";

const events = await getVideoProcessingHistory();
assert(events.length > 0, "El historial administrativo no contiene eventos reales.");
for (const event of events) {
  assert(event.title.length > 0, "Cada evento debe incluir un título de vídeo.");
  assert(event.progressPercent >= 0 && event.progressPercent <= 100, "El avance debe estar entre 0 y 100.");
  assert(event.message, "Cada evento debe incluir un mensaje legible.");
  assert(!event.message?.includes("SECRET"), "El historial no debe contener secretos.");
}
console.log(JSON.stringify({ totalEvents: events.length, statuses: events.reduce((summary, event) => ({ ...summary, [event.status]: (summary[event.status] ?? 0) + 1 }), {} as Record<string, number>) }, null, 2));
process.exit(0);
