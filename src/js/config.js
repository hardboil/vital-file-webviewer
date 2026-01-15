/**
 * VitalDB Viewer Configuration
 * Application settings and data sources
 */

// Local data files configuration
export const LOCAL_DATA_FILES = [
  { id: 'sample_01', filename: 'sample_01.vital', label: 'Sample 01' },
  { id: 'sample_02', filename: 'sample_02.vital', label: 'Sample 02' },
  { id: 'sample_03', filename: 'sample_03.vital', label: 'Sample 03' },
  { id: 'opendata', filename: 'opendata.vital', label: 'Open Data' }
];

// Local data path (relative to index.html)
export const LOCAL_DATA_PATH = './data/';

// Auto-load configuration
export const AUTO_LOAD = {
  enabled: false,
  source: 'vitaldb', // 'vitaldb' or 'local'
  localFileIndex: 0,
  autoPlay: false
};

// Playback settings
export const PLAYBACK = {
  speeds: [1, 2, 4, 8],
  defaultSpeed: 1,
  seekStep: 7, // seconds
  frameRate: 60
};

// Canvas rendering settings
export const CANVAS = {
  // Monitor View
  sweepSeconds: 7,
  pixelsPerSecond: 100,

  // Track View
  trackHeight: 80,
  trackGap: 4,
  minZoom: 0.1,
  maxZoom: 10,
  defaultTimeWindow: 30 // seconds
};

// Keyboard shortcuts
export const SHORTCUTS = {
  playPause: ' ',
  seekBackward: 'ArrowLeft',
  seekForward: 'ArrowRight',
  goToStart: 'Home',
  goToEnd: 'End',
  toggleSidebar: 's',
  toggleViewMode: 'v',
  toggleTrackFilter: 'f',
  addMarker: 'm',
  zoomIn: '+',
  zoomOut: '-',
  resetZoom: '0',
  screenshot: 'ctrl+s',
  export: 'ctrl+e',
  speed1: '1',
  speed2: '2',
  speed4: '4',
  speed8: '8'
};

// UI settings
export const UI = {
  sidebarWidth: 256,
  toastDuration: 3000,
  minimapHeight: 64
};

// VitalDB API settings
export const VITALDB = {
  apiBase: 'https://api.vitaldb.net',
  downloadBase: 'https://api.vitaldb.net'
};
