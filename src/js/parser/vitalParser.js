/**
 * VitalDB file parser
 * Parses binary .vital file format
 */

import { MONTYPES } from '../constants.js';
import { readString, parseFmt, readSamples, readValue } from '../utils/binary.js';

/**
 * Parse VitalDB binary data
 * @param {ArrayBuffer} buffer - Decompressed file buffer
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Object} - Parsed vital file structure
 */
export function parseVitalData(buffer, onProgress = () => {}) {
  const view = new DataView(buffer);
  let pos = 0;

  // Check signature
  const sign = String.fromCharCode(
    view.getUint8(0),
    view.getUint8(1),
    view.getUint8(2),
    view.getUint8(3)
  );
  if (sign !== 'VITA') {
    throw new Error('Invalid vital file: missing VITA signature');
  }
  pos += 4;

  // Skip version
  pos += 4;

  // Header length
  const headerLen = view.getUint16(pos, true);
  pos += 2 + headerLen;

  // Initialize vital file structure
  const vf = {
    devs: { 0: {} },      // Devices
    trks: {},              // Tracks
    dtstart: 0,            // Start time
    dtend: 0,              // End time
    montypeTrks: {},       // Monitor type to track mapping
    eventTrack: null       // Event track reference
  };

  const totalSize = buffer.byteLength;
  let lastProgress = 0;

  // Parse packets
  while (pos + 5 < totalSize) {
    const packetType = view.getInt8(pos);
    const packetLen = view.getUint32(pos + 1, true);
    pos += 5;

    if (pos + packetLen > totalSize) break;

    const packetStart = pos;

    if (packetType === 9) {
      // Device info packet
      parseDeviceInfo(buffer, view, pos, vf);
    } else if (packetType === 0) {
      // Track info packet
      parseTrackInfo(buffer, view, pos, vf);
    } else if (packetType === 1) {
      // Record packet
      parseRecord(buffer, view, pos, vf);
    }

    pos = packetStart + packetLen;

    // Progress callback
    const progress = Math.floor((pos / totalSize) * 100);
    if (progress > lastProgress) {
      lastProgress = progress;
      onProgress(progress);
    }
  }

  return vf;
}

/**
 * Parse device info packet (type 9)
 */
function parseDeviceInfo(buffer, view, pos, vf) {
  const did = view.getUint32(pos, true);
  pos += 4;

  const [type, p1] = readString(buffer, pos);
  pos = p1;
  const [name, p2] = readString(buffer, pos);
  pos = p2;
  const [port, p3] = readString(buffer, pos);

  vf.devs[did] = { name, type, port };
}

/**
 * Parse track info packet (type 0)
 */
function parseTrackInfo(buffer, view, pos, vf) {
  const tid = view.getUint16(pos, true);
  pos += 2;

  const trktype = view.getInt8(pos);
  pos += 1;

  const fmt = view.getInt8(pos);
  pos += 1;

  const [tname, p1] = readString(buffer, pos);
  pos = p1;

  const [unit, p2] = readString(buffer, pos);
  pos = p2;

  const mindisp = view.getFloat32(pos, true);
  pos += 4;

  const maxdisp = view.getFloat32(pos, true);
  pos += 4;

  const col = view.getUint32(pos, true);
  pos += 4;

  const srate = view.getFloat32(pos, true);
  pos += 4;

  const gain = view.getFloat64(pos, true);
  pos += 8;

  const offset = view.getFloat64(pos, true);
  pos += 8;

  const montype = view.getInt8(pos);
  pos += 1;

  const did = view.getUint32(pos, true);

  // Build device/track name
  const dname = (did && vf.devs[did]) ? vf.devs[did].name : '';
  const dtname = dname ? `${dname}/${tname}` : tname;

  // Store track info
  vf.trks[tid] = {
    tid,
    name: tname,
    dtname,
    type: trktype,
    fmt,
    unit,
    srate,
    mindisp,
    maxdisp,
    col,
    montype,
    gain,
    offset,
    did,
    recs: []
  };

  // Map montype to track
  const montypeName = MONTYPES[montype];
  if (montypeName) {
    vf.montypeTrks[montypeName] = vf.trks[tid];
  }

  // Store EVENT track separately
  if (tname === 'EVENT') {
    vf.eventTrack = vf.trks[tid];
  }
}

/**
 * Parse record packet (type 1)
 */
function parseRecord(buffer, view, pos, vf) {
  // Skip infolen
  pos += 2;

  const dt = view.getFloat64(pos, true);
  pos += 8;

  const tid = view.getUint16(pos, true);
  pos += 2;

  // Update time range
  if (vf.dtstart === 0 || (dt > 0 && dt < vf.dtstart)) {
    vf.dtstart = dt;
  }
  if (dt > vf.dtend) {
    vf.dtend = dt;
  }

  const trk = vf.trks[tid];
  if (!trk) return;

  const fmtInfo = parseFmt(trk.fmt);

  if (trk.type === 1) {
    // Waveform
    const nsamp = view.getUint32(pos, true);
    pos += 4;

    const endDt = dt + (nsamp / trk.srate);
    if (endDt > vf.dtend) {
      vf.dtend = endDt;
    }

    const samples = readSamples(buffer, pos, nsamp, fmtInfo);
    trk.recs.push({ dt, val: samples });
  } else if (trk.type === 2) {
    // Numeric
    const val = readValue(view, pos, fmtInfo);
    trk.recs.push({ dt, val });
  } else if (trk.type === 5) {
    // String
    pos += 4;
    const [s] = readString(buffer, pos);
    trk.recs.push({ dt, val: s });
  }
}

/**
 * Get duration of vital file in seconds
 * @param {Object} vf - Parsed vital file
 * @returns {number}
 */
export function getDuration(vf) {
  if (!vf || vf.dtstart === 0 || vf.dtend === 0) return 0;
  return vf.dtend - vf.dtstart;
}

/**
 * Get list of available tracks
 * @param {Object} vf - Parsed vital file
 * @returns {Array}
 */
export function getTrackList(vf) {
  if (!vf || !vf.trks) return [];
  return Object.values(vf.trks).map(trk => ({
    tid: trk.tid,
    name: trk.name,
    dtname: trk.dtname,
    type: trk.type,
    unit: trk.unit,
    montype: trk.montype,
    color: `#${(trk.col >>> 0).toString(16).padStart(6, '0')}`
  }));
}
