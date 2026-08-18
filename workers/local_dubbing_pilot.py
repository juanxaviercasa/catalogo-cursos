#!/usr/bin/env python3
"""Genera artefactos locales de doblaje inglés-español sin APIs de pago.

Requiere: ffmpeg en PATH, faster-whisper, argostranslate y una CLI compatible
con Piper declarada en PIPER_BIN/PIPER_MODEL. El script no sube archivos ni
contacta a la plataforma: permite revisar el resultado antes de publicarlo.
"""

from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path


def run(command: list[str], *, text: str | None = None) -> None:
    subprocess.run(command, input=text, text=True, check=True)


def timestamp(seconds: float) -> str:
    total_ms = round(seconds * 1000)
    hours, remainder = divmod(total_ms, 3_600_000)
    minutes, remainder = divmod(remainder, 60_000)
    secs, millis = divmod(remainder, 1000)
    return f"{hours:02}:{minutes:02}:{secs:02}.{millis:03}"


def atempo_filters(factor: float) -> list[str]:
    filters: list[str] = []
    while factor > 2:
        filters.append("atempo=2")
        factor /= 2
    while factor < 0.5:
        filters.append("atempo=0.5")
        factor /= 0.5
    filters.append(f"atempo={factor:.4f}")
    return filters


def ensure_argos_en_es():
    import argostranslate.package
    import argostranslate.translate

    installed = argostranslate.translate.get_installed_languages()
    if any(language.code == "en" for language in installed) and any(language.code == "es" for language in installed):
        return argostranslate.translate
    argostranslate.package.update_package_index()
    package = next(item for item in argostranslate.package.get_available_packages() if item.from_code == "en" and item.to_code == "es")
    argostranslate.package.install_from_path(package.download())
    return argostranslate.translate


def main() -> int:
    parser = argparse.ArgumentParser(description="Dobla localmente un vídeo del inglés al español.")
    parser.add_argument("--input", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--whisper-model", default="small")
    parser.add_argument("--overrides", type=Path, help="JSON opcional con correcciones por índice de segmento.")
    args = parser.parse_args()

    if not args.input.is_file():
        raise SystemExit(f"No existe el vídeo: {args.input}")
    if not shutil.which("ffmpeg"):
        raise SystemExit("Instala FFmpeg y asegúrate de que esté disponible en PATH.")
    piper_bin, piper_model = os.environ.get("PIPER_BIN"), os.environ.get("PIPER_MODEL")
    if not piper_bin or not piper_model:
        raise SystemExit("Define PIPER_BIN y PIPER_MODEL antes de ejecutar la prueba.")

    args.output.mkdir(parents=True, exist_ok=True)
    chunks = args.output / "chunks"
    chunks.mkdir(exist_ok=True)
    source_audio = args.output / "source.wav"
    run(["ffmpeg", "-y", "-i", str(args.input), "-vn", "-ac", "1", "-ar", "16000", str(source_audio)])

    from faster_whisper import WhisperModel
    translator = ensure_argos_en_es()
    model = WhisperModel(args.whisper_model, device="cpu", compute_type="int8")
    segments, _ = model.transcribe(str(source_audio), language="en", vad_filter=True)
    overrides = json.loads(args.overrides.read_text(encoding="utf-8")) if args.overrides else {}
    records = []
    for index, segment in enumerate(segments):
        source_text = segment.text.strip()
        if not source_text:
            continue
        translated = overrides.get(str(index), translator.translate(source_text, "en", "es"))
        raw = chunks / f"{index:04}-raw.wav"
        adjusted = chunks / f"{index:04}-adjusted.wav"
        run([piper_bin, "--model", piper_model, "--output_file", str(raw)], text=translated)
        target_duration = max(segment.end - segment.start, 0.2)
        probe = subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=nk=1:nw=1", str(raw)], text=True)
        raw_duration = float(probe.strip())
        # Nunca ralentizar una frase breve: es preferible una pausa natural a una voz estirada.
        # Solo se acelera cuando la frase sintetizada supera la ventana original.
        factor = max(raw_duration / target_duration, 1.0)
        filters = ",".join(atempo_filters(factor) + [f"adelay={round(segment.start * 1000)}|{round(segment.start * 1000)}"])
        run(["ffmpeg", "-y", "-i", str(raw), "-af", filters, str(adjusted)])
        records.append({"start": segment.start, "end": segment.end, "source": source_text, "translation": translated, "audio": adjusted.name, "paceFactor": factor})

    if not records:
        raise SystemExit("No se detectó habla en inglés para traducir.")
    inputs = [value for record in records for value in ("-i", str(chunks / record["audio"]))]
    mix = f"amix=inputs={len(records)}:duration=longest:normalize=0"
    run(["ffmpeg", "-y", *inputs, "-filter_complex", mix, "-c:a", "libmp3lame", "-b:a", "192k", str(args.output / "dubbed-es.mp3")])

    with (args.output / "segments-es.json").open("w", encoding="utf-8") as target:
        json.dump(records, target, ensure_ascii=False, indent=2)
    with (args.output / "subtitles-es.vtt").open("w", encoding="utf-8") as target:
        target.write("WEBVTT\n\n")
        for index, record in enumerate(records, start=1):
            target.write(f"{index}\n{timestamp(record['start'])} --> {timestamp(record['end'])}\n{record['translation']}\n\n")
    print(f"Listo: {args.output / 'dubbed-es.mp3'}")
    print("Revisa el resultado antes de asociarlo al módulo en la plataforma.")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except subprocess.CalledProcessError as error:
        print(f"Falló una herramienta local: {' '.join(error.cmd)}", file=sys.stderr)
        raise SystemExit(error.returncode)
