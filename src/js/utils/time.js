/**
 * Time formatting utilities
 */

/**
 * Pad number with leading zeros
 * @param {number} n - Number to pad
 * @param {number} width - Target width (default 2)
 * @returns {string}
 */
export function pad(n, width = 2) {
  return n.toString().padStart(width, '0');
}

/**
 * Format seconds to HH:MM:SS
 * @param {number} seconds - Total seconds
 * @returns {string}
 */
export function formatTime(seconds) {
  if (!isFinite(seconds) || seconds < 0) return '00:00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

/**
 * Format seconds to MM:SS (short format)
 * @param {number} seconds - Total seconds
 * @returns {string}
 */
export function formatTimeShort(seconds) {
  if (!isFinite(seconds) || seconds < 0) return '00:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${pad(m)}:${pad(s)}`;
}

/**
 * Parse time string to seconds
 * @param {string} timeStr - Time string in HH:MM:SS format
 * @returns {number}
 */
export function parseTime(timeStr) {
  const parts = timeStr.split(':').map(Number);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return parts[0] || 0;
}

/**
 * Format timestamp to local time string
 * @param {number} timestamp - Unix timestamp in seconds
 * @returns {string}
 */
export function formatTimestamp(timestamp) {
  const date = new Date(timestamp * 1000);
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

/**
 * Format duration to human readable string
 * @param {number} seconds - Duration in seconds
 * @returns {string}
 */
export function formatDuration(seconds) {
  if (!isFinite(seconds) || seconds < 0) return '0s';
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}
