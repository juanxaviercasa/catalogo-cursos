import { createServer } from "node:http";
import { spawn } from "node:child_process";

const sharedSecret = process.env.VIDEO_PROCESSOR_SHARED_SECRET;
const port = Number(process.env.PORT ?? process.env.VIDEO_PROCESSOR_PORT);

if (!sharedSecret) {
  throw new Error("VIDEO_PROCESSOR_SHARED_SECRET es obligatorio para iniciar el trabajador de vídeo.");
}
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT o VIDEO_PROCESSOR_PORT debe contener un puerto válido para iniciar el trabajador de vídeo.");
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => { body += chunk; });
    request.on("end", () => {
      try { resolve(JSON.parse(body)); } catch { reject(new Error("El cuerpo debe ser JSON válido.")); }
    });
    request.on("error", reject);
  });
}

createServer(async (request, response) => {
  if (request.method !== "POST" || request.url !== "/process") {
    response.writeHead(404).end();
    return;
  }
  if (request.headers["x-video-processor-secret"] !== sharedSecret) {
    response.writeHead(401).end("No autorizado");
    return;
  }
  try {
    const payload = await readJson(request);
    const videoId = Number(payload.videoId);
    if (!Number.isInteger(videoId) || videoId <= 0) throw new Error("videoId no es válido.");
    const child = spawn("pnpm", ["tsx", "workers/process_queued_video.ts", "--video-id", String(videoId)], {
      cwd: process.cwd(),
      detached: true,
      stdio: "ignore",
      env: process.env,
    });
    child.unref();
    response.writeHead(202, { "content-type": "application/json" }).end(JSON.stringify({ accepted: true, videoId }));
  } catch (error) {
    response.writeHead(400, { "content-type": "application/json" }).end(JSON.stringify({ error: error instanceof Error ? error.message : "Solicitud inválida." }));
  }
}).listen(port, () => console.log(`Video processor listening on ${port}`));
