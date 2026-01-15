/**
 * Track data processor
 * Normalizes waveform data and prepares tracks for rendering
 */

/**
 * Process all tracks in the vital file
 * @param {Object} vf - Vital file structure from parser
 */
export function processTrackData(vf) {
    const fileLen = vf.dtend - vf.dtstart;

    for (const tid in vf.trks) {
        const trk = vf.trks[tid];
        if (trk.recs.length === 0) continue;

        // Sort records by time
        trk.recs.sort((a, b) => a.dt - b.dt);

        if (trk.type === 1) {
            // Waveform track - normalize to 0-255 range
            processWaveformTrack(trk, vf.dtstart, fileLen);
        } else {
            // Numeric/String track - convert to time series
            processDataTrack(trk, vf.dtstart);
        }
    }
}

/**
 * Process waveform track
 * Creates normalized preview array for efficient rendering
 */
function processWaveformTrack(trk, dtstart, fileLen) {
    const tlen = Math.ceil(trk.srate * fileLen);
    const prev = new Uint8Array(tlen);

    // Calculate normalization range
    const mincnt = (trk.mindisp - trk.offset) / trk.gain;
    const maxcnt = (trk.maxdisp - trk.offset) / trk.gain;
    const range = maxcnt - mincnt;

    for (const rec of trk.recs) {
        if (!rec.val || typeof rec.val !== 'object') continue;

        let i = Math.floor((rec.dt - dtstart) * trk.srate);

        for (const v of rec.val) {
            if (i >= 0 && i < tlen) {
                if (v === 0) {
                    // 0 indicates no data (gap)
                    prev[i] = 0;
                } else {
                    // Normalize to 1-255 range (0 reserved for no data)
                    let norm = ((v - mincnt) / range) * 254 + 1;
                    norm = Math.max(1, Math.min(255, norm));
                    prev[i] = Math.floor(norm);
                }
            }
            i++;
        }
    }

    trk.prev = prev;
}

/**
 * Process numeric/string track
 * Converts to time series array
 */
function processDataTrack(trk, dtstart) {
    trk.data = trk.recs.map(rec => [rec.dt - dtstart, rec.val]);
}

/**
 * Get value at specific time from data track
 * @param {Object} trk - Track object
 * @param {number} time - Time in seconds from start
 * @param {number} maxAge - Maximum age of value in seconds (default 300)
 * @returns {*} - Value at time or null
 */
export function getValueAtTime(trk, time, maxAge = 300) {
    if (!trk || !trk.data || trk.data.length === 0) {
        return null;
    }

    for (let i = 0; i < trk.data.length; i++) {
        const [dt, v] = trk.data[i];

        if (dt > time) {
            // Found first value after current time
            if (i > 0) {
                const prevDt = trk.data[i - 1][0];
                // Check if previous value is not too old
                if (prevDt > time - maxAge) {
                    return trk.data[i - 1][1];
                }
            }
            return null;
        }

        // If this is the last record
        if (i === trk.data.length - 1 && dt <= time) {
            // Check if value is not too old
            if (dt > time - maxAge) {
                return v;
            }
        }
    }

    return null;
}
