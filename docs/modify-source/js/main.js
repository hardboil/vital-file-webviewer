/**
 * VitalDB Viewer - Main Application
 * Entry point and module integration
 */

import { LOCAL_DATA_FILES, LOCAL_DATA_PATH, AUTO_LOAD, PLAYBACK } from './config.js';
import { getState, setState, subscribe, get } from './state.js';
import { CanvasRenderer } from './renderer/index.js';
import { PlaybackController, FileLoader, setupDragDrop, setupFileInput } from './controls/index.js';
import { VitalDBClient, formatCaseDisplay } from './api/vitaldb.js';
import { formatTime } from './utils/time.js';

// ============================================
// DOM Elements
// ============================================
const elements = {
    // Canvas
    canvas: document.getElementById('monitor_canvas'),
    canvasArea: document.getElementById('canvas_area'),

    // Sidebar
    filename: document.getElementById('filename'),

    // Playback Controls (Bottom)
    btnStart: document.getElementById('btn_start'),
    btnBack: document.getElementById('btn_back'),
    btnPlay: document.getElementById('btn_play'),
    btnForward: document.getElementById('btn_forward'),
    btnEnd: document.getElementById('btn_end'),
    speedButtons: document.getElementById('speed_buttons'),
    timeCurrent: document.getElementById('time_current'),
    timeTotal: document.getElementById('time_total'),
    timelineSlider: document.getElementById('timeline_slider'),

    // Data Source (Sidebar)
    dropZone: document.getElementById('drop_zone'),
    fileSelectTrigger: document.getElementById('file_select_trigger'),
    fileInput: document.getElementById('file_input'),
    urlInput: document.getElementById('url_input'),
    btnLoadUrl: document.getElementById('btn_load_url'),
    localFileSelect: document.getElementById('local_file_select'),
    btnLoadLocal: document.getElementById('btn_load_local'),
    btnBrowseVitaldb: document.getElementById('btn_browse_vitaldb'),

    // Loading
    loadingOverlay: document.getElementById('loading_overlay'),
    loadingText: document.getElementById('loading_text'),
    loadingBar: document.getElementById('loading_bar'),

    // VitalDB Modal
    vitaldbModal: document.getElementById('vitaldb_modal'),
    btnCloseModal: document.getElementById('btn_close_modal'),
    caseSearch: document.getElementById('case_search'),
    filterDepartment: document.getElementById('filter_department'),
    caseList: document.getElementById('case_list'),

    // Patient Info Bar
    patientInfoBar: document.getElementById('patient_info_bar'),
    patientCaseId: document.getElementById('patient_case_id'),
    patientSexAge: document.getElementById('patient_sex_age'),
    patientDepartment: document.getElementById('patient_department'),
    patientOpname: document.getElementById('patient_opname')
};

// ============================================
// Initialize Application
// ============================================
const renderer = new CanvasRenderer(elements.canvas);
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
    elements.filename.textContent = filename;

    // Start render loop
    playback.setOnFrame(() => {
        renderer.draw(get('currentTime'));
    });
    playback.startAnimation();
}

function handleLoadProgress(progress) {
    elements.loadingBar.style.width = `${progress}%`;
}

function handleLoadError(error) {
    elements.loadingOverlay.classList.add('hidden');
    alert(`Failed to load file: ${error.message}`);
}

function updateUI(changed, state) {
    // Update loading overlay
    if ('isLoading' in changed) {
        elements.loadingOverlay.classList.toggle('hidden', !state.isLoading);
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
}

// ============================================
// Setup Event Listeners
// ============================================

function setupEventListeners() {
    // Subscribe to state changes
    subscribe(updateUI);

    // Window resize
    window.addEventListener('resize', () => renderer.resize());

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

    // Data source options (Sidebar)
    document.querySelectorAll('.source-option').forEach(option => {
        option.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT' && e.target.type !== 'radio') {
                return;
            }
            document.querySelectorAll('.source-option').forEach(o => o.classList.remove('selected'));
            option.classList.add('selected');
            const radio = option.querySelector('input[type="radio"]');
            if (radio) radio.checked = true;
        });
    });

    // File select trigger
    elements.fileSelectTrigger.addEventListener('click', () => {
        elements.fileInput.click();
    });

    // Drag and drop (with patient info clear)
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

    // URL load (hidden but kept for future use)
    if (elements.btnLoadUrl) {
        elements.btnLoadUrl.addEventListener('click', () => {
            const url = elements.urlInput.value.trim();
            if (url) {
                fileLoader.loadFromUrl(url);
            }
        });
    }

    if (elements.urlInput) {
        elements.urlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && elements.btnLoadUrl) {
                elements.btnLoadUrl.click();
            }
        });
    }

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
            updatePatientInfo(null); // Clear patient info for local files
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

    // Keyboard shortcuts
    playback.setupKeyboardShortcuts();
}

// ============================================
// DOM Helper Functions (Safe DOM manipulation)
// ============================================

function clearElement(element) {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
}

function createOption(value, text) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = text;
    return option;
}

function createMessageDiv(message, color = '#888') {
    const div = document.createElement('div');
    div.style.padding = '20px';
    div.style.color = color;
    div.textContent = message;
    return div;
}

function createCaseItem(display, onLoad) {
    const item = document.createElement('div');
    item.className = 'case-item';
    item.dataset.caseid = display.id;

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
    loadBtn.addEventListener('click', () => onLoad(display.id));

    item.appendChild(info);
    item.appendChild(loadBtn);

    return item;
}

// ============================================
// Local Data Files Functions
// ============================================

function populateLocalFileSelect() {
    clearElement(elements.localFileSelect);
    elements.localFileSelect.appendChild(createOption('', 'Select a file...'));
    for (const file of LOCAL_DATA_FILES) {
        elements.localFileSelect.appendChild(createOption(file.id, file.label));
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
// Auto-Load Functions
// ============================================

async function autoLoadRandomCase() {
    if (!AUTO_LOAD.enabled) {
        return;
    }

    try {
        if (AUTO_LOAD.source === 'vitaldb') {
            // Load random case from VitalDB Open Dataset
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
            // Load from local data files
            const fileIndex = AUTO_LOAD.localFileIndex;
            if (fileIndex >= 0 && fileIndex < LOCAL_DATA_FILES.length) {
                const fileInfo = LOCAL_DATA_FILES[fileIndex];
                const url = LOCAL_DATA_PATH + fileInfo.filename;
                await fileLoader.loadFromUrl(url);
                updatePatientInfo(null); // Hide for local files
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
// VitalDB Modal Functions
// ============================================

async function openVitalDBModal() {
    elements.vitaldbModal.classList.remove('hidden');

    if (allCases.length === 0) {
        clearElement(elements.caseList);
        elements.caseList.appendChild(createMessageDiv('Loading cases...'));

        try {
            allCases = await vitaldbClient.getCases();
            populateDepartmentFilter();
            renderCaseList(allCases);
        } catch (err) {
            clearElement(elements.caseList);
            elements.caseList.appendChild(
                createMessageDiv(`Failed to load cases: ${err.message}`, '#ff6666')
            );
        }
    }
}

function closeVitalDBModal() {
    elements.vitaldbModal.classList.add('hidden');
}

function populateDepartmentFilter() {
    const depts = vitaldbClient.getDepartments(allCases);
    clearElement(elements.filterDepartment);
    elements.filterDepartment.appendChild(createOption('', 'All Departments'));
    for (const dept of depts) {
        elements.filterDepartment.appendChild(createOption(dept, dept));
    }
}

function filterCaseList() {
    const filtered = vitaldbClient.filterCases(allCases, {
        search: elements.caseSearch.value,
        department: elements.filterDepartment.value
    });
    renderCaseList(filtered.slice(0, 100));
}

function renderCaseList(cases) {
    clearElement(elements.caseList);

    if (cases.length === 0) {
        elements.caseList.appendChild(createMessageDiv('No cases found'));
        return;
    }

    const handleLoadCase = async (caseId) => {
        closeVitalDBModal();
        const caseData = allCases.find(c => c.caseid == caseId);
        const url = vitaldbClient.getDownloadUrl(caseId);
        await fileLoader.loadFromUrl(url);
        updatePatientInfo(caseData);
    };

    for (const c of cases) {
        const display = formatCaseDisplay(c);
        elements.caseList.appendChild(createCaseItem(display, handleLoadCase));
    }
}

// ============================================
// Initialize
// ============================================

function init() {
    // Setup
    renderer.resize();
    populateLocalFileSelect();
    setupEventListeners();

    console.log('VitalDB Viewer initialized');

    // Auto-load if enabled
    autoLoadRandomCase();
}

// Start application
init();
