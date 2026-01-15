# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

VitalDB Viewer는 `.vital` 파일을 위한 브라우저 기반 뷰어입니다. VitalDB(https://vitaldb.net)에서 사용하는 의료 활력징후 데이터 포맷으로, ECG, 동맥압, plethysmograph 등의 실시간 waveform과 환자 모니터링 데이터의 numeric parameter를 표시합니다.

## 아키텍처

ES 모듈 기반 Vanilla JavaScript 구조:

```
/
├── index.html              # 메인 HTML
├── css/monitor.css         # 의료기기 다크 테마 스타일
└── js/
    ├── main.js             # 앱 진입점, 이벤트 연결
    ├── config.js           # Preset 서버 설정
    ├── constants.js        # MONTYPES, LAYOUTS, WAVE_GROUPS
    ├── state.js            # 반응형 상태 관리 (pub/sub)
    ├── parser/
    │   ├── vitalParser.js  # .vital 바이너리 파싱
    │   └── trackProcessor.js # waveform 정규화
    ├── renderer/
    │   ├── canvasRenderer.js # 메인 Canvas 렌더링
    │   ├── waveRenderer.js   # waveform 드로잉
    │   ├── paramRenderer.js  # parameter 값 표시
    │   └── eventRenderer.js  # 이벤트 목록
    ├── controls/
    │   ├── playback.js     # 재생/일시정지, 탐색, 속도
    │   └── fileLoader.js   # 로컬/원격 파일 로드
    ├── api/
    │   └── vitaldb.js      # VitalDB API 클라이언트
    └── utils/
        ├── time.js         # 시간 포맷팅
        └── binary.js       # 바이너리 읽기 유틸
```

### 핵심 컴포넌트

**파일 파싱 (`js/parser/vitalParser.js`)**: pako 라이브러리로 gzip 해제 후 바이너리 파싱
- `VITA` magic header signature
- Packet types: 9 (device info), 0 (track info), 1 (records)
- Track types: 1 (waveform), 2 (numeric), 5 (string)

**렌더링 (`js/renderer/`)**: Canvas 기반 ~60fps 렌더링
- Waveform은 0-255 범위로 사전 정규화 (`trackProcessor.js`)
- Wave Groups: waveform + 관련 parameter 페어링
- Parameter Layouts: ONE, TWO, LR, BP, VNT

**데이터 소스 (`js/controls/fileLoader.js`, `js/api/vitaldb.js`)**:
- 로컬 파일 드래그 앤 드롭
- URL 직접 입력
- Preset 서버 (VitalDB API 등)
- VitalDB Open Dataset 브라우저

## 실행 방법

브라우저에서 `index.html`을 열거나 로컬 서버 사용:
```bash
npx serve .
# 또는
python -m http.server 8000
```

## 데이터 파일

- `data/`: 테스트용 샘플 `.vital` 파일
- `docs/publications/`: VitalDB 포맷 연구 논문
- `docs/sample/vital_monitor.html`: 원본 참조 코드

## 주요 상수 (`js/constants.js`)

- `MONTYPES`: type code → parameter name 매핑 (1=ECG_WAV, 2=ECG_HR 등)
- `WAVE_GROUPS`: 12개 waveform 그룹 설정
- `PARAM_GROUPS`: 15개 non-wave parameter 그룹
- `PARAM_LAYOUTS`: 5가지 레이아웃 (ONE, TWO, LR, BP, VNT)

## 키보드 단축키

- Space: 재생/일시정지
- ←/→: 7초 이동
- Home/End: 처음/끝으로 이동
