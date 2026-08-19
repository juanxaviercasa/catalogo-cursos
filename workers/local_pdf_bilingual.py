#!/usr/bin/env python3
"""Genera una lectura bilingüe y un PDF reconstruido en español desde un PDF autorizado.

Requiere: pypdf, argostranslate, reportlab, y una fuente DejaVu Sans instalada.
No envía el documento a servicios de pago ni modifica el PDF original.
"""

from __future__ import annotations

import argparse
import json
import re
from functools import lru_cache
from pathlib import Path

import argostranslate.translate
from pypdf import PdfReader
from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import PageBreak, Paragraph, SimpleDocTemplate, Spacer
from reportlab.lib import colors


def normalize_text(value: str) -> str:
    lines = [re.sub(r"\s+", " ", line).strip() for line in value.splitlines()]
    paragraphs: list[str] = []
    current: list[str] = []
    for line in lines:
        if not line:
            if current:
                paragraphs.append(" ".join(current))
                current = []
            continue
        current.append(line)
    if current:
        paragraphs.append(" ".join(current))
    return "\n\n".join(paragraphs)


def split_segments(text: str, max_chars: int = 1800) -> list[str]:
    chunks: list[str] = []
    for paragraph in text.split("\n\n"):
        paragraph = paragraph.strip()
        if not paragraph:
            continue
        if len(paragraph) <= max_chars:
            chunks.append(paragraph)
            continue
        sentences = re.split(r"(?<=[.!?])\s+", paragraph)
        current = ""
        for sentence in sentences:
            candidate = f"{current} {sentence}".strip()
            if current and len(candidate) > max_chars:
                chunks.append(current)
                current = sentence
            else:
                current = candidate
        if current:
            chunks.append(current)
    return chunks


def english_to_spanish_translator():
    installed = argostranslate.translate.get_installed_languages()
    source = next((language for language in installed if language.code == "en"), None)
    target = next((language for language in installed if language.code == "es"), None)
    if not source or not target:
        raise RuntimeError("Falta el paquete local inglés→español de Argos Translate. Instálalo antes de procesar.")
    return source.get_translation(target)


def escape_paragraph(text: str) -> str:
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def build_pdf(output_path: Path, pages: list[dict]) -> None:
    font_path = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
    bold_path = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
    pdfmetrics.registerFont(TTFont("BilingualDejaVu", font_path))
    pdfmetrics.registerFont(TTFont("BilingualDejaVuBold", bold_path))
    document = SimpleDocTemplate(str(output_path), pagesize=letter, leftMargin=0.72 * inch, rightMargin=0.72 * inch, topMargin=0.7 * inch, bottomMargin=0.7 * inch, title="Lectura en español")
    styles = getSampleStyleSheet()
    heading = ParagraphStyle("BilingualHeading", parent=styles["Heading1"], fontName="BilingualDejaVuBold", fontSize=16, leading=21, textColor=HexColor("#365e22"), spaceAfter=14)
    body = ParagraphStyle("BilingualBody", parent=styles["BodyText"], fontName="BilingualDejaVu", fontSize=10.4, leading=15, alignment=TA_LEFT, spaceAfter=9)
    note = ParagraphStyle("BilingualNote", parent=styles["BodyText"], fontName="BilingualDejaVu", fontSize=8.5, leading=11, textColor=colors.HexColor("#617066"), spaceAfter=12)
    story = [Paragraph("Lectura en español", heading), Paragraph("Reconstrucción local del texto extraíble. El PDF original en inglés se conserva como fuente de referencia.", note)]
    for index, page in enumerate(pages, start=1):
        story.append(Paragraph(f"Página {page['pageNumber']}", heading))
        if not page["segments"]:
            story.append(Paragraph("No se detectó texto seleccionable en esta página.", note))
        for segment in page["segments"]:
            story.append(Paragraph(escape_paragraph(segment["translatedText"]), body))
        if index < len(pages):
            story.append(PageBreak())
    document.build(story)


def main() -> None:
    parser = argparse.ArgumentParser(description="Traduce un PDF autorizado de inglés a español y lo reconstruye para lectura.")
    parser.add_argument("--input-pdf", required=True, type=Path)
    parser.add_argument("--output-dir", required=True, type=Path)
    parser.add_argument("--max-pages", type=int, default=0, help="Limita páginas para pruebas; 0 procesa todo el documento.")
    args = parser.parse_args()

    args.output_dir.mkdir(parents=True, exist_ok=True)
    translator = english_to_spanish_translator()

    @lru_cache(maxsize=2048)
    def translate(value: str) -> str:
        return translator.translate(value)

    reader = PdfReader(str(args.input_pdf))
    total_pages = min(len(reader.pages), args.max_pages) if args.max_pages else len(reader.pages)
    pages: list[dict] = []
    for page_number, page in enumerate(reader.pages[:total_pages], start=1):
        source = normalize_text(page.extract_text() or "")
        segments = [{"pageNumber": page_number, "segmentOrder": index, "sourceText": chunk, "translatedText": translate(chunk)} for index, chunk in enumerate(split_segments(source), start=1)]
        pages.append({"pageNumber": page_number, "segments": segments})

    reconstructed_pdf = args.output_dir / "lectura-es.pdf"
    segments_json = args.output_dir / "segments-es.json"
    build_pdf(reconstructed_pdf, pages)
    segments_json.write_text(json.dumps({"sourceLanguage": "en", "targetLanguage": "es", "pageCount": total_pages, "pages": pages}, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"reconstructedPdf": str(reconstructed_pdf), "segmentsJson": str(segments_json), "pageCount": total_pages, "segmentCount": sum(len(page["segments"]) for page in pages)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
