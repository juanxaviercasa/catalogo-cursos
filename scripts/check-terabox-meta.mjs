import { teraboxCatalog } from "../shared/teraboxCatalog.ts";
import { courseMeta, getCourseSource } from "../shared/courseMeta.ts";
const missing = teraboxCatalog.filter((course) => !courseMeta.some((meta) => meta.id === course.id && getCourseSource(meta) === "terabox"));
console.log(JSON.stringify(missing.map(({ id, name }) => ({ id, name })), null, 2));
