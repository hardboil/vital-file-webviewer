# VitalDB Viewer

[![License: CC BY-NC-SA 4.0](https://img.shields.io/badge/License-CC%20BY--NC--SA%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-nc-sa/4.0/)

[VitalDB](https://vitaldb.net)에서 사용하는 의료 활력징후 데이터 포맷인 `.vital` 파일을 위한 브라우저 기반 뷰어입니다. ECG, 동맥압, plethysmograph 등의 실시간 waveform과 환자 모니터링 데이터를 의료기기 스타일의 다크 테마로 시각화합니다.

> **원본 프로젝트**: [vitaldb/vitalfile_webviewer](https://github.com/vitaldb/vitalfile_webviewer) - VitalDB 공식 웹 뷰어

[English README](README.md)

## 주요 기능

### Waveform 시각화
- **12개 Waveform 그룹**: ECG, ART, PLETH, CVP, EEG, RESP, CO2 등
- **15개 Parameter 그룹**: HR, SpO2, ABP, 체온 등 numeric parameter
- **~60fps Canvas 렌더링**: 부드러운 실시간 애니메이션

### 듀얼 뷰 모드
| 모드 | 용도 | 특징 |
|------|------|------|
| **Monitor View** | 실시간 파라미터 모니터링 | 현재 시점 기준 sweep, Wave Groups + Params |
| **Track View** | 전체 시계열 탐색 | 줌/패닝, 범위 선택 |

### 데이터 소스
- **로컬 파일**: 드래그 앤 드롭 또는 파일 선택
- **VitalDB Open Dataset**: 6,000개 이상의 수술 케이스를 고급 필터로 탐색

### 고급 기능
- **미니맵**: 전체 녹화 개요, 클릭/드래그로 빠른 탐색
- **마커**: 특정 시점에 북마크 추가
- **시간 범위 선택**: Shift+드래그로 구간 선택
- **내보내기**: PNG 스크린샷 및 CSV 데이터 내보내기

## 빠른 시작

### 설치

```bash
cd src

# bun 사용 (권장)
bun install

# 또는 npm 사용
npm install
```

### 개발 서버 실행

```bash
# bun 사용
bun run dev

# 또는 npm 사용
npm run dev
```

브라우저에서 `http://localhost:5173`으로 접속합니다.

### 프로덕션 빌드

```bash
bun run build
# 또는
npm run build
```

## 사용법

1. **로컬 파일**: `.vital` 파일을 드래그 앤 드롭하거나 "Browse" 클릭
2. **VitalDB Dataset**: "Browse Dataset" 버튼으로 공개 데이터셋 탐색

### VitalDB Dataset 필터
- 부서 (Department)
- Case ID / 수술명 검색
- 나이 범위 (Dual-thumb 슬라이더)
- 성별 (M/F)
- ASA 등급 (1-5)

## 키보드 단축키

### 기본
| 키 | 동작 |
|----|------|
| `Space` | 재생/일시정지 |
| `←` / `→` | 7초 뒤로/앞으로 |
| `Home` / `End` | 처음/끝으로 이동 |

### 확장
| 키 | 동작 |
|----|------|
| `V` | 뷰 모드 전환 (Monitor ↔ Track) |
| `S` | 사이드바 토글 |
| `F` | 트랙 필터 토글 |
| `M` | 현재 위치에 마커 추가 |
| `+` / `-` | 시간축 확대/축소 |
| `0` | 확대 레벨 초기화 |
| `1-8` | 재생 속도 변경 (x1~x8) |
| `Ctrl+S` | 스크린샷 저장 (PNG) |
| `Ctrl+E` | CSV 내보내기 |

## 프로젝트 구조

```
/
├── src/                        # 메인 개발 디렉토리 (v0.2.0)
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── js/
│   │   ├── main.js             # 앱 진입점
│   │   ├── parser/             # .vital 바이너리 파싱
│   │   ├── renderer/           # Canvas 렌더링
│   │   ├── controls/           # 재생, 파일 로드, 트랙 뷰
│   │   ├── ui/                 # 사이드바, 토스트 알림
│   │   ├── export/             # 스크린샷, CSV 내보내기
│   │   └── api/                # VitalDB API 클라이언트
│   └── css/
├── Makefile                    # 빌드 명령어
├── README.md / README.ko.md    # 문서 (영어/한국어)
└── LICENSE
```

## 기술 스택

- **Frontend**: Vanilla JavaScript (ES Modules)
- **Styling**: Tailwind CSS (로컬 빌드)
- **Rendering**: HTML5 Canvas (~60fps)
- **Build**: Vite
- **압축 해제**: pako (gzip)

## .vital 파일 포맷

- `VITA` magic header signature
- Packet types: 9 (device info), 0 (track info), 1 (records)
- Track types: 1 (waveform), 2 (numeric), 5 (string)
- gzip 압축 지원

## 배포

### 옵션 1: 단일 HTML 파일 (서버 불필요)

브라우저에서 직접 열 수 있는 단일 HTML 파일로 빌드:

```bash
make standalone
# 또는
cd src && bun run build:standalone
```

출력: `src/dist/vitaldb-viewer.html`

**사용 방법:**
- 파일을 더블클릭하여 브라우저에서 열기
- 이메일, USB, 파일 호스팅으로 공유 가능
- 웹 서버 불필요

### 옵션 2: 표준 빌드 (웹 서버)

캐싱과 코드 분할로 최적의 성능:

```bash
make build
# 또는
cd src && bun run build
```

출력: `src/dist/` 디렉토리

### Nginx 설정

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /var/www/vitaldb-viewer;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.vital$ {
        types { application/octet-stream vital; }
        add_header Content-Disposition "attachment";
    }
}
```

### 3. 배포

```bash
sudo mkdir -p /var/www/vitaldb-viewer
sudo cp -r src/dist/* /var/www/vitaldb-viewer/
sudo nginx -t && sudo systemctl restart nginx
```

### 4. HTTPS (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## 브라우저 지원

- Chrome (최신)
- Firefox (최신)
- Safari (최신)
- Edge (최신)

## 라이선스

이 프로젝트는 **크리에이티브 커먼즈 저작자표시-비영리-동일조건변경허락 4.0 국제 라이선스 (CC BY-NC-SA 4.0)**를 따릅니다.

[![CC BY-NC-SA 4.0](https://licensebuttons.net/l/by-nc-sa/4.0/88x31.png)](https://creativecommons.org/licenses/by-nc-sa/4.0/)

### 요약
- **저작자표시**: 적절한 출처를 표시해야 합니다
- **비영리**: 영리 목적으로 사용할 수 없습니다
- **동일조건변경허락**: 이 저작물을 리믹스, 변형하거나 2차 저작물을 작성할 경우 동일한 라이선스로 배포해야 합니다

전체 라이선스: https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode.ko
