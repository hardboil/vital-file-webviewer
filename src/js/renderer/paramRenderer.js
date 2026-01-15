/**
 * Parameter renderer
 * Draws numeric parameter values on canvas
 */

import { PAR_WIDTH, PAR_HEIGHT, PARAM_LAYOUTS } from '../constants.js';
import { getValueAtTime } from '../parser/trackProcessor.js';

/**
 * Draw parameter group
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} group - Parameter group configuration
 * @param {Object} vitalFile - Vital file data
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} currentTime - Current playback time
 * @returns {boolean} - True if anything was drawn
 */
export function drawParams(ctx, group, vitalFile, x, y, currentTime) {
  // Draw border
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(x, y, PAR_WIDTH, PAR_HEIGHT);

  // Get param values
  const nameValueArray = [];
  let valueExists = false;

  for (const paramName of group.params) {
    const track = vitalFile.montypeTrks[paramName];
    const val = getValueAtTime(track, currentTime);

    if (val !== null) {
      nameValueArray.push({
        name: track ? track.name : paramName,
        value: formatValue(val, track ? track.type : 2)
      });
      valueExists = true;
    } else {
      nameValueArray.push({
        name: track ? track.name : paramName,
        value: ''
      });
    }
  }

  if (!valueExists) return false;

  const layout = PARAM_LAYOUTS[group.layout] || PARAM_LAYOUTS['TWO'];

  // Handle special formatting
  processSpecialFormats(group, nameValueArray);

  // Get color (may be dynamic based on agent type)
  const color = getParamColor(group, nameValueArray);

  // Draw using layout
  for (let idx = 0; idx < layout.length && idx < nameValueArray.length; idx++) {
    const layoutElem = layout[idx];
    const item = nameValueArray[idx];

    // Draw value
    if (layoutElem.value && item.value !== '') {
      ctx.font = `${layoutElem.value.fontsize}px Arial`;
      ctx.fillStyle = color;
      ctx.textAlign = layoutElem.value.align || 'left';
      ctx.textBaseline = layoutElem.value.baseline || 'alphabetic';
      ctx.fillText(item.value, x + layoutElem.value.x, y + layoutElem.value.y);
    }

    // Draw name
    if (layoutElem.name) {
      ctx.font = '14px Arial';
      ctx.fillStyle = '#fff';
      ctx.textAlign = layoutElem.name.align || 'left';
      ctx.textBaseline = layoutElem.name.baseline || 'alphabetic';

      const str = item.name || group.name || '';
      const measuredWidth = ctx.measureText(str).width;
      const maxWidth = 75;

      if (measuredWidth > maxWidth) {
        ctx.save();
        ctx.scale(maxWidth / measuredWidth, 1);
        ctx.fillText(str, (x + layoutElem.name.x) * measuredWidth / maxWidth, y + layoutElem.name.y);
        ctx.restore();
      } else {
        ctx.fillText(str, x + layoutElem.name.x, y + layoutElem.name.y);
      }
    }
  }

  return true;
}

/**
 * Process special format handling (BP, AGENT abbreviations)
 */
function processSpecialFormats(group, nameValueArray) {
  // Handle AGENT name abbreviation
  if (group.name && group.name.startsWith('AGENT') && nameValueArray.length > 1) {
    const agentName = String(nameValueArray[1].value).toUpperCase();
    if (agentName === 'DESF') nameValueArray[1].value = 'DES';
    else if (agentName === 'ISOF') nameValueArray[1].value = 'ISO';
    else if (agentName === 'ENFL') nameValueArray[1].value = 'ENF';
  }

  // Handle BP layout
  if (group.layout === 'BP' && nameValueArray.length >= 3) {
    nameValueArray[0].name = group.name || '';
    const sbp = nameValueArray[0].value ? Math.round(parseFloat(nameValueArray[0].value)) : '';
    const dbp = nameValueArray[1].value ? Math.round(parseFloat(nameValueArray[1].value)) : '';
    nameValueArray[0].value = (sbp || ' ') + (dbp ? '/' + dbp : '');
    nameValueArray[2].value = nameValueArray[2].value ? '(' + Math.round(parseFloat(nameValueArray[2].value)) + ')' : '';
    nameValueArray[1] = nameValueArray[2];
    nameValueArray.pop();
  } else if (nameValueArray.length > 0 && !nameValueArray[0].name) {
    nameValueArray[0].name = group.name || '';
  }
}

/**
 * Get parameter color (with dynamic agent colors)
 */
export function getParamColor(group, nameValueArray) {
  // Special colors for anesthetic agents
  if (group.name && group.name.startsWith('AGENT') && nameValueArray.length > 1) {
    const agentName = nameValueArray[1].value;
    if (agentName === 'DES') return '#2296E6';    // Desflurane - blue
    if (agentName === 'ISO') return '#DDA0DD';    // Isoflurane - plum
    if (agentName === 'ENF') return '#FF0000';    // Enflurane - red
  }
  return group.color;
}

/**
 * Format numeric value for display
 * @param {*} val - Value to format
 * @param {number} type - Track type (2=numeric, 5=string)
 * @returns {string}
 */
export function formatValue(val, type) {
  // String type
  if (type === 5 || typeof val === 'string') {
    if (typeof val === 'string' && val.length > 4) {
      return val.substring(0, 4);
    }
    return String(val);
  }

  if (typeof val === 'string') {
    val = parseFloat(val);
  }

  if (typeof val !== 'number' || isNaN(val)) {
    return '';
  }

  // Format based on magnitude
  if (Math.abs(val) >= 100) {
    return Math.round(val).toString();
  } else if (val - Math.floor(val) < 0.05) {
    return Math.round(val).toString();
  } else {
    return val.toFixed(1);
  }
}
