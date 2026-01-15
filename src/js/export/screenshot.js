/**
 * Screenshot Export
 * Exports current canvas view as PNG image
 */

import { get } from '../state.js';
import { showToast } from '../ui/toast.js';

/**
 * Export main canvas as PNG screenshot
 * @param {HTMLCanvasElement} canvas - Main canvas element
 * @param {string} filename - Optional filename (default: generated from current time)
 */
export function exportScreenshot(canvas, filename = null) {
  if (!canvas) {
    showToast('No canvas to export', 'error');
    return;
  }

  try {
    // Generate filename if not provided
    if (!filename) {
      const currentTime = get('currentTime');
      const viewMode = get('viewMode');
      const minutes = Math.floor(currentTime / 60);
      const seconds = Math.floor(currentTime % 60);
      const timeStr = `${minutes.toString().padStart(2, '0')}-${seconds.toString().padStart(2, '0')}`;
      filename = `vitaldb-${viewMode}-${timeStr}.png`;
    }

    // Create download link
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');

    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`Screenshot saved: ${filename}`, 'success');
  } catch (error) {
    console.error('Screenshot export failed:', error);
    showToast('Failed to export screenshot', 'error');
  }
}

/**
 * Export canvas with custom resolution
 * @param {HTMLCanvasElement} sourceCanvas - Source canvas
 * @param {number} scale - Scale factor (e.g., 2 for 2x resolution)
 * @param {string} filename - Optional filename
 */
export function exportScreenshotHiRes(sourceCanvas, scale = 2, filename = null) {
  if (!sourceCanvas) {
    showToast('No canvas to export', 'error');
    return;
  }

  try {
    // Create temporary canvas with higher resolution
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = sourceCanvas.width * scale;
    tempCanvas.height = sourceCanvas.height * scale;

    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.scale(scale, scale);

    // Draw source canvas to temp canvas
    tempCtx.drawImage(sourceCanvas, 0, 0);

    // Generate filename if not provided
    if (!filename) {
      const currentTime = get('currentTime');
      const viewMode = get('viewMode');
      const minutes = Math.floor(currentTime / 60);
      const seconds = Math.floor(currentTime % 60);
      const timeStr = `${minutes.toString().padStart(2, '0')}-${seconds.toString().padStart(2, '0')}`;
      filename = `vitaldb-${viewMode}-${timeStr}-${scale}x.png`;
    }

    // Create download link
    const link = document.createElement('a');
    link.download = filename;
    link.href = tempCanvas.toDataURL('image/png');

    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`Hi-res screenshot saved: ${filename}`, 'success');
  } catch (error) {
    console.error('Hi-res screenshot export failed:', error);
    showToast('Failed to export hi-res screenshot', 'error');
  }
}
