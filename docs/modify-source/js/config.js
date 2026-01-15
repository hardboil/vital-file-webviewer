/**
 * VitalDB Viewer Configuration
 * Application settings and data sources
 */

// Local data files configuration
export const LOCAL_DATA_FILES = [
  {
    id: "sicu",
    filename: "SICU_16_PiVR_250507_170000.vital",
    label: "SICU Case",
  },
  { id: "opendata", filename: "opendata.vital", label: "Open Data" },
  { id: "sample_01", filename: "sample_01.vital", label: "Sample 01" },
  { id: "sample_02", filename: "sample_02.vital", label: "Sample 02" },
  { id: "sample_03", filename: "sample_03.vital", label: "Sample 03" },
  { id: "sample_04", filename: "sample_04.vital", label: "Sample 04" },
  { id: "sample_05", filename: "sample_05.vital", label: "Sample 05" },
  { id: "sample_06", filename: "sample_06.vital", label: "Sample 06" },
  { id: "sample_07", filename: "sample_07.vital", label: "Sample 07" },
  { id: "sample_08", filename: "sample_08.vital", label: "Sample 08" },
  { id: "sample_09", filename: "sample_09.vital", label: "Sample 09" },
  { id: "sample_10", filename: "sample_10.vital", label: "Sample 10" },
];

// Local data path (relative to index.html)
export const LOCAL_DATA_PATH = "./data/";

// Auto-load configuration
export const AUTO_LOAD = {
  enabled: true, // Enable/disable auto-loading on page load
  source: "vitaldb", // 'vitaldb' for random VitalDB case, 'local' for local file
  localFileIndex: 0, // If source='local', which file index to load (0-based)
  autoPlay: true, // Auto-start playback after loading
};

// Playback settings
export const PLAYBACK = {
  speeds: [1, 2, 4, 8],
  defaultSpeed: 1,
  seekStep: 7, // seconds
};

// Canvas rendering settings
export const CANVAS = {
  pixelsPerSecond: 100,
  titleHeight: 50,
  controlsHeight: 100,
};

// Keyboard shortcuts
export const SHORTCUTS = {
  playPause: " ", // Space
  seekBackward: "ArrowLeft",
  seekForward: "ArrowRight",
  goToStart: "Home",
  goToEnd: "End",
};
