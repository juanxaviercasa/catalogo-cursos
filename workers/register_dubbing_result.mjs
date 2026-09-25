import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { saveMediaTrack } from "../server/db.ts";
import { storagePut } from "../server/storage.ts";

const [videoIdStr, audioFilePath, vttFilePath, provider = "local-stack"] = process.argv.slice(2);
const videoId = Number(videoIdStr);

if (!videoId || !audioFilePath || !vttFilePath) {
  console.error("Uso: npx tsx workers/register_dubbing_result.mjs <videoId> <audioFilePath> <vttFilePath> [provider]");
  process.exit(1);
}

const audioBytes = await readFile(audioFilePath);
const vttBytes = await readFile(vttFilePath, "utf8");

// Upload dubbed audio
const audioKey = `dubbing/${videoId}/audio/${basename(audioFilePath)}`;
const storedAudio = await storagePut(audioKey, audioBytes, audioFilePath.endsWith(".mp4") ? "video/mp4" : "audio/mpeg");

// Upload captions
const vttKey = `dubbing/${videoId}/captions/${basename(vttFilePath)}`;
const storedVtt = await storagePut(vttKey, vttBytes, "text/vtt");

// Save media tracks
await saveMediaTrack({
  extractedVideoId: videoId,
  language: "es",
  kind: "dubbed_video",
  label: "Español",
  storageKey: storedAudio.key,
  storageUrl: storedAudio.url,
  mimeType: audioFilePath.endsWith(".mp4") ? "video/mp4" : "audio/mpeg",
  provider,
});

await saveMediaTrack({
  extractedVideoId: videoId,
  language: "es",
  kind: "captions",
  label: "Español (Subtítulos)",
  storageKey: storedVtt.key,
  storageUrl: storedVtt.url,
  mimeType: "text/vtt",
  provider,
});

console.log(JSON.stringify({
  success: true,
  videoId,
  audioUrl: storedAudio.url,
  vttUrl: storedVtt.url,
  provider,
}, null, 2));
