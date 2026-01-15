/**
 * CSV Export
 * Exports waveform and parameter data as CSV
 */

import { get } from '../state.js';
import { WAVE_GROUPS, PARAM_GROUPS } from '../constants.js';
import { showToast } from '../ui/toast.js';

/**
 * Export data as CSV
 * @param {Object} vitalFile - Parsed vital file
 * @param {Object} options - Export options
 * @param {number} options.startTime - Start time in seconds (optional)
 * @param {number} options.endTime - End time in seconds (optional)
 * @param {boolean} options.includeWaves - Include waveform data (default: false due to size)
 * @param {boolean} options.includeParams - Include parameter data (default: true)
 * @param {number} options.waveResolution - Waveform sample interval in seconds (default: 0.01)
 */
export function exportCSV(vitalFile, options = {}) {
  if (!vitalFile) {
    showToast('No data to export', 'error');
    return;
  }

  const {
    startTime = 0,
    endTime = get('duration'),
    includeWaves = false,
    includeParams = true,
    waveResolution = 0.01
  } = options;

  try {
    let csvContent = '';
    const filename = generateFilename(startTime, endTime, includeWaves);

    if (includeWaves) {
      csvContent = exportWaveformCSV(vitalFile, startTime, endTime, waveResolution);
    } else if (includeParams) {
      csvContent = exportParameterCSV(vitalFile, startTime, endTime);
    }

    if (!csvContent) {
      showToast('No data to export in selected range', 'warning');
      return;
    }

    downloadCSV(csvContent, filename);
    showToast(`CSV exported: ${filename}`, 'success');
  } catch (error) {
    console.error('CSV export failed:', error);
    showToast('Failed to export CSV', 'error');
  }
}

/**
 * Export waveform data as CSV
 * High-resolution time series data
 */
function exportWaveformCSV(vitalFile, startTime, endTime, resolution) {
  // Collect available wave tracks
  const waveTracks = [];
  for (const group of WAVE_GROUPS) {
    const track = vitalFile.montypeTrks[group.wav];
    if (track && track.prev && track.prev.length > 0) {
      waveTracks.push({
        name: group.name,
        track: track,
        sps: track.sps || 100 // samples per second
      });
    }
  }

  if (waveTracks.length === 0) {
    return '';
  }

  // Build header
  const headers = ['Time (s)', ...waveTracks.map(w => w.name)];
  const rows = [headers.join(',')];

  // Sample at specified resolution
  const dtstart = vitalFile.dtstart || 0;

  for (let t = startTime; t <= endTime; t += resolution) {
    const row = [t.toFixed(3)];

    for (const waveInfo of waveTracks) {
      const track = waveInfo.track;
      const value = getWaveValueAtTime(track, t, dtstart);
      row.push(value !== null ? value.toFixed(2) : '');
    }

    rows.push(row.join(','));
  }

  return rows.join('\n');
}

/**
 * Export parameter data as CSV
 * Numeric parameters at their native sample rates
 */
function exportParameterCSV(vitalFile, startTime, endTime) {
  // Collect all parameter tracks with data in range
  const paramData = [];
  const allTimestamps = new Set();

  // Collect from WAVE_GROUPS (numeric params like HR, SpO2)
  for (const group of WAVE_GROUPS) {
    if (group.params) {
      for (const paramDef of group.params) {
        const paramName = paramDef.name || paramDef;
        const track = vitalFile.montypeTrks[paramName];
        if (track && track.data && track.data.length > 0) {
          collectParamData(track, paramName, startTime, endTime, paramData, allTimestamps, vitalFile.dtstart);
        }
      }
    }
  }

  // Collect from PARAM_GROUPS
  for (const group of PARAM_GROUPS) {
    if (group.params) {
      for (const paramName of group.params) {
        const track = vitalFile.montypeTrks[paramName];
        if (track && track.data && track.data.length > 0) {
          collectParamData(track, paramName, startTime, endTime, paramData, allTimestamps, vitalFile.dtstart);
        }
      }
    }
  }

  if (paramData.length === 0) {
    return '';
  }

  // Sort timestamps
  const sortedTimes = Array.from(allTimestamps).sort((a, b) => a - b);

  // Build header
  const paramNames = [...new Set(paramData.map(p => p.name))];
  const headers = ['Time (s)', ...paramNames];
  const rows = [headers.join(',')];

  // Create time -> param -> value mapping
  const timeMap = new Map();
  for (const point of paramData) {
    if (!timeMap.has(point.time)) {
      timeMap.set(point.time, {});
    }
    timeMap.get(point.time)[point.name] = point.value;
  }

  // Build rows
  for (const time of sortedTimes) {
    const row = [time.toFixed(2)];
    const values = timeMap.get(time) || {};

    for (const paramName of paramNames) {
      const value = values[paramName];
      row.push(value !== undefined ? value : '');
    }

    rows.push(row.join(','));
  }

  return rows.join('\n');
}

/**
 * Collect parameter data points in time range
 */
function collectParamData(track, paramName, startTime, endTime, paramData, allTimestamps, dtstart) {
  for (const record of track.data) {
    const time = record.dt - dtstart;
    if (time >= startTime && time <= endTime) {
      allTimestamps.add(time);
      paramData.push({
        name: paramName,
        time: time,
        value: record.val
      });
    }
  }
}

/**
 * Get waveform value at specific time
 */
function getWaveValueAtTime(track, time, dtstart) {
  if (!track.prev || track.prev.length === 0) {
    return null;
  }

  const sps = track.sps || 100;

  // Find the appropriate record
  for (const record of track.prev) {
    const recordStartTime = record.dt - dtstart;
    const recordDuration = record.vals.length / sps;

    if (time >= recordStartTime && time < recordStartTime + recordDuration) {
      const sampleIndex = Math.floor((time - recordStartTime) * sps);
      if (sampleIndex >= 0 && sampleIndex < record.vals.length) {
        return record.vals[sampleIndex];
      }
    }
  }

  return null;
}

/**
 * Generate filename for CSV export
 */
function generateFilename(startTime, endTime, includeWaves) {
  const startMin = Math.floor(startTime / 60);
  const startSec = Math.floor(startTime % 60);
  const endMin = Math.floor(endTime / 60);
  const endSec = Math.floor(endTime % 60);

  const startStr = `${startMin.toString().padStart(2, '0')}-${startSec.toString().padStart(2, '0')}`;
  const endStr = `${endMin.toString().padStart(2, '0')}-${endSec.toString().padStart(2, '0')}`;
  const type = includeWaves ? 'waveform' : 'params';

  return `vitaldb-${type}-${startStr}_to_${endStr}.csv`;
}

/**
 * Download CSV content as file
 */
function downloadCSV(content, filename) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Export full dataset as CSV
 */
export function exportFullCSV(vitalFile, includeWaves = false) {
  exportCSV(vitalFile, {
    startTime: 0,
    endTime: get('duration'),
    includeWaves,
    includeParams: true
  });
}

/**
 * Export selected range as CSV
 */
export function exportSelectionCSV(vitalFile, includeWaves = false) {
  const selectedRange = get('selectedTimeRange');
  if (!selectedRange) {
    showToast('No selection to export', 'warning');
    return;
  }

  exportCSV(vitalFile, {
    startTime: selectedRange.start,
    endTime: selectedRange.end,
    includeWaves,
    includeParams: true
  });
}
