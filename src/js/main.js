/**
 * VitalDB Viewer - Main Application
 * Entry point and module integration
 */

import { LOCAL_DATA_FILES, LOCAL_DATA_PATH, AUTO_LOAD } from './config.js';
import { VIEW_MODES, WAVE_GROUPS } from './constants.js';
import { getState, setState, subscribe, get, toggleTrackVisibility, setAllTracksVisibility, setTrackOrder, moveTrack, addMarker, removeMarker, setTimeRange } from './state.js';
import { CanvasRenderer, MinimapRenderer } from './renderer/index.js';
import { PlaybackController, FileLoader, setupDragDrop, setupFileInput, setupTrackViewInteraction, zoomIn, zoomOut, resetZoom, getZoomInfo } from './controls/index.js';
import { VitalDBClient, formatCaseDisplay } from './api/vitaldb.js';
import { formatTime } from './utils/time.js';
import { initSidebar, toggleSidebar } from './ui/sidebar.js';
import { showError, showSuccess, showInfo } from './ui/toast.js';
import { exportScreenshot, exportFullCSV, exportSelectionCSV } from './export/index.js';

// ============================================
// DOM Elements
// ============================================
const elements = {
  // Header
  btnToggleSidebar: document.getElementById('btn_toggle_sidebar'),
  viewModeSelect: document.getElementById('view_mode_select'),
  filename: document.getElementById('filename'),

  // Sidebar
  sidebar: document.getElementById('sidebar'),
  viewModeRadios: document.querySelectorAll('input[name="view_mode"]'),

  // Canvas
  mainCanvas: document.getElementById('main_canvas'),
  canvasContainer: document.getElementById('canvas_container'),
  welcomeMessage: document.getElementById('welcome_message'),

  // Minimap
  minimapContainer: document.getElementById('minimap_container'),
  minimapCanvas: document.getElementById('minimap_canvas'),

  // Playback Controls
  btnStart: document.getElementById('btn_start'),
  btnBack: document.getElementById('btn_back'),
  btnPlay: document.getElementById('btn_play'),
  btnForward: document.getElementById('btn_forward'),
  btnEnd: document.getElementById('btn_end'),
  speedButtons: document.getElementById('speed_buttons'),
  timeCurrent: document.getElementById('time_current'),
  timeTotal: document.getElementById('time_total'),
  timelineSlider: document.getElementById('timeline_slider'),

  // Zoom Controls
  zoomControls: document.getElementById('zoom_controls'),
  btnZoomIn: document.getElementById('btn_zoom_in'),
  btnZoomOut: document.getElementById('btn_zoom_out'),
  btnZoomReset: document.getElementById('btn_zoom_reset'),
  zoomLevel: document.getElementById('zoom_level'),

  // Markers
  markersSection: document.getElementById('markers_section'),
  btnAddMarker: document.getElementById('btn_add_marker'),
  markersList: document.getElementById('markers_list'),

  // Selection Info
  selectionInfo: document.getElementById('selection_info'),
  selectionRange: document.getElementById('selection_range'),
  btnClearSelection: document.getElementById('btn_clear_selection'),

  // Data Source
  dropZone: document.getElementById('drop_zone'),
  fileInput: document.getElementById('file_input'),
  btnBrowseVitaldb: document.getElementById('btn_browse_vitaldb'),
  localFileSelect: document.getElementById('local_file_select'),
  btnLoadLocal: document.getElementById('btn_load_local'),

  // Track Filter
  trackFilterList: document.getElementById('track_filter_list'),
  trackDisplayMode: document.getElementById('track_display_mode'),

  // Export
  btnExportScreenshot: document.getElementById('btn_export_screenshot'),
  btnExportCsv: document.getElementById('btn_export_csv'),

  // Loading
  loadingOverlay: document.getElementById('loading_overlay'),
  loadingText: document.getElementById('loading_text'),
  loadingBar: document.getElementById('loading_bar'),

  // VitalDB Modal
  vitaldbModal: document.getElementById('vitaldb_modal'),
  btnCloseModal: document.getElementById('btn_close_modal'),
  caseSearch: document.getElementById('case_search'),
  filterDepartment: document.getElementById('filter_department'),
  btnToggleAdvanced: document.getElementById('btn_toggle_advanced'),
  advancedFilters: document.getElementById('advanced_filters'),
  filterSex: document.getElementById('filter_sex'),
  filterAgeMin: document.getElementById('filter_age_min'),
  filterAgeMax: document.getElementById('filter_age_max'),
  filterDuration: document.getElementById('filter_duration'),
  caseList: document.getElementById('case_list'),

  // Patient Info
  patientInfoBar: document.getElementById('patient_info_bar'),
  patientCaseId: document.getElementById('patient_case_id'),
  patientSexAge: document.getElementById('patient_sex_age'),
  patientDepartment: document.getElementById('patient_department'),
  patientOpname: document.getElementById('patient_opname'),
  btnExpandPatientInfo: document.getElementById('btn_expand_patient_info'),
  patientInfoExpanded: document.getElementById('patient_info_expanded')
};

// ============================================
// Initialize Application
// ============================================
const renderer = new CanvasRenderer(elements.mainCanvas);
const minimapRenderer = new MinimapRenderer(elements.minimapCanvas);
const playback = new PlaybackController();
const vitaldbClient = new VitalDBClient();

const fileLoader = new FileLoader({
  onLoad: handleFileLoaded,
  onProgress: handleLoadProgress,
  onError: handleLoadError
});

let allCases = [];

// ============================================
// Event Handlers
// ============================================

function handleFileLoaded(vitalFile, filename) {
  renderer.setVitalFile(vitalFile);
  minimapRenderer.setVitalFile(vitalFile);
  elements.filename.textContent = filename;

  // Hide welcome message
  elements.welcomeMessage.classList.add('hidden');

  // Show minimap
  elements.minimapContainer.classList.remove('hidden');
  minimapRenderer.resize();

  // Update track filter
  updateTrackFilterList();

  // Enable export buttons
  elements.btnExportScreenshot.disabled = false;
  elements.btnExportCsv.disabled = false;

  // Start render loop
  playback.setOnFrame(() => {
    renderer.draw(get('currentTime'));
    minimapRenderer.draw();
  });
  playback.startAnimation();

  showSuccess(`Loaded: ${filename}`);
}

function handleLoadProgress(progress) {
  elements.loadingBar.style.width = `${progress}%`;
}

function handleLoadError(error) {
  elements.loadingOverlay.classList.add('hidden');
  showError(`Failed to load: ${error.message}`);
}

function updateUI(changed, state) {
  // Update loading overlay
  if ('isLoading' in changed) {
    elements.loadingOverlay.classList.toggle('hidden', !state.isLoading);
  }

  if ('loadingText' in changed) {
    elements.loadingText.textContent = state.loadingText;
  }

  // Update play button
  if ('isPlaying' in changed) {
    elements.btnPlay.textContent = state.isPlaying ? '⏸' : '▶';
    elements.btnPlay.classList.toggle('active', state.isPlaying);
  }

  // Update speed buttons
  if ('playSpeed' in changed) {
    elements.speedButtons.querySelectorAll('.speed-btn').forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.dataset.speed) === state.playSpeed);
    });
  }

  // Update time display
  if ('currentTime' in changed || 'duration' in changed) {
    elements.timeCurrent.textContent = formatTime(state.currentTime);
    elements.timeTotal.textContent = formatTime(state.duration);
    elements.timelineSlider.max = state.duration;
    elements.timelineSlider.value = state.currentTime;
  }

  // Update view mode
  if ('viewMode' in changed) {
    elements.viewModeSelect.value = state.viewMode;
    elements.viewModeRadios.forEach(radio => {
      radio.checked = radio.value === state.viewMode;
    });
    // Show/hide zoom controls based on view mode
    const isTrackView = state.viewMode === VIEW_MODES.TRACK;
    elements.zoomControls.classList.toggle('hidden', !isTrackView);
  }

  // Update zoom level display
  if ('zoomLevel' in changed) {
    const zoomInfo = getZoomInfo();
    elements.zoomLevel.textContent = `${zoomInfo.zoomPercent}%`;
  }

  // Update markers
  if ('markers' in changed) {
    updateMarkersList();
  }

  // Update selection range
  if ('selectedTimeRange' in changed) {
    const range = state.selectedTimeRange;
    if (range && Math.abs(range.end - range.start) > 0.5) {
      elements.selectionInfo.classList.remove('hidden');
      const duration = range.end - range.start;
      elements.selectionRange.textContent = `${formatTime(range.start)} - ${formatTime(range.end)} (${duration.toFixed(1)}s)`;
    } else {
      elements.selectionInfo.classList.add('hidden');
    }
  }
}

// ============================================
// Track Filter Functions
// ============================================

let draggedTrackItem = null;

function updateTrackFilterList() {
  const vitalFile = get('vitalFile');
  if (!vitalFile) {
    elements.trackFilterList.textContent = 'Load a file to see tracks';
    return;
  }

  // Clear list
  while (elements.trackFilterList.firstChild) {
    elements.trackFilterList.removeChild(elements.trackFilterList.firstChild);
  }

  const visibleTracks = get('visibleTracks');
  let trackOrder = get('trackOrder');

  // Get available groups with data
  const availableGroups = WAVE_GROUPS.filter(group => {
    const wavTrack = vitalFile.montypeTrks[group.wav];
    return wavTrack && wavTrack.prev && wavTrack.prev.length > 0;
  });

  // Initialize track order if empty
  if (trackOrder.length === 0) {
    trackOrder = availableGroups.map(g => g.name);
    setTrackOrder(trackOrder);
  }

  // Sort groups by trackOrder
  const sortedGroups = [...availableGroups].sort((a, b) => {
    const indexA = trackOrder.indexOf(a.name);
    const indexB = trackOrder.indexOf(b.name);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  for (const group of sortedGroups) {
    const item = document.createElement('div');
    item.className = 'track-filter-item';
    item.draggable = true;
    item.dataset.trackName = group.name;

    // Drag handle
    const dragHandle = document.createElement('span');
    dragHandle.className = 'drag-handle';
    dragHandle.textContent = '⋮⋮';
    dragHandle.title = 'Drag to reorder';

    const label = document.createElement('label');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = visibleTracks[group.name] !== false;
    checkbox.addEventListener('change', () => {
      toggleTrackVisibility(group.name);
    });

    const colorDot = document.createElement('span');
    colorDot.className = 'track-color-dot';
    colorDot.style.backgroundColor = group.color;

    const nameSpan = document.createElement('span');
    nameSpan.textContent = group.name;

    label.appendChild(checkbox);
    label.appendChild(colorDot);
    label.appendChild(nameSpan);

    item.appendChild(dragHandle);
    item.appendChild(label);

    // Drag events
    item.addEventListener('dragstart', handleTrackDragStart);
    item.addEventListener('dragend', handleTrackDragEnd);
    item.addEventListener('dragover', handleTrackDragOver);
    item.addEventListener('drop', handleTrackDrop);
    item.addEventListener('dragleave', handleTrackDragLeave);

    elements.trackFilterList.appendChild(item);
  }
}

function handleTrackDragStart(e) {
  draggedTrackItem = e.currentTarget;
  e.currentTarget.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', e.currentTarget.dataset.trackName);
}

function handleTrackDragEnd(e) {
  e.currentTarget.classList.remove('dragging');
  draggedTrackItem = null;
  // Remove all drag-over classes
  elements.trackFilterList.querySelectorAll('.drag-over').forEach(el => {
    el.classList.remove('drag-over');
  });
}

function handleTrackDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  const item = e.currentTarget;
  if (item !== draggedTrackItem) {
    item.classList.add('drag-over');
  }
}

function handleTrackDragLeave(e) {
  e.currentTarget.classList.remove('drag-over');
}

function handleTrackDrop(e) {
  e.preventDefault();
  const targetItem = e.currentTarget;
  targetItem.classList.remove('drag-over');

  if (!draggedTrackItem || targetItem === draggedTrackItem) return;

  const draggedName = draggedTrackItem.dataset.trackName;
  const targetName = targetItem.dataset.trackName;

  // Get current order
  const order = [...get('trackOrder')];
  const draggedIndex = order.indexOf(draggedName);
  const targetIndex = order.indexOf(targetName);

  if (draggedIndex === -1 || targetIndex === -1) return;

  // Reorder
  order.splice(draggedIndex, 1);
  order.splice(targetIndex, 0, draggedName);

  setTrackOrder(order);
  updateTrackFilterList();
}

// ============================================
// Marker Functions
// ============================================

function updateMarkersList() {
  const markers = get('markers');

  // Clear list
  while (elements.markersList.firstChild) {
    elements.markersList.removeChild(elements.markersList.firstChild);
  }

  if (!markers || markers.length === 0) return;

  for (const marker of markers) {
    const btn = document.createElement('button');
    btn.className = 'marker-btn';
    btn.title = `${marker.label} - ${formatTime(marker.time)}`;

    const labelSpan = document.createElement('span');
    labelSpan.className = 'marker-label';
    labelSpan.textContent = marker.label;

    const deleteBtn = document.createElement('span');
    deleteBtn.className = 'marker-delete';
    deleteBtn.textContent = '×';
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      removeMarker(marker.id);
    });

    btn.appendChild(labelSpan);
    btn.appendChild(deleteBtn);

    btn.addEventListener('click', () => {
      playback.seekTo(marker.time);
    });

    elements.markersList.appendChild(btn);
  }
}

function handleAddMarker() {
  const currentTime = get('currentTime');
  const markers = get('markers');
  const label = String.fromCharCode(65 + markers.length); // A, B, C, ...
  addMarker(label);
  updateMarkersList();
  showInfo(`Marker ${label} added at ${formatTime(currentTime)}`);
}

// ============================================
// View Mode Functions
// ============================================

function setViewMode(mode) {
  setState({ viewMode: mode });
}

function toggleViewMode() {
  const current = get('viewMode');
  const newMode = current === VIEW_MODES.MONITOR ? VIEW_MODES.TRACK : VIEW_MODES.MONITOR;
  setViewMode(newMode);
}

function toggleTrackFilter() {
  const section = document.getElementById('track_filter_section');
  if (section) {
    section.classList.toggle('hidden');
  }
}

// ============================================
// Local Data Files Functions
// ============================================

function populateLocalFileSelect() {
  while (elements.localFileSelect.options.length > 1) {
    elements.localFileSelect.remove(1);
  }

  for (const file of LOCAL_DATA_FILES) {
    const option = document.createElement('option');
    option.value = file.id;
    option.textContent = file.label;
    elements.localFileSelect.appendChild(option);
  }
}

// ============================================
// Patient Info Functions
// ============================================

function updatePatientInfo(caseData) {
  if (!caseData) {
    elements.patientInfoBar.classList.add('hidden');
    renderer.resize();
    return;
  }

  elements.patientCaseId.textContent = `Case ${String(caseData.caseid).padStart(4, '0')}`;
  elements.patientSexAge.textContent = `${caseData.sex || '?'}/${caseData.age || '?'}`;
  elements.patientDepartment.textContent = caseData.department || 'Unknown';
  elements.patientOpname.textContent = caseData.opname || '';
  elements.patientInfoBar.classList.remove('hidden');
  renderer.resize();
}

// ============================================
// VitalDB Modal Functions
// ============================================

async function openVitalDBModal() {
  elements.vitaldbModal.classList.remove('hidden');

  if (allCases.length === 0) {
    elements.caseList.textContent = 'Loading cases...';

    try {
      allCases = await vitaldbClient.getCases();
      populateDepartmentFilter();
      renderCaseList(allCases);
    } catch (err) {
      elements.caseList.textContent = `Failed to load cases: ${err.message}`;
    }
  }
}

function closeVitalDBModal() {
  elements.vitaldbModal.classList.add('hidden');
}

function populateDepartmentFilter() {
  const depts = vitaldbClient.getDepartments(allCases);

  while (elements.filterDepartment.options.length > 1) {
    elements.filterDepartment.remove(1);
  }

  for (const dept of depts) {
    const option = document.createElement('option');
    option.value = dept;
    option.textContent = dept;
    elements.filterDepartment.appendChild(option);
  }
}

function filterCaseList() {
  const filtered = vitaldbClient.filterCases(allCases, {
    search: elements.caseSearch.value,
    department: elements.filterDepartment.value,
    sex: elements.filterSex?.value || '',
    ageMin: elements.filterAgeMin?.value || '',
    ageMax: elements.filterAgeMax?.value || '',
    duration: elements.filterDuration?.value || ''
  });
  renderCaseList(filtered.slice(0, 100));
}

function renderCaseList(cases) {
  // Clear list
  while (elements.caseList.firstChild) {
    elements.caseList.removeChild(elements.caseList.firstChild);
  }

  if (cases.length === 0) {
    const msg = document.createElement('div');
    msg.className = 'text-center text-gray-400 py-8';
    msg.textContent = 'No cases found';
    elements.caseList.appendChild(msg);
    return;
  }

  for (const c of cases) {
    const display = formatCaseDisplay(c);

    const item = document.createElement('div');
    item.className = 'case-item';

    const info = document.createElement('div');
    info.className = 'case-info';

    const idSpan = document.createElement('span');
    idSpan.className = 'case-id';
    idSpan.textContent = display.label;

    const metaSpan = document.createElement('span');
    metaSpan.className = 'case-meta';
    metaSpan.textContent = display.meta;

    info.appendChild(idSpan);
    info.appendChild(metaSpan);

    const loadBtn = document.createElement('button');
    loadBtn.className = 'case-load-btn';
    loadBtn.textContent = 'Load';
    loadBtn.addEventListener('click', async () => {
      closeVitalDBModal();
      const caseData = allCases.find(x => x.caseid == display.id);
      const url = vitaldbClient.getDownloadUrl(display.id);
      await fileLoader.loadFromUrl(url);
      updatePatientInfo(caseData);
    });

    item.appendChild(info);
    item.appendChild(loadBtn);
    elements.caseList.appendChild(item);
  }
}

// ============================================
// Setup Event Listeners
// ============================================

function setupEventListeners() {
  // Subscribe to state changes
  subscribe(updateUI);

  // Window resize
  window.addEventListener('resize', () => {
    renderer.resize();
    minimapRenderer.resize();
  });

  // Sidebar
  initSidebar(elements.sidebar, elements.btnToggleSidebar, () => renderer.resize());

  // View mode select (header)
  elements.viewModeSelect.addEventListener('change', (e) => {
    setViewMode(e.target.value);
  });

  // View mode radios (sidebar)
  elements.viewModeRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      if (e.target.checked) {
        setViewMode(e.target.value);
      }
    });
  });

  // Transport controls
  elements.btnStart.addEventListener('click', () => playback.goToStart());
  elements.btnBack.addEventListener('click', () => playback.seekBackward());
  elements.btnPlay.addEventListener('click', () => playback.togglePlay());
  elements.btnForward.addEventListener('click', () => playback.seekForward());
  elements.btnEnd.addEventListener('click', () => playback.goToEnd());

  // Speed buttons
  elements.speedButtons.addEventListener('click', (e) => {
    if (e.target.classList.contains('speed-btn')) {
      playback.setSpeed(parseInt(e.target.dataset.speed));
    }
  });

  // Timeline slider
  elements.timelineSlider.addEventListener('input', (e) => {
    playback.seekTo(parseFloat(e.target.value));
  });

  // Drag and drop
  setupDragDrop(elements.dropZone, {
    loadLocalFile: async (file) => {
      await fileLoader.loadLocalFile(file);
      updatePatientInfo(null);
    }
  });

  setupFileInput(elements.fileInput, {
    loadLocalFile: async (file) => {
      await fileLoader.loadLocalFile(file);
      updatePatientInfo(null);
    }
  });

  // Local data files
  elements.localFileSelect.addEventListener('change', () => {
    elements.btnLoadLocal.disabled = !elements.localFileSelect.value;
  });

  elements.btnLoadLocal.addEventListener('click', async () => {
    const fileId = elements.localFileSelect.value;
    const fileInfo = LOCAL_DATA_FILES.find(f => f.id === fileId);
    if (fileInfo) {
      const url = LOCAL_DATA_PATH + fileInfo.filename;
      await fileLoader.loadFromUrl(url);
      updatePatientInfo(null);
    }
  });

  // VitalDB browser
  elements.btnBrowseVitaldb.addEventListener('click', openVitalDBModal);
  elements.btnCloseModal.addEventListener('click', closeVitalDBModal);
  elements.vitaldbModal.addEventListener('click', (e) => {
    if (e.target === elements.vitaldbModal) {
      closeVitalDBModal();
    }
  });

  elements.caseSearch.addEventListener('input', filterCaseList);
  elements.filterDepartment.addEventListener('change', filterCaseList);

  // Advanced filters toggle
  elements.btnToggleAdvanced?.addEventListener('click', () => {
    elements.advancedFilters?.classList.toggle('hidden');
  });

  // Advanced filter inputs
  elements.filterSex?.addEventListener('change', filterCaseList);
  elements.filterAgeMin?.addEventListener('input', filterCaseList);
  elements.filterAgeMax?.addEventListener('input', filterCaseList);
  elements.filterDuration?.addEventListener('input', filterCaseList);

  // Patient info expand
  elements.btnExpandPatientInfo?.addEventListener('click', () => {
    const expanded = elements.patientInfoBar.classList.toggle('expanded');
    elements.patientInfoExpanded?.classList.toggle('hidden', !expanded);
    renderer.resize();
  });

  // Add marker
  elements.btnAddMarker?.addEventListener('click', handleAddMarker);

  // Clear selection
  elements.btnClearSelection?.addEventListener('click', () => {
    setTimeRange(null, null);
  });

  // Track display mode
  elements.trackDisplayMode?.addEventListener('change', (e) => {
    setState({ trackDisplayMode: e.target.value });
  });

  // Track View mouse interactions (zoom, pan, click-to-seek, range selection)
  setupTrackViewInteraction(elements.mainCanvas, {
    onSeek: (time) => playback.seekTo(time),
    onRedraw: () => renderer.draw(get('currentTime'))
  });

  // Zoom controls
  elements.btnZoomIn?.addEventListener('click', () => {
    zoomIn();
    renderer.draw(get('currentTime'));
  });

  elements.btnZoomOut?.addEventListener('click', () => {
    zoomOut();
    renderer.draw(get('currentTime'));
  });

  elements.btnZoomReset?.addEventListener('click', () => {
    resetZoom();
    renderer.draw(get('currentTime'));
  });

  // Export buttons
  elements.btnExportScreenshot?.addEventListener('click', () => {
    exportScreenshot(elements.mainCanvas);
  });

  elements.btnExportCsv?.addEventListener('click', () => {
    const vitalFile = get('vitalFile');
    const selectedRange = get('selectedTimeRange');
    if (selectedRange && Math.abs(selectedRange.end - selectedRange.start) > 0.5) {
      // Export selected range
      exportSelectionCSV(vitalFile);
    } else {
      // Export full data
      exportFullCSV(vitalFile);
    }
  });

  // Keyboard shortcuts
  playback.setupKeyboardShortcuts({
    onToggleSidebar: toggleSidebar,
    onToggleViewMode: toggleViewMode,
    onToggleTrackFilter: toggleTrackFilter,
    onAddMarker: handleAddMarker,
    onScreenshot: () => {
      if (get('vitalFile')) {
        exportScreenshot(elements.mainCanvas);
      }
    },
    onExport: () => {
      const vitalFile = get('vitalFile');
      if (vitalFile) {
        const selectedRange = get('selectedTimeRange');
        if (selectedRange && Math.abs(selectedRange.end - selectedRange.start) > 0.5) {
          exportSelectionCSV(vitalFile);
        } else {
          exportFullCSV(vitalFile);
        }
      }
    },
    onZoomIn: () => {
      if (get('viewMode') === VIEW_MODES.TRACK) {
        zoomIn();
        renderer.draw(get('currentTime'));
      }
    },
    onZoomOut: () => {
      if (get('viewMode') === VIEW_MODES.TRACK) {
        zoomOut();
        renderer.draw(get('currentTime'));
      }
    },
    onResetZoom: () => {
      if (get('viewMode') === VIEW_MODES.TRACK) {
        resetZoom();
        renderer.draw(get('currentTime'));
      }
    }
  });
}

// ============================================
// Auto-Load Functions
// ============================================

async function autoLoadRandomCase() {
  if (!AUTO_LOAD.enabled) return;

  try {
    if (AUTO_LOAD.source === 'vitaldb') {
      const cases = await vitaldbClient.getCases();
      if (cases.length > 0) {
        const randomIndex = Math.floor(Math.random() * cases.length);
        const randomCase = cases[randomIndex];
        const url = vitaldbClient.getDownloadUrl(randomCase.caseid);
        await fileLoader.loadFromUrl(url);
        updatePatientInfo(randomCase);
        if (AUTO_LOAD.autoPlay) {
          playback.play();
        }
      }
    } else if (AUTO_LOAD.source === 'local') {
      const fileIndex = AUTO_LOAD.localFileIndex;
      if (fileIndex >= 0 && fileIndex < LOCAL_DATA_FILES.length) {
        const fileInfo = LOCAL_DATA_FILES[fileIndex];
        const url = LOCAL_DATA_PATH + fileInfo.filename;
        await fileLoader.loadFromUrl(url);
        updatePatientInfo(null);
        if (AUTO_LOAD.autoPlay) {
          playback.play();
        }
      }
    }
  } catch (err) {
    console.warn('Auto-load failed:', err.message);
  }
}

// ============================================
// Initialize
// ============================================

function init() {
  // Setup
  renderer.resize();
  minimapRenderer.resize();
  populateLocalFileSelect();
  setupEventListeners();

  // Setup minimap interaction
  minimapRenderer.setOnSeek((time) => playback.seekTo(time));
  minimapRenderer.setupInteraction();

  console.log('VitalDB Viewer initialized');

  // Auto-load if enabled
  autoLoadRandomCase();
}

// Start application
init();
