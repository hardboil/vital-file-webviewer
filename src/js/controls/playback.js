/**
 * Playback Controls
 * Handles play/pause, seek, and speed control
 */

import { getState, setState, get, addMarker } from '../state.js';
import { PLAYBACK, SHORTCUTS } from '../config.js';
import { VIEW_MODES } from '../constants.js';

/**
 * Playback Controller class
 */
export class PlaybackController {
  constructor() {
    this.animationId = null;
    this.lastFrameTime = 0;
    this.onFrame = null;
  }

  /**
   * Set frame callback
   * @param {Function} callback - Called each animation frame
   */
  setOnFrame(callback) {
    this.onFrame = callback;
  }

  /**
   * Toggle play/pause
   */
  togglePlay() {
    const isPlaying = !get('isPlaying');
    setState({ isPlaying });

    if (isPlaying) {
      this.startAnimation();
    } else {
      this.stopAnimation();
    }
  }

  /**
   * Play
   */
  play() {
    if (!get('isPlaying')) {
      setState({ isPlaying: true });
      this.startAnimation();
    }
  }

  /**
   * Pause
   */
  pause() {
    if (get('isPlaying')) {
      setState({ isPlaying: false });
      this.stopAnimation();
    }
  }

  /**
   * Seek to specific time
   * @param {number} time - Time in seconds
   */
  seekTo(time) {
    const duration = get('duration');
    const clampedTime = Math.max(0, Math.min(duration, time));
    setState({ currentTime: clampedTime });
  }

  /**
   * Seek relative to current time
   * @param {number} delta - Time delta in seconds
   */
  seekRelative(delta) {
    const currentTime = get('currentTime');
    this.seekTo(currentTime + delta);
  }

  /**
   * Go to start
   */
  goToStart() {
    this.seekTo(0);
  }

  /**
   * Go to end
   */
  goToEnd() {
    const duration = get('duration');
    this.seekTo(duration);
  }

  /**
   * Seek backward by step
   */
  seekBackward() {
    this.seekRelative(-PLAYBACK.seekStep);
  }

  /**
   * Seek forward by step
   */
  seekForward() {
    this.seekRelative(PLAYBACK.seekStep);
  }

  /**
   * Set playback speed
   * @param {number} speed - Speed multiplier
   */
  setSpeed(speed) {
    if (PLAYBACK.speeds.includes(speed)) {
      setState({ playSpeed: speed });
    }
  }

  /**
   * Start animation loop
   */
  startAnimation() {
    this.lastFrameTime = performance.now();
    this.animate();
  }

  /**
   * Stop animation loop
   */
  stopAnimation() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * Animation frame
   */
  animate = (timestamp = performance.now()) => {
    this.animationId = requestAnimationFrame(this.animate);

    const delta = (timestamp - this.lastFrameTime) / 1000;
    this.lastFrameTime = timestamp;

    const state = getState();

    if (state.isPlaying && state.currentTime < state.duration) {
      let newTime = state.currentTime + delta * state.playSpeed;
      if (newTime > state.duration) {
        newTime = state.duration;
        setState({ currentTime: newTime, isPlaying: false });
        this.stopAnimation();
      } else {
        setState({ currentTime: newTime });
      }
    }

    if (this.onFrame) {
      this.onFrame(get('currentTime'));
    }
  };

  /**
   * Setup keyboard shortcuts
   * @param {Object} options - Callbacks for sidebar/view toggle
   */
  setupKeyboardShortcuts(options = {}) {
    const {
      onToggleSidebar,
      onToggleViewMode,
      onToggleTrackFilter,
      onScreenshot,
      onExport
    } = options;

    document.addEventListener('keydown', (e) => {
      // Ignore if typing in input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
        return;
      }

      // Handle Ctrl combinations
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 's':
            e.preventDefault();
            onScreenshot?.();
            return;
          case 'e':
            e.preventDefault();
            onExport?.();
            return;
        }
      }

      switch (e.key) {
        case SHORTCUTS.playPause:
          e.preventDefault();
          this.togglePlay();
          break;
        case SHORTCUTS.seekBackward:
          e.preventDefault();
          this.seekBackward();
          break;
        case SHORTCUTS.seekForward:
          e.preventDefault();
          this.seekForward();
          break;
        case SHORTCUTS.goToStart:
          e.preventDefault();
          this.goToStart();
          break;
        case SHORTCUTS.goToEnd:
          e.preventDefault();
          this.goToEnd();
          break;
        case SHORTCUTS.toggleSidebar:
        case SHORTCUTS.toggleSidebar.toUpperCase():
          e.preventDefault();
          onToggleSidebar?.();
          break;
        case SHORTCUTS.toggleViewMode:
        case SHORTCUTS.toggleViewMode.toUpperCase():
          e.preventDefault();
          onToggleViewMode?.();
          break;
        case SHORTCUTS.toggleTrackFilter:
        case SHORTCUTS.toggleTrackFilter.toUpperCase():
          e.preventDefault();
          onToggleTrackFilter?.();
          break;
        case SHORTCUTS.addMarker:
        case SHORTCUTS.addMarker.toUpperCase():
          e.preventDefault();
          addMarker();
          break;
        case SHORTCUTS.zoomIn:
        case '=':
          e.preventDefault();
          this.zoomIn?.();
          break;
        case SHORTCUTS.zoomOut:
        case '_':
          e.preventDefault();
          this.zoomOut?.();
          break;
        case SHORTCUTS.resetZoom:
          e.preventDefault();
          this.resetZoom?.();
          break;
        // Speed shortcuts
        case '1':
          this.setSpeed(1);
          break;
        case '2':
          this.setSpeed(2);
          break;
        case '4':
          this.setSpeed(4);
          break;
        case '8':
          this.setSpeed(8);
          break;
      }
    });
  }
}
