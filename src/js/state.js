/**
 * Application State Management
 * Simple pub/sub pattern for reactive state
 */

import { VIEW_MODES, TRACK_DISPLAY_MODES } from './constants.js';

// Initial state
const state = {
  // File state
  vitalFile: null,
  filename: '',

  // Playback state
  isPlaying: false,
  playSpeed: 1,
  currentTime: 0,
  duration: 0,

  // Loading state
  isLoading: false,
  loadingProgress: 0,
  loadingText: 'Loading...',

  // View mode
  viewMode: VIEW_MODES.MONITOR,
  trackDisplayMode: TRACK_DISPLAY_MODES.FIXED,

  // UI state
  sidebarCollapsed: false,
  patientInfoExpanded: false,

  // Track View state
  zoomLevel: 1,
  panOffset: 0,
  timeWindow: 30, // seconds visible in track view
  selectedTimeRange: null, // { start, end }

  // Track filter state
  visibleTracks: {}, // { trackName: boolean }
  trackOrder: [], // Custom track ordering (group names)

  // Patient info (from VitalDB)
  patientInfo: null,

  // Markers
  markers: [],

  // Available tracks (populated after file load)
  availableTracks: []
};

// Listeners for state changes
const listeners = new Set();

/**
 * Get current state (read-only copy)
 * @returns {Object}
 */
export function getState() {
  return { ...state };
}

/**
 * Get specific state value
 * @param {string} key - State key
 * @returns {*}
 */
export function get(key) {
  return state[key];
}

/**
 * Update state
 * @param {Object} updates - Partial state updates
 */
export function setState(updates) {
  const changed = {};
  let hasChanges = false;

  for (const key in updates) {
    if (state[key] !== updates[key]) {
      changed[key] = { old: state[key], new: updates[key] };
      state[key] = updates[key];
      hasChanges = true;
    }
  }

  if (hasChanges) {
    notifyListeners(changed);
  }
}

/**
 * Subscribe to state changes
 * @param {Function} callback - Called with (changed, state)
 * @returns {Function} - Unsubscribe function
 */
export function subscribe(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

/**
 * Notify all listeners of state changes
 */
function notifyListeners(changed) {
  for (const callback of listeners) {
    try {
      callback(changed, state);
    } catch (e) {
      console.error('State listener error:', e);
    }
  }
}

/**
 * Reset state to initial values
 */
export function resetState() {
  setState({
    vitalFile: null,
    filename: '',
    isPlaying: false,
    playSpeed: 1,
    currentTime: 0,
    duration: 0,
    isLoading: false,
    loadingProgress: 0,
    loadingText: 'Loading...',
    patientInfo: null,
    zoomLevel: 1,
    panOffset: 0,
    selectedTimeRange: null,
    visibleTracks: {},
    trackOrder: [],
    markers: [],
    availableTracks: []
  });
}

/**
 * Set track order
 * @param {string[]} order - Array of track names in order
 */
export function setTrackOrder(order) {
  setState({ trackOrder: [...order] });
}

/**
 * Move track to new position
 * @param {string} trackName - Track to move
 * @param {number} newIndex - New position index
 */
export function moveTrack(trackName, newIndex) {
  const order = [...state.trackOrder];
  const currentIndex = order.indexOf(trackName);
  if (currentIndex === -1) return;

  order.splice(currentIndex, 1);
  order.splice(newIndex, 0, trackName);
  setState({ trackOrder: order });
}

/**
 * Toggle a specific track visibility
 * @param {string} trackName
 */
export function toggleTrackVisibility(trackName) {
  const visibleTracks = { ...state.visibleTracks };
  // Handle undefined case: default is visible (true)
  const currentValue = visibleTracks[trackName] !== false;
  visibleTracks[trackName] = !currentValue;
  setState({ visibleTracks });
}

/**
 * Set all tracks visible/hidden
 * @param {boolean} visible
 */
export function setAllTracksVisibility(visible) {
  const visibleTracks = {};
  for (const track of state.availableTracks) {
    visibleTracks[track.name] = visible;
  }
  setState({ visibleTracks });
}

/**
 * Add a marker at current time
 * @param {string} label - Optional label
 */
export function addMarker(label = '') {
  const markers = [...state.markers];
  markers.push({
    id: Date.now(),
    time: state.currentTime,
    label: label || `Marker ${markers.length + 1}`
  });
  markers.sort((a, b) => a.time - b.time);
  setState({ markers });
}

/**
 * Remove a marker by id
 * @param {number} id
 */
export function removeMarker(id) {
  const markers = state.markers.filter(m => m.id !== id);
  setState({ markers });
}

/**
 * Set selected time range
 * @param {number} start
 * @param {number} end
 */
export function setTimeRange(start, end) {
  setState({
    selectedTimeRange: start !== null && end !== null
      ? { start: Math.min(start, end), end: Math.max(start, end) }
      : null
  });
}
