import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const runtimeNodeModules =
  "C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules";
const requireFromRuntime = createRequire(path.join(runtimeNodeModules, "runtime-entry.js"));

const canvasMod = requireFromRuntime("@napi-rs/canvas");
const { Canvas, GlobalFonts, loadImage } = canvasMod;

const artifactPath = requireFromRuntime.resolve("@oai/artifact-tool");
const artifact = await import(pathToFileURL(artifactPath).href);

const {
  Presentation,
  PresentationFile,
  row,
  column,
  grid,
  layers,
  panel,
  text,
  image,
  shape,
  rule,
  fill,
  hug,
  fixed,
  wrap,
  grow,
  fr,
  auto,
  drawSlideToCtx,
  Image: ArtifactImage,
} = artifact;

const W = 1920;
const H = 1080;
const FONT = "Malgun Gothic";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, "..", "..");
const outputRoot = path.join(projectRoot, "PresentationOutput");
const previewRoot = path.join(outputRoot, "previews");
const assetRoot = path.join(projectRoot, "Assets", "WorkSpace", "Ron", "Resources");
const map512 = path.join(assetRoot, "unity_500m_map_assets", "map_500x500_minimap_512.png");
const map2048 = path.join(assetRoot, "unity_500m_map_assets", "map_500x500_ground_2048.png");

try {
  GlobalFonts.registerFromPath("C:/Windows/Fonts/malgun.ttf", FONT);
} catch {
  // The renderer will fall back to the system font if Malgun Gothic is unavailable.
}

const originalGetBitmap = ArtifactImage.prototype.getBitmap;
ArtifactImage.prototype.getBitmap = async function patchedGetBitmap(width, height) {
  const proto = this.toProto();
  if (proto.data && proto.data.byteLength > 0) {
    return loadImage(Buffer.from(proto.data));
  }
  if (proto.uri) {
    return loadImage(proto.uri);
  }
  return originalGetBitmap.call(this, width, height);
};

function s(style = {}) {
  return {
    typeface: FONT,
    ...style,
  };
}

function txt(value, options = {}) {
  const { style, ...rest } = options;
  return text(value, {
    width: rest.width ?? fill,
    height: rest.height ?? hug,
    ...rest,
    style: s(style),
  });
}

function label(value, color = "#0E7490", fillColor = "#E6FFFB") {
  return panel(
    {
      width: hug,
      height: hug,
      padding: { x: 18, y: 8 },
      fill: fillColor,
      materialize: true,
    },
    txt(value, {
      width: hug,
      style: { fontSize: 18, bold: true, color },
    }),
  );
}

function titleBlock(kicker, title, subtitle, dark = false) {
  return column(
    { name: "title-block", width: fill, height: hug, gap: 18 },
    [
      label(kicker, dark ? "#67E8F9" : "#0E7490", dark ? "#164E63" : "#E6FFFB"),
      txt(title, {
        name: "slide-title",
        width: wrap(1320),
        style: {
          fontSize: 58,
          bold: true,
          color: dark ? "#F8FAFC" : "#111827",
          lineSpacing: 0.9,
        },
      }),
      subtitle
        ? txt(subtitle, {
            name: "slide-subtitle",
            width: wrap(1180),
            style: {
              fontSize: 26,
              color: dark ? "#CBD5E1" : "#475569",
              lineSpacing: 1.15,
            },
          })
        : shape({ width: fixed(1), height: fixed(1), fill: "transparent" }),
    ],
  );
}

function bullet(value, accent = "#0E7490", dark = false) {
  return row(
    { width: fill, height: hug, gap: 16, align: "start" },
    [
      shape({
        name: "bullet-dot",
        geometry: "ellipse",
        width: fixed(14),
        height: fixed(14),
        fill: accent,
      }),
      txt(value, {
        width: fill,
        style: {
          fontSize: 25,
          color: dark ? "#E2E8F0" : "#1F2937",
          lineSpacing: 1.16,
        },
      }),
    ],
  );
}

function card(title, body, accent = "#0E7490", dark = false) {
  return column(
    {
      width: fill,
      height: fill,
      gap: 18,
      padding: { x: 28, y: 26 },
      fill: dark ? "#162235" : "#FFFFFF",
    },
    [
      rule({ width: fixed(90), stroke: accent, weight: 6 }),
      txt(title, {
        width: fill,
        style: {
          fontSize: 30,
          bold: true,
          color: dark ? "#F8FAFC" : "#111827",
        },
      }),
      txt(body, {
        width: fill,
        style: {
          fontSize: 23,
          color: dark ? "#CBD5E1" : "#475569",
          lineSpacing: 1.18,
        },
      }),
    ],
  );
}

function footer(textValue, dark = false) {
  return txt(textValue, {
    width: fill,
    style: { fontSize: 15, color: dark ? "#94A3B8" : "#64748B" },
  });
}

async function imageDataUrl(filePath) {
  const bytes = await fs.readFile(filePath);
  return `data:image/png;base64,${bytes.toString("base64")}`;
}

function addSlide(deck, root) {
  const slide = deck.slides.add();
  slide.compose(root, {
    frame: { left: 0, top: 0, width: W, height: H },
    baseUnit: 8,
  });
  return slide;
}

function ronDeck(mapDataUrl, mapLargeDataUrl) {
  const deck = Presentation.create({ slideSize: { width: W, height: H } });

  addSlide(
    deck,
    layers({ width: fill, height: fill }, [
      shape({ width: fill, height: fill, fill: "#0B1220" }),
      row(
        {
          width: fill,
          height: fill,
          padding: { x: 96, y: 84 },
          gap: 70,
          align: "center",
        },
        [
          column(
            { width: grow(1), height: fill, justify: "center", gap: 28 },
            [
              label("RON UI PART", "#67E8F9", "#164E63"),
              txt("Ron UI 파트 정리", {
                width: wrap(700),
                style: {
                  fontSize: 82,
                  bold: true,
                  color: "#F8FAFC",
                  lineSpacing: 0.9,
                },
              }),
              txt("M키 월드맵, 미니맵, Canvas 기준 정리\n공유용 발표 자료", {
                width: wrap(700),
                style: { fontSize: 30, color: "#B6C6D8", lineSpacing: 1.25 },
              }),
              rule({ width: fixed(260), stroke: "#22D3EE", weight: 6 }),
              txt("branch: ron_dev / commit: a275cab", {
                width: wrap(700),
                style: { fontSize: 21, color: "#93A7BC" },
              }),
            ],
          ),
          image({
            dataUrl: mapLargeDataUrl,
            width: fixed(760),
            height: fixed(760),
            fit: "cover",
            alt: "Ron world map asset",
          }),
        ],
      ),
    ]),
  );

  addSlide(
    deck,
    layers({ width: fill, height: fill }, [
      shape({ width: fill, height: fill, fill: "#F8FAFC" }),
      column(
        { width: fill, height: fill, padding: { x: 92, y: 72 }, gap: 52 },
        [
          titleBlock(
            "문제 정의",
            "지금 핵심은 기능이 아니라 붙는 위치다",
            "RonMinimapBootstrap 데모가 따로 도는 상태로는 팀원이 '프로젝트 UI에서 어떻게 쓰는지'를 보기 어렵다.",
          ),
          grid(
            {
              width: fill,
              height: grow(1),
              columns: [fr(1), fr(1), fr(1)],
              columnGap: 30,
            },
            [
              card("데모는 작동", "플레이어 이동과 지도 좌표 갱신은 확인됐다. 단, 데모 Canvas 중심이면 팀 UI 검증과는 분리된다.", "#0E7490"),
              card("UI는 Canvas 기준", "실제 공유 기준은 기존 Canvas 아래에서 버튼, 미니맵, 월드맵이 함께 제어되는 구조다.", "#7C3AED"),
              card("M키는 월드맵", "M키를 누르면 검은 패널이 아니라 지도 자체가 커지고, 나머지 HUD는 잠시 숨는 흐름이 맞다.", "#EA580C"),
            ],
          ),
          footer("발표 포인트: '내 Canvas에서 돌아가는 UI'로 설명해야 팀원이 바로 확인할 수 있다."),
        ],
      ),
    ]),
  );

  addSlide(
    deck,
    layers({ width: fill, height: fill }, [
      shape({ width: fill, height: fill, fill: "#FFFFFF" }),
      grid(
        {
          width: fill,
          height: fill,
          padding: { x: 92, y: 72 },
          columns: [fr(0.9), fr(1.1)],
          rows: [auto, fr(1), auto],
          columnGap: 58,
          rowGap: 36,
        },
        [
          titleBlock(
            "현재 구조",
            "Canvas가 주인이고, Bootstrap은 보험이다",
            "공유할 때는 UIManager 중심으로 설명하면 된다.",
          ),
          shape({ width: fixed(1), height: fixed(1), fill: "transparent" }),
          column(
            { width: fill, height: fill, gap: 22, justify: "center" },
            [
              bullet("UIManager.cs: 기존 Canvas에 붙어 미니맵과 월드맵을 직접 제어", "#0E7490"),
              bullet("FullMapPanel: Canvas 하위 오브젝트로 존재하고 기본은 비활성", "#7C3AED"),
              bullet("RonMinimapBootstrap.cs: Canvas가 없을 때만 fallback Canvas 생성", "#EA580C"),
              bullet("M키 입력은 UIManager가 받아 월드맵 상태만 토글", "#16A34A"),
            ],
          ),
          column(
            { width: fill, height: fill, gap: 20, justify: "center" },
            [
              panel(
                { width: fill, height: hug, padding: { x: 30, y: 24 }, fill: "#ECFEFF", materialize: true },
                txt("Canvas", { style: { fontSize: 34, bold: true, color: "#0F172A" } }),
              ),
              txt("↓", { style: { fontSize: 46, bold: true, color: "#0891B2" } }),
              panel(
                { width: fill, height: hug, padding: { x: 30, y: 24 }, fill: "#F5F3FF", materialize: true },
                txt("UIManager", { style: { fontSize: 34, bold: true, color: "#312E81" } }),
              ),
              row(
                { width: fill, height: hug, gap: 18 },
                [
                  panel({ width: fill, height: fixed(120), padding: { x: 22, y: 22 }, fill: "#F0FDF4", materialize: true }, txt("MiniMap", { style: { fontSize: 27, bold: true, color: "#166534" } })),
                  panel({ width: fill, height: fixed(120), padding: { x: 22, y: 22 }, fill: "#FFF7ED", materialize: true }, txt("FullMapPanel", { style: { fontSize: 27, bold: true, color: "#9A3412" } })),
                  panel({ width: fill, height: fixed(120), padding: { x: 22, y: 22 }, fill: "#F1F5F9", materialize: true }, txt("HUD roots", { style: { fontSize: 27, bold: true, color: "#334155" } })),
                ],
              ),
            ],
          ),
          footer("예시 라인: UIManager.cs 91-116, 202-231 / RonMinimapBootstrap.cs 31-38"),
        ],
      ),
    ]),
  );

  addSlide(
    deck,
    layers({ width: fill, height: fill }, [
      shape({ width: fill, height: fill, fill: "#0F172A" }),
      column(
        { width: fill, height: fill, padding: { x: 92, y: 72 }, gap: 44 },
        [
          titleBlock(
            "M키 UX",
            "월드맵 모드에서는 지도만 읽히게 만든다",
            "사용자 입장에서는 'UI 위에 검은 박스가 뜬다'가 아니라 '월드맵으로 전환된다'가 보여야 한다.",
            true,
          ),
          grid(
            {
              width: fill,
              height: grow(1),
              columns: [fr(1), fr(1)],
              columnGap: 42,
            },
            [
              panel(
                { width: fill, height: fill, padding: { x: 32, y: 30 }, fill: "#172033", materialize: true },
                column({ width: fill, height: fill, gap: 22 }, [
                  txt("기본 화면", { style: { fontSize: 32, bold: true, color: "#E2E8F0" } }),
                  image({ dataUrl: mapDataUrl, width: fixed(210), height: fixed(210), fit: "cover", alt: "minimap" }),
                  txt("미니맵은 좌상단에서 작게 유지\n전투/인벤토리 HUD는 그대로 보임", {
                    width: fill,
                    style: { fontSize: 25, color: "#CBD5E1", lineSpacing: 1.24 },
                  }),
                ]),
              ),
              panel(
                { width: fill, height: fill, padding: { x: 32, y: 30 }, fill: "#F8FAFC", materialize: true },
                column({ width: fill, height: fill, gap: 22 }, [
                  txt("월드맵 화면", { style: { fontSize: 32, bold: true, color: "#0F172A" } }),
                  layers(
                    { width: fixed(510), height: fixed(410) },
                    [
                      image({ dataUrl: mapDataUrl, width: fixed(510), height: fixed(410), fit: "cover", alt: "world map" }),
                      shape({ geometry: "ellipse", width: fixed(28), height: fixed(28), fill: "#22D3EE" }),
                    ],
                  ),
                  txt("FullMapPanel만 전면 배치\n나머지 HUD roots는 숨김 처리", {
                    width: fill,
                    style: { fontSize: 25, color: "#475569", lineSpacing: 1.24 },
                  }),
                ]),
              ),
            ],
          ),
          footer("M 또는 ESC로 닫기. 플레이어 아이콘은 같은 좌표 변환 기준을 사용한다.", true),
        ],
      ),
    ]),
  );

  addSlide(
    deck,
    layers({ width: fill, height: fill }, [
      shape({ width: fill, height: fill, fill: "#FFFBEB" }),
      grid(
        {
          width: fill,
          height: fill,
          padding: { x: 92, y: 72 },
          columns: [fr(1), fr(1)],
          rows: [auto, fr(1), auto],
          columnGap: 54,
          rowGap: 40,
        },
        [
          titleBlock(
            "레이아웃 수정",
            "검은 배경은 감추고, 지도만 클리핑한다",
            "지도 축소/확대 중 블랙 레이아웃이 보이면 월드맵이 아니라 임시 패널처럼 보인다.",
          ),
          shape({ width: fixed(1), height: fixed(1), fill: "transparent" }),
          column(
            { width: fill, height: fill, gap: 22, justify: "center" },
            [
              txt("수정 전 느낌", { style: { fontSize: 30, bold: true, color: "#78350F" } }),
              panel(
                { width: fill, height: fixed(420), padding: { x: 44, y: 44 }, fill: "#111827", materialize: true },
                image({ dataUrl: mapDataUrl, width: fixed(420), height: fixed(300), fit: "cover", alt: "map with black panel" }),
              ),
              txt("지도 밖의 검은 영역이 UI 결함처럼 보임", {
                width: fill,
                style: { fontSize: 23, color: "#92400E" },
              }),
            ],
          ),
          column(
            { width: fill, height: fill, gap: 22, justify: "center" },
            [
              txt("수정 후 기준", { style: { fontSize: 30, bold: true, color: "#14532D" } }),
              panel(
                { width: fill, height: fixed(420), padding: { x: 44, y: 44 }, fill: "#ECFDF5", materialize: true },
                layers(
                  { width: fixed(420), height: fixed(300) },
                  [
                    image({ dataUrl: mapDataUrl, width: fixed(420), height: fixed(300), fit: "cover", alt: "map only" }),
                    shape({ geometry: "ellipse", width: fixed(24), height: fixed(24), fill: "#22D3EE" }),
                  ],
                ),
              ),
              txt("FullMapPanel Image는 투명, RectMask2D로 지도만 자름", {
                width: fill,
                style: { fontSize: 23, color: "#166534" },
              }),
            ],
          ),
          footer("예시 라인: UIManager.cs 209-227, 302-310 / Docs line 112"),
        ],
      ),
    ]),
  );

  addSlide(
    deck,
    layers({ width: fill, height: fill }, [
      shape({ width: fill, height: fill, fill: "#F8FAFC" }),
      column(
        { width: fill, height: fill, padding: { x: 92, y: 72 }, gap: 42 },
        [
          titleBlock(
            "공유 기준",
            "Ron 파트는 올려도 되고, 5개 변경 파일은 보류",
            "현재 커밋 기준으로 UI 파트는 공유 가능하다. 다만 프로젝트 전역 설정 변경은 별도 확인 전까지 묶지 않는다.",
          ),
          grid(
            {
              width: fill,
              height: grow(1),
              columns: [fr(0.95), fr(1.05)],
              columnGap: 42,
            },
            [
              column({ width: fill, height: fill, gap: 20 }, [
                card("올릴 것", "Assets/WorkSpace/Ron 아래 UI 코드, 씬, 지도 리소스, 정리 문서\ncommit a275cab 기준", "#0E7490"),
                card("보류할 것", "Packages/manifest.json, packages-lock.json, TagManager.asset, URPProjectSettings.asset, GrayZone_V0.1.slnx", "#EA580C"),
              ]),
              column({ width: fill, height: fill, gap: 22 }, [
                txt("팀원에게 받을 질문", { style: { fontSize: 34, bold: true, color: "#111827" } }),
                bullet("M키 월드맵이 실제 Canvas에서 켜지는가?", "#0E7490"),
                bullet("게임 해상도가 바뀌어도 HUD anchor가 유지되는가?", "#7C3AED"),
                bullet("미니맵/월드맵이 같은 좌표 기준을 쓰는가?", "#16A34A"),
                bullet("검은 패널 없이 지도만 보이는가?", "#EA580C"),
              ]),
            ],
          ),
          footer("발표 톤: 구현을 과장하지 말고, '팀 Canvas에 붙이는 기준을 잡았다'고 말하면 된다."),
        ],
      ),
    ]),
  );

  return deck;
}

function jungDeck() {
  const deck = Presentation.create({ slideSize: { width: W, height: H } });

  addSlide(
    deck,
    layers({ width: fill, height: fill }, [
      shape({ width: fill, height: fill, fill: "#101828" }),
      column(
        { width: fill, height: fill, padding: { x: 104, y: 92 }, gap: 34, justify: "center" },
        [
          label("JUNG CODE REVIEW", "#FBBF24", "#422006"),
          txt("정현님 코드 검토", {
            width: wrap(1160),
            style: { fontSize: 74, bold: true, color: "#F8FAFC", lineSpacing: 1.05 },
          }),
          txt("개인 작업을 팀 구조로 올리기 전\n확인할 기준", {
            width: wrap(980),
            style: { fontSize: 31, color: "#CBD5E1" },
          }),
          rule({ width: fixed(300), stroke: "#FBBF24", weight: 6 }),
          txt("scope: origin/jung_dev / Assets/WorkSpace/Junghyeon", {
            width: wrap(980),
            style: { fontSize: 21, color: "#98A2B3" },
          }),
        ],
      ),
    ]),
  );

  addSlide(
    deck,
    layers({ width: fill, height: fill }, [
      shape({ width: fill, height: fill, fill: "#FFFFFF" }),
      column(
        { width: fill, height: fill, padding: { x: 92, y: 72 }, gap: 44 },
        [
          titleBlock(
            "요약 판단",
            "방향은 참고 가능, 그대로 팀 프레임워크화는 보류",
            "정현님 작업은 도메인 분리 시도 자체는 의미가 있다. 다만 현재는 개인 프로토타입 성격이 강해서 공통 구조로 승격하기 전에 설명과 검증이 필요하다.",
          ),
          grid(
            { width: fill, height: grow(1), columns: [fr(1), fr(1)], columnGap: 40 },
            [
              card("좋게 볼 점", "자원, NPC 런타임, 셸터, 무기 SO를 나누려는 방향은 팀 설계 논의의 재료가 된다.", "#16A34A"),
              card("막아야 할 점", "개인 구조가 곧바로 팀 구조가 되면 전투/UI/기획 데이터가 그 구조에 끌려가게 된다.", "#DC2626"),
            ],
          ),
          footer("말의 중심: 사람을 평가하는 게 아니라, 팀 구조로 승격할 수 있는 상태인지 검토하는 것이다."),
        ],
      ),
    ]),
  );

  addSlide(
    deck,
    layers({ width: fill, height: fill }, [
      shape({ width: fill, height: fill, fill: "#F8FAFC" }),
      grid(
        {
          width: fill,
          height: fill,
          padding: { x: 92, y: 72 },
          columns: [fr(0.82), fr(1.18)],
          rows: [auto, fr(1), auto],
          columnGap: 54,
          rowGap: 36,
        },
        [
          titleBlock("참고 가치", "가져올 수 있는 건 구조 아이디어다", "그대로 병합이 아니라 필요한 단위만 뽑아야 한다."),
          shape({ width: fixed(1), height: fixed(1), fill: "transparent" }),
          column({ width: fill, height: fill, gap: 22, justify: "center" }, [
            txt("후보 영역", { style: { fontSize: 34, bold: true, color: "#111827" } }),
            bullet("ResourceStorage / CostBundle: 재화 지불 흐름의 시작점", "#0E7490"),
            bullet("NPCRuntimeData: NPC 상태와 SO 데이터를 분리하려는 시도", "#7C3AED"),
            bullet("Weapon / WeaponPart SO: 장비 데이터 방향성", "#16A34A"),
            bullet("Shelter 컴포넌트: 배치/회복/인원 수용 컨셉", "#EA580C"),
          ]),
          column({ width: fill, height: fill, gap: 18, justify: "center" }, [
            panel(
              { width: fill, height: hug, padding: { x: 30, y: 24 }, fill: "#ECFEFF", materialize: true },
              txt("검토 단위: '폴더 전체'가 아니라 '인터페이스와 데이터 계약'", {
                style: { fontSize: 31, bold: true, color: "#0F172A" },
              }),
            ),
            txt("예: 전투 구현이 NPC 체력/부상 판정을 쓸 수 있는가?\n예: 기획 데이터가 ScriptableObject로 관리 가능한가?\n예: UI가 자원 부족 이벤트를 받을 수 있는가?", {
              width: fill,
              style: { fontSize: 27, color: "#475569", lineSpacing: 1.28 },
            }),
          ]),
          footer("이 슬라이드는 정현님 작업을 부정하지 않고, 팀 기준으로 다시 자르는 관점이다."),
        ],
      ),
    ]),
  );

  addSlide(
    deck,
    layers({ width: fill, height: fill }, [
      shape({ width: fill, height: fill, fill: "#111827" }),
      column(
        { width: fill, height: fill, padding: { x: 92, y: 72 }, gap: 44 },
        [
          titleBlock(
            "통합 리스크",
            "아직 공통 구조로 올리기엔 빈칸이 남아 있다",
            "이 상태에서 팀 작업화하면 누가 어떤 책임을 지는지 흐려질 수 있다.",
            true,
          ),
          grid(
            { width: fill, height: grow(1), columns: [fr(1), fr(1), fr(1)], columnGap: 30 },
            [
              card("설계 빈칸", "TODO가 핵심 클래스에 남아 있고, 셸터/룸/전투 연동 기준이 아직 결정되지 않았다.", "#FBBF24", true),
              card("구현 빈칸", "StaffRoster의 Temp, StaffAssignment의 CurrentPeople/BrokenPercentage처럼 실제 갱신 로직이 비어 있다.", "#F97316", true),
              card("팀 작업 위험", "네임스페이스, 테스트, 프로젝트 편입 기준 없이 들어오면 다른 파트가 개인 구조에 맞춰야 한다.", "#EF4444", true),
            ],
          ),
          footer("핵심 표현: '나쁘다'가 아니라 '공통화 전 단계가 더 필요하다'.", true),
        ],
      ),
    ]),
  );

  addSlide(
    deck,
    layers({ width: fill, height: fill }, [
      shape({ width: fill, height: fill, fill: "#FFFBEB" }),
      column(
        { width: fill, height: fill, padding: { x: 80, y: 62 }, gap: 28 },
        [
          titleBlock(
            "라인 예시",
            "몇 줄만 봐도 아직 검토 포인트가 보인다",
            "상대에게 공격적으로 말하기보다, '이 부분은 합의가 필요하다'는 근거로 쓰면 된다.",
          ),
          grid(
            {
              width: fill,
              height: grow(1),
              columns: [fr(0.92), fr(0.2), fr(1.28)],
              rows: [auto, auto, auto, auto, auto, auto, auto],
              columnGap: 12,
              rowGap: 10,
            },
            [
              txt("파일", { style: { fontSize: 22, bold: true, color: "#78350F" } }),
              txt("줄", { style: { fontSize: 22, bold: true, color: "#78350F" } }),
              txt("검토 포인트", { style: { fontSize: 22, bold: true, color: "#78350F" } }),
              txt("StaffRoster.cs", { style: { fontSize: 21, color: "#111827" } }),
              txt("4", { style: { fontSize: 21, color: "#111827" } }),
              txt("struct Temp가 실제 NPC/스태프 타입으로 정리되지 않음", { style: { fontSize: 21, color: "#111827" } }),
              txt("StaffAssignment.cs", { style: { fontSize: 21, color: "#111827" } }),
              txt("6, 8", { style: { fontSize: 21, color: "#111827" } }),
              txt("CurrentPeople, BrokenPercentage가 있지만 갱신 책임이 없음", { style: { fontSize: 21, color: "#111827" } }),
              txt("NPCRuntimeData.cs", { style: { fontSize: 21, color: "#111827" } }),
              txt("4, 7, 8, 55", { style: { fontSize: 21, color: "#111827" } }),
              txt("핵심 런타임 클래스에 TODO가 남아 설계 결정이 열려 있음", { style: { fontSize: 21, color: "#111827" } }),
              txt("NPCRuntimeData.cs", { style: { fontSize: 21, color: "#111827" } }),
              txt("57", { style: { fontSize: 21, color: "#111827" } }),
              txt("shelterId를 받지만 실제 저장은 roomId 중심이라 계약이 애매함", { style: { fontSize: 21, color: "#111827" } }),
              txt("ResourceStorage.cs", { style: { fontSize: 21, color: "#111827" } }),
              txt("35", { style: { fontSize: 21, color: "#111827" } }),
              txt("자원 부족 이벤트 연결 TODO. UI 피드백과 아직 연결되지 않음", { style: { fontSize: 21, color: "#111827" } }),
              txt("NPCHealthRuleSO.cs", { style: { fontSize: 21, color: "#111827" } }),
              txt("4", { style: { fontSize: 21, color: "#111827" } }),
              txt("프레임워크 추가 시 SO가 아닌 자체 로직 전환 필요 메모", { style: { fontSize: 21, color: "#111827" } }),
            ],
          ),
          footer("현재 origin/jung_dev 기준. 오타 수정 커밋 이후라 Helath/Prefap 이슈는 검토 대상에서 제외했다."),
        ],
      ),
    ]),
  );

  addSlide(
    deck,
    layers({ width: fill, height: fill }, [
      shape({ width: fill, height: fill, fill: "#FFFFFF" }),
      grid(
        {
          width: fill,
          height: fill,
          padding: { x: 92, y: 72 },
          columns: [fr(1), fr(1)],
          rows: [auto, fr(1), auto],
          columnGap: 48,
          rowGap: 40,
        },
        [
          titleBlock(
            "민기에게 줄 말",
            "반대가 아니라 게이트를 세우는 태도가 필요하다",
            "민기는 메인기획과 전투 구현을 맡는 만큼, 팀 구조가 전투와 기획 데이터를 가두지 않게 기준을 잡아야 한다.",
          ),
          shape({ width: fixed(1), height: fixed(1), fill: "transparent" }),
          panel(
            { width: fill, height: fill, padding: { x: 34, y: 34 }, fill: "#F8FAFC", materialize: true },
            column({ width: fill, height: fill, gap: 24 }, [
              txt("그대로 말해도 되는 문장", { style: { fontSize: 31, bold: true, color: "#111827" } }),
              txt("정현님 작업 방향은 참고할 수 있는데, 이걸 바로 팀 공통 구조로 쓰려면 아직 설명과 검증이 필요해요. 특히 전투, 기획 데이터, UI가 어떤 계약으로 붙는지 먼저 맞추고 필요한 부분만 가져오는 게 안전합니다.", {
                width: fill,
                style: { fontSize: 29, color: "#334155", lineSpacing: 1.28 },
              }),
            ]),
          ),
          column({ width: fill, height: fill, gap: 22 }, [
            txt("민기의 역할", { style: { fontSize: 31, bold: true, color: "#111827" } }),
            bullet("개인 작업을 막는 사람이 아니라 팀 편입 기준을 정하는 사람", "#0E7490"),
            bullet("전투 시스템이 필요한 NPC/자원 계약을 먼저 정의하는 사람", "#7C3AED"),
            bullet("공통화는 설명, 테스트, 책임자가 확인된 뒤 승인하는 사람", "#EA580C"),
          ]),
          footer("회의 톤은 차분하게: '정현님 코드가 틀렸다'보다 '팀 구조로 올리려면 이 기준이 필요하다'."),
        ],
      ),
    ]),
  );

  addSlide(
    deck,
    layers({ width: fill, height: fill }, [
      shape({ width: fill, height: fill, fill: "#F8FAFC" }),
      column(
        { width: fill, height: fill, padding: { x: 92, y: 72 }, gap: 40 },
        [
          titleBlock(
            "결정 제안",
            "정현님 브랜치는 유지하고, 필요한 부분만 별도 통합한다",
            "원격 브랜치를 임의로 바꾸지 않고, 본인이 만든 작업은 그대로 둔 채 팀 검토 순서를 만든다.",
          ),
          grid(
            { width: fill, height: grow(1), columns: [fr(1), fr(1), fr(1)], columnGap: 28 },
            [
              card("1. 설명 받기", "정현님이 구조 의도와 사용 흐름을 10분 정도 설명한다.", "#0E7490"),
              card("2. 계약 고르기", "민기 기준으로 전투/기획/UI가 실제로 쓸 인터페이스만 뽑는다.", "#7C3AED"),
              card("3. 작게 통합", "WorkSpace/Junghyeon 전체 병합이 아니라 작은 adapter 또는 모델부터 검증한다.", "#16A34A"),
            ],
          ),
          row(
            { width: fill, height: hug, gap: 22 },
            [
              panel({ width: fill, height: hug, padding: { x: 26, y: 20 }, fill: "#FEF2F2", materialize: true }, txt("금지: 본인 동의 없이 origin/jung_dev 수정", { style: { fontSize: 24, bold: true, color: "#991B1B" } })),
              panel({ width: fill, height: hug, padding: { x: 26, y: 20 }, fill: "#ECFDF5", materialize: true }, txt("유지: 정현님 작업은 원격 브랜치에 그대로 보존", { style: { fontSize: 24, bold: true, color: "#166534" } })),
            ],
          ),
          footer("정리 문장: '좋은 재료가 있지만, 지금은 팀 공통 프레임워크가 아니라 검토 대상이다.'"),
        ],
      ),
    ]),
  );

  return deck;
}

async function exportDeck(deck, pptxPath) {
  const blob = await PresentationFile.exportPptx(deck);
  await blob.save(pptxPath);
}

async function renderFromPptx(pptxPath, deckName) {
  const bytes = await fs.readFile(pptxPath);
  const imported = await PresentationFile.importPptx(bytes);
  const slides = imported.slides.items;
  const deckPreviewDir = path.join(previewRoot, deckName);
  await fs.mkdir(deckPreviewDir, { recursive: true });

  const slideFiles = [];
  for (let i = 0; i < slides.length; i += 1) {
    const canvas = new Canvas(W, H);
    const ctx = canvas.getContext("2d");
    await drawSlideToCtx(
      slides[i],
      imported,
      ctx,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      { clearBeforeDraw: true },
    );
    const file = path.join(deckPreviewDir, `slide-${String(i + 1).padStart(2, "0")}.png`);
    await fs.writeFile(file, await canvas.encode("png"));
    slideFiles.push(file);
  }

  const thumbW = 480;
  const thumbH = 270;
  const gap = 24;
  const cols = 3;
  const rowsNeeded = Math.ceil(slideFiles.length / cols);
  const contact = new Canvas(cols * thumbW + (cols + 1) * gap, rowsNeeded * thumbH + (rowsNeeded + 1) * gap);
  const cctx = contact.getContext("2d");
  cctx.fillStyle = "#E5E7EB";
  cctx.fillRect(0, 0, contact.width, contact.height);
  for (let i = 0; i < slideFiles.length; i += 1) {
    const img = await loadImage(slideFiles[i]);
    const x = gap + (i % cols) * (thumbW + gap);
    const y = gap + Math.floor(i / cols) * (thumbH + gap);
    cctx.fillStyle = "#FFFFFF";
    cctx.fillRect(x - 2, y - 2, thumbW + 4, thumbH + 4);
    cctx.drawImage(img, x, y, thumbW, thumbH);
  }
  const contactPath = path.join(previewRoot, `${deckName}_contact.png`);
  await fs.writeFile(contactPath, await contact.encode("png"));

  return {
    pptxPath,
    slideCount: slides.length,
    previewDir: deckPreviewDir,
    contactPath,
    slideFiles,
  };
}

async function main() {
  await fs.mkdir(outputRoot, { recursive: true });
  await fs.mkdir(previewRoot, { recursive: true });

  const mapDataUrl = await imageDataUrl(map512);
  const mapLargeDataUrl = await imageDataUrl(map2048);

  const ronPath = path.join(outputRoot, "Ron_UI_Part.pptx");
  const jungPath = path.join(outputRoot, "Junghyeon_Code_Review.pptx");

  await exportDeck(ronDeck(mapDataUrl, mapLargeDataUrl), ronPath);
  await exportDeck(jungDeck(), jungPath);

  const reports = [
    await renderFromPptx(ronPath, "Ron_UI_Part"),
    await renderFromPptx(jungPath, "Junghyeon_Code_Review"),
  ];

  const reportPath = path.join(outputRoot, "presentation_build_report.json");
  await fs.writeFile(reportPath, JSON.stringify(reports, null, 2), "utf8");

  console.log(JSON.stringify({ ok: true, reportPath, reports }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
