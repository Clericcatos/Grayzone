from __future__ import annotations

from pathlib import Path
from textwrap import dedent

from PIL import Image, ImageDraw, ImageFont
from pypdf import PdfReader
from reportlab.lib.pagesizes import A4, landscape
from reportlab.pdfgen import canvas


PROJECT_ROOT = Path(__file__).resolve().parents[2]
OUTPUT_ROOT = PROJECT_ROOT / "PresentationOutput"

PDF_PATH = OUTPUT_ROOT / "Ron_Work_Summary_One_Page.pdf"
PNG_PATH = OUTPUT_ROOT / "Ron_Work_Summary_One_Page_preview.png"
MD_PATH = OUTPUT_ROOT / "Ron_Work_Summary_Notion.md"

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
    path = Path("C:/Windows/Fonts") / name
    return ImageFont.truetype(str(path), size=size)


F = {
    "kicker": font(19, True),
    "title": font(55, True),
    "meta": font(19),
    "lead": font(27, True),
    "h2": font(25, True),
    "body": font(19),
    "body_bold": font(19, True),
    "small": font(16),
    "small_bold": font(16, True),
    "stat": font(36, True),
    "card_title": font(19, True),
    "card_body": font(16),
    "footer": font(14),
}


COLORS = {
    "bg": "#F8FAFC",
    "ink": "#0F172A",
    "muted": "#475569",
    "subtle": "#64748B",
    "panel": "#FFFFFF",
    "line": "#D8E2ED",
    "cyan": "#0891B2",
    "cyan_dark": "#164E63",
    "cyan_light": "#ECFEFF",
    "orange_bg": "#FFF7ED",
    "orange_line": "#FED7AA",
    "orange_ink": "#7C2D12",
    "green_bg": "#F0FDF4",
    "green_line": "#BBF7D0",
    "green_ink": "#14532D",
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
            chopped = ""
            for char in word:
                candidate = chopped + char
                if text_width(draw, candidate, fnt) <= max_width:
                    chopped = candidate
                else:
                    lines.append(chopped)
                    chopped = char
            current = chopped

        if max_lines and len(lines) >= max_lines:
            break

    if current and (not max_lines or len(lines) < max_lines):
        lines.append(current)

    if max_lines and len(lines) > max_lines:
        lines = lines[:max_lines]

    return lines


def draw_wrapped(
    draw: ImageDraw.ImageDraw,
    text: str,
    xy: tuple[int, int],
    fnt: ImageFont.FreeTypeFont,
    fill: str,
    max_width: int,
    line_gap: int = 7,
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
    new_size = (int(img.width * scale), int(img.height * scale))
    resized = img.resize(new_size, Image.Resampling.LANCZOS)
    left = (resized.width - target_w) // 2
    top = (resized.height - target_h) // 2
    return resized.crop((left, top, left + target_w, top + target_h))


def draw_bullet(draw, x, y, text, max_width):
    draw.ellipse((x, y + 11, x + 9, y + 20), fill=COLORS["cyan"])
    return draw_wrapped(draw, text, (x + 24, y), F["body"], COLORS["muted"], max_width, line_gap=6)


def draw_stat(draw, x, y, w, value, label):
    rounded(draw, (x, y, x + w, y + 84), COLORS["panel"], COLORS["line"], radius=14)
    draw.text((x + 15, y + 12), value, font=F["stat"], fill=COLORS["cyan"])
    draw_wrapped(draw, label, (x + 15, y + 52), F["small_bold"], COLORS["muted"], w - 30, line_gap=4)


def draw_card(draw, x, y, w, h, title, body):
    rounded(draw, (x, y, x + w, y + h), "#F8FAFC", "#E2E8F0", radius=14)
    draw.text((x + 17, y + 14), title, font=F["card_title"], fill=COLORS["ink"])
    draw_wrapped(draw, body, (x + 17, y + 43), F["card_body"], COLORS["muted"], w - 34, line_gap=5, max_lines=3)


def write_markdown() -> None:
    md = dedent(
        """\
        # Ron UI 파트 작업 요약

        기준: GrayZone_V0.1 / branch `ron_dev` / commit `a275cab` / 2026-05-21 현재 폴더 기준

        ## 한 줄 요약

        Ron 테스트 씬에서 500m x 500m 지도 리소스를 기준으로 미니맵과 전체맵을 실제 Canvas 아래에서 동작하도록 정리하고, 플레이어 위치 연동과 M키 월드맵 UX를 검증할 수 있는 프로토타입을 만들었다.

        ## 구현한 것

        - 500m x 500m 맵 이미지, 미니맵 이미지, 좌표 CSV, 머티리얼을 `Assets/WorkSpace/Ron/Resources` 아래에 정리했다.
        - `Assets/WorkSpace/Ron/Scenes/Test.unity`에 Ground, Player, Canvas, MiniMap, FullMapPanel 기반 테스트 구성을 만들었다.
        - `UIManager.cs`에서 미니맵 갱신, 전체맵 열기/닫기, HUD 숨김/복구, 좌표 변환, 줌/드래그 입력을 처리했다.
        - `RonMinimapBootstrap.cs`로 Test 씬에서 UIManager가 없을 때만 fallback Canvas를 붙이도록 했다.
        - `RonPlayerMover.cs`로 WASD/방향키 이동과 우클릭 회전 테스트 조작을 추가했다.
        - `Minimap_Modification_Notes.md`에 구현 목적, 사용 에셋, 구조 한계, 다음 정리 방향을 문서화했다.

        ## 현재 진행 중인 변경

        - `Test.unity`: UI 배치, 스프라이트 연결, Canvas 설정, FullMapPanel/Key/HUD 관련 조정 흔적이 있다.
        - `Packages/manifest.json`: `com.unity.2d.sprite` 패키지가 추가되었다.
        - `ProjectSettings/TagManager.asset`: Player, Ground 레이어가 추가되었다.
        - `Assets/TextMesh Pro`, `PresentationOutput`, `GrayZone_V0.1.slnx`가 아직 untracked 상태다.

        ## 다음 작업 후보

        1. 플레이어 위치 오차를 여러 지점에서 확인하고 `MapCalibrationOffsetMeters`를 Inspector 조정값으로 확정한다.
        2. Play 중 자동 생성되는 UI 요소를 실제 Canvas 계층으로 옮겨 유지보수 가능한 구조로 정리한다.
        3. 실제 캐릭터 컨트롤러가 들어오면 `RonPlayerMover` 테스트 코드는 제거한다.
        4. 공유 전에는 프로젝트 설정 변경과 TextMesh Pro 임포트 범위를 확인한 뒤 커밋한다.
        """
    )
    MD_PATH.write_text(md, encoding="utf-8")


def build_preview() -> None:
    page = Image.new("RGB", (W, H), COLORS["bg"])
    draw = ImageDraw.Draw(page)

    draw.rectangle((0, 0, 560, H), fill="#F1F9FC")
    draw.ellipse((1240, -220, 1860, 400), fill="#E0F7FA")

    left_x, top = 92, 82
    right_x = 930
    left_w = 748
    right_w = 578

    rounded(draw, (left_x, top, left_x + 155, top + 38), COLORS["cyan_dark"], radius=0)
    draw.text((left_x + 16, top + 8), "RON UI PART", font=F["kicker"], fill="#A5F3FC")
    draw.text((left_x, top + 58), "Ron UI 파트 작업 요약", font=F["title"], fill=COLORS["ink"])
    draw.text(
        (left_x, top + 129),
        "GrayZone_V0.1 / branch ron_dev / commit a275cab / 2026-05-21 현재 폴더 기준",
        font=F["meta"],
        fill=COLORS["muted"],
    )

    lead_y = top + 176
    draw.rounded_rectangle((left_x, lead_y, left_x + 7, lead_y + 112), radius=3, fill=COLORS["cyan"])
    draw_wrapped(
        draw,
        "500m x 500m 지도 리소스를 기준으로 미니맵과 전체맵을 실제 Canvas 아래에서 동작하게 정리하고, 플레이어 위치 연동과 M키 월드맵 UX를 검증할 수 있는 프로토타입을 만들었다.",
        (left_x + 22, lead_y - 3),
        F["lead"],
        "#1E293B",
        left_w - 28,
        line_gap=8,
        max_lines=3,
    )

    stat_y = lead_y + 138
    stat_w = (left_w - 30) // 4
    for i, (value, label) in enumerate(
        [
            ("34", "Ron 파트 커밋 파일"),
            ("3", "핵심 C# 스크립트"),
            ("500m", "월드맵 기준 크기"),
            ("1", "Test 씬 프로토타입"),
        ]
    ):
        draw_stat(draw, left_x + i * (stat_w + 10), stat_y, stat_w, value, label)

    y = stat_y + 112
    draw.text((left_x, y), "구현 내용", font=F["h2"], fill=COLORS["ink"])
    y += 42
    for item in [
        "UIManager.cs에서 미니맵 갱신, 전체맵 열기/닫기, HUD 숨김/복구, 좌표 변환, 휠 줌과 드래그 이동을 처리했다.",
        "RonMinimapBootstrap.cs는 Test 씬에서 UIManager가 없을 때만 fallback Canvas를 붙이는 보험 역할로 정리했다.",
        "RonPlayerMover.cs로 WASD/방향키 이동과 우클릭 회전 테스트 조작을 추가했다.",
        "지도 이미지, 미니맵 이미지, 좌표 CSV, 머티리얼을 Assets/WorkSpace/Ron/Resources에 모았다.",
        "Minimap_Modification_Notes.md에 목적, 사용 에셋, 구조 한계, 다음 정리 방향을 문서화했다.",
    ]:
        y = draw_bullet(draw, left_x, y, item, left_w - 30) + 3

    y += 10
    draw.text((left_x, y), "근거 파일", font=F["h2"], fill=COLORS["ink"])
    y += 40
    chip_x, chip_y = left_x, y
    for chip in [
        "UIManager.cs",
        "RonMinimapBootstrap.cs",
        "RonPlayerMover.cs",
        "Test.unity",
        "map_500x500_*.png",
        "Minimap_Modification_Notes.md",
    ]:
        tw = text_width(draw, chip, F["small_bold"]) + 30
        if chip_x + tw > left_x + left_w:
            chip_x = left_x
            chip_y += 34
        rounded(draw, (chip_x, chip_y, chip_x + tw, chip_y + 26), COLORS["cyan_light"], "#BAE6FD", radius=13)
        draw.text((chip_x + 15, chip_y + 5), chip, font=F["small_bold"], fill="#155E75")
        chip_x += tw + 8

    rounded(draw, (right_x, top, right_x + right_w, top + 345), COLORS["dark"], "#111827", radius=18)
    map_img = Image.open(MAP_PATH).convert("RGB")
    map_crop = cover_image(map_img, (right_w - 32, 292))
    page.paste(map_crop, (right_x + 16, top + 16))
    rounded(draw, (right_x + 31, top + 268, right_x + 270, top + 303), "#0F172ACC", radius=17)
    draw.text((right_x + 47, top + 276), "미니맵 / 월드맵 기준 이미지", font=F["small_bold"], fill="#DBEAFE")

    card_y = top + 366
    card_w = (right_w - 12) // 2
    cards = [
        ("Canvas 기준 정리", "실제 Canvas, MiniMap, FullMapPanel을 기준으로 설명 가능한 구조로 맞췄다."),
        ("M키 월드맵 UX", "전체맵을 열면 지도만 전면 배치하고 나머지 HUD roots는 잠시 숨긴다."),
        ("좌표 연동", "월드 X/Z를 지도 픽셀 좌표로 변환하고 플레이어 아이콘을 표시한다."),
        ("공유 자료화", "발표용 PPT와 노션용 Markdown, 한 장 PDF로 설명 가능한 형태까지 정리했다."),
    ]
    for i, (title, body) in enumerate(cards):
        x = right_x + (i % 2) * (card_w + 12)
        yy = card_y + (i // 2) * 117
        draw_card(draw, x, yy, card_w, 103, title, body)

    status_y = card_y + 247
    rounded(draw, (right_x, status_y, right_x + right_w, status_y + 126), COLORS["orange_bg"], COLORS["orange_line"], radius=14)
    draw.text((right_x + 18, status_y + 15), "현재 진행 중인 변경", font=F["body_bold"], fill=COLORS["orange_ink"])
    draw_wrapped(
        draw,
        "Test.unity, UI2.png.meta, 패키지/프로젝트 설정이 수정되어 있고, TextMesh Pro와 PresentationOutput은 아직 untracked 상태다. 공유 전에는 TMP 임포트 범위와 프로젝트 설정 변경을 확인한 뒤 커밋하는 것이 좋다.",
        (right_x + 18, status_y + 49),
        F["small"],
        COLORS["orange_ink"],
        right_w - 36,
        line_gap=5,
        max_lines=4,
    )

    next_y = status_y + 144
    rounded(draw, (right_x, next_y, right_x + right_w, next_y + 150), COLORS["green_bg"], COLORS["green_line"], radius=14)
    draw.text((right_x + 18, next_y + 15), "다음 작업 후보", font=F["body_bold"], fill=COLORS["green_ink"])
    ny = next_y + 50
    for idx, item in enumerate(
        [
            "여러 지점에서 플레이어 위치 오차를 확인하고 보정값을 Inspector 조정값으로 확정한다.",
            "Play 중 자동 생성되는 UI 요소를 실제 Canvas 계층으로 이전한다.",
            "실제 캐릭터 컨트롤러 연결 후 테스트 이동 스크립트를 제거한다.",
        ],
        start=1,
    ):
        draw.text((right_x + 20, ny), f"{idx}.", font=F["small_bold"], fill=COLORS["green_ink"])
        ny = draw_wrapped(draw, item, (right_x + 48, ny - 1), F["small"], COLORS["green_ink"], right_w - 70, line_gap=5, max_lines=2) + 3

    footer_y = H - 56
    draw.line((92, footer_y, W - 92, footer_y), fill="#D8E2ED", width=1)
    draw.text((92, footer_y + 17), "Source scan: git log, git diff, Assets/WorkSpace/Ron, PresentationOutput", font=F["footer"], fill=COLORS["subtle"])
    right_footer = "Prepared for one-page PDF handout"
    draw.text((W - 92 - text_width(draw, right_footer, F["footer"]), footer_y + 17), right_footer, font=F["footer"], fill=COLORS["subtle"])

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
