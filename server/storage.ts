import { createWriteStream, promises as fs } from "node:fs";
import { dirname, resolve } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ENV } from "./_core/env";

let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      region: ENV.s3Region || "auto",
      endpoint: ENV.s3Endpoint || undefined,
      credentials: {
        accessKeyId: ENV.s3AccessKeyId,
        secretAccessKey: ENV.s3SecretAccessKey,
      },
      forcePathStyle: true,
    });
  }
  return s3Client;
}

export function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

export function appendHashSuffix(relKey: string): string {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}

export function getLocalPath(key: string): string {
  return resolve(process.cwd(), ENV.storageDir, normalizeKey(key));
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream",
): Promise<{ key: string; url: string }> {
  const key = appendHashSuffix(normalizeKey(relKey));

  if (ENV.storageDriver === "s3" && ENV.s3Bucket) {
    const client = getS3Client();
    const body = Buffer.isBuffer(data) ? data : typeof data === "string" ? Buffer.from(data) : Buffer.from(data);
    await client.send(
      new PutObjectCommand({
        Bucket: ENV.s3Bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
    if (ENV.s3PublicUrl) {
      const publicBase = ENV.s3PublicUrl.replace(/\/+$/, "");
      return { key, url: `${publicBase}/${key}` };
    }
    return { key, url: `/manus-storage/${key}` };
  }

  if (ENV.storageDriver === "forge" && ENV.forgeApiUrl && ENV.forgeApiKey) {
    const forgeUrl = ENV.forgeApiUrl.replace(/\/+$/, "");
    const presignUrl = new URL("v1/storage/presign/put", forgeUrl + "/");
    presignUrl.searchParams.set("path", key);

    const presignResp = await fetch(presignUrl, {
      headers: { Authorization: `Bearer ${ENV.forgeApiKey}` },
    });
    if (!presignResp.ok) {
      throw new Error(`Storage presign failed (${presignResp.status})`);
    }
    const { url: s3Url } = (await presignResp.json()) as { url: string };
    const blob = typeof data === "string" ? new Blob([data], { type: contentType }) : new Blob([data as any], { type: contentType });
    const uploadResp = await fetch(s3Url, {
      method: "PUT",
      headers: { "Content-Type": contentType },
      body: blob,
    });
    if (!uploadResp.ok) throw new Error(`Storage upload failed (${uploadResp.status})`);
    return { key, url: `/manus-storage/${key}` };
  }

  // Default: Local disk storage
  const localPath = getLocalPath(key);
  await fs.mkdir(dirname(localPath), { recursive: true });
  await fs.writeFile(localPath, data);
  return { key, url: `/manus-storage/${key}` };
}

export async function storagePutStream(
  relKey: string,
  data: Readable,
  contentType = "application/octet-stream",
): Promise<{ key: string; url: string }> {
  const key = appendHashSuffix(normalizeKey(relKey));

  if (ENV.storageDriver === "s3" && ENV.s3Bucket) {
    // Collect stream to buffer for S3 upload
    const chunks: Buffer[] = [];
    for await (const chunk of data) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const buffer = Buffer.concat(chunks);
    return storagePut(relKey, buffer, contentType);
  }

  if (ENV.storageDriver === "forge" && ENV.forgeApiUrl && ENV.forgeApiKey) {
    const forgeUrl = ENV.forgeApiUrl.replace(/\/+$/, "");
    const presignUrl = new URL("v1/storage/presign/put", forgeUrl + "/");
    presignUrl.searchParams.set("path", key);
    const presignResp = await fetch(presignUrl, { headers: { Authorization: `Bearer ${ENV.forgeApiKey}` } });
    if (!presignResp.ok) throw new Error(`Storage presign failed (${presignResp.status})`);
    const { url: s3Url } = (await presignResp.json()) as { url: string };
    const uploadResp = await fetch(s3Url, {
      method: "PUT",
      headers: { "Content-Type": contentType },
      body: Readable.toWeb(data) as unknown as BodyInit,
      duplex: "half",
    } as RequestInit);
    if (!uploadResp.ok) throw new Error(`Storage upload failed (${uploadResp.status})`);
    return { key, url: `/manus-storage/${key}` };
  }

  // Default: Local disk storage
  const localPath = getLocalPath(key);
  await fs.mkdir(dirname(localPath), { recursive: true });
  const writeStream = createWriteStream(localPath);
  await pipeline(data, writeStream);
  return { key, url: `/manus-storage/${key}` };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  return { key, url: `/manus-storage/${key}` };
}

export async function storageGetSignedUrl(relKey: string): Promise<string> {
  const key = normalizeKey(relKey);

  if (ENV.storageDriver === "s3" && ENV.s3Bucket) {
    if (ENV.s3PublicUrl) {
      return `${ENV.s3PublicUrl.replace(/\/+$/, "")}/${key}`;
    }
    const client = getS3Client();
    return getSignedUrl(
      client,
      new GetObjectCommand({
        Bucket: ENV.s3Bucket,
        Key: key,
      }),
      { expiresIn: 3600 },
    );
  }

  if (ENV.storageDriver === "forge" && ENV.forgeApiUrl && ENV.forgeApiKey) {
    const forgeUrl = ENV.forgeApiUrl.replace(/\/+$/, "");
    const getUrl = new URL("v1/storage/presign/get", forgeUrl + "/");
    getUrl.searchParams.set("path", key);

    const resp = await fetch(getUrl, {
      headers: { Authorization: `Bearer ${ENV.forgeApiKey}` },
    });
    if (!resp.ok) {
      throw new Error(`Storage signed URL failed (${resp.status})`);
    }
    const { url } = (await resp.json()) as { url: string };
    return url;
  }

  return `/manus-storage/${key}`;
}
