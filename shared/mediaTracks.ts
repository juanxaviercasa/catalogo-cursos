export type MediaTrack = {
  id: number;
  extractedVideoId: number;
  language: string;
  kind: "dubbed_video" | "captions";
  label: string;
  storageUrl: string;
  mimeType: string;
  provider: string;
};

export function getSpanishMediaTracks(extractedVideoId: number, tracks: MediaTrack[]) {
  const tracksForVideo = tracks.filter((track) => track.extractedVideoId === extractedVideoId && track.language === "es");
  return {
    dubbedVideo: tracksForVideo.find((track) => track.kind === "dubbed_video"),
    captions: tracksForVideo.find((track) => track.kind === "captions"),
  };
}
