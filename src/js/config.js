/**
 * VitalDB Viewer Configuration
 * Application settings and data sources
 */

// Auto-load configuration
export const AUTO_LOAD = {
  enabled: false,
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
