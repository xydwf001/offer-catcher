from pathlib import Path
import re
import sys

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs" / "solution.md"
OUTPUT = ROOT / "docs" / "offer-catcher-solution.pdf"


def register_cjk_font() -> str:
    candidates = [
        Path(r"C:\Windows\Fonts\msyh.ttc"),
        Path(r"C:\Windows\Fonts\simsun.ttc"),
        Path("/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc"),
        Path("/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc"),
    ]
    for font_path in candidates:
        if font_path.exists():
            pdfmetrics.registerFont(TTFont("CJKBody", str(font_path)))
            return "CJKBody"
    return "Helvetica"


def parse_markdown(text: str):
    blocks = []
    for chunk in re.split(r"\n\s*\n", text.strip()):
        lines = chunk.strip().splitlines()
        if not lines:
            continue
        first = lines[0].strip()
        if first.startswith("# "):
            blocks.append(("title", first[2:].strip()))
        elif first.startswith("## "):
            blocks.append(("heading", first[3:].strip()))
        else:
            paragraph = "<br/>".join(line.strip() for line in lines)
            paragraph = paragraph.replace("`", "")
            blocks.append(("body", paragraph))
    return blocks


def main() -> int:
    if not SOURCE.exists():
        print(f"Missing source: {SOURCE}", file=sys.stderr)
        return 1

    font_name = register_cjk_font()
    styles = getSampleStyleSheet()
    styles.add(
        ParagraphStyle(
            name="CJKTitle",
            parent=styles["Title"],
            fontName=font_name,
            fontSize=21,
            leading=28,
            textColor=colors.HexColor("#173326"),
            spaceAfter=10,
        )
    )
    styles.add(
        ParagraphStyle(
            name="CJKHeading",
            parent=styles["Heading2"],
            fontName=font_name,
            fontSize=12.5,
            leading=18,
            textColor=colors.HexColor("#1F6F4A"),
            spaceBefore=10,
            spaceAfter=5,
        )
    )
    styles.add(
        ParagraphStyle(
            name="CJKBody",
            parent=styles["BodyText"],
            fontName=font_name,
            fontSize=9.6,
            leading=15,
            textColor=colors.HexColor("#22342A"),
            firstLineIndent=0,
            spaceAfter=4,
        )
    )

    story = []
    for kind, value in parse_markdown(SOURCE.read_text(encoding="utf-8")):
        if kind == "title":
            story.append(Paragraph(value, styles["CJKTitle"]))
        elif kind == "heading":
            story.append(Paragraph(value, styles["CJKHeading"]))
        else:
            story.append(Paragraph(value, styles["CJKBody"]))
            story.append(Spacer(1, 2 * mm))

    doc = SimpleDocTemplate(
        str(OUTPUT),
        pagesize=A4,
        rightMargin=20 * mm,
        leftMargin=20 * mm,
        topMargin=18 * mm,
        bottomMargin=18 * mm,
        title="Offer Catcher Solution",
        author="Offer Catcher",
    )
    doc.build(story)
    print(OUTPUT)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
