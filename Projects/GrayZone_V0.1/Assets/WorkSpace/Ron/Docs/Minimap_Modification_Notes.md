# Ron Minimap Modification Notes

## 목적

Ron `Test` 씬에서 500m x 500m 맵 이미지를 기준으로 미니맵과 전체맵 동작을 테스트한다.

현재 목표는 최종 UI 구조 완성이 아니라, 다음 기능의 동작 감각을 빠르게 확인하는 것이다.

- 작은 미니맵에서 플레이어 주변 확대 표시
- 플레이어 아이콘 중앙 고정
- `M` 키로 전체맵 열기/닫기
- 전체맵에서 마우스 휠 확대/축소
- 전체맵에서 좌클릭 드래그 이동
- 임시 플레이어 이동 및 마우스 회전

참고 이미지:

- `C:\Users\user\Pictures\3.png`: Play 화면에서 미니맵/전체맵 표시와 플레이어 위치 오차 확인
- `C:\Users\user\Pictures\4.png`: UI 레이아웃 기준 이미지

## 사용 에셋

원본 다운로드 위치:

```text
C:\Users\user\Downloads\unity_500m_map_assets
```

프로젝트 내 사용 위치:

```text
D:\GitRepository\Grayzone\Projects\GrayZone_V0.1\Assets\WorkSpace\Ron\Resources\unity_500m_map_assets
```

주요 파일:

- `map_500x500_ground_2048.png`: Ground에 입히는 500m x 500m 맵 이미지
- `map_500x500_minimap_512.png`: UI 미니맵/전체맵 표시용 이미지
- `map_500x500_layout_overlay_2048.png`: 건물/도로 레이아웃 확인용 오버레이
- `unity_map_coordinates.csv`: 맵 기준 좌표 참고용 데이터

Unity 기본 `Plane`은 10m x 10m이므로, 500m x 500m 맵 테스트 기준은 다음과 같다.

```text
Ground Transform Scale = (50, 1, 50)
World Size = 500m x 500m
World X/Z range = -250 ~ 250
```

## 현재 구현 파일

```text
Assets/WorkSpace/Ron/Scripts/UIManager.cs
Assets/WorkSpace/Ron/Scripts/RonMinimapBootstrap.cs
Assets/WorkSpace/Ron/Scripts/RonPlayerMover.cs
```

### UIManager

`Test` 씬의 기존 `Canvas`에 붙어 있는 실제 UI 제어 스크립트다.

현재 구조는 런타임에서 별도 Canvas를 새로 만드는 방식이 아니라, 씬에 배치된 `Canvas`와 `MiniMap` 오브젝트를 기준으로 동작한다.

역할:

- 기존 `Canvas`와 `MiniMap` RectTransform 사용
- `MiniMap` 아래에 지도 이미지, 플레이어 아이콘 생성/갱신
- `M` 키로 전체맵 열기/닫기
- 전체맵에서 마우스 휠 확대/축소
- 전체맵에서 좌클릭 드래그 이동
- 월드 좌표를 지도 UI 좌표로 변환
- 테스트용으로 `Player`에 `RonPlayerMover` 자동 부착 가능

현재 씬 연결:

```text
Canvas
├─ CanvasScaler: Scale With Screen Size, 1530 x 860, Match 0.5
├─ MiniMap
├─ FullMapPanel: 기본 비활성, M 키 또는 선택 버튼으로 열림
└─ UIManager
   ├─ player: Player
   └─ miniMapRoot: MiniMap
```

HUD 앵커 기준:

- `MiniMap`, `Info`, `Character1~3`: 좌상단 기준
- `Key1~3`: 좌하단 기준
- `Mission`, `Weapon1~3`: 우상단 기준

초기에는 대부분 중앙 앵커 + 절대 좌표였기 때문에 Game View 크기가 바뀌면 UI가 중앙 쪽으로 밀렸다.

Play 중 생성/보강되는 계층:

```text
Canvas
├─ MiniMap
│  ├─ MapContent
│  │  └─ MapImage
│  └─ PlayerIcon
└─ FullMapPanel
   ├─ MapImage
   │  └─ PlayerIcon
```

전체맵 입력:

- 현재 기본 입력은 `M` 키 단축키다.
- Canvas에 `FullMapPanel`은 실제 오브젝트로 존재하고, 평소에는 비활성 상태다.
- `M` 키로 전체맵을 열면 다른 HUD 루트는 숨기고 `FullMapPanel`만 최상단에 표시한다.
- `FullMapPanel`의 Image는 투명이고, `RectMask2D`를 클리핑 용도로 사용한다. 그래서 지도 축소 시 검은 배경 패널이 보이지 않는다.
- 클릭 버튼이 필요하면 버튼을 만든 뒤 `UIManager.fullMapToggleButton`에 연결하면 같은 토글 로직을 사용한다.

### RonMinimapBootstrap

`Test` 씬에서 `UIManager`가 빠졌을 때만 보조로 붙여주는 fallback 코드다.

현재 정상 경로에서는 기존 `Canvas`에 붙은 `UIManager`가 먼저 동작하므로, 별도 런타임 Canvas를 새로 만들지 않는다.

```text
Test scene loaded
├─ UIManager exists on Canvas -> do nothing
└─ UIManager missing
   ├─ find existing Canvas
   ├─ if Canvas missing, create fallback Canvas
   └─ add UIManager
```

작은 미니맵 동작:

- `Ron MiniMap`은 좌상단에 고정
- `PlayerIcon`은 미니맵 중앙 고정
- `MapContent`가 플레이어 위치의 반대 방향으로 이동
- 결과적으로 네비게이션처럼 플레이어 주변을 보여준다

전체맵 동작:

- `M` 키로 열기/닫기
- 마우스 휠로 확대/축소
- 좌클릭 드래그로 지도 이동
- 플레이어 아이콘은 전체 지도 기준 좌표 위치에 표시

현재 주요 값:

```csharp
WorldSizeMeters = 500f;
MiniMapVisibleMeters = 85f;
MiniMapSizePixels = 240f;
MapCalibrationOffsetMeters = new Vector2(2f, -6f);
fullMapBaseSize = 660f;
fullMapZoom range = 0.75f ~ 3f;
```

`MapCalibrationOffsetMeters`는 Ground 위 실제 위치와 UI 지도 이미지 위치가 살짝 어긋나는 문제를 맞추기 위한 임시 보정값이다.

### RonPlayerMover

테스트용 플레이어 조작 스크립트다.

조작:

```text
WASD / 방향키: 캐릭터 기준 이동
우클릭 드래그: Y축 마우스 회전
```

## 3.png / 4.png 기준으로 확인한 이슈

### 1. 미니맵이 UI 레이아웃보다 작게 보임

초기에는 `MiniMapSizePixels = 220`이었고, 4.png의 레이아웃 기준보다 작게 느껴졌다.

현재는 다음처럼 조정했다.

```csharp
MiniMapSizePixels = 240f;
MiniMapVisibleMeters = 85f;
```

의미:

- 미니맵 프레임 크기를 240px로 증가
- 한 번에 보이는 월드 범위를 85m로 축소
- 플레이어 주변이 더 확대되어 보임

### 2. 미니맵이 화면 밖으로 밀림

초기에는 기존 Canvas에 런타임 미니맵을 붙이면서 앵커/피벗 기준이 섞였다.

해결:

- 별도 `Ron Runtime UI Canvas` 생성
- `Screen Space Overlay`
- `CanvasScaler` 기준 해상도 `1920 x 1080`
- `Ron MiniMap` 피벗을 좌상단 `(0, 1)`로 지정
- 좌상단에서 `(18, -18)` 위치에 고정

### 3. 플레이어 위치 오차

3.png 기준으로 실제 Ground 위 플레이어 위치와 미니맵 아이콘 위치가 조금 다르게 보였다.

현재는 임시 보정값을 사용한다.

```csharp
MapCalibrationOffsetMeters = new Vector2(2f, -6f);
```

주의:

- 이 값은 최종 설계값이 아니다.
- Ground용 이미지와 minimap용 이미지가 동일한 좌표 기준으로 정확히 잘렸는지 확인해야 한다.
- 최종에서는 Inspector에서 조정 가능한 값으로 빼는 것이 좋다.

## 지금 구조의 한계

현재 구현은 테스트용이라 아직 일부 하드코딩이 남아 있다.

대표적인 하드코딩:

- `RonMinimapBootstrap`에서 `Test` 씬 이름 직접 검사
- 미니맵/전체맵 기본 크기
- 지도 리소스 경로
- `Player` 참조가 없을 때 이름으로 검색
- 미니맵 내부 요소와 전체맵 패널은 Play 중 생성/보강

프로토타입 검증에는 빠르지만, 최종 구조로는 유지보수가 어렵다.

## 최종 정리 방향

최종적으로는 기존 Canvas 안에 UI 계층을 직접 만들고, 스크립트는 참조만 받아서 제어하는 구조가 좋다.

추천 계층:

```text
Canvas
├─ MiniMapPanel
│  ├─ Mask / RectMask2D
│  ├─ MapContent
│  │  └─ MapImage
│  └─ PlayerIcon
└─ FullMapPanel
   ├─ MapViewport
   │  ├─ MapImage
   │  └─ PlayerIcon
   └─ OptionalButtons
```

추천 스크립트 분리:

```text
UIManager
├─ M키 입력 처리
├─ 전체맵 열기/닫기
└─ 다른 UI와의 상태 관리

MinimapController
├─ 미니맵 지도 이동
├─ 플레이어 아이콘 표시
├─ 전체맵 확대/축소
├─ 전체맵 드래그 이동
└─ 월드 좌표 -> 지도 UI 좌표 변환
```

`UIManager`가 모든 좌표 계산을 직접 맡기보다는, `MinimapController`를 호출하는 구조가 낫다.

## 다음 작업 후보

1. 현재 프로토타입으로 미니맵 감각 확인
2. 플레이어 위치 오차를 여러 지점에서 비교
3. `MapCalibrationOffsetMeters`를 Inspector 노출값으로 변경
4. 런타임 자동 생성 구조를 실제 Canvas UI 계층 구조로 이전
5. `UIManager`에서 전체맵 토글 입력을 관리
6. 플레이어 이동 스크립트는 실제 캐릭터 컨트롤러가 들어오면 제거
