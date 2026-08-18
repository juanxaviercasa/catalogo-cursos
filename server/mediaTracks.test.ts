import { describe, expect, it } from "vitest";
import { getSpanishMediaTracks, type MediaTrack } from "../shared/mediaTracks";

const tracks: MediaTrack[] = [
  { id: 1, extractedVideoId: 7, language: "es", kind: "dubbed_video", label: "Español", storageUrl: "/es.mp4", mimeType: "video/mp4", provider: "local-free" },
  { id: 2, extractedVideoId: 7, language: "es", kind: "captions", label: "Subtítulos", storageUrl: "/es.vtt", mimeType: "text/vtt", provider: "local-free" },
];

describe("pistas en español", () => {
  it("resuelve el vídeo doblado y los subtítulos solo para el vídeo solicitado", () => {
    expect(getSpanishMediaTracks(7, tracks)).toMatchObject({ dubbedVideo: { storageUrl: "/es.mp4" }, captions: { storageUrl: "/es.vtt" } });
    expect(getSpanishMediaTracks(8, tracks)).toEqual({ dubbedVideo: undefined, captions: undefined });
  });
});
