/**
 * VitalDB Viewer Constants
 * Monitor types, layouts, wave groups, parameter groups
 */

// Monitor Types mapping (montype code -> parameter name)
export const MONTYPES = {
  1: 'ECG_WAV', 2: 'ECG_HR', 3: 'ECG_PVC', 4: 'IABP_WAV', 5: 'IABP_SBP',
  6: 'IABP_DBP', 7: 'IABP_MBP', 8: 'PLETH_WAV', 9: 'PLETH_HR', 10: 'PLETH_SPO2',
  11: 'RESP_WAV', 12: 'RESP_RR', 13: 'CO2_WAV', 14: 'CO2_RR', 15: 'CO2_CONC',
  16: 'NIBP_SBP', 17: 'NIBP_DBP', 18: 'NIBP_MBP', 19: 'BT', 20: 'CVP_WAV',
  21: 'CVP_CVP', 22: 'EEG_BIS', 23: 'TV', 24: 'MV', 25: 'PIP',
  26: 'AGENT1_NAME', 27: 'AGENT1_CONC', 28: 'AGENT2_NAME', 29: 'AGENT2_CONC',
  30: 'DRUG1_NAME', 31: 'DRUG1_CE', 32: 'DRUG2_NAME', 33: 'DRUG2_CE',
  34: 'CO', 36: 'EEG_SEF', 38: 'PEEP', 39: 'ECG_ST', 40: 'AGENT3_NAME',
  41: 'AGENT3_CONC', 42: 'STO2_L', 43: 'STO2_R', 44: 'EEG_WAV',
  45: 'FLUID_RATE', 46: 'FLUID_TOTAL', 47: 'SVV', 49: 'DRUG3_NAME',
  50: 'DRUG3_CE', 70: 'PSI', 71: 'PVI', 72: 'SPHB', 73: 'ORI', 75: 'ASKNA',
  76: 'PAP_SBP', 77: 'PAP_MBP', 78: 'PAP_DBP', 79: 'FEM_SBP', 80: 'FEM_MBP',
  81: 'FEM_DBP', 82: 'EEG_SEFL', 83: 'EEG_SEFR', 84: 'EEG_SR',
  85: 'TOF_RATIO', 86: 'TOF_CNT', 87: 'SKNA_WAV', 88: 'ICP', 89: 'CPP',
  90: 'ICP_WAV', 91: 'PAP_WAV', 92: 'FEM_WAV', 93: 'ALARM_LEVEL',
  95: 'EEGL_WAV', 96: 'EEGR_WAV', 97: 'ANII', 98: 'ANIM', 99: 'PTC_CNT'
};

// Layout dimensions
export const PAR_WIDTH = 160;
export const PAR_HEIGHT = 80;

// Parameter display layouts
export const PARAM_LAYOUTS = {
  'ONE': [
    { name: { baseline: 'top', x: 5, y: 5 }, value: { fontsize: 40, align: 'right', x: PAR_WIDTH - 5, y: PAR_HEIGHT - 10 } }
  ],
  'TWO': [
    { name: { baseline: 'top', x: 5, y: 5 }, value: { fontsize: 40, align: 'right', x: PAR_WIDTH - 5, y: 42 } },
    { name: { baseline: 'bottom', x: 5, y: PAR_HEIGHT - 4 }, value: { fontsize: 24, align: 'right', x: PAR_WIDTH - 5, y: PAR_HEIGHT - 8 } }
  ],
  'LR': [
    { name: { baseline: 'top', x: 5, y: 5 }, value: { fontsize: 40, align: 'left', x: 5, y: PAR_HEIGHT - 10 } },
    { name: { align: 'right', baseline: 'top', x: PAR_WIDTH - 3, y: 4 }, value: { fontsize: 40, align: 'right', x: PAR_WIDTH - 5, y: PAR_HEIGHT - 10 } }
  ],
  'BP': [
    { name: { baseline: 'top', x: 5, y: 5 }, value: { fontsize: 38, align: 'right', x: PAR_WIDTH - 5, y: 37 } },
    { value: { fontsize: 38, align: 'right', x: PAR_WIDTH - 5, y: PAR_HEIGHT - 8 } }
  ],
  'VNT': [
    { name: { baseline: 'top', x: 5, y: 5 }, value: { fontsize: 38, align: 'right', x: PAR_WIDTH - 45, y: 37 } },
    { value: { fontsize: 30, align: 'right', x: PAR_WIDTH - 5, y: 37 } },
    { value: { fontsize: 24, align: 'right', x: PAR_WIDTH - 5, y: PAR_HEIGHT - 8 } }
  ]
};

// Wave groups configuration (waveform + related parameters)
export const WAVE_GROUPS = [
  { name: 'ECG', wav: 'ECG_WAV', color: '#00FF00', layout: 'TWO', params: ['ECG_HR', 'ECG_PVC'] },
  { name: 'ART', wav: 'IABP_WAV', color: '#FF0000', layout: 'BP', params: ['IABP_SBP', 'IABP_DBP', 'IABP_MBP'] },
  { name: 'PLETH', wav: 'PLETH_WAV', color: '#82CEFC', layout: 'TWO', params: ['PLETH_SPO2', 'PLETH_HR'] },
  { name: 'CVP', wav: 'CVP_WAV', color: '#FAA804', layout: 'ONE', params: ['CVP_CVP'] },
  { name: 'EEG', wav: 'EEG_WAV', color: '#DAA2DC', layout: 'TWO', params: ['EEG_BIS', 'EEG_SEF'] },
  { name: 'RESP', wav: 'RESP_WAV', color: '#FFFF00', layout: 'ONE', params: ['RESP_RR'] },
  { name: 'CO2', wav: 'CO2_WAV', color: '#FFFF00', layout: 'TWO', params: ['CO2_CONC', 'CO2_RR'] },
  { name: 'PAP', wav: 'PAP_WAV', color: '#FF0000', layout: 'BP', params: ['PAP_SBP', 'PAP_DBP', 'PAP_MBP'] },
  { name: 'FEM', wav: 'FEM_WAV', color: '#FF0000', layout: 'BP', params: ['FEM_SBP', 'FEM_DBP', 'FEM_MBP'] },
  { name: 'SKNA', wav: 'SKNA_WAV', color: '#00FF00', layout: 'ONE', params: ['ASKNA'] },
  { name: 'ICP', wav: 'ICP_WAV', color: '#FFFFFF', layout: 'TWO', params: ['ICP', 'CPP'] },
  { name: 'MASIMO', wav: 'EEGL_WAV', color: '#DAA2DC', layout: 'TWO', params: ['PSI', 'EEG_SEFL', 'EEG_SEFR'] }
];

// Non-wave parameter groups
export const PARAM_GROUPS = [
  { name: 'AGENT1', color: '#FAA804', layout: 'TWO', params: ['AGENT1_CONC', 'AGENT1_NAME'] },
  { name: 'AGENT2', color: '#FAA804', layout: 'TWO', params: ['AGENT2_CONC', 'AGENT2_NAME'] },
  { name: 'AGENT3', color: '#FAA804', layout: 'TWO', params: ['AGENT3_CONC', 'AGENT3_NAME'] },
  { name: 'DRUG1', color: '#9ACE34', layout: 'TWO', params: ['DRUG1_CE', 'DRUG1_NAME'] },
  { name: 'DRUG2', color: '#9ACE34', layout: 'TWO', params: ['DRUG2_CE', 'DRUG2_NAME'] },
  { name: 'DRUG3', color: '#9ACE34', layout: 'TWO', params: ['DRUG3_CE', 'DRUG3_NAME'] },
  { name: 'VNT', color: '#FFFFFF', layout: 'VNT', params: ['TV', 'RESP_RR', 'PIP', 'PEEP'] },
  { name: 'NMT', color: '#F08080', layout: 'VNT', params: ['TOF_RATIO', 'TOF_CNT', 'PTC_CNT'] },
  { name: 'NIBP', color: '#FFFFFF', layout: 'BP', params: ['NIBP_SBP', 'NIBP_DBP', 'NIBP_MBP'] },
  { name: 'CARTIC', color: '#FFC0CB', layout: 'TWO', params: ['CO', 'SVV'] },
  { name: 'STO2', color: '#FFFFFF', layout: 'LR', params: ['STO2_L', 'STO2_R'] },
  { name: 'FLUID', color: '#828284', layout: 'TWO', params: ['FLUID_RATE', 'FLUID_TOTAL'] },
  { name: 'BT', color: '#D2B48C', layout: 'ONE', params: ['BT'] },
  { color: '#FF0000', layout: 'TWO', params: ['SPHB', 'PVI'] },
  { color: '#FF7F51', layout: 'TWO', params: ['ANIM', 'ANII'] }
];

// Medical monitor color scheme
export const COLORS = {
  background: '#181818',
  panel: '#1a1a1a',
  card: '#222222',
  text: '#ffffff',
  textSecondary: '#888888',
  textMuted: '#bbbbbb',
  border: '#333333',
  borderLight: '#555555',
  accent: '#00ff00',
  eventTime: '#4EB8C9',
  deviceIndicator: '#348EC7',

  // Waveform colors
  waves: {
    ECG: '#00FF00',
    ART: '#FF0000',
    PLETH: '#82CEFC',
    CVP: '#FAA804',
    EEG: '#DAA2DC',
    RESP: '#FFFF00',
    CO2: '#00FFFF',
    PAP: '#FF0000',
    FEM: '#FF0000',
    SKNA: '#00FF00',
    ICP: '#FFFFFF',
    MASIMO: '#DAA2DC'
  }
};

// View modes
export const VIEW_MODES = {
  MONITOR: 'monitor',
  TRACK: 'track'
};

// Track display modes
export const TRACK_DISPLAY_MODES = {
  FIXED: 'fixed',
  SCROLL: 'scroll'
};
