import { mkdir } from "node:fs/promises";
import { basename, dirname, extname, join } from "node:path";
import { spawn } from "node:child_process";

function run(command, args, capture = false) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: capture ? ["ignore", "pipe", "pipe"] : "inherit" });
    let stdout = "";
    let stderr = "";
    if (capture) {
      child.stdout.on("data", (chunk) => { stdout += chunk; });
      child.stderr.on("data", (chunk) => { stderr += chunk; });
    }
    child.on("error", reject);
    child.on("close", (code) => code === 0 ? resolve(stdout) : reject(new Error(`${command} terminó con código ${code}${stderr ? `: ${stderr}` : ""}`)));
  });
}

export function canRemuxToMp4(videoCodec, audioCodec) {
  return videoCodec === "h264" && (!audioCodec || audioCodec === "aac");
}

export function safeMp4Name(inputPath) {
  const stem = basename(inputPath, extname(inputPath)).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return `${stem.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 120) || "video"}.mp4`;
}

async function probe(inputPath) {
  const result = await run("ffprobe", ["-v", "error", "-show_entries", "format=duration,size:stream=codec_type,codec_name", "-of", "json", inputPath], true);
  const data = JSON.parse(result);
  const videoCodec = data.streams?.find((stream) => stream.codec_type === "video")?.codec_name;
  const audioCodec = data.streams?.find((stream) => stream.codec_type === "audio")?.codec_name;
  if (!videoCodec) throw new Error("El archivo no contiene una pista de vídeo que se pueda procesar.");
  return { videoCodec, audioCodec, duration: Number(data.format?.duration ?? 0), sizeBytes: Number(data.format?.size ?? 0) };
}

export async function convertToBrowserMp4(inputPath, outputDirectory) {
  const input = await probe(inputPath);
  await mkdir(outputDirectory, { recursive: true });
  const outputPath = join(outputDirectory, safeMp4Name(inputPath));
  const remux = canRemuxToMp4(input.videoCodec, input.audioCodec);
  const audioMap = input.audioCodec ? ["-map", "0:a:0"] : [];
  const codecArgs = remux
    ? ["-c", "copy"]
    : ["-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k"];
  await run("ffmpeg", ["-hide_banner", "-y", "-i", inputPath, "-map", "0:v:0", ...audioMap, ...codecArgs, "-movflags", "+faststart", outputPath]);
  const output = await probe(outputPath);
  if (!canRemuxToMp4(output.videoCodec, output.audioCodec)) throw new Error("El MP4 resultante no tiene códecs H.264/AAC reproducibles en navegador.");
  return { inputPath, outputPath, mode: remux ? "remux" : "transcode", input, output };
}

async function main() {
  const [inputPath, outputDirectory] = process.argv.slice(2);
  if (!inputPath || !outputDirectory) {
    throw new Error("Uso: node workers/local_video_processor.mjs <entrada.mkv|mov> <directorio-salida>");
  }
  const result = await convertToBrowserMp4(inputPath, outputDirectory);
  console.log(JSON.stringify(result, null, 2));
}

if (process.argv[1] && new URL(`file://${process.argv[1]}`).href === import.meta.url) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
