/**
 * Waveform renderer
 * Draws waveform traces on canvas
 */

/**
 * Draw a waveform on the canvas
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
 * Draw wave name label
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {string} name - Track name
 * @param {number} x - X position
 * @param {number} y - Y position
 */
export function drawWaveLabel(ctx, name, x, y) {
    ctx.font = '14px Arial';
    ctx.fillStyle = '#fff';
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
