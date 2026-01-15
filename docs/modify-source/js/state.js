/**
 * Application State Management
 * Simple pub/sub pattern for reactive state
 */

// Initial state
const state = {
    vitalFile: null,
    isPlaying: false,
    playSpeed: 1,
    currentTime: 0,
    duration: 0,
    filename: '',
    isLoading: false,
    loadingProgress: 0
};

// Listeners for state changes
const listeners = new Set();

/**
 * Get current state (read-only copy)
 * @returns {Object}
 */
export function getState() {
    return { ...state };
}

/**
 * Get specific state value
 * @param {string} key - State key
 * @returns {*}
 */
export function get(key) {
    return state[key];
}

/**
 * Update state
 * @param {Object} updates - Partial state updates
 */
export function setState(updates) {
    const changed = {};
    let hasChanges = false;

    for (const key in updates) {
        if (state[key] !== updates[key]) {
            changed[key] = { old: state[key], new: updates[key] };
            state[key] = updates[key];
            hasChanges = true;
        }
    }

    if (hasChanges) {
        notifyListeners(changed);
    }
}

/**
 * Subscribe to state changes
 * @param {Function} callback - Called with changed keys
 * @returns {Function} - Unsubscribe function
 */
export function subscribe(callback) {
    listeners.add(callback);
    return () => listeners.delete(callback);
}

/**
 * Notify all listeners of state changes
 */
function notifyListeners(changed) {
    for (const callback of listeners) {
        try {
            callback(changed, state);
        } catch (e) {
            console.error('State listener error:', e);
        }
    }
}

/**
 * Reset state to initial values
 */
export function resetState() {
    setState({
        vitalFile: null,
        isPlaying: false,
        playSpeed: 1,
        currentTime: 0,
        duration: 0,
        filename: '',
        isLoading: false,
        loadingProgress: 0
    });
}
