import { createReadStream, existsSync, statSync } from "node:fs";
import { extname } from "node:path";
import type { Express, Request, Response } from "express";
import { ENV } from "./env";
import { getLocalPath, storageGetSignedUrl } from "../storage";

const MIME_TYPES: Record<string, string> = {
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mkv": "video/x-matroska",
  ".mov": "video/quicktime",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".vtt": "text/vtt",
  ".srt": "text/plain",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".json": "application/json",
};

function handleLocalFileStream(filePath: string, req: Request, res: Response) {
  if (!existsSync(filePath)) {
    res.status(404).send("File not found");
    return;
  }

  const stat = statSync(filePath);
  const fileSize = stat.size;
  const ext = extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";

  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    if (start >= fileSize || end >= fileSize) {
      res.status(416).set("Content-Range", `bytes */${fileSize}`).send("Requested range not satisfiable");
      return;
    }

    const chunksize = end - start + 1;
    const fileStream = createReadStream(filePath, { start, end });

    res.writeHead(206, {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunksize,
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=3600",
    });

    fileStream.pipe(res);
  } else {
    res.writeHead(200, {
      "Content-Length": fileSize,
      "Content-Type": contentType,
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=3600",
    });

    createReadStream(filePath).pipe(res);
  }
}

export function registerStorageProxy(app: Express) {
  const handler = async (req: Request, res: Response) => {
    const key = (req.params as Record<string, string>)[0];
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }

    // 1. S3 / R2 mode
    if (ENV.storageDriver === "s3" && ENV.s3Bucket) {
      try {
        const signedUrl = await storageGetSignedUrl(key);
        res.set("Cache-Control", "no-store");
        res.redirect(307, signedUrl);
        return;
      } catch (err) {
        console.error("[StorageProxy] S3 error:", err);
        res.status(502).send("S3 Storage error");
        return;
      }
    }

    // 2. Forge mode
    if (ENV.storageDriver === "forge" && ENV.forgeApiUrl && ENV.forgeApiKey) {
      try {
        const signedUrl = await storageGetSignedUrl(key);
        res.set("Cache-Control", "no-store");
        res.redirect(307, signedUrl);
        return;
      } catch (err) {
        console.error("[StorageProxy] Forge error:", err);
        res.status(502).send("Forge Storage error");
        return;
      }
    }

    // 3. Local disk mode
    try {
      const filePath = getLocalPath(key);
      handleLocalFileStream(filePath, req, res);
    } catch (err) {
      console.error("[StorageProxy] Local stream error:", err);
      res.status(500).send("Internal storage error");
    }
  };

  app.get("/manus-storage/*", handler);
  app.get("/storage/*", handler);
}
