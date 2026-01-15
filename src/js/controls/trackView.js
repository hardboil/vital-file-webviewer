/**
 * Track View Mouse Interaction Controller
 * Handles zoom, pan, click-to-seek, and range selection
 */

import { get, setState, setTimeRange } from '../state.js';
import { VIEW_MODES } from '../constants.js';

const ZOOM_LIMITS = {
  min: 0.1,  // 10x zoom out (see more time)
  max: 50    // 50x zoom in (see less time)
};

const ZOOM_STEP = 1.2; // 20% per wheel tick

/**
 * Setup Track View mouse interactions
 * @param {HTMLCanvasElement} canvas
 * @param {Object} options
 */
export function setupTrackViewInteraction(canvas, options = {}) {
  const { onSeek, onRedraw } = options;

  let isDragging = false;
  let isSelecting = false;
  let dragStartX = 0;
  let dragStartTime = 0;
  let selectionStartTime = null;

  /**
   * Get time at X coordinate
   */
  function getTimeAtX(x) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = x - rect.left;

    const margin = { left: 60, right: 20 };
    const availableWidth = canvas.width - margin.left - margin.right;

    if (mouseX < margin.left || mouseX > canvas.width - margin.right) {
      return null;
    }

    const duration = get('duration');
    const zoomLevel = get('zoomLevel');
    const timeWindow = get('timeWindow') / zoomLevel;
    const currentTime = get('currentTime');

    let startTime = Math.max(0, currentTime - timeWindow / 2);
    let endTime = Math.min(duration, startTime + timeWindow);

    if (endTime === duration) {
      startTime = Math.max(0, endTime - timeWindow);
    }

    const ratio = (mouseX - margin.left) / availableWidth;
    return startTime + ratio * (endTime - startTime);
  }

  /**
   * Handle mouse wheel for zoom
   */
  function handleWheel(e) {
    if (get('viewMode') !== VIEW_MODES.TRACK) return;
    if (!get('vitalFile')) return;

    e.preventDefault();

    const currentZoom = get('zoomLevel');
    let newZoom;

    if (e.deltaY < 0) {
      // Zoom in
      newZoom = Math.min(ZOOM_LIMITS.max, currentZoom * ZOOM_STEP);
    } else {
      // Zoom out
      newZoom = Math.max(ZOOM_LIMITS.min, currentZoom / ZOOM_STEP);
    }

    if (newZoom !== currentZoom) {
      // Get time at mouse position before zoom
      const timeAtMouse = getTimeAtX(e.clientX);

      setState({ zoomLevel: newZoom });

      // Adjust currentTime to keep mouse position at same time
      if (timeAtMouse !== null && onSeek) {
        // This keeps the time under cursor stable during zoom
        const duration = get('duration');
        const timeWindow = get('timeWindow') / newZoom;
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const margin = { left: 60, right: 20 };
        const availableWidth = canvas.width - margin.left - margin.right;
        const ratio = (mouseX - margin.left) / availableWidth;

        // Calculate new currentTime to keep timeAtMouse at same screen position
        const halfWindow = timeWindow / 2;
        const offsetFromCenter = ratio - 0.5;
        let newCurrentTime = timeAtMouse - offsetFromCenter * timeWindow;
        newCurrentTime = Math.max(halfWindow, Math.min(duration - halfWindow, newCurrentTime));

        onSeek(newCurrentTime);
      }

      onRedraw?.();
    }
  }

  /**
   * Handle mouse down for drag/selection
   */
  function handleMouseDown(e) {
    if (get('viewMode') !== VIEW_MODES.TRACK) return;
    if (!get('vitalFile')) return;

    const time = getTimeAtX(e.clientX);
    if (time === null) return;

    if (e.shiftKey) {
      // Start range selection
      isSelecting = true;
      selectionStartTime = time;
      setTimeRange(time, time);
    } else {
      // Start panning
      isDragging = true;
      dragStartX = e.clientX;
      dragStartTime = get('currentTime');
      canvas.style.cursor = 'grabbing';
    }
  }

  /**
   * Handle mouse move for drag/selection
   */
  function handleMouseMove(e) {
    if (get('viewMode') !== VIEW_MODES.TRACK) return;

    if (isDragging) {
      const dx = e.clientX - dragStartX;
      const rect = canvas.getBoundingClientRect();
      const margin = { left: 60, right: 20 };
      const availableWidth = canvas.width - margin.left - margin.right;

      const duration = get('duration');
      const zoomLevel = get('zoomLevel');
      const timeWindow = get('timeWindow') / zoomLevel;

      // Convert pixel delta to time delta
      const timeDelta = (dx / availableWidth) * timeWindow;
      let newTime = dragStartTime - timeDelta;

      // Clamp to valid range
      const halfWindow = timeWindow / 2;
      newTime = Math.max(halfWindow, Math.min(duration - halfWindow, newTime));

      if (onSeek) {
        onSeek(newTime);
      }
    } else if (isSelecting) {
      const time = getTimeAtX(e.clientX);
      if (time !== null && selectionStartTime !== null) {
        setTimeRange(selectionStartTime, time);
        onRedraw?.();
      }
    } else {
      // Update cursor based on position
      const time = getTimeAtX(e.clientX);
      canvas.style.cursor = time !== null ? 'grab' : 'default';
    }
  }

  /**
   * Handle mouse up
   */
  function handleMouseUp(e) {
    if (isDragging) {
      isDragging = false;
      canvas.style.cursor = 'grab';
    }

    if (isSelecting) {
      isSelecting = false;
      // Keep selection if it has meaningful range
      const range = get('selectedTimeRange');
      if (range && Math.abs(range.end - range.start) < 0.5) {
        // Too small selection, treat as click
        setTimeRange(null, null);
        const time = getTimeAtX(e.clientX);
        if (time !== null && onSeek) {
          onSeek(time);
        }
      }
    }

    selectionStartTime = null;
  }

  /**
   * Handle click for seek
   */
  function handleClick(e) {
    if (get('viewMode') !== VIEW_MODES.TRACK) return;
    if (isDragging || isSelecting) return;
    if (!get('vitalFile')) return;

    // Only seek on simple click (not after drag)
    if (Math.abs(e.clientX - dragStartX) > 5) return;

    const time = getTimeAtX(e.clientX);
    if (time !== null && onSeek) {
      onSeek(time);
    }
  }

  /**
   * Handle double click for zoom reset
   */
  function handleDoubleClick(e) {
    if (get('viewMode') !== VIEW_MODES.TRACK) return;
    if (!get('vitalFile')) return;

    // Reset zoom to 1x
    setState({ zoomLevel: 1 });
    setTimeRange(null, null);
    onRedraw?.();
  }

  /**
   * Handle mouse leave
   */
  function handleMouseLeave() {
    if (isDragging) {
      isDragging = false;
      canvas.style.cursor = 'default';
    }
    if (isSelecting) {
      isSelecting = false;
      selectionStartTime = null;
    }
  }

  // Attach event listeners
  canvas.addEventListener('wheel', handleWheel, { passive: false });
  canvas.addEventListener('mousedown', handleMouseDown);
  canvas.addEventListener('mousemove', handleMouseMove);
  canvas.addEventListener('mouseup', handleMouseUp);
  canvas.addEventListener('click', handleClick);
  canvas.addEventListener('dblclick', handleDoubleClick);
  canvas.addEventListener('mouseleave', handleMouseLeave);

  // Return cleanup function
  return () => {
    canvas.removeEventListener('wheel', handleWheel);
    canvas.removeEventListener('mousedown', handleMouseDown);
    canvas.removeEventListener('mousemove', handleMouseMove);
    canvas.removeEventListener('mouseup', handleMouseUp);
    canvas.removeEventListener('click', handleClick);
    canvas.removeEventListener('dblclick', handleDoubleClick);
    canvas.removeEventListener('mouseleave', handleMouseLeave);
  };
}

/**
 * Zoom in by one step
 */
export function zoomIn() {
  const currentZoom = get('zoomLevel');
  const newZoom = Math.min(ZOOM_LIMITS.max, currentZoom * ZOOM_STEP);
  setState({ zoomLevel: newZoom });
}

/**
 * Zoom out by one step
 */
export function zoomOut() {
  const currentZoom = get('zoomLevel');
  const newZoom = Math.max(ZOOM_LIMITS.min, currentZoom / ZOOM_STEP);
  setState({ zoomLevel: newZoom });
}

/**
 * Reset zoom to 1x
 */
export function resetZoom() {
  setState({ zoomLevel: 1 });
  setTimeRange(null, null);
}

/**
 * Get current zoom info
 */
export function getZoomInfo() {
  const zoomLevel = get('zoomLevel');
  const timeWindow = get('timeWindow') / zoomLevel;
  return {
    zoomLevel,
    timeWindow,
    zoomPercent: Math.round(zoomLevel * 100)
  };
}
