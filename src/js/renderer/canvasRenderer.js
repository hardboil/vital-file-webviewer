/**
 * Canvas Renderer
 * Main rendering orchestration for the vital monitor display
 * Supports both Monitor View and Track View
 */

import { PAR_WIDTH, PAR_HEIGHT, WAVE_GROUPS, PARAM_GROUPS, COLORS, VIEW_MODES } from '../constants.js';
import { CANVAS } from '../config.js';
import { get } from '../state.js';
import { drawWave, drawWaveRange, drawWaveLabel, drawWaveSeparator, drawTimeGrid } from './waveRenderer.js';
import { drawParams } from './paramRenderer.js';
import { drawEvents, drawEventMarkers } from './eventRenderer.js';
import { pad } from '../utils/time.js';

/**
 * Canvas Renderer class
 */
export class CanvasRenderer {
  /**
   * @param {HTMLCanvasElement} canvas - Target canvas element
   */
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.vitalFile = null;
  }

  /**
   * Set vital file data
   * @param {Object} vitalFile - Parsed vital file
   */
  setVitalFile(vitalFile) {
    this.vitalFile = vitalFile;
  }

  /**
   * Resize canvas to fit container
   */
  resize() {
    requestAnimationFrame(() => {
      const container = this.canvas.parentElement;
      if (!container) return;
      this.canvas.width = container.clientWidth;
      this.canvas.height = container.clientHeight;
    });
  }

  /**
   * Main draw function
   * @param {number} currentTime - Current playback time in seconds
   */
  draw(currentTime) {
    const viewMode = get('viewMode');

    if (viewMode === VIEW_MODES.TRACK) {
      this.drawTrackView(currentTime);
    } else {
      this.drawMonitorView(currentTime);
    }
  }

  /**
   * Draw Monitor View (sweep display)
   * @param {number} currentTime - Current playback time in seconds
   */
  drawMonitorView(currentTime) {
    const { ctx, canvas, vitalFile } = this;

    // Clear canvas
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (!vitalFile) return;

    const wavWidth = canvas.width - PAR_WIDTH;
    let y = 10;

    // Draw title bar
    this.drawTitle(y, currentTime);
    y += 50;

    // Draw wave groups
    for (const group of WAVE_GROUPS) {
      const wavTrack = vitalFile.montypeTrks[group.wav];
      if (!wavTrack || !wavTrack.prev || wavTrack.prev.length === 0) continue;

      // Draw waveform
      drawWave(ctx, wavTrack, 0, y, wavWidth, PAR_HEIGHT, group.color, currentTime);

      // Draw parameters
      drawParams(ctx, group, vitalFile, wavWidth, y, currentTime);

      // Draw wave label
      drawWaveLabel(ctx, wavTrack.name, 0, y);

      // Draw separator
      drawWaveSeparator(ctx, 0, y + PAR_HEIGHT, wavWidth);

      y += PAR_HEIGHT;
    }

    // Draw events
    drawEvents(ctx, vitalFile, wavWidth, y, currentTime);

    // Draw non-wave parameter groups
    this.drawParamGroups(y, currentTime);
  }

  /**
   * Draw Track View (time-series display)
   * @param {number} currentTime - Current playback time in seconds
   */
  drawTrackView(currentTime) {
    const { ctx, canvas, vitalFile } = this;

    // Clear canvas
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (!vitalFile) return;

    const duration = get('duration');
    const zoomLevel = get('zoomLevel');
    const timeWindow = get('timeWindow') / zoomLevel;
    const visibleTracks = get('visibleTracks');

    // Calculate visible time range
    let startTime = Math.max(0, currentTime - timeWindow / 2);
    let endTime = Math.min(duration, startTime + timeWindow);

    // Adjust start time if we're near the end
    if (endTime === duration) {
      startTime = Math.max(0, endTime - timeWindow);
    }

    const margin = { top: 30, right: 20, bottom: 40, left: 60 };
    const availableHeight = canvas.height - margin.top - margin.bottom;
    const availableWidth = canvas.width - margin.left - margin.right;

    // Count visible wave tracks
    const visibleWaveTracks = WAVE_GROUPS.filter(group => {
      const wavTrack = vitalFile.montypeTrks[group.wav];
      return wavTrack && wavTrack.prev && wavTrack.prev.length > 0 &&
             (visibleTracks[group.name] !== false);
    });

    if (visibleWaveTracks.length === 0) {
      ctx.fillStyle = COLORS.textSecondary;
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('No visible tracks', canvas.width / 2, canvas.height / 2);
      return;
    }

    const trackHeight = Math.min(
      CANVAS.trackHeight,
      (availableHeight - (visibleWaveTracks.length - 1) * CANVAS.trackGap) / visibleWaveTracks.length
    );

    // Draw time axis
    this.drawTimeAxis(margin.left, canvas.height - margin.bottom + 5, availableWidth, startTime, endTime);

    // Draw tracks
    let y = margin.top;
    for (const group of visibleWaveTracks) {
      const wavTrack = vitalFile.montypeTrks[group.wav];

      // Draw track background
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(margin.left, y, availableWidth, trackHeight);

      // Draw track border
      ctx.strokeStyle = COLORS.border;
      ctx.lineWidth = 0.5;
      ctx.strokeRect(margin.left, y, availableWidth, trackHeight);

      // Draw waveform
      drawWaveRange(ctx, wavTrack, margin.left, y, availableWidth, trackHeight, group.color, startTime, endTime);

      // Draw track label
      ctx.fillStyle = group.color;
      ctx.font = '12px Arial';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(group.name, margin.left - 5, y + trackHeight / 2);

      y += trackHeight + CANVAS.trackGap;
    }

    // Draw current time indicator
    const timeX = margin.left + ((currentTime - startTime) / (endTime - startTime)) * availableWidth;
    ctx.strokeStyle = COLORS.accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(timeX, margin.top);
    ctx.lineTo(timeX, canvas.height - margin.bottom);
    ctx.stroke();

    // Draw event markers
    drawEventMarkers(ctx, vitalFile, margin.left, margin.top, availableWidth, availableHeight, startTime, endTime);

    // Draw selection range if exists
    const selectedTimeRange = get('selectedTimeRange');
    if (selectedTimeRange) {
      this.drawSelectionRange(margin.left, margin.top, availableWidth, availableHeight, startTime, endTime, selectedTimeRange);
    }
  }

  /**
   * Draw time axis for Track View
   */
  drawTimeAxis(x, y, width, startTime, endTime) {
    const { ctx } = this;
    const duration = endTime - startTime;

    // Calculate grid interval
    let interval;
    if (duration < 10) interval = 1;
    else if (duration < 60) interval = 5;
    else if (duration < 300) interval = 30;
    else if (duration < 600) interval = 60;
    else interval = 300;

    ctx.fillStyle = COLORS.textSecondary;
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    const startGrid = Math.ceil(startTime / interval) * interval;

    for (let t = startGrid; t < endTime; t += interval) {
      const px = x + ((t - startTime) / duration) * width;

      // Tick mark
      ctx.strokeStyle = COLORS.border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px, y);
      ctx.lineTo(px, y + 5);
      ctx.stroke();

      // Time label
      const minutes = Math.floor(t / 60);
      const seconds = Math.floor(t % 60);
      ctx.fillText(`${minutes}:${seconds.toString().padStart(2, '0')}`, px, y + 7);
    }
  }

  /**
   * Draw selection range highlight
   */
  drawSelectionRange(x, y, width, height, startTime, endTime, selectedRange) {
    const { ctx } = this;
    const duration = endTime - startTime;

    const selStartX = x + Math.max(0, ((selectedRange.start - startTime) / duration)) * width;
    const selEndX = x + Math.min(1, ((selectedRange.end - startTime) / duration)) * width;
    const selWidth = selEndX - selStartX;

    if (selWidth <= 0) return;

    ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
    ctx.fillRect(selStartX, y, selWidth, height);

    ctx.strokeStyle = COLORS.accent;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(selStartX, y, selWidth, height);
    ctx.setLineDash([]);
  }

  /**
   * Draw title bar with current time and device info
   */
  drawTitle(y, currentTime) {
    const { ctx, canvas, vitalFile } = this;

    // Current time
    const date = new Date((vitalFile.dtstart + currentTime) * 1000);
    const timeStr = `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;

    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = COLORS.text;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(timeStr, canvas.width / 2, y + 10);

    // Device info
    let x = 10;
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';

    for (const did in vitalFile.devs) {
      const dev = vitalFile.devs[did];
      if (!dev.name) continue;

      // Device indicator
      ctx.fillStyle = COLORS.deviceIndicator;
      ctx.fillRect(x, y + 35, 10, 10);
      x += 14;

      // Device name
      ctx.fillStyle = COLORS.text;
      ctx.fillText(dev.name.substring(0, 8), x, y + 35);
      x += ctx.measureText(dev.name.substring(0, 8)).width + 15;
    }
  }

  /**
   * Draw non-wave parameter groups
   */
  drawParamGroups(startY, currentTime) {
    const { ctx, canvas, vitalFile } = this;

    let paramX = 0;
    let paramY = startY;
    let lineCount = 0;
    const maxLines = 2;

    for (const group of PARAM_GROUPS) {
      // Check if any param has data
      let hasData = false;
      for (const paramName of group.params) {
        const track = vitalFile.montypeTrks[paramName];
        if (track && track.data && track.data.length > 0) {
          hasData = true;
          break;
        }
      }
      if (!hasData) continue;

      // Draw param group
      if (drawParams(ctx, group, vitalFile, paramX, paramY, currentTime)) {
        paramX += PAR_WIDTH;

        // Wrap to next line if needed
        if (paramX > canvas.width - PAR_WIDTH * 2) {
          paramX = 0;
          paramY += PAR_HEIGHT;
          lineCount++;
          if (lineCount >= maxLines) break;
        }
      }
    }
  }

  /**
   * Get time at X coordinate (for Track View click handling)
   * @param {number} mouseX - Mouse X coordinate
   * @returns {number|null} - Time in seconds or null if outside track area
   */
  getTimeAtX(mouseX) {
    const { canvas, vitalFile } = this;
    if (!vitalFile) return null;

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
}
