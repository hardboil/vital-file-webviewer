/**
 * Canvas Renderer
 * Main rendering orchestration for the vital monitor display
 */

import { PAR_WIDTH, PAR_HEIGHT, WAVE_GROUPS, PARAM_GROUPS, COLORS } from '../constants.js';
import { drawWave, drawWaveLabel, drawWaveSeparator } from './waveRenderer.js';
import { drawParams } from './paramRenderer.js';
import { drawEvents } from './eventRenderer.js';
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
            this.canvas.width = container.clientWidth;
            this.canvas.height = container.clientHeight;
        });
    }

    /**
     * Main draw function
     * @param {number} currentTime - Current playback time in seconds
     */
    draw(currentTime) {
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
}
