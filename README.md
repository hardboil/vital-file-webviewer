# VitalDB Viewer

[![License: CC BY-NC-SA 4.0](https://img.shields.io/badge/License-CC%20BY--NC--SA%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-nc-sa/4.0/)

A browser-based viewer for `.vital` files - the medical vital signs data format used by [VitalDB](https://vitaldb.net). Visualize real-time waveforms (ECG, arterial blood pressure, plethysmograph) and patient monitoring data with a professional medical device-style dark theme.

> **Based on**: [vitaldb/vitalfile_webviewer](https://github.com/vitaldb/vitalfile_webviewer) - Original VitalDB web viewer

[한국어 README](README.ko.md)

## Features

### Waveform Visualization
- **12 Waveform Groups**: ECG, ART, PLETH, CVP, EEG, RESP, CO2, and more
- **15 Parameter Groups**: HR, SpO2, ABP, temperature, and other numeric parameters
- **~60fps Canvas Rendering**: Smooth, real-time animation

### Dual View Modes
| Mode | Purpose | Features |
|------|---------|----------|
| **Monitor View** | Real-time parameter monitoring | Sweep display, Wave Groups + Params |
| **Track View** | Full timeline exploration | Zoom/Pan, Range selection |

### Data Sources
- **Local File**: Drag & drop or file browser
- **VitalDB Open Dataset**: Browse 6,000+ surgical cases with advanced filters

### Advanced Features
- **Minimap**: Overview of entire recording with click/drag navigation
- **Markers**: Add bookmarks at specific timestamps
- **Time Range Selection**: Shift+drag to select time ranges
- **Export**: PNG screenshots and CSV data export

## Quick Start

### Installation

```bash
cd src

# Using bun (recommended)
bun install

# Or using npm
npm install
```

### Development Server

```bash
# Using bun
bun run dev

# Or using npm
npm run dev
```

Open `http://localhost:5173` in your browser.

### Production Build

```bash
bun run build
# or
npm run build
```

## Usage

1. **Local File**: Drag & drop a `.vital` file or click "Browse"
2. **VitalDB Dataset**: Click "Browse Dataset" to explore the open dataset

### VitalDB Dataset Filters
- Department
- Case ID / Operation name search
- Age range (dual-thumb slider)
- Sex (M/F)
- ASA classification (1-5)

## Keyboard Shortcuts

### Basic
| Key | Action |
|-----|--------|
| `Space` | Play/Pause |
| `←` / `→` | Skip 7 seconds |
| `Home` / `End` | Jump to start/end |

### Extended
| Key | Action |
|-----|--------|
| `V` | Toggle View Mode (Monitor ↔ Track) |
| `S` | Toggle Sidebar |
| `F` | Toggle Track Filter |
| `M` | Add marker at current position |
| `+` / `-` | Zoom in/out timeline |
| `0` | Reset zoom level |
| `1-8` | Set playback speed (x1~x8) |
| `Ctrl+S` | Save screenshot (PNG) |
| `Ctrl+E` | Export CSV |

## Project Structure

```
/
├── src/                        # Main development directory (v0.2.0)
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── js/
│   │   ├── main.js             # App entry point
│   │   ├── parser/             # .vital binary parsing
│   │   ├── renderer/           # Canvas rendering
│   │   ├── controls/           # Playback, file loading, track view
│   │   ├── ui/                 # Sidebar, toast notifications
│   │   ├── export/             # Screenshot, CSV export
│   │   └── api/                # VitalDB API client
│   └── css/
├── Makefile                    # Build commands
├── README.md / README.ko.md    # Documentation (EN/KO)
└── LICENSE
```

## Tech Stack

- **Frontend**: Vanilla JavaScript (ES Modules)
- **Styling**: Tailwind CSS (local build)
- **Rendering**: HTML5 Canvas (~60fps)
- **Build**: Vite
- **Decompression**: pako (gzip)

## .vital File Format

- `VITA` magic header signature
- Packet types: 9 (device info), 0 (track info), 1 (records)
- Track types: 1 (waveform), 2 (numeric), 5 (string)
- gzip compression support

## Deployment

### Option 1: Standalone HTML (No Server Required)

Build a single HTML file that can be opened directly in any browser:

```bash
make standalone
# or
cd src && bun run build:standalone
```

Output: `src/dist/vitaldb-viewer.html`

**Usage:**
- Double-click the file to open in browser
- Share via email, USB drive, or file hosting
- No web server needed

### Option 2: Standard Build (Web Server)

For best performance with caching and code splitting:

```bash
make build
# or
cd src && bun run build
```

Output: `src/dist/` directory

### Nginx Configuration

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

### 3. Deploy

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

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

This project is licensed under the **Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License (CC BY-NC-SA 4.0)**.

[![CC BY-NC-SA 4.0](https://licensebuttons.net/l/by-nc-sa/4.0/88x31.png)](https://creativecommons.org/licenses/by-nc-sa/4.0/)

### Summary
- **Attribution**: You must give appropriate credit
- **NonCommercial**: You may not use the material for commercial purposes
- **ShareAlike**: If you remix, transform, or build upon the material, you must distribute your contributions under the same license

Full license text: https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode
