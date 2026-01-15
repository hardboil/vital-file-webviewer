/**
 * Waveform renderer
 * Draws waveform traces on canvas
 */

/**
 * Draw a waveform on the canvas (sweep mode for Monitor View)
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} track - Track object with prev data
 * @param {number} x - Start X position
 * @param {number} y - Start Y position
 * @param {number} width - Drawing width
 * @param {number} height - Drawing height
 * @param {string} color - Stroke color
 * @param {number} currentTime - Current playback time in seconds
 */
export function drawWave(ctx, track, x, y, width, height, color, currentTime) {
  if (!track.prev || !track.srate) return;

  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;

  const samplesPerPixel = track.srate / 100; // 100 pixels per second
  const startIdx = Math.floor(currentTime * track.srate);
  const inc = Math.max(1, Math.floor(samplesPerPixel / 2));

  let isFirst = true;
  let lastX = x;

  for (let i = startIdx, px = 0; px < width && i < track.prev.length; i += inc, px += inc / samplesPerPixel) {
    const val = track.prev[i];
    if (val === 0) continue; // Skip gaps

    const py = y + height * (255 - val) / 254;

    if (isFirst) {
      ctx.moveTo(x + px, py);
      isFirst = false;
    } else {
      // Break path if there's a large gap
      if (px - lastX > 20) {
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + px, py);
      } else {
        ctx.lineTo(x + px, py);
      }
    }
    lastX = px;
  }

  ctx.stroke();
}

/**
 * Draw waveform for Track View (time range)
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} track - Track object with prev data
 * @param {number} x - Start X position
 * @param {number} y - Start Y position
 * @param {number} width - Drawing width
 * @param {number} height - Drawing height
 * @param {string} color - Stroke color
 * @param {number} startTime - Start time in seconds
 * @param {number} endTime - End time in seconds
 */
export function drawWaveRange(ctx, track, x, y, width, height, color, startTime, endTime) {
  if (!track.prev || !track.srate) return;

  const duration = endTime - startTime;
  if (duration <= 0) return;

  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;

  const startIdx = Math.floor(startTime * track.srate);
  const endIdx = Math.floor(endTime * track.srate);
  const totalSamples = endIdx - startIdx;
  const pixelsPerSample = width / totalSamples;

  // Adaptive downsampling
  const samplesPerPixel = Math.ceil(totalSamples / width);
  const inc = Math.max(1, Math.floor(samplesPerPixel / 2));

  let isFirst = true;
  let lastPx = -1;

  for (let i = startIdx; i < endIdx && i < track.prev.length; i += inc) {
    const val = track.prev[i];
    if (val === 0) {
      // Gap - break the path
      if (!isFirst) {
        ctx.stroke();
        ctx.beginPath();
        isFirst = true;
      }
      continue;
    }

    const px = x + (i - startIdx) * pixelsPerSample;
    const py = y + height * (255 - val) / 254;

    if (isFirst) {
      ctx.moveTo(px, py);
      isFirst = false;
    } else {
      // Break path if there's a large gap
      if (px - lastPx > 50) {
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    lastPx = px;
  }

  ctx.stroke();
}

/**
 * Draw wave name label
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {string} name - Track name
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {string} color - Text color (optional)
 */
export function drawWaveLabel(ctx, name, x, y, color = '#ffffff') {
  ctx.font = '14px Arial';
  ctx.fillStyle = color;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(name, x + 5, y + 5);
}

/**
 * Draw wave separator line
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} x - Start X
 * @param {number} y - Y position
 * @param {number} width - Line width
 */
export function drawWaveSeparator(ctx, x, y, width) {
  ctx.strokeStyle = '#404040';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + width, y);
  ctx.stroke();
}

/**
 * Draw time grid for Track View
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} x - Start X position
 * @param {number} y - Start Y position
 * @param {number} width - Drawing width
 * @param {number} height - Drawing height
 * @param {number} startTime - Start time in seconds
 * @param {number} endTime - End time in seconds
 */
export function drawTimeGrid(ctx, x, y, width, height, startTime, endTime) {
  const duration = endTime - startTime;
  if (duration <= 0) return;

  // Calculate grid interval based on zoom
  let interval;
  if (duration < 10) interval = 1;
  else if (duration < 60) interval = 5;
  else if (duration < 300) interval = 30;
  else if (duration < 600) interval = 60;
  else interval = 300;

  ctx.strokeStyle = '#333333';
  ctx.lineWidth = 0.5;
  ctx.fillStyle = '#666666';
  ctx.font = '10px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  const startGrid = Math.ceil(startTime / interval) * interval;

  for (let t = startGrid; t < endTime; t += interval) {
    const px = x + ((t - startTime) / duration) * width;

    // Vertical grid line
    ctx.beginPath();
    ctx.moveTo(px, y);
    ctx.lineTo(px, y + height);
    ctx.stroke();

    // Time label
    const minutes = Math.floor(t / 60);
    const seconds = Math.floor(t % 60);
    const label = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    ctx.fillText(label, px, y + height + 2);
  }
}
