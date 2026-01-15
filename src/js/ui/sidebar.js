/**
 * Sidebar UI Controller
 * Handles collapsible sidebar state and interactions
 */

import { get, setState, subscribe } from '../state.js';

/**
 * Initialize sidebar functionality
 * @param {HTMLElement} sidebar - Sidebar element
 * @param {HTMLElement} toggleBtn - Toggle button element
 * @param {Function} onResize - Callback when sidebar resizes
 */
export function initSidebar(sidebar, toggleBtn, onResize) {
  // Handle toggle button click
  toggleBtn.addEventListener('click', () => {
    toggleSidebar();
  });

  // Subscribe to state changes
  subscribe((changed, state) => {
    if ('sidebarCollapsed' in changed) {
      updateSidebarVisibility(sidebar, state.sidebarCollapsed);
      onResize?.();
    }
  });

  // Initialize from state
  updateSidebarVisibility(sidebar, get('sidebarCollapsed'));
}

/**
 * Toggle sidebar collapsed state
 */
export function toggleSidebar() {
  setState({ sidebarCollapsed: !get('sidebarCollapsed') });
}

/**
 * Set sidebar collapsed state
 * @param {boolean} collapsed
 */
export function setSidebarCollapsed(collapsed) {
  setState({ sidebarCollapsed: collapsed });
}

/**
 * Update sidebar visibility based on state
 * @param {HTMLElement} sidebar
 * @param {boolean} collapsed
 */
function updateSidebarVisibility(sidebar, collapsed) {
  if (collapsed) {
    sidebar.classList.add('collapsed');
  } else {
    sidebar.classList.remove('collapsed');
  }
}

/**
 * Get current sidebar width
 * @param {HTMLElement} sidebar
 * @returns {number}
 */
export function getSidebarWidth(sidebar) {
  if (get('sidebarCollapsed')) return 0;
  return sidebar.offsetWidth;
}
