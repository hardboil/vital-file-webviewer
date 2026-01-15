/**
 * File Loader
 * Handles loading vital files from various sources
 */

import pako from 'pako';
import { setState } from '../state.js';
import { parseVitalData, processTrackData, getTrackList } from '../parser/index.js';

/**
 * File Loader class
 */
export class FileLoader {
  /**
   * @param {Object} options
   * @param {Function} options.onLoad - Called when file is loaded successfully
   * @param {Function} options.onProgress - Called with progress (0-100)
   * @param {Function} options.onError - Called on error
   */
  constructor({ onLoad, onProgress, onError }) {
    this.onLoad = onLoad || (() => {});
    this.onProgress = onProgress || (() => {});
    this.onError = onError || console.error;
  }

  /**
   * Load from local file
   * @param {File} file - File object
   */
  async loadLocalFile(file) {
    if (!file.name.endsWith('.vital')) {
      this.onError(new Error('Invalid file type. Please select a .vital file.'));
      return;
    }

    setState({
      isLoading: true,
      loadingProgress: 0,
      loadingText: `Loading ${file.name}...`
    });

    try {
      const arrayBuffer = await file.arrayBuffer();
      await this.parseBuffer(arrayBuffer, file.name);
    } catch (err) {
      this.onError(err);
      setState({ isLoading: false });
    }
  }

  /**
   * Load from URL
   * @param {string} url - URL to .vital file
   */
  async loadFromUrl(url) {
    const filename = url.split('/').pop() || 'remote.vital';

    setState({
      isLoading: true,
      loadingProgress: 0,
      loadingText: `Downloading ${filename}...`
    });

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      await this.parseBuffer(arrayBuffer, filename);
    } catch (err) {
      this.onError(err);
      setState({ isLoading: false });
    }
  }

  /**
   * Parse buffer and process data
   * @param {ArrayBuffer} arrayBuffer - Raw file data
   * @param {string} filename - Display filename
   */
  async parseBuffer(arrayBuffer, filename) {
    try {
      setState({ loadingText: 'Decompressing...' });

      // Decompress with pako
      const compressed = new Uint8Array(arrayBuffer);
      const decompressed = pako.inflate(compressed);

      setState({ loadingText: 'Parsing file...' });

      // Parse vital data
      const vitalFile = parseVitalData(decompressed.buffer, (progress) => {
        setState({ loadingProgress: progress * 0.7 }); // 0-70%
        this.onProgress(progress * 0.7);
      });

      setState({ loadingText: 'Processing tracks...' });

      // Process track data
      processTrackData(vitalFile);

      setState({ loadingProgress: 90 });

      // Get track list
      const trackList = getTrackList(vitalFile);

      // Build visible tracks map (all visible by default)
      const visibleTracks = {};
      for (const track of trackList) {
        visibleTracks[track.name] = true;
      }

      // Calculate duration
      const duration = vitalFile.dtend - vitalFile.dtstart;

      // Update state
      setState({
        vitalFile,
        filename,
        duration,
        currentTime: 0,
        isLoading: false,
        loadingProgress: 100,
        availableTracks: trackList,
        visibleTracks
      });

      this.onLoad(vitalFile, filename);
    } catch (err) {
      this.onError(err);
      setState({ isLoading: false });
    }
  }
}

/**
 * Setup drag and drop handlers
 * @param {HTMLElement} dropZone - Drop zone element
 * @param {Object} loader - Object with loadLocalFile method
 */
export function setupDragDrop(dropZone, loader) {
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });

  dropZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');

    const file = e.dataTransfer.files[0];
    if (file) {
      loader.loadLocalFile(file);
    }
  });

  // Allow click to open file dialog
  dropZone.addEventListener('click', () => {
    const input = document.getElementById('file_input');
    if (input) input.click();
  });
}

/**
 * Setup file input handler
 * @param {HTMLInputElement} input - File input element
 * @param {Object} loader - Object with loadLocalFile method
 */
export function setupFileInput(input, loader) {
  input.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      loader.loadLocalFile(file);
    }
    // Reset input so same file can be selected again
    input.value = '';
  });
}
