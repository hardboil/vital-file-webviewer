/**
 * Event renderer
 * Draws event list on canvas
 */

import { PAR_WIDTH, PAR_HEIGHT } from '../constants.js';

/**
 * Draw events panel
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} vitalFile - Vital file data
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} currentTime - Current playback time
 */
export function drawEvents(ctx, vitalFile, x, y, currentTime) {
    const evtTrack = vitalFile.eventTrack;
    if (!evtTrack || !evtTrack.data || evtTrack.data.length === 0) return;

    const panelHeight = PAR_HEIGHT * 3;

    // Draw event panel background
    ctx.fillStyle = '#202020';
    ctx.fillRect(x, y, PAR_WIDTH, panelHeight);

    // Draw border
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(x, y, PAR_WIDTH, panelHeight);

    // Draw title
    ctx.font = '14px Arial';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('EVENT', x + 5, y + 5);

    // Draw events
    ctx.font = '12px Arial';
    ctx.textBaseline = 'alphabetic';

    let cnt = 0;
    const maxEvents = 10;

    for (let i = 0; i < evtTrack.data.length && cnt < maxEvents; i++) {
        const [dt, value] = evtTrack.data[i];

        // Only show events up to current time
        if (dt > currentTime) break;

        // Calculate time display
        const eventTime = new Date((dt + vitalFile.dtstart) * 1000);
        const hours = eventTime.getHours();
        const minutes = ('0' + eventTime.getMinutes()).slice(-2);
        const timeStr = hours + ':' + minutes;

        // Draw time
        ctx.fillStyle = '#4EB8C9';
        ctx.textAlign = 'left';
        ctx.fillText(timeStr, x + 5, y + 35 + cnt * 18);

        // Draw event text
        ctx.fillStyle = '#fff';
        const eventText = value.length > 12 ? value.substring(0, 12) + '...' : value;
        ctx.fillText(eventText, x + 45, y + 35 + cnt * 18);

        cnt++;
    }
}
