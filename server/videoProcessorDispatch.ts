type QueuedVideo = { id: number; sourcePath: string };
export type VideoProcessorMode = "local-worker" | "persistent-worker";

function envForMode(mode: VideoProcessorMode) {
  const prefix = mode === "local-worker" ? "VIDEO_LOCAL_PROCESSOR" : "VIDEO_PERSISTENT_PROCESSOR";
  const routeMatchesLegacyMode = process.env.VIDEO_PROCESSOR_MODE === mode;
  const url = process.env[`${prefix}_URL`]?.trim() ?? (routeMatchesLegacyMode ? process.env.VIDEO_PROCESSOR_URL?.trim() : undefined);
  const secret = process.env[`${prefix}_SHARED_SECRET`]?.trim() ?? (routeMatchesLegacyMode ? process.env.VIDEO_PROCESSOR_SHARED_SECRET?.trim() : undefined);
  return url && secret ? { mode, url: url.replace(/\/$/, ""), secret } : null;
}

export function isProcessorConfigured(mode: VideoProcessorMode) {
  return Boolean(envForMode(mode));
}

export function buildProcessorDispatchRequest(video: QueuedVideo, mode: VideoProcessorMode | null) {
  const processor = mode ? envForMode(mode) : null;
  if (!processor) return null;
  return {
    url: `${processor.url}/process`,
    init: {
      method: "POST",
      headers: { "content-type": "application/json", "x-video-processor-secret": processor.secret, "x-video-processor-mode": processor.mode },
      body: JSON.stringify({ videoId: video.id, sourcePath: video.sourcePath, mode: processor.mode }),
      signal: AbortSignal.timeout(15_000),
    },
  };
}

export async function dispatchQueuedVideo(video: QueuedVideo, mode: VideoProcessorMode | null) {
  const request = buildProcessorDispatchRequest(video, mode);
  if (!request) return { dispatched: false as const, reason: "not_configured" as const };
  try {
    const response = await fetch(request.url, request.init);
    if (!response.ok) throw new Error(`El trabajador devolvió ${response.status}.`);
    return { dispatched: true as const };
  } catch (error) {
    console.warn("[VideoProcessor] No se pudo entregar el trabajo en cola", { videoId: video.id, error });
    return { dispatched: false as const, reason: "unreachable" as const };
  }
}

export async function dispatchQueuedVideos(videos: QueuedVideo[], mode: VideoProcessorMode | null) {
  return Promise.all(videos.map((video) => dispatchQueuedVideo(video, mode)));
}
