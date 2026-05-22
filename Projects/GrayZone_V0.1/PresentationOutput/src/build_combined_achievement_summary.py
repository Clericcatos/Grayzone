from __future__ import annotations

from pathlib import Path
from textwrap import dedent
from zipfile import ZipFile
import io

from PIL import Image, ImageDraw, ImageFont
from pypdf import PdfReader
from reportlab.lib.pagesizes import A4, landscape
from reportlab.pdfgen import canvas


PROJECT_ROOT = Path(__file__).resolve().parents[2]
OUTPUT_ROOT = PROJECT_ROOT / "PresentationOutput"
SOURCE_PPTX = Path("C:/Users/user/Downloads/output.pptx")

PDF_PATH = OUTPUT_ROOT / "5학기_성과요약_장아론_통합.pdf"
PNG_PATH = OUTPUT_ROOT / "5학기_성과요약_장아론_통합_preview.png"
MD_PATH = OUTPUT_ROOT / "5학기_성과요약_장아론_통합_Notion.md"

MAP_PATH = (
    PROJECT_ROOT
    / "Assets"
    / "WorkSpace"
    / "Ron"
    / "Resources"
    / "unity_500m_map_assets"
    / "map_500x500_ground_2048.png"
)

W, H = 1600, 1131


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    name = "malgunbd.ttf" if bold else "malgun.ttf"
    return ImageFont.truetype(str(Path("C:/Windows/Fonts") / name), size=size)


F = {
    "kicker": font(18, True),
    "title": font(50, True),
    "subtitle": font(21),
    "panel_title": font(27, True),
    "section": font(20, True),
    "body": font(17),
    "body_bold": font(17, True),
    "small": font(14),
    "small_bold": font(14, True),
    "label": font(15, True),
    "stat": font(30, True),
    "footer": font(13),
}

COLORS = {
    "bg": "#F8FAFC",
    "paper": "#FFFFFF",
    "ink": "#0F172A",
    "muted": "#475569",
    "subtle": "#64748B",
    "line": "#D8E2ED",
    "cyan": "#0891B2",
    "cyan_dark": "#164E63",
    "cyan_light": "#ECFEFF",
    "violet": "#6D28D9",
    "violet_light": "#F5F3FF",
    "orange": "#EA580C",
    "orange_light": "#FFF7ED",
    "green": "#15803D",
    "green_light": "#F0FDF4",
    "dark": "#0F172A",
}


def text_width(draw: ImageDraw.ImageDraw, text: str, fnt: ImageFont.FreeTypeFont) -> int:
    box = draw.textbbox((0, 0), text, font=fnt)
    return box[2] - box[0]


def wrap_text(
    draw: ImageDraw.ImageDraw,
    text: str,
    fnt: ImageFont.FreeTypeFont,
    max_width: int,
    max_lines: int | None = None,
) -> list[str]:
    words = text.split(" ")
    lines: list[str] = []
    current = ""
    for word in words:
        candidate = word if not current else f"{current} {word}"
        if text_width(draw, candidate, fnt) <= max_width:
            current = candidate
            continue
        if current:
            lines.append(current)
            current = word
        else:
            chunk = ""
            for char in word:
                candidate = chunk + char
                if text_width(draw, candidate, fnt) <= max_width:
                    chunk = candidate
                else:
                    if chunk:
                        lines.append(chunk)
                    chunk = char
            current = chunk
        if max_lines and len(lines) >= max_lines:
            break
    if current and (not max_lines or len(lines) < max_lines):
        lines.append(current)
    return lines[:max_lines] if max_lines else lines


def draw_wrapped(
    draw: ImageDraw.ImageDraw,
    text: str,
    xy: tuple[int, int],
    fnt: ImageFont.FreeTypeFont,
    fill: str,
    max_width: int,
    line_gap: int = 5,
    max_lines: int | None = None,
) -> int:
    x, y = xy
    lines = wrap_text(draw, text, fnt, max_width, max_lines)
    line_h = fnt.size + line_gap
    for idx, line in enumerate(lines):
        draw.text((x, y + idx * line_h), line, font=fnt, fill=fill)
    return y + len(lines) * line_h


def rounded(draw: ImageDraw.ImageDraw, box, fill, outline=None, width=1, radius=16):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def cover_image(img: Image.Image, size: tuple[int, int]) -> Image.Image:
    target_w, target_h = size
    scale = max(target_w / img.width, target_h / img.height)
    resized = img.resize((int(img.width * scale), int(img.height * scale)), Image.Resampling.LANCZOS)
    left = (resized.width - target_w) // 2
    top = (resized.height - target_h) // 2
    return resized.crop((left, top, left + target_w, top + target_h))


def extract_pptx_image(index: int) -> Image.Image:
    with ZipFile(SOURCE_PPTX) as z:
        names = [name for name in z.namelist() if name.startswith("ppt/media/")]
        names.sort(key=lambda name: (len(name), name))
        data = z.read(names[index])
    return Image.open(io.BytesIO(data)).convert("RGB")


def draw_chip(draw, x, y, text, fill, outline, ink):
    w = text_width(draw, text, F["small_bold"]) + 24
    rounded(draw, (x, y, x + w, y + 24), fill, outline, radius=12)
    draw.text((x + 12, y + 4), text, font=F["small_bold"], fill=ink)
    return x + w + 7


def draw_bullet(draw, x, y, text, max_width, color=COLORS["cyan"]):
    draw.ellipse((x, y + 9, x + 8, y + 17), fill=color)
    return draw_wrapped(draw, text, (x + 20, y - 1), F["body"], COLORS["muted"], max_width, line_gap=5)


def write_markdown() -> None:
    md = dedent(
        """\
        # 5학기 성과 요약 - 장아론

        기준: GrayZone_V0.1 / branch `ron_dev` / 2026-05-21 현재

        ## 성과 1. Ron UI / 미니맵 / 월드맵 프로토타입

        500m x 500m 지도 리소스를 기준으로 `Test` 씬에서 미니맵과 전체맵을 실제 Canvas 아래에서 동작하도록 정리했다.

        - `UIManager.cs`: 미니맵 갱신, 전체맵 열기/닫기, HUD 숨김/복구, 좌표 변환, 휠 줌과 드래그 이동 처리
        - `RonMinimapBootstrap.cs`: Test 씬에서 UIManager가 없을 때만 fallback Canvas를 붙이는 보조 구조
        - `RonPlayerMover.cs`: WASD/방향키 이동과 우클릭 회전 테스트 조작
        - `Minimap_Modification_Notes.md`: 목적, 사용 에셋, 구조 한계, 다음 정리 방향 문서화

        ## 성과 2. HDRP / URP 렌더 파이프라인 비교

        `output.pptx`의 HDRP/URP 비교 자료를 바탕으로, 공간 전체 인상, 방 구조와 색광 퍼짐, 광원 근접 컷, 아티스트 작업 차이를 비교했다.

        - HDRP: 자연스럽고 안정적인 조명, 구조 파악, 절제된 표면 반응에 강점
        - URP: 강한 색감, Bloom/Emission, 즉각적인 분위기 전달, 빠른 프로덕션에 강점
        - 프로젝트 판단: 현재 인원과 일정상 URP 기반 개발을 유지하고, 스팀 출시 전 비주얼 고도화 시 HDRP 재검토

        ## 통합 결론

        UI 쪽은 실제 Canvas 기준으로 구현 가능한 구조를 만들었고, 그래픽 파이프라인 쪽은 팀 일정에 맞는 URP 유지 판단 근거를 정리했다. 즉, 단순 구현뿐 아니라 프로젝트 완성 가능성을 높이는 방향으로 UI와 렌더링 의사결정을 함께 진행했다.
        """
    )
    MD_PATH.write_text(md, encoding="utf-8")


def build_preview() -> None:
    page = Image.new("RGB", (W, H), COLORS["bg"])
    draw = ImageDraw.Draw(page)

    draw.rectangle((0, 0, W, 214), fill="#0F172A")
    draw.ellipse((1180, -260, 1790, 350), fill="#173044")
    draw.rectangle((0, 214, W, H), fill="#F8FAFC")

    draw.text((84, 68), "5학기 성과 요약", font=F["title"], fill="#F8FAFC")
    draw.text((84, 132), "장아론 / Ron UI 파트 + HDRP·URP 렌더 파이프라인 비교", font=F["subtitle"], fill="#CBD5E1")
    rounded(draw, (1265, 72, 1505, 112), COLORS["cyan_dark"], radius=0)
    draw.text((1282, 82), "통합 제출용 1장", font=F["kicker"], fill="#A5F3FC")
    draw.text((1265, 130), "기준: ron_dev / 2026-05-21", font=F["small"], fill="#94A3B8")

    left = (84, 250, 768, 985)
    right = (832, 250, 1516, 985)

    rounded(draw, left, COLORS["paper"], COLORS["line"], radius=18)
    rounded(draw, right, COLORS["paper"], COLORS["line"], radius=18)

    lx, ly = left[0] + 28, left[1] + 24
    rx, ry = right[0] + 28, right[1] + 24
    panel_w = left[2] - left[0] - 56

    draw.text((lx, ly), "성과 1", font=F["kicker"], fill=COLORS["cyan"])
    draw.text((lx, ly + 32), "Ron UI / 미니맵 / 월드맵 구현", font=F["panel_title"], fill=COLORS["ink"])
    draw_wrapped(
        draw,
        "500m x 500m 지도 리소스를 기준으로 Test 씬에서 미니맵과 전체맵을 실제 Canvas 아래에서 동작하도록 정리했다.",
        (lx, ly + 76),
        F["body_bold"],
        "#1E293B",
        panel_w,
        line_gap=6,
        max_lines=3,
    )

    map_img = cover_image(Image.open(MAP_PATH).convert("RGB"), (panel_w, 168))
    rounded(draw, (lx, ly + 172, lx + panel_w, ly + 354), COLORS["dark"], radius=14)
    page.paste(map_img, (lx, ly + 179))
    rounded(draw, (lx + 12, ly + 300, lx + 178, ly + 328), "#0F172ACC", radius=14)
    draw.text((lx + 24, ly + 306), "500m 월드맵 에셋", font=F["small_bold"], fill="#DBEAFE")

    y = ly + 378
    draw.text((lx, y), "핵심 구현", font=F["section"], fill=COLORS["ink"])
    y += 32
    for item in [
        "UIManager: 미니맵 갱신, 전체맵 토글, HUD 숨김/복구, 좌표 변환, 줌/드래그 이동",
        "Bootstrap: UIManager가 없을 때만 fallback Canvas를 붙이는 보조 구조",
        "PlayerMover: WASD/방향키 이동과 우클릭 회전 테스트 조작",
        "작업 문서: 목적, 사용 에셋, 구조 한계, 다음 정리 방향까지 문서화",
    ]:
        y = draw_bullet(draw, lx, y, item, panel_w - 20, COLORS["cyan"]) + 3

    y += 10
    draw.text((lx, y), "근거 파일", font=F["section"], fill=COLORS["ink"])
    y += 32
    chip_x = lx
    for chip in ["UIManager.cs", "Test.unity", "RonMinimapBootstrap.cs", "Minimap_Modification_Notes.md"]:
        chip_w = text_width(draw, chip, F["small_bold"]) + 24
        if chip_x != lx and chip_x + chip_w > lx + panel_w:
            y += 31
            chip_x = lx
        chip_x = draw_chip(draw, chip_x, y, chip, COLORS["cyan_light"], "#BAE6FD", "#155E75")

    draw.text((rx, ry), "성과 2", font=F["kicker"], fill=COLORS["violet"])
    draw.text((rx, ry + 32), "HDRP / URP 비교와 적용 판단", font=F["panel_title"], fill=COLORS["ink"])
    draw_wrapped(
        draw,
        "공간 전체 인상, 방 구조와 색광 퍼짐, 광원 근접 컷을 비교해 현재 팀 상황에서는 URP 기반 개발이 더 타당하다는 결론을 정리했다.",
        (rx, ry + 76),
        F["body_bold"],
        "#1E293B",
        panel_w,
        line_gap=6,
        max_lines=3,
    )

    hdrp = cover_image(extract_pptx_image(0), (panel_w // 2 - 6, 170))
    urp = cover_image(extract_pptx_image(1), (panel_w // 2 - 6, 170))
    img_y = ry + 172
    rounded(draw, (rx, img_y, rx + panel_w, img_y + 202), COLORS["dark"], radius=14)
    page.paste(hdrp, (rx + 12, img_y + 16))
    page.paste(urp, (rx + 12 + panel_w // 2, img_y + 16))
    rounded(draw, (rx + 22, img_y + 24, rx + 88, img_y + 51), "#F8FAFCDD", radius=12)
    draw.text((rx + 34, img_y + 29), "HDRP", font=F["small_bold"], fill=COLORS["ink"])
    rounded(draw, (rx + 22 + panel_w // 2, img_y + 24, rx + 84 + panel_w // 2, img_y + 51), "#F8FAFCDD", radius=12)
    draw.text((rx + 35 + panel_w // 2, img_y + 29), "URP", font=F["small_bold"], fill=COLORS["ink"])

    y = ry + 398
    draw.text((rx, y), "비교 결론", font=F["section"], fill=COLORS["ink"])
    y += 32
    for item, color in [
        ("HDRP: 자연스럽고 안정적인 조명, 구조 파악, 절제된 표면 반응에 강점", COLORS["violet"]),
        ("URP: 강한 색감, Bloom/Emission, 즉각적인 분위기 전달과 빠른 프로덕션에 강점", COLORS["orange"]),
        ("권장안: 졸업작품 수직 슬라이스와 지스타 시연 전 폴리싱까지는 URP 유지", COLORS["green"]),
        ("재검토 시점: 스팀 출시 전 비주얼 고도화가 필요해질 때 HDRP 재검토", COLORS["cyan"]),
    ]:
        y = draw_bullet(draw, rx, y, item, panel_w - 20, color) + 3

    y += 11
    rounded(draw, (rx, y, rx + panel_w, y + 92), COLORS["green_light"], "#BBF7D0", radius=14)
    draw.text((rx + 16, y + 14), "통합 의미", font=F["body_bold"], fill=COLORS["green"])
    draw_wrapped(
        draw,
        "UI 구현은 실제 게임 화면에 붙일 수 있는 구조를 만들었고, 렌더링 비교는 팀 일정 안에서 완성 가능한 파이프라인 판단 근거를 만들었다.",
        (rx + 16, y + 42),
        F["small_bold"],
        "#166534",
        panel_w - 32,
        line_gap=5,
        max_lines=2,
    )

    bottom_y = 1020
    draw.line((84, bottom_y, W - 84, bottom_y), fill=COLORS["line"], width=1)
    draw.text((84, bottom_y + 22), "Sources: Assets/WorkSpace/Ron, git log/diff, C:/Users/user/Downloads/output.pptx", font=F["footer"], fill=COLORS["subtle"])
    footer = "Final recommendation: URP 기반 개발 유지, 필요 시 HDRP 재검토"
    draw.text((W - 84 - text_width(draw, footer, F["footer"]), bottom_y + 22), footer, font=F["footer"], fill=COLORS["subtle"])

    page.save(PNG_PATH, "PNG", optimize=True)


def build_pdf() -> None:
    page_w, page_h = landscape(A4)
    pdf = canvas.Canvas(str(PDF_PATH), pagesize=(page_w, page_h))
    pdf.drawImage(str(PNG_PATH), 0, 0, width=page_w, height=page_h)
    pdf.showPage()
    pdf.save()

    reader = PdfReader(str(PDF_PATH))
    if len(reader.pages) != 1:
        raise RuntimeError(f"Expected one page, got {len(reader.pages)}")


def main() -> None:
    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
    write_markdown()
    build_preview()
    build_pdf()
    print(f"PDF: {PDF_PATH}")
    print(f"Preview: {PNG_PATH}")
    print(f"Markdown: {MD_PATH}")
    print("Page count: 1")


if __name__ == "__main__":
    main()
