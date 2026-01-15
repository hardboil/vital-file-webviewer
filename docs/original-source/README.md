# Vital File Web Viewer

## Overview
A lightweight, browser-based tool for visualizing `.vital` files containing high-resolution vital signs data. Runs entirely client-side with no installation or server requirements.

## Features
- No installation required
- Drag-and-drop or file selection for `.vital` files
- Track View and Monitor View modes
- Playback controls (speed, pause, scrub)
- Multi-file loading
- Responsive design for desktop and mobile
- High performance for large files

## Software Description
Vital File Web Viewer is a lightweight, browser-based tool designed to visualize `.vital` files — a binary file format commonly used for storing high-resolution vital signs data in operating rooms and intensive care units. The software allows users to open `.vital` files directly in their web browser without installing any additional software or requiring server-side components.

Users can load files via drag-and-drop or file selection and switch between two display modes: **Track View**, which shows all recorded signals as time-series plots, and **Monitor View**, which simulates the layout of a clinical patient monitor with waveform playback controls. Features include multi-file handling, timeline scrubbing, adjustable playback speeds, and responsive design for various devices.

The viewer is implemented entirely in HTML5, JavaScript, and CSS3, using the [Pako library](https://github.com/nodeca/pako) for decompression and HTML5 Canvas for rendering. It supports all modern web browsers and is optimized for performance on large files through asynchronous processing and memory-efficient design.

## Technical Implementation
The application is implemented entirely using client-side technologies: **HTML5**, **JavaScript (ES6+)**, and **CSS3**. Visualization is performed through **HTML5 Canvas**, while `.vital` files are decompressed using the [Pako library](https://github.com/nodeca/pako). File parsing, rendering, and user interaction are handled asynchronously to ensure responsiveness.

The viewer supports two visualization modes — **Track View** and **Monitor View** — and allows users to interact with data through timeline scrubbing, zoom, and playback controls.

## Installation and Requirements
No installation is required. The Vital File Web Viewer is a lightweight, browser-based tool designed to run entirely in modern web browsers.

### ✅ Supported Browsers
- Google Chrome (latest)
- Mozilla Firefox (latest)
- Safari (latest)
- Microsoft Edge (latest)

### 🚀 How to Use
1. Download or clone the repository.
2. Open `vitalfile_webviewer.html` in any supported browser.
3. Load `.vital` files via:
   - Drag-and-drop, or  
   - File selection dialog

## License
This project is licensed under the **Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License**.  
See [LICENSE](./LICENSE) for details.
