# VitalDB Viewer

`.vital` 파일을 위한 브라우저 기반 뷰어입니다. [VitalDB](https://vitaldb.net)에서 사용하는 의료 활력징후 데이터 포맷으로, ECG, 동맥압, plethysmograph 등의 실시간 waveform과 환자 모니터링 데이터를 시각화합니다.

## 주요 기능

- **Waveform 시각화**: ECG, ABP, PLETH 등 12개 waveform 그룹 지원
- **Parameter 표시**: HR, SpO2, ABP, 체온 등 15개 numeric parameter 그룹
- **다양한 데이터 소스**:
  - 로컬 파일 드래그 앤 드롭
  - VitalDB Open Dataset 브라우저
  - 로컬 데이터 폴더의 샘플 파일
- **재생 컨트롤**: 재생/일시정지, 탐색, 속도 조절 (x1~x8)
- **반응형 Canvas 렌더링**: ~60fps 부드러운 애니메이션

## 빠른 시작

### 설치

```bash
# 의존성 설치
bun install
# 또는
npm install
```

### 실행

```bash
# 개발 서버 실행
bun run dev
# 또는
npm run dev
```

또는 정적 서버로 직접 실행:

```bash
npx serve .
# 또는
python -m http.server 8000
```

브라우저에서 `http://localhost:5173` (Vite) 또는 해당 포트로 접속합니다.

## 사용법

1. **로컬 파일**: `.vital` 파일을 드래그 앤 드롭하거나 파일 선택
2. **VitalDB Dataset**: "Browse Dataset" 버튼으로 공개 데이터셋 탐색
3. **로컬 데이터**: `data/` 폴더의 샘플 파일 선택

## 키보드 단축키

| 키 | 동작 |
|---|---|
| `Space` | 재생/일시정지 |
| `←` / `→` | 7초 뒤로/앞으로 |
| `Home` | 처음으로 이동 |
| `End` | 끝으로 이동 |

## 프로젝트 구조

```
/
├── index.html              # 메인 HTML
├── css/monitor.css         # 의료기기 다크 테마 스타일
├── data/                   # 샘플 .vital 파일
└── js/
    ├── main.js             # 앱 진입점
    ├── config.js           # 서버 설정
    ├── constants.js        # 상수 정의 (MONTYPES, LAYOUTS 등)
    ├── state.js            # 반응형 상태 관리
    ├── parser/
    │   ├── vitalParser.js  # .vital 바이너리 파싱
    │   └── trackProcessor.js # waveform 정규화
    ├── renderer/
    │   ├── canvasRenderer.js # 메인 Canvas 렌더링
    │   ├── waveRenderer.js   # waveform 드로잉
    │   ├── paramRenderer.js  # parameter 값 표시
    │   └── eventRenderer.js  # 이벤트 목록
    ├── controls/
    │   ├── playback.js     # 재생 컨트롤
    │   └── fileLoader.js   # 파일 로드
    ├── api/
    │   └── vitaldb.js      # VitalDB API 클라이언트
    └── utils/
        ├── time.js         # 시간 포맷팅
        └── binary.js       # 바이너리 유틸
```

## 기술 스택

- **Frontend**: Vanilla JavaScript (ES Modules)
- **Styling**: Tailwind CSS
- **Rendering**: HTML5 Canvas
- **빌드**: Vite
- **압축 해제**: pako (gzip)

## .vital 파일 포맷

- `VITA` magic header signature
- Packet types: 9 (device info), 0 (track info), 1 (records)
- Track types: 1 (waveform), 2 (numeric), 5 (string)
- gzip 압축 지원

## 배포 (Nginx)

### 1. 프로덕션 빌드

```bash
bun run build
# 또는
npm run build
```

`dist/` 폴더에 최적화된 정적 파일이 생성됩니다.

### 2. Nginx 설치

```bash
# Ubuntu/Debian
sudo apt update && sudo apt install nginx

# CentOS/RHEL
sudo yum install nginx

# macOS
brew install nginx
```

### 3. Nginx 설정

`/etc/nginx/sites-available/vitaldb-viewer` 파일 생성:

```nginx
server {
    listen 80;
    server_name your-domain.com;  # 도메인 또는 IP

    root /var/www/vitaldb-viewer;
    index index.html;

    # Gzip 압축
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # 정적 파일 캐싱
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA 라우팅 (필요시)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # .vital 파일 MIME 타입
    location ~* \.vital$ {
        types { application/octet-stream vital; }
        add_header Content-Disposition "attachment";
    }
}
```

### 4. 배포

```bash
# 빌드 파일 복사
sudo mkdir -p /var/www/vitaldb-viewer
sudo cp -r dist/* /var/www/vitaldb-viewer/

# 샘플 데이터 복사 (선택사항)
sudo cp -r data /var/www/vitaldb-viewer/

# 설정 활성화
sudo ln -s /etc/nginx/sites-available/vitaldb-viewer /etc/nginx/sites-enabled/

# 설정 테스트 및 재시작
sudo nginx -t
sudo systemctl restart nginx
```

### 5. HTTPS 설정 (Let's Encrypt)

```bash
# Certbot 설치
sudo apt install certbot python3-certbot-nginx

# SSL 인증서 발급 및 자동 설정
sudo certbot --nginx -d your-domain.com

# 자동 갱신 테스트
sudo certbot renew --dry-run
```

### 배포 스크립트 예시

```bash
#!/bin/bash
# deploy.sh

set -e

echo "Building..."
bun run build

echo "Deploying to server..."
rsync -avz --delete dist/ user@server:/var/www/vitaldb-viewer/

echo "Done!"
```

## 라이선스

MIT License
