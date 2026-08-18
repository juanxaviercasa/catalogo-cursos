type QueuedVideo = { id: number; sourcePath: string };
export type VideoProcessorMode = "local-worker" | "persistent-worker";

function configuredProcessor() {
  const mode = process.env.VIDEO_PROCESSOR_MODE;
  const url = process.env.VIDEO_PROCESSOR_URL?.trim();
  const secret = process.env.VIDEO_PROCESSOR_SHARED_SECRET?.trim();
  if ((mode !== "local-worker" && mode !== "persistent-worker") || !url || !secret) return null;
  return { mode, url: url.replace(/\/$/, ""), secret } as const;
}

export function buildProcessorDispatchRequest(video: QueuedVideo) {
  const processor = configuredProcessor();
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

export async function dispatchQueuedVideo(video: QueuedVideo) {
  const request = buildProcessorDispatchRequest(video);
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

export async function dispatchQueuedVideos(videos: QueuedVideo[]) {
  return Promise.all(videos.map(dispatchQueuedVideo));
}
