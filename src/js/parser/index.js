/**
 * Parser module exports
 */

export { parseVitalData, getDuration, getTrackList } from './vitalParser.js';
export {
  processTrackData,
  getValueAtTime,
  downsampleWaveform,
  getWaveformSegment
} from './trackProcessor.js';
