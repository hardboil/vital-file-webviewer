/**
 * Binary reading utilities for VitalDB file format
 */

/**
 * Read a length-prefixed string from buffer
 * @param {ArrayBuffer} buffer - Source buffer
 * @param {number} pos - Start position
 * @returns {[string, number]} - [string value, new position]
 */
export function readString(buffer, pos) {
  const view = new DataView(buffer);
  const len = view.getUint32(pos, true);
  pos += 4;
  const arr = new Uint8Array(buffer, pos, len);
  const str = String.fromCharCode.apply(null, arr);
  return [str, pos + len];
}

/**
 * Format type definitions
 */
export const FORMAT_TYPES = {
  1: { code: 'f', size: 4, signed: true, float: true },   // float32
  2: { code: 'd', size: 8, signed: true, float: true },   // float64
  3: { code: 'b', size: 1, signed: true },                // int8
  4: { code: 'B', size: 1, signed: false },               // uint8
  5: { code: 'h', size: 2, signed: true },                // int16
  6: { code: 'H', size: 2, signed: false },               // uint16
  7: { code: 'l', size: 4, signed: true },                // int32
  8: { code: 'L', size: 4, signed: false }                // uint32
};

/**
 * Parse format type
 * @param {number} fmt - Format type code
 * @returns {Object}
 */
export function parseFmt(fmt) {
  return FORMAT_TYPES[fmt] || { code: '', size: 0 };
}

/**
 * Read typed samples from buffer
 * @param {ArrayBuffer} buffer - Source buffer
 * @param {number} pos - Start position
 * @param {number} count - Number of samples
 * @param {Object} fmtInfo - Format info from parseFmt
 * @returns {TypedArray}
 */
export function readSamples(buffer, pos, count, fmtInfo) {
  const slice = buffer.slice(pos, pos + count * fmtInfo.size);

  switch (fmtInfo.code) {
    case 'f': return new Float32Array(slice);
    case 'd': return new Float64Array(slice);
    case 'b': return new Int8Array(slice);
    case 'B': return new Uint8Array(slice);
    case 'h': return new Int16Array(slice);
    case 'H': return new Uint16Array(slice);
    case 'l': return new Int32Array(slice);
    case 'L': return new Uint32Array(slice);
    default: return new Float32Array(0);
  }
}

/**
 * Read a single value from DataView
 * @param {DataView} view - DataView instance
 * @param {number} pos - Position
 * @param {Object} fmtInfo - Format info from parseFmt
 * @returns {number}
 */
export function readValue(view, pos, fmtInfo) {
  switch (fmtInfo.code) {
    case 'f': return view.getFloat32(pos, true);
    case 'd': return view.getFloat64(pos, true);
    case 'b': return view.getInt8(pos);
    case 'B': return view.getUint8(pos);
    case 'h': return view.getInt16(pos, true);
    case 'H': return view.getUint16(pos, true);
    case 'l': return view.getInt32(pos, true);
    case 'L': return view.getUint32(pos, true);
    default: return 0;
  }
}

/**
 * Check if buffer starts with magic bytes
 * @param {ArrayBuffer} buffer
 * @param {string} magic
 * @returns {boolean}
 */
export function checkMagic(buffer, magic) {
  const arr = new Uint8Array(buffer, 0, magic.length);
  return String.fromCharCode.apply(null, arr) === magic;
}
