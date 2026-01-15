# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

VitalDB Viewer는 `.vital` 파일을 위한 브라우저 기반 뷰어입니다. VitalDB(https://vitaldb.net)에서 사용하는 의료 활력징후 데이터 포맷으로, ECG, 동맥압, plethysmograph 등의 실시간 waveform과 환자 모니터링 데이터를 시각화합니다.

## 프로젝트 구조

```
/
├── src/                        # 메인 개발 디렉토리 (v0.2.0)
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── js/                     # ES 모듈 소스
│   └── css/
├── docs/
│   ├── original-source/        # 원본 단일 HTML 버전
│   └── publications/           # VitalDB 관련 연구 논문
└── LICENSE
```

## 개발 명령어

```bash
cd src

# 의존성 설치
bun install
# 또는: npm install

# 개발 서버 실행 (http://localhost:5173)
bun run dev
# 또는: npm run dev

# 프로덕션 빌드
bun run build
# 또는: npm run build
```

## 아키텍처

ES 모듈 기반 Vanilla JavaScript 구조:

```
src/js/
├── main.js             # 앱 진입점, 이벤트 연결
├── config.js           # Preset 서버 설정
├── constants.js        # MONTYPES, LAYOUTS, WAVE_GROUPS
├── state.js            # 반응형 상태 관리 (pub/sub)
│
├── parser/
│   ├── vitalParser.js  # .vital 바이너리 파싱
│   └── trackProcessor.js # waveform 정규화
│
├── renderer/
│   ├── canvasRenderer.js  # 메인 Canvas 렌더링
│   ├── waveRenderer.js    # waveform 드로잉
│   ├── paramRenderer.js   # parameter 값 표시
│   ├── eventRenderer.js   # 이벤트 목록
│   └── minimapRenderer.js # 미니맵 렌더링
│
├── controls/
│   ├── playback.js     # 재생/일시정지, 탐색, 속도
│   ├── fileLoader.js   # 로컬/원격 파일 로드
│   └── trackView.js    # Track View 줌/패닝/범위선택
│
├── ui/
│   ├── sidebar.js      # 접을 수 있는 사이드바
│   └── toast.js        # 토스트 알림
│
├── export/
│   ├── screenshot.js   # PNG 스크린샷 내보내기
│   └── csv.js          # CSV 데이터 내보내기
│
├── api/
│   └── vitaldb.js      # VitalDB API 클라이언트
│
└── utils/
    ├── time.js         # 시간 포맷팅
    └── binary.js       # 바이너리 읽기 유틸
```

### 핵심 데이터 흐름

```
┌─────────────┐    ┌──────────────┐    ┌─────────────────┐    ┌──────────────┐
│ FileLoader  │───▶│ VitalParser  │───▶│ TrackProcessor  │───▶│ CanvasRender │
│ (로드/압축해제)│    │ (바이너리 파싱) │    │ (0-255 정규화)    │    │ (60fps 렌더링) │
└─────────────┘    └──────────────┘    └─────────────────┘    └──────────────┘
                                                                     │
                                                                     ▼
                                                          ┌──────────────────┐
                                                          │ MinimapRenderer  │
                                                          │ (전체 개요 + 탐색) │
                                                          └──────────────────┘
```

### .vital 파일 포맷

- `VITA` magic header signature
- Packet types: 9 (device info), 0 (track info), 1 (records)
- Track types: 1 (waveform), 2 (numeric), 5 (string)
- gzip 압축 → pako 라이브러리로 해제

### 주요 상수 (constants.js)

- `MONTYPES`: type code → parameter name 매핑 (1=ECG_WAV, 2=ECG_HR 등)
- `WAVE_GROUPS`: 12개 waveform 그룹 (ECG, ART, PLETH, CVP, EEG, RESP, CO2 등)
- `PARAM_GROUPS`: 15개 non-wave parameter 그룹
- `PARAM_LAYOUTS`: 5가지 레이아웃 (ONE, TWO, LR, BP, VNT)

## 기술 스택

- **Frontend**: Vanilla JavaScript (ES Modules)
- **Styling**: Tailwind CSS (로컬 빌드)
- **Rendering**: HTML5 Canvas (~60fps)
- **Build**: Vite
- **압축 해제**: pako (gzip)

## 키보드 단축키

### 기본 단축키
| 키 | 기능 |
|----|------|
| `Space` | 재생/일시정지 |
| `←` / `→` | 7초 뒤로/앞으로 |
| `Home` / `End` | 처음/끝으로 이동 |

### 확장 단축키
| 키 | 기능 |
|----|------|
| `V` | View Mode 전환 (Monitor ↔ Track) |
| `S` | 사이드바 토글 |
| `F` | 트랙 필터 패널 토글 |
| `M` | 현재 위치에 마커 추가 |
| `+` / `-` | 시간축 확대/축소 |
| `0` | 확대 레벨 초기화 |
| `1-8` | 재생 속도 변경 (x1~x8) |
| `Ctrl+S` | 스크린샷 저장 (PNG) |
| `Ctrl+E` | CSV 내보내기 |

## 뷰 모드

| 모드 | 용도 | 특징 |
|-----|------|------|
| Monitor View | 실시간 파라미터 모니터링 | 현재 시점 기준 sweep, Wave Groups + Params |
| Track View | 전체 시계열 탐색 | 전체 녹화 시간 표시, 줌/패닝/범위 선택 |

## 내보내기 기능

- **스크린샷**: 현재 Canvas 화면을 PNG로 저장
- **CSV (Waveform)**: 선택 구간 또는 전체 waveform 데이터
- **CSV (Parameters)**: numeric/string parameter 데이터
