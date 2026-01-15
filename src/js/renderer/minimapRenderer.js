/**
 * Minimap Renderer
 * Displays an overview of the entire recording with current viewport indicator
 */

import { WAVE_GROUPS, COLORS } from '../constants.js';
import { get } from '../state.js';

/**
 * Minimap Renderer class
 */
export class MinimapRenderer {
  /**
   * @param {HTMLCanvasElement} canvas - Minimap canvas element
   */
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.vitalFile = null;
    this.isDragging = false;
    this.onSeek = null;
  }

  /**
   * Set vital file data
   * @param {Object} vitalFile - Parsed vital file
   */
  setVitalFile(vitalFile) {
    this.vitalFile = vitalFile;
  }

  /**
   * Set seek callback
   * @param {Function} callback - Called with time when user clicks/drags
   */
  setOnSeek(callback) {
    this.onSeek = callback;
  }

  /**
   * Resize canvas to fit container
   */
  resize() {
    const container = this.canvas.parentElement;
    if (!container) return;
    this.canvas.width = container.clientWidth;
    this.canvas.height = container.clientHeight;
  }

  /**
   * Draw the minimap
   */
  draw() {
    const { ctx, canvas, vitalFile } = this;

    // Clear canvas
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (!vitalFile) return;

    const duration = get('duration');
    if (duration <= 0) return;

    const margin = { left: 40, right: 10, top: 4, bottom: 4 };
    const width = canvas.width - margin.left - margin.right;
    const height = canvas.height - margin.top - margin.bottom;

    // Draw background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(margin.left, margin.top, width, height);

    // Draw waveform overview (using first available track)
    this.drawWaveformOverview(margin.left, margin.top, width, height, duration);

    // Draw markers
    this.drawMarkers(margin.left, margin.top, width, height, duration);

    // Draw viewport indicator
    this.drawViewportIndicator(margin.left, margin.top, width, height, duration);

    // Draw time labels
    this.drawTimeLabels(margin.left, margin.top, width, height, duration);

    // Draw border
    ctx.strokeStyle = COLORS.border;
    ctx.lineWidth = 1;
    ctx.strokeRect(margin.left, margin.top, width, height);
  }

  /**
   * Draw simplified waveform overview
   */
  drawWaveformOverview(x, y, width, height, duration) {
    const { ctx, vitalFile } = this;
    const trackOrder = get('trackOrder');
    const visibleTracks = get('visibleTracks');

    // Find first visible track with data
    let primaryGroup = null;
    const orderedGroups = trackOrder.length > 0
      ? WAVE_GROUPS.filter(g => trackOrder.includes(g.name))
          .sort((a, b) => trackOrder.indexOf(a.name) - trackOrder.indexOf(b.name))
      : WAVE_GROUPS;

    for (const group of orderedGroups) {
      if (visibleTracks[group.name] === false) continue;
      const track = vitalFile.montypeTrks[group.wav];
      if (track && track.prev && track.prev.length > 0) {
        primaryGroup = group;
        break;
      }
    }

    if (!primaryGroup) return;

    const track = vitalFile.montypeTrks[primaryGroup.wav];
    const data = track.prev;
    const sps = track.sps || 500;

    // Downsample for performance
    const pixelsPerSecond = width / duration;
    const samplesPerPixel = Math.max(1, Math.floor(sps / pixelsPerSecond));

    ctx.strokeStyle = primaryGroup.color;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();

    let firstPoint = true;
    const centerY = y + height / 2;
    const amplitude = height / 2 - 2;

    for (let px = 0; px < width; px++) {
      const time = (px / width) * duration;
      const sampleIndex = Math.floor(time * sps);

      if (sampleIndex >= data.length) break;

      // Get min/max for this pixel range
      let min = 255, max = 0;
      const endSample = Math.min(sampleIndex + samplesPerPixel, data.length);

      for (let i = sampleIndex; i < endSample; i++) {
        const val = data[i];
        if (val < min) min = val;
        if (val > max) max = val;
      }

      // Draw vertical line from min to max
      const minY = centerY - ((min / 255) - 0.5) * 2 * amplitude;
      const maxY = centerY - ((max / 255) - 0.5) * 2 * amplitude;

      if (firstPoint) {
        ctx.moveTo(x + px, minY);
        firstPoint = false;
      }
      ctx.lineTo(x + px, maxY);
    }

    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  /**
   * Draw markers on minimap
   */
  drawMarkers(x, y, width, height, duration) {
    const { ctx } = this;
    const markers = get('markers');

    if (!markers || markers.length === 0) return;

    for (const marker of markers) {
      const px = x + (marker.time / duration) * width;

      // Draw marker line
      ctx.strokeStyle = COLORS.accent;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px, y);
      ctx.lineTo(px, y + height);
      ctx.stroke();

      // Draw marker triangle
      ctx.fillStyle = COLORS.accent;
      ctx.beginPath();
      ctx.moveTo(px - 4, y);
      ctx.lineTo(px + 4, y);
      ctx.lineTo(px, y + 6);
      ctx.closePath();
      ctx.fill();
    }
  }

  /**
   * Draw viewport indicator
   */
  drawViewportIndicator(x, y, width, height, duration) {
    const { ctx } = this;
    const currentTime = get('currentTime');
    const zoomLevel = get('zoomLevel');
    const timeWindow = get('timeWindow') / zoomLevel;

    // Calculate viewport bounds
    let startTime = Math.max(0, currentTime - timeWindow / 2);
    let endTime = Math.min(duration, startTime + timeWindow);
    if (endTime === duration) {
      startTime = Math.max(0, endTime - timeWindow);
    }

    const startX = x + (startTime / duration) * width;
    const endX = x + (endTime / duration) * width;
    const viewWidth = endX - startX;

    // Draw viewport rectangle
    ctx.fillStyle = 'rgba(0, 255, 0, 0.15)';
    ctx.fillRect(startX, y, viewWidth, height);

    ctx.strokeStyle = COLORS.accent;
    ctx.lineWidth = 2;
    ctx.strokeRect(startX, y, viewWidth, height);

    // Draw current time indicator
    const currentX = x + (currentTime / duration) * width;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(currentX, y);
    ctx.lineTo(currentX, y + height);
    ctx.stroke();
  }

  /**
   * Draw time labels
   */
  drawTimeLabels(x, y, width, height, duration) {
    const { ctx } = this;

    ctx.fillStyle = COLORS.textSecondary;
    ctx.font = '10px Arial';
    ctx.textBaseline = 'middle';

    // Start time
    ctx.textAlign = 'right';
    ctx.fillText('0:00', x - 4, y + height / 2);

    // End time
    ctx.textAlign = 'left';
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    ctx.fillText(`${minutes}:${seconds.toString().padStart(2, '0')}`, x + width + 4, y + height / 2);
  }

  /**
   * Setup mouse interactions
   */
  setupInteraction() {
    const { canvas } = this;

    const getTimeFromX = (clientX) => {
      const rect = canvas.getBoundingClientRect();
      const margin = { left: 40, right: 10 };
      const width = canvas.width - margin.left - margin.right;
      const x = clientX - rect.left - margin.left;
      const duration = get('duration');

      if (x < 0 || x > width) return null;
      return (x / width) * duration;
    };

    const handleSeek = (e) => {
      const time = getTimeFromX(e.clientX);
      if (time !== null && this.onSeek) {
        this.onSeek(time);
      }
    };

    canvas.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      handleSeek(e);
    });

    canvas.addEventListener('mousemove', (e) => {
      if (this.isDragging) {
        handleSeek(e);
      }
      // Update cursor
      const time = getTimeFromX(e.clientX);
      canvas.style.cursor = time !== null ? 'pointer' : 'default';
    });

    canvas.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    canvas.addEventListener('mouseleave', () => {
      this.isDragging = false;
    });
  }
}
