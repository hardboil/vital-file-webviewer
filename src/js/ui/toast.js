/**
 * Toast Notification System
 * Simple toast messages for user feedback
 */

import { UI } from '../config.js';

/**
 * Show a toast notification
 * @param {string} message - Toast message
 * @param {string} type - Toast type: 'success', 'error', 'warning', 'info'
 * @param {number} duration - Duration in ms (default from config)
 */
export function showToast(message, type = 'info', duration = UI.toastDuration) {
  const container = document.getElementById('toast_container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const iconSpan = document.createElement('span');
  iconSpan.className = 'toast-icon';
  iconSpan.textContent = getToastIcon(type);

  const messageSpan = document.createElement('span');
  messageSpan.className = 'toast-message';
  messageSpan.textContent = message;

  toast.appendChild(iconSpan);
  toast.appendChild(messageSpan);

  container.appendChild(toast);

  // Auto-remove after duration
  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, duration);
}

/**
 * Get icon for toast type
 * @param {string} type
 * @returns {string}
 */
function getToastIcon(type) {
  switch (type) {
    case 'success': return '✓';
    case 'error': return '✕';
    case 'warning': return '⚠';
    default: return 'ℹ';
  }
}

/**
 * Show success toast
 * @param {string} message
 */
export function showSuccess(message) {
  showToast(message, 'success');
}

/**
 * Show error toast
 * @param {string} message
 */
export function showError(message) {
  showToast(message, 'error');
}

/**
 * Show warning toast
 * @param {string} message
 */
export function showWarning(message) {
  showToast(message, 'warning');
}

/**
 * Show info toast
 * @param {string} message
 */
export function showInfo(message) {
  showToast(message, 'info');
}
