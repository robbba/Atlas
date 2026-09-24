'use strict';

// ═══ CONSTANTS ═══════════════════════════════════════════════════════════════
const PALETTE = [
  '#2563eb','#3b82f6','#4f46e5','#6366f1','#7c3aed','#8b5cf6',
  '#a855f7','#c026d3','#db2777','#ec4899','#f43f5e','#e11d48',
  '#ef4444','#dc2626','#f97316','#ea580c','#f59e0b','#d97706',
  '#eab308','#65a30d','#10b981','#059669','#14b8a6','#0d9488',
  '#06b6d4','#0ea5e9','#0284c7','#64748b','#475569'
];
const SHIFT_PRESETS = ['0000-0800','0800-1600','1600-0000','0600-1800','0700-1900'];
const DEPT_BG_LIGHT  = ['#f0fdf4','#eff6ff','#fdf4ff','#fff7ed','#f0f9ff','#fefce8','#fdf2f8','#f7fee7','#fff1f2','#f5f3ff','#ecfdf5','#e0f2fe'];
const DEPT_ACC_LIGHT = ['#86efac','#93c5fd','#d8b4fe','#fdba74','#7dd3fc','#fde047','#f9a8d4','#a3e635','#fda4af','#c4b5fd','#6ee7b7','#7dd3fc'];
const DEPT_BG_DARK   = ['#052e16','#1e3a5f','#2e1065','#431407','#082f49','#422006','#500724','#1a2e05','#4c0519','#1e1b4b','#064e3b','#0c2340'];
const DEPT_ACC_DARK  = ['#166534','#1d4ed8','#6d28d9','#c2410c','#0369a1','#a16207','#be185d','#4d7c0f','#be123c','#4c1d95','#065f46','#0e7490'];
const SETTINGS_KEY = 'team-manager-app-settings';
const LEGACY_SETTINGS_KEY = 'team-status-app-settings';
const LEGACY_THEME_KEY = 'team-status-theme';
const LOCAL_STATE_KEY = 'team-manager-local-state';
const LOCAL_FILE_META_KEY = 'team-manager-file-meta';
const LOCAL_BACKUP_HANDLE_DB = 'team-manager-file-handles';
const LOCAL_BACKUP_HANDLE_STORE = 'handles';
const LOCAL_BACKUP_HANDLE_KEY = 'local-backup-json';
const LOCAL_PLANNER_DIRECTORY_KEY = 'local-planner-directory';
const LAST_BACKUP_TIMESTAMP_KEY = 'last-backup-timestamp';
const PORTABLE_DEFAULT_JSON_URL = './data.json';
const PORTABLE_DEFAULT_JSON_NAME = 'data.json';
const AUTO_SYNC_INTERVAL_MS = 30000;
const AUTO_BACKUP_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;
let localBackupFileHandle = null;
let localPlannerDirectoryHandle = null;
let activeFileName = '';
let remoteUpdateSource = 'none';
let portableDefaultLoadIssue = '';
let preferBrowserJsonFileInput = false;
function lsRemove(key) { try { window.localStorage.removeItem(key); } catch (err) { } }
function svgIcon(name, title = '') {
  const paths = {
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M20.5 15.5A8.5 8.5 0 0 1 8.5 3.5 8.5 8.5 0 1 0 20.5 15.5z"/>',
    evening: '<path d="M4 15a8 8 0 0 1 16 0"/><path d="M4 15h16"/><path d="M8 8.5 6.5 7M16 8.5 17.5 7M12 6V4"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    edit: '<path d="m4 16-.8 4.8L8 20l11.5-11.5a2.1 2.1 0 0 0-3-3z"/><path d="m14.5 6.5 3 3"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3"/>',
    chevronLeft: '<path d="m15 18-6-6 6-6"/>',
    chevronRight: '<path d="m9 18 6-6-6-6"/>',
    search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
    chevronUp: '<path d="m18 15-6-6-6 6"/>',
    chevronDown: '<path d="m6 9 6 6 6-6"/>',
    cornerDownRight: '<path d="M7 5v5a7 7 0 0 0 7 7h3"/><path d="m14 14 3 3-3 3"/>',
    history: '<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/><path d="M12 7v5l3 2"/>',
    sort: '<path d="m8 7 4-4 4 4M16 17l-4 4-4-4"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    report: '<path d="M5 20V10M12 20V4M19 20v-7"/>',
    teamSchedule: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 10h16M8 14h3M8 17h6"/>',
    cake: '<path d="M4 12h16v8H4z"/><path d="M4 16h16M8 12V9a2 2 0 0 1 4 0v3M12 12V8a2 2 0 0 1 4 0v4M7 5v2M12 4v2M17 5v2"/>',
    save: '<path d="M5 4h12l3 3v13H4V4z"/><path d="M8 4v6h8V4M8 20v-6h8v6"/>',
    sync: '<path d="M20 4v6h-6"/><path d="M4 20v-6h6"/><path d="M6.5 9.5A7 7 0 0 1 19 10"/><path d="M17.5 14.5A7 7 0 0 1 5 14"/>',
  };
  return `<svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="${title ? 'false' : 'true'}"${title ? ` role="img"><title>${esc(title)}</title>` : '>'}${paths[name] || ''}</svg>`;
}
async function toggleHostedOperationalCheck(employeeId, date, subjectKind, subjectKey) {
  return toggleHostedOperationalChecks(employeeId, [date]);
}
async function toggleHostedOperationalChecks(employeeId, dates) {
  if (!canHostedCheckOff()) return;
  const eligibleDates = dates.filter(date => cellActivities(employeeId, date).length || getEntryObj(`${employeeId}_${date}`)?.status);
  if (!eligibleDates.length) { showToast('No non-empty cells selected.', 3000); return; }
  const states = await Promise.all(eligibleDates.map(async date => {
    const query = new URLSearchParams({ employeeId: String(employeeId), date, subjectKind: 'schedule_cell', subjectKey: 'cell' });
    const response = await fetch(`/api/admin/operational-checks?${query}`, { cache: 'no-store' });
    const result = await response.json().catch(() => ({}));
    return { date, checked: !!result.check, query };
  }));
    const shouldRevoke = states.every(state => state.checked);
  const results = await Promise.all(states.map(state => fetch(`/api/admin/operational-checks${shouldRevoke ? `?${state.query}` : ''}`, {
    method: shouldRevoke ? 'DELETE' : 'PUT',
    headers: shouldRevoke ? undefined : { 'content-type': 'application/json' },
    body: shouldRevoke ? undefined : JSON.stringify({ employeeId, date: state.date, subjectKind: 'schedule_cell', subjectKey: 'cell' }),
  })));
  if (results.some(response => !response.ok)) { showToast('Could not update every selected cell.', 3500); return; }
  checkUndoStack.push({ employeeId, dates: [...eligibleDates], checked: !shouldRevoke });
  checkRedoStack = [];
  eligibleDates.forEach(date => {
    const localKey = `${employeeId}|${date}|schedule_cell|cell`;
    if (shouldRevoke) hostedOperationalChecks.delete(localKey); else hostedOperationalChecks.add(localKey);
    updateCell(employeeId, date);
  });
  closePicker();
  updateUndoButton();
}

async function applyHostedCheckState(employeeId, dates, checked) {
  for (const date of dates) {
    const query = new URLSearchParams({ employeeId: String(employeeId), date, subjectKind: 'schedule_cell', subjectKey: 'cell' });
    const current = await fetch(`/api/admin/operational-checks?${query}`, { cache: 'no-store' }).then(response => response.json()).catch(() => ({}));
    if (!!current.check === checked) continue;
    const response = await fetch(`/api/admin/operational-checks${checked ? '' : `?${query}`}`, {
      method: checked ? 'PUT' : 'DELETE',
      headers: checked ? { 'content-type': 'application/json' } : undefined,
      body: checked ? JSON.stringify({ employeeId, date, subjectKind: 'schedule_cell', subjectKey: 'cell' }) : undefined,
    });
    if (!response.ok) throw new Error('Could not update check-off.');
    const localKey = `${employeeId}|${date}|schedule_cell|cell`;
    if (checked) hostedOperationalChecks.add(localKey); else hostedOperationalChecks.delete(localKey);
    updateCell(employeeId, date);
  }
}
function shiftChangeIcon(title = 'Turnaround') {
  return `<svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="${title ? 'false' : 'true'}"${title ? ` role="img"><title>${esc(title)}</title>` : '>'}<circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/><path d="M5 4 3 7l3 1"/><path d="M3 7a9 9 0 0 1 15-2"/></svg>`;
}

// ═══ SAFE STORAGE ════════════════════════════════════════════════════════════
function lsGet(key) { try { return window.localStorage.getItem(key); } catch (err) { return null; } }
function lsSet(key, value) {
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch (err) {
    console.warn(`Browser storage write failed for ${key}:`, err);
    return false;
  }
}

// ═══ APP SETTINGS ════════════════════════════════════════════════════════════
const APP_VERSION = '0.3.0';
const DATA_VERSION = 9;
const DEFAULT_WORK_CODES = [];
const DEFAULT_SHIFT_TEMPLATES = [];
const LOCAL_ONLY_APP_SETTING_KEYS = [
  'darkMode', 'autoSaveEnabled', 'autoSyncEnabled', 'showOnlyConfirmedActivities', 'workwheelGridDisplayMode',
  'activityStatusFilter', 'jumpToTodayOnGridChange', 'specialDaysVisible',
];

let appSettings = {
  appName: 'Organisation',
  darkMode: false,
  autoSaveEnabled: true,
  autoSyncEnabled: true,
  showOnlyConfirmedActivities: false,
  activityStatusFilter: 'all',
  jumpToTodayOnGridChange: true,
  showLevelRankInSchedule: true,
  coreHoursPerDay: 7.5,
  coreWorkdayRange: '0730-1500',
  lightMax: 70,
  normalMax: 100,
  highMax: 120,
  planningHorizonDays: 0,
  planningHorizonColor: '#ef4444',
  holidays: [],
  specialDays: { recurring: [], oneOff: [] },
  specialDaysVisible: true,
  adminPasswordHash: '',
  departmentColors: {},
  subdepartmentColors: {},
  sectionColors: {},
  processColors: {},
  activityTypes: [],
  workCodes: [],
  shiftTemplates: [],
  summaryColumns: null,
  securityLabel: { enabled: false, text: 'CONFIDENTIAL', color: '#dc2626' },
  shiftRotationEnabled: false,
  shiftRotationRanges: { normal: '0730-1500', day: '0730-2400', evening: '1200-2000', night: '0000-0730' },
  shiftRotationColors: { normal: '#64748b', day: '#f59e0b', evening: '#14b8a6', night: '#3b82f6', turn: '#8b5cf6', leave: '#b45309', overtime: '#dc2626' },
  shiftTeams: [],
  workwheelEnabled: false,
  workwheelUpcomingDays: 14,
  workwheelGridDisplayMode: 'cells',
  myScheduleLookaheadDays: 31,
  bugReportEnabled: false,
  bugTracker: [],
};

function normalizeHexColor(color, fallback = '#3b82f6') {
  if (typeof color !== 'string') return fallback;
  const value = color.trim();
  return /^#[0-9a-fA-F]{3,8}$/.test(value) ? value : fallback;
}
function normalizeBugTracker(value) {
  return (Array.isArray(value) ? value : []).map((item, index) => ({
    id: String(item?.id || `bug-${Date.now()}-${index}`),
    date: /^\d{4}-\d{2}-\d{2}$/.test(String(item?.date || '')) ? String(item.date) : todayStr(),
    poc: String(item?.poc || '').trim().slice(0, 120),
    description: String(item?.description || '').trim().slice(0, 4000),
    createdAt: String(item?.createdAt || ''),
  })).filter(item => item.poc || item.description);
}
function normalizeShiftTemplates(value) {
  const source = Array.isArray(value) ? value : [];
  return source.map((shift, index) => {
    const start = String(shift.start || '').replace(':', '').padStart(4, '0');
    const end = String(shift.end || '').replace(':', '').padStart(4, '0');
    const calculatedHours = timeRangeHours(`${start}-${end}`);
    return {
      id: String(shift.id || `shift-${index + 1}`),
      name: String(shift.name || 'Shift'),
      start: /^\d{4}$/.test(start) ? start : '0700',
      end: /^\d{4}$/.test(end) ? end : '1500',
      category: String(shift.category || 'other'),
      color: normalizeHexColor(shift.color, '#3b82f6'),
      hours: Number.isFinite(Number(shift.hours)) ? Number(shift.hours) : (calculatedHours || 0),
    };
  });
}
function normalizeSummaryColumns(value) {
  if (!value || typeof value !== 'object' || value.configured !== true) return null;
  return {
    configured: true,
    statusKeys: [...new Set((Array.isArray(value.statusKeys) ? value.statusKeys : []).map(String))],
    showAbsence: value.showAbsence === true,
    showOoo: value.showOoo === true,
    workCodeIds: [...new Set((Array.isArray(value.workCodeIds) ? value.workCodeIds : []).map(String))],
  };
}

function loadSettings() {
  try {
    const raw = lsGet(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      appSettings.appName = typeof parsed.appName === 'string' && parsed.appName.trim() ? (parsed.appName === 'Team Manager' || parsed.appName === 'ATLAS' ? 'Organisation' : parsed.appName) : 'Organisation';
      appSettings.darkMode = parsed.darkMode === true;
      appSettings.autoSaveEnabled = parsed.autoSaveEnabled !== false;
      appSettings.showOnlyConfirmedActivities = parsed.showOnlyConfirmedActivities === true;
      appSettings.activityStatusFilter = normalizeActivityStatusFilter(parsed.activityStatusFilter, appSettings.showOnlyConfirmedActivities);
      appSettings.jumpToTodayOnGridChange = parsed.jumpToTodayOnGridChange !== false;
      appSettings.coreWorkdayRange = normalizeCoreWorkdayRange(parsed.coreWorkdayRange, '0730-1500');
      appSettings.coreHoursPerDay = timeRangeHours(appSettings.coreWorkdayRange) || (typeof parsed.coreHoursPerDay === 'number' && parsed.coreHoursPerDay > 0 ? parsed.coreHoursPerDay : 7.5);
      appSettings.lightMax = typeof parsed.lightMax === 'number' ? parsed.lightMax : 70;
      appSettings.normalMax = typeof parsed.normalMax === 'number' ? parsed.normalMax : 100;
      appSettings.highMax = typeof parsed.highMax === 'number' ? parsed.highMax : 120;
      appSettings.planningHorizonDays = Number.isFinite(Number(parsed.planningHorizonDays)) ? Math.max(0, Math.min(365, Math.round(Number(parsed.planningHorizonDays)))) : 0;
      appSettings.planningHorizonColor = normalizeHexColor(parsed.planningHorizonColor, '#ef4444');
      appSettings.holidays = Array.isArray(parsed.holidays) ? parsed.holidays : [];
      appSettings.specialDays = normalizeSpecialDays(parsed.specialDays);
      appSettings.specialDaysVisible = parsed.specialDaysVisible !== false;
        appSettings.adminPasswordHash = String(parsed.adminPasswordHash || '');
      appSettings.activityTypes = normalizeActivityTypes(parsed.activityTypes);
      appSettings.workCodes = normalizeWorkCodes(parsed.workCodes);
      appSettings.shiftTemplates = normalizeShiftTemplates(parsed.shiftTemplates);
      appSettings.summaryColumns = normalizeSummaryColumns(parsed.summaryColumns);
      appSettings.departmentColors = parsed.departmentColors && typeof parsed.departmentColors === 'object'
        ? Object.fromEntries(Object.entries(parsed.departmentColors).map(([dept, value]) => [String(dept), normalizeHexColor(value)]))
        : {};
      appSettings.subdepartmentColors = parsed.subdepartmentColors && typeof parsed.subdepartmentColors === 'object'
        ? Object.fromEntries(Object.entries(parsed.subdepartmentColors).map(([key, value]) => [String(key), normalizeHexColor(value)]))
        : {};
      appSettings.sectionColors = parsed.sectionColors && typeof parsed.sectionColors === 'object'
        ? Object.fromEntries(Object.entries(parsed.sectionColors).map(([key, value]) => [String(key), normalizeHexColor(value)]))
        : {};
      appSettings.processColors = parsed.processColors && typeof parsed.processColors === 'object'
        ? Object.fromEntries(Object.entries(parsed.processColors).map(([key, value]) => [String(key), normalizeHexColor(value)]))
        : {};
      appSettings.securityLabel = normalizeSecurityLabel(parsed.securityLabel);
      appSettings.shiftRotationEnabled = parsed.shiftRotationEnabled === true;
      appSettings.shiftRotationRanges = normalizeShiftRotationRanges(parsed.shiftRotationRanges);
      appSettings.shiftRotationColors = normalizeShiftRotationColors(parsed.shiftRotationColors);
      appSettings.shiftTeams = normalizeShiftTeams(parsed.shiftTeams);
      appSettings.bugReportEnabled = parsed.bugReportEnabled === true;
      appSettings.bugTracker = normalizeBugTracker(parsed.bugTracker);
      appSettings.workwheelEnabled = parsed.workwheelEnabled === true;
      appSettings.workwheelUpcomingDays = Number.isFinite(Number(parsed.workwheelUpcomingDays)) ? Math.max(1, Math.min(365, Math.round(Number(parsed.workwheelUpcomingDays)))) : 14;
      appSettings.bugReportEnabled = parsed.bugReportEnabled === true;
      appSettings.bugTracker = normalizeBugTracker(parsed.bugTracker);
      return;
    }
    appSettings.darkMode = lsGet(LEGACY_THEME_KEY) === 'dark';
  } catch (err) { }
}
function persistSettings() { return lsSet(SETTINGS_KEY, JSON.stringify(appSettings)); }
function normalizeSecurityLabel(value) {
  const fallback = { enabled: false, text: 'CONFIDENTIAL', color: '#dc2626' };
  if (!value || typeof value !== 'object') return { ...fallback };
  return {
    enabled: value.enabled === true,
    text: typeof value.text === 'string' && value.text.trim() ? value.text.trim().slice(0, 32) : fallback.text,
    color: normalizeHexColor(value.color, fallback.color),
  };
}
function renderSecurityLabel(extraClass = '') {
  const cfg = normalizeSecurityLabel(appSettings.securityLabel);
  if (!cfg.enabled) return '';
  const cls = extraClass ? `security-label ${extraClass}` : 'security-label';
  return `<span class="${cls}" style="--security-label-color:${esc(cfg.color)}" aria-label="Security classification ${esc(cfg.text)}">${esc(cfg.text)}</span>`;
}
function normalizeCoreWorkdayRange(value, fallback = '0730-1500') {
  const normalized = String(value || '').trim().replace(/\s+/g, '').replace('–', '-');
  const m = normalized.match(/^(\d{1,2}):?(\d{2})-(\d{1,2}):?(\d{2})$/);
  if (!m) return fallback;
  const startHour = +m[1];
  const startMinute = +m[2];
  const endHour = +m[3];
  const endMinute = +m[4];
  if (startHour > 23 || endHour > 23 || startMinute > 59 || endMinute > 59) return fallback;
  const canonical = `${String(startHour).padStart(2, '0')}${String(startMinute).padStart(2, '0')}-${String(endHour).padStart(2, '0')}${String(endMinute).padStart(2, '0')}`;
  return timeRangeHours(canonical) ? canonical : fallback;
}
function normalizeShiftRotationRanges(value) {
  const source = value && typeof value === 'object' ? value : {};
  return {
    normal: normalizeShiftRotationRange(source.normal, '0730-1500'),
    day: normalizeShiftRotationRange(source.day, '0730-2400'),
    evening: normalizeShiftRotationRange(source.evening, '1200-2000'),
    night: normalizeShiftRotationRange(source.night, '0000-0730'),
  };
}
function normalizeShiftRotationColors(value) {
  const source = value && typeof value === 'object' ? value : {};
  const defaults = appSettings?.shiftRotationColors || { normal: '#64748b', day: '#f59e0b', evening: '#14b8a6', night: '#3b82f6', turn: '#8b5cf6', leave: '#b45309', overtime: '#dc2626' };
  return Object.fromEntries(Object.keys(defaults).map(key => [key, normalizeHexColor(source[key], defaults[key])]));
}
function normalizeShiftTeams(value) {
  return (Array.isArray(value) ? value : []).map((team, index) => ({
    id: String(team?.id || `shift-team-${index + 1}`),
    name: String(team?.name || '').trim(),
    color: normalizeHexColor(team?.color, PALETTE[index % PALETTE.length]),
    order: Number.isFinite(Number(team?.order)) ? Number(team.order) : (index + 1) * 10,
  })).filter(team => team.name).sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
}
function normalizeShiftRotationRange(value, fallback = '') {
  const normalized = String(value || '').trim().replace(/\s+/g, '').replace('–', '-');
  const match = normalized.match(/^(\d{1,2}):?(\d{2})-(\d{1,2}):?(\d{2})$/);
  if (!match) return fallback;
  const startHour = Number(match[1]), startMinute = Number(match[2]);
  const endHour = Number(match[3]), endMinute = Number(match[4]);
  if (startHour > 23 || startMinute > 59 || endHour > 24 || endMinute > 59 || (endHour === 24 && endMinute !== 0)) return fallback;
  const canonical = `${String(startHour).padStart(2, '0')}${String(startMinute).padStart(2, '0')}-${String(endHour).padStart(2, '0')}${String(endMinute).padStart(2, '0')}`;
  return timeRangeHours(canonical) ? canonical : fallback;
}
function cleanShiftRotationMap(map, employeeList = employees) {
  if (!map || typeof map !== 'object' || Array.isArray(map)) return {};
  const employeeIds = new Set((employeeList || []).map(employee => Number(employee?.id)).filter(Number.isFinite));
  return Object.fromEntries(Object.entries(map).filter(([key, value]) => {
    const parts = String(key).split('_');
    const shift = typeof value === 'string' ? value : value?.shift;
    return parts.length === 2 && employeeIds.has(Number(parts[0])) && isValidIsoDate(parts[1]) &&
        ['normal', 'day', 'evening', 'night', 'turn', 'leave', 'overtime'].includes(shift) &&
        (shift !== 'overtime' || Boolean(timeRangeHours(value?.time)));
      }).map(([key, value]) => [key, typeof value === 'string' ? { shift: value } : { ...value, shift: value.shift }]));
}
function normalizeActivityTypes(value) {
  return (Array.isArray(value) ? value : []).map((type, index) => ({
    id: String(type.id || `at${index + 1}`),
    key: String(type.key || type.name || type.label || `activity_type_${index + 1}`).trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, ''),
    name: String(type.name || type.label || 'Activity Type').trim(),
    abbreviation: String(type.abbreviation || type.abbr || '').trim().toUpperCase().slice(0, 8),
    color: normalizeHexColor(type.color),
  }));
}
function normalizeActivityRelevance(value) {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const values = item => [...new Set((Array.isArray(item) ? item : []).map(value => String(value || '').trim()).filter(Boolean))];
  return { departments: values(source.departments), sections: values(source.sections) };
}
function activityRelevance(activity) {
  return normalizeActivityRelevance(activity?.relevance || { departments: activity?.departments, sections: activity?.sections });
}
function employeeSection(employee) { return String(employee?.section || '').trim(); }
function activityRelevantToEmployee(activity, employee) {
  if (!activity || !employee) return false;
  const relevance = activityRelevance(activity);
  return (!relevance.departments.length || relevance.departments.includes(String(employee.department || '').trim()))
    && (!relevance.sections.length || relevance.sections.includes(employeeSection(employee)));
}
function activityVisibleForScheduleSection(activity) {
  if (activity?.source === 'workwheel' && appSettings.workwheelGridDisplayMode === 'cells') return false;
  if (!scheduleSectionFilter) return true;
  const matchingEmployees = employees.filter(employee => employeeSection(employee) === scheduleSectionFilter);
  return (activity.participants || []).some(participant => matchingEmployees.some(employee => employee.id === Number(participant.id)))
    || activityRelevance(activity).sections.includes(scheduleSectionFilter);
}
function toggleWorkwheelAvailability(activityId, enabled) {
  if (typeof workwheelState === 'undefined' || !activityId) return;
  if (enabled) {
    if (typeof importScheduleWorkwheelActivity === 'function') importScheduleWorkwheelActivity(Number(activityId));
  } else {
    workwheelState.activities = workwheelState.activities.filter(activity => Number(activity.sourceActivityId) !== Number(activityId));
    if (typeof saveWorkwheelState === 'function') saveWorkwheelState();
    if (typeof renderWorkwheel === 'function' && currentPage === 'workwheel') renderWorkwheel();
  }
}
function normalizeWorkCodes(value) {
  const source = Array.isArray(value) ? value : [];
  return source.map((code, index) => {
    const name = String(code.name || 'Work Code').trim();
    const abbreviation = String(code.abbreviation || code.abbr || '').trim().toUpperCase().slice(0, 12);
    const legacyFixedDayCode = !code.durationMode && ['ATF', 'VAKT'].includes(abbreviation);
    const durationMode = code.durationMode === 'fixed' || legacyFixedDayCode ? 'fixed' : 'entered';
    return {
      id: String(code.id || `wc${index + 1}`),
      name,
      abbreviation,
      staffingImpact: code.staffingImpact === 'unavailable' ? 'unavailable' : 'available',
      aggregationMode: code.aggregationMode === 'units' || code.aggregationMode === 'days' ? 'days' : 'hours',
      durationMode,
      fixedHours: durationMode === 'fixed' ? (Number(code.fixedHours) > 0 ? Number(code.fixedHours) : 24) : null,
      color: normalizeHexColor(code.color, '#3b82f6'),
    };
  });
}
function normalizeAnnualRequirements(raw) {
  const existingRequirements = Array.isArray(raw.requirements)
    ? raw.requirements.map((requirement, index) => ({
        id: Number.isFinite(Number(requirement.id)) ? Number(requirement.id) : index + 1,
        name: String(requirement.name || `Requirement ${index + 1}`).trim(),
      }))
    : null;
  if (existingRequirements) {
    return {
      requirements: existingRequirements,
      requirementRecords: raw.requirementRecords && typeof raw.requirementRecords === 'object' ? { ...raw.requirementRecords } : {},
    };
  }

  const legacy = raw.fitnessTests && typeof raw.fitnessTests === 'object' ? raw.fitnessTests : null;
  if (!legacy) return { requirements: [], requirementRecords: {} };
  const requirements = [{ id: 1, name: 'Condition' }, { id: 2, name: 'Strength' }];
  const requirementRecords = {};
  Object.entries(legacy).forEach(([key, record]) => {
    const match = key.match(/^(\d+)_(condition|strength)$/);
    if (!match || !record || typeof record !== 'object') return;
    const employeeId = Number(match[1]);
    const requirementId = match[2] === 'condition' ? 1 : 2;
    const completedDate = /^\d{4}-\d{2}-\d{2}$/.test(record.date || '') ? record.date : '';
    const year = completedDate ? Number(completedDate.slice(0, 4)) : new Date().getFullYear();
    requirementRecords[`${requirementId}_${employeeId}_${year}`] = {
      completedDate,
      dueDate: '',
      result: record.grade ? `Grade ${record.grade}` : '',
      required: record.required !== false,
    };
  });
  return { requirements, requirementRecords };
}
function migrateLegacyDailyStatuses(activityTypes) {
  let migrated = 0;
  activityTypes.forEach(type => {
    const exists = statuses.some(status => status.key === type.key || status.label.toLowerCase() === type.name.toLowerCase());
    if (exists) return;
    statuses.push({ id: nextStatusId++, key: type.key, label: type.name, abbr: type.abbreviation, color: type.color, isAbsence: false, isOutOfOffice: false });
    migrated++;
  });
  return migrated;
}
function dailyDeviationLabel(empId, date) {
  const entry = getEntryObj(`${empId}_${date}`);
  const status = entry ? siFor(entry.status) : null;
  if (!entry || !status) return '';
  if (entry.durationType === 'time' && entry.time) return `${status.label} (${entry.time})`;
  if (entry.durationType === '24hours') return `${status.label} (24 hours)`;
  return status.label;
}
function sortDailyStatuses() {
  statuses.sort((a, b) => a.label.localeCompare(b.label, 'nb', { sensitivity: 'base' }));
}
function sortedPlanningItems(items) {
  return [...(items || [])].sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'nb', { sensitivity: 'base' }));
}
function updateCoreHoursDisplayFromRangeInput() {
  const input = document.getElementById('set-core-time');
  const output = document.getElementById('set-core-hours-display');
  if (!output || !input) return;
  const normalized = normalizeCoreWorkdayRange(input.value, '');
  if (!normalized) {
    output.textContent = 'Invalid range';
    return;
  }
  const hours = timeRangeHours(normalized);
  output.textContent = hours ? `= ${hours} h/day` : 'Invalid range';
}

function normalizeStateVersion(data) {
  const raw = data && typeof data === 'object' ? data : {};
  const normalized = { ...raw };
  const detectedVersion = Number(raw.dataVersion ?? raw.version ?? 1);
  normalized.dataVersion = Math.max(DATA_VERSION, detectedVersion);
  normalized.appVersion = raw.appVersion || APP_VERSION;
  normalized.appSettings = raw.appSettings && typeof raw.appSettings === 'object' ? { ...raw.appSettings } : null;
  normalized.activityTypes = normalizeActivityTypes(raw.activityTypes || raw.appSettings?.activityTypes || []);
  normalized.workCodes = normalizeWorkCodes(raw.workCodes || raw.appSettings?.workCodes);
  normalized.shiftTemplates = normalizeShiftTemplates(raw.shiftTemplates || raw.appSettings?.shiftTemplates);
  normalized.summaryColumns = normalizeSummaryColumns(raw.summaryColumns ?? raw.appSettings?.summaryColumns);
  const annualRequirements = normalizeAnnualRequirements(raw);
  normalized.requirements = annualRequirements.requirements;
  normalized.requirementRecords = annualRequirements.requirementRecords;
  if (!normalized.departmentColors || typeof normalized.departmentColors !== 'object') normalized.departmentColors = {};
  normalized.departmentColors = Object.fromEntries(Object.entries(normalized.departmentColors || {}).map(([dept, value]) => [String(dept), normalizeHexColor(value)]));
  if (!normalized.subdepartmentColors || typeof normalized.subdepartmentColors !== 'object') normalized.subdepartmentColors = {};
  normalized.subdepartmentColors = Object.fromEntries(Object.entries(normalized.subdepartmentColors).map(([key, value]) => [String(key), normalizeHexColor(value)]));
  if (!normalized.sectionColors || typeof normalized.sectionColors !== 'object') normalized.sectionColors = {};
  normalized.sectionColors = Object.fromEntries(Object.entries(normalized.sectionColors).map(([key, value]) => [String(key), normalizeHexColor(value)]));
  if (!normalized.processColors || typeof normalized.processColors !== 'object') normalized.processColors = {};
  normalized.processColors = Object.fromEntries(Object.entries(normalized.processColors).map(([key, value]) => [String(key), normalizeHexColor(value)]));
  normalized.departmentOrder = normalizeHierarchyOrder(raw.departmentOrder);
  normalized.subdepartmentOrder = normalizeHierarchyOrder(raw.subdepartmentOrder || raw.subteamOrder);
  normalized.hierarchyOrder = normalizeHierarchyOrderTree(raw.hierarchyOrder);
  return normalized;
}

function normalizeHierarchyOrder(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value)
    .map(([key, order]) => [String(key), Number(order)])
    .filter(([, order]) => Number.isInteger(order) && order > 0 && order <= 9999));
}
function normalizeHierarchyOrderTree(value) {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const result = {};
  for (const level of ['department', 'section', 'process', 'team']) {
    result[level] = normalizeHierarchyOrder(source[level]);
  }
  return result;
}

function loadSettings() {
  try {
    const newRaw = lsGet(SETTINGS_KEY);
    const legacyRaw = newRaw ? null : lsGet(LEGACY_SETTINGS_KEY);
    const raw = newRaw || legacyRaw;
    if (raw) {
      const parsed = JSON.parse(raw);
      appSettings.appName = typeof parsed.appName === 'string' && parsed.appName.trim() ? (parsed.appName === 'Team Manager' || parsed.appName === 'ATLAS' ? 'Organisation' : parsed.appName) : 'Organisation';
      appSettings.darkMode = parsed.darkMode === true;
      appSettings.autoSaveEnabled = parsed.autoSaveEnabled !== false;
      appSettings.autoSyncEnabled = parsed.autoSyncEnabled !== false;
      appSettings.showOnlyConfirmedActivities = parsed.showOnlyConfirmedActivities === true;
      appSettings.activityStatusFilter = normalizeActivityStatusFilter(parsed.activityStatusFilter, appSettings.showOnlyConfirmedActivities);
      appSettings.jumpToTodayOnGridChange = parsed.jumpToTodayOnGridChange !== false;
      appSettings.coreWorkdayRange = normalizeCoreWorkdayRange(parsed.coreWorkdayRange, '0730-1500');
      appSettings.coreHoursPerDay = timeRangeHours(appSettings.coreWorkdayRange) || (typeof parsed.coreHoursPerDay === 'number' && parsed.coreHoursPerDay > 0 ? parsed.coreHoursPerDay : 7.5);
      appSettings.lightMax = typeof parsed.lightMax === 'number' ? parsed.lightMax : 70;
      appSettings.normalMax = typeof parsed.normalMax === 'number' ? parsed.normalMax : 100;
      appSettings.highMax = typeof parsed.highMax === 'number' ? parsed.highMax : 120;
      appSettings.planningHorizonDays = Number.isFinite(Number(parsed.planningHorizonDays)) ? Math.max(0, Math.min(365, Math.round(Number(parsed.planningHorizonDays)))) : 0;
      appSettings.planningHorizonColor = normalizeHexColor(parsed.planningHorizonColor, '#ef4444');
      appSettings.holidays = Array.isArray(parsed.holidays) ? parsed.holidays : [];
      appSettings.specialDays = normalizeSpecialDays(parsed.specialDays);
      appSettings.specialDaysVisible = parsed.specialDaysVisible !== false;
      appSettings.adminPasswordHash = String(parsed.adminPasswordHash || '');
      appSettings.departmentColors = parsed.departmentColors && typeof parsed.departmentColors === 'object'
        ? Object.fromEntries(Object.entries(parsed.departmentColors).map(([dept, value]) => [String(dept), normalizeHexColor(value)]))
        : {};
      appSettings.activityTypes = normalizeActivityTypes(parsed.activityTypes);
      appSettings.workCodes = normalizeWorkCodes(parsed.workCodes);
      appSettings.securityLabel = normalizeSecurityLabel(parsed.securityLabel);
      appSettings.shiftRotationEnabled = parsed.shiftRotationEnabled === true;
      appSettings.shiftRotationRanges = normalizeShiftRotationRanges(parsed.shiftRotationRanges);
      appSettings.shiftRotationColors = normalizeShiftRotationColors(parsed.shiftRotationColors);
      appSettings.shiftTeams = normalizeShiftTeams(parsed.shiftTeams);
      if (legacyRaw) {
        lsSet(SETTINGS_KEY, JSON.stringify(appSettings));
        lsRemove(LEGACY_SETTINGS_KEY);
      }
      return;
    }
    appSettings.darkMode = lsGet(LEGACY_THEME_KEY) === 'dark';
  } catch (err) { }
}
function persistSettings() {
  const saved = lsSet(SETTINGS_KEY, JSON.stringify(appSettings));
  if (saved) lsRemove(LEGACY_SETTINGS_KEY);
  return saved;
}
function plannerAppSettingsSnapshot() {
  const settings = JSON.parse(JSON.stringify(appSettings));
  LOCAL_ONLY_APP_SETTING_KEYS.forEach(key => delete settings[key]);
  return settings;
}
function normalizeSpecialDays(value) {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const recurring = Array.isArray(source.recurring) ? source.recurring : [];
  const oneOff = Array.isArray(source.oneOff) ? source.oneOff : [];
  return {
    recurring: recurring.filter(item => /^(0[1-9]|1[0-2])-([0-2]\d|3[01])$/.test(String(item?.monthDay || ''))).map(item => ({
      id: String(item.id || `special-recurring-${Date.now()}-${Math.random()}`),
      monthDay: String(item.monthDay), name: String(item.name || 'Special day'), nonWorking: item.nonWorking !== false, color: normalizeHexColor(item.color, '#ef4444'),
    })),
    oneOff: oneOff.filter(item => /^\d{4}-\d{2}-\d{2}$/.test(String(item?.date || ''))).map(item => ({
      id: String(item.id || `special-oneoff-${Date.now()}-${Math.random()}`),
      date: String(item.date), name: String(item.name || 'Special day'), nonWorking: item.nonWorking !== false, color: normalizeHexColor(item.color, '#ef4444'),
    })),
  };
}
const GRID_YEAR_KEY = 'teamManagerGridYear';
const GRID_PERIOD_KEY = 'teamManagerGridPeriod';
const APP_ZOOM_KEY = 'teamManagerAppZoom';
const GRID_HIDDEN_EMPLOYEES_KEY = 'teamManagerGridHiddenEmployees';
const GRID_VIEW_MODE_KEY = 'teamManagerGridViewMode';
const GRID_SECTION_COLLAPSE_KEY = 'teamManagerGridCollapsedSections';
const GRID_SECTION_FILTER_KEY = 'teamManagerGridSectionFilter';
function normalizeGridViewMode(value) {
  return ['all', 'timeline', 'employees'].includes(value) ? value : 'all';
}
function normalizeGridPeriod(value) {
  return ['year', 'month', 'week'].includes(value) ? value : 'year';
}
function normalizeAppZoom(value) {
  const zoom = Number(value);
  return [80, 90, 100, 110, 125, 150, 175].includes(zoom) ? zoom : 100;
}
function applyAppZoom(value = appZoom) {
  appZoom = normalizeAppZoom(value);
  document.documentElement.style.setProperty('--app-zoom', `${appZoom / 100}`);
  document.documentElement.dataset.appZoom = String(appZoom);
  lsSet(APP_ZOOM_KEY, String(appZoom));
}
function loadAppZoom() {
  appZoom = normalizeAppZoom(lsGet(APP_ZOOM_KEY));
  applyAppZoom(appZoom);
}
function normalizeGridCollapsedSections(value) {
  const defaults = { activities: false, holidays: false, employees: false };
  if (!value || typeof value !== 'object' || Array.isArray(value)) return defaults;
  return {
    activities: value.activities === true,
    holidays: value.holidays === true,
    employees: value.employees === true,
  };
}
function applyGridPreferences(preferences, options = {}) {
  const resetMissing = options.resetMissing === true;
  if (!preferences || typeof preferences !== 'object' || Array.isArray(preferences)) return;
  const prefYear = Number(preferences.year);
  if (Number.isInteger(prefYear)) gridYear = prefYear;
  if (Object.prototype.hasOwnProperty.call(preferences, 'hiddenEmployeeIds')) {
    hiddenEmployees = Array.isArray(preferences.hiddenEmployeeIds)
      ? new Set(preferences.hiddenEmployeeIds.map(Number).filter(Number.isFinite))
      : new Set();
  } else if (resetMissing) hiddenEmployees = new Set();
  if (Object.prototype.hasOwnProperty.call(preferences, 'viewMode')) {
    gridViewMode = normalizeGridViewMode(preferences.viewMode);
  } else if (resetMissing) gridViewMode = 'all';
  if (Object.prototype.hasOwnProperty.call(preferences, 'period')) {
    gridPeriod = normalizeGridPeriod(preferences.period);
  } else if (resetMissing) gridPeriod = 'year';
  if (Object.prototype.hasOwnProperty.call(preferences, 'collapsedSections')) {
    collapsedGridSections = normalizeGridCollapsedSections(preferences.collapsedSections);
  } else if (resetMissing) collapsedGridSections = { activities: false, holidays: false, employees: false };
}
function loadGridPreferences() {
  let savedHidden = [];
  let savedCollapsed = {};
  try {
    const parsed = JSON.parse(lsGet(GRID_HIDDEN_EMPLOYEES_KEY) || '[]');
    savedHidden = Array.isArray(parsed) ? parsed : [];
  } catch (err) { savedHidden = []; }
  try {
    savedCollapsed = JSON.parse(lsGet(GRID_SECTION_COLLAPSE_KEY) || '{}');
  } catch (err) { savedCollapsed = {}; }
  applyGridPreferences({
    year: parseInt(lsGet(GRID_YEAR_KEY), 10),
    hiddenEmployeeIds: savedHidden,
    viewMode: lsGet(GRID_VIEW_MODE_KEY) || 'all',
    period: lsGet(GRID_PERIOD_KEY) || 'year',
    collapsedSections: savedCollapsed,
  }, { resetMissing: true });
  scheduleSectionFilter = lsGet(GRID_SECTION_FILTER_KEY) || '';
}
function saveGridPreferences() {
  lsSet(GRID_YEAR_KEY, String(gridYear));
  lsSet(GRID_HIDDEN_EMPLOYEES_KEY, JSON.stringify([...hiddenEmployees]));
  lsSet(GRID_VIEW_MODE_KEY, gridViewMode);
  lsSet(GRID_PERIOD_KEY, gridPeriod);
  lsSet(GRID_SECTION_COLLAPSE_KEY, JSON.stringify(collapsedGridSections));
  lsSet(GRID_SECTION_FILTER_KEY, scheduleSectionFilter);
}
function applyTheme() {
  document.body.classList.toggle('dark', appSettings.darkMode);
  const toggle = document.getElementById('theme-toggle');
  if (toggle) {
    const action = appSettings.darkMode ? 'Light mode' : 'Dark mode';
    toggle.innerHTML = `${svgIcon(appSettings.darkMode ? 'sun' : 'moon')}<span class="sidebar-item-label">${action}</span>`;
    toggle.setAttribute?.('aria-label', `Switch to ${action.toLowerCase()}`);
  }
}
const SIDEBAR_MODE_KEY = 'team-manager-sidebar-mode';
let sidebarMode = 'pinned';
function loadSidebarMode() {
  sidebarMode = lsGet(SIDEBAR_MODE_KEY) === 'autohide' ? 'autohide' : 'pinned';
}
function applySidebarMode() {
  const sidebar = document.getElementById('sidebar');
  const toggle = document.getElementById('sidebar-pin-toggle');
  if (!sidebar || !toggle) return;
  const autoHide = sidebarMode === 'autohide';
  sidebar.classList.toggle('autohide', autoHide);
  toggle.setAttribute('aria-pressed', String(!autoHide));
  toggle.setAttribute('aria-label', autoHide ? 'Pin sidebar open' : 'Use sidebar auto-hide');
  toggle.title = autoHide ? 'Sidebar auto-hide. Select to pin.' : 'Sidebar pinned. Select for auto-hide.';
  const label = toggle.querySelector('.sidebar-pin-label');
  if (label) label.textContent = autoHide ? 'Auto-hide' : 'Pinned';
  document.querySelectorAll('#sidebar .nav-btn, #sidebar .sb-link').forEach(button => {
    if (!button.dataset.sidebarTitle) button.dataset.sidebarTitle = button.getAttribute('aria-label') || button.textContent.trim();
    button.title = autoHide ? button.dataset.sidebarTitle : '';
  });
}
function toggleSidebarMode() {
  sidebarMode = sidebarMode === 'pinned' ? 'autohide' : 'pinned';
  lsSet(SIDEBAR_MODE_KEY, sidebarMode);
  applySidebarMode();
}
function toggleTheme() { appSettings.darkMode = !appSettings.darkMode; persistSettings(); applyTheme(); renderPage(); }
function setSyncStatusState(state) {
  syncStatusState = state || 'updated';
  updateSbStatus();
}
function updateAutoSyncButton() {
  const button = document.getElementById('auto-sync-btn');
  if (!button) return;
  if (hostedMode) {
    button.style.display = 'none';
    return;
  }
  button.style.display = '';
  const enabled = appSettings.autoSyncEnabled !== false;
  const label = `Auto-update: ${enabled ? 'On' : 'Off'}`;
  button.innerHTML = `${svgIcon('sync')}<span class="sidebar-item-label">${label}</span>`;
  button.setAttribute?.('aria-label', label);
  if (button.dataset) button.dataset.sidebarTitle = label;
  if (sidebarMode === 'autohide') button.title = label;
}
function updateSyncButton() {
  const button = document.getElementById('sync-btn');
  if (!button) return;
  if (hostedMode) {
    button.style.display = 'none';
    return;
  }
  button.style.display = '';
  button.disabled = remoteUpdateSource === 'none' || remoteUpdateCheckInFlight;
}
function toggleAutoSync() {
  appSettings.autoSyncEnabled = appSettings.autoSyncEnabled === false;
  persistSettings();
  updateAutoSyncButton();
  if (appSettings.autoSyncEnabled !== false && syncStatusState === 'out-of-sync') setSyncStatusState('updated');
  updateSyncButton();
}
function applyAppName() {
  const organisationName = appSettings.appName || 'Organisation';
  document.getElementById('sb-app-name').textContent = 'ATLAS';
  document.title = `ATLAS — ${organisationName}`;
  document.querySelectorAll('.organisation-name-header').forEach((element) => {
    element.textContent = organisationName;
  });
}

function openSettings() {
  document.getElementById('set-app-name').value = appSettings.appName;
  const secLabel = normalizeSecurityLabel(appSettings.securityLabel);
  document.getElementById('set-security-label-enabled').checked = secLabel.enabled === true;
  document.getElementById('set-security-label-text').value = secLabel.text || '';
  document.getElementById('set-security-label-color').value = secLabel.color;
  document.getElementById('set-workwheel-enabled').checked = appSettings.workwheelEnabled === true;
  document.getElementById('set-workwheel-upcoming-days').value = String(appSettings.workwheelUpcomingDays || 14);
  document.getElementById('set-workwheel-grid-display').value = ['cells', 'both', 'row'].includes(appSettings.workwheelGridDisplayMode) ? appSettings.workwheelGridDisplayMode : 'cells';
  document.getElementById('set-my-schedule-lookahead-days').value = String(appSettings.myScheduleLookaheadDays || 31);
  renderHolidaySettings();
  updateDefaultJsonStatus();
  const about = document.getElementById('set-about-version');
    if (about) about.textContent = `ATLAS v${APP_VERSION} · Adaptive Timeline, Load & Allocation System · Data format v${DATA_VERSION}`;
  document.getElementById('settings-modal').classList.add('open');
  const userInfo = document.getElementById('hosted-user-info');
  if (userInfo) userInfo.textContent = hostedUser ? `Signed in as ${hostedUser.name} · ${accountRoleLabel(hostedUser.role)}` : '';
  document.querySelectorAll('.hosted-admin-only').forEach(element => { element.style.display = hostedMode ? '' : 'none'; });
}
function updateHostedAccountUi() {
  const signOut = document.getElementById('hosted-sign-out');
  const sidebarUser = document.getElementById('hosted-sidebar-user');
  const sidebarName = document.getElementById('hosted-user-name');
  const sidebarRole = document.getElementById('hosted-user-role');
  const avatar = document.getElementById('hosted-user-avatar');
  const authenticated = hostedMode && !!hostedUser;
  if (signOut) signOut.style.display = authenticated ? '' : 'none';
  if (sidebarUser) {
    sidebarUser.style.display = authenticated ? '' : 'none';
    sidebarUser.title = authenticated ? `Signed in as ${hostedUser.name}` : '';
  }
  if (sidebarName) sidebarName.textContent = authenticated ? hostedUser.name : '';
  if (sidebarRole) sidebarRole.textContent = authenticated ? accountRoleLabel(hostedUser.role) : '';
  if (avatar) avatar.textContent = authenticated ? hostedUser.name.trim().split(/\s+/).slice(0, 2).map(part => part[0] || '').join('').toUpperCase() : '';
  const personalNav = document.getElementById('my-upcoming-nav');
  if (personalNav) personalNav.style.display = authenticated && hostedUser.employeeId !== null && hostedUser.employeeId !== undefined ? '' : 'none';
  const absenceInboxNav = document.getElementById('absence-inbox-nav');
  if (absenceInboxNav) absenceInboxNav.style.display = authenticated && hostedUser.role === 'admin' ? '' : 'none';
  if (authenticated && hostedUser.role === 'admin') void updateAbsenceInboxBadge();
  startAbsenceInboxPolling();
}
async function updateAbsenceInboxBadge() {
  const nav = document.getElementById('absence-inbox-nav');
  if (!nav || !hostedMode || hostedUser?.role !== 'admin') return;
  try {
    const response = await fetch('/api/admin/absence-requests', { cache: 'no-store' });
    const requests = response.ok ? ((await response.json()).requests || []) : [];
    const previousCount = hostedPendingAbsenceRequests.length;
    hostedPendingAbsenceRequests = requests;
    if (requests.length > previousCount && currentPage !== 'inbox') showToast(`${requests.length - previousCount} new absence request${requests.length - previousCount === 1 ? '' : 's'} received.`, 5000, { label: 'Open inbox', onClick: () => nav('inbox') });
    const label = nav.querySelector('.sidebar-item-label');
    if (label) label.textContent = requests.length ? `Absence inbox (${requests.length})` : 'Absence inbox';
    nav.classList.toggle('has-notifications', requests.length > 0);
  } catch { }
}
function startAbsenceInboxPolling() {
  if (absenceInboxPollTimer) clearInterval(absenceInboxPollTimer);
  absenceInboxPollTimer = hostedMode && hostedUser?.role === 'admin' ? setInterval(() => { void updateAbsenceInboxBadge(); }, 30000) : null;
}
function openPersonalSettings() {
  if (!hostedMode || !hostedUser) return;
  document.getElementById('personal-name').value = hostedUser.name || '';
  document.getElementById('personal-username').value = hostedUser.username || '';
  document.getElementById('personal-email').value = hostedUser.email || '';
  document.getElementById('personal-password').value = '';
  const preferences = hostedUser.preferences || {};
  document.getElementById('personal-jump-today').checked = preferences.jumpToTodayOnGridChange !== false;
  document.getElementById('personal-dark-mode').checked = preferences.darkMode === true;
  document.getElementById('personal-zoom').value = String(normalizeAppZoom(preferences.zoom));
  document.getElementById('personal-colleague-notifications').checked = preferences.colleagueChangeNotificationsEnabled === true;
  const selectedUserIds = new Set(Array.isArray(preferences.colleagueChangeUserIds) ? preferences.colleagueChangeUserIds : []);
  const userList = document.getElementById('personal-colleague-users');
  if (userList) userList.innerHTML = '<div class="form-hint">Notify me about changes from:</div>' + (hostedUser?.availableUsers || []).map(user => `<label><input type="checkbox" value="${esc(user.id)}" ${selectedUserIds.has(String(user.id)) ? 'checked' : ''}><span>${esc(user.name)} · ${esc(accountRoleLabel(user.role))}</span></label>`).join('');
  document.getElementById('personal-settings-error').textContent = '';
  document.getElementById('personal-settings-modal').classList.add('open');
}
async function savePersonalSettings(event) {
  event.preventDefault();
  const error = document.getElementById('personal-settings-error');
  error.textContent = '';
  const password = document.getElementById('personal-password').value;
  const payload = {
    name: document.getElementById('personal-name').value,
    email: document.getElementById('personal-email').value,
    preferences: {
      jumpToTodayOnGridChange: document.getElementById('personal-jump-today').checked,
      darkMode: document.getElementById('personal-dark-mode').checked,
      zoom: normalizeAppZoom(document.getElementById('personal-zoom').value),
      colleagueChangeNotificationsEnabled: document.getElementById('personal-colleague-notifications').checked,
      colleagueChangeUserIds: [...document.querySelectorAll('#personal-colleague-users input:checked')].map(input => input.value),
    },
  };
  if (password) payload.password = password;
  const response = await fetch('/api/me/profile', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) { error.textContent = result.error || 'Could not save account settings.'; return; }
  hostedUser = { ...hostedUser, ...result.user, preferences: result.preferences };
  appSettings.jumpToTodayOnGridChange = result.preferences.jumpToTodayOnGridChange !== false;
  appSettings.darkMode = result.preferences.darkMode === true;
  applyAppZoom(result.preferences.zoom);
  applyTheme();
  updateHostedAccountUi();
  closeModal('personal-settings-modal');
  renderPage();
  showToast('Personal settings saved.', 3500);
}
function openAccountManagement() {
  if (!hostedMode || hostedUser?.role !== 'admin') {
    showToast('Administrator access is required.', 3500);
    return;
  }
  openSettingsChild('account-management-modal', 'settings-modal');
  resetAccountForm();
  document.getElementById('account-management-modal').classList.add('open');
  loadHostedUsers();
  loadPersonnelLinkOptions();
  loadResponsibilityUnits();
}
function resetAccountForm() {
  const form = document.getElementById('account-form');
  if (!form) return;
  form.reset();
  document.getElementById('account-id').value = '';
  document.getElementById('account-role').value = 'planner';
  document.getElementById('account-username').value = '';
  document.getElementById('account-email').value = '';
  document.getElementById('account-employee').value = '';
  document.getElementById('account-scope').value = '';
  document.getElementById('account-password').required = true;
}
function accountRoleLabel(role) { return role === 'admin' ? 'Admin' : role === 'planner' ? 'User' : 'Reader'; }
async function loadHostedUsers() {
  const list = document.getElementById('account-list');
  if (!list) return;
  list.textContent = 'Loading accounts…';
  try {
    const response = await fetch('/api/admin/users', { cache: 'no-store' });
    if (!response.ok) throw new Error('Could not load accounts.');
    const { users } = await response.json();
    const render = () => {
      const query = document.getElementById('account-search').value.trim().toLowerCase();
      const role = document.getElementById('account-filter-role').value;
      const status = document.getElementById('account-filter-status').value;
      const sort = document.getElementById('account-sort').value;
      const visible = users.filter(user => (!query || [user.name, user.username, user.email].some(value => String(value || '').toLowerCase().includes(query))) && (role === 'all' || user.role === role) && (status === 'all' || (status === 'disabled' ? user.disabled : !user.disabled))).sort((a, b) => sort === 'role' ? accountRoleLabel(a.role).localeCompare(accountRoleLabel(b.role)) : sort === 'created' ? String(b.createdAt || '').localeCompare(String(a.createdAt || '')) : a.name.localeCompare(b.name));
      document.getElementById('account-summary').innerHTML = `<span>${users.length} total</span><span>${users.filter(user => !user.disabled).length} enabled</span><span>${users.filter(user => user.disabled).length} disabled</span>`;
      list.innerHTML = visible.map(user => `<div class="account-row"><div class="account-identity"><strong>${esc(user.name)}</strong><div class="account-meta">${esc(user.username || '')} · ${esc(user.email || '')}</div><div><span class="role-pill role-${esc(user.role)}">${accountRoleLabel(user.role)}</span>${user.disabled ? ' <span class="role-pill">Disabled</span>' : ''}</div></div><div class="account-meta">${user.lastActiveAt ? `Last active ${esc(formatStatisticDate(user.lastActiveAt))}` : 'Never active'}</div><div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn btn-sm" type="button" data-edit-user="${esc(user.id)}">Edit</button><button class="btn btn-sm" type="button" data-reset-password="${esc(user.id)}">Reset password</button><button class="btn btn-sm" type="button" data-toggle-user="${esc(user.id)}">${user.disabled ? 'Enable' : 'Disable'}</button><button class="btn btn-sm" type="button" data-revoke-user="${esc(user.id)}">Revoke sessions</button><button class="btn btn-sm btn-danger" type="button" data-delete-user="${esc(user.id)}">Delete</button></div></div>`).join('') || '<div class="form-hint">No accounts match the current filters.</div>';
      list.querySelectorAll('[data-edit-user]').forEach(button => button.addEventListener('click', () => editHostedUser(users.find(user => user.id === button.dataset.editUser))));
      list.querySelectorAll('[data-reset-password]').forEach(button => button.addEventListener('click', () => resetHostedUserPassword(users.find(user => user.id === button.dataset.resetPassword))));
      list.querySelectorAll('[data-delete-user]').forEach(button => button.addEventListener('click', () => deleteHostedUser(button.dataset.deleteUser)));
      list.querySelectorAll('[data-toggle-user]').forEach(button => button.addEventListener('click', () => toggleHostedUser(users.find(user => user.id === button.dataset.toggleUser))));
      list.querySelectorAll('[data-revoke-user]').forEach(button => button.addEventListener('click', () => revokeHostedUserSessions(button.dataset.revokeUser)));
    };
    ['account-search', 'account-filter-role', 'account-filter-status', 'account-sort'].forEach(id => document.getElementById(id)?.addEventListener('input', render));
    render();
  } catch (error) { list.textContent = error.message || 'Could not load accounts.'; }
}
async function loadPersonnelLinkOptions() {
  const select = document.getElementById('account-employee');
  if (!select) return;
  try {
    const response = await fetch('/api/admin/personnel-link-options', { cache: 'no-store' });
    if (!response.ok) throw new Error('Could not load personnel.');
    const { employees } = await response.json();
    select.innerHTML = '<option value="">No personnel link (login-only account)</option>' + employees.map(employee => `<option value="${employee.id}"${employee.linked ? ' disabled' : ''}>${esc(employee.name)}${employee.department ? ` · ${esc(employee.department)}` : ''}${employee.linked ? ' · Linked' : ''}</option>`).join('');
  } catch (error) { select.innerHTML = `<option value="">${esc(error.message || 'Could not load personnel')}</option>`; }
}
async function loadResponsibilityUnits() {
  const select = document.getElementById('account-scope');
  const row = document.getElementById('responsibility-scope-row');
  if (!select || hostedUser?.role !== 'admin') return;
  const response = await fetch('/api/admin/responsibility-units', { cache: 'no-store' });
  if (!response.ok) return;
  const { units } = await response.json();
  select.innerHTML = '<option value="">No scope (global review)</option>' + units.map(unit => `<option value="${esc(unit.path)}">${esc(unit.path)}</option>`).join('');
  if (row) row.style.display = '';
}
function editHostedUser(user) {
  if (!user) return;
  document.getElementById('account-id').value = user.id;
  document.getElementById('account-name').value = user.name;
  document.getElementById('account-username').value = user.username || '';
  document.getElementById('account-email').value = user.email || '';
  document.getElementById('account-role').value = user.role;
  document.getElementById('account-employee').value = user.employeeId ?? '';
  document.getElementById('account-scope').value = user.responsibilityScopes?.[0]?.unitPath ?? '';
  document.getElementById('account-password').value = '';
  document.getElementById('account-password').required = false;
}
async function deleteHostedUser(userId) {
  if (!userId || !confirm('Delete this user account? Existing audit entries will remain.')) return;
  const response = await fetch(`/api/admin/users/${encodeURIComponent(userId)}`, { method: 'DELETE' });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) { alert(result.error || 'Could not delete user.'); return; }
  resetAccountForm();
  await loadHostedUsers();
}
async function toggleHostedUser(user) {
  if (!user) return;
  const action = user.disabled ? 'enable' : 'disable';
  if (!confirm(`${action[0].toUpperCase() + action.slice(1)} ${user.name}'s account?`)) return;
  const response = await fetch(`/api/admin/users/${encodeURIComponent(user.id)}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ disabled: !user.disabled }) });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) { alert(result.error || `Could not ${action} user.`); return; }
  await loadHostedUsers();
}
function resetHostedUserPassword(user) {
  if (!user) return;
  editHostedUser(user);
  const field = document.getElementById('account-password');
  field.required = true;
  field.focus();
  showToast(`Enter a new password for ${user.name}, then save the account.`, 4500);
}
async function revokeHostedUserSessions(userId) {
  if (!userId || !confirm('Revoke all active sessions for this user?')) return;
  const response = await fetch(`/api/admin/users/${encodeURIComponent(userId)}/revoke-sessions`, { method: 'POST' });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) { alert(result.error || 'Could not revoke sessions.'); return; }
  showToast('User sessions revoked.', 3000);
}
async function saveHostedUser(event) {
  event.preventDefault();
  const id = document.getElementById('account-id').value;
  const payload = { name: document.getElementById('account-name').value, username: document.getElementById('account-username').value, email: document.getElementById('account-email').value, role: document.getElementById('account-role').value };
  const password = document.getElementById('account-password').value;
  if (password) payload.password = password;
  const response = await fetch(id ? `/api/admin/users/${encodeURIComponent(id)}` : '/api/admin/users', { method: id ? 'PATCH' : 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) { alert(result.error || 'Could not save user.'); return; }
  const employeeId = document.getElementById('account-employee').value;
  const linkResponse = await fetch(`/api/admin/users/${encodeURIComponent(result.user.id)}/personnel-link`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ employeeId: employeeId ? Number(employeeId) : null }) });
  if (!linkResponse.ok) { const linkResult = await linkResponse.json().catch(() => ({})); alert(linkResult.error || 'User saved, but personnel link could not be updated.'); }
  if (result.user.role === 'admin') {
    const scopePath = document.getElementById('account-scope').value;
    const currentScope = result.user.responsibilityScopes?.[0];
    if (scopePath) {
      const scopeResponse = await fetch(`/api/admin/users/${encodeURIComponent(result.user.id)}/responsibility-scopes`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ unitPath: scopePath, includeDescendants: true }) });
      if (!scopeResponse.ok) { const scopeResult = await scopeResponse.json().catch(() => ({})); alert(scopeResult.error || 'User saved, but responsibility scope could not be updated.'); }
    } else if (currentScope) {
      await fetch(`/api/admin/users/${encodeURIComponent(result.user.id)}/responsibility-scopes/${encodeURIComponent(currentScope.id)}`, { method: 'DELETE' });
    }
  }
  resetAccountForm();
  await loadHostedUsers();
  await loadPersonnelLinkOptions();
}
async function signOutHostedUser() {
  if (!hostedMode) return;
  await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
  hostedUser = null;
  updateHostedAccountUi();
  document.getElementById('settings-modal')?.classList.remove('open');
  document.getElementById('account-management-modal')?.classList.remove('open');
  showHostedAuthScreen('login', 'You have been signed out.');
}
function openAdministrationSettings() {
  openSettingsChild('administration-settings-modal', 'settings-modal');
  const info = document.getElementById('admin-audit-info');
  const checksToggle = document.getElementById('set-operational-checks-enabled');
  if (checksToggle) checksToggle.checked = operationalChecksEnabled;
  document.getElementById('set-bug-report-enabled').checked = appSettings.bugReportEnabled === true;
  if (info) info.innerHTML = `Active file: <b>${esc(activeFileName || 'None')}</b><br>Source: <b>${esc(remoteUpdateSource)}</b><br>Status: <b>${hasUnsavedChanges ? 'Unsaved changes' : 'Saved'}</b><br>App version: <b>${esc(APP_VERSION)}</b><br>Data format: <b>v${DATA_VERSION}</b>`;
  document.getElementById('administration-settings-modal').classList.add('open');
  loadAdministrationStatistics();
}
function formatStatisticBytes(bytes) {
  const value = Number(bytes) || 0;
  if (value < 1024) return `${value} B`;
  if (value < 1024 ** 2) return `${(value / 1024).toFixed(1)} KB`;
  if (value < 1024 ** 3) return `${(value / 1024 ** 2).toFixed(1)} MB`;
  return `${(value / 1024 ** 3).toFixed(2)} GB`;
}
function formatStatisticDate(value) {
  if (!value) return 'Unavailable';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Unavailable' : date.toLocaleString();
}
function renderAdministrationStatistics(stats) {
  const target = document.getElementById('admin-statistics');
  if (!target) return;
  target.innerHTML = `<div class="admin-stat-toolbar"><span class="form-hint">Generated ${esc(formatStatisticDate(stats.generatedAt))}</span><button class="btn btn-sm" type="button" onclick="loadAdministrationStatistics()">Refresh</button></div><div class="admin-stat-grid"><div><b>Storage</b><span>Total ${esc(formatStatisticBytes(stats.storage.totalBytes))}</span><small>Database ${esc(formatStatisticBytes(stats.storage.databaseBytes))} · WAL ${esc(formatStatisticBytes(stats.storage.walBytes))} · SHM ${esc(formatStatisticBytes(stats.storage.shmBytes))}</small></div><div><b>Records</b><span>${stats.records.users} users · ${stats.records.personnel} personnel · ${stats.records.activities} activities</span><small>${stats.records.scheduleEntries} schedule entries · ${stats.records.statuses} statuses · ${stats.records.categories} categories</small></div><div><b>User activity</b><span>${stats.users.onlineNow} active now · ${stats.users.recentlyActive} active this week</span><small>${stats.users.neverActive} never active · ${stats.users.disabled} disabled</small></div><div><b>Recent changes</b><span>${stats.changes.planner24h} planner changes / 24h</span><small>${stats.changes.planner7d} planner changes / 7d · ${stats.changes.audit7d} audit events / 7d</small></div><div><b>Database health</b><span>SQLite ${esc(stats.health.sqliteVersion)} · ${esc(stats.health.journalMode)}</span><small>Schema v${stats.health.schemaVersion} · Integrity: ${esc(stats.health.integrityCheck)}</small></div></div><div class="form-hint">Database last modified: ${esc(formatStatisticDate(stats.storage.modifiedAt))}</div>`;
}
async function loadAdministrationStatistics() {
  const target = document.getElementById('admin-statistics');
  if (!target || !hostedMode || hostedUser?.role !== 'admin') return;
  target.textContent = 'Loading statistics…';
  const response = await fetch('/api/admin/statistics', { cache: 'no-store' });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) { target.textContent = result.error || 'Statistics unavailable.'; return; }
  renderAdministrationStatistics(result);
}
async function factoryResetHostedApp() {
  if (!hostedMode || hostedUser?.role !== 'admin') {
    showToast('Administrator access is required.', 3500);
    return;
  }
  const confirmation = prompt('This permanently deletes all ATLAS data and accounts. Type RESET ATLAS to continue.');
  if (confirmation !== 'RESET ATLAS') return;
  if (!confirm('Final confirmation: permanently erase the entire ATLAS database and return to first-run setup?')) return;
  const response = await fetch('/api/admin/factory-reset', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ confirmation }),
  });
  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    alert(result.error || 'Factory reset failed.');
    return;
  }
  hostedUser = null;
  document.getElementById('administration-settings-modal')?.classList.remove('open');
  document.getElementById('settings-modal')?.classList.remove('open');
  showHostedAuthScreen('setup', 'ATLAS was reset. Create the first administrator to begin again.');
}
async function saveAdministrationSettings() {
  if (hostedMode && hostedUser?.role === 'admin') {
    const enabled = document.getElementById('set-operational-checks-enabled')?.checked === true;
    const response = await fetch('/api/admin/settings', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ operationalChecksEnabled: enabled }) });
    if (!response.ok) { const result = await response.json().catch(() => ({})); alert(result.error || 'Could not save operational-check settings.'); return; }
    operationalChecksEnabled = enabled;
    if (!enabled) showAdminCheckIndicators = false;
  }
  await mutateState('saveAdministrationSettings', () => {
    appSettings.bugReportEnabled = document.getElementById('set-bug-report-enabled').checked === true;
    persistSettings();
  });
  if (!appSettings.bugReportEnabled && currentPage === 'bug-report') currentPage = 'grid';
  closeModal('administration-settings-modal');
  renderPage();
}
function openScheduleSettings() {
  openSettingsChild('schedule-settings-modal', 'settings-modal');
  document.getElementById('set-core-time').value = appSettings.coreWorkdayRange || '0730-1500';
  document.getElementById('set-jump-to-today').checked = appSettings.jumpToTodayOnGridChange !== false;
  document.getElementById('set-show-level-rank').checked = appSettings.showLevelRankInSchedule !== false;
  document.getElementById('set-planning-horizon-days').value = String(appSettings.planningHorizonDays ?? 0);
  document.getElementById('set-planning-horizon-color').value = normalizeHexColor(appSettings.planningHorizonColor, '#ef4444');
  document.getElementById('set-core-time').oninput = updateCoreHoursDisplayFromRangeInput;
  updateCoreHoursDisplayFromRangeInput();
  document.getElementById('schedule-settings-modal').classList.add('open');
}
function openDataBackupSettings() {
  openSettingsChild('data-backup-settings-modal', 'settings-modal');
  updateDefaultJsonStatus();
  document.getElementById('data-backup-settings-modal').classList.add('open');
}
function openOrganisationStructure() {
  openSettingsChild('organisation-structure-modal', 'settings-modal');
  renderOrganisationStructure();
  document.getElementById('organisation-structure-modal').classList.add('open');
}
function openPersonnelSettings() {
  openSettingsChild('personnel-settings-modal', 'settings-modal');
  document.getElementById('personnel-light-max').value = String(appSettings.lightMax);
  document.getElementById('personnel-normal-max').value = String(appSettings.normalMax);
  document.getElementById('personnel-high-max').value = String(appSettings.highMax);
  document.getElementById('personnel-settings-modal').classList.add('open');
}
async function savePersonnelSettings() {
  const lightMax = parseFloat(document.getElementById('personnel-light-max').value);
  const normalMax = parseFloat(document.getElementById('personnel-normal-max').value);
  const highMax = parseFloat(document.getElementById('personnel-high-max').value);
  if (![lightMax, normalMax, highMax].every(Number.isFinite) || !(lightMax < normalMax && normalMax < highMax)) {
    alert('Staffing-load thresholds must increase from Light to High.');
    return;
  }
  await mutateState('savePersonnelSettings', () => {
    appSettings.lightMax = lightMax;
    appSettings.normalMax = normalMax;
    appSettings.highMax = highMax;
    persistSettings();
  });
  closeModal('personnel-settings-modal');
  renderPage();
}
function renderOrganisationStructure() {
  const list = document.getElementById('organisation-structure-list');
  if (!list) return;
  const nodeKey = (level, parent, value) => JSON.stringify({ level, parent, value });
  const valuesFor = (level, parent) => {
    const members = employees.filter(employee => {
      const path = hierarchyParentPath(employee, level);
      return path.slice(0, -1).join('\u0000') === parent.join('\u0000');
    });
    return [...new Set(members.map(employee => hierarchyValue(employee, level)))].filter(value => level !== 'team' || value !== 'Unassigned team').sort((a, b) => hierarchyOrderFor(level, parent, a) - hierarchyOrderFor(level, parent, b) || a.localeCompare(b, 'nb', { sensitivity: 'base' }));
  };
  const membersFor = (level, parent, value) => employees.filter(employee => hierarchyParentPath(employee, level).slice(0, -1).join('\u0000') === parent.join('\u0000') && hierarchyValue(employee, level) === value);
  const children = (level, parent) => {
    const next = { department: 'section', section: 'process', process: 'team' }[level];
    return next ? valuesFor(next, [...parent]) : [];
  };
  const renderNode = (level, parent, value, depth) => {
    const members = membersFor(level, parent, value);
    const next = { department: 'section', section: 'process', process: 'team' }[level];
    const key = nodeKey(level, parent, value);
    const color = level === 'department' ? (resolveDeptColor(value) || '#64748b') : level === 'section' ? (resolveSectionColor(parent[1], value) || '#64748b') : level === 'process' ? (resolveProcessColor(parent[1], parent[2], value) || '#64748b') : (resolveSubdepartmentColor(parent[1], value) || '#64748b');
    const childMarkup = next ? valuesFor(next, [...parent, value]).map(child => renderNode(next, [...parent, value], child, depth + 1)).join('') : '';
    const siblingValues = valuesFor(level, parent);
    const index = siblingValues.indexOf(value);
    const moveButton = (direction, icon, label) => `<button class="org-tree-action" type="button" aria-label="${label} ${esc(value)}" title="${label}" ${direction < 0 && index === 0 || direction > 0 && index === siblingValues.length - 1 ? 'disabled' : ''} onclick="moveStructureNode(${esc(JSON.stringify(key))},${direction})">${svgIcon(icon)}</button>`;
    return `<div class="org-tree-node" data-depth="${depth}" data-node='${esc(key)}' ondragover="allowStructureDrop(event)" ondrop="dropStructure(event)" ondragleave="clearStructureDrop(event)">
      <div class="org-tree-row" draggable="true" ondragstart="startStructureDrag(event)" ondragend="endStructureDrag(event)">
        <button class="org-tree-handle" type="button" draggable="true" aria-label="Drag ${esc(value)}" title="Drag to reorder">⋮⋮</button>
        <span class="org-tree-swatch" style="background:${color}"></span><span class="org-tree-label">${esc(value)}</span><span class="org-tree-level">${level}</span><span class="org-tree-count">${members.length}</span>
        <span class="org-tree-actions">${moveButton(-1, 'chevronUp', 'Move up')}${moveButton(1, 'chevronDown', 'Move down')}</span>
      </div>${childMarkup ? `<div class="org-tree-children">${childMarkup}</div>` : ''}
    </div>`;
  };
  const organisations = [...new Set(employees.map(employee => employee.organisation || 'Unassigned organisation'))].sort((a, b) => a.localeCompare(b, 'nb', { sensitivity: 'base' }));
  list.innerHTML = `<div class="org-tree-intro"><span class="org-tree-intro-icon">↕</span><div><strong>Drag the handle to reorder</strong><span>Only items with the same parent can be reordered. Use the arrow buttons for precise keyboard control.</span></div></div>${organisations.map(organisation => `<section class="org-tree-organisation"><header><span>${esc(organisation)}</span><span>${employees.filter(employee => (employee.organisation || 'Unassigned organisation') === organisation).length} people</span></header>${valuesFor('department', [organisation]).map(department => renderNode('department', [organisation], department, 0)).join('')}</section>`).join('') || '<div class="empty-note">No personnel hierarchy data yet.</div>'}`;
}
let structureDrag = null;
function startStructureDrag(event) {
  const node = event.currentTarget.closest('.org-tree-node');
  if (!node) return;
  structureDrag = JSON.parse(node.dataset.node);
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('text/plain', JSON.stringify(structureDrag));
  node.classList.add('org-tree-dragging');
}
function allowStructureDrop(event) {
  event.preventDefault();
  const node = event.currentTarget.closest('.org-tree-node');
  const target = node ? JSON.parse(node.dataset.node) : null;
  if (!structureDrag || !target || structureDrag.level !== target.level || JSON.stringify(structureDrag.parent) !== JSON.stringify(target.parent) || JSON.stringify(structureDrag) === JSON.stringify(target)) return;
  event.dataTransfer.dropEffect = 'move';
  node.classList.add('org-tree-drop-target');
}
function clearStructureDrop(event) { event.currentTarget.closest('.org-tree-node')?.classList.remove('org-tree-drop-target'); }
function endStructureDrag() { document.querySelectorAll('.org-tree-dragging,.org-tree-drop-target').forEach(node => node.classList.remove('org-tree-dragging', 'org-tree-drop-target')); structureDrag = null; }
async function dropStructure(event) {
  event.preventDefault();
  const targetNode = event.currentTarget.closest('.org-tree-node');
  const target = targetNode ? JSON.parse(targetNode.dataset.node) : null;
  if (!structureDrag || !target || structureDrag.level !== target.level || JSON.stringify(structureDrag.parent) !== JSON.stringify(target.parent) || structureDrag.value === target.value) return endStructureDrag();
  await reorderStructureNodes(structureDrag, target, false);
  endStructureDrag();
  renderOrganisationStructure();
}
async function reorderStructureNodes(source, target, after = false) {
  const values = [...new Set(employees.filter(employee => hierarchyParentPath(employee, source.level).slice(0, -1).join('\u0000') === source.parent.join('\u0000')).map(employee => hierarchyValue(employee, source.level)))].sort((a, b) => hierarchyOrderFor(source.level, source.parent, a) - hierarchyOrderFor(source.level, source.parent, b) || a.localeCompare(b, 'nb', { sensitivity: 'base' }));
  const sourceIndex = values.indexOf(source.value), targetIndex = values.indexOf(target.value);
  if (sourceIndex < 0 || targetIndex < 0) return;
  values.splice(sourceIndex, 1); values.splice(values.indexOf(target.value) + (after ? 1 : 0), 0, source.value);
  await mutateState('reorderStructure', () => { values.forEach((value, index) => { hierarchyOrder[source.level][hierarchyOrderKey(...source.parent, value)] = (index + 1) * 10; }); }, { saveDisk: true });
  showToast(`${source.level[0].toUpperCase() + source.level.slice(1)} order updated.`, 2500);
}
async function moveStructureNode(nodeJson, direction) {
  const source = typeof nodeJson === 'string' ? JSON.parse(nodeJson) : nodeJson;
  const values = [...new Set(employees.filter(employee => hierarchyParentPath(employee, source.level).slice(0, -1).join('\u0000') === source.parent.join('\u0000')).map(employee => hierarchyValue(employee, source.level)))].sort((a, b) => hierarchyOrderFor(source.level, source.parent, a) - hierarchyOrderFor(source.level, source.parent, b) || a.localeCompare(b, 'nb', { sensitivity: 'base' }));
  const index = values.indexOf(source.value), targetValue = values[index + Number(direction)];
  if (!targetValue) return;
  await reorderStructureNodes(source, { ...source, value: targetValue }, direction > 0);
  renderOrganisationStructure();
}
function openShiftRotationSettings() {
    openSettingsChild('shift-rotation-settings-modal', 'settings-modal');
  const enabled = document.getElementById('set-shift-rotation-enabled');
  if (enabled) enabled.checked = appSettings.shiftRotationEnabled === true;
  const ranges = normalizeShiftRotationRanges(appSettings.shiftRotationRanges);
  ['normal', 'day', 'evening', 'night'].forEach(key => {
    const input = document.getElementById(`set-rotation-${key}`);
    if (input) input.value = ranges[key];
  });
  const colors = normalizeShiftRotationColors(appSettings.shiftRotationColors);
  ['normal', 'day', 'evening', 'night', 'turn', 'leave', 'overtime'].forEach(key => {
    const input = document.getElementById(`set-rotation-color-${key}`);
    if (input) input.value = colors[key];
  });
  document.getElementById('shift-rotation-settings-modal').classList.add('open');
  renderShiftTeamSettings();
}
function renderShiftTeamSettings() {
  const list = document.getElementById('set-shift-team-list');
  if (!list) return;
  const teams = normalizeShiftTeams(appSettings.shiftTeams);
  list.innerHTML = teams.length ? teams.map(team => `<div style="display:flex;align-items:center;gap:8px;padding:6px 8px;border:1px solid var(--border);border-radius:8px"><span class="chip-dot" style="background:${team.color};width:9px;height:9px;border-radius:50%"></span><span style="flex:1">${esc(team.name)}</span><button class="icon-btn danger" type="button" onclick="removeShiftTeamSetting('${esc(team.id)}')">${svgIcon('trash')}</button></div>`).join('') : '<div class="form-hint">No Shift Teams configured.</div>';
}
function addShiftTeamSetting() {
  const name = document.getElementById('set-shift-team-name').value.trim();
  if (!name) return;
  const teams = normalizeShiftTeams(appSettings.shiftTeams);
  if (teams.some(team => team.name.toLowerCase() === name.toLowerCase())) { alert('A Shift Team with that name already exists.'); return; }
  teams.push({ id: `shift-team-${Date.now()}`, name, color: document.getElementById('set-shift-team-color').value, order: (teams.length + 1) * 10 });
  appSettings.shiftTeams = teams;
  document.getElementById('set-shift-team-name').value = '';
  renderShiftTeamSettings();
}
function removeShiftTeamSetting(id) {
  appSettings.shiftTeams = normalizeShiftTeams(appSettings.shiftTeams).filter(team => team.id !== id);
  employees.forEach(employee => { if (employee.shiftTeamId === id) employee.shiftTeamId = ''; });
  renderShiftTeamSettings();
}
async function saveShiftRotationSettings() {
  const rotationRanges = {};
  for (const key of ['normal', 'day', 'evening', 'night']) {
    const value = normalizeShiftRotationRange(document.getElementById(`set-rotation-${key}`)?.value, '');
    if (!value) { alert('Shift Rotation ranges must be valid, for example 0730-1500.'); return; }
    rotationRanges[key] = value;
  }
  const shiftRotationColors = normalizeShiftRotationColors(Object.fromEntries(
    ['normal', 'day', 'evening', 'night', 'turn', 'leave', 'overtime']
      .map(key => [key, document.getElementById(`set-rotation-color-${key}`)?.value]),
  ));
  const shiftRotationEnabled = document.getElementById('set-shift-rotation-enabled')?.checked === true;
  await mutateState('saveShiftRotationSettings', () => {
    appSettings.shiftRotationEnabled = shiftRotationEnabled;
    appSettings.shiftRotationRanges = rotationRanges;
    appSettings.shiftRotationColors = shiftRotationColors;
    appSettings.shiftTeams = normalizeShiftTeams(appSettings.shiftTeams);
    persistSettings();
  });
  closeModal('shift-rotation-settings-modal');
  updateSaveButton();
  updateSbStatus();
  renderPage();
}
async function hashAdminPassword(password) {
  if (globalThis.crypto?.subtle) {
    const bytes = new TextEncoder().encode(password);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
  }
  let hash = 2166136261;
  for (const character of String(password)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return `fallback-${(hash >>> 0).toString(16)}`;
}
async function setBossPassword() {
  const field = document.getElementById('set-admin-password');
  const password = field?.value || '';
  if (password.length < 1) { alert('Enter a boss password first.'); return; }
  try {
    const passwordHash = await hashAdminPassword(password);
    await mutateState('setBossPassword', () => {
      appSettings.adminPasswordHash = passwordHash;
      persistSettings();
    });
    field.value = '';
    document.getElementById('boss-session-status').textContent = 'Password saved. Boss view is locked.';
    alert('Boss password saved. Use Unlock boss view to activate it.');
  } catch (error) {
    console.error('Boss password setup failed:', error);
    alert('The boss password could not be saved.');
  }
}
async function unlockBossSession() {
  try {
    if (!appSettings.adminPasswordHash) { alert('Set a boss password and save Application settings first.'); return; }
    const field = document.getElementById('set-admin-password');
    const password = field?.value || '';
    if (!password) { alert('Enter the boss password in the password field first.'); return; }
    if (await hashAdminPassword(password) !== appSettings.adminPasswordHash) { alert('Incorrect boss password.'); return; }
    bossSessionActive = true;
    field.value = '';
    closeModal('settings-modal');
    renderPage();
  } catch (error) {
    console.error('Boss view unlock failed:', error);
    alert('Boss view could not be unlocked. Set the password again and save settings.');
  }
}
function lockBossSession() {
  bossSessionActive = false;
  closeModal('settings-modal');
  renderPage();
}
function renderHolidaySettings() {
  const list = document.getElementById('set-holiday-list');
  if (!list) return;
  list.innerHTML = appSettings.holidays.length ? appSettings.holidays.map((holiday, index) => `<div class="flex items-center justify-between" style="padding:5px 8px;background:var(--muted-bg);border-radius:5px;font-size:12px"><span><b>${esc(fmtMed(holiday.date))}</b> · ${esc(holiday.name || 'Holiday')} <span class="muted">(${holiday.nonWorking === false ? 'highlight only' : 'non-working'})</span></span><button class="icon-btn danger" type="button" title="Remove" onclick="removeHolidaySetting(${index})">&times;</button></div>`).join('') : '<div class="muted text-sm">No red dates added.</div>';
}
async function addHolidaySetting() {
  const date = document.getElementById('set-holiday-date').value;
  const endDate = document.getElementById('set-holiday-end').value || date;
  const name = document.getElementById('set-holiday-name').value.trim();
  const nonWorking = document.getElementById('set-holiday-nonworking').checked;
  if (!date || endDate < date) return;
  await mutateState('addHolidaySetting', () => {
    for (const day = new Date(`${date}T00:00:00`); fmt(day) <= endDate; day.setDate(day.getDate() + 1)) {
      const holidayDate = fmt(day);
      if (!appSettings.holidays.some(holiday => holiday.date === holidayDate)) appSettings.holidays.push({ date: holidayDate, name, nonWorking });
    }
    persistSettings();
  });
  document.getElementById('set-holiday-date').value = '';
  document.getElementById('set-holiday-end').value = '';
  document.getElementById('set-holiday-name').value = '';
  renderHolidaySettings();
}
async function removeHolidaySetting(index) {
  await mutateState('removeHolidaySetting', () => {
    appSettings.holidays.splice(index, 1);
    persistSettings();
  });
  renderHolidaySettings();
}
function openSpecialDaysModal() {
    if (!document.getElementById('special-days-modal')?.classList.contains('open')) openSettingsChild('special-days-modal', 'schedule-settings-modal');
  appSettings.specialDays = normalizeSpecialDays(appSettings.specialDays);
  resetSpecialDayForm();
  toggleSpecialDayFields();
  document.getElementById('special-days-visible').checked = appSettings.specialDaysVisible !== false;
  renderSpecialDaysList();
  document.getElementById('special-days-modal').classList.add('open');
}
function openSpecialDayForDate(date) {
  if (!isValidIsoDate(date)) return;
  openSpecialDaysModal();
  document.getElementById('special-day-kind').value = 'oneOff';
  document.getElementById('special-day-date').value = date;
  document.getElementById('special-day-name').value = '';
  toggleSpecialDayFields();
  setTimeout(() => document.getElementById('special-day-name')?.focus(), 50);
}
function closeSpecialDaysModal() { document.getElementById('special-days-modal')?.classList.remove('open'); }
function resetSpecialDayForm() {
  editingSpecialDay = null;
  document.getElementById('special-day-name').value = '';
  document.getElementById('special-day-kind').value = 'recurring';
  document.getElementById('special-day-month-day').value = '';
  document.getElementById('special-day-date').value = '';
  document.getElementById('special-day-color').value = '#ef4444';
  document.getElementById('special-day-nonworking').checked = true;
  document.getElementById('special-day-save').textContent = 'Add special day';
  document.getElementById('special-day-cancel-edit').style.display = 'none';
  toggleSpecialDayFields();
}
function setSpecialDaysVisibility(visible) {
  appSettings.specialDaysVisible = visible === true;
  persistSettings();
  renderPage();
}
function toggleSpecialDayFields() {
  const recurring = document.getElementById('special-day-kind')?.value !== 'oneOff';
  document.getElementById('special-day-recurring-fields').style.display = recurring ? 'grid' : 'none';
  document.getElementById('special-day-oneoff-fields').style.display = recurring ? 'none' : 'block';
}
function renderSpecialDaysList() {
  const list = document.getElementById('special-days-list');
  if (!list) return;
  const specialDays = normalizeSpecialDays(appSettings.specialDays);
  const rows = [
    ...specialDays.recurring.map((item, index) => ({ ...item, kind: 'recurring', value: item.monthDay, index })),
    ...specialDays.oneOff.map((item, index) => ({ ...item, kind: 'oneOff', value: item.date, index })),
  ];
  list.innerHTML = rows.length ? rows.map(item => `<div class="flex items-center justify-between" style="padding:7px 9px;background:var(--muted-bg);border-radius:6px;font-size:12px"><span class="flex items-center gap-2"><span style="width:9px;height:9px;border-radius:50%;background:${item.color};flex:0 0 auto"></span><span><b>${esc(item.name)}</b> · ${esc(item.kind === 'recurring' ? specialDayDisplayValue(item.value) : item.value)} <span class="muted">(${item.kind === 'recurring' ? 'recurring' : 'one-off'}${item.nonWorking ? ', non-working' : ', highlight only'})</span></span></span><span class="flex gap-2"><button class="icon-btn" type="button" title="Edit" onclick="startEditSpecialDay('${item.kind}',${item.index})">${svgIcon('edit')}</button><button class="icon-btn danger" type="button" title="Remove" onclick="removeSpecialDay('${item.kind}',${item.index})">&times;</button></span></div>`).join('') : '<div class="muted text-sm">No special days added.</div>';
}
function specialDayDisplayValue(monthDay) {
  const [month, day] = String(monthDay || '').split('-');
  return day && month ? `${day}-${month}` : String(monthDay || '');
}
function startEditSpecialDay(kind, index) {
  const specialDays = normalizeSpecialDays(appSettings.specialDays);
  const item = specialDays[kind]?.[index];
  if (!item) return;
  editingSpecialDay = { kind, index };
  document.getElementById('special-day-name').value = item.name;
  document.getElementById('special-day-kind').value = kind;
  document.getElementById('special-day-month-day').value = kind === 'recurring' ? specialDayDisplayValue(item.monthDay) : '';
  document.getElementById('special-day-date').value = kind === 'oneOff' ? item.date : '';
  document.getElementById('special-day-color').value = item.color;
  document.getElementById('special-day-nonworking').checked = item.nonWorking;
  document.getElementById('special-day-save').textContent = 'Save changes';
  document.getElementById('special-day-cancel-edit').style.display = '';
  toggleSpecialDayFields();
}
async function addSpecialDay() {
  const name = document.getElementById('special-day-name').value.trim();
  const kind = document.getElementById('special-day-kind').value;
  const value = kind === 'oneOff' ? document.getElementById('special-day-date').value : document.getElementById('special-day-month-day').value.trim();
  const validMonthDay = /^(0[1-9]|[12]\d|3[01])-(0[1-9]|1[0-2])$/.test(value);
  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(value);
  if (!name || (kind === 'recurring' && !validMonthDay) || (kind === 'oneOff' && !validDate)) { alert(kind === 'recurring' ? 'Enter a name and month-day in DD-MM format.' : 'Enter a name and valid date.'); return; }
  if (kind === 'recurring') {
    const [day, month] = value.split('-').map(Number);
    if (day > new Date(2024, month, 0).getDate()) { alert('That month-day is not valid.'); return; }
  }
  const specialDays = normalizeSpecialDays(appSettings.specialDays);
  const record = { id: `special-${Date.now()}`, name, color: normalizeHexColor(document.getElementById('special-day-color').value, '#ef4444'), nonWorking: document.getElementById('special-day-nonworking').checked };
  if (kind === 'recurring') { const [day, month] = value.split('-'); record.monthDay = `${month}-${day}`; specialDays.recurring.push(record); }
  else { record.date = value; specialDays.oneOff.push(record); }
  if (editingSpecialDay) {
    const existing = specialDays[editingSpecialDay.kind]?.[editingSpecialDay.index];
    record.id = existing?.id || record.id;
    specialDays[editingSpecialDay.kind].splice(editingSpecialDay.index, 1);
    if (editingSpecialDay.kind === 'recurring') specialDays.recurring.push(record);
    else specialDays.oneOff.push(record);
  }
  await mutateState('addSpecialDay', () => {
    appSettings.specialDays = specialDays;
    persistSettings();
  });
  document.getElementById('special-day-name').value = '';
  document.getElementById('special-day-month-day').value = '';
  document.getElementById('special-day-date').value = '';
  document.getElementById('special-day-color').value = '#ef4444';
  resetSpecialDayForm();
  renderSpecialDaysList();
  renderPage();
}
async function removeSpecialDay(kind, index) {
  const specialDays = normalizeSpecialDays(appSettings.specialDays);
  specialDays[kind].splice(index, 1);
  await mutateState('removeSpecialDay', () => {
    appSettings.specialDays = specialDays;
    persistSettings();
  });
  renderSpecialDaysList();
  renderPage();
}
function specialDayFor(date) {
  const specialDays = normalizeSpecialDays(appSettings.specialDays);
  const oneOff = specialDays.oneOff.find(item => item.date === date);
  if (oneOff) return { ...oneOff, isSpecialDay: true };
  const recurring = specialDays.recurring.find(item => item.monthDay === date.slice(5));
  return recurring ? { ...recurring, date, startDate: date, endDate: date, isSpecialDay: true } : null;
}
function displayedSpecialDayFor(date) {
  return appSettings.specialDaysVisible === false ? null : specialDayFor(date);
}
function holidayFor(date) {
  const holiday = appSettings.holidays.find(holiday => {
    if (holiday.startDate && holiday.endDate) return date >= holiday.startDate && date <= holiday.endDate;
    return holiday.date === date;
  });
  return holiday || specialDayFor(date);
}
function displayedHolidayFor(date) {
  if (!showHolidays) return displayedSpecialDayFor(date);
  const holiday = appSettings.holidays.find(item => {
    if (item.startDate && item.endDate) return date >= item.startDate && date <= item.endDate;
    return item.date === date;
  });
  return holiday || displayedSpecialDayFor(date);
}
function holidayPeriodsForYear(year) {
  const periods = [];
  const records = appSettings.holidays.map((holiday, index) => ({
    ...holiday,
    sourceIndex: index,
    startDate: holiday.startDate || holiday.date,
    endDate: holiday.endDate || holiday.date,
  })).sort((a, b) => a.startDate.localeCompare(b.startDate));
  records.forEach(record => {
    const previous = periods[periods.length - 1];
    const nextDay = previous ? new Date(`${previous.endDate}T00:00:00`) : null;
    if (previous && previous.name === record.name && previous.nonWorking === record.nonWorking && previous.color === record.color && nextDay && (nextDay.setDate(nextDay.getDate() + 1), fmt(nextDay) >= record.startDate)) {
      if (record.endDate > previous.endDate) previous.endDate = record.endDate;
      previous.sourceIndexes.push(record.sourceIndex);
    } else periods.push({ ...record, sourceIndexes: [record.sourceIndex] });
  });
  return periods.filter(period => period.endDate >= `${year}-01-01` && period.startDate <= `${year}-12-31`);
}
function holidayPeriodsForRange(start, end) {
  return holidayPeriodsForYear(new Date(`${start}T00:00:00`).getFullYear())
    .concat(holidayPeriodsForYear(new Date(`${end}T00:00:00`).getFullYear()))
    .filter((period, index, all) => period.endDate >= start && period.startDate <= end && all.findIndex(item => item.sourceIndexes?.join(',') === period.sourceIndexes?.join(',')) === index);
}
let editingHolidayIndex = null;
let editingHolidayIndexes = [];
let editingSpecialDay = null;
let selectedHolidayColor = '#ef4444';
let pastHolidaysExpanded = false;
let showHolidays = true;
function openHolidayModal(index = null, indexes = null) {
  editingHolidayIndex = index;
  editingHolidayIndexes = indexes || (index === null ? [] : [index]);
  const holiday = index === null ? null : appSettings.holidays[index];
  const range = index === null ? pendingHolidayRange : null;
  pendingHolidayRange = null;
  document.getElementById('holiday-modal-title').textContent = holiday ? 'Edit Holiday' : 'Add Holiday';
  document.getElementById('hf-delete-btn').style.display = holiday ? 'inline-block' : 'none';
  document.getElementById('hf-name').value = holiday?.name || '';
  document.getElementById('hf-start').value = range?.startDate || holiday?.startDate || holiday?.date || `${gridYear}-01-01`;
  document.getElementById('hf-end').value = range?.endDate || holiday?.endDate || holiday?.date || `${gridYear}-01-01`;
  document.getElementById('hf-nonworking').checked = holiday?.nonWorking === true;
  selectedHolidayColor = holiday?.color || '#ef4444';
  buildSwatchRow('hf-swatches', selectedHolidayColor, color => { selectedHolidayColor = color; markSwatch('hf-swatches', color); });
  document.getElementById('holiday-modal').classList.add('open');
}
async function saveHolidayFromModal() {
  const name = document.getElementById('hf-name').value.trim();
  const startDate = document.getElementById('hf-start').value;
  const endDate = document.getElementById('hf-end').value;
  if (!name || !startDate || !endDate || endDate < startDate) { alert('Enter a name and a valid date range.'); return; }

  await mutateState('saveHolidayFromModal', () => {
    const holiday = {
      id: editingHolidayIndex === null ? Date.now() : appSettings.holidays[editingHolidayIndex].id,
      name, startDate, endDate,
      nonWorking: document.getElementById('hf-nonworking').checked,
      color: selectedHolidayColor
    };
    if (editingHolidayIndex === null) {
      appSettings.holidays.push(holiday);
    } else {
      appSettings.holidays = appSettings.holidays.filter((_, index) => !editingHolidayIndexes.includes(index));
      appSettings.holidays.push(holiday);
    }
    persistSettings();
  }, { saveDisk: true });

  closeModal('holiday-modal');
  renderPage();
}

async function deleteHolidayFromModal() {
  if (editingHolidayIndex === null) return;
  await mutateState('deleteHolidayFromModal', () => {
    appSettings.holidays = appSettings.holidays.filter((_, index) => !editingHolidayIndexes.includes(index));
    persistSettings();
  }, { saveDisk: true });
  closeModal('holiday-modal');
  renderPage();
}

let importedHolidayEvents = [];

function parseIcsDateValue(value) {
  if (!value) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  if (/^\d{8}$/i.test(raw)) {
    const yyyy = raw.slice(0, 4), mm = raw.slice(4, 6), dd = raw.slice(6, 8);
    return `${yyyy}-${mm}-${dd}`;
  }
  const matched = raw.match(/^(\d{4})(\d{2})(\d{2})T?\d{0,6}Z?$/i);
  if (matched) return `${matched[1]}-${matched[2]}-${matched[3]}`;
  const iso = raw.replace(/Z$/i, '');
  const dt = new Date(iso);
  if (!Number.isNaN(dt.getTime())) return fmt(dt);
  return null;
}
function parseHolidayIcsFile(fileText) {
  const blocks = String(fileText || '').split(/BEGIN:VEVENT/i).filter(Boolean);
  const valid = [];
  for (const block of blocks) {
    const section = block.split(/END:VEVENT/i)[0] || block;
    const match = section.match(/DTSTART[^:]*:(.+)/i);
    const endMatch = section.match(/DTEND[^:]*:(.+)/i);
    if (!match) continue;
    const startDate = parseIcsDateValue(match[1]);
    if (!startDate) continue;
    const endDate = parseIcsDateValue(endMatch ? endMatch[1] : match[1]);
    const summaryLine = (section.match(/SUMMARY(?:;[^\r\n]*)?:([^\r\n]+)/i) || [])[1];
    const summary = summaryLine ? summaryLine.replace(/\\,|\\;/g, c => c === '\\,' ? ',' : ';').replace(/\\n/g, ' ').trim() : 'Holiday';
    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${(endDate || startDate)}T00:00:00`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) continue;
    valid.push({
      id: `${startDate}-${summary}`,
      name: summary || 'Holiday',
      startDate,
      endDate: endDate || startDate,
      selected: true,
      color: '#ef4444',
    });
  }
  const yearStart = `${gridYear}-01-01`;
  const yearEnd = `${gridYear}-12-31`;
  return valid.filter(item => item.startDate <= yearEnd && item.endDate >= yearStart).map(item => ({
    ...item,
    endDate: item.endDate < item.startDate ? item.startDate : item.endDate,
  }));
}
async function handleHolidayImportFile(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  try {
    const text = await file.text();
    importedHolidayEvents = parseHolidayIcsFile(text);
    renderHolidayImportModal();
  } catch (err) {
    console.warn('Holiday ICS import failed:', err);
    importedHolidayEvents = [];
    renderHolidayImportModal('No supported holiday events were found in the selected file.');
  }
  event.target.value = '';
}
function renderHolidayImportModal(message = '') {
  const list = document.getElementById('holiday-import-list');
  const modal = document.getElementById('holiday-import-modal');
  if (!list || !modal) return;
  if (!importedHolidayEvents.length) {
    list.innerHTML = message ? `<div class="muted text-sm">${esc(message)}</div>` : '<div class="muted text-sm">No holiday events found yet. Select an .ics file to review holiday entries.</div>';
    return;
  }
  list.innerHTML = importedHolidayEvents.map((item, index) => `
    <label style="display:flex;align-items:center;gap:10px;padding:8px 10px;border:1px solid var(--border);border-radius:8px;background:var(--surface)">
      <input type="checkbox" ${item.selected ? 'checked' : ''} onchange="importedHolidayEvents[${index}].selected = this.checked; renderHolidayImportModal();">
      <span style="flex:1">
        <span style="display:block;font-weight:600">${esc(item.name)}</span>
        <span class="muted text-sm">${esc(item.startDate)}${item.startDate !== item.endDate ? ` → ${esc(item.endDate)}` : ''}</span>
      </span>
    </label>
  `).join('');
}
function openHolidayImportModal() {
  const modal = document.getElementById('holiday-import-modal');
  if (!modal) return;
  importedHolidayEvents = [];
  renderHolidayImportModal();
  modal.classList.add('open');
}
function closeHolidayAddMenu() {
  const menu = document.getElementById('holiday-add-menu');
  if (menu) menu.classList.remove('open');
  const popover = document.getElementById('holiday-add-popover');
  if (!popover) return;
  popover.classList.remove('open');
  popover.style.left = '';
  popover.style.top = '';
}
function positionHolidayAddMenu(trigger, popover) {
  if (!trigger || !popover) return;
  const rect = trigger.getBoundingClientRect();
  const margin = 8;
  const menuWidth = Math.max(214, popover.offsetWidth || 214);
  let left = rect.right - menuWidth;
  let top = rect.bottom + 6;
  left = Math.max(margin, Math.min(left, window.innerWidth - menuWidth - margin));
  const menuHeight = popover.offsetHeight || 80;
  if (top + menuHeight > window.innerHeight - margin) top = Math.max(margin, rect.top - menuHeight - 6);
  popover.style.left = `${Math.round(left)}px`;
  popover.style.top = `${Math.round(top)}px`;
}
function toggleHolidayAddMenu(event) {
  event.stopPropagation();
  const menu = document.getElementById('holiday-add-menu');
  const popover = document.getElementById('holiday-add-popover');
  const trigger = menu ? menu.querySelector('button.icon-btn') : null;
  if (!menu || !popover || !trigger) return;
  const nextOpen = !popover.classList.contains('open');
  closeHolidayAddMenu();
  if (nextOpen) {
    menu.classList.add('open');
    popover.classList.add('open');
    positionHolidayAddMenu(trigger, popover);
  }
}
function holidayPopoverContains(target) {
  const popover = document.getElementById('holiday-add-popover');
  return !!(popover && popover.contains(target));
}
function holidayTriggerContains(target) {
  const menu = document.getElementById('holiday-add-menu');
  return !!(menu && menu.contains(target));
}
window.addEventListener('resize', () => {
  const nextActivityPageSize = activityPageCapacity();
  if (nextActivityPageSize !== activityPageSize) {
    activityPageSize = nextActivityPageSize;
    activityPageOffset = Math.floor(activityPageOffset / activityPageSize) * activityPageSize;
    if (currentPage === 'grid' && document.getElementById('gtbody')) renderGridBody(scheduleDays(), todayStr());
  }
  const popover = document.getElementById('holiday-add-popover');
  if (!popover || !popover.classList.contains('open')) return;
  const trigger = document.querySelector('#holiday-add-menu button.icon-btn');
  if (trigger) {
    positionHolidayAddMenu(trigger, popover);
  } else {
    closeHolidayAddMenu();
  }
});
window.addEventListener('scroll', () => {
  const popover = document.getElementById('holiday-add-popover');
  if (!popover || !popover.classList.contains('open')) return;
  const trigger = document.querySelector('#holiday-add-menu button.icon-btn');
  if (trigger) {
    positionHolidayAddMenu(trigger, popover);
  } else {
    closeHolidayAddMenu();
  }
}, true);
function openHolidayAddAction(action) {
  closeHolidayAddMenu();
  if (action === 'import') openHolidayImportModal();
  else openHolidayModal();
}
function closeHolidayImportModal() {
  const modal = document.getElementById('holiday-import-modal');
  if (modal) modal.classList.remove('open');
}
function setHolidayImportSelection(mode) {
  if (!importedHolidayEvents.length) return;
  if (mode === 'all') importedHolidayEvents.forEach(item => item.selected = true);
  else if (mode === 'future') importedHolidayEvents.forEach(item => item.selected = item.startDate >= todayStr());
  else importedHolidayEvents.forEach(item => item.selected = false);
  renderHolidayImportModal();
}
async function confirmHolidayImport() {
  if (!importedHolidayEvents.length) return;
  const selected = importedHolidayEvents.filter(item => item.selected);
  await mutateState('confirmHolidayImport', () => {
    const existingMap = new Map();
    appSettings.holidays.forEach((holiday, index) => {
      const key = `${holiday.startDate}|${holiday.endDate}|${holiday.name || 'Holiday'}`;
      if (!existingMap.has(key)) existingMap.set(key, index);
    });
    for (const item of selected) {
      const key = `${item.startDate}|${item.endDate}|${item.name}`;
      const matchIndex = existingMap.get(key);
      const holiday = { name: item.name, startDate: item.startDate, endDate: item.endDate, nonWorking: true, color: item.color || '#ef4444' };
      if (matchIndex !== undefined) appSettings.holidays[matchIndex] = { ...appSettings.holidays[matchIndex], ...holiday };
      else appSettings.holidays.push(holiday);
    }
    appSettings.holidays.sort((a, b) => a.startDate.localeCompare(b.startDate) || a.name.localeCompare(b.name));
    persistSettings();
  });
  closeHolidayImportModal();
  renderPage();
}
async function saveSettings() {
  const name = document.getElementById('set-app-name').value.trim();
  const securityLabel = normalizeSecurityLabel({
    enabled: document.getElementById('set-security-label-enabled').checked,
    text: document.getElementById('set-security-label-text').value,
    color: document.getElementById('set-security-label-color').value,
  });
  const showRank = document.getElementById('set-show-level-rank')?.checked;
  const workwheelEnabled = document.getElementById('set-workwheel-enabled')?.checked === true;
  const workwheelUpcomingDays = Math.max(1, Math.min(365, Math.round(Number(document.getElementById('set-workwheel-upcoming-days')?.value) || 14)));
  const workwheelGridDisplayMode = ['cells', 'both', 'row'].includes(document.getElementById('set-workwheel-grid-display')?.value) ? document.getElementById('set-workwheel-grid-display').value : 'cells';
  const myScheduleLookaheadDays = Math.max(1, Math.min(365, Math.round(Number(document.getElementById('set-my-schedule-lookahead-days')?.value) || 31)));
  await mutateState('saveSettings', () => {
    if (name) appSettings.appName = name;
    appSettings.securityLabel = securityLabel;
    if (typeof showRank === 'boolean') appSettings.showLevelRankInSchedule = showRank;
    appSettings.workwheelEnabled = workwheelEnabled;
    appSettings.workwheelUpcomingDays = workwheelUpcomingDays;
    appSettings.workwheelGridDisplayMode = workwheelGridDisplayMode;
      appSettings.myScheduleLookaheadDays = myScheduleLookaheadDays;
    persistSettings();
  });
  applyAppName();
  updateSaveButton();
  updateSbStatus();
  closeModal('settings-modal');
  renderPage();
}

function normalizeActivityStatusFilter(value, legacyConfirmedOnly = false) {
  const filter = String(value || '').toLowerCase();
  if (filter === 'confirmed' || filter === 'cancelled' || filter === 'tentative' || filter === 'all') return filter;
  return legacyConfirmedOnly ? 'confirmed' : 'all';
}
function setActivityStatusFilter(value) {
  appSettings.activityStatusFilter = normalizeActivityStatusFilter(value);
  appSettings.showOnlyConfirmedActivities = appSettings.activityStatusFilter === 'confirmed';
  activityPageOffset = 0;
  persistSettings();
  renderPage();
  if (appSettings.jumpToTodayOnGridChange !== false && appSettings.activityStatusFilter !== 'all') {
    setTimeout(jumpToFirstVisibleActivity, 120);
  }
}
function toggleShowOnlyConfirmedActivities(checked) {
  setActivityStatusFilter(checked === true ? 'confirmed' : 'all');
}
function setGridViewMode(mode) {
  gridViewMode = normalizeGridViewMode(mode);
  saveGridPreferences();
  renderPage();
}
function setScheduleSectionFilter(value) {
  scheduleSectionFilter = String(value || '');
  hiddenEmployees = new Set([...hiddenEmployees].filter(id => sortedEmployees().some(employee => employee.id === id)));
  activityPageOffset = 0;
  saveGridPreferences();
  renderPage();
}
function toggleGridSection(section) {
  if (!Object.prototype.hasOwnProperty.call(collapsedGridSections, section)) return;
  collapsedGridSections[section] = !collapsedGridSections[section];
  saveGridPreferences();
  renderGridBody(scheduleDays(), todayStr());
  if (appSettings.jumpToTodayOnGridChange !== false) setTimeout(scrollToToday, 60);
}
function jumpToFirstVisibleActivity() {
  const cell = [...document.querySelectorAll('td.activity-select-cell[data-row-key^="act-"][data-date]')]
    .find(candidate => candidate.querySelector('.act-bar'));
  if (!cell) {
    const filter = normalizeActivityStatusFilter(appSettings.activityStatusFilter, appSettings.showOnlyConfirmedActivities);
    if (filter === 'all' || pastActivitiesExpanded) return;
    const today = todayStr();
    const { start, end } = scheduleRange();
    const yearActs = activities.filter(activity => activity.startDate <= end && activity.endDate >= start);
    const pastMatches = yearActs
      .filter(activity => activityStatus(activity) === filter && activity.endDate < today)
      .sort((left, right) => left.endDate.localeCompare(right.endDate) || left.startDate.localeCompare(right.startDate));
    const latestPast = pastMatches.at(-1);
    if (!latestPast) return;
    pastActivitiesExpanded = true;
    const pageSize = gridViewMode !== 'timeline' ? activityPageCapacity() : Math.max(1, pastMatches.length);
    activityPageOffset = gridViewMode !== 'timeline'
      ? Math.floor((pastMatches.length - 1) / pageSize) * pageSize
      : 0;
    renderPage();
    setTimeout(() => jumpToActivity(latestPast.id), 120);
    return;
  }
  const match = String(cell.dataset.rowKey || '').match(/^act-(\d+)$/);
  if (!match) return;
  scrollToActivityCell(Number(match[1]), cell.dataset.date);
}

function downloadDataFile() {
  const payload = JSON.stringify(persistableSnapshotData(), null, 2);
  validatePlannerData(JSON.parse(payload));
  const blob = new Blob([payload], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const fileName = activeFileName || `team-manager-${todayStr()}.json`;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  activeFileName = fileName;
  return fileName;
}

function canUseFileSystemSave() {
  return typeof window.showSaveFilePicker === 'function';
}

function isDownloadFallbackResult(value) {
  return typeof value === 'string' && value.toLowerCase().includes('.json');
}

function openLocalBackupHandleDb() {
  if (!window.indexedDB) return Promise.resolve(null);
  return new Promise(resolve => {
    try {
      const request = window.indexedDB.open(LOCAL_BACKUP_HANDLE_DB, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(LOCAL_BACKUP_HANDLE_STORE)) db.createObjectStore(LOCAL_BACKUP_HANDLE_STORE);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch (err) {
      resolve(null);
    }
  });
}

async function storeLocalBackupHandle(handle) {
  localBackupFileHandle = handle || null;
  activeFileName = handle?.name || activeFileName;
  setRemoteUpdateSource(localBackupFileHandle ? 'file-handle' : 'none');
  const db = await openLocalBackupHandleDb();
  if (!db) return;
  try {
    await new Promise((resolve, reject) => {
      const tx = db.transaction(LOCAL_BACKUP_HANDLE_STORE, 'readwrite');
      tx.objectStore(LOCAL_BACKUP_HANDLE_STORE).put(handle || null, LOCAL_BACKUP_HANDLE_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error('Failed to store file handle'));
      tx.onabort = () => reject(tx.error || new Error('Failed to store file handle'));
    });
  } catch (err) {
    console.warn('Could not store local backup file handle:', err.message);
  } finally {
    db.close();
  }
}

async function storePlannerDirectoryHandle(handle) {
  localPlannerDirectoryHandle = handle || null;
  const db = await openLocalBackupHandleDb();
  if (!db) return;
  try {
    await new Promise((resolve, reject) => {
      const tx = db.transaction(LOCAL_BACKUP_HANDLE_STORE, 'readwrite');
      tx.objectStore(LOCAL_BACKUP_HANDLE_STORE).put(handle || null, LOCAL_PLANNER_DIRECTORY_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error('Failed to store planner directory handle'));
      tx.onabort = () => reject(tx.error || new Error('Failed to store planner directory handle'));
    });
  } catch (err) {
    console.warn('Could not store planner directory handle:', err.message);
  } finally {
    db.close();
  }
}

async function clearStoredPlannerDirectoryHandle() {
  localPlannerDirectoryHandle = null;
  const db = await openLocalBackupHandleDb();
  if (!db) return;
  try {
    await new Promise((resolve, reject) => {
      const tx = db.transaction(LOCAL_BACKUP_HANDLE_STORE, 'readwrite');
      tx.objectStore(LOCAL_BACKUP_HANDLE_STORE).delete(LOCAL_PLANNER_DIRECTORY_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error('Failed to clear planner directory handle'));
      tx.onabort = () => reject(tx.error || new Error('Failed to clear planner directory handle'));
    });
  } catch (err) {
    console.warn('Could not clear planner directory handle:', err.message);
  } finally {
    db.close();
  }
}

async function clearStoredLocalBackupHandle() {
  localBackupFileHandle = null;
  setRemoteUpdateSource('none');
  const db = await openLocalBackupHandleDb();
  if (!db) return;
  try {
    await new Promise((resolve, reject) => {
      const tx = db.transaction(LOCAL_BACKUP_HANDLE_STORE, 'readwrite');
      tx.objectStore(LOCAL_BACKUP_HANDLE_STORE).delete(LOCAL_BACKUP_HANDLE_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error('Failed to clear file handle'));
      tx.onabort = () => reject(tx.error || new Error('Failed to clear file handle'));
    });
  } catch (err) {
    console.warn('Could not clear local backup file handle:', err.message);
  } finally {
    db.close();
  }
}

async function loadStoredLocalBackupHandle() {
  if (localBackupFileHandle) return localBackupFileHandle;
  const db = await openLocalBackupHandleDb();
  if (!db) return null;
  try {
    const handle = await new Promise(resolve => {
      const tx = db.transaction(LOCAL_BACKUP_HANDLE_STORE, 'readonly');
      const req = tx.objectStore(LOCAL_BACKUP_HANDLE_STORE).get(LOCAL_BACKUP_HANDLE_KEY);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
    localBackupFileHandle = handle || null;
    return localBackupFileHandle;
  } finally {
    db.close();
  }
}

async function loadStoredPlannerDirectoryHandle() {
  if (localPlannerDirectoryHandle) return localPlannerDirectoryHandle;
  const db = await openLocalBackupHandleDb();
  if (!db) return null;
  try {
    const handle = await new Promise(resolve => {
      const tx = db.transaction(LOCAL_BACKUP_HANDLE_STORE, 'readonly');
      const req = tx.objectStore(LOCAL_BACKUP_HANDLE_STORE).get(LOCAL_PLANNER_DIRECTORY_KEY);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
    localPlannerDirectoryHandle = handle || null;
    return localPlannerDirectoryHandle;
  } finally {
    db.close();
  }
}

async function ensureLocalBackupPermission(handle) {
  if (!handle) return false;
  if (typeof handle.queryPermission !== 'function') return true;
  let permission = await handle.queryPermission({ mode: 'readwrite' });
  if (permission !== 'granted' && typeof handle.requestPermission === 'function') {
    permission = await handle.requestPermission({ mode: 'readwrite' });
  }
  return permission === 'granted';
}

async function capturePlannerDirectoryHandle(fileHandle) {
  if (!fileHandle || typeof window.showDirectoryPicker !== 'function') return null;
  const storedDirectoryHandle = await loadStoredPlannerDirectoryHandle();
  if (storedDirectoryHandle && typeof storedDirectoryHandle.resolve === 'function') {
    try {
      const relativePath = await storedDirectoryHandle.resolve(fileHandle);
      if (Array.isArray(relativePath) && relativePath.length === 1) return storedDirectoryHandle;
    } catch (err) {
      console.warn('Stored planner directory handle no longer matches the selected file:', err?.message || err);
    }
  }
  try {
    const directoryHandle = await window.showDirectoryPicker({ id: 'team-manager-json-directory', mode: 'readwrite', startIn: fileHandle });
    if (typeof directoryHandle?.resolve === 'function') {
      const relativePath = await directoryHandle.resolve(fileHandle);
      if (!Array.isArray(relativePath) || relativePath.length !== 1) return null;
    }
    await storePlannerDirectoryHandle(directoryHandle);
    return directoryHandle;
  } catch (err) {
    if (err?.name !== 'AbortError') console.warn('Could not capture planner directory for backups:', err?.message || err);
    return null;
  }
}

function showToast(message, duration = 5000, action = null) {
  let el = document.getElementById('app-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'app-toast';
    el.setAttribute('role', 'status');
    document.body.appendChild(el);
  }
  el.innerHTML = '';
  const text = document.createElement('span');
  text.className = 'toast-message';
  text.textContent = message;
  el.appendChild(text);
  if (action && action.label && typeof action.onClick === 'function') {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'toast-action';
    button.textContent = action.label;
    button.onclick = () => {
      el.classList.remove('show');
      el.classList.remove('interactive');
      Promise.resolve(action.onClick()).catch(err => console.warn('Toast action failed:', err?.message || err));
    };
    el.appendChild(button);
    el.classList.add('interactive');
  } else {
    el.classList.remove('interactive');
  }
  el.classList.add('show');
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => {
    el.classList.remove('show');
    el.classList.remove('interactive');
  }, duration);
}

function canPersistDefaultJsonFile() {
  return typeof window.showOpenFilePicker === 'function' && !!window.indexedDB;
}

function setRemoteUpdateSource(source) {
  remoteUpdateSource = source || 'none';
  if (remoteUpdateSource === 'none') stopRemoteUpdatePolling();
  else startRemoteUpdatePolling();
  if (remoteUpdateSource === 'none') setSyncStatusState('out-of-sync');
  else if (syncStatusState !== 'syncing') setSyncStatusState('updated');
  updateDefaultJsonStatus();
  updateSyncButton();
}

function updateDefaultJsonStatus() {
  const el = document.getElementById('default-json-status');
  if (!el) return;
  if (remoteUpdateSource === 'file-handle' && localBackupFileHandle?.name) {
    el.textContent = `Current data file: ${localBackupFileHandle.name}. External-change checks stay on for this file.`;
    return;
  }
  if (portableDefaultLoadIssue) {
    el.textContent = `${portableDefaultLoadIssue} Choose your data file to continue.`;
    return;
  }
  el.textContent = remoteUpdateSource === 'none'
    ? 'No active data file selected.'
    : 'Data file selected. External changes will sync in this session.';
}

function startRemoteUpdatePolling() {
  stopRemoteUpdatePolling();
  remoteUpdatePollTimer = setInterval(() => { checkForRemoteFileUpdate().catch(() => {}); }, AUTO_SYNC_INTERVAL_MS);
}
function stopRemoteUpdatePolling() {
  if (remoteUpdatePollTimer) clearInterval(remoteUpdatePollTimer);
  remoteUpdatePollTimer = null;
}
function applyRemotePlannerData(parsedDiskData) {
  pendingRemoteRefreshData = null;
  pendingRemoteRefreshSavedAt = null;
  loadFromData(parsedDiskData);
  applyTheme();
  applyAppName();
  renderPage();
  updateSbStatus();
}
// Detects a colleague's save while this tab is open; auto-syncs when enabled, keeps persistent out-of-sync status when disabled
async function checkForRemoteFileUpdate(options = {}) {
  const forced = options.force === true;
  if (remoteUpdateSource === 'none' || remoteUpdateCheckInFlight) return false;
  if (!forced && document.hidden) return false;
  if (!forced && document.querySelector('.modal-bg.open')) return false;
  remoteUpdateCheckInFlight = true;
  setSyncStatusState('syncing');
  updateSyncButton();
  try {
    let parsedDiskData = null;
    if (remoteUpdateSource === 'file-handle') {
      if (!localBackupFileHandle) {
        setSyncStatusState('out-of-sync');
        return false;
      }
      if (typeof localBackupFileHandle.queryPermission === 'function') {
        const permission = await localBackupFileHandle.queryPermission({ mode: 'read' });
        if (permission !== 'granted') {
          setSyncStatusState('out-of-sync');
          return false;
        }
      }
      const diskFile = await localBackupFileHandle.getFile();
      const diskText = await diskFile.text();
      if (!diskText || !diskText.trim()) {
        setSyncStatusState('out-of-sync');
        return false;
      }
      parsedDiskData = JSON.parse(diskText);
    } else if (remoteUpdateSource === 'portable-default') {
      parsedDiskData = await fetchPortableDefaultPlannerData();
    } else if (remoteUpdateSource === 'hosted') {
      const response = await fetch('/api/planner', { cache: 'no-store' });
      if (!response.ok) throw new Error(`Hosted planner check failed (${response.status}).`);
      const result = await response.json();
      if (Number(result.revision) <= hostedRevision) {
        setSyncStatusState('updated');
        return false;
      }
      hostedRevision = Number(result.revision) || hostedRevision;
      parsedDiskData = result.document;
    } else {
      return false;
    }
    if (remoteUpdateSource !== 'hosted' && (!parsedDiskData.savedAt || !lastSyncTime || !(parsedDiskData.savedAt > lastSyncTime))) {
      setSyncStatusState('updated');
      return false;
    }
    validatePlannerData(parsedDiskData);
    if (!forced && pendingRemoteRefreshSavedAt && pendingRemoteRefreshSavedAt === parsedDiskData.savedAt) {
      setSyncStatusState(appSettings.autoSyncEnabled === false ? 'out-of-sync' : 'updated');
      return false;
    }
    if (!hasUnsavedChanges) {
      if (appSettings.autoSyncEnabled === false && !forced) {
        pendingRemoteRefreshData = parsedDiskData;
        pendingRemoteRefreshSavedAt = parsedDiskData.savedAt;
        setSyncStatusState('out-of-sync');
        showToast('Colleague changes detected in the JSON file.', 12000, {
          label: 'Apply',
          onClick: refreshPendingRemoteData
        });
        return false;
      }
      applyRemotePlannerData(parsedDiskData);
      setSyncStatusState('updated');
      const notificationUserIds = hostedUser?.preferences?.colleagueChangeUserIds || [];
      const actorNotificationEnabled = hostedMode && hostedUser?.preferences?.colleagueChangeNotificationsEnabled === true && (!notificationUserIds.length || notificationUserIds.includes(parsedDiskData.lastChangedByUserId));
      if (actorNotificationEnabled) {
        showToast('Colleague changes detected and loaded.', 8000, { label: 'Dismiss', onClick: () => {} });
      }
      return true;
    }
    if (appSettings.autoSyncEnabled === false && !forced) {
      pendingRemoteRefreshData = parsedDiskData;
      pendingRemoteRefreshSavedAt = parsedDiskData.savedAt;
      setSyncStatusState('out-of-sync');
      return false;
    }
    pendingRemoteRefreshData = null;
    pendingRemoteRefreshSavedAt = null;
    const diskEntriesMap = isObjectMap(parsedDiskData.entriesMap);
    const diskOvertimeMap = isObjectMap(parsedDiskData.overtimeMap);
    const diskActivityShiftsMap = isObjectMap(parsedDiskData.activityShiftsMap);
    let diskShiftRotationMap = isObjectMap(parsedDiskData.shiftRotationMap);
    const mergedEntriesMap = { ...diskEntriesMap, ...isObjectMap(entriesMap) };
    const mergedOvertimeMap = { ...diskOvertimeMap, ...isObjectMap(overtimeMap) };
    const mergedActivityShiftsMap = { ...diskActivityShiftsMap, ...isObjectMap(activityShiftsMap) };
    for (const key of Object.keys(mergedEntriesMap)) if (mergedEntriesMap[key] === null) delete mergedEntriesMap[key];
    for (const key of Object.keys(mergedOvertimeMap)) if (mergedOvertimeMap[key] === null) delete mergedOvertimeMap[key];
    for (const key of Object.keys(mergedActivityShiftsMap)) if (mergedActivityShiftsMap[key] === null) delete mergedActivityShiftsMap[key];

    const allocateId = makeIdAllocator(employees, parsedDiskData.employees, activities, parsedDiskData.activities);
    const employeeMerge = mergeEntityArray(baseSnapshot?.employees, employees, parsedDiskData.employees, 'id', allocateId);
    const activityMerge = mergeEntityArray(baseSnapshot?.activities, activities, parsedDiskData.activities, 'id', allocateId);
    diskShiftRotationMap = remapLeadingRelationIds(diskShiftRotationMap, employeeMerge.theirsIdRemap);
    const mergedShiftRotationMap = { ...diskShiftRotationMap, ...isObjectMap(shiftRotationMap) };

    const before = stableJson({ entriesMap: isObjectMap(entriesMap), overtimeMap: isObjectMap(overtimeMap), activityShiftsMap: isObjectMap(activityShiftsMap), shiftRotationMap: isObjectMap(shiftRotationMap), employees, activities });
    const after = stableJson({ entriesMap: mergedEntriesMap, overtimeMap: mergedOvertimeMap, activityShiftsMap: mergedActivityShiftsMap, shiftRotationMap: mergedShiftRotationMap, employees: employeeMerge.merged, activities: activityMerge.merged });
    if (before === after) {
      lastSyncTime = parsedDiskData.savedAt;
      setSyncStatusState('updated');
      return false;
    }

    entriesMap = mergedEntriesMap;
    overtimeMap = mergedOvertimeMap;
    activityShiftsMap = mergedActivityShiftsMap;
    shiftRotationMap = mergedShiftRotationMap;
    employees = employeeMerge.merged.sort((a, b) => a.name.localeCompare(b.name));
    activities = activityMerge.merged.sort((a, b) => a.startDate.localeCompare(b.startDate));
    nextEmpId = Math.max(nextEmpId, ...employees.map(e => e.id || 0)) + 1;
    nextActId = Math.max(nextActId, ...activities.map(a => a.id || 0)) + 1;
    lastSyncTime = parsedDiskData.savedAt;
    baseSnapshot = { employees: JSON.parse(JSON.stringify(employees)), activities: JSON.parse(JSON.stringify(activities)) };
    renderPage();
    const conflicts = [...employeeMerge.conflicts, ...activityMerge.conflicts];
    const conflictNote = conflicts.length ? ` ${conflicts.length} record(s) had conflicting edits — yours were kept.` : '';
    showToast(`Colleague updates were merged into your unsaved work.${conflictNote} Save when ready.`, 8000);
    setSyncStatusState('updated');
    return true;
  } catch (err) {
    setSyncStatusState('out-of-sync');
    if (!['NotFoundError', 'AbortError'].includes(err?.name)) {
      console.warn('Remote update check failed:', err?.message);
      showToast('Sync failed. The data file may be out of sync.', 7000);
    }
    return false;
  } finally {
    remoteUpdateCheckInFlight = false;
    updateSyncButton();
  }
}
document.addEventListener('visibilitychange', () => { if (!document.hidden) checkForRemoteFileUpdate(); });

function refreshPendingRemoteData() {
  if (!pendingRemoteRefreshData) return;
  applyRemotePlannerData(pendingRemoteRefreshData);
  setSyncStatusState('updated');
  showToast('Updated to the latest JSON file changes.');
}

async function syncNow() {
  if (startupFileSelectionRequired) return;
  await checkForRemoteFileUpdate({ force: true });
}

async function requestLocalBackupHandle() {
  const pickerOptions = {
    id: 'team-manager-json-file',
    suggestedName: activeFileName || `team-manager-${todayStr()}.json`,
    types: [{
      description: 'JSON backup',
      accept: { 'application/json': ['.json'] },
    }],
  };
  const handle = await window.showSaveFilePicker(pickerOptions);
  await storeLocalBackupHandle(handle);
  return handle;
}

function openJsonFilePicker() {
  return window.showOpenFilePicker({
    id: 'team-manager-json-file',
    multiple: false,
    mode: 'readwrite',
    types: [{ description: 'Team Manager JSON', accept: { 'application/json': ['.json'] } }],
  });
}

function openJsonFileInput(options = {}) {
  const input = document.getElementById('import-json-file');
  if (!input) {
    alert('Could not open a JSON file chooser in this browser.');
    return false;
  }
  input.dataset.requiredOpen = options.required ? 'true' : 'false';
  input.click();
  return false;
}

async function importDataWithPicker(options = {}) {
  let handles;
  try {
    handles = await openJsonFilePicker();
  } catch (err) {
    if (err?.name === 'AbortError') return false;
    const firstFallback = !preferBrowserJsonFileInput;
    preferBrowserJsonFileInput = true;
    console.error('Native JSON picker failed:', err);
    if (firstFallback) showToast('Could not open the native JSON picker. Using the browser file chooser instead.', 7000);
    return openJsonFileInput(options);
  }
  const handle = Array.isArray(handles) ? handles[0] : null;
  if (!handle) return false;
  preferBrowserJsonFileInput = false;
  try {
    const file = await handle.getFile();
    await loadDataFile(file, handle);
    if (options.required && startupFileSelectionRequired) completeStartupFileSelection();
    document.querySelectorAll('.modal-bg.open').forEach(modal => closeModal(modal.id));
    if (!options.required) showToast(`Opened JSON: ${handle.name}.`, 5000);
    return true;
  } catch (err) {
    if (err?.name === 'AbortError') return false;
    preferBrowserJsonFileInput = true;
    showToast('That file handle is no longer available. Choose the JSON file again.', 7000);
    return openJsonFileInput(options);
  }
}

function isObjectMap(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}
function withoutNullMap(value) {
  return Object.fromEntries(Object.entries(isObjectMap(value)).filter(([, entry]) => entry !== null));
}

function stableJson(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`;
}

function entityMapById(list, idKey) {
  const map = {};
  for (const item of list || []) map[item[idKey]] = item;
  return map;
}
function makeIdAllocator(...lists) {
  let max = 0;
  for (const list of lists) for (const item of list || []) if (Number.isFinite(item?.id) && item.id > max) max = item.id;
  return () => ++max;
}
// 3-way merge (base = last synced, mine = in-memory, theirs = on disk) so unrelated concurrent edits/deletes/adds all survive
function mergeEntityArray(base, mine, theirs, idKey, allocateId) {
  const baseById = entityMapById(base, idKey), mineById = entityMapById(mine, idKey), theirsById = entityMapById(theirs, idKey);
  const ids = [...new Set([...Object.keys(mineById), ...Object.keys(theirsById)])];
  const merged = [];
  const conflicts = [];
  const theirsIdRemap = {};
  for (const id of ids) {
    const b = baseById[id], m = mineById[id], t = theirsById[id];
    const label = (m || t)?.name || (m || t)?.label || String(id);
    if (!b) {
      if (m && t && stableJson(m) !== stableJson(t)) {
        const newId = allocateId();
        merged.push(m, { ...t, [idKey]: newId });
        theirsIdRemap[id] = newId;
        conflicts.push({ label, type: 'duplicate-id', detail: `A colleague also added a new record with the same id; it was kept and reassigned id ${newId}.` });
      } else {
        merged.push(m || t);
      }
      continue;
    }
    const bJson = stableJson(b);
    const mChanged = m ? stableJson(m) !== bJson : null;
    const tChanged = t ? stableJson(t) !== bJson : null;
    if (m && t) {
      if (stableJson(m) === stableJson(t)) { merged.push(m); continue; }
      if (!mChanged) { merged.push(t); continue; }
      if (!tChanged) { merged.push(m); continue; }
      merged.push(m);
      conflicts.push({ label, type: 'edit-conflict', detail: 'Both you and a colleague edited this; your version was kept.' });
      continue;
    }
    if (!m) { if (tChanged) { merged.push(t); conflicts.push({ label, type: 'delete-edit', detail: 'You deleted this, but a colleague edited it; their edit was kept.' }); } continue; }
    if (!t) { if (mChanged) { merged.push(m); conflicts.push({ label, type: 'edit-delete', detail: 'A colleague deleted this, but you edited it; your edit was kept.' }); } continue; }
  }
  return { merged, conflicts, theirsIdRemap };
}
function remapLeadingRelationIds(map, idRemap) {
  if (!idRemap || !Object.keys(idRemap).length) return map;
  return Object.fromEntries(Object.entries(map).map(([key, value]) => {
    const separator = key.indexOf('_');
    if (separator < 1) return [key, value];
    const oldId = key.slice(0, separator);
    return [`${idRemap[oldId] || oldId}${key.slice(separator)}`, value];
  }));
}

function validatedPlannerPayload(payloadData) {
  validatePlannerData(payloadData);
  const payload = JSON.stringify(payloadData, null, 2);
  if (!payload.trim()) throw new Error('Refusing to save an empty planner file.');
  const parsed = JSON.parse(payload);
  validatePlannerData(parsed);
  return payload;
}
async function replacePlannerFileContents(handle, payload) {
  const blob = new Blob([payload], { type: 'application/json' });
  const writable = await handle.createWritable({ keepExistingData: true });
  try {
    await writable.write({ type: 'write', position: 0, data: blob });
    await writable.write({ type: 'truncate', size: blob.size });
    await writable.close();
  } catch (err) {
    try { await writable.abort(); } catch (abortErr) { }
    throw err;
  }
}
async function verifyPlannerFileContents(handle, expectedPayload) {
  const savedFile = await handle.getFile();
  const savedText = await savedFile.text();
  if (!savedText.trim()) throw new Error('Save verification failed: the planner file is empty.');
  const parsed = JSON.parse(savedText);
  validatePlannerData(parsed);
  if (savedText !== expectedPayload) throw new Error('Save verification failed: the planner file does not match the data written.');
}
async function preserveLastKnownGoodPlanner(handle, originalText) {
  if (!originalText?.trim()) return false;
  const originalData = JSON.parse(originalText);
  validatePlannerData(originalData);
  const directoryHandle = await loadStoredPlannerDirectoryHandle();
  if (!directoryHandle || typeof directoryHandle.getDirectoryHandle !== 'function') return false;
  if (typeof directoryHandle.queryPermission === 'function') {
    const permission = await directoryHandle.queryPermission({ mode: 'readwrite' });
    if (permission !== 'granted') return false;
  }
  if (typeof directoryHandle.resolve === 'function') {
    const relativePath = await directoryHandle.resolve(handle);
    if (!Array.isArray(relativePath) || relativePath.length !== 1) return false;
  }
  const backupsDirectory = await directoryHandle.getDirectoryHandle('backups', { create: true });
  const safeName = String(handle.name || 'planner.json').replace(/[^A-Za-z0-9._-]/g, '_');
  const backupHandle = await backupsDirectory.getFileHandle(`last-known-good-${safeName}`, { create: true });
  await replacePlannerFileContents(backupHandle, originalText);
  await verifyPlannerFileContents(backupHandle, originalText);
  return true;
}

async function writeLocalBackupFile(handle) {
  const localSnapshot = snapshotData();
  let mergedWithDisk = false;
  let entityConflicts = [];
  let originalText = '';
  try {
    const diskFile = await handle.getFile();
    const diskText = await diskFile.text();
    originalText = diskText;
    if (diskText && diskText.trim()) {
      const parsedDiskData = JSON.parse(diskText);
      validatePlannerData(parsedDiskData);
      if (parsedDiskData.savedAt && lastSyncTime && parsedDiskData.savedAt > lastSyncTime) {
        const diskEntriesMap = isObjectMap(parsedDiskData.entriesMap);
        const diskOvertimeMap = isObjectMap(parsedDiskData.overtimeMap);
        const diskActivityShiftsMap = isObjectMap(parsedDiskData.activityShiftsMap);
        let diskShiftRotationMap = isObjectMap(parsedDiskData.shiftRotationMap);

        const mergedEntriesMap = { ...diskEntriesMap, ...isObjectMap(entriesMap) };
        const mergedOvertimeMap = { ...diskOvertimeMap, ...isObjectMap(overtimeMap) };
        const mergedActivityShiftsMap = { ...diskActivityShiftsMap, ...isObjectMap(activityShiftsMap) };
        for (const key of Object.keys(mergedEntriesMap)) if (mergedEntriesMap[key] === null) delete mergedEntriesMap[key];
        for (const key of Object.keys(mergedOvertimeMap)) if (mergedOvertimeMap[key] === null) delete mergedOvertimeMap[key];
        for (const key of Object.keys(mergedActivityShiftsMap)) if (mergedActivityShiftsMap[key] === null) delete mergedActivityShiftsMap[key];

        const allocateId = makeIdAllocator(employees, parsedDiskData.employees, activities, parsedDiskData.activities);
        const employeeMerge = mergeEntityArray(baseSnapshot?.employees, employees, parsedDiskData.employees, 'id', allocateId);
        const activityMerge = mergeEntityArray(baseSnapshot?.activities, activities, parsedDiskData.activities, 'id', allocateId);
        diskShiftRotationMap = remapLeadingRelationIds(diskShiftRotationMap, employeeMerge.theirsIdRemap);
        const mergedShiftRotationMap = { ...diskShiftRotationMap, ...isObjectMap(shiftRotationMap) };
        entityConflicts = [...employeeMerge.conflicts, ...activityMerge.conflicts];

        const localBeforeMerge = {
          entriesMap: isObjectMap(entriesMap),
          overtimeMap: isObjectMap(overtimeMap),
          activityShiftsMap: isObjectMap(activityShiftsMap),
          shiftRotationMap: isObjectMap(shiftRotationMap),
          employees, activities,
        };
        const localAfterMerge = {
          entriesMap: mergedEntriesMap,
          overtimeMap: mergedOvertimeMap,
          activityShiftsMap: mergedActivityShiftsMap,
          shiftRotationMap: mergedShiftRotationMap,
          employees: employeeMerge.merged, activities: activityMerge.merged,
        };
        mergedWithDisk = stableJson(localBeforeMerge) !== stableJson(localAfterMerge);
        if (mergedWithDisk) {
          entriesMap = mergedEntriesMap;
          overtimeMap = mergedOvertimeMap;
          activityShiftsMap = mergedActivityShiftsMap;
          shiftRotationMap = mergedShiftRotationMap;
          employees = employeeMerge.merged.sort((a, b) => a.name.localeCompare(b.name));
          activities = activityMerge.merged.sort((a, b) => a.startDate.localeCompare(b.startDate));
          nextEmpId = Math.max(nextEmpId, ...employees.map(e => e.id || 0)) + 1;
          nextActId = Math.max(nextActId, ...activities.map(a => a.id || 0)) + 1;
        }
      }
    }
  } catch (readError) {
    if (!['NotFoundError', 'AbortError'].includes(readError?.name)) throw readError;
  }
  for (const key of Object.keys(entriesMap)) if (entriesMap[key] === null) delete entriesMap[key];
  for (const key of Object.keys(overtimeMap)) if (overtimeMap[key] === null) delete overtimeMap[key];
  for (const key of Object.keys(activityShiftsMap)) if (activityShiftsMap[key] === null) delete activityShiftsMap[key];
  const persistedShiftRotationMap = withoutNullMap(shiftRotationMap);

  const saveTimestamp = new Date().toISOString();
  localSnapshot.savedAt = saveTimestamp;
  const payloadData = {
    ...localSnapshot,
    employees, activities,
    entriesMap: isObjectMap(entriesMap),
    overtimeMap: isObjectMap(overtimeMap),
    activityShiftsMap: isObjectMap(activityShiftsMap),
    shiftRotationMap: persistedShiftRotationMap,
  };
  const payload = validatedPlannerPayload(payloadData);
  try {
    await preserveLastKnownGoodPlanner(handle, originalText);
  } catch (backupError) {
    console.warn('Could not create the last-known-good backup before saving:', backupError?.message || backupError);
  }
  try {
    await replacePlannerFileContents(handle, payload);
    await verifyPlannerFileContents(handle, payload);
    lastSyncTime = saveTimestamp;
    for (const key of Object.keys(shiftRotationMap)) if (shiftRotationMap[key] === null) delete shiftRotationMap[key];
    baseSnapshot = { employees: JSON.parse(JSON.stringify(employees)), activities: JSON.parse(JSON.stringify(activities)) };
    if (mergedWithDisk) {
      renderPage();
      const conflictNote = entityConflicts.length
        ? `\n\n${entityConflicts.length} record(s) had conflicting changes and were kept as follows:\n${entityConflicts.map(c => `- ${c.label}: ${c.detail}`).join('\n')}`
        : '';
      setTimeout(() => alert(`Your changes were saved along with new updates from your colleagues.${conflictNote}`), 0);
    }
  } catch (err) {
    if (originalText?.trim()) {
      try {
        await replacePlannerFileContents(handle, originalText);
        await verifyPlannerFileContents(handle, originalText);
      } catch (restoreError) {
        console.error('Could not restore the previous planner file after a failed save:', restoreError);
      }
    }
    throw err;
  }
}

async function saveLocalBackupFile(forcePrompt = false) {
  if (!canUseFileSystemSave()) {
    return downloadDataFile();
  }
  let handle = null;
  if (!forcePrompt) {
    handle = localBackupFileHandle;
    if (handle) {
      try {
        const hasPermission = await ensureLocalBackupPermission(handle);
        if (!hasPermission) handle = null;
      } catch (err) {
        console.warn('Permission check failed for existing handle:', err);
        handle = null;
      }
    }
  }
  if (!handle) {
    try {
      handle = await requestLocalBackupHandle();
    } catch (err) {
      if (err?.name === 'AbortError') throw err;
      throw new Error('No JSON file selected. Please select a JSON file to save your data.');
    }
    if (!handle) {
      throw new Error('No JSON file selected. Please select a JSON file to save your data.');
    }
    try {
      const hasPermission = await ensureLocalBackupPermission(handle);
      if (!hasPermission) {
        localBackupFileHandle = null;
        if (remoteUpdateSource === 'file-handle') setRemoteUpdateSource('none');
        const downloadedFileName = downloadDataFile();
        showToast(`Saved a downloaded copy as ${downloadedFileName}. The selected file could not be updated directly.`, 7000);
        return downloadedFileName;
      }
    } catch (err) {
      localBackupFileHandle = null;
      if (remoteUpdateSource === 'file-handle') setRemoteUpdateSource('none');
      if (['NotAllowedError', 'NoModificationAllowedError', 'SecurityError'].includes(err?.name)) {
        const downloadedFileName = downloadDataFile();
        showToast(`Saved a downloaded copy as ${downloadedFileName}. The selected file could not be updated directly.`, 7000);
        return downloadedFileName;
      }
      throw err;
    }
  }
  try {
    await writeLocalBackupFile(handle);
    activeFileName = handle.name || activeFileName;
    return activeFileName;
  } catch (err) {
    const shouldRePrompt = !forcePrompt && (err?.name === 'NotAllowedError' || err?.name === 'NotFoundError' || err?.name === 'SecurityError');
    if (shouldRePrompt) {
      localBackupFileHandle = null;
      if (remoteUpdateSource === 'file-handle') setRemoteUpdateSource('none');
      await saveLocalBackupFile(true);
      return;
    }
    if (['NotAllowedError', 'NoModificationAllowedError', 'SecurityError'].includes(err?.name)) {
      localBackupFileHandle = null;
      if (remoteUpdateSource === 'file-handle') setRemoteUpdateSource('none');
      const downloadedFileName = downloadDataFile();
      showToast(`Saved a downloaded copy as ${downloadedFileName}. The selected file could not be updated directly.`, 7000);
      return downloadedFileName;
    }
    throw err;
  }
}

async function saveDataAs() {
  const btn = document.getElementById('save-btn');
  const originalText = btn ? btn.innerHTML : '';
  try {
    if (btn) btn.innerHTML = 'Saving...';
    if (autoSaveTimer) { clearTimeout(autoSaveTimer); autoSaveTimer = null; }
    try {
      await saveState(true);
    } catch (recoveryError) {
      console.warn('Browser recovery error:', recoveryError);
      alert('Browser recovery is unavailable. The JSON file will still be saved.');
    }
    await saveLocalBackupFile(true);
    markFileSaved();
    if (localBackupFileHandle?.name) showToast(`Using JSON file: ${localBackupFileHandle.name}.`, 5000);
    updateSaveButton();
    updateSbStatus();
  } catch (err) {
    if (err && err.name === 'AbortError') return;
    alert(`Could not save JSON file: ${err?.message || 'Unknown error occurred.'}`);
    updateSaveButton();
  } finally {
    if (btn) btn.innerHTML = originalText;
  }
}

function importData(options = {}) {
  document.querySelectorAll('.modal-bg.open').forEach(modal => closeModal(modal.id));
  if (!preferBrowserJsonFileInput && typeof window.showOpenFilePicker === 'function') {
    void importDataWithPicker(options);
    return false;
  }
  if (!preferBrowserJsonFileInput) showToast('Native file access is unavailable here. Using the browser file chooser instead.', 7000);
  return openJsonFileInput(options);
}

async function handleImportDataFile(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  const requiredOpen = event.target.dataset.requiredOpen === 'true';
  try {
    await loadDataFile(file, null);
    if (!requiredOpen) showToast(`Opened JSON: ${file.name}.`, 5000);
    if (startupFileSelectionRequired) completeStartupFileSelection();
    document.querySelectorAll('.modal-bg.open').forEach(modal => closeModal(modal.id));
  } catch (err) {
    alert(`Could not open JSON planner: ${err?.message || 'Verify the file format and try again.'}`);
  } finally {
    delete event.target.dataset.requiredOpen;
    event.target.value = '';
  }
}

async function applyLoadedPlannerData(parsed, options = {}) {
  const handle = options.handle || null;
  const fileName = options.fileName || '';
  const source = options.remoteUpdateSource || 'none';
  const shouldCloseSettings = options.closeSettings !== false;
  loadFromData(parsed);
  portableDefaultLoadIssue = '';
  if (handle) {
    await storeLocalBackupHandle(handle);
  } else {
    localBackupFileHandle = null;
    activeFileName = fileName || activeFileName;
    setRemoteUpdateSource(source);
  }
  hiddenEmployees = new Set([...hiddenEmployees].filter(id => employees.some(emp => emp.id === id)));
  saveGridPreferences();
  persistSettings();
  markFileSaved();
  applyTheme();
  applyAppName();
  try {
    await saveState(true);
  } catch (recoveryError) {
    alert('The planner is open, but browser recovery could not be updated. Save the JSON file after changes.');
  }
  if (shouldCloseSettings) closeModal('settings-modal');
  renderPage();
}

async function loadDataFile(file, handle, options = {}) {
  const text = await file.text();
  if (!text.trim()) {
    throw new Error('The selected JSON file is empty. Choose a valid planner backup instead of opening it as a blank planner.');
  }
  const parsed = JSON.parse(text);
  validatePlannerData(parsed);
  await applyLoadedPlannerData(parsed, {
    handle,
    fileName: file.name || '',
    remoteUpdateSource: handle ? 'file-handle' : 'none',
  });
  if (handle) {
    await createBackupIfNeeded({ notifyOnly: true });
  }
}

function validatePlannerData(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Invalid JSON payload');
  const employeeList = data.employees;
  const activityList = data.activities || data.projects;
  const statusList = data.statuses || data.statusTypes;
  if (!Array.isArray(employeeList) || !Array.isArray(activityList) || !Array.isArray(statusList)) {
    throw new Error('Planner JSON is missing employees, activities, or statuses');
  }
  statusList.forEach(status => {
    if (!status || typeof status !== 'object' || Array.isArray(status)) throw new Error('Invalid daily status definition');
    if (typeof status.key !== 'string' || !status.key.trim()) throw new Error('Daily status is missing key');
    if (status.isAbsence != null && typeof status.isAbsence !== 'boolean') throw new Error('Daily status absence flag is invalid');
    if (status.isOutOfOffice != null && typeof status.isOutOfOffice !== 'boolean') throw new Error('Daily status out-of-office flag is invalid');
  });
  const uniqueIds = (items, label) => {
    const ids = items.map(item => Number(item?.id));
    if (ids.some(id => !Number.isFinite(id)) || new Set(ids).size !== ids.length) throw new Error(`Invalid or duplicate ${label} IDs`);
    return new Set(ids);
  };
  const employeeIds = uniqueIds(employeeList, 'employee');
  const activityIds = uniqueIds(activityList, 'activity');
  const statusKeys = new Set();
  statusList.forEach(status => {
    if (!status || typeof status !== 'object' || Array.isArray(status)) throw new Error('Daily status contains invalid data');
    const statusKey = String(status.key || '').trim();
    const statusLabel = String(status.label || status.name || '').trim();
    const statusAbbr = String(status.abbr || status.initial || '').trim();
    const statusColor = String(status.color || '').trim();
    if (!Number.isFinite(Number(status.id)) || !statusKey || !statusLabel || !statusAbbr) {
      throw new Error('Daily status is missing required fields');
    }
    if (statusKeys.has(statusKey)) throw new Error('Daily status keys must be unique');
    statusKeys.add(statusKey);
    if (!/^#[0-9a-fA-F]{3,8}$/.test(statusColor)) throw new Error('Daily status has an invalid color');
    if (status.isAbsence != null && typeof status.isAbsence !== 'boolean') throw new Error('Daily status has an invalid absence flag');
    if (status.isOutOfOffice != null && typeof status.isOutOfOffice !== 'boolean') throw new Error('Daily status has an invalid out-of-office flag');
  });
  const validEntryStatuses = new Set(['at_work', ...statusKeys]);
  activityList.forEach(activity => {
    const participants = Array.isArray(activity.participants) ? activity.participants : (activity.employeeIds || []).map(id => ({ id }));
    if (!Array.isArray(participants) || participants.some(participant => !employeeIds.has(Number(participant?.id)))) {
      throw new Error('Activity contains an unknown employee');
    }
  });
  if (data.entriesMap != null && (typeof data.entriesMap !== 'object' || Array.isArray(data.entriesMap))) throw new Error('Invalid daily entries');
  // Auto-clean orphaned daily entries (employee no longer exists)
  if (data.entriesMap) {
    Object.entries(data.entriesMap).forEach(([key, value]) => {
      const separator = key.indexOf('_');
      if (separator < 1 || !employeeIds.has(Number(key.slice(0, separator)))) {
        data.entriesMap[key] = null;
        return;
      }
      if (value === null) return;
      if (typeof value === 'string') {
        if (!validEntryStatuses.has(value)) data.entriesMap[key] = null;
        return;
      }
      if (!value || typeof value !== 'object' || Array.isArray(value)) { data.entriesMap[key] = null; return; }
      const statusKey = String(value.status || 'at_work').trim() || 'at_work';
      if (!validEntryStatuses.has(statusKey)) data.entriesMap[key] = null;
      else if (value.durationType != null && !['fullday', '24hours', 'time'].includes(value.durationType)) data.entriesMap[key] = null;
      else if (value.durationType === 'time' && (typeof value.time !== 'string' || !timeRangeHours(value.time))) data.entriesMap[key] = null;
    });
  }
  if (data.overtimeMap != null && (typeof data.overtimeMap !== 'object' || Array.isArray(data.overtimeMap))) throw new Error('Invalid overtime entries');
  // Auto-clean orphaned overtime entries (employee no longer exists)
  if (data.overtimeMap) {
    Object.entries(data.overtimeMap).forEach(([key, value]) => {
      if (value === null) return;
      const separator = key.indexOf('_');
      const date = key.slice(separator + 1);
      const hours = Number(value?.hours);
      if (separator < 1 || !employeeIds.has(Number(key.slice(0, separator))) || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(hours) || hours < 0 || hours > 24) {
        data.overtimeMap[key] = null;
      }
    });
  }
  if (data.activityShiftsMap != null && (typeof data.activityShiftsMap !== 'object' || Array.isArray(data.activityShiftsMap))) throw new Error('Invalid activity assignments');
  // Auto-clean orphaned activity assignments (employee or activity no longer exists)
  if (data.activityShiftsMap) {
    Object.keys(data.activityShiftsMap).forEach(key => {
      const parts = key.split('_');
      if (parts.length !== 3 || !employeeIds.has(Number(parts[0])) || !activityIds.has(Number(parts[2])) || !/^\d{4}-\d{2}-\d{2}$/.test(parts[1])) {
        delete data.activityShiftsMap[key];
      }
    });
  }
  if (data.shiftRotationMap != null && (typeof data.shiftRotationMap !== 'object' || Array.isArray(data.shiftRotationMap))) throw new Error('Invalid shift rotation assignments');
  // Auto-clean orphaned shift rotation assignments (employee no longer exists)
  if (data.shiftRotationMap) {
    Object.entries(data.shiftRotationMap).forEach(([key, value]) => {
      const parts = key.split('_');
      if (parts.length !== 2 || !employeeIds.has(Number(parts[0])) || !isValidIsoDate(parts[1])) {
        data.shiftRotationMap[key] = null;
      } else if (value !== null && !['normal', 'day', 'evening', 'night', 'turn', 'leave', 'overtime'].includes(typeof value === 'string' ? value : value?.shift)) {
        data.shiftRotationMap[key] = null;
      } else if (value?.shift === 'overtime' && !timeRangeHours(value.time)) {
        data.shiftRotationMap[key] = null;
      }
    });
  }
}

// ═══ DATA STATE ══════════════════════════════════════════════════════════════
let currentPage = 'grid';
let gridYear = new Date().getFullYear();
let summaryYear = new Date().getFullYear();
let summaryPeriod = 'year';
let summaryMonthValue = `${summaryYear}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
let summaryWeekValue = isoWeekStringFromDate(new Date());
let workloadPeriod = 'year';
let workloadAnchorDate = fmt(new Date());
let boardYear = new Date().getFullYear();
let boardFilters = { dept: '', status: 'all', search: '' };
let summarySortKey = 'people', summarySortDir = 'asc';
let summaryViewMode = 'table';
let summaryGraphMetric = 'total';
let summaryGraphMeasure = 'hours';
let summaryGraphDir = 'desc';
let summaryColumnsDraft = null;
let empSearch = '', empFilterDept = '', empFilterCatId = null;
let scheduleSectionFilter = '';
let deptColorsExpanded = false;
let collapsedPersonnelSections = new Set();
let collapsedPersonnelDepartments = new Set();
let openPersonnelColorGroups = new Set();
let draggedPersonnelId = null;
let hierarchyOrderExpanded = false;
let hiddenEmployees = new Set();
let hiddenEmployeesDraft = null;
let pastActivitiesExpanded = false;
let gridViewMode = 'all';
let gridPeriod = 'year';
let scheduleAnchorDate = todayStr();
let appZoom = 100;
let collapsedGridSections = { activities: false, holidays: false, employees: false };
let activityPageOffset = 0;
let activityPageSize = activityPageCapacity();

let employees = [], categories = [], statuses = [], activities = [], courses = [], courseStatuses = {}, requirements = [], requirementRecords = {};
let departmentOrder = {}, subdepartmentOrder = {}, hierarchyOrder = normalizeHierarchyOrderTree();
let entriesMap = {}, activityShiftsMap = {}, shiftRotationMap = {}, overtimeMap = {}, cellNotesMap = {}, workScheduleChecksMap = {};
let rotationDragSelection = null;
let nextEmpId = 1, nextActId = 1, nextStatusId = 1, nextCatId = 1;

let pickerEmpId = null, pickerDate = null, pickerSelectedStatus = null;
let pickerStatusLifecycle = 'confirmed';
let pickerDates = [];
let pendingActivityPreset = null;
let quickActivityTypeReturn = false;
let cellSelection = { active: false, empId: null, startDate: null, endDate: null, dates: [] };
let activityRangeSelection = { active: false, rowKey: null, startDate: null, endDate: null, dates: [] };
let holidayRangeSelection = { active: false, startDate: null, endDate: null, dates: [] };
let pendingHolidayRange = null;
let suppressCellClick = false;
let suppressActivityCellClick = false;
let pendingRangeSelection = null;
let editingEmpId = null, editingActId = null, editingStatusId = null, editingDailyStatusId = null, editingCatId = null, editingShiftTemplateId = null;
let selectedActColor = PALETTE[0], selectedParticipants = [], selectedStatusColor = PALETTE[0], selectedDailyStatusColor = PALETTE[0], selectedWorkCodeColor = '#3b82f6', selectedCatColor = PALETTE[7], selectedEmpCatIds = [];
let hasUnsavedChanges = false;
let undoStack = [];
let redoStack = [];
let checkUndoStack = [];
let checkRedoStack = [];
let autoSaveTimer = null;
let lastSyncTime = null;
let baseSnapshot = null;
let remoteUpdatePollTimer = null;
let remoteUpdateCheckInFlight = false;
let pendingRemoteRefreshData = null;
let pendingRemoteRefreshSavedAt = null;
let syncStatusState = 'updated';
let startupFileSelectionRequired = false;
let startupRecoveredDataAvailable = false;
let hostedMode = false;
let hostedRevision = 0;
let hostedUser = null;
let personalUpcomingData = null;
let hostedPendingAbsenceRequests = [];
let absenceInboxPollTimer = null;
let showAdminCheckIndicators = false;
let operationalChecksEnabled = true;
const hostedOperationalChecks = new Set();
let bossSessionActive = false;
let teamReportSelectedActivityIds = null;

// ═══ STATE MUTATION ENGINE ═══════════════════════════════════════════════════
async function mutateState(actionName, updateFn, options = { saveDisk: true }) {
  recordUndo();
  try {
    await updateFn();
  } catch (err) {
    console.error(`Mutation failed: ${actionName}`, err);
    return;
  }
  markUnsaved();
  await saveState();

  if (options.saveDisk || appSettings.autoSaveEnabled !== false) {
    if (canUseFileSystemSave() && localBackupFileHandle) {
      try {
        await writeLocalBackupFile(localBackupFileHandle);
        markFileSaved();
      } catch (err) {
        console.warn(`Direct disk write skipped (${actionName}):`, err.message);
      }
    }
  }
  updateSbStatus();
}

function updateUndoButton() {
  const button = document.getElementById('undo-btn');
  if (!button) return;
  button.disabled = undoStack.length === 0 && checkUndoStack.length === 0;
  button.style.opacity = button.disabled ? '.5' : '';
  const redoButton = document.getElementById('redo-btn');
  if (redoButton) {
    redoButton.disabled = redoStack.length === 0 && checkRedoStack.length === 0;
    redoButton.style.opacity = redoButton.disabled ? '.5' : '';
  }
}
function capturePlannerHistoryState() {
  return JSON.parse(JSON.stringify({
    appSettings: { ...appSettings, departmentColors: { ...(appSettings.departmentColors || {}) } },
    employees, departmentOrder, subdepartmentOrder, hierarchyOrder, categories, statuses, activities, courses, courseStatuses, requirements, requirementRecords, entriesMap, activityShiftsMap, shiftRotationMap, overtimeMap, cellNotesMap, workScheduleChecksMap,
    nextEmpId, nextActId, nextStatusId, nextCatId,
  }));
}
function restorePlannerHistoryState(previous) {
  ({ appSettings, employees, departmentOrder = {}, subdepartmentOrder = {}, hierarchyOrder = normalizeHierarchyOrderTree(), categories, statuses, activities, courses, courseStatuses, requirements, requirementRecords, entriesMap, activityShiftsMap, shiftRotationMap, overtimeMap, cellNotesMap, workScheduleChecksMap, nextEmpId, nextActId, nextStatusId, nextCatId } = previous);
  shiftRotationMap ||= {};
  overtimeMap ||= {};
  if (appSettings && typeof appSettings === 'object') Object.assign(appSettings, { ...appSettings, departmentColors: { ...(appSettings.departmentColors || {}) } });
}
function recordUndo() {
  undoStack.push(capturePlannerHistoryState());
  redoStack = [];
  if (undoStack.length > 20) undoStack.shift();
  updateUndoButton();
}
async function undoLastChange() {
  if (!undoStack.length && checkUndoStack.length) {
    const operation = checkUndoStack.pop();
    await applyHostedCheckState(operation.employeeId, operation.dates, !operation.checked);
    checkRedoStack.push(operation);
    updateUndoButton();
    return;
  }
  const previous = undoStack.pop();
  if (!previous) return;
  redoStack.push(capturePlannerHistoryState());
  restorePlannerHistoryState(previous);
  markUnsaved();
  await saveState(true);
  if (canUseFileSystemSave() && localBackupFileHandle) {
    try {
      await writeLocalBackupFile(localBackupFileHandle);
      markFileSaved();
    } catch (err) {
      console.warn('Direct disk write skipped (undoLastChange):', err.message);
    }
  }
  updateUndoButton();
  updateSbStatus();
  renderPage();
}
async function redoLastChange() {
  if (!redoStack.length && checkRedoStack.length) {
    const operation = checkRedoStack.pop();
    await applyHostedCheckState(operation.employeeId, operation.dates, operation.checked);
    checkUndoStack.push(operation);
    updateUndoButton();
    return;
  }
  const next = redoStack.pop();
  if (!next) return;
  undoStack.push(capturePlannerHistoryState());
  restorePlannerHistoryState(next);
  markUnsaved();
  await saveState(true);
  if (canUseFileSystemSave() && localBackupFileHandle) {
    try { await writeLocalBackupFile(localBackupFileHandle); markFileSaved(); } catch (err) { console.warn('Direct disk write skipped (redoLastChange):', err.message); }
  }
  updateUndoButton();
  updateSbStatus();
  renderPage();
}

function updateSaveButton() {
  const button = document.getElementById('save-btn');
  if (!button) return;
  if (hostedMode) {
    button.style.display = 'none';
    return;
  }
  button.style.display = '';
  button.disabled = startupFileSelectionRequired || (!hasUnsavedChanges && !!activeFileName);
  const label = hostedMode
    ? (hasUnsavedChanges ? 'Save Changes' : 'Save to Database')
    : (hasUnsavedChanges ? 'Save Changes' : 'Save');
  button.innerHTML = `${svgIcon('save')}<span class="sidebar-item-label">${label}</span>`;
  button.setAttribute?.('aria-label', label);
  if (button.dataset) button.dataset.sidebarTitle = label;
  if (sidebarMode === 'autohide') button.title = label;
  button.classList.toggle('unsaved-action', hasUnsavedChanges && !startupFileSelectionRequired);
  updateSyncButton();
}
function markUnsaved() {
  hasUnsavedChanges = true;
  persistFileMeta();
  updateSaveButton();
  updateSbStatus();
}
function scheduleAutoSave() {
  if (autoSaveTimer) clearTimeout(autoSaveTimer);
  markUnsaved();
  if (appSettings.autoSaveEnabled === false) return;
  autoSaveTimer = setTimeout(() => {
    saveState(true).catch(err => console.warn('Auto-save failed:', err.message));
  }, 800);
}
window.addEventListener('beforeunload', event => {
  if (!hasUnsavedChanges) return;
  event.preventDefault();
  event.returnValue = 'You have unsaved changes.';
});

function safeColor(c) { return /^#[0-9a-fA-F]{3,8}$/.test(String(c || '')) ? c : PALETTE[0]; }
function loadFromData(data) {
  const normalized = normalizeStateVersion(data || {});
  pendingRemoteRefreshData = null;
  pendingRemoteRefreshSavedAt = null;
  lastSyncTime = normalized.savedAt || new Date().toISOString();
  undoStack = [];
  redoStack = [];
  updateUndoButton();
  if (normalized.appSettings) {
    const localSettings = Object.fromEntries(LOCAL_ONLY_APP_SETTING_KEYS.map(key => [key, appSettings[key]]));
    appSettings = { ...appSettings, ...normalized.appSettings, ...localSettings };
    if (appSettings.appName === 'Team Manager' || appSettings.appName === 'ATLAS') appSettings.appName = 'Organisation';
    appSettings.coreWorkdayRange = normalizeCoreWorkdayRange(appSettings.coreWorkdayRange, '0730-1500');
    appSettings.coreHoursPerDay = timeRangeHours(appSettings.coreWorkdayRange) || 7.5;
    appSettings.shiftRotationEnabled = appSettings.shiftRotationEnabled === true;
    appSettings.shiftRotationRanges = normalizeShiftRotationRanges(appSettings.shiftRotationRanges);
    appSettings.holidays = Array.isArray(appSettings.holidays) ? appSettings.holidays : [];
    appSettings.specialDays = normalizeSpecialDays(appSettings.specialDays);
  }
  appSettings.departmentColors = normalized.departmentColors && typeof normalized.departmentColors === 'object'
    ? Object.fromEntries(Object.entries(normalized.departmentColors).map(([dept, value]) => [String(dept), normalizeHexColor(value)]))
    : {};
  appSettings.subdepartmentColors = normalized.subdepartmentColors && typeof normalized.subdepartmentColors === 'object'
    ? Object.fromEntries(Object.entries(normalized.subdepartmentColors).map(([key, value]) => [String(key), normalizeHexColor(value)]))
    : {};
  appSettings.sectionColors = normalized.sectionColors && typeof normalized.sectionColors === 'object'
    ? Object.fromEntries(Object.entries(normalized.sectionColors).map(([key, value]) => [String(key), normalizeHexColor(value)]))
    : {};
  appSettings.processColors = normalized.processColors && typeof normalized.processColors === 'object'
    ? Object.fromEntries(Object.entries(normalized.processColors).map(([key, value]) => [String(key), normalizeHexColor(value)]))
    : {};
  departmentOrder = normalizeHierarchyOrder(normalized.departmentOrder);
  subdepartmentOrder = normalizeHierarchyOrder(normalized.subdepartmentOrder);
  hierarchyOrder = normalizeHierarchyOrderTree(normalized.hierarchyOrder);
  migrateHierarchyOrderTree();
  appSettings.workCodes = normalizeWorkCodes(normalized.workCodes);
  appSettings.shiftTemplates = normalizeShiftTemplates(normalized.shiftTemplates);
  appSettings.summaryColumns = normalizeSummaryColumns(normalized.summaryColumns ?? appSettings.summaryColumns);
  courses = (normalized.courses || []).map(course => ({ ...course, id: +course.id }));
  courseStatuses = normalized.courseStatuses && typeof normalized.courseStatuses === 'object' ? { ...normalized.courseStatuses } : {};
  requirements = normalized.requirements;
  requirementRecords = normalized.requirementRecords;
  const joinCatIds = {};
  if (Array.isArray(normalized.employeeCategories)) {
    for (const ec of normalized.employeeCategories) {
      const eid = +ec.employeeId, cid = +ec.categoryId;
      if (Number.isFinite(eid) && Number.isFinite(cid)) (joinCatIds[eid] = joinCatIds[eid] || []).push(cid);
    }
  }
  employees = (normalized.employees || []).map(e => ({
    ...e,
    id: +e.id,
    organisation: String(e.organisation || e.organization || '').trim(),
    section: String(e.section || '').trim(),
    process: String(e.process || '').trim(),
    team: String(e.team || '').trim(),
    shiftTeamId: String(e.shiftTeamId || '').trim(),
    email: e.email || '',
    phoneWork: e.phoneWork || '',
    phonePrivate: e.phonePrivate || '',
    birthday: e.birthday || '',
    homeAddress: e.homeAddress || '',
    subdepartment: String(e.subdepartment || '').trim(),
    categoryIds: Array.isArray(e.categoryIds) && e.categoryIds.length
      ? e.categoryIds.map(Number).filter(Number.isFinite)
      : (joinCatIds[+e.id] || []),
    sortOrder: normalizeEmployeeSortOrder(e.sortOrder),
  }));
  ensureEmployeeSortOrders(employees);
  ensureDepartmentOrders();
  ensureSubdepartmentOrders();
  categories = (normalized.categories || []).map(c => ({ ...c, id: +c.id, color: safeColor(c.color) }));
  activities = (normalized.activities || normalized.projects || []).map(act => {
    const a = { ...act, id: +act.id, color: safeColor(act.color) };
    if ((!Array.isArray(a.participants) || !a.participants.length) && Array.isArray(a.employeeIds)) {
      a.participants = a.employeeIds.map(id => ({ id, shift: '' }));
    }
    a.participants = (a.participants || []).map(p => ({ id: +p.id })).filter(p => Number.isFinite(p.id));
    a.abbreviation = String(a.abbreviation || '').trim().toUpperCase().slice(0, 6);
    a.project = a.project || '';
    a.order = a.order || '';
    a.billing = a.billing || '';
    a.type = a.type || '';
    a.relevance = normalizeActivityRelevance(a.relevance || { departments: a.departments, sections: a.sections });
    a.eveningShift = a.eveningShift || '1200-2000';
    a.status = activityStatus(a);
    return a;
  });
  if (normalized.entriesMap && typeof normalized.entriesMap === 'object' && !Array.isArray(normalized.entriesMap)) {
    entriesMap = { ...normalized.entriesMap };
  } else if (Array.isArray(normalized.entries) && normalized.entries.length) {
    entriesMap = {}; normalized.entries.forEach(e => { entriesMap[e.key] = e.status; });
  } else if (Array.isArray(normalized.statusEntries) && normalized.statusEntries.length) {
    entriesMap = {};
    normalized.statusEntries.forEach(e => {
      entriesMap[`${+e.employeeId}_${e.date}`] = {
        status: e.status,
        durationType: e.durationType || 'fullday',
        time: e.time || null,
      };
    });
  } else entriesMap = {};
  overtimeMap = normalized.overtimeMap && typeof normalized.overtimeMap === 'object' && !Array.isArray(normalized.overtimeMap)
    ? Object.fromEntries(Object.entries(normalized.overtimeMap).map(([key, value]) => [key, {
        hours: formatHoursNumber(Number(value?.hours) || 0),
        note: String(value?.note || '').trim(),
      }]).filter(([, value]) => value.hours > 0 && value.hours <= 24))
    : {};
  cellNotesMap = normalized.cellNotesMap && typeof normalized.cellNotesMap === 'object' && !Array.isArray(normalized.cellNotesMap)
    ? Object.fromEntries(Object.entries(normalized.cellNotesMap).map(([key, value]) => [key, String(value || '').trim().slice(0, 240)]).filter(([, value]) => value))
    : {};
  workScheduleChecksMap = normalized.workScheduleChecksMap && typeof normalized.workScheduleChecksMap === 'object' && !Array.isArray(normalized.workScheduleChecksMap)
    ? Object.fromEntries(Object.entries(normalized.workScheduleChecksMap).filter(([, value]) => value === true))
    : {};
  if (normalized.activityShiftsMap && typeof normalized.activityShiftsMap === 'object' && !Array.isArray(normalized.activityShiftsMap)) {
    activityShiftsMap = Object.fromEntries(Object.entries(normalized.activityShiftsMap).map(([key, value]) => [key,
      typeof value === 'string' ? { shift: value || 'normal', workCodeId: null, administrativeTime: '', staffingImpactOverride: null, assigned: true, excluded: false } : { shift: value?.shift || (value?.assigned !== false && value?.excluded !== true ? 'normal' : ''), workCodeId: value?.workCodeId || null, administrativeTime: String(value?.administrativeTime || ''), staffingImpactOverride: null, assigned: value?.excluded === true ? false : value?.assigned !== false, excluded: value?.excluded === true }
    ]));
  } else if (Array.isArray(normalized.activityShifts)) {
    activityShiftsMap = {};
    normalized.activityShifts.forEach(s => {
      const eid = +s.employeeId, pid = +(s.activityId ?? s.projectId);
      if (Number.isFinite(eid) && Number.isFinite(pid) && s.date) activityShiftsMap[`${eid}_${s.date}_${pid}`] = { shift: s.shift || (s.assigned !== false && s.excluded !== true ? 'normal' : ''), workCodeId: s.workCodeId || null, administrativeTime: String(s.administrativeTime || ''), staffingImpactOverride: null, assigned: s.excluded === true ? false : s.assigned !== false, excluded: s.excluded === true };
    });
  } else activityShiftsMap = {};
  shiftRotationMap = cleanShiftRotationMap(normalized.shiftRotationMap, employees);
  const rawStatuses = Array.isArray(normalized.statuses) && normalized.statuses.length
    ? normalized.statuses
    : (Array.isArray(normalized.statusTypes) ? normalized.statusTypes.map(st => ({
        id: st.id, key: st.key, label: st.label, abbr: st.initial || st.abbr,
        color: st.color, isAbsence: st.isAbsence, isOutOfOffice: st.isOutOfOffice,
      })) : []);
  statuses = rawStatuses.map(s => ({
    ...s, id: +s.id, color: safeColor(s.color),
    abbr: String(s.abbr || '?').slice(0, 3),
    isAbsence: s.isAbsence === true, isOutOfOffice: s.isOutOfOffice === true,
  }));
  appSettings.activityTypes = normalizeActivityTypes(normalized.activityTypes.length ? normalized.activityTypes : rawStatuses);
  const maxId = arr => arr.length ? Math.max(...arr.map(x => x.id || 0)) : 0;
  nextEmpId    = Math.max(normalized.nextEmpId    || 1, maxId(employees) + 1);
  nextActId    = Math.max(normalized.nextActId    || 1, maxId(activities) + 1);
  nextStatusId = Math.max(normalized.nextStatusId || 1, maxId(statuses) + 1);
  nextCatId    = Math.max(normalized.nextCatId    || 1, maxId(categories) + 1);
  if (normalized.dailyStatusesSeparated !== true) migrateLegacyDailyStatuses(appSettings.activityTypes);
  sortDailyStatuses();
  pruneImplicitDefaultActivityShifts();
  employees.sort((a, b) => a.name.localeCompare(b.name));
  activities.sort((a, b) => a.startDate.localeCompare(b.startDate));
  baseSnapshot = { employees: JSON.parse(JSON.stringify(employees)), activities: JSON.parse(JSON.stringify(activities)) };
}


function updateSbStatus() {
  const dot = document.getElementById('db-dot');
  const text = document.getElementById('db-status-text');
  const status = document.getElementById('file-status');
  let label = hostedMode ? 'Database connected' : 'Updated';
  if (syncStatusState === 'syncing') {
    dot.className = 'db-indicator syncing';
    label = 'Syncing…';
  } else if (syncStatusState === 'out-of-sync') {
    dot.className = 'db-indicator';
    label = 'Out of sync';
  } else {
    dot.className = 'db-indicator connected';
  }
  if (text) {
    text.textContent = hasUnsavedChanges ? `${label} • Unsaved changes` : label;
  }
  if (status) {
    const unsavedHint = hasUnsavedChanges ? ' • Unsaved local changes' : '';
    status.title = hostedMode ? `Hosted SQLite database${hasUnsavedChanges ? ' • Unsaved changes' : ''}` : `${activeFileName || 'No active JSON file'}${unsavedHint}`;
  }
  renderSbToday();
}
function renderSbToday() {
  const el = document.getElementById('sb-today');
  const now = new Date();
  el.innerHTML = `
    <div class="today-date">${now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</div>
    <div style="display:flex;align-items:baseline;gap:6px;margin-top:2px">
      <span class="today-count">${employees.length}</span>
      <span class="today-sub">total personnel</span>
    </div>`;
}

// ═══ LOCAL PERSISTENCE ═══════════════════════════════════════════════════════
function snapshotData() {
  const snapshotStatuses = statuses.map(status => ({
    ...status,
    isAbsence: status.isAbsence === true,
    isOutOfOffice: status.isOutOfOffice === true,
  }));
  return {
    appVersion: APP_VERSION,
    dataVersion: DATA_VERSION,
    version: DATA_VERSION,
    savedAt: new Date().toISOString(),
    dailyStatusesSeparated: true,
    appSettings: plannerAppSettingsSnapshot(),
    departmentColors: appSettings.departmentColors || {},
    subdepartmentColors: appSettings.subdepartmentColors || {},
    sectionColors: appSettings.sectionColors || {},
    processColors: appSettings.processColors || {},
    departmentOrder,
    subdepartmentOrder,
    hierarchyOrder,
    activityTypes: appSettings.activityTypes || [],
    workCodes: appSettings.workCodes || [],
    shiftTemplates: appSettings.shiftTemplates || [],
    summaryColumns: appSettings.summaryColumns,
    employees, categories, statuses: snapshotStatuses, activities, courses, courseStatuses, requirements, requirementRecords, entriesMap, activityShiftsMap, shiftRotationMap, overtimeMap, cellNotesMap, workScheduleChecksMap,
      bugTracker: normalizeBugTracker(appSettings.bugTracker),
    nextEmpId, nextActId, nextStatusId, nextCatId,
  };
}
function persistableSnapshotData() {
  const snapshot = snapshotData();
  snapshot.shiftRotationMap = withoutNullMap(snapshot.shiftRotationMap);
  return snapshot;
}

async function saveState(force = false) {
  if (!force && appSettings.autoSaveEnabled === false) {
    markUnsaved();
    return;
  }
  try {
    if (hostedMode) {
      const response = await fetch('/api/planner', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ document: persistableSnapshotData(), expectedRevision: hostedRevision }),
      });
      if (response.status === 409) throw new Error('The planner was changed by another user. Refresh before saving again.');
      if (!response.ok) throw new Error(`Hosted save failed (${response.status}).`);
      const result = await response.json();
      hostedRevision = Number(result.revision) || hostedRevision + 1;
      if (result.document?.savedAt) lastSyncTime = result.document.savedAt;
      markFileSaved();
      updateSaveButton();
      updateSbStatus();
      if (autoSaveTimer) { clearTimeout(autoSaveTimer); autoSaveTimer = null; }
      return;
    }
    if (!lsSet(LOCAL_STATE_KEY, JSON.stringify(snapshotData()))) {
      throw new Error('Browser recovery storage is unavailable.');
    }
    updateSaveButton();
    updateSbStatus();
    if (autoSaveTimer) { clearTimeout(autoSaveTimer); autoSaveTimer = null; }
  } catch (err) {
    console.warn('Local JSON save failed:', err.message);
    throw err;
  }
}

function showHostedAuthScreen(mode, message = '') {
  document.getElementById('atlas-auth-screen')?.remove();
  const screen = document.createElement('div');
  screen.id = 'atlas-auth-screen';
  const setupFields = mode === 'setup' ? '<section class="atlas-wizard-step" data-step="1"><div class="atlas-wizard-kicker">Step 1 of 5</div><h2>Create administrator</h2><p>Create the first account that will manage this ATLAS installation.</p><label>Name<input id="atlas-auth-name" autocomplete="name" required></label><label>Username<input id="atlas-auth-username" autocomplete="username" required></label><label>Email<input id="atlas-auth-email" type="email" autocomplete="email" required></label><label>Password<input id="atlas-auth-password" type="password" autocomplete="new-password" minlength="12" required><small>Use at least 12 characters.</small></label></section><section class="atlas-wizard-step" data-step="2" hidden><div class="atlas-wizard-kicker">Step 2 of 5</div><h2>Organisation structure</h2><p>Choose the depth that best matches how your organisation is arranged.</p><label>Team or organisation name<input id="atlas-auth-organisation-name" maxlength="120" placeholder="e.g. Operations Team" required><small>This name will be shown throughout the planner and can be changed later.</small></label><div class="atlas-choice-grid"><label><input type="radio" name="atlas-organisation-type" value="process-subteams" checked><b>2 levels</b><span>Process → Team</span><small>Useful for a simple team structure.</small></label><label><input type="radio" name="atlas-organisation-type" value="section-process-team"><b>3 levels</b><span>Section → Process → Team</span><small>Adds a section above processes.</small></label><label><input type="radio" name="atlas-organisation-type" value="department-section-process-team"><b>4 levels</b><span>Department → Section → Process → Team</span><small>For larger departmental structures.</small></label><label><input type="radio" name="atlas-organisation-type" value="organisation-department-section-process-team"><b>5 levels</b><span>Organisation → Department → Section → Process → Team</span><small>Full organisation hierarchy.</small></label></div></section><section class="atlas-wizard-step" data-step="3" hidden><div class="atlas-wizard-kicker">Step 3 of 5</div><h2>Shift Rotation</h2><p>Plan recurring shifts and crew rotations separately from the activity schedule. After setup, mark personnel as <b>Include in Shift Rotation</b> and optionally assign Shift Teams.</p><label class="atlas-feature-card"><input id="atlas-auth-shift-rotation" type="checkbox"><span><b>Enable Shift Rotation</b><small>Show the rotation planner and related settings.</small></span></label></section><section class="atlas-wizard-step" data-step="4" hidden><div class="atlas-wizard-kicker">Step 4 of 5</div><h2>Activity Workwheel</h2><p>Use a visual wheel for recurring meetings, deadlines, and activities for people or organisational units.</p><label class="atlas-feature-card"><input id="atlas-auth-workwheel" type="checkbox"><span><b>Enable Activity Workwheel</b><small>The current hosted Workwheel is browser-local until shared persistence is added.</small></span></label></section><section class="atlas-wizard-step" data-step="5" hidden><div class="atlas-wizard-kicker">Step 5 of 5</div><h2>Schedule check system</h2><p>Let personnel leaders check that activities and schedule entries match an external billing or verification system.</p><label class="atlas-feature-card"><input id="atlas-auth-operational-checks" type="checkbox" checked><span><b>Enable schedule check system</b><small>Responsibility scopes can be assigned to administrators after setup.</small></span></label><label>Organisation timezone<select id="atlas-auth-timezone" required><option value="UTC">UTC</option><option value="Europe/Oslo">Europe/Oslo</option><option value="Europe/London">Europe/London</option><option value="America/New_York">America/New_York</option><option value="America/Los_Angeles">America/Los_Angeles</option><option value="America/Chicago">America/Chicago</option><option value="Asia/Tokyo">Asia/Tokyo</option><option value="Asia/Singapore">Asia/Singapore</option><option value="Australia/Sydney">Australia/Sydney</option><option value="Pacific/Auckland">Pacific/Auckland</option></select><small>Choose the IANA timezone used for organisation dates and schedule calculations.</small></section>' : '<label>Username<input id="atlas-auth-username" autocomplete="username" required></label><label>Password<input id="atlas-auth-password" type="password" autocomplete="current-password" required></label>';
  const passwordHint = mode === 'setup' ? '<small>Use at least 12 characters.</small>' : '';
  screen.innerHTML = `<div class="atlas-auth-card"><div class="atlas-auth-brand">ATLAS</div><h1>${mode === 'setup' ? 'Installation setup' : 'Sign in'}</h1><p class="atlas-auth-message">${message || (mode === 'setup' ? 'Configure this hosted planner in a few quick steps.' : 'Sign in to continue.')}</p><form id="atlas-auth-form">${setupFields}<div id="atlas-auth-error" role="alert"></div>${mode === 'setup' ? '<div class="atlas-wizard-actions"><button type="button" id="atlas-wizard-back">Back</button><button type="button" id="atlas-wizard-next" class="btn-primary">Next</button></div>' : '<button type="submit">Sign in</button>'}</form></div>`;
  document.body.appendChild(screen);
  const organizationStep = screen.querySelector('.atlas-wizard-step[data-step="2"]');
  if (organizationStep) organizationStep.innerHTML = '<div class="atlas-wizard-kicker">Step 2 of 5</div><h2>Organisation</h2><p>Choose the installation mode and name. Organisation depth is configured through actual personnel records.</p><label>Team or organisation name<input id="atlas-auth-organisation-name" maxlength="120" placeholder="e.g. Operations Team" required><small>This name will be shown throughout the planner.</small></label><label class="atlas-checkbox"><input id="atlas-auth-multisite" type="checkbox"><span><b>Enable multisite hosting</b><small>Allow a platform administrator to provision multiple isolated organisations.</small></span></label><label id="atlas-auth-organisation-slug-row" hidden>Organisation code or slug<input id="atlas-auth-organisation-slug" maxlength="64" pattern="[a-z0-9-]+" placeholder="operations-team"><small>Lowercase letters, numbers, and hyphens only.</small></label>';
  if (mode === 'login') screen.querySelector('#atlas-auth-form')?.insertAdjacentHTML('afterbegin', '');
  screen.querySelector('#atlas-auth-multisite')?.addEventListener('change', event => { const row = screen.querySelector('#atlas-auth-organisation-slug-row'); if (row) row.hidden = !event.target.checked; });
  const form = screen.querySelector('#atlas-auth-form');
  const error = screen.querySelector('#atlas-auth-error');
  const wizardSteps = [...screen.querySelectorAll('.atlas-wizard-step')];
  let wizardStep = 0;
  const showWizardStep = () => { wizardSteps.forEach((step, index) => { step.hidden = index !== wizardStep; }); const back = screen.querySelector('#atlas-wizard-back'); const next = screen.querySelector('#atlas-wizard-next'); if (back) back.disabled = wizardStep === 0; if (next) next.textContent = wizardStep === wizardSteps.length - 1 ? 'Create administrator' : 'Next'; };
  showWizardStep();
  screen.querySelector('#atlas-wizard-back')?.addEventListener('click', () => { if (wizardStep > 0) { wizardStep -= 1; showWizardStep(); } });
  screen.querySelector('#atlas-wizard-next')?.addEventListener('click', () => { if (wizardStep < wizardSteps.length - 1) { wizardStep += 1; showWizardStep(); } else form.requestSubmit(); });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const button = form.querySelector('button');
    button.disabled = true;
    error.textContent = '';
    try {
      const payload = { username: form.querySelector('#atlas-auth-username').value, password: form.querySelector('#atlas-auth-password').value };
      if (mode === 'setup') { payload.organizationName = form.querySelector('#atlas-auth-organisation-name').value.trim(); payload.multisiteEnabled = form.querySelector('#atlas-auth-multisite').checked; }
      if (mode === 'setup') Object.assign(payload, { name: form.querySelector('#atlas-auth-name').value, email: form.querySelector('#atlas-auth-email').value, organizationName: form.querySelector('#atlas-auth-organisation-name').value, organizationSlug: form.querySelector('#atlas-auth-organisation-slug')?.value.trim() || 'default', multisiteEnabled: form.querySelector('#atlas-auth-multisite')?.checked === true, timezone: form.querySelector('#atlas-auth-timezone')?.value || 'UTC', shiftRotationEnabled: form.querySelector('#atlas-auth-shift-rotation').checked, operationalChecksEnabled: form.querySelector('#atlas-auth-operational-checks').checked, workwheelEnabled: form.querySelector('#atlas-auth-workwheel').checked });
      const endpoint = mode === 'setup' ? '/api/setup/create-admin' : '/api/auth/login';
      const response = await fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Authentication failed.');
      hostedUser = result.user;
      if (mode === 'login' && Array.isArray(result.organizations) && result.organizations.length > 1) {
        const selectedSlug = await chooseHostedOrganization(result.organizations);
        if (!selectedSlug) throw new Error('Choose an organization to continue.');
      }
      screen.remove();
      await loadHostedPlanner();
      if (mode === 'setup') {
        appSettings.appName = form.querySelector('#atlas-auth-organisation-name').value.trim();
        applyAppName();
        await saveState(true);
        renderPage();
      }
    } catch (err) {
      error.textContent = err.message || 'Authentication failed.';
      button.disabled = false;
    }
  });
}
function chooseHostedOrganization(organizations) {
  return new Promise(resolve => {
    const options = organizations.map((organization, index) => `<option value="${esc(organization.slug)}" ${index === 0 ? 'selected' : ''}>${esc(organization.name)} · ${esc(organization.slug)}</option>`).join('');
    const screen = document.createElement('div');
    screen.id = 'atlas-organization-choice';
    screen.innerHTML = `<div class="atlas-auth-card"><div class="atlas-auth-brand">ATLAS</div><h1>Choose organisation</h1><p class="atlas-auth-message">Select the organisation you want to open.</p><label>Organisation<select id="atlas-organization-select">${options}</select></label><button id="atlas-organization-continue" class="btn-primary" type="button">Continue</button></div>`;
    document.body.appendChild(screen);
    screen.querySelector('#atlas-organization-continue').addEventListener('click', () => { const slug = screen.querySelector('#atlas-organization-select').value; screen.remove(); resolve(slug); });
  });
}

async function loadHostedPlanner() {
  const response = await fetch('/api/planner', { cache: 'no-store' });
  if (!response.ok) throw new Error(`Hosted planner load failed (${response.status}).`);
  const result = await response.json();
  hostedRevision = Number(result.revision) || 1;
  loadFromData(result.document || {});
  appSettings.autoSaveEnabled = true;
  activeFileName = 'Hosted SQLite';
  setRemoteUpdateSource('hosted');
  markFileSaved();
  await loadHostedOperationalChecks();
  updateHostedAccountUi();
  updateSbStatus();
  nav('grid');
}
async function loadHostedOperationalChecks() {
  if (!canHostedCheckOff()) return;
  try {
    const response = await fetch('/api/admin/operational-checks', { cache: 'no-store' });
    if (!response.ok) return;
    const result = await response.json();
    hostedOperationalChecks.clear();
    for (const check of result.checks || []) hostedOperationalChecks.add(`${check.employeeId}|${check.date}|${check.subjectKind}|${check.subjectKey}`);
  } catch (error) { console.warn('Could not load operational checks:', error.message); }
}

async function authenticateHostedApp() {
  const statusResponse = await fetch('/api/auth/bootstrap-status', { cache: 'no-store' });
  if (!statusResponse.ok) throw new Error('Could not determine hosted setup status.');
  const status = await statusResponse.json();
  if (status.setupRequired) {
    showHostedAuthScreen('setup');
    return false;
  }
  const meResponse = await fetch('/api/auth/me', { cache: 'no-store' });
  if (meResponse.ok) {
    const auth = await meResponse.json();
    hostedUser = { ...auth.user, preferences: auth.user.preferences, availableUsers: auth.user.availableUsers || [] };
    if (auth.user.preferences) {
      appSettings.jumpToTodayOnGridChange = auth.user.preferences.jumpToTodayOnGridChange !== false;
      appSettings.darkMode = auth.user.preferences.darkMode === true;
      applyAppZoom(auth.user.preferences.zoom);
      applyTheme();
    }
    operationalChecksEnabled = auth.operationalChecksEnabled !== false;
    if (auth.installation) {
      appSettings.shiftRotationEnabled = auth.installation.shiftRotationEnabled === true;
      appSettings.workwheelEnabled = auth.installation.workwheelEnabled === true;
    }
    return true;
  }
  showHostedAuthScreen('login');
  return false;
}

async function saveData() {
  if (hostedMode) {
    try {
      await saveState(true);
      showToast('Saved to hosted SQLite.', 4000);
    } catch (err) {
      console.error('Hosted save failed:', err);
      alert(err?.message || 'Could not save to hosted SQLite.');
    }
    return;
  }
  if (canUseFileSystemSave()) {
    const existingHandle = localBackupFileHandle;
    if (!existingHandle) {
      await saveDataAs();
      return;
    }
  }
  const btn = document.getElementById('save-btn');
  const originalText = btn ? btn.innerHTML : '';
  try {
    if (btn) btn.innerHTML = 'Saving...';
    if (autoSaveTimer) { clearTimeout(autoSaveTimer); autoSaveTimer = null; }
    const saveResult = await saveLocalBackupFile(false);
    try {
      await saveState(true);
    } catch (recoveryError) {
      console.warn('Browser recovery error:', recoveryError);
    }
    markFileSaved();
    if (isDownloadFallbackResult(saveResult)) showToast(`Saved downloaded copy: ${saveResult}.`, 5000);
    updateSaveButton();
    updateSbStatus();
  } catch (err) {
    if (err && err.name === 'AbortError') return;
    let message = err?.message || 'Could not save the JSON file.';
    if (message.includes('permission') || message.includes('Permission')) {
      message += ' Try using "Save As..." from settings to select a different file.';
    } else if (!message.includes('selected')) {
      message += ' Please ensure a JSON file is selected.';
    }
    console.error('Save failed:', err);
    alert(message);
    updateSaveButton();
  } finally {
    if (btn) btn.innerHTML = originalText;
  }
}

function persistFileMeta() {
  lsSet(LOCAL_FILE_META_KEY, JSON.stringify({
    dirty: hasUnsavedChanges,
    fileName: activeFileName,
    source: remoteUpdateSource,
  }));
}

function formatPortableDefaultLoadIssue(err) {
  if (err?.name === 'SyntaxError') return 'Could not load the JSON file because it is not valid JSON.';
  if (typeof err?.message === 'string') {
    if (err.message.includes('404')) return 'Could not find the JSON file next to the app files.';
    if (err.message.includes('empty')) return 'Could not load the JSON file because it is empty.';
  }
  return 'Could not load the JSON file automatically. In Edge, serve the folder on localhost or choose a different JSON file.';
}

function plannerDataHasContent(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  const listFields = ['employees', 'activities', 'projects', 'statuses', 'statusTypes', 'categories', 'courses', 'requirements'];
  if (listFields.some(field => Array.isArray(data[field]) && data[field].length > 0)) return true;
  const mapFields = ['entriesMap', 'overtimeMap', 'activityShiftsMap', 'shiftRotationMap', 'requirementRecords', 'courseStatuses'];
  return mapFields.some(field => {
    const value = data[field];
    return value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length > 0;
  });
}

async function fetchPortableDefaultPlannerData() {
  const response = await fetch(PORTABLE_DEFAULT_JSON_URL, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Could not load portable default JSON (${response.status}).`);
  const text = await response.text();
  if (!text || !text.trim()) throw new Error('Portable default JSON is empty.');
  const parsed = JSON.parse(text);
  validatePlannerData(parsed);
  return parsed;
}

async function loadPortableDefaultPlannerData(options = {}) {
  const parsed = await fetchPortableDefaultPlannerData();
  if (plannerDataHasContent(options.fallbackData) && !plannerDataHasContent(parsed)) {
    throw new Error('Portable default JSON is empty compared with recovered local planner data.');
  }
  await applyLoadedPlannerData(parsed, {
    fileName: PORTABLE_DEFAULT_JSON_NAME,
    remoteUpdateSource: 'portable-default',
    closeSettings: options.closeSettings,
  });
}

async function createBackupIfNeeded(options = {}) {
  if (remoteUpdateSource !== 'file-handle' || !localBackupFileHandle) return false;
  const notifyOnly = options.notifyOnly === true;
  const lastBackupTimestamp = lsGet(LAST_BACKUP_TIMESTAMP_KEY);
  const lastBackupMs = lastBackupTimestamp ? new Date(lastBackupTimestamp).getTime() : 0;

  let directoryHandle = await loadStoredPlannerDirectoryHandle();
  if (!directoryHandle && !notifyOnly) {
    directoryHandle = await capturePlannerDirectoryHandle(localBackupFileHandle);
  }
  if (!directoryHandle || typeof directoryHandle.getDirectoryHandle !== 'function') {
    if (notifyOnly) return false;
    return false;
  }
  if (typeof directoryHandle.queryPermission === 'function') {
    const permission = await directoryHandle.queryPermission({ mode: notifyOnly ? 'read' : 'readwrite' });
    if (permission !== 'granted') return false;
  }
  if (typeof directoryHandle.resolve === 'function') {
    try {
      const relativePath = await directoryHandle.resolve(localBackupFileHandle);
      if (!Array.isArray(relativePath) || relativePath.length !== 1) return false;
    } catch (err) {
      console.warn('Stored planner directory is not available for weekly backups:', err?.message || err);
      return false;
    }
  }
  let newestBackupMs = 0;
  try {
    const backupsDirectoryHandle = await directoryHandle.getDirectoryHandle('backups', { create: false });
    if (backupsDirectoryHandle?.values) {
      for await (const entry of backupsDirectoryHandle.values()) {
        if (entry.kind !== 'file') continue;
        const match = /^backup-(\d{4}-\d{2}-\d{2})\.json$/.exec(entry.name);
        if (!match) continue;
        const timestamp = new Date(`${match[1]}T23:59:59`).getTime();
        if (Number.isFinite(timestamp)) newestBackupMs = Math.max(newestBackupMs, timestamp);
      }
    }
  } catch (err) {
    if (err?.name !== 'NotFoundError') console.warn('Could not inspect weekly backups:', err?.message || err);
  }
  const effectiveLastBackupMs = Math.max(newestBackupMs, Number.isFinite(lastBackupMs) ? lastBackupMs : 0);
  const backupDue = !effectiveLastBackupMs || (Date.now() - effectiveLastBackupMs) >= AUTO_BACKUP_INTERVAL_MS;
  if (!backupDue) return false;
  if (notifyOnly) {
    showToast('Your weekly backup is more than 7 days old.', 12000, {
      label: 'Create backup',
      onClick: () => createBackupIfNeeded(),
    });
    return false;
  }
  const payloadData = persistableSnapshotData();
  payloadData.savedAt = new Date().toISOString();
  const payload = validatedPlannerPayload(payloadData);
  try {
    const backupsDirectoryHandle = await directoryHandle.getDirectoryHandle('backups', { create: true });
    const backupFileHandle = await backupsDirectoryHandle.getFileHandle(`backup-${todayStr()}.json`, { create: true });
    await replacePlannerFileContents(backupFileHandle, payload);
    await verifyPlannerFileContents(backupFileHandle, payload);
    lsSet(LAST_BACKUP_TIMESTAMP_KEY, payloadData.savedAt);
    return true;
  } catch (err) {
    console.warn('Weekly backup failed:', err?.message || err);
    return false;
  }
}

function markFileSaved() {
  hasUnsavedChanges = false;
  pendingRemoteRefreshData = null;
  pendingRemoteRefreshSavedAt = null;
  persistFileMeta();
  if (!startupFileSelectionRequired) setSyncStatusState('updated');
  updateSaveButton();
  updateSbStatus();
}

// ═══ HELPERS ═════════════════════════════════════════════════════════════════
function esc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])); }
function cleanHtml(markup) { return String(markup).replace(/\u00a0/g, ' '); }
function fmt(d) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
function todayStr() { return fmt(new Date()); }
function isValidIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return false;
  const date = new Date(`${value}T00:00:00`);
  return !Number.isNaN(date.getTime()) && fmt(date) === value;
}
function dateBeforeIso(dateString) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dateString || ''))) return '';
  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() - 1);
  return fmt(date);
}
function fmtShort(ds) { return new Date(ds + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }
function fmtMed(ds) { return new Date(ds + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
function daysOfYear(y) { const days = [], d = new Date(y, 0, 1); while (d.getFullYear() === y) { days.push(new Date(d)); d.setDate(d.getDate()+1); } return days; }
function scheduleRange() {
  const anchor = new Date();
  if (gridPeriod === 'year') return { start: `${gridYear}-01-01`, end: `${gridYear}-12-31`, days: daysOfYear(gridYear), label: String(gridYear) };
  const stored = new Date(`${scheduleAnchorDate}T00:00:00`);
  if (gridPeriod === 'month') {
    const startDate = new Date(stored.getFullYear(), stored.getMonth(), 1);
    const endDate = new Date(stored.getFullYear(), stored.getMonth() + 1, 0);
    return { start: fmt(startDate), end: fmt(endDate), days: datesBetween(fmt(startDate), fmt(endDate)).map(ds => new Date(`${ds}T00:00:00`)), label: startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) };
  }
  const startDate = new Date(stored);
  const day = (startDate.getDay() + 6) % 7;
  startDate.setDate(startDate.getDate() - day);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);
  return { start: fmt(startDate), end: fmt(endDate), days: datesBetween(fmt(startDate), fmt(endDate)).map(ds => new Date(`${ds}T00:00:00`)), label: `Week ${isoWeek(startDate)}, ${startDate.getFullYear()}` };
}
function scheduleDays() { return scheduleRange().days; }
function scheduleStartEnd() { const range = scheduleRange(); return { start: range.start, end: range.end }; }
function isWknd(d) { const g = d.getDay(); return g === 0 || g === 6; }
function isoWeekInfo(d) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7));
  const year = t.getUTCFullYear();
  const yearStart = new Date(Date.UTC(year, 0, 1));
  const week = Math.ceil((((t - yearStart) / 86400000) + 1) / 7);
  return { year, week };
}
function isoWeek(d) {
  return isoWeekInfo(d).week;
}
function isoWeekStringFromDate(date) {
  const info = isoWeekInfo(date);
  return `${info.year}-W${String(info.week).padStart(2, '0')}`;
}
function isoWeekStartDate(weekValue) {
  const match = /^(\d{4})-W(\d{2})$/.exec(String(weekValue || ''));
  if (!match) return null;
  const year = +match[1];
  const week = +match[2];
  const simple = new Date(Date.UTC(year, 0, 1 + (week - 1) * 7));
  const dow = simple.getUTCDay() || 7;
  if (dow <= 4) simple.setUTCDate(simple.getUTCDate() - dow + 1);
  else simple.setUTCDate(simple.getUTCDate() + 8 - dow);
  return new Date(simple.getUTCFullYear(), simple.getUTCMonth(), simple.getUTCDate());
}
function siFor(key) { return statuses.find(s => s.key === key) || null; }
function catById(id) { return categories.find(c => c.id === id) || null; }
function empById(id) { return employees.find(e => e.id === id) || null; }
function getEntryObj(key) {
  const v = entriesMap[key];
  if (!v) return null;
  if (typeof v === 'string') return { status: v, durationType: 'fullday', time: null, lifecycle: 'confirmed' };
  return {
    ...v,
    durationType: v.durationType || (String(v.time || '').trim() ? 'time' : 'fullday'),
    time: v.time || null,
    lifecycle: v.lifecycle === 'planned' ? 'planned' : 'confirmed',
  };
}
function statusEntryIsPlanned(entry) { return entry?.lifecycle === 'planned'; }
function statusStyle(color) { return `background:${color}20;color:${color};border-color:${color}50`; }
function chipStyle(color) { return `background:${color}20;border-color:${color}60;color:${color}`; }
function friendlyStatusLabel(key) {
  const normalized = String(key ?? '').trim();
  if (!normalized) return 'At Work';
  if (normalized === 'at_work' || normalized === 'present' || normalized === 'At Work' || normalized === 'Present') return 'At Work';
  const st = siFor(normalized);
  if (st) return st.label;
  return normalized.replace(/[_-]+/g, ' ').replace(/\b\w/g, ch => ch.toUpperCase());
}
function actParticipantIds(act) { return (act.participants || []).map(p => p.id); }
function participantFor(act, empId) { return (act.participants || []).find(p => p.id === empId) || null; }
function timeRangeHours(str) {
  const m = String(str || '').trim().match(/^(\d{1,2}):?(\d{2})\s*[-–]\s*(\d{1,2}):?(\d{2})$/);
  if (!m) return null;
  const start = (+m[1]) + (+m[2]) / 60, end = (+m[3]) + (+m[4]) / 60;
  let diff = end - start;
  if (diff <= 0) diff += 24;
  return diff;
}
function timeRangeInterval(str) {
  const m = String(str || '').trim().match(/^(\d{1,2}):?(\d{2})\s*[-–]\s*(\d{1,2}):?(\d{2})$/);
  if (!m) return null;
  const start = (+m[1]) + (+m[2]) / 60;
  let end = (+m[3]) + (+m[4]) / 60;
  if (end <= start) end += 24;
  return { start, end };
}
function intervalOverlapHours(a, b) {
  const start = Math.max(a.start, b.start);
  const end = Math.min(a.end, b.end);
  return Math.max(0, end - start);
}
function mergeIntervals(intervals) {
  if (!intervals.length) return [];
  const sorted = [...intervals].sort((a, b) => a.start - b.start);
  const merged = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    const cur = sorted[i];
    const prev = merged[merged.length - 1];
    if (cur.start <= prev.end) prev.end = Math.max(prev.end, cur.end);
    else merged.push({ ...cur });
  }
  return merged;
}
function activityExtraHoursOutsideBaseline(shiftIntervals, baselineShift) {
  if (!shiftIntervals.length) return 0;
  const merged = mergeIntervals(shiftIntervals);
  const activityHours = merged.reduce((sum, intv) => sum + Math.max(0, intv.end - intv.start), 0);
  return Math.max(0, activityHours - appSettings.coreHoursPerDay);
}
function shiftHours(shift) {
  if (!shift || shift === 'fullday') return appSettings.coreHoursPerDay;
  return timeRangeHours(shift) ?? appSettings.coreHoursPerDay;
}
function activityDefaultShift(shiftType, act = null) {
  if (shiftType === 'normal') return act?.normalShift || appSettings.coreWorkdayRange || '0730-1500';
  if (shiftType === 'night') return act?.nightShift || '0000-0730';
  if (shiftType === 'evening') return act?.eveningShift || '1200-2000';
  return act?.dayShift || '0730-2400';
}
function activityShiftHours(act, empId, date) {
  if (activityStatus(act) !== 'confirmed') return 0;
  const assignment = activityAssignment(`${empId}_${date}_${act.id}`);
  if (!assignment.assigned || assignment.excluded || !assignment.shift) return 0;
  const shiftStr = assignment.shift || 'normal';
  if (shiftStr === 'turn') return 0;
  if (['normal', 'day', 'evening', 'night'].includes(shiftStr)) {
    return timeRangeHours(activityDefaultShift(shiftStr, act)) ?? 0;
  }
  return timeRangeHours(shiftStr) ?? 0;
}
function activityShiftMeta(act, shift) {
  if (shift === 'normal') return { key: 'normal', label: 'Normal Working Hours', range: activityDefaultShift('normal', act), icon: '' };
  if (shift === 'day') return { key: 'day', label: 'Day', range: activityDefaultShift('day', act), icon: svgIcon('sun', 'Day') };
  if (shift === 'night') return { key: 'night', label: 'Night', range: activityDefaultShift('night', act), icon: svgIcon('moon', 'Night') };
  if (shift === 'evening') return { key: 'evening', label: 'Mid-day / Evening', range: activityDefaultShift('evening', act), icon: svgIcon('evening', 'Mid-day / Evening') };
  if (shift === 'turn') return { key: 'turn', label: 'Turnaround', range: '', icon: shiftChangeIcon('Turnaround') };
  return shift ? { key: shift, label: 'Custom', range: shift, icon: '' } : null;
}
function activityAssignmentInfo(act, empId, date) {
  if (activityStatus(act) !== 'confirmed') return null;
  const assignment = activityAssignment(`${empId}_${date}_${act.id}`);
  const workCode = (appSettings.workCodes || []).find(code => code.id === assignment.workCodeId)
    || (assignment.shift === 'normal' ? { id: null, name: 'Normal Working Hours', abbreviation: 'NA', color: act.color } : null);
  if (!assignment.assigned || assignment.excluded || !assignment.shift || !workCode) return null;
  const shiftMeta = activityShiftMeta(act, assignment.shift);
  const physicalShift = ['normal', 'day', 'evening', 'night'].includes(assignment.shift)
    ? `${shiftMeta.label} (${shiftMeta.range})`
    : (assignment.shift === 'turn' ? shiftMeta.label : (assignment.shift || 'Not specified'));
  const administrativeMeasure = activityAdministrativeMeasure(act, empId, date);
  const administrativeValue = formatCompactMeasure(administrativeMeasure.units, administrativeMeasure.hours);
  return { assignment, workCode, physicalShift, physicalHours: activityShiftHours(act, empId, date), administrativeMeasure, administrativeValue };
}
function assignmentShiftType(shift, participant = null) {
  if (shift === 'normal' || shift === 'day' || shift === 'evening' || shift === 'night' || shift === 'turn') return shift;
  return participant?.shiftType === 'night' ? 'night' : (participant?.shiftType === 'evening' ? 'evening' : (participant?.shiftType === 'normal' ? 'normal' : 'day'));
}
function activityCountsTowardLoad(act) {
  return act?.countsTowardLoad !== false;
}
function effectiveStaffingImpact(assignment) {
  const workCode = (appSettings.workCodes || []).find(code => code.id === assignment?.workCodeId);
  return workCode?.staffingImpact === 'unavailable' ? 'unavailable' : 'available';
}
function assignmentMakesUnavailable(act, empId, date) {
  if (!act || activityStatus(act) !== 'confirmed' || date < act.startDate || date > act.endDate) return false;
  const assignment = activityAssignment(`${empId}_${date}_${act.id}`);
  return assignment.assigned === true && !assignment.excluded && Boolean(assignment.workCodeId) && effectiveStaffingImpact(assignment) === 'unavailable';
}
function unavailableActivityFor(empId, date) {
  return activities.find(act => assignmentMakesUnavailable(act, empId, date)) || null;
}
function activityStatus(act) {
  return ['tentative', 'confirmed', 'cancelled'].includes(act?.status) ? act.status : 'confirmed';
}
function activityStatusMeta(act) {
  const status = activityStatus(act);
  if (status === 'tentative') return { status, label: 'Planned', className: 'planned' };
  if (status === 'cancelled') return { status, label: 'Cancelled', className: 'cancelled' };
  return { status, label: 'Confirmed', className: 'confirmed' };
}
function activityTypeMeta(act) {
  const typeKey = (act?.type || '').trim();
  if (!typeKey) return null;
  const type = (appSettings.activityTypes || []).find(item => item.key === typeKey);
  return type ? { ...type, label: type.name, abbr: type.abbreviation } : (siFor(typeKey) || null);
}
function activityAssignment(key) {
  const value = activityShiftsMap[key];
  if (!value) return { shift: '', workCodeId: null, staffingImpactOverride: null, assigned: false, excluded: false };
  return typeof value === 'string'
    ? { shift: value, workCodeId: null, administrativeTime: '', staffingImpactOverride: null, assigned: true, excluded: false }
    : { shift: value.shift || (value.assigned !== false && value.excluded !== true ? 'normal' : ''), workCodeId: value.workCodeId || null, administrativeTime: String(value.administrativeTime || ''), staffingImpactOverride: null, assigned: value.excluded === true ? false : value.assigned !== false, excluded: value.excluded === true };
}
function activityAssignmentShift(key) {
  return activityAssignment(key).shift;
}
function excludeActivityAssignment(key) {
  activityShiftsMap[key] = { shift: '', workCodeId: null, administrativeTime: '', staffingImpactOverride: null, assigned: false, excluded: true };
}
function participantActivityShift(act, empId, dateString) {
  const participant = participantFor(act, empId);
  if (!participant) return '';
  return dateString ? activityAssignmentShift(`${empId}_${dateString}_${act.id}`) : '';
}
function activityHasScheduledShift(act, empId, start, end) {
  if (activityStatus(act) === 'cancelled') return false;
  const prefix = `${empId}_`;
  const suffix = `_${act.id}`;
  return Object.keys(activityShiftsMap).some(key => {
    if (!key.startsWith(prefix) || !key.endsWith(suffix)) return false;
    const [, date] = key.split('_', 3);
    if (date < start || date > end) return false;
    // Respect includeWeekends flag: if activity is weekday-only, skip weekend shifts
    if (!act.includeWeekends && isWknd(new Date(`${date}T00:00:00`))) return false;
    const assignment = activityAssignment(key);
    return assignment.assigned === true && assignment.excluded !== true && Boolean(assignment.shift);
  });
}
function pruneImplicitDefaultActivityShifts() {
  for (const act of activities) {
    for (const participant of act.participants || []) {
      if (participant.hasScheduledShifts === true) continue;
      if ((participant.shift || '').trim()) continue;
      const prefix = `${participant.id}_`;
      const suffix = `_${act.id}`;
      const participantShiftKeys = Object.keys(activityShiftsMap).filter(key => key.startsWith(prefix) && key.endsWith(suffix));
      if (!participantShiftKeys.length) continue;
      const hasOnlyFulldayEntries = participantShiftKeys.every(key => activityAssignmentShift(key) === 'fullday');
      if (!hasOnlyFulldayEntries) continue;
      participantShiftKeys.forEach(key => activityShiftsMap[key] = null);
    }
  }
}
function entryHours(entry) {
  if (!entry) return 0;
  if (entry.durationType === '24hours') return 24;
  if (entry.durationType === 'time' && entry.time) return timeRangeHours(entry.time) ?? appSettings.coreHoursPerDay;
  return appSettings.coreHoursPerDay;
}
function fmtDaysHours(totalHours) {
  const per = appSettings.coreHoursPerDay;
  if (!totalHours) return '0h';
  const days = Math.floor(totalHours / per);
  const remH = Math.round((totalHours % per) * 10) / 10;
  if (days > 0 && remH > 0) return `${days}d ${remH}h`;
  if (days > 0) return `${days}d`;
  return `${remH}h`;
}
function fmtFIF(totalHours) {
  if (!totalHours) return '0t';
  const days = Math.floor(totalHours / 24);
  const hours = Math.round((totalHours % 24) * 10) / 10;
  if (days > 0 && hours > 0) return `${days} days ${hours}h`;
  if (days > 0) return `${days} days`;
  return `${hours}t`;
}
function deptPalettes() {
  const dark = appSettings.darkMode;
  return { bg: dark ? DEPT_BG_DARK : DEPT_BG_LIGHT, accent: dark ? DEPT_ACC_DARK : DEPT_ACC_LIGHT };
}
function resolveDeptColor(dept) {
  if (!dept) return null;
  if (appSettings.departmentColors && appSettings.departmentColors[dept]) {
    return normalizeHexColor(appSettings.departmentColors[dept]);
  }
  const departments = [...new Set(employees.map(employee => employee.department).filter(Boolean))]
    .sort((left, right) => left.localeCompare(right));
  const index = Math.max(0, departments.indexOf(dept));
  return PALETTE[index % PALETTE.length];
}
function subdepartmentColorKey(dept, subdept) { return `${dept}\u0000${subdept}`; }
function sectionColorKey(dept, section) { return `${dept}\u0000${section}`; }
function processColorKey(dept, section, process) { return `${dept}\u0000${section}\u0000${process}`; }
function subdepartmentOrderKey(dept, subdept) { return `${dept}\u0000${subdept}`; }
function hierarchyOrderKey(...parts) { return parts.map(value => String(value || '')).join('\u0000'); }
function hierarchyValue(employee, level) {
  if (level === 'department') return employee.department || 'Unassigned department';
  if (level === 'section') return employee.section || employee.subdepartment || 'Unassigned section';
  if (level === 'process') return employee.process || 'Unassigned process';
  return employee.team || 'Unassigned team';
}
function hierarchyParentPath(employee, level) {
  const organisation = employee.organisation || 'Unassigned organisation';
  const department = hierarchyValue(employee, 'department');
  const section = hierarchyValue(employee, 'section');
  const process = hierarchyValue(employee, 'process');
  if (level === 'department') return [organisation, department];
  if (level === 'section') return [organisation, department, section];
  if (level === 'process') return [organisation, department, section, process];
  return [organisation, department, section, process, hierarchyValue(employee, 'team')];
}
function hierarchyOrderFor(level, parentPath, value) {
  return Number(hierarchyOrder[level]?.[hierarchyOrderKey(...parentPath, value)]) || 9999;
}
function migrateHierarchyOrderTree() {
  hierarchyOrder = normalizeHierarchyOrderTree(hierarchyOrder);
  const levels = ['department', 'section', 'process', 'team'];
  for (const level of levels) {
    const groups = new Map();
    for (const employee of employees) {
      const parent = hierarchyParentPath(employee, level).slice(0, -1);
      const value = hierarchyValue(employee, level);
      const key = hierarchyOrderKey(...parent);
      if (!groups.has(key)) groups.set(key, { parent, values: new Set() });
      groups.get(key).values.add(value);
    }
    for (const { parent, values } of groups.values()) {
      const ordered = [...values].sort((a, b) => {
        if (level === 'department' && !hierarchyOrder[level][hierarchyOrderKey(...parent, a)]) return (departmentOrder[a] ?? 9999) - (departmentOrder[b] ?? 9999);
        if (level === 'section' && !hierarchyOrder[level][hierarchyOrderKey(...parent, a)]) return (subdepartmentOrder[subdepartmentOrderKey(parent[1], a)] ?? 9999) - (subdepartmentOrder[subdepartmentOrderKey(parent[1], b)] ?? 9999);
        if (level === 'process') return (Math.min(...employees.filter(e => hierarchyValue(e, level) === a).map(e => Number(e.processOrder) || Number(e.sortOrder) || 9999))) - (Math.min(...employees.filter(e => hierarchyValue(e, level) === b).map(e => Number(e.processOrder) || Number(e.sortOrder) || 9999)));
        return a.localeCompare(b, 'nb', { sensitivity: 'base' });
      });
      ordered.forEach((value, index) => {
        const key = hierarchyOrderKey(...parent, value);
        if (!hierarchyOrder[level][key]) hierarchyOrder[level][key] = (index + 1) * 10;
      });
    }
  }
}
function normalizeEmployeeSortOrder(value) {
  const order = Number(value);
  return Number.isInteger(order) && order > 0 && order <= 9999 ? order : undefined;
}
function nextAvailableEmployeeSortOrder(list = employees, excludeId = null) {
  const used = new Set(list
    .filter(employee => employee.id !== excludeId)
    .map(employee => normalizeEmployeeSortOrder(employee.sortOrder))
    .filter(Boolean));
  const maxOrder = Math.max(0, ...used);
  const nextTen = Math.ceil((maxOrder + 1) / 10) * 10;
  if (nextTen <= 9999 && !used.has(nextTen)) return nextTen;
  for (let order = 1; order <= 9999; order++) {
    if (!used.has(order)) return order;
  }
  return 9999;
}
function ensureEmployeeSortOrders(list = employees) {
  for (const employee of list) {
    const normalized = normalizeEmployeeSortOrder(employee.sortOrder);
    employee.sortOrder = normalized ?? nextAvailableEmployeeSortOrder(list, employee.id);
  }
}
function inferredDepartments() {
  const minimumEmployeeOrder = new Map();
  for (const employee of employees) {
    const department = employee.department || 'Unassigned';
    minimumEmployeeOrder.set(department, Math.min(
      minimumEmployeeOrder.get(department) ?? Infinity,
      normalizeEmployeeSortOrder(employee.sortOrder) ?? 9999,
    ));
  }
  return [...minimumEmployeeOrder.keys()].sort((left, right) =>
    ((minimumEmployeeOrder.get(left) ?? 9999) - (minimumEmployeeOrder.get(right) ?? 9999)) ||
    left.localeCompare(right, 'nb', { sensitivity: 'base' }));
}
function orderedDepartments() {
  return inferredDepartments().sort((left, right) =>
    (hierarchyOrderFor('department', ['Unassigned organisation'], left) - hierarchyOrderFor('department', ['Unassigned organisation'], right)) ||
    ((departmentOrder[left] ?? 9999) - (departmentOrder[right] ?? 9999)) ||
    left.localeCompare(right, 'nb', { sensitivity: 'base' }));
}
function ensureDepartmentOrders() {
  const departments = inferredDepartments();
  let nextOrder = Math.max(0, ...departments.map(department => departmentOrder[department] || 0));
  for (const department of departments) {
    if (!departmentOrder[department]) {
      nextOrder = Math.ceil((nextOrder + 1) / 10) * 10;
      departmentOrder[department] = Math.min(nextOrder, 9999);
    }
  }
}
function compareDepartments(left, right) {
  return (hierarchyOrderFor('department', ['Unassigned organisation'], left) - hierarchyOrderFor('department', ['Unassigned organisation'], right)) ||
    ((departmentOrder[left] ?? 9999) - (departmentOrder[right] ?? 9999)) ||
    left.localeCompare(right, 'nb', { sensitivity: 'base' });
}
function orderedSubdepartmentsFor(dept) {
  return [...new Set(employees
    .filter(employee => (employee.department || 'Unassigned') === dept && employee.subdepartment)
    .map(employee => employee.subdepartment))]
    .sort((left, right) =>
      ((subdepartmentOrder[subdepartmentOrderKey(dept, left)] ?? 9999) -
       (subdepartmentOrder[subdepartmentOrderKey(dept, right)] ?? 9999)) ||
      left.localeCompare(right, 'nb', { sensitivity: 'base' }));
}
function ensureSubdepartmentOrders() {
  const departments = [...new Set(employees.map(employee => employee.department || 'Unassigned'))];
  for (const department of departments) {
    const teams = [...new Set(employees
      .filter(employee => (employee.department || 'Unassigned') === department && employee.subdepartment)
      .map(employee => employee.subdepartment))]
      .sort((left, right) => left.localeCompare(right, 'nb', { sensitivity: 'base' }));
    let nextOrder = Math.max(0, ...teams.map(team => subdepartmentOrder[subdepartmentOrderKey(department, team)] || 0));
    for (const team of teams) {
      const key = subdepartmentOrderKey(department, team);
      if (!subdepartmentOrder[key]) {
        nextOrder = Math.ceil((nextOrder + 1) / 10) * 10;
        subdepartmentOrder[key] = Math.min(nextOrder, 9999);
      }
    }
  }
}
function compareSubdepartments(dept, left, right) {
  if (!left && right) return -1;
  if (left && !right) return 1;
  return (hierarchyOrderFor('section', ['Unassigned organisation', dept], left) - hierarchyOrderFor('section', ['Unassigned organisation', dept], right)) ||
    ((subdepartmentOrder[subdepartmentOrderKey(dept, left)] ?? 9999) -
    (subdepartmentOrder[subdepartmentOrderKey(dept, right)] ?? 9999)) ||
    left.localeCompare(right, 'nb', { sensitivity: 'base' });
}
function comparePersonnelGroupLeaves(dept, left, right) {
  const leftParts = String(left || '').split(' / ');
  const rightParts = String(right || '').split(' / ');
  const sectionOrder = hierarchyOrderFor('section', ['Unassigned organisation', dept], leftParts[0]);
  const rightSectionOrder = hierarchyOrderFor('section', ['Unassigned organisation', dept], rightParts[0]);
  return (sectionOrder - rightSectionOrder) ||
    leftParts.slice(1).join(' / ').localeCompare(rightParts.slice(1).join(' / '), 'nb', { sensitivity: 'base' }) ||
    String(left || '').localeCompare(String(right || ''), 'nb', { sensitivity: 'base' });
}
function compareScheduleGroups(left, right) {
  const leftEmp = left.emps?.[0] || {};
  const rightEmp = right.emps?.[0] || {};
  const organisationComparison = String(leftEmp.organisation || '').localeCompare(String(rightEmp.organisation || ''), 'nb', { sensitivity: 'base' });
  if (organisationComparison) return organisationComparison;
  const departmentComparison = hierarchyOrderFor('department', [leftEmp.organisation || 'Unassigned organisation'], leftEmp.department || 'Unassigned department') - hierarchyOrderFor('department', [rightEmp.organisation || 'Unassigned organisation'], rightEmp.department || 'Unassigned department');
  if (departmentComparison) return departmentComparison;
  const leftSection = leftEmp.section || leftEmp.subdepartment || '';
  const rightSection = rightEmp.section || rightEmp.subdepartment || '';
  const sectionComparison = hierarchyOrderFor('section', [leftEmp.organisation || 'Unassigned organisation', leftEmp.department || 'Unassigned department'], leftSection) - hierarchyOrderFor('section', [rightEmp.organisation || 'Unassigned organisation', rightEmp.department || 'Unassigned department'], rightSection);
  if (sectionComparison) return sectionComparison;
  const leftProcessOrder = hierarchyOrderFor('process', [leftEmp.organisation || 'Unassigned organisation', leftEmp.department || 'Unassigned department', leftSection], leftEmp.process || 'Unassigned process');
  const rightProcessOrder = hierarchyOrderFor('process', [rightEmp.organisation || 'Unassigned organisation', rightEmp.department || 'Unassigned department', rightSection], rightEmp.process || 'Unassigned process');
  const processComparison = leftProcessOrder - rightProcessOrder || String(leftEmp.process || '').localeCompare(String(rightEmp.process || ''), 'nb', { sensitivity: 'base' });
  if (processComparison) return processComparison;
  const leftPersonnelOrder = Math.min(...(left.emps || []).map(employee => Number(employee.sortOrder) || 9999));
  const rightPersonnelOrder = Math.min(...(right.emps || []).map(employee => Number(employee.sortOrder) || 9999));
  const leftTeamOrder = hierarchyOrderFor('team', [leftEmp.organisation || 'Unassigned organisation', leftEmp.department || 'Unassigned department', leftSection, leftEmp.process || 'Unassigned process'], leftEmp.team || 'Unassigned team');
  const rightTeamOrder = hierarchyOrderFor('team', [rightEmp.organisation || 'Unassigned organisation', rightEmp.department || 'Unassigned department', rightSection, rightEmp.process || 'Unassigned process'], rightEmp.team || 'Unassigned team');
  return leftTeamOrder - rightTeamOrder || leftPersonnelOrder - rightPersonnelOrder || String(leftEmp.team || '').localeCompare(String(rightEmp.team || ''), 'nb', { sensitivity: 'base' });
}
function resolveSubdepartmentColor(dept, subdept) {
  const key = subdepartmentColorKey(dept, subdept);
  return appSettings.subdepartmentColors?.[key]
    ? normalizeHexColor(appSettings.subdepartmentColors[key])
    : null;
}
function resolveSectionColor(dept, section) {
  if (!section) return null;
  const key = sectionColorKey(dept, section);
  return appSettings.sectionColors?.[key] ? normalizeHexColor(appSettings.sectionColors[key]) : null;
}
async function setSectionColor(dept, section, color) {
  if (!section) return;
  await mutateState('setSectionColor', () => {
    appSettings.sectionColors = appSettings.sectionColors || {};
    appSettings.sectionColors[sectionColorKey(dept, section)] = normalizeHexColor(color);
    persistSettings();
  }, { saveDisk: true });
  renderPage();
}
function resolveProcessColor(dept, section, process) {
  if (!process) return null;
  const key = processColorKey(dept, section, process);
  return appSettings.processColors?.[key] ? normalizeHexColor(appSettings.processColors[key]) : null;
}
async function setProcessColor(dept, section, process, color) {
  if (!process) return;
  const safe = normalizeHexColor(color);
  await mutateState('setProcessColor', () => {
    appSettings.processColors = appSettings.processColors || {};
    appSettings.processColors[processColorKey(dept, section, process)] = safe;
    persistSettings();
  }, { saveDisk: true });
  renderPage();
}
function deptColorMap() {
  const { bg, accent } = deptPalettes();
  const map = {};
  [...new Set(employees.map(e => e.department))].filter(Boolean).sort().forEach((dept, i) => {
    const custom = resolveDeptColor(dept);
    const index = i % bg.length;
    map[dept] = custom
      ? { bg: `${custom}22`, accent: custom }
      : { bg: bg[index], accent: accent[index] };
  });
  return map;
}
// Colors for a department/subdepartment row group. If a subteam has its own
// color selected, it is used for both the background tint and accent border;
// otherwise the group falls back to the parent department's colors.
function groupColorsFor(dept, subdept, deptColors) {
  const teamColor = resolveSubdepartmentColor(dept, subdept);
  if (!teamColor) return deptColors;
  return { bg: `${teamColor}22`, accent: teamColor };
}
function employeeGroupColor(employee, deptColors) {
  const dept = employee.department || 'Unassigned';
  const section = employee.section || employee.subdepartment || '';
  const process = resolveProcessColor(dept, section, employee.process);
  const sectionColor = resolveSubdepartmentColor(dept, section);
  const color = process || sectionColor;
  return color ? { bg: `${color}22`, accent: color } : deptColors;
}
function sectionGroupColor(group, deptColors) {
  const employee = group.emps?.[0];
  const section = employee?.section || employee?.subdepartment || '';
  const sectionColor = resolveSectionColor(group.dept, section) || resolveDeptColor(group.dept);
  return sectionColor ? { bg: `${sectionColor}22`, accent: sectionColor } : deptColors;
}
function employeeHierarchyPath(employee, options = {}) {
  const includeDepartment = options.includeDepartment !== false;
  return [
    employee?.organisation,
    includeDepartment ? employee?.department : '',
    employee?.section || employee?.subdepartment,
    employee?.process,
    employee?.team,
  ].filter(Boolean).join(' / ');
}
function employeeProcessPath(employee) {
  return [employee?.organisation, employee?.department, employee?.section || employee?.subdepartment, employee?.process].filter(Boolean).join('\u0000');
}
function employeeNameForDisplay(employee, maxLength = 30) {
  const name = String(employee?.name || '').trim();
  const characters = Array.from(name);
  if (characters.length <= maxLength) return name;
  return `${characters.slice(0, Math.max(1, maxLength - 1)).join('')}…`;
}
function displayEmployeeName(employee) {
  const rank = appSettings.showLevelRankInSchedule !== false ? String(employee?.level || '').trim() : '';
  return [rank, employeeNameForDisplay(employee)].filter(Boolean).join(' ');
}
function displayEmployeeNameMarkup(employee) {
  const fullName = String(employee?.name || '').trim();
  const name = esc(employeeNameForDisplay(employee));
  const rank = appSettings.showLevelRankInSchedule !== false ? String(employee?.level || '').trim() : '';
  const content = rank ? `<strong class="employee-rank">${esc(rank)}</strong> ${name}` : name;
  return `<span title="${esc(fullName)}">${content}</span>`;
}
function employeeHierarchyLeaf(employee) {
  return [employee?.section, employee?.process, employee?.team].filter(Boolean).join(' / ');
}
function comparePersonnelHierarchy(left, right) {
  const organisationComparison = String(left?.organisation || '').localeCompare(String(right?.organisation || ''), 'nb', { sensitivity: 'base' });
  if (organisationComparison) return organisationComparison;
  const leftDepartment = left?.department || 'Unassigned department';
  const rightDepartment = right?.department || 'Unassigned department';
  const departmentComparison = hierarchyOrderFor('department', [left?.organisation || 'Unassigned organisation'], leftDepartment) - hierarchyOrderFor('department', [right?.organisation || 'Unassigned organisation'], rightDepartment);
  if (departmentComparison) return departmentComparison;
  const leftSection = left?.section || left?.subdepartment || 'Unassigned section';
  const rightSection = right?.section || right?.subdepartment || 'Unassigned section';
  const sectionComparison = hierarchyOrderFor('section', [left?.organisation || 'Unassigned organisation', leftDepartment], leftSection) - hierarchyOrderFor('section', [right?.organisation || 'Unassigned organisation', rightDepartment], rightSection);
  if (sectionComparison) return sectionComparison;
  const processComparison = hierarchyOrderFor('process', [left?.organisation || 'Unassigned organisation', leftDepartment, leftSection], left?.process || 'Unassigned process') - hierarchyOrderFor('process', [right?.organisation || 'Unassigned organisation', rightDepartment, rightSection], right?.process || 'Unassigned process');
  if (processComparison) return processComparison;
  const teamComparison = hierarchyOrderFor('team', [left?.organisation || 'Unassigned organisation', leftDepartment, leftSection, left?.process || 'Unassigned process'], left?.team || 'Unassigned team') - hierarchyOrderFor('team', [right?.organisation || 'Unassigned organisation', rightDepartment, rightSection, right?.process || 'Unassigned process'], right?.team || 'Unassigned team');
  if (teamComparison) return teamComparison;
  return ((left?.sortOrder ?? 9999) - (right?.sortOrder ?? 9999)) ||
    String(left?.name || '').localeCompare(String(right?.name || ''), 'nb', { sensitivity: 'base' });
}
function sortedEmployees() {
  return [...employees].filter(employee => !scheduleSectionFilter || employeeSection(employee) === scheduleSectionFilter).sort(comparePersonnelHierarchy);
}
function deptGroups() {
  const byDept = new Map();
  for (const emp of employees) {
    if (hiddenEmployees.has(emp.id) || (scheduleSectionFilter && employeeSection(emp) !== scheduleSectionFilter)) continue;
    const department = emp.department || 'Unassigned';
    const subdepartment = employeeHierarchyLeaf(emp);
    const key = `${department}\u0000${subdepartment}`;
    if (!byDept.has(key)) byDept.set(key, { department, subdepartment, emps: [] });
    byDept.get(key).emps.push(emp);
  }
  return [...byDept.values()]
    .map(group => ({ ...group, groupOrder: Math.min(...group.emps.map(employee => Number(employee.sortOrder) || 9999)) }))
    .sort((left, right) =>
      compareDepartments(left.department, right.department) ||
      comparePersonnelGroupLeaves(left.department, left.subdepartment, right.subdepartment) ||
      (left.groupOrder - right.groupOrder))
    .map(group => ({
      dept: group.department,
      subdept: group.subdepartment,
      emps: group.emps.sort((left, right) =>
        ((left.sortOrder ?? 9999) - (right.sortOrder ?? 9999)) ||
        left.name.localeCompare(right.name)),
    }));
}
function normalizeDepartmentName(value) {
  return String(value || '').trim().toLowerCase();
}
async function toggleEmployeeVisibility(empId, forceState) {
  await mutateState('toggleEmployeeVisibility', () => {
    const targetSet = hiddenEmployeesDraft || hiddenEmployees;
    if (typeof forceState === 'boolean') {
      if (forceState) targetSet.delete(empId); else targetSet.add(empId);
    } else if (targetSet.has(empId)) {
      targetSet.delete(empId);
    } else {
      targetSet.add(empId);
    }
  });
  if (hiddenEmployeesDraft) { rebuildEmployeePicker(); return; }
  saveGridPreferences();
  renderPage();
}
function toggleEmployeeDepartment(deptName, forceState) {
  const targetSet = hiddenEmployeesDraft || hiddenEmployees;
  const normalizedDept = normalizeDepartmentName(deptName);
  const deptEmployees = employees
    .filter(emp => normalizeDepartmentName(emp.department) === normalizedDept)
    .map(emp => emp.id);
  if (!deptEmployees.length) return;
  if (typeof forceState === 'boolean') {
    deptEmployees.forEach(id => forceState ? targetSet.delete(id) : targetSet.add(id));
  } else {
    const deptVisible = deptEmployees.some(id => !targetSet.has(id));
    deptEmployees.forEach(id => {
      if (deptVisible) targetSet.add(id);
      else targetSet.delete(id);
    });
  }
  if (hiddenEmployeesDraft) { setTimeout(rebuildEmployeePicker, 0); return; }
  saveGridPreferences();
  renderPage();
}
function setEmployeeDepartmentVisibility(deptName, shouldShow) {
  toggleEmployeeDepartment(deptName, shouldShow === true);
}
function toggleEmployeeSubdepartment(subdeptKey, shouldShow) {
  const [deptName, subdeptName] = String(subdeptKey).split('\u0000');
  const targetSet = hiddenEmployeesDraft || hiddenEmployees;
  employees.filter(emp => normalizeDepartmentName(emp.department) === normalizeDepartmentName(deptName) && (emp.section || emp.subdepartment || '') === subdeptName)
    .forEach(emp => shouldShow ? targetSet.delete(emp.id) : targetSet.add(emp.id));
  if (hiddenEmployeesDraft) rebuildEmployeePicker(); else { saveGridPreferences(); renderPage(); }
}
function rebuildEmployeePicker() {
  const picker = document.getElementById('employee-picker');
  if (!picker) return;
  const hiddenSet = hiddenEmployeesDraft || hiddenEmployees;
  const departmentMap = new Map();
  employees.forEach(emp => {
    const key = normalizeDepartmentName(emp.department);
    if (!key) return;
    if (!departmentMap.has(key)) departmentMap.set(key, String(emp.department || '').trim());
  });
  const departments = [...departmentMap.entries()].sort((a, b) => compareDepartments(a[1], b[1]));
  const deptMarkup = departments.length ? departments.map(([deptKey, deptLabel]) => {
    const deptEmployees = employees.filter(emp => normalizeDepartmentName(emp.department) === deptKey);
    const visible = deptEmployees.filter(emp => !hiddenSet.has(emp.id)).length;
    const allChecked = deptEmployees.length && visible === deptEmployees.length;
    const someChecked = visible > 0 && visible < deptEmployees.length;
    const subgroups = [...new Set(deptEmployees.map(emp => emp.section || emp.subdepartment || ''))].sort((a, b) => compareSubdepartments(deptLabel, a, b));
    const employeeMarkup = subgroups.map(subdept => {
      const sectionEmployees = deptEmployees.filter(emp => (emp.section || emp.subdepartment || '') === subdept);
      const sectionKey = `${deptLabel}\u0000${subdept}`;
      const sectionVisible = sectionEmployees.filter(emp => !hiddenSet.has(emp.id)).length;
      const processMap = new Map();
      sectionEmployees.forEach(emp => {
        const process = emp.process || '';
        if (!processMap.has(process)) processMap.set(process, []);
        processMap.get(process).push(emp);
      });
      const processMarkup = [...processMap.entries()].sort((a, b) => {
        const left = a[1][0], right = b[1][0];
        return hierarchyOrderFor('process', [left.organisation || 'Unassigned organisation', left.department || 'Unassigned department', left.section || left.subdepartment || 'Unassigned section'], a[0] || 'Unassigned process') - hierarchyOrderFor('process', [right.organisation || 'Unassigned organisation', right.department || 'Unassigned department', right.section || right.subdepartment || 'Unassigned section'], b[0] || 'Unassigned process') || String(a[0]).localeCompare(String(b[0]), 'nb', { sensitivity: 'base' });
      }).map(([process, processEmployees]) => {
        const sortedProcessEmployees = processEmployees.slice().sort(comparePersonnelHierarchy);
        const teamMap = new Map();
        sortedProcessEmployees.forEach(emp => { const team = emp.team || ''; if (!teamMap.has(team)) teamMap.set(team, []); teamMap.get(team).push(emp); });
        const teamMarkup = [...teamMap.entries()].sort((a, b) => String(a[0]).localeCompare(String(b[0]), 'nb', { sensitivity: 'base' })).map(([team, teamEmployees]) => `${team ? `<div class="employee-picker-team-label">${esc(team)}</div>` : ''}${teamEmployees.sort(comparePersonnelHierarchy).map(emp => `
      <label class="picker-row" style="display:flex;align-items:center;gap:8px;padding:5px 0">
        <input type="checkbox" ${hiddenSet.has(emp.id) ? '' : 'checked'} onchange="toggleEmployeeVisibility(${emp.id}, this.checked); return false;">
        <span>${esc(emp.name)}</span>
      </label>`).join('')}`).join('');
        return `<div class="employee-picker-process">${process ? `<div class="employee-picker-process-label">${esc(process)}</div>` : ''}${teamMarkup}</div>`;
      }).join('');
      return `${subdept ? `<div style="margin:4px 0 2px 18px;font-weight:600;color:var(--muted)"><label style="display:flex;align-items:center;gap:8px"><input type="checkbox" ${sectionVisible === sectionEmployees.length ? 'checked' : ''} onchange="toggleEmployeeSubdepartment(${esc(JSON.stringify(sectionKey))}, this.checked); return false;"><span>${esc(subdept)}</span></label></div>` : ''}${processMarkup}`;
    }).join('');
    return `
      <div style="border:1px solid var(--border);border-radius:8px;padding:8px;background:var(--surface)">
        <label class="picker-row" style="display:flex;align-items:center;gap:8px;padding:0 0 6px;font-weight:600;color:var(--text)">
          <input type="checkbox" ${allChecked ? 'checked' : ''} ${someChecked ? 'data-indeterminate="true"' : ''} onchange="setEmployeeDepartmentVisibility(${esc(JSON.stringify(deptKey))}, this.checked); return false;">
          <span>${esc(deptLabel)}</span>
        </label>
        <div style="display:flex;flex-direction:column;gap:2px;margin-left:18px">${employeeMarkup}</div>
      </div>`;
  }).join('') : '<div class="muted text-sm">No departments available.</div>';
  picker.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px">
      <strong style="font-size:12px;text-transform:uppercase;letter-spacing:.04em;color:var(--muted)">Select employees</strong>
      <button class="icon-btn" type="button" onclick="closeEmployeePicker()" aria-label="Close">&times;</button>
    </div>
    <div style="display:flex;flex-direction:column;gap:8px;max-height:min(68vh,620px);overflow:auto">${deptMarkup}</div>
    <div style="display:flex;justify-content:flex-end;flex-wrap:wrap;gap:6px;margin-top:12px">
      <button class="btn btn-sm" type="button" onclick="resetEmployeePickerSelection()">All</button>
      <button class="btn btn-sm" type="button" onclick="selectNoneEmployeePickerSelection()">None</button>
      <button class="btn btn-sm" type="button" onclick="closeEmployeePicker()">Cancel</button>
      <button class="btn btn-sm btn-primary" type="button" onclick="applyEmployeePickerSelection()">Apply</button>
    </div>`;
  picker.querySelectorAll('input[data-indeterminate="true"]').forEach(input => { input.indeterminate = true; });
}
function resetEmployeePickerSelection() {
  if (!hiddenEmployeesDraft) hiddenEmployeesDraft = new Set(hiddenEmployees);
  hiddenEmployeesDraft.clear();
  rebuildEmployeePicker();
}
function selectNoneEmployeePickerSelection() {
  hiddenEmployeesDraft = new Set(employees.map(emp => emp.id));
  rebuildEmployeePicker();
}
function applyEmployeePickerSelection() {
  if (hiddenEmployeesDraft) {
    hiddenEmployees = new Set(hiddenEmployeesDraft);
    hiddenEmployeesDraft = null;
    saveGridPreferences();
  }
  closeEmployeePicker();
  renderPage();
}
function openEmployeePicker(button) {
  const picker = document.getElementById('employee-picker');
  const scroll = document.getElementById('grid-scroll');
  if (!picker) return;
  if (!scroll) return;
  hiddenEmployeesDraft = new Set(hiddenEmployees);
  rebuildEmployeePicker();
  picker.style.display = 'block';
  const rect = button.getBoundingClientRect();
  const scrollRect = scroll.getBoundingClientRect();
  const gap = 8;
  picker.style.position = 'absolute';
  const desiredLeft = scroll.scrollLeft + (rect.left - scrollRect.left) + rect.width + gap;
  const maxLeft = scroll.scrollLeft + Math.max(0, scroll.clientWidth - 290);
  const pickerHeight = Math.min(620, Math.max(320, window.innerHeight * 0.68));
  const triggerTop = scroll.scrollTop + (rect.top - scrollRect.top);
  const spaceBelow = scroll.clientHeight - (rect.top - scrollRect.top) - rect.height;
  const spaceAbove = rect.top - scrollRect.top;
  const desiredTop = spaceBelow >= Math.min(pickerHeight, scroll.clientHeight * 0.72)
    ? triggerTop + rect.height + gap
    : Math.max(scroll.scrollTop + 8, triggerTop - pickerHeight - gap);
  picker.style.left = `${Math.min(maxLeft, Math.max(scroll.scrollLeft + 8, desiredLeft))}px`;
  picker.style.top = `${Math.max(scroll.scrollTop + 8, desiredTop)}px`;
  picker.style.zIndex = '120';
  picker.style.width = 'min(520px, calc(100vw - 24px))';
  picker.style.maxWidth = 'calc(100vw - 24px)';
  picker.style.maxHeight = 'min(68vh, 620px)';
  picker.style.background = 'var(--surface)';
  picker.style.border = '1px solid var(--border)';
  picker.style.borderRadius = '10px';
  picker.style.padding = '10px';
  picker.style.boxShadow = '0 12px 32px rgba(0,0,0,.15)';
}
function closeEmployeePicker() {
  const picker = document.getElementById('employee-picker');
  if (picker) picker.style.display = 'none';
  hiddenEmployeesDraft = null;
}

// ═══ NAVIGATION ══════════════════════════════════════════════════════════════
function setStartupFileSelectionRequired(required) {
  startupFileSelectionRequired = required === true;
  if (startupFileSelectionRequired) {
    document.querySelectorAll('#save-btn, #sync-btn, #auto-sync-btn, #undo-btn, #redo-btn').forEach(button => {
      if (button) button.disabled = true;
    });
  } else {
    updateSaveButton();
    updateAutoSyncButton();
    updateUndoButton();
    document.querySelectorAll('.nav-btn').forEach(button => { if (button) button.disabled = false; });
  }
  if (startupFileSelectionRequired) {
    const content = document.getElementById('content');
    if (content) {
      content.style.cssText = 'flex:1;overflow:auto;padding:24px;display:flex;align-items:center;justify-content:center';
      content.innerHTML = `
        <div class="card" style="width:min(520px,100%);padding:20px">
          <div style="width:min(460px,100%);margin:0 auto 18px;padding:10px;background:#000;border-radius:14px;box-shadow:0 8px 24px rgba(0,0,0,.24)">
            <img src="assets/atlas-logo.jpg" alt="ATLAS — Adaptive Timeline, Load and Allocation System" style="display:block;width:100%;height:auto;object-fit:contain;border-radius:6px">
          </div>
          <h3 style="margin-bottom:8px;text-align:center">Choose your data file</h3>
          <p class="muted" style="line-height:1.5;text-align:center">Open an existing planner JSON or create a blank planner to get started.</p>
          <div style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn btn-primary" type="button" onclick="beginStartupFileSelection()">Choose JSON file</button>
            ${startupRecoveredDataAvailable ? '<button class="btn" type="button" onclick="continueWithRecoveredData()">Use recovered data</button>' : ''}
            <button class="btn" type="button" onclick="createBlankPlanner()" style="margin-left:8px">Create blank planner</button>
          </div>
        </div>`;
    }
  }
}
function completeStartupFileSelection() {
  setStartupFileSelectionRequired(false);
  nav(currentPage || 'grid');
  setSyncStatusState('updated');
}
function beginStartupFileSelection() {
  importData({ required: true });
}
function continueWithRecoveredData() {
  startupRecoveredDataAvailable = false;
  completeStartupFileSelection();
  showToast('Using recovered browser data. Save it to a new JSON file before editing.', 7000);
}
async function createBlankPlanner() {
  try {
    const fileName = await saveLocalBackupFile(true);
    if (!fileName) return;
    markFileSaved();
    completeStartupFileSelection();
    showToast(`Created blank planner: ${fileName}.`, 5000);
  } catch (err) {
    if (err?.name !== 'AbortError') alert(`Could not create planner: ${err?.message || 'Unknown error occurred.'}`);
  }
}
// Adds a couple of sample employees/activities for local testing; not part of the release data model.
async function loadExampleTestData() {
  const addDays = n => { const d = new Date(); d.setDate(d.getDate() + n); return fmt(d); };
  await mutateState('loadExampleTestData', () => {
  const empA = { id: nextEmpId++, name: 'Alex Morgan', email: '', role: 'Planner', department: 'Operations', level: '', birthday: '', homeAddress: '', phoneWork: '', phonePrivate: '', categoryIds: [] };
  const empB = { id: nextEmpId++, name: 'Jamie Lee', email: '', role: 'Team Lead', department: 'Operations', level: '', birthday: '', homeAddress: '', phoneWork: '', phonePrivate: '', categoryIds: [] };
  const empC = { id: nextEmpId++, name: 'Taylor Smith', email: '', role: 'Specialist', department: 'Support', level: '', birthday: '', homeAddress: '', phoneWork: '', phonePrivate: '', categoryIds: [] };
  employees.push(empA, empB, empC);
  ensureEmployeeSortOrders(employees);
  ensureDepartmentOrders();
  ensureSubdepartmentOrders();
  employees.sort((a, b) => a.name.localeCompare(b.name));

  const makeActivity = (name, abbr, startOffset, endOffset, color, status, participantIds) => {
    const act = {
      id: nextActId++, name, abbreviation: abbr, project: '', order: '', billing: '', type: '', status,
      countsTowardLoad: true, dayShift: '0730-2400', nightShift: '0000-0730', includeWeekends: false,
      color, startDate: addDays(startOffset), endDate: addDays(endOffset),
      participants: participantIds.map(id => ({ id })), notes: '',
    };
    activities.push(act);
    for (const id of participantIds) {
      for (const day = new Date(`${act.startDate}T00:00:00`); fmt(day) <= act.endDate; day.setDate(day.getDate() + 1)) {
        activityShiftsMap[`${id}_${fmt(day)}_${act.id}`] = { shift: 'normal', workCodeId: null, administrativeTime: '', staffingImpactOverride: null, assigned: true, excluded: false };
      }
    }
    return act;
  };
  makeActivity('Initial Planning Workshop', 'PLAN', -10, -8, '#64748b', 'confirmed', [empA.id, empB.id]);
  makeActivity('Current Operations Brief', 'OPS', -1, 2, '#3b82f6', 'confirmed', [empA.id, empC.id]);
  makeActivity('Future Coordination Exercise', 'COORD', 14, 16, '#22c55e', 'tentative', [empB.id, empC.id]);
  activities.sort((a, b) => a.startDate.localeCompare(b.startDate));
  });
  closeModal('settings-modal');
  renderPage();
  showToast('Example test data added (3 employees, 3 activities).', 5000);
}
function nav(page) {
  if (page === 'shift-rotation' && appSettings.shiftRotationEnabled !== true) page = 'grid';
  if (page === 'workwheel' && appSettings.workwheelEnabled !== true) page = 'grid';
  if (page === 'bug-report' && appSettings.bugReportEnabled !== true) page = 'grid';
  if (page === 'inbox' && (!hostedMode || hostedUser?.role !== 'admin')) page = 'grid';
  if (page === 'shift-rotation' && currentPage !== 'shift-rotation') shiftRotationInitialScrollPending = true;
  currentPage = page;
  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.page === page));
  closePicker();
  renderPage();
}
function updateShiftRotationNavigation() {
  document.querySelectorAll('.shift-rotation-nav').forEach(btn => {
    btn.style.display = appSettings.shiftRotationEnabled === true ? '' : 'none';
    btn.classList.toggle('active', currentPage === 'shift-rotation');
  });
}
function updateWorkwheelNavigation() {
  document.querySelectorAll('.workwheel-nav').forEach(btn => {
    btn.style.display = appSettings.workwheelEnabled === true ? '' : 'none';
    btn.classList.toggle('active', currentPage === 'workwheel');
  });
}
function updateBugReportNavigation() {
  document.querySelectorAll('.bug-report-nav').forEach(btn => {
    btn.style.display = appSettings.bugReportEnabled === true ? '' : 'none';
    btn.classList.toggle('active', currentPage === 'bug-report');
  });
}
function renderPage() {
  renderSbToday();
  updateShiftRotationNavigation();
  updateWorkwheelNavigation();
  updateBugReportNavigation();
  const content = document.getElementById('content');
  if (currentPage === 'grid' || currentPage === 'shift-rotation') {
    content.style.cssText = 'padding:0;overflow:hidden;display:flex;flex-direction:column;height:100%';
    if (currentPage === 'grid') renderGrid();
  }
  else { content.style.cssText = 'flex:1;overflow:auto;padding:24px'; }
  if (currentPage === 'dashboard') renderDashboard();
  else if (currentPage === 'employees') renderEmployees();
  else if (currentPage === 'summary') renderSummary();
  else if (currentPage === 'my-upcoming') renderMyUpcoming();
  else if (currentPage === 'inbox') renderAbsenceInbox();
  else if (currentPage === 'shift-rotation') renderShiftRotation();
  else if (currentPage === 'workwheel') renderWorkwheel();
  else if (currentPage === 'status-board') renderStatusBoard();
  else if (currentPage === 'bug-report') renderBugReport();
}
async function renderMyUpcoming() {
  const content = document.getElementById('content');
  content.innerHTML = '<div class="personal-view"><div class="personal-loading">Loading your upcoming schedule…</div></div>';
  try {
    const lookaheadDays = Math.max(1, Math.min(365, Number(appSettings.myScheduleLookaheadDays) || 31));
    const response = await fetch(`/api/me/upcoming?days=${lookaheadDays}`, { cache: 'no-store' });
    if (!response.ok) throw new Error('Could not load your upcoming schedule.');
    personalUpcomingData = await response.json();
    if (!personalUpcomingData.linked) {
      content.innerHTML = '<div class="personal-view"><div class="personal-empty"><h2>Personal view unavailable</h2><p>Your account is not linked to a personnel record. Ask an administrator to link your account.</p></div></div>';
      return;
    }
    const dateFormatter = new Intl.DateTimeFormat(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
    const eventDays = personalUpcomingData.days.filter(day => day.status || day.activities?.length || day.workwheelMeetings?.length);
    content.innerHTML = `<div class="personal-view"><div class="personal-header"><div><div class="eyebrow">YOUR NEXT ${lookaheadDays} DAYS</div><h1>${esc(personalUpcomingData.employee.name)}</h1><p>${esc([personalUpcomingData.employee.role, personalUpcomingData.employee.department, personalUpcomingData.employee.section].filter(Boolean).join(' · '))}</p></div><div style="display:flex;gap:8px;align-items:center">${hostedUser?.role !== 'viewer' ? '<button class="btn btn-primary" onclick="openAbsenceRequestPrompt()">Request absence</button>' : ''}<div class="personal-range">${esc(personalUpcomingData.startDate)} — ${esc(personalUpcomingData.endDate)}</div></div></div><div class="personal-days">${eventDays.length ? eventDays.map(day => `<section class="personal-day"><div class="personal-day-heading"><h2>${esc(dateFormatter.format(new Date(`${day.date}T12:00:00`)))}</h2><span>${esc(day.date)}</span></div><div class="personal-items">${renderPersonalDayItems(day)}</div></section>`).join('') : '<div class="personal-empty"><h2>No upcoming status entries</h2><p>You have no status codes recorded during the selected lookahead.</p></div>'}</div></div>`;
  } catch (error) { content.innerHTML = `<div class="personal-view"><div class="personal-empty"><h2>Unable to load your schedule</h2><p>${esc(error.message || 'Please try again.')}</p></div></div>`; }
}
async function openAbsenceRequestPrompt() {
  if (hostedMode && hostedUser?.role === 'viewer') { showToast('Read-only users cannot submit absence requests.', 3500); return; }
  const absenceStatuses = statuses.filter(status => status.isAbsence);
  if (!absenceStatuses.length) { alert('No absence codes are configured.'); return; }
  const modal = document.createElement('div');
  modal.className = 'modal-bg open';
  modal.innerHTML = `<div class="modal" style="width:420px"><h3>Request absence</h3><p class="modal-desc">Submit an absence report or request it for approval.</p><div class="form-row"><label>Absence code<select id="absence-request-status" class="plain-select">${absenceStatuses.map(status => `<option value="${esc(status.key)}">${esc(status.label)}${status.requiresApproval ? ' · Approval required' : ''}</option>`).join('')}</select></label></div><div class="form-row-2"><div class="form-row" style="margin:0"><label>Start date<input id="absence-request-start" type="date" value="${todayStr()}"></label></div><div class="form-row" style="margin:0"><label>End date<input id="absence-request-end" type="date" value="${todayStr()}"></label></div></div><div class="modal-actions"><button class="btn" type="button" id="absence-request-cancel">Cancel</button><button class="btn btn-primary" type="button" id="absence-request-submit">Submit request</button></div></div>`;
  document.body.appendChild(modal);
  const close = () => modal.remove();
  modal.querySelector('#absence-request-cancel').onclick = close;
  await new Promise(resolve => { modal.querySelector('#absence-request-submit').onclick = async () => { const start = modal.querySelector('#absence-request-start').value; const end = modal.querySelector('#absence-request-end').value; if (!modal.querySelector('#absence-request-status').value || !start || !end || end < start) { alert('Choose a valid absence code and date range.'); return; } resolve(); }; });
  const statusKey = modal.querySelector('#absence-request-status').value;
  const startDate = modal.querySelector('#absence-request-start').value;
  const endDate = modal.querySelector('#absence-request-end').value;
  close();
  const response = await fetch('/api/me/absence-requests', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ statusKey, startDate, endDate, durationType: 'fullday' }) });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) { alert(result.error || 'Could not submit absence request.'); return; }
  showToast(result.request.requestStatus === 'pending' ? 'Absence request submitted for approval.' : 'Absence reported.', 4000);
}
async function renderAbsenceInbox() {
  const content = document.getElementById('content');
  content.innerHTML = '<div class="page-title">Inbox</div><div class="page-sub">Pending absence requests in your responsibility area.</div><div id="absence-inbox-list" class="card" style="margin-top:18px">Loading…</div>';
  const response = await fetch('/api/admin/absence-requests', { cache: 'no-store' });
  const result = await response.json().catch(() => ({}));
  const requests = result.requests || [];
  const list = document.getElementById('absence-inbox-list');
  list.innerHTML = requests.length ? requests.map(request => { const employee = empById(request.employeeId); const status = siFor(request.statusKey); return `<div class="absence-row"><div><strong>${esc(employee?.name || `Employee ${request.employeeId}`)}</strong><div class="muted text-sm">${esc(status?.label || request.statusKey)} · ${esc(request.startDate)} — ${esc(request.endDate)}</div></div><div style="display:flex;gap:6px"><button class="btn btn-sm" onclick="decideAbsenceRequest('${request.id}','declined')">Decline</button><button class="btn btn-sm btn-primary" onclick="decideAbsenceRequest('${request.id}','approved')">Approve</button></div></div>`; }).join('') : '<div class="empty-note">No pending absence requests.</div>';
}
async function decideAbsenceRequest(id, decision) {
  const response = await fetch(`/api/admin/absence-requests/${encodeURIComponent(id)}/decision`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ decision }) });
  if (!response.ok) { const result = await response.json().catch(() => ({})); alert(result.error || 'Could not decide request.'); return; }
  await renderAbsenceInbox();
}
function renderPersonalDayItems(day) {
  const items = [];
  if (day.status) items.push(`<article class="personal-item personal-status"><span class="personal-dot" style="background:${esc(day.status.color)}"></span><div><strong>${esc(day.status.label)}</strong><small>${day.status.isAbsence ? 'Absence' : day.status.isOutOfOffice ? 'Out of office' : 'Daily status'} · ${esc(day.status.lifecycle || 'confirmed')}</small></div>${day.status.time ? `<b>${esc(day.status.time)}</b>` : ''}</article>`);
  for (const activity of day.activities || []) items.push(`<article class="personal-item personal-activity ${activity.status === 'cancelled' ? 'is-cancelled' : ''}"><span class="personal-dot" style="background:${esc(activity.color)}"></span><div><strong>${esc(activity.name)}${activity.status === 'cancelled' ? ' · Cancelled' : ''}</strong><small>${esc(activity.abbreviation || '')}${activity.assignment?.shift ? ` · ${esc(activity.assignment.shift)}` : ''}${activity.assignment?.workCode?.abbreviation ? ` · ${esc(activity.assignment.workCode.abbreviation)}` : ''}</small></div></article>`);
  for (const meeting of day.workwheelMeetings || []) items.push(`<article class="personal-item personal-workwheel ${meeting.status === 'cancelled' ? 'is-cancelled' : ''}"><span class="personal-dot" style="background:${esc(meeting.color)}"></span><div><strong>${esc(meeting.title)}${meeting.status === 'cancelled' ? ' · Cancelled' : ''}</strong><small>Workwheel · ${esc(meeting.wheelName)} · ${esc(meeting.status)}</small></div>${meeting.time ? `<b>${esc(meeting.time)}</b>` : '<b>All day</b>'}</article>`);
  return items.join('') || '<div class="personal-no-items">No activities or status entries.</div>';
}
function renderBugReport() {
  const content = document.getElementById('content');
  const bugs = normalizeBugTracker(appSettings.bugTracker).sort((a, b) => b.date.localeCompare(a.date));
  const rows = bugs.length ? bugs.map(bug => '<tr><td>' + esc(bug.date) + '</td><td>' + esc(bug.poc) + '</td><td style="white-space:pre-wrap;min-width:360px">' + esc(bug.description) + '</td><td style="white-space:nowrap"><button class="btn btn-sm" onclick="editBugTrackerEntry(\'' + esc(bug.id) + '\')">Edit</button><button class="btn btn-sm btn-danger" style="margin-left:5px" onclick="deleteBugTrackerEntry(\'' + esc(bug.id) + '\')">Delete</button></td></tr>').join('') : '<tr><td colspan="4" class="empty-note">No bug reports recorded.</td></tr>';
  content.innerHTML = `<div class="page-title">Bug Tracker</div><div class="page-sub">Record software issues for follow-up.</div><div class="card" style="max-width:1000px;margin-top:20px"><div class="form-row-2"><div class="form-row" style="margin:0"><label>Date *</label><input id="bug-report-date" type="date" value="${todayStr()}"></div><div class="form-row" style="margin:0"><label>POC *</label><input id="bug-report-poc" placeholder="Person responsible"></div></div><div class="form-row"><label>Bug description *</label><textarea id="bug-report-description" rows="5" placeholder="Describe the issue and expected behavior."></textarea></div><div class="modal-actions"><button class="btn btn-primary" onclick="saveBugTrackerEntry()">Save</button><button class="btn" onclick="clearBugTrackerForm()">Cancel</button></div></div><div class="card" style="max-width:1000px;margin-top:16px;padding:0;overflow:hidden"><div style="overflow:auto"><table class="list-table"><thead><tr><th>Date</th><th>POC</th><th>Bug description</th><th></th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
}
async function saveBugTrackerEntry() {
  const date = document.getElementById('bug-report-date')?.value || '';
  const poc = document.getElementById('bug-report-poc')?.value.trim() || '';
  const description = document.getElementById('bug-report-description')?.value.trim() || '';
  if (!date || !poc || !description) { alert('Date, POC, and bug description are required.'); return; }
  await mutateState('saveBugTrackerEntry', () => { appSettings.bugTracker = [...normalizeBugTracker(appSettings.bugTracker), { id: `bug-${Date.now()}`, date, poc, description, createdAt: new Date().toISOString() }]; persistSettings(); });
  renderBugReport();
}
function clearBugTrackerForm() { renderBugReport(); }
function editBugTrackerEntry(id) {
  const bug = normalizeBugTracker(appSettings.bugTracker).find(item => item.id === id);
  if (!bug) return;
  const date = prompt('Date (YYYY-MM-DD):', bug.date); if (date === null) return;
  const poc = prompt('POC:', bug.poc); if (poc === null) return;
  const description = prompt('Bug description:', bug.description); if (description === null) return;
  if (!date.trim() || !poc.trim() || !description.trim()) return;
  mutateState('editBugTrackerEntry', () => { appSettings.bugTracker = normalizeBugTracker(appSettings.bugTracker).map(item => item.id === id ? { ...item, date: date.trim(), poc: poc.trim(), description: description.trim() } : item); persistSettings(); }).then(renderBugReport);
}
function deleteBugTrackerEntry(id) {
  if (!confirm('Delete this bug report?')) return;
  mutateState('deleteBugTrackerEntry', () => { appSettings.bugTracker = normalizeBugTracker(appSettings.bugTracker).filter(item => item.id !== id); persistSettings(); }).then(renderBugReport);
}
function downloadBugReport() {
  const description = document.getElementById('bug-report-description')?.value.trim() || '';
  const steps = document.getElementById('bug-report-steps')?.value.trim() || '';
  if (!description) { alert('Please describe the problem first.'); return; }
  const report = `# ATLAS Bug Report\n\n## Description\n${description}\n\n## Reproduction steps\n${steps || 'Not provided'}\n\n## Diagnostics\n- Time: ${new Date().toISOString()}\n- App version: ${APP_VERSION}\n- Data format: ${DATA_VERSION}\n- Active page: ${currentPage}\n- Browser: ${navigator.userAgent}\n- Active file: ${activeFileName || 'None'}\n`;
  const url = URL.createObjectURL(new Blob([report], { type: 'text/markdown;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = `atlas-bug-report-${fmt(new Date())}.md`; link.click(); URL.revokeObjectURL(url);
}

function rotationShiftMeta(shift) {
  const ranges = normalizeShiftRotationRanges(appSettings.shiftRotationRanges);
  const colors = normalizeShiftRotationColors(appSettings.shiftRotationColors);
  const defs = {
    normal: { label: 'Normal Hours', range: ranges.normal, color: colors.normal, icon: svgIcon('sun', 'Normal Hours') },
    day: { label: 'Day', range: ranges.day, color: colors.day, icon: svgIcon('sun', 'Day shift') },
    evening: { label: 'Mid-day / Evening', range: ranges.evening, color: colors.evening, icon: svgIcon('evening', 'Mid-day / Evening shift') },
    night: { label: 'Night', range: ranges.night, color: colors.night, icon: svgIcon('moon', 'Night shift') },
    turn: { label: 'Turnaround', range: '', color: colors.turn, icon: shiftChangeIcon('Turnaround') },
    leave: { label: 'Leave', range: 'Off work', color: colors.leave, icon: '<span class="rotation-leave-icon" aria-hidden="true">OFF</span>' },
    overtime: { label: 'Overtime', range: 'Extra hours', color: colors.overtime, icon: '<span class="rotation-overtime-icon" aria-hidden="true">OT</span>' },
  };
  return defs[shift] || null;
}
function rotationRecord(empId, date) {
  if (appSettings.shiftRotationEnabled !== true) return null;
  const value = shiftRotationMap[`${empId}_${date}`];
  return value ? (typeof value === 'string' ? { shift: value } : value) : null;
}
function rotationRecordRange(record) {
  if (!record) return '';
  if (record.shift === 'overtime') return record.time || 'Specific time not entered';
  return rotationShiftMeta(record.shift)?.range || '';
}
async function setRotationFromPicker(shift) {
  if (pickerEmpId == null || !pickerDates.length) return;
  let time = '';
  if (shift === 'overtime') {
    time = prompt('Enter overtime time, for example 1000-1130:', '');
    if (time === null) return;
    time = time.trim().replace(/\s+/g, '').replace('–', '-');
    if (!timeRangeHours(time)) { alert('Enter a valid overtime range, for example 1000-1130.'); return; }
  }
  await mutateState('setRotationFromPicker', () => {
    pickerDates.forEach(date => {
      const key = `${pickerEmpId}_${date}`;
      shiftRotationMap[key] = shift ? { shift, ...(shift === 'overtime' ? { time } : {}) } : null;
    });
  });
  closePicker();
  renderPage();
}
function employeeHasRotation(empId, date) { return Boolean(rotationRecord(empId, date)?.shift); }
function rotationConflictActivities(empId, date) {
  return activities.filter(act => date >= act.startDate && date <= act.endDate && participantFor(act, empId))
    .filter(act => {
      const a = activityAssignment(`${empId}_${date}_${act.id}`);
      return a.assigned === true && a.excluded !== true;
    });
}
function excludeRotationConflicts(empId, date) {
  rotationConflictActivities(empId, date).forEach(act => excludeActivityAssignment(`${empId}_${date}_${act.id}`));
}
function rotationDatesForEmployee(empId) {
  return Object.keys(shiftRotationMap).filter(key => key.startsWith(`${empId}_`)).map(key => key.slice(String(empId).length + 1));
}
function removeEmployeeRotationRelations(empId) {
  for (const key of Object.keys(shiftRotationMap)) {
    if (key.startsWith(`${empId}_`)) shiftRotationMap[key] = null;
  }
}
async function setShiftRotation(empId, date, shift) {
  if (!appSettings.shiftRotationEnabled) return;
  let time = '';
  if (shift === 'overtime') {
    time = prompt('Enter overtime time, for example 1000-1130:', '');
    if (time === null) return;
    time = time.trim().replace(/\s+/g, '').replace('–', '-');
    if (!timeRangeHours(time)) {
      alert('Enter a valid overtime range, for example 1000-1130.');
      return;
    }
  }
  const conflicts = rotationConflictActivities(empId, date);
  if (shift && conflicts.length) {
    const employee = empById(empId);
    const detail = conflicts.map(act => act.name).join(', ');
    if (!confirm(`${employee?.name || 'This employee'} has activity assignment(s) on ${fmtMed(date)}: ${detail}.\n\nReplace only those assignments with Shift Rotation?`)) return;
  }
  await mutateState('setShiftRotation', () => {
    if (shift) {
      excludeRotationConflicts(empId, date);
      shiftRotationMap[`${empId}_${date}`] = { shift, ...(shift === 'overtime' ? { time } : {}) };
    } else shiftRotationMap[`${empId}_${date}`] = null;
  });
  renderPage();
}
let rotationSelectedCells = new Set();
let rotationSelectionAnchor = null;
let suppressRotationCellClick = false;
let shiftRotationInitialScrollPending = true;
function rotationCellKey(empId, date) { return `${empId}_${date}`; }
function updateRotationSelectionVisuals() {
  document.querySelectorAll('.rotation-cell[data-empid][data-date]').forEach(cell => {
    cell.classList.toggle('rotation-selected-cell', rotationSelectedCells.has(rotationCellKey(cell.dataset.empid, cell.dataset.date)));
  });
}
function startRotationCellSelection(event, empId, date) {
  if (event.button !== 0) return;
  event.preventDefault();
  event.stopPropagation();
  event.currentTarget.setPointerCapture?.(event.pointerId);
  rotationSelectionAnchor = { empId: Number(empId), date };
  rotationSelectedCells = new Set([rotationCellKey(empId, date)]);
  document.querySelectorAll('.rotation-cell').forEach(cell => cell.classList.add('rotation-dragging'));
  updateRotationSelectionVisuals();
  document.addEventListener('pointermove', onRotationSelectionMove);
  document.addEventListener('pointerup', finishRotationCellSelection, { once: true });
  document.addEventListener('pointercancel', finishRotationCellSelection, { once: true });
}
function onRotationSelectionMove(event) {
  if (!rotationSelectionAnchor) return;
  const cell = document.elementFromPoint(event.clientX, event.clientY)?.closest?.('.rotation-cell[data-empid][data-date]');
  if (!cell) return;
  extendRotationCellSelection(cell.dataset.empid, cell.dataset.date);
}
function extendRotationCellSelection(empId, date) {
  if (!rotationSelectionAnchor) return;
  if (Number(empId) !== rotationSelectionAnchor.empId) return;
  const start = new Date(`${rotationSelectionAnchor.date}T00:00:00`);
  const end = new Date(`${date}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return;
  const direction = start <= end ? 1 : -1;
  const cursor = new Date(start);
  rotationSelectedCells.clear();
  while ((direction > 0 && cursor <= end) || (direction < 0 && cursor >= end)) {
    rotationSelectedCells.add(rotationCellKey(empId, fmt(cursor)));
    cursor.setDate(cursor.getDate() + direction);
  }
  updateRotationSelectionVisuals();
}
function finishRotationCellSelection() {
  document.removeEventListener('pointermove', onRotationSelectionMove);
  document.removeEventListener('pointercancel', finishRotationCellSelection);
  rotationSelectionAnchor = null;
  document.querySelectorAll('.rotation-cell').forEach(cell => cell.classList.remove('rotation-dragging'));
  if (rotationSelectedCells.size >= 1) {
    const cells = [...rotationSelectedCells].map(key => key.split('_'));
    const empId = Number(cells[0][0]);
    const dates = cells.filter(([id]) => Number(id) === empId).map(([, date]) => date).sort();
    rotationSelectedCells.clear();
    updateRotationSelectionVisuals();
    suppressRotationCellClick = true;
    _showPicker(event, empId, dates);
  }
}
function openRotationCellPicker(event, empId, date) {
  if (suppressRotationCellClick) {
    suppressRotationCellClick = false;
    event?.stopPropagation?.();
    return;
  }
  event?.stopPropagation?.();
  _showPicker(event, Number(empId), [date]);
}
async function applyRotationSelection(shift) {
  const cells = [...rotationSelectedCells].map(key => key.split('_'));
  if (!cells.length) return;
  let time = '';
  if (shift === 'overtime') {
    time = prompt('Enter overtime time, for example 1000-1130:', '');
    if (time === null) return;
    time = time.trim().replace(/\s+/g, '').replace('–', '-');
    if (!timeRangeHours(time)) { alert('Enter a valid overtime range, for example 1000-1130.'); return; }
  }
  await mutateState('applyRotationSelection', () => {
    cells.forEach(([empId, date]) => {
      if (shift) shiftRotationMap[`${empId}_${date}`] = { shift, ...(shift === 'overtime' ? { time } : {}) };
      else shiftRotationMap[`${empId}_${date}`] = null;
    });
  });
  renderPage();
  rotationSelectedCells.clear();
  updateRotationSelectionVisuals();
}
function rotationDateHeader(date) {
  const d = date instanceof Date ? new Date(date) : new Date(`${date}T00:00:00`);
  const dateValue = fmt(d);
  const today = dateValue === todayStr();
  return `<th class="rotation-day-head${isWknd(d) ? ' weekend' : ''}${today ? ' today-col' : ''}" data-date="${dateValue}" title="${today ? 'Today' : ''}"><span>${d.toLocaleDateString('en-US', { weekday: 'short' })}</span><b>${d.getDate()}</b></th>`;
}
function renderShiftRotation() {
  if (appSettings.shiftRotationEnabled !== true) { nav('grid'); return; }
  shiftRotationMap = cleanShiftRotationMap(shiftRotationMap);
  const range = scheduleRange();
  const days = range.days;
  const rotationDayWidth = gridPeriod === 'week'
    ? Math.min(180, Math.max(72, Math.floor((window.innerWidth - 300) / Math.max(1, days.length))))
    : gridPeriod === 'month'
      ? Math.min(96, Math.max(48, Math.floor((window.innerWidth - 300) / Math.max(1, days.length))))
      : 36;
  const shiftTeams = normalizeShiftTeams(appSettings.shiftTeams);
  const shiftTeamById = new Map(shiftTeams.map(team => [team.id, team]));
  const eligible = employees.filter(emp => emp.includeInShiftRotation === true).sort((a, b) => {
    const left = shiftTeamById.get(a.shiftTeamId) || { order: 9999, name: 'Unassigned Shift Team' };
    const right = shiftTeamById.get(b.shiftTeamId) || { order: 9999, name: 'Unassigned Shift Team' };
    return left.order - right.order || left.name.localeCompare(right.name) || a.name.localeCompare(b.name);
  });
  const content = document.getElementById('content');
  let renderedShiftTeamId = null;
  let rows = eligible.map(emp => {
    const shiftTeam = shiftTeamById.get(emp.shiftTeamId) || { id: '', name: 'Unassigned Shift Team', color: '#64748b' };
    const shiftTeamHeader = shiftTeam.id !== renderedShiftTeamId ? (renderedShiftTeamId = shiftTeam.id, `<tr class="rotation-team-row"><th class="rotation-employee sticky-left" style="background:${shiftTeam.color}22;border-left:4px solid ${shiftTeam.color};color:${shiftTeam.color}">${esc(shiftTeam.name)}</th><td colspan="${days.length}" style="background:${shiftTeam.color}16;border-bottom:1px solid ${shiftTeam.color}"></td></tr>`) : '';
    const teamColor = resolveSubdepartmentColor(emp.department || 'Unassigned', emp.team || '')
      || resolveProcessColor(emp.department || 'Unassigned', emp.section || emp.subdepartment || '', emp.process || '')
      || resolveSectionColor(emp.department || 'Unassigned', emp.section || emp.subdepartment || '')
      || resolveDeptColor(emp.department || '')
      || 'var(--muted)';
    const cells = days.map(dateObj => {
      const date = fmt(dateObj), rec = rotationRecord(emp.id, date), meta = rotationShiftMeta(rec?.shift), range = rotationRecordRange(rec);
      const options = ['normal', 'day', 'evening', 'night', 'turn', 'leave', 'overtime'].map(shift => {
        const m = rotationShiftMeta(shift);
        return `<option value="${shift}" ${rec?.shift === shift ? 'selected' : ''}>${esc(m.label)}${shift === 'overtime' && rec?.shift === 'overtime' && rec.time ? ` (${esc(rec.time)})` : (m.range ? ` (${esc(m.range)})` : '')}</option>`;
      }).join('');
      const label = `${emp.name}, ${fmtMed(date)}: ${rec ? `${meta.label}${range ? ` (${range})` : ''}` : 'No rotation'}`;
      return `<td class="rotation-cell${rec ? ' assigned' : ''}${isWknd(dateObj) ? ' weekend' : ''}${date === todayStr() ? ' today-col' : ''}" data-empid="${emp.id}" data-date="${date}" style="--rotation-day-width:${rotationDayWidth}px;--rotation-color:${meta?.color || 'var(--accent-blue)'}" title="${esc(label)}" onclick="openRotationCellPicker(event,${emp.id},'${date}')" onpointerdown="startRotationCellSelection(event,${emp.id},'${date}')">
        <div class="rotation-cell-content">${rec ? meta.icon : '<span class="rotation-empty">+</span>'}</div>
        <select class="rotation-cell-select" aria-label="${esc(label)}" tabindex="-1" onchange="setShiftRotation(${emp.id},'${date}',this.value); rotationSelectedCells.clear(); updateRotationSelectionVisuals();">
          <option value="" ${rec ? '' : 'selected'}>Clear rotation</option>${options}
        </select>
      </td>`;
    }).join('');
    const organisationPath = [emp.department, emp.section || emp.subdepartment, emp.process, emp.team].filter(Boolean).join(' / ');
    return `${shiftTeamHeader}<tr><th class="rotation-employee sticky-left" style="border-left:4px solid ${teamColor};background:color-mix(in srgb,${teamColor} 14%,var(--surface));"><b>${displayEmployeeNameMarkup(emp)}</b><small>${esc(emp.role || '')}</small></th>${cells}</tr>`;
  }).join('');
  content.innerHTML = `<div class="rotation-wrap" style="--rotation-day-width:${rotationDayWidth}px"><div class="rotation-topbar"><div><h1 class="page-title">Shift Rotation</h1><p class="page-sub">Plan eligible employees. Every rotation date counts as normal working hours.</p></div><div class="flex items-center gap-1"><button class="btn btn-sm${gridPeriod === 'week' ? ' btn-primary' : ''}" onclick="setGridPeriod('week')">Week</button><button class="btn btn-sm${gridPeriod === 'month' ? ' btn-primary' : ''}" onclick="setGridPeriod('month')">Month</button><button class="btn btn-sm${gridPeriod === 'year' ? ' btn-primary' : ''}" onclick="setGridPeriod('year')">Year</button><button class="btn btn-sm" onclick="changeGridPeriod(-1)" aria-label="Previous period">‹</button><strong class="rotation-year">${esc(range.label)}</strong><button class="btn btn-sm" onclick="changeGridPeriod(1)" aria-label="Next period">›</button><button class="btn btn-sm" onclick="goToday()">Today</button><button class="btn btn-sm" onclick="openShiftRotationPrintDialog()">Print / PDF</button></div></div>${eligible.length ? `<div class="rotation-scroll"><table class="rotation-table"><thead><tr><th class="rotation-employee sticky-left">Employee</th>${days.map(rotationDateHeader).join('')}</tr></thead><tbody>${rows}</tbody></table></div>` : '<div class="card rotation-empty-state">No employees are included in Shift Rotation. Enable employees from People.</div>'}</div>`;
  if (appSettings.jumpToTodayOnGridChange !== false && shiftRotationInitialScrollPending) setTimeout(() => {
    document.querySelector(`.rotation-day-head[data-date="${todayStr()}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    shiftRotationInitialScrollPending = false;
  }, 60);
}
function openShiftRotationPrintDialog() {
  const range = scheduleRange();
  document.getElementById('rotation-print-start').value = range.start;
  document.getElementById('rotation-print-end').value = range.end;
  document.getElementById('shift-rotation-print-modal').classList.add('open');
}
function printShiftRotation() {
  const start = document.getElementById('rotation-print-start')?.value;
  const end = document.getElementById('rotation-print-end')?.value;
  if (!isValidIsoDate(start) || !isValidIsoDate(end) || start > end) {
    alert('Enter a valid timeframe.');
    return;
  }
  const days = datesBetween(start, end);
  const eligible = employees.filter(emp => emp.includeInShiftRotation === true).sort((a, b) => a.name.localeCompare(b.name));
  const headers = days.map(date => {
    const d = new Date(`${date}T00:00:00`);
    const classes = [isWknd(d) ? 'weekend' : ''].filter(Boolean).join(' ');
    return `<th class="${classes}">${d.toLocaleDateString('en-US', { weekday: 'short' })}<br>${d.getDate()} ${d.toLocaleDateString('en-US', { month: 'short' })}</th>`;
  }).join('');
  const rows = eligible.map(emp => { const teamColor = resolveSubdepartmentColor(emp.department || 'Unassigned', emp.team || '') || resolveProcessColor(emp.department || 'Unassigned', emp.section || emp.subdepartment || '', emp.process || '') || resolveSectionColor(emp.department || 'Unassigned', emp.section || emp.subdepartment || '') || resolveDeptColor(emp.department || '') || '#64748b'; return `<tr><th style="border-left:4px solid ${teamColor};background:${teamColor}22">${displayEmployeeNameMarkup(emp)}<small>${esc(emp.role || '')}</small></th>${days.map(date => {
    const record = rotationRecord(emp.id, date);
    const meta = rotationShiftMeta(record?.shift);
    const label = record ? `${meta.label}${rotationRecordRange(record) ? ` (${rotationRecordRange(record)})` : ''}` : '—';
    const day = new Date(`${date}T00:00:00`);
    const classes = [isWknd(day) ? 'weekend' : ''].filter(Boolean).join(' ');
    return `<td class="${classes}">${esc(label)}</td>`;
  }).join('')}</tr>`; }).join('');
  const printWindow = window.open('', '_blank', 'width=1400,height=900');
  if (!printWindow) { alert('Please allow pop-ups to print the Shift Rotation plan.'); return; }
  printWindow.document.write(`<!doctype html><html><head><title>Shift Rotation ${start} to ${end}</title><style>@page{size:landscape;margin:8mm}body{font:11px system-ui;color:#111}h1{font-size:20px;margin:0 0 4px}p{margin:0 0 10px;color:#555}table{border-collapse:collapse;width:100%}th,td{border:1px solid #bbb;padding:5px;text-align:center}th:first-child,td:first-child{text-align:left;min-width:160px}th{background:#e5e7eb}.weekend{background:#fff7ed !important;color:#9a3412}small{display:block;font-weight:400;color:#666}@media print{*{print-color-adjust:exact;-webkit-print-color-adjust:exact}}</style></head><body><h1>Shift Rotation</h1><p>${esc(start)} – ${esc(end)}</p><table><thead><tr><th>Employee</th>${headers}</tr></thead><tbody>${rows}</tbody></table></body></html>`);
  printWindow.document.close(); printWindow.focus(); printWindow.print();
  closeModal('shift-rotation-print-modal');
}

// ═══ GRID VIEW ═══════════════════════════════════════════════════════════════
function planningHorizonDate() {
  const days = Number(appSettings.planningHorizonDays);
  if (!Number.isFinite(days) || days <= 0) return '';
  const date = new Date(`${todayStr()}T00:00:00`);
  date.setDate(date.getDate() + Math.round(days));
  return fmt(date);
}
function planningHorizonStyle(date) {
  return date === planningHorizonDate()
    ? `;box-shadow:inset 2px 0 0 ${normalizeHexColor(appSettings.planningHorizonColor, '#ef4444')} !important;`
    : '';
}
function planningHorizonHeaderStyle(date) {
  const horizonDate = planningHorizonDate();
  if (!horizonDate) return '';
  if (date === horizonDate) return `${planningHorizonStyle(date)}color:var(--muted) !important;`;
  return '';
}
function dateBeforeIso(isoDate) {
  if (!isoDate) return '';
  const date = new Date(`${isoDate}T00:00:00`);
  date.setDate(date.getDate() - 1);
  return fmt(date);
}
function gridSpanLabelWidth(startIndex, endIndex) {
  const spanColumns = startIndex >= 0 && endIndex >= startIndex ? endIndex - startIndex + 1 : 1;
  const columnWidth = gridPeriod === 'week'
    ? Math.min(180, Math.max(72, Math.floor((window.innerWidth - 300) / 7)))
    : gridPeriod === 'month'
      ? Math.min(96, Math.max(48, Math.floor((window.innerWidth - 300) / 31)))
      : 36;
  return Math.min(420, Math.max(68, spanColumns * columnWidth - 8));
}
function renderGrid() {
  const range = scheduleRange();
  const days = range.days;
  const dayColumnWidth = gridPeriod === 'week'
    ? Math.min(180, Math.max(72, Math.floor((window.innerWidth - 300) / Math.max(1, days.length))))
    : gridPeriod === 'month'
      ? Math.min(96, Math.max(48, Math.floor((window.innerWidth - 300) / Math.max(1, days.length))))
      : 36;
  const today = todayStr();
  const scheduleSections = [...new Set(employees.map(employeeSection).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'nb', { sensitivity: 'base' }));

  let monthCells = '', weekCells = '', dayCells = '';
  let mLabel = '', mCount = 0, mIndex = 0;
  const flushMonth = () => { if (mCount) monthCells += `<th class="gh-month${mIndex % 2 ? ' period-alt' : ''}" colspan="${mCount}" style="top:0">${mLabel}</th>`; };
  let wLabel = -1, wCount = 0;
  const flushWeek = () => { if (wCount) weekCells += `<th class="gh-week${wLabel % 2 === 0 ? ' period-alt' : ''}" colspan="${wCount}" style="top:27px">W${wLabel}</th>`; };
  for (const d of days) {
    const lbl = d.toLocaleDateString('en-US', { month: 'short' });
    if (lbl !== mLabel) { flushMonth(); mLabel = lbl; mIndex = d.getMonth(); mCount = 0; }
    mCount++;
    const wk = isoWeek(d);
    if (wk !== wLabel) { flushWeek(); wLabel = wk; wCount = 0; }
    wCount++;
    const ds = fmt(d);
    const holiday = displayedHolidayFor(ds);
    const holidayIntensity = holiday?.isSpecialDay ? '41%' : '16%';
    const holidayStyle = holiday ? `background:color-mix(in srgb,${holiday.color || '#ef4444'} ${holidayIntensity},var(--surface)) !important;color:${holiday.color || '#ef4444'} !important;${isWknd(d) ? 'filter:brightness(.86);' : ''}` : '';
    dayCells += `<th class="gh-day${isWknd(d) ? ' weekend' : ''}${ds === today ? ' today-col' : ''}${holiday ? ' holiday-col' : ''}" data-date="${ds}" title="${holiday ? esc(holiday.name || 'Holiday') : 'Click to add a special day'}" style="--grid-day-width:${dayColumnWidth}px;${holidayStyle}${planningHorizonStyle(ds)}${planningHorizonHeaderStyle(ds)}top:46px" onclick="openSpecialDayForDate('${ds}')"><span class="dow">${'SMTWTFS'[d.getDay()]}</span>${d.getDate()}</th>`;
  }
  flushMonth(); flushWeek();
  const topbarActivityFilter = normalizeActivityStatusFilter(appSettings.activityStatusFilter, appSettings.showOnlyConfirmedActivities);
  const topbarYearActivities = activities.filter(activity => activity.startDate <= range.end && activity.endDate >= range.start && activityVisibleForScheduleSection(activity));
  const topbarFilteredActivities = topbarActivityFilter === 'all'
    ? topbarYearActivities
    : topbarYearActivities.filter(activity => activityStatus(activity) === topbarActivityFilter);
  const topbarPastActivities = topbarFilteredActivities.filter(activity => activity.endDate < today);
  document.getElementById('content').innerHTML = cleanHtml(`
    <div id="grid-wrap" class="schedule-period-${gridPeriod}${showAdminCheckIndicators && canHostedCheckOff() ? ' admin-check-mode' : ''}" style="min-height:0;--grid-day-width:${dayColumnWidth}px">
      <div class="grid-topbar">
        <div>
          <div class="page-title organisation-name-header">${esc(appSettings.appName || 'Organisation')}</div>
          <div class="atlas-full-name">ATLAS - Adaptive Timeline, Load &amp; Allocation System</div>
        </div>
        <div class="flex items-center gap-2 schedule-topbar-controls">
          <button class="btn btn-sm" onclick="goToday()">Today</button>
          <label class="btn btn-sm schedule-date-jump-button" title="Jump to a specific date"><span>Jump…</span>${svgIcon('teamSchedule')}<input id="schedule-date-jump-input" class="schedule-date-jump-input" type="date" value="${scheduleAnchorDate}" onchange="jumpToScheduleDate(this.value)" oninput="jumpToScheduleDate(this.value)" aria-label="Jump to date"></label>
          <select class="plain-select" style="height:32px;padding:5px 7px;width:76px" onchange="applyAppZoom(this.value)" aria-label="Application zoom" title="Local application zoom">
            ${[80,90,100,110,125,150,175].map(value => `<option value="${value}" ${appZoom === value ? 'selected' : ''}>${value}%</option>`).join('')}
          </select>
          <select class="plain-select" style="height:32px;padding:5px 9px" onchange="setGridViewMode(this.value)" aria-label="Show schedule layout">
            <option value="all" ${gridViewMode === 'all' ? 'selected' : ''}>Show: All</option>
            <option value="timeline" ${gridViewMode === 'timeline' ? 'selected' : ''}>Show: Timeline only</option>
            <option value="employees" ${gridViewMode === 'employees' ? 'selected' : ''}>Show: Employees only</option>
          </select>
          ${canHostedCheckOff() ? `<button class="btn btn-sm${showAdminCheckIndicators ? ' btn-primary' : ''}" type="button" onclick="toggleAdminCheckIndicators()" aria-pressed="${showAdminCheckIndicators}" title="Show or hide administrator check-off indicators">${showAdminCheckIndicators ? 'Hide checks' : 'Show checks'}</button>` : ''}
          <select class="plain-select" style="height:32px;padding:5px 9px;max-width:180px" onchange="setScheduleSectionFilter(this.value)" aria-label="Show section">
            <option value="">All sections</option>
            ${scheduleSections.map(section => `<option value="${esc(section)}" ${scheduleSectionFilter === section ? 'selected' : ''}>${esc(section)}</option>`).join('')}
          </select>
          <div class="flex items-center gap-1" role="group" aria-label="Schedule period">
            ${['week', 'month', 'year'].map(period => `<button class="btn btn-sm${gridPeriod === period ? ' btn-primary' : ''}" onclick="setGridPeriod('${period}')">${period[0].toUpperCase()}${period.slice(1)}</button>`).join('')}
          </div>
          <div class="year-nav" aria-label="Schedule period navigation">
            <button class="btn btn-icon" onclick="changeGridPeriod(-1)" aria-label="Previous period">${svgIcon('chevronLeft')}</button>
            <span class="year-label">${esc(range.label)}</span>
            <button class="btn btn-icon" onclick="changeGridPeriod(1)" aria-label="Next period">${svgIcon('chevronRight')}</button>
          </div>
          ${renderSecurityLabel('security-label-inline')}
          ${hiddenEmployees.size ? `<button class="btn btn-sm" onclick="showAllEmployees()">Show all employees</button>` : ''}

          <!-- Holiday modal -->
          <div class="modal-bg" id="holiday-modal">
            <div class="modal" style="width:520px">
              <h3 id="holiday-modal-title">Add Holiday</h3>
              <p class="modal-desc">Highlight a holiday or calendar period in the grid. Capacity is only reduced when selected.</p>
              <div class="form-row"><label>Name *</label><input id="hf-name" placeholder="Summer vacation period"></div>
              <div class="form-row-2">
                <div class="form-row" style="margin:0"><label>From *</label><input id="hf-start" type="date"></div>
                <div class="form-row" style="margin:0"><label>To *</label><input id="hf-end" type="date"></div>
              </div>
              <label style="display:flex;align-items:center;gap:7px;font-size:12px;cursor:pointer;margin-top:12px"><input id="hf-nonworking" type="checkbox"> Subtract from normal capacity</label>
              <div class="form-row" style="margin-top:12px"><label>Color</label><div class="swatches" id="hf-swatches"></div></div>
              <div class="modal-actions">
                <button class="btn btn-danger" id="hf-delete-btn" style="margin-right:auto;display:none" onclick="deleteHolidayFromModal()">Delete</button>
                <button class="btn" onclick="closeModal('holiday-modal')">Cancel</button>
                <button class="btn btn-primary" onclick="saveHolidayFromModal()">Save</button>
              </div>
            </div>
          </div>

          <!-- Team work schedule report modal -->
          <div class="modal-bg" id="team-report-modal">
            <div class="modal" style="width:min(1100px, calc(100vw - 32px));max-height:92vh;display:flex;flex-direction:column">
              <div class="flex items-center justify-between" style="gap:12px">
                <h3 style="margin:0">Team Work Schedule</h3>
                <button class="icon-btn" title="Close" onclick="closeModal('team-report-modal')">&times;</button>
              </div>
              <div class="form-row-2" style="margin-top:14px">
                <div class="form-row" style="margin:0"><label>From</label><input id="team-report-start" type="date"></div>
                <div class="form-row" style="margin:0"><label>To</label><input id="team-report-end" type="date"></div>
              </div>
              <div id="team-report-content" style="overflow:auto;margin-top:14px"></div>
              <div class="modal-actions">
                <button class="btn" onclick="renderTeamScheduleReport()">Update report</button>
                <button class="btn btn-primary" onclick="printTeamScheduleReport()">Print / Save PDF</button>
              </div>
            </div>
          </div>

          <!-- Activity schedule report modal -->
          <div class="modal-bg" id="activity-schedule-modal">
            <div class="modal" style="width:min(1100px, calc(100vw - 32px));max-height:92vh;display:flex;flex-direction:column">
              <div class="flex items-center justify-between" style="gap:12px">
                <h3 style="margin:0">Activity Schedule</h3>
                <button class="icon-btn" title="Close" onclick="closeModal('activity-schedule-modal')">&times;</button>
              </div>
              <div class="form-row-2" style="margin-top:14px">
                <div class="form-row" style="margin:0"><label>From</label><input id="as-start" type="date"></div>
                <div class="form-row" style="margin:0"><label>To</label><input id="as-end" type="date"></div>
              </div>
              <div class="flex items-center" style="gap:16px;margin-top:4px">
                <label style="display:flex;align-items:center;gap:6px;font-size:12px;cursor:pointer;margin:0"><input id="as-filter-tentative" type="checkbox" checked> Planned</label>
                <label style="display:flex;align-items:center;gap:6px;font-size:12px;cursor:pointer;margin:0"><input id="as-filter-confirmed" type="checkbox" checked> Confirmed</label>
                <label style="display:flex;align-items:center;gap:6px;font-size:12px;cursor:pointer;margin:0"><input id="as-filter-cancelled" type="checkbox" checked> Cancelled</label>
              </div>
              <div id="activity-schedule-content" style="overflow:auto;margin-top:14px"></div>
              <div class="modal-actions">
                <button class="btn" onclick="renderActivityScheduleReport()">Update report</button>
                <button class="btn btn-primary" onclick="printActivityScheduleReport()">Print / Save PDF</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div id="grid-scroll" style="position:relative;min-height:0;overflow:auto" onwheel="handleActivityListWheel(event)">
        <div id="employee-picker" style="display:none"></div>
        <table class="gtable">
          <thead>
            <tr><th class="gh-emp sticky-left" rowspan="3" style="width:240px;min-width:240px;top:0">
              <div class="schedule-corner-header">
                <div class="schedule-corner-title-row">
                  <span class="schedule-corner-title">Activities</span>
                </div>
                <div class="schedule-corner-controls">
                  <button class="icon-btn activity-past-toggle${pastActivitiesExpanded ? ' active' : ''}" type="button" style="${pastActivitiesExpanded ? 'background:var(--accent-blue);color:#fff;box-shadow:0 0 0 1px color-mix(in srgb,var(--accent-blue) 80%,#000)' : ''}" title="${topbarPastActivities.length ? (pastActivitiesExpanded ? 'Hide past activities' : `Show past activities (${topbarPastActivities.length})`) : 'No past activities in this period'}" aria-label="${pastActivitiesExpanded ? 'Hide past activities' : 'Show past activities'}" aria-pressed="${pastActivitiesExpanded}" ${topbarPastActivities.length ? '' : 'disabled'} onclick="togglePastActivities()">${svgIcon('history')}</button>
                  <label class="schedule-compact-filter" title="Filter activities"><span>Show:</span><span class="schedule-filter-value">${topbarActivityFilter === 'tentative' ? 'Planned' : topbarActivityFilter === 'confirmed' ? 'Confirmed' : topbarActivityFilter === 'cancelled' ? 'Cancelled' : 'All'}</span><select id="activity-status-filter" class="plain-select" onchange="setActivityStatusFilter(this.value)" aria-label="Show activities"><option value="all" ${topbarActivityFilter === 'all' ? 'selected' : ''}>All</option><option value="tentative" ${topbarActivityFilter === 'tentative' ? 'selected' : ''}>Planned</option><option value="confirmed" ${topbarActivityFilter === 'confirmed' ? 'selected' : ''}>Confirmed</option><option value="cancelled" ${topbarActivityFilter === 'cancelled' ? 'selected' : ''}>Cancelled</option></select></label>
                  <button class="btn btn-sm schedule-select-button" type="button" onclick="openEmployeePicker(this)">Select...</button>
                </div>
              </div>
            </th>${monthCells}</tr>
            <tr>${weekCells}</tr>
            <tr>${dayCells}</tr>
          </thead>
          <tbody id="gtbody"></tbody>
        </table>
      </div>
      <div id="holiday-add-popover" class="holiday-add-popover">
        <button class="holiday-add-option" type="button" onclick="openHolidayAddAction('add')">Add holiday period</button>
        <button class="holiday-add-option" type="button" onclick="openHolidayAddAction('import')">Import .ics holidays</button>
      </div>
      <div style="padding:6px 24px;border-top:1px solid var(--border);flex-shrink:0;display:flex;flex-wrap:wrap;gap:12px;align-items:center;font-size:11px;color:var(--muted)">
        <span style="font-weight:600">Legend:</span>
        ${statuses.map(s => `<span class="flex items-center" style="gap:4px"><span class="badge-status" style="${statusStyle(s.color)};padding:0 6px;font-size:10px">${esc(s.abbr)}</span> ${esc(s.label)}</span>`).join('')}
        <span class="flex items-center" style="gap:4px">${svgIcon('sun')} Day shift</span>
        <span class="flex items-center" style="gap:4px">${svgIcon('evening')} Mid-day / Evening shift</span>
        <span class="flex items-center" style="gap:4px">${shiftChangeIcon('Night shift change')} Night shift</span>
      </div>
    </div>`);
  renderGridBody(days, today);
  if (appSettings.jumpToTodayOnGridChange !== false) setTimeout(scrollToToday, 60);
}

function renderGridBody(days, today) {
  const tbody = document.getElementById('gtbody');
  if (!tbody) return;
  const range = scheduleRange();
  let html = '';
  const showTimelineSections = gridViewMode !== 'employees';
  const showEmployeeSection = gridViewMode !== 'timeline';
  const yearActs = activities.filter(a => a.startDate <= range.end && a.endDate >= range.start && activityVisibleForScheduleSection(a));
  const activityFilter = normalizeActivityStatusFilter(appSettings.activityStatusFilter, appSettings.showOnlyConfirmedActivities);
  const filteredYearActs = activityFilter === 'all'
    ? yearActs
    : yearActs.filter(a => activityStatus(a) === activityFilter);
  const currentActs = filteredYearActs.filter(a => a.endDate >= today);
  const pastActs = filteredYearActs.filter(a => a.endDate < today);
  const visibleActivities = [...(pastActivitiesExpanded ? pastActs : []), ...currentActs].sort((a, b) => a.startDate.localeCompare(b.startDate) || a.endDate.localeCompare(b.endDate) || a.name.localeCompare(b.name));
  const paginateActivities = gridViewMode !== 'timeline' && visibleActivities.length > activityPageCapacity();
  const pageSize = gridViewMode === 'timeline' ? Math.max(1, visibleActivities.length) : activityPageCapacity();
  activityPageSize = pageSize;
  const maxOffset = paginateActivities ? Math.max(0, visibleActivities.length - pageSize) : 0;
  activityPageOffset = paginateActivities ? Math.min(activityPageOffset, maxOffset) : 0;
  const activityPage = paginateActivities ? visibleActivities.slice(activityPageOffset, activityPageOffset + pageSize) : visibleActivities;
  const pageStart = visibleActivities.length ? activityPageOffset + 1 : 0;
  const pageEnd = paginateActivities ? Math.min(activityPageOffset + pageSize, visibleActivities.length) : visibleActivities.length;
  const plannerYearStart = `${gridYear}-01-01`;
  const plannerYearEnd = `${gridYear}-12-31`;
  const plannerYearActs = activities.filter(activity => activity.startDate <= plannerYearEnd && activity.endDate >= plannerYearStart && activityVisibleForScheduleSection(activity));
  const totalFilteredActivities = activityFilter === 'all'
    ? plannerYearActs
    : plannerYearActs.filter(activity => activityStatus(activity) === activityFilter);
  const activityHeadingText = gridPeriod === 'year'
    ? `${totalFilteredActivities.length}`
    : `${totalFilteredActivities.length} total · ${filteredYearActs.length} shown`;
  const hasAnyActivities = (currentActs.length + pastActs.length) > 0;

  // ── Activities section ────────────────────────────────────────
  if (showTimelineSections) {
    html += `<tr class="sect-row"><td class="sticky-left schedule-activities-header" style="z-index:60">
        <span class="schedule-section-header">
          <span class="flex items-center" style="gap:5px;font-size:10px"><button class="icon-btn" title="${collapsedGridSections.activities ? 'Expand activities' : 'Collapse activities'}" aria-label="${collapsedGridSections.activities ? 'Expand activities section' : 'Collapse activities section'}" aria-expanded="${collapsedGridSections.activities ? 'false' : 'true'}" onclick="toggleGridSection('activities')">${svgIcon(collapsedGridSections.activities ? 'chevronRight' : 'chevronDown')}</button>Activities <span class="schedule-activity-count">(${activityHeadingText})</span></span>
          <span class="schedule-section-controls" style="gap:6px">
            ${paginateActivities ? `<button class="icon-btn" title="Scroll to previous activity" aria-label="Scroll to previous activity" ${activityPageOffset === 0 ? 'disabled' : ''} onclick="changeActivityPage(-1)">${svgIcon('chevronUp')}</button>
            <button class="icon-btn" title="Scroll to next activity" aria-label="Scroll to next activity" ${pageEnd >= visibleActivities.length ? 'disabled' : ''} onclick="changeActivityPage(1)">${svgIcon('chevronDown')}</button>` : ''}
            <button class="icon-btn" title="Team Work Schedule" aria-label="Team Work Schedule" onclick="openTeamScheduleReport()">${svgIcon('teamSchedule')}</button>
            <button class="icon-btn" title="Activity Schedule" aria-label="Activity Schedule" onclick="openActivityScheduleReport()">${svgIcon('report')}</button>
            <button class="icon-btn" title="Add activity" aria-label="Add activity" onclick="openActModal()">${svgIcon('plus')}</button>
          </span>
        </span>
      </td><td colspan="${days.length}"></td></tr>`;

    if (collapsedGridSections.activities) {
      html += `<tr><td class="gempl sticky-left" style="font-size:12px;color:var(--muted);height:30px">Activities collapsed.</td><td colspan="${days.length}"></td></tr>`;
    } else if (!hasAnyActivities) {
      const emptyActivityText = activityFilter === 'tentative' ? 'No planned activities to show.' : (activityFilter === 'confirmed' ? 'No confirmed activities to show.' : (activityFilter === 'cancelled' ? 'No cancelled activities to show.' : 'No activities yet. Use the add activity button to create one.'));
      html += `<tr><td class="gempl sticky-left" style="font-size:12px;color:var(--muted);height:30px">${emptyActivityText}</td>${days.map(d => { const ds = fmt(d); return `<td class="gday${isWknd(d) ? ' weekend' : ''}${displayedHolidayFor(ds) ? ' holiday-col' : ''}" style="--holiday-color:${displayedHolidayFor(ds)?.color || '#ef4444'};${planningHorizonStyle(ds)}"></td>`; }).join('')}</tr>`;
    }
  }
  const renderActRow = (act, dim) => {
    const attendCount = act.participants.length;
    const lifecycle = activityStatusMeta(act);
    const typeMeta = activityTypeMeta(act);
    const lifecycleBadge = lifecycle.status === 'confirmed' ? '' : `<span class="act-lifecycle ${lifecycle.className}">${lifecycle.label}</span>`;
    const barBackground = lifecycle.status === 'tentative'
      ? `repeating-linear-gradient(135deg,color-mix(in srgb,${act.color} 38%,transparent) 0 5px,color-mix(in srgb,${act.color} 12%,transparent) 5px 10px)`
      : act.color;
    const barOpacity = lifecycle.status === 'tentative' ? '.9' : (dim ? '.16' : '.28');
    let row = `<tr class="activity-grid-row"><td class="gempl sticky-left" style="${dim ? 'opacity:.65;' : ''}cursor:pointer" onclick="openActModal(${act.id})" title="${esc(act.name)}${typeMeta ? ` · ${esc(typeMeta.label)}` : ''}\nClick to edit">
      <div class="act-cell-name">
        <span class="flex items-center gap-2" style="min-width:0">
          <span class="act-dot" style="background:${act.color}"></span>
          <span class="act-name" role="button" tabindex="0" title="Jump to ${esc(act.name)}" onclick="event.stopPropagation();jumpToActivity(${act.id})" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();event.stopPropagation();jumpToActivity(${act.id})}"${lifecycle.status === 'cancelled' ? ' style="text-decoration:line-through;text-decoration-color:var(--destructive);text-decoration-thickness:2px;"' : ''}>${esc(activityDisplayName(act))}</span>
          ${act.abbreviation ? `<span style="font-size:10px;font-weight:700;color:${act.color};flex-shrink:0">[${esc(act.abbreviation)}]</span>` : ''}
          ${lifecycleBadge}
        </span>
        <span class="act-cell-actions">
          ${lifecycle.status !== 'cancelled' ? `<button class="icon-btn" title="${lifecycle.status === 'tentative' ? 'Create draft work schedule' : 'Work Schedule'}" onclick="event.stopPropagation();openActivityReport(${act.id})">${svgIcon('report')}</button>` : ''}
          <button class="icon-btn" title="Edit" onclick="event.stopPropagation();openActModal(${act.id})">${svgIcon('edit')}</button>
          <button class="icon-btn danger" title="Delete" onclick="event.stopPropagation();confirmDelete('activity',${act.id})">${svgIcon('trash')}</button>
        </span>
      </div>
      <div class="act-dates muted">${fmtShort(act.startDate)} – ${fmtShort(act.endDate)} · ${attendCount} attending</div>
    </td>`;
    const visibleStart = act.startDate < range.start ? range.start : act.startDate;
    const visibleEnd = act.endDate > range.end ? range.end : act.endDate;
    const startIdx = days.findIndex(day => fmt(day) === visibleStart);
    const endIdx = days.findIndex(day => fmt(day) === visibleEnd);
    const labelWidth = gridSpanLabelWidth(startIdx, endIdx);
    for (const d of days) {
      const ds = fmt(d), inR = ds >= act.startDate && ds <= act.endDate;
      const specialDay = displayedSpecialDayFor(ds);
      const calendarHoliday = displayedHolidayFor(ds);
      const specialDayStyle = specialDay ? `background:color-mix(in srgb,${specialDay.color || '#ef4444'} 41%,var(--surface)) !important;` : '';
      const isS = ds === visibleStart, isE = ds === visibleEnd;
      if (inR) {
        const brl = isS ? '4px 0 0 4px' : '0', brr = isE ? '0 4px 4px 0' : '0';
        row += `<td class="gday act-bar-cell activity-select-cell${isWknd(d) ? ' weekend' : ''}${ds === today ? ' today-col' : ''}${calendarHoliday ? ' holiday-col' : ''}${isS ? ' span-label-cell' : ''}" data-row-key="act-${act.id}" data-date="${ds}" style="--holiday-color:${calendarHoliday?.color || '#ef4444'};height:28px;${specialDayStyle}${planningHorizonStyle(ds)}" onpointerdown="startActivityRangeSelection(event,'act-${act.id}','${ds}')" onclick="handleActivityCellClick(event,${act.id})" title="${esc(act.name)}${typeMeta ? ` · ${esc(typeMeta.label)}` : ''} · ${fmtMed(act.startDate)} – ${fmtMed(act.endDate)}${act.notes ? '\n' + esc(act.notes) : ''}\nAttending: ${act.participants.map(p => empById(p.id)?.name).filter(Boolean).map(esc).join(', ') || '—'}\nClick to edit">
          <div class="act-bar${lifecycle.status === 'cancelled' ? ' cancelled-bar' : ''}" style="position:absolute;top:4px;bottom:4px;left:${isS ? '3px' : '0'};right:${isE ? '3px' : '0'};background:${barBackground};opacity:${barOpacity};border-radius:${brl} ${brr}"></div>
          ${isS ? `<span class="grid-span-label" title="${esc(act.name)}" style="color:${act.color};width:${labelWidth}px;${dim ? 'opacity:.6' : ''}">${esc(activityDisplayName(act))}${lifecycle.status === 'confirmed' ? '' : (lifecycle.status === 'cancelled' ? `<span class="grid-span-status cancelled">${lifecycle.label}</span>` : ` · ${lifecycle.label}`)}</span>` : ''}
        </td>`;
      } else {
        row += `<td class="gday activity-select-cell${isWknd(d) ? ' weekend' : ''}${ds === today ? ' today-col' : ''}${calendarHoliday ? ' holiday-col' : ''}" data-row-key="act-${act.id}" data-date="${ds}" style="--holiday-color:${calendarHoliday?.color || '#ef4444'};height:28px;${specialDayStyle}${planningHorizonStyle(ds)}" onpointerdown="startActivityRangeSelection(event,'act-${act.id}','${ds}')" onclick="handleActivityCellClick(event,${act.id})"></td>`;
      }
    }
    return row + '</tr>';
  };
  if (showTimelineSections && !collapsedGridSections.activities && hasAnyActivities) {
    activityPage.forEach(act => { html += renderActRow(act, act.endDate < today); });
  }

  const yearHolidays = holidayPeriodsForRange(range.start, range.end);
  const currentHolidays = yearHolidays.filter(holiday => holiday.endDate >= today);
  const pastHolidays = yearHolidays.filter(holiday => holiday.endDate < today);
  if (showTimelineSections) {
    html += `<tr class="sect-row"><td class="sticky-left" style="z-index:21">
          <span class="flex items-center justify-between"><span class="flex items-center" style="gap:6px">Holidays</span>
          <span class="flex items-center" style="gap:6px"><button type="button" class="filter-chip schedule-visibility-btn${showHolidays ? ' active' : ''}" onclick="showHolidays=!showHolidays;renderPage()">${showHolidays ? 'Hide' : 'Show'}</button><span class="icon-btn" style="visibility:hidden" aria-hidden="true">${svgIcon('report')}</span><span class="holiday-add-menu" id="holiday-add-menu"><button class="icon-btn" type="button" title="Add holiday options" aria-label="Add holiday options" onclick="toggleHolidayAddMenu(event)">${svgIcon('plus')}</button></span>
          </span>
        </span></td><td colspan="${days.length}"></td></tr>`;
  }
  if (showTimelineSections && collapsedGridSections.holidays) {
    html += `<tr><td class="gempl sticky-left" style="font-size:12px;color:var(--muted);height:30px">Holidays collapsed.</td><td colspan="${days.length}"></td></tr>`;
  } else if (showTimelineSections && !showHolidays) {
    html += `<tr><td class="gempl sticky-left" style="font-size:12px;color:var(--muted);height:30px">Holidays hidden.</td><td colspan="${days.length}"></td></tr>`;
  } else if (showTimelineSections && !currentHolidays.length && !pastHolidays.length) {
    html += `<tr><td class="gempl sticky-left" style="font-size:12px;color:var(--muted);height:30px">No holiday periods added. Drag across dates to add one.</td>${days.map(d => `<td class="gday holiday-select-cell${isWknd(d) ? ' weekend' : ''}" data-date="${fmt(d)}" style="${planningHorizonStyle(fmt(d))}" onpointerdown="startHolidayRangeSelection(event,'${fmt(d)}')"></td>`).join('')}</tr>`;
  } else if (showTimelineSections) {
    const renderHolidayRow = holiday => {
      const start = holiday.startDate, end = holiday.endDate;
      const color = holiday.color || '#ef4444';
      const visibleStart = start < range.start ? range.start : start;
      const visibleEnd = end > range.end ? range.end : end;
      const startIndex = days.findIndex(day => fmt(day) === visibleStart);
      const endIndex = days.findIndex(day => fmt(day) === visibleEnd);
      const labelWidth = gridSpanLabelWidth(startIndex, endIndex);
      html += `<tr><td class="gempl sticky-left" style="cursor:pointer" onclick="openHolidayModal(${holiday.sourceIndexes[0]},[${holiday.sourceIndexes.join(',')}])" title="Edit ${esc(holiday.name || 'Holiday')}"><div class="act-cell-name"><span class="act-name" style="color:${color}">${esc(holiday.name || 'Holiday')}</span><span class="act-cell-actions"><button class="icon-btn" title="Edit" onclick="event.stopPropagation();openHolidayModal(${holiday.sourceIndexes[0]},[${holiday.sourceIndexes.join(',')}])">${svgIcon('edit')}</button></span></div><div class="act-dates muted">${fmtShort(start)} – ${fmtShort(end)}${holiday.nonWorking ? ' · non-working' : ' · highlight only'}</div></td>`;
      days.forEach(day => {
        const ds = fmt(day), active = ds >= start && ds <= end;
        const isStart = ds === visibleStart;
        html += `<td class="gday holiday-select-cell${isWknd(day) ? ' weekend' : ''}${ds === today ? ' today-col' : ''}${active ? ' holiday-col' : ''}${isStart ? ' span-label-cell' : ''}" data-date="${ds}" style="${active ? `--holiday-color:${color};background:${color}28 !important;color:${color};border-color:${color}55;${isWknd(day) ? 'filter:brightness(.86);' : ''}` : ''}${planningHorizonStyle(ds)}" onpointerdown="startHolidayRangeSelection(event,'${ds}')" title="${active ? esc(holiday.name || 'Holiday') : 'Drag to add a holiday period'}">${isStart ? `<span class="grid-span-label" style="width:${labelWidth}px;color:${color}">${esc(holiday.name || 'Holiday')}</span>` : ''}</td>`;
      });
      html += '</tr>';
    };
    currentHolidays.forEach(renderHolidayRow);
    if (pastHolidays.length) {
      html += `<tr><td class="gempl sticky-left" style="background:color-mix(in srgb,var(--muted-bg) 60%,transparent)"><button class="icon-btn" style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.03em" onclick="pastHolidaysExpanded=!pastHolidaysExpanded;renderPage()">${svgIcon(pastHolidaysExpanded ? 'chevronLeft' : 'chevronRight')} Past holidays (${pastHolidays.length})</button></td><td colspan="${days.length}" style="background:color-mix(in srgb,var(--muted-bg) 40%,transparent)"></td></tr>`;
      if (pastHolidaysExpanded) pastHolidays.forEach(renderHolidayRow);
    }
  }

  // ── Employee section ──────────────────────────────────────────
  if (showEmployeeSection) {
    html += `<tr class="sect-row"><td class="sticky-left" style="z-index:21"><span class="flex items-center" style="gap:6px"><button class="icon-btn" title="${collapsedGridSections.employees ? 'Expand employees' : 'Collapse employees'}" aria-label="${collapsedGridSections.employees ? 'Expand employees section' : 'Collapse employees section'}" aria-expanded="${collapsedGridSections.employees ? 'false' : 'true'}" onclick="toggleGridSection('employees')">${svgIcon(collapsedGridSections.employees ? 'chevronRight' : 'chevronDown')}</button>Employees</span></td><td colspan="${days.length}"></td></tr>`;
    if (collapsedGridSections.employees) {
      html += `<tr><td class="gempl sticky-left" style="font-size:12px;color:var(--muted);height:30px">Employees collapsed.</td><td colspan="${days.length}"></td></tr>`;
    } else {
      if (!employees.length) {
        html += `<tr><td colspan="${days.length + 1}" style="padding:40px;text-align:center;color:var(--muted)">
          No employees yet. <button class="btn btn-sm btn-primary" onclick="nav('employees')" style="margin-left:8px">Add personnel</button></td></tr>`;
      }
      const colorMap = deptColorMap();
      const departmentGroups = new Map();
      for (const group of deptGroups()) {
        if (!departmentGroups.has(group.dept)) departmentGroups.set(group.dept, []);
        departmentGroups.get(group.dept).push(group);
      }
      for (const [department, groups] of departmentGroups) {
        const deptColors = colorMap[department] || { bg: 'transparent', accent: 'var(--border)' };
        const departmentPeople = groups.reduce((count, group) => count + group.emps.length, 0);
        const orderedGroups = [...groups].sort(compareScheduleGroups);
        html += `<tr><td class="gempl sticky-left" style="background:linear-gradient(${deptColors.bg},${deptColors.bg}),var(--surface);border-bottom:2px solid ${deptColors.accent};border-right:2px solid ${deptColors.accent} !important;z-index:21;padding:3px 7px">
            <span style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:var(--muted)">${esc(department)}</span>
            <span style="font-size:10px;color:${deptColors.accent};font-weight:600"> · ${departmentPeople} ${departmentPeople === 1 ? 'person' : 'people'}</span>
          </td><td colspan="${days.length}" style="background:${deptColors.bg};opacity:.45;border-bottom:2px solid ${deptColors.accent}"></td></tr>`;
        for (const group of orderedGroups) {
          const colors = sectionGroupColor(group, deptColors);
          if (group.subdept) {
            html += `<tr><td class="gempl sticky-left" style="background:linear-gradient(${colors.bg},${colors.bg}),var(--surface);border-bottom:1px solid ${colors.accent};border-right:2px solid ${colors.accent} !important;padding:2px 7px 2px 15px">
                <span style="display:inline-flex;align-items:center;gap:4px;font-size:10px;font-weight:600;color:${colors.accent}">${svgIcon('cornerDownRight')}${esc(group.subdept)}</span>
                <span style="font-size:9px;color:var(--muted);font-weight:600"> · ${group.emps.length} ${group.emps.length === 1 ? 'person' : 'people'}</span>
              </td><td colspan="${days.length}" style="background:${colors.bg};opacity:.3;border-bottom:1px solid ${colors.accent}"></td></tr>`;
          }
          for (const emp of group.emps) {
            const teamName = emp.team || '';
            const employeeColors = resolveProcessColor(
              emp.department || 'Unassigned',
              emp.section || emp.subdepartment || '',
              emp.process || '',
            ) || (teamName ? resolveSubdepartmentColor(emp.department || 'Unassigned', teamName) : null) || colors.accent;
            const employeeRowColors = { bg: `${employeeColors}22`, accent: employeeColors };
            html += `<tr><td class="gempl sticky-left" style="background:linear-gradient(${employeeRowColors.bg},${employeeRowColors.bg}),var(--surface);border-right:2px solid var(--border) !important">
              <div class="flex items-center justify-between gap-2"><div class="emp-name">${displayEmployeeNameMarkup(emp)}</div></div>
              <div class="emp-sub">${esc(emp.role || '')}</div>
            </td>`;
            for (const d of days) {
              const ds = fmt(d);
              html += buildEmployeeCell(emp, ds, isWknd(d), ds === today);
            }
            html += '</tr>';
          }
        }
      }
    }
  }
  tbody.innerHTML = cleanHtml(html);
}

function activityPageCapacity() {
  if (window.innerHeight <= 900) return 8;
  if (window.innerHeight <= 1200) return 9;
  return 10;
}
function changeActivityPage(direction) {
  const today = todayStr();
  const { start, end } = scheduleRange();
  const yearActs = activities.filter(a => a.startDate <= end && a.endDate >= start);
  const activityFilter = normalizeActivityStatusFilter(appSettings.activityStatusFilter, appSettings.showOnlyConfirmedActivities);
  const filteredYearActs = activityFilter === 'all'
    ? yearActs
    : yearActs.filter(a => activityStatus(a) === activityFilter);
  const currentActs = filteredYearActs.filter(a => a.endDate >= today);
  const pastActs = filteredYearActs.filter(a => a.endDate < today);
  const visibleActivities = [...pastActs, ...currentActs];
  const maxOffset = Math.max(0, visibleActivities.length - activityPageSize);
  activityPageOffset = Math.min(Math.max(0, activityPageOffset + direction), maxOffset);
  renderGridBody(scheduleDays(), todayStr());
  requestAnimationFrame(() => {
    const visible = [...document.querySelectorAll('tr.activity-grid-row')];
    const target = direction > 0 ? visible.at(-1) : visible[0];
    const cell = target?.querySelector('.activity-select-cell[data-date]');
    if (cell) document.getElementById('grid-scroll')?.scrollTo({ left: Math.max(0, cell.offsetLeft - 260), behavior: 'smooth' });
  });
}
let activityWheelLocked = false;
function handleActivityListWheel(event) {
  if (gridViewMode === 'timeline' || Math.abs(event.deltaY) <= Math.abs(event.deltaX) || !event.target.closest?.('.activity-grid-row')) return;
  // While the pointer is over an activity row, always swallow vertical wheel
  // input so the surrounding page never scrolls, even mid-throttle during a
  // fast scroll burst. Only the page-change action itself is throttled.
  event.preventDefault();
  event.stopPropagation();
  if (activityWheelLocked) return;
  const direction = event.deltaY > 0 ? 1 : -1;
  const oldOffset = activityPageOffset;
  changeActivityPage(direction);
  if (activityPageOffset === oldOffset) return;
  activityWheelLocked = true;
  setTimeout(() => { activityWheelLocked = false; }, 120);
}
function scrollToActivityCell(rowKey, date) {
  const scroll = document.getElementById('grid-scroll');
  if (!scroll) return;
  const cell = scroll.querySelector(`td.activity-select-cell[data-row-key="${rowKey}"][data-date="${date}"]`)
    || scroll.querySelector(`td.activity-select-cell[data-row-key="${rowKey}"]`);
  if (!cell) return;
  cell.closest('tr')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  scroll.scrollLeft = Math.max(0, cell.offsetLeft - 240 - (scroll.clientWidth - 240) / 2 + 18);
}
function jumpToLastPastActivity(pastActivities) {
  if (!Array.isArray(pastActivities) || !pastActivities.length) return;
  const lastPast = [...pastActivities].sort((a, b) => a.endDate.localeCompare(b.endDate) || a.startDate.localeCompare(b.startDate) || a.name.localeCompare(b.name))[pastActivities.length - 1];
  const { start, end } = scheduleRange();
  const visibleDate = lastPast.endDate < start ? start : (lastPast.endDate > end ? end : lastPast.endDate);
  requestAnimationFrame(() => scrollToActivityCell(`act-${lastPast.id}`, visibleDate));
}
function updatePastActivitiesToggle() {
  document.querySelectorAll('.activity-past-toggle').forEach(button => {
    button.classList.toggle('active', pastActivitiesExpanded);
    button.setAttribute('aria-pressed', String(pastActivitiesExpanded));
    button.style.cssText = pastActivitiesExpanded
      ? 'background:var(--accent-blue);color:#fff;box-shadow:0 0 0 1px color-mix(in srgb,var(--accent-blue) 80%,#000)'
      : '';
  });
}
function togglePastActivities() {
  if (pastActivitiesExpanded) {
    pastActivitiesExpanded = false;
    activityPageOffset = 0;
    updatePastActivitiesToggle();
    renderGridBody(scheduleDays(), todayStr());
    return;
  }
  pastActivitiesExpanded = true;
  // Showing past activities must also reveal the Activities section when it
  // was previously collapsed; otherwise the state changes but no rows are
  // visible to the user.
  collapsedGridSections.activities = false;
  saveGridPreferences();
  activityPageOffset = 0;
  updatePastActivitiesToggle();
  const { start, end } = scheduleRange();
  const filter = normalizeActivityStatusFilter(appSettings.activityStatusFilter, appSettings.showOnlyConfirmedActivities);
  const pastActivities = activities
    .filter(activity => activity.startDate <= end && activity.endDate >= start && activity.endDate < todayStr())
    .filter(activity => filter === 'all' || activityStatus(activity) === filter);
  renderGridBody(scheduleDays(), todayStr());
  if (pastActivities.length) requestAnimationFrame(() => jumpToLastPastActivity(pastActivities));
}
function jumpToActivity(activityId) {
  const activity = activities.find(act => Number(act.id) === Number(activityId));
  if (!activity) return;
  const isPast = activity.endDate < todayStr();
  if (isPast && !pastActivitiesExpanded) {
    pastActivitiesExpanded = true;
    activityPageOffset = 0;
    jumpToLastPastActivity();
    return;
  }
  const { start, end } = scheduleRange();
  const visibleDate = activity.endDate < start ? start : (activity.endDate > end ? end : activity.endDate);
  requestAnimationFrame(() => scrollToActivityCell(activity.id, visibleDate));
}
function jumpToLastPastActivity() {
  const today = todayStr();
  const { start, end } = scheduleRange();
  const yearActs = activities.filter(a => a.startDate <= end && a.endDate >= start);
  const activityFilter = normalizeActivityStatusFilter(appSettings.activityStatusFilter, appSettings.showOnlyConfirmedActivities);
  const filteredYearActs = activityFilter === 'all'
    ? yearActs
    : yearActs.filter(a => activityStatus(a) === activityFilter);
  const currentActs = filteredYearActs.filter(a => a.endDate >= today);
  const pastActs = filteredYearActs.filter(a => a.endDate < today);
  if (!pastActs.length) {
    activityPageOffset = 0;
    renderGridBody(scheduleDays(), today);
    return;
  }
  const visibleActivities = [...pastActs, ...currentActs];
  const pageSize = gridViewMode !== 'timeline' ? activityPageCapacity() : Math.max(1, visibleActivities.length);
  const lastPastIndex = pastActs.length - 1;
  activityPageOffset = gridViewMode !== 'timeline' ? Math.floor(lastPastIndex / pageSize) * pageSize : 0;
  renderGridBody(scheduleDays(), today);
  const latestPastActivity = [...pastActs].sort((left, right) =>
    left.endDate.localeCompare(right.endDate)
    || left.startDate.localeCompare(right.startDate)
    || left.name.localeCompare(right.name, 'nb', { sensitivity: 'base' })
  ).at(-1);
  if (!latestPastActivity) return;
  const visibleDate = latestPastActivity.endDate < start ? start : (latestPastActivity.endDate > end ? end : latestPastActivity.endDate);
  requestAnimationFrame(() => scrollToActivityCell(latestPastActivity.id, visibleDate));
}
function scrollToActivityCell(activityId, dateString) {
  if (!activityId || !dateString) return false;
  const selector = `[data-row-key="act-${activityId}"][data-date="${dateString}"]`;
  const cell = document.querySelector(selector);
  if (!cell) return false;
  document.querySelectorAll('.activity-jump-focus').forEach(selected => selected.classList.remove('activity-jump-focus'));
  cell.classList.add('activity-jump-focus');
  cell.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
  clearTimeout(scrollToActivityCell._timer);
  scrollToActivityCell._timer = setTimeout(() => cell.classList.remove('activity-jump-focus'), 2400);
  return true;
  const nextExpanded = !pastActivitiesExpanded;
  pastActivitiesExpanded = nextExpanded;
  if (nextExpanded) {
    const visibleActivities = [...currentActs, ...pastActs];
    const maxOffset = Math.max(0, Math.floor((visibleActivities.length - 1) / activityPageSize) * activityPageSize);
    activityPageOffset = maxOffset;
  } else {
    activityPageOffset = 0;
  }
  renderGridBody(scheduleDays(), todayStr());
  if (nextExpanded) jumpToLastPastActivity(pastActs);
}

function cellActivities(empId, ds) {
  const employee = empById(empId);
  return activities
    .filter(act => {
      if (!(ds >= act.startDate && ds <= act.endDate && participantFor(act, empId) && activityRelevantToEmployee(act, employee))) return false;
      const assignment = activityAssignment(`${empId}_${ds}_${act.id}`);
      return assignment.assigned === true && !assignment.excluded;
    })
    .map(act => {
      const assignment = activityAssignment(`${empId}_${ds}_${act.id}`);
      const workCode = (appSettings.workCodes || []).find(code => code.id === assignment.workCodeId);
      return {
        ...act,
        isStart: ds === act.startDate, isEnd: ds === act.endDate,
        assignment,
        workCodeId: assignment.workCodeId,
        workCode,
      };
    })
    .sort((a, b) => a.id - b.id);
}
function workwheelCellEvents(empId, ds) {
  if (typeof workwheelState === 'undefined') return [];
  const mode = ['cells', 'both', 'row'].includes(appSettings.workwheelGridDisplayMode) ? appSettings.workwheelGridDisplayMode : 'cells';
  if (mode === 'row') return [];
  return workwheelState.activities.filter(activity => {
    const participant = (activity.participantIds || []).map(Number).includes(Number(empId));
    const responsible = activity.responsibleMode !== 'external' && Number(activity.responsibleId) === Number(empId);
    if (!participant && !responsible || !activity.date || ds < activity.date || ds > (activity.endDate || activity.date)) return false;
    if (activity.recurrence === 'none') return ds === activity.date;
    const start = new Date(`${activity.date}T00:00:00`), current = new Date(`${ds}T00:00:00`);
    const elapsed = Math.round((current - start) / 86400000);
    return elapsed >= 0 && ((activity.recurrence === 'daily') || (activity.recurrence === 'weekly' && elapsed % 7 === 0) || (activity.recurrence === 'fortnightly' && elapsed % 14 === 0) || (activity.recurrence === 'monthly' && current.getDate() === start.getDate()));
  });
}
// All participant activities for the date regardless of shift/work-code assignment, so boss checks aren't limited to assigned cells.
function participantActivitiesForDate(empId, ds) {
  return activities.filter(act => ds >= act.startDate && ds <= act.endDate && participantFor(act, empId));
}
function bossCheckKey(empId, date, kind, id) {
  return `${empId}_${date}_boss_${kind}_${encodeURIComponent(String(id))}`;
}
function isBossCheckSet(empId, date, kind, id) {
  const currentKey = bossCheckKey(empId, date, kind, id);
  if (workScheduleChecksMap[currentKey] === true) return true;
  return kind === 'activity' && workScheduleChecksMap[`${empId}_${date}_${id}`] === true;
}
function canHostedCheckOff() { return hostedMode && hostedUser?.role === 'admin' && operationalChecksEnabled; }
function hostedOperationalCheckSet(employeeId, date, subjectKind, subjectKey) {
  return hostedOperationalChecks.has(`${employeeId}|${date}|${subjectKind}|${subjectKey}`);
}
function toggleAdminCheckIndicators() {
  if (!canHostedCheckOff()) return;
  showAdminCheckIndicators = !showAdminCheckIndicators;
  renderGrid();
}
function bossCheckDates(empId, kind, id, dates = pickerDates) {
  const candidateDates = Array.isArray(dates) ? dates : [];
  if (kind === 'status') return candidateDates.filter(date => getEntryObj(`${empId}_${date}`)?.status === id);
  const activity = activities.find(item => Number(item.id) === Number(id));
  if (!activity || !participantFor(activity, empId)) return [];
  return candidateDates.filter(date => date >= activity.startDate && date <= activity.endDate && activityRelevantToEmployee(activity, empById(empId)));
}
function bossCheckState(empId, kind, id) {
  const dates = bossCheckDates(empId, kind, id);
  if (!dates.length) return 'none';
  const checkedCount = dates.filter(date => isBossCheckSet(empId, date, kind, id)).length;
  return checkedCount === dates.length ? 'all' : (checkedCount ? 'some' : 'none');
}

function isEmployeeBirthday(emp, dateString) {
  if (!emp || !emp.birthday || !dateString) return false;
  const birthday = new Date(`${emp.birthday}T00:00:00`);
  if (Number.isNaN(birthday.getTime())) return false;
  const date = new Date(`${dateString}T00:00:00`);
  return birthday.getMonth() === date.getMonth() && birthday.getDate() === date.getDate();
}
function activityDisplayName(activity, maxLength = 25) {
  const name = `${activity?.source === 'workwheel' || activity?.sourceActivityId != null ? '↻ ' : ''}${String(activity?.name || '').trim()}`;
  const characters = Array.from(name);
  if (characters.length <= maxLength) return name;
  return `${characters.slice(0, Math.max(1, maxLength - 1)).join('')}…`;
}
function activityCellLabel(activity, spanDays = 1) {
  const name = String(activity?.name || '').trim();
  const abbreviation = String(activity?.abbreviation || '').trim().toUpperCase();
  const compact = value => {
    const normalized = String(value || '').replace(/[^A-Z0-9]/g, '');
    if (normalized.length <= 4) return normalized;
    const consonants = normalized[0] + normalized.slice(1).replace(/[AEIOU]/g, '');
    return consonants.slice(0, 4);
  };
  const availableCharacters = gridPeriod === 'year' ? Math.max(4, spanDays * 4) : 6;
  if (abbreviation) return gridPeriod === 'year' ? compact(abbreviation) : abbreviation.slice(0, 6);
  if (name && name.length <= availableCharacters) return name;
  return compact(name);
}

function buildEmployeeCell(emp, ds, weekend, isToday) {
  const holiday = displayedHolidayFor(ds);
  const entry = getEntryObj(`${emp.id}_${ds}`);
  const overtime = overtimeMap[`${emp.id}_${ds}`] || null;
  const cellNote = cellNotesMap[`${emp.id}_${ds}`] || '';
  const si = entry ? siFor(entry.status) : null;
  const isPartial = entry?.durationType === 'time';
  const isPlannedStatus = statusEntryIsPlanned(entry);
  const acts = cellActivities(emp.id, ds);
  const workwheelEvents = workwheelCellEvents(emp.id, ds);
  const pendingAbsenceRequest = hostedMode && hostedUser?.role === 'admin' && typeof hostedPendingAbsenceRequests !== 'undefined'
    ? hostedPendingAbsenceRequests.find(request => Number(request.employeeId) === Number(emp.id) && ds >= request.startDate && ds <= request.endDate)
    : null;
  const pendingAbsenceStatus = pendingAbsenceRequest ? siFor(pendingAbsenceRequest.statusKey) : null;
  const rotation = rotationRecord(emp.id, ds);
  const rotationMeta = rotationShiftMeta(rotation?.shift);
  const birthday = isEmployeeBirthday(emp, ds);

  const tipParts = [];
  if (holiday?.isSpecialDay && !acts.length) tipParts.push(`Special day: ${holiday.name}${holiday.nonWorking ? ' (non-working)' : ''}`);
  if (rotationMeta) tipParts.push(`${rotationMeta.label}${rotationMeta.range ? ` (${rotationMeta.range})` : ''}${rotation?.shift === 'leave' ? '\nOff work — no planned hours' : '\nReserved for Shift Rotation'}`);
  acts.forEach(act => {
    const shift = activityShiftMeta(act, act.assignment.shift);
    let detail = `Activity: ${act.name}`;
    if (act.workCode) {
      const administrativeValue = act.workCode.aggregationMode === 'days'
        ? '1d'
        : (act.workCode.durationMode === 'fixed'
          ? `${formatHoursNumber(act.workCode.fixedHours)}h`
          : (act.assignment.administrativeTime
            ? `${act.assignment.administrativeTime} (${formatHoursNumber(timeRangeHours(act.assignment.administrativeTime))}h)`
            : 'Not entered'));
      detail += `\nCode: ${act.workCode.name} (${act.workCode.abbreviation})\nAdministrative: ${administrativeValue}`;
    }
    else detail += '\nCode: None';
    if (shift) detail += `\nShift: ${shift.label}${shift.range ? ` (${shift.range})` : ''}`;
    tipParts.push(detail);
  });
  if (si) {
    let t = `Status: ${si.label}`;
    if (isPartial && entry.time) t += ` (${entry.time})`;
    else if (entry.durationType === '24hours') t += ' (24 hours)';
    tipParts.push(t);
  }
  if (overtime) tipParts.push(`Overtime: ${formatHoursNumber(overtime.hours)}h${overtime.note ? ` (${overtime.note})` : ''}`);
  if (cellNote) tipParts.push(`Note: ${cellNote}`);
  if (birthday) tipParts.push(`Birthday: ${emp.name}`);
  workwheelEvents.forEach(event => tipParts.push(`Workwheel: ${event.title}${event.startTime && event.endTime ? `\nTime: ${event.startTime}–${event.endTime}` : '\nAll day'}`));
  if (!tipParts.length) tipParts.push('Click to set status');

  const primaryActivity = rotationMeta ? null : acts[0];
  const workwheelMarker = workwheelEvents.length ? `<span class="workwheel-cell-marker" style="--workwheel-color:${esc(workwheelEvents[0].color || '#3b82f6')}" title="${esc(workwheelEvents.map(event => event.title).join('\n'))}">◉${workwheelEvents.length > 1 ? `<small>${workwheelEvents.length}</small>` : ''}</span>` : '';
  const checkedActivity = bossSessionActive ? participantActivitiesForDate(emp.id, ds).find(act => activityRelevantToEmployee(act, emp) && isBossCheckSet(emp.id, ds, 'activity', act.id)) : null;
  const checkedStatus = bossSessionActive && si && isBossCheckSet(emp.id, ds, 'status', si.key) ? si : null;
  const activitySpanDays = primaryActivity ? Math.max(1, Math.round((new Date(`${primaryActivity.endDate}T00:00:00`) - new Date(`${primaryActivity.startDate}T00:00:00`)) / 86400000) + 1) : 1;
  const gridActivityLabel = primaryActivity ? activityCellLabel(primaryActivity, activitySpanDays) : '';
  const activeWorkCode = primaryActivity?.workCode || null;
  let cellText = '', cellStyleStr = '';
  if (primaryActivity) {
    cellText = !activeWorkCode && primaryActivity.assignment.shift === 'normal'
      ? gridActivityLabel
      : (activeWorkCode?.abbreviation || gridActivityLabel);
    const activityColor = activeWorkCode?.color || primaryActivity.color;
    cellStyleStr = activityStatus(primaryActivity) === 'tentative'
      ? `background:repeating-linear-gradient(135deg,color-mix(in srgb,${activityColor} 28%,transparent) 0 5px,color-mix(in srgb,${activityColor} 7%,transparent) 5px 10px);color:${activityColor}`
      : `background:${activityColor}20;color:${activityColor}`;
  } else if (!isPartial && pendingAbsenceStatus && pendingAbsenceRequest) {
    cellText = pendingAbsenceStatus.abbr;
    cellStyleStr = `background:repeating-linear-gradient(135deg,${pendingAbsenceStatus.color}30 0 5px,${pendingAbsenceStatus.color}12 5px 10px);color:${pendingAbsenceStatus.color};border-color:${pendingAbsenceStatus.color}50`;
  } else if (!isPartial && si) {
    cellText = si.abbr;
    cellStyleStr = isPlannedStatus
      ? `background:repeating-linear-gradient(135deg,${si.color}30 0 5px,${si.color}12 5px 10px);color:${si.color};border-color:${si.color}50`
      : statusStyle(si.color);
  } else if (isPartial && si) {
    cellText = si.abbr;
    cellStyleStr = `color:${si.color}`;
  }

  const customActivityShift = primaryActivity?.assignment.shift && !['normal', 'day', 'evening', 'night', 'turn'].includes(primaryActivity.assignment.shift);
  const dot = customActivityShift
    ? `<div class="status-dot" style="background:${activeWorkCode?.color || primaryActivity.color}"></div>`
    : ((isPartial && si && !primaryActivity) ? `<div class="status-dot" style="background:${si.color}"></div>` : '');
  const activityStatusBadge = primaryActivity && si ? `<div class="activity-status-badge" title="${esc(si.label)}" style="color:${si.color}">${esc(si.abbr)}</div>` : '';
  const shiftMeta = primaryActivity ? activityShiftMeta(primaryActivity, primaryActivity.assignment.shift) : null;
  const shiftSymbol = !customActivityShift && shiftMeta?.icon ? `<span class="shift-symbol">${shiftMeta.icon}</span>` : '';
  if (primaryActivity && activityStatus(primaryActivity) === 'tentative') tipParts.push('Planned assignment');
  const isCancelledActivity = primaryActivity && activityStatus(primaryActivity) === 'cancelled';
  const holidayTint = holiday && !primaryActivity && !si
    ? `background:${holiday.color || '#ef4444'}28 !important;color:${holiday.color || '#ef4444'} !important;border-color:${holiday.color || '#ef4444'}55;${weekend ? 'filter:brightness(.86);' : ''}`
    : '';
  const birthdayBadge = birthday ? `<span class="birthday-cake" title="Birthday">${svgIcon('cake', 'Birthday')}</span>` : '';
  const overtimeBadge = overtime
    ? `<span class="overtime-badge" title="Overtime: ${formatHoursNumber(overtime.hours)}h${overtime.note ? ` · ${esc(overtime.note)}` : ''}">OT ${formatHoursNumber(overtime.hours)}h</span>`
    : '';
  const hostedCheckSubjectKind = primaryActivity || si ? 'schedule_cell' : null;
  const hostedCheckSubjectKey = primaryActivity || si ? 'cell' : null;
  const hostedCheckSet = hostedCheckSubjectKind && hostedCheckSubjectKey ? hostedOperationalCheckSet(emp.id, ds, hostedCheckSubjectKind, hostedCheckSubjectKey) : false;
  const workScheduleCheckBadge = showAdminCheckIndicators && bossSessionActive && (checkedActivity || checkedStatus) ? `<span class="work-schedule-check" title="Checked off by an administrator">✓</span>` : '';
  const adminCheckButton = '';

  const fullDayStatusStyle = !primaryActivity && !isPartial && si && !isPlannedStatus
    ? `background:${si.color}20 !important;color:${si.color} !important;`
    : '';
  const finalCellStyle = `${cellStyleStr}${holidayTint}${fullDayStatusStyle}${planningHorizonStyle(ds)}`;

  const shiftClass = rotationMeta ? ' rotation-reserved-cell' : (primaryActivity?.assignment.shift === 'day'
    ? ' day-shift-cell'
     : (primaryActivity?.assignment.shift === 'evening' ? ' evening-shift-cell' : (primaryActivity?.assignment.shift === 'night' ? ' night-shift-cell' : '')));
  const activityClass = primaryActivity ? ' has-activity' : '';
  const plannedClass = (primaryActivity && activityStatus(primaryActivity) === 'tentative') || Boolean(pendingAbsenceRequest) ? ' planned-activity-cell' : '';
  const activityColor = activeWorkCode?.color || primaryActivity?.color || 'transparent';
  const activityTextStyle = primaryActivity ? `color:${activityColor};` : '';
  const cancelledTextStyle = isCancelledActivity ? 'text-decoration:line-through;text-decoration-color:var(--destructive);text-decoration-thickness:2px;' : '';

  const rotationMarker = rotationMeta ? `<span class="rotation-marker${rotation?.shift === 'leave' ? ' rotation-leave-marker' : ''}${rotation?.shift === 'overtime' ? ' rotation-overtime-marker' : ''}" title="${esc(rotationMeta.label)}">${rotation?.shift === 'leave' ? 'OFF' : (rotation?.shift === 'overtime' ? 'OT' : 'SR')}</span><span class="shift-symbol rotation-shift-symbol">${rotationMeta.icon}</span>` : '';
  return `<td class="gday status-cell${weekend ? ' weekend' : ''}${isToday ? ' today-col' : ''}${holiday ? ' holiday-col' : ''}${shiftClass}${activityClass}${plannedClass}${isPlannedStatus ? ' planned-status-cell' : ''}${showAdminCheckIndicators && (checkedActivity || checkedStatus || hostedCheckSet) ? ' work-schedule-checked-cell' : ''}${showAdminCheckIndicators && canHostedCheckOff() && hostedCheckSubjectKind ? ' admin-check-mode-cell' : ''}"
    data-empid="${emp.id}" data-date="${ds}" title="${esc(tipParts.join('\n'))}" style="--shift-color:${activityColor};--activity-color:${primaryActivity?.color || 'transparent'};--holiday-color:${holiday?.color || '#ef4444'};${finalCellStyle}"
    onpointerdown="startCellSelection(event,${emp.id},'${ds}')"
     onclick="handleCellClick(event,${emp.id},'${ds}')"
  oncontextmenu="openPicker(event,${emp.id},'${ds}'); return false;">${rotationMarker}${rotation ? '' : `${dot}${activityStatusBadge}${shiftSymbol}${overtimeBadge}${workScheduleCheckBadge}${adminCheckButton}`}<div class="gday-inner" style="${rotationMeta ? 'color:var(--accent-blue);font-weight:800;' : `${activityTextStyle}${cancelledTextStyle}`}"">${rotationMeta ? '' : esc(cellText)}${rotation ? '' : birthdayBadge}</div>${workwheelMarker}</td>`;
}

// The compact rotationMarker is the sole SR/OFF/OT label in Schedule cells.
function updateCell(empId, ds) {
  const cell = document.querySelector(`td[data-empid="${empId}"][data-date="${ds}"]`);
  const emp = empById(empId);
  if (!cell || !emp) return;
  const tmp = document.createElement('tbody');
  tmp.innerHTML = `<tr>${buildEmployeeCell(emp, ds, cell.classList.contains('weekend'), cell.classList.contains('today-col'))}</tr>`;
  cell.replaceWith(tmp.querySelector('td'));
}

function scrollToToday() {
  const scroll = document.getElementById('grid-scroll');
  if (!scroll) return;
  const th = scroll.querySelector(`th[data-date="${todayStr()}"]`);
  if (!th) return;
  const scrollRect = scroll.getBoundingClientRect();
  const headerRect = th.getBoundingClientRect();
  const sticky = scroll.querySelector('th.sticky-left, td.sticky-left');
  const stickyWidth = sticky ? sticky.getBoundingClientRect().width : 0;
  const targetLeft = headerRect.left - scrollRect.left + scroll.scrollLeft;
  const visibleWidth = Math.max(0, scroll.clientWidth - stickyWidth);
  scroll.scrollLeft = Math.max(0, targetLeft - stickyWidth - Math.max(0, (visibleWidth - headerRect.width) / 2));
}
function goToday() {
  const y = new Date().getFullYear();
  scheduleAnchorDate = todayStr();
  const focusToday = () => {
    if (currentPage === 'shift-rotation') {
      document.querySelector(`.rotation-day-head[data-date="${todayStr()}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    } else scrollToToday();
  };
  if (gridPeriod === 'year' && gridYear !== y) {
    gridYear = y;
    saveGridPreferences();
    renderPage();
    setTimeout(focusToday, 60);
  } else {
    saveGridPreferences();
    renderPage();
    setTimeout(focusToday, 60);
  }
}
function jumpToScheduleDate(value) {
  if (!isValidIsoDate(value)) return;
  const target = new Date(`${value}T00:00:00`);
  const requestedPeriod = gridPeriod;
  if (gridPeriod === 'year') {
    gridYear = target.getFullYear();
    scheduleAnchorDate = value;
  } else {
    scheduleAnchorDate = value;
  }
  saveGridPreferences();
  renderPage();
  setTimeout(() => {
    const scroll = document.getElementById('grid-scroll');
    const header = scroll?.querySelector(`th[data-date="${value}"]`);
    if (requestedPeriod === 'year' && !header) {
      const firstHeader = scroll?.querySelector('th[data-date]');
      if (firstHeader) {
        const firstDate = firstHeader.dataset.date;
        jumpToScheduleDate._fallbackDate = value;
        firstHeader.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        setTimeout(() => {
          const targetHeader = scroll.querySelector(`th[data-date="${value}"]`);
          if (targetHeader) targetHeader.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }, 120);
      }
      return;
    }
    if (!scroll || !header) return;
    document.querySelectorAll('.jump-date-highlight').forEach(element => element.classList.remove('jump-date-highlight'));
    scroll.querySelectorAll(`[data-date="${value}"]`).forEach(element => element.classList.add('jump-date-highlight'));
    const sticky = scroll.querySelector('th.sticky-left, td.sticky-left');
    const stickyWidth = sticky?.getBoundingClientRect().width || 0;
    const scrollRect = scroll.getBoundingClientRect();
    const headerRect = header.getBoundingClientRect();
    const targetLeft = headerRect.left - scrollRect.left + scroll.scrollLeft;
    const visibleWidth = Math.max(0, scroll.clientWidth - stickyWidth);
    scroll.scrollLeft = Math.max(0, targetLeft - stickyWidth - Math.max(0, (visibleWidth - headerRect.width) / 2));
    clearTimeout(jumpToScheduleDate._highlightTimer);
    jumpToScheduleDate._highlightTimer = setTimeout(() => {
      document.querySelectorAll('.jump-date-highlight').forEach(element => element.classList.remove('jump-date-highlight'));
    }, 5000);
  }, 80);
}
function changeGridYear(delta) {
  gridYear += delta;
  saveGridPreferences();
  renderPage();
}
function setGridPeriod(period) {
  gridPeriod = normalizeGridPeriod(period);
  if (gridPeriod !== 'year') scheduleAnchorDate = todayStr();
  saveGridPreferences();
  renderPage();
}
function changeGridPeriod(delta) {
  if (gridPeriod === 'year') return changeGridYear(delta);
  const date = new Date(`${scheduleAnchorDate}T00:00:00`);
  date.setDate(date.getDate() + (gridPeriod === 'week' ? delta * 7 : 0));
  if (gridPeriod === 'month') date.setMonth(date.getMonth() + delta);
  scheduleAnchorDate = fmt(date);
  saveGridPreferences();
  renderPage();
}
function showAllEmployees() {
  hiddenEmployees.clear();
  saveGridPreferences();
  renderPage();
}

// ═══ GRID RANGE SELECTION ════════════════════════════════════════════════════
function datesBetween(a, b) {
  const start = a <= b ? a : b, end = a <= b ? b : a;
  const result = [];
  for (const d = new Date(start + 'T00:00:00'); fmt(d) <= end; d.setDate(d.getDate() + 1)) result.push(fmt(d));
  return result;
}
function activityCellFromEl(el) {
  return el?.closest?.('td.activity-select-cell') || null;
}
function paintActivityRangeSelection() {
  if (!activityRangeSelection.rowKey) return;
  const start = activityRangeSelection.startDate <= activityRangeSelection.endDate ? activityRangeSelection.startDate : activityRangeSelection.endDate;
  const end = activityRangeSelection.startDate <= activityRangeSelection.endDate ? activityRangeSelection.endDate : activityRangeSelection.startDate;
  document.querySelectorAll(`td.activity-select-cell[data-row-key="${activityRangeSelection.rowKey}"]`).forEach(cell => {
    cell.classList.toggle('cell-selected', cell.dataset.date >= start && cell.dataset.date <= end);
  });
}
function clearActivityRangeSelection() {
  activityRangeSelection = { active: false, rowKey: null, startDate: null, endDate: null, dates: [] };
  document.querySelectorAll('td.activity-select-cell.cell-selected').forEach(cell => cell.classList.remove('cell-selected'));
}
function onActivityRangeDragMove(event) {
  if (!activityRangeSelection.active) return;
  const el = document.elementFromPoint(event.clientX, event.clientY);
  const cell = activityCellFromEl(el);
  if (!cell) return;
  const rowKey = cell.dataset.rowKey;
  const date = cell.dataset.date;
  if (!rowKey || !date || rowKey !== activityRangeSelection.rowKey) return;
  if (date === activityRangeSelection.endDate) return;
  activityRangeSelection.endDate = date;
  activityRangeSelection.dates = datesBetween(activityRangeSelection.startDate, date);
  paintActivityRangeSelection();
}
function finishActivityRangeSelection(event) {
  document.removeEventListener('pointermove', onActivityRangeDragMove);
  document.removeEventListener('pointerup', finishActivityRangeSelection);
  document.removeEventListener('pointercancel', finishActivityRangeSelection);
  if (!activityRangeSelection.active) return;
  activityRangeSelection.active = false;
  if (event.type === 'pointercancel' || activityRangeSelection.dates.length < 2) {
    clearActivityRangeSelection();
    return;
  }
  suppressActivityCellClick = true;
  openActivityFromRange(activityRangeSelection.dates);
  clearActivityRangeSelection();
}
function startActivityRangeSelection(event, rowKey, date) {
  if (event.button !== 0) return;
  event.preventDefault();
  event.stopPropagation();
  event.currentTarget.setPointerCapture(event.pointerId);
  suppressActivityCellClick = false;
  activityRangeSelection = { active: true, rowKey, startDate: date, endDate: date, dates: [date] };
  paintActivityRangeSelection();
  document.addEventListener('pointermove', onActivityRangeDragMove);
  document.addEventListener('pointerup', finishActivityRangeSelection);
  document.addEventListener('pointercancel', finishActivityRangeSelection);
}
function handleActivityCellClick(event, actId) {
  if (suppressActivityCellClick) {
    suppressActivityCellClick = false;
    event.stopPropagation();
    return;
  }
  openActModal(actId);
}
function paintCellSelection() {
  if (cellSelection.empId === null) return;
  const start = cellSelection.startDate <= cellSelection.endDate ? cellSelection.startDate : cellSelection.endDate;
  const end = cellSelection.startDate <= cellSelection.endDate ? cellSelection.endDate : cellSelection.startDate;
  document.querySelectorAll(`td.status-cell[data-empid="${cellSelection.empId}"]`).forEach(cell => {
    cell.classList.toggle('cell-selected', cell.dataset.date >= start && cell.dataset.date <= end);
  });
}
function clearCellSelection() {
  cellSelection = { active: false, empId: null, startDate: null, endDate: null, dates: [] };
  document.querySelectorAll('.cell-selected').forEach(cell => cell.classList.remove('cell-selected'));
}
function cellFromEl(el) {
  return el?.closest?.('td.status-cell') || null;
}
function onDragMove(event) {
  if (!cellSelection.active) return;
  const el = document.elementFromPoint(event.clientX, event.clientY);
  const cell = cellFromEl(el);
  if (!cell) return;
  const empId = +cell.dataset.empid;
  const date = cell.dataset.date;
  if (!date || empId !== cellSelection.empId) return;
  if (date === cellSelection.endDate) return;
  cellSelection.endDate = date;
  cellSelection.dates = datesBetween(cellSelection.startDate, date);
  paintCellSelection();
}
function finishCellSelection(event) {
  document.removeEventListener('pointermove', onDragMove);
  document.removeEventListener('pointerup',     finishCellSelection);
  document.removeEventListener('pointercancel', finishCellSelection);
  if (!cellSelection.active) return;
  cellSelection.active = false;
  if (event.type === 'pointercancel' || cellSelection.dates.length < 2) return;
  const empId = cellSelection.empId;
  const dates = [...cellSelection.dates];
  _showPicker(event, empId, dates);
  suppressCellClick = true;
}
function startCellSelection(event, empId, date) {
  if (event.button !== 0) return;
  event.preventDefault();
  event.currentTarget.setPointerCapture(event.pointerId);
  suppressCellClick = false;
  pendingRangeSelection = null;
  cellSelection = { active: true, empId, startDate: date, endDate: date, dates: [date] };
  paintCellSelection();
  document.addEventListener('pointermove',   onDragMove);
  document.addEventListener('pointerup',     finishCellSelection);
  document.addEventListener('pointercancel', finishCellSelection);
}
function paintHolidayRangeSelection() {
  if (!holidayRangeSelection.startDate || !holidayRangeSelection.endDate) return;
  const start = holidayRangeSelection.startDate <= holidayRangeSelection.endDate ? holidayRangeSelection.startDate : holidayRangeSelection.endDate;
  const end = holidayRangeSelection.startDate <= holidayRangeSelection.endDate ? holidayRangeSelection.endDate : holidayRangeSelection.startDate;
  document.querySelectorAll('td.holiday-select-cell').forEach(cell => {
    cell.classList.toggle('holiday-range-selected', cell.dataset.date >= start && cell.dataset.date <= end);
  });
}
function clearHolidayRangeSelection() {
  holidayRangeSelection = { active: false, startDate: null, endDate: null, dates: [] };
  document.querySelectorAll('.holiday-range-selected').forEach(cell => cell.classList.remove('holiday-range-selected'));
}
function onHolidayRangeDragMove(event) {
  if (!holidayRangeSelection.active) return;
  const cell = document.elementFromPoint(event.clientX, event.clientY)?.closest?.('td.holiday-select-cell');
  if (!cell?.dataset.date || cell.dataset.date === holidayRangeSelection.endDate) return;
  holidayRangeSelection.endDate = cell.dataset.date;
  holidayRangeSelection.dates = datesBetween(holidayRangeSelection.startDate, cell.dataset.date);
  paintHolidayRangeSelection();
}
function finishHolidayRangeSelection(event) {
  document.removeEventListener('pointermove', onHolidayRangeDragMove);
  document.removeEventListener('pointerup', finishHolidayRangeSelection);
  document.removeEventListener('pointercancel', finishHolidayRangeSelection);
  if (!holidayRangeSelection.active) return;
  const dates = [...holidayRangeSelection.dates];
  const startDate = dates[0];
  const endDate = dates[dates.length - 1];
  holidayRangeSelection.active = false;
  if (event.type === 'pointercancel' || dates.length < 2) {
    clearHolidayRangeSelection();
    return;
  }
  clearHolidayRangeSelection();
  pendingHolidayRange = { startDate, endDate };
  openHolidayModal();
}
function startHolidayRangeSelection(event, date) {
  if (event.button !== 0 || !date) return;
  event.preventDefault();
  event.stopPropagation();
  event.currentTarget.setPointerCapture?.(event.pointerId);
  holidayRangeSelection = { active: true, startDate: date, endDate: date, dates: [date] };
  paintHolidayRangeSelection();
  document.addEventListener('pointermove', onHolidayRangeDragMove);
  document.addEventListener('pointerup', finishHolidayRangeSelection);
  document.addEventListener('pointercancel', finishHolidayRangeSelection);
}

// ═══ STATUS PICKER ═══════════════════════════════════════════════════════════
function _showPicker(event, empId, dates) {
  pickerEmpId = empId;
  pickerDates = dates;
  pickerDate = dates[0];
  pickerSelectedStatus = null;
  const emp = empById(empId);
  const dateLabel = pickerDates.length > 1
    ? `${fmtMed(pickerDates[0])} – ${fmtMed(pickerDates[pickerDates.length - 1])} (${pickerDates.length} days)`
    : fmtMed(pickerDate);
  document.getElementById('pk-head').innerHTML = `<b>${esc(emp?.name || '')}</b>${dateLabel}`;

  const acts = activities.filter(act => actParticipantIds(act).includes(empId) && activityRelevantToEmployee(act, emp) && pickerDates.some(date => date >= act.startDate && date <= act.endDate));
  const entry = getEntryObj(`${empId}_${pickerDate}`);
  pickerStatusLifecycle = entry?.lifecycle || 'confirmed';
  if (bossSessionActive) {
    document.getElementById('pk-status-section').style.display = 'none';
    document.getElementById('pk-duration-section').style.display = 'none';
    document.getElementById('pk-note-section').innerHTML = '';
    document.getElementById('pk-overtime-section').innerHTML = '';
    document.getElementById('pk-clear-btn').style.display = 'none';
    document.getElementById('pk-add-activity-btn').style.display = 'none';
  } else {
    document.getElementById('pk-status-section').style.display = 'flex';
    const btns = document.getElementById('pk-status-btns');
    btns.innerHTML = statuses.length
      ? statuses.map(s => `<button class="pk-btn${entry?.status === s.key ? ' pk-sel' : ''}" title="${esc(s.label)}" style="${statusStyle(s.color)};border:1px solid ${s.color}50${entry?.status === s.key && statusEntryIsPlanned(entry) ? ';background:repeating-linear-gradient(135deg,' + s.color + '30 0 5px,' + s.color + '12 5px 10px)' : ''}" onclick="pickStatusById(${s.id})"><span class="pk-initial">${esc(s.abbr)}</span><span class="pk-status-label">${esc(s.label)}</span></button>`).join('')
      : '<div style="padding:4px 6px;font-size:11.5px;color:var(--muted)">No daily statuses configured.</div>';
    document.getElementById('pk-duration-section').style.display = 'none';
    document.getElementById('pk-time').value = (entry?.durationType === 'time' && entry.time) ? entry.time : '';
    const cellNotes = pickerDates.map(date => cellNotesMap[`${empId}_${date}`] || '');
    const sharedCellNote = cellNotes.length && cellNotes.every(note => note === cellNotes[0]) ? cellNotes[0] : '';
    document.getElementById('pk-note-section').innerHTML = `<div class="pk-sep"></div><div class="pk-label">Cell note</div><div class="pk-shift-box"><div class="pk-field"><span class="pk-field-label">Note${pickerDates.length > 1 ? ' for selected dates' : ''}</span><textarea class="pk-input" id="pk-cell-note" maxlength="240" rows="2" placeholder="Meeting, absence reason, or other context">${esc(sharedCellNote)}</textarea></div><div class="pk-save-row"><button class="pk-clear" ${cellNotes.some(Boolean) ? '' : 'disabled'} onclick="removeCellNote()">Remove note</button><button class="btn btn-sm btn-primary" onclick="saveCellNote()">Save note</button></div></div>`;
    const overtimeEntries = pickerDates.map(date => overtimeMap[`${empId}_${date}`]).filter(Boolean);
    const sharedOvertimeHours = overtimeEntries.length === pickerDates.length && overtimeEntries.every(item => item.hours === overtimeEntries[0].hours)
      ? overtimeEntries[0].hours
      : '';
    const sharedOvertimeNote = overtimeEntries.length === pickerDates.length && overtimeEntries.every(item => item.note === overtimeEntries[0].note)
      ? overtimeEntries[0].note
      : '';
    document.getElementById('pk-overtime-section').innerHTML = `
      <div class="pk-sep"></div>
      <div class="pk-label">Additional work</div>
      <div class="pk-shift-box">
        <div class="pk-shift-title"><span class="pk-color-dot" style="background:#c2410c"></span><span>Overtime (OT)</span></div>
        <div class="pk-field"><span class="pk-field-label">Hours${pickerDates.length > 1 ? ' per selected day' : ''}</span><input class="pk-input" id="pk-overtime-hours" type="text" inputmode="decimal" placeholder="e.g. 2.5" value="${esc(sharedOvertimeHours)}"></div>
        <div class="pk-field"><span class="pk-field-label">Note (optional)</span><input class="pk-input" id="pk-overtime-note" type="text" maxlength="120" placeholder="Reason or context" value="${esc(sharedOvertimeNote)}"></div>
        <div class="pk-save-row"><button class="pk-clear" ${overtimeEntries.length ? '' : 'disabled'} onclick="removeOvertime()">Remove OT</button><button class="btn btn-sm btn-primary" onclick="saveOvertime()">Save OT</button></div>
      </div>`;
    const hasCellActivity = activities.some(act => actParticipantIds(act).includes(empId) && pickerDate >= act.startDate && pickerDate <= act.endDate && (() => { const assignment = activityAssignment(`${empId}_${pickerDate}_${act.id}`); return assignment.assigned === true && !assignment.excluded; })());
    document.getElementById('pk-clear-btn').style.display = (entry || hasCellActivity || overtimeEntries.length || cellNotes.some(Boolean)) ? 'block' : 'none';
    document.getElementById('pk-clear-label').textContent = pickerDates.length > 1 ? 'Clear all selected cells' : 'Clear cell';
    document.getElementById('pk-add-activity-btn').style.display = pickerDates.length > 1 ? 'flex' : 'none';
  }

  const sect = document.getElementById('pk-shift-section');
  if (appSettings.shiftRotationEnabled === true && pickerDates.some(date => rotationRecord(empId, date))) {
    const firstRotation = pickerDates.map(date => rotationRecord(empId, date)).find(Boolean);
    const selectedRotation = firstRotation?.shift || '';
    sect.innerHTML = `<div class="pk-sep"></div><div class="pk-label">Shift Rotation${pickerDates.length > 1 ? ' for selected dates' : ''}</div><div class="pk-shift-box"><div class="pk-shift-options">
      ${['day','evening','night','turn','leave'].map(shift => `<button class="pk-chip${selectedRotation === shift ? ' sel' : ''}" onclick="setRotationFromPicker('${shift}')">${esc(rotationShiftMeta(shift).label)}</button>`).join('')}
      <button class="pk-chip" onclick="setRotationFromPicker('')">Clear rotation</button>
    </div></div>`;
  } else if (appSettings.shiftRotationEnabled === true && currentPage === 'shift-rotation') {
    sect.innerHTML = `<div class="pk-sep"></div><div class="pk-label">Shift Rotation${pickerDates.length > 1 ? ' for selected dates' : ''}</div><div class="pk-shift-box"><div class="pk-shift-options">
      ${['day','evening','night','turn','leave'].map(shift => `<button class="pk-chip" onclick="setRotationFromPicker('${shift}')">${esc(rotationShiftMeta(shift).label)}</button>`).join('')}
      <button class="pk-chip" onclick="setRotationFromPicker('')">Clear rotation</button>
    </div></div>`;
  } else if (bossSessionActive || (canHostedCheckOff() && showAdminCheckIndicators)) {
    const status = entry ? siFor(entry.status) : null;
    const statusCheckState = bossSessionActive && status ? bossCheckState(empId, 'status', status.key) : 'none';
    const hostedEligibleDates = pickerDates.filter(date => cellActivities(empId, date).length || getEntryObj(`${empId}_${date}`)?.status);
    const hostedCheckedCount = hostedEligibleDates.filter(date => hostedOperationalCheckSet(empId, date, 'schedule_cell', 'cell')).length;
    const hostedAllChecked = hostedEligibleDates.length > 0 && hostedCheckedCount === hostedEligibleDates.length;
    const hostedCellItem = !bossSessionActive && hostedEligibleDates.length ? `<div class="pk-shift-box"><div class="pk-shift-title"><span>${pickerDates.length > 1 ? `${hostedEligibleDates.length} selected schedule cells` : `Schedule cell · ${esc(status?.label || acts[0]?.name || 'Entry')}`}</span></div><div class="pk-save-row"><button class="pk-chip${hostedCheckedCount ? ' sel' : ''}" onclick="toggleHostedOperationalChecks(${empId},${JSON.stringify(pickerDates)})">${hostedAllChecked ? (pickerDates.length > 1 ? 'Revoke selected checks' : '✓ Checked') : (pickerDates.length > 1 ? `Check off ${hostedEligibleDates.length} selected cells` : 'Check off cell')}</button></div></div>` : '';
    const statusItem = bossSessionActive && status ? `<div class="pk-shift-box"><div class="pk-shift-title"><span class="pk-color-dot" style="background:${status.color}"></span><span>Daily code: ${esc(status.label)}${status.isAbsence ? ' (absence)' : ''}</span></div><div class="pk-save-row"><button class="pk-chip${statusCheckState !== 'none' ? ' sel' : ''}" onclick="toggleBossCheck(${empId},'status',${JSON.stringify(status.key)})">${statusCheckState === 'all' ? '✓ Checked' : (statusCheckState === 'some' ? '◐ Partly checked' : 'Mark checked')}</button></div></div>` : '';
    const activityItems = acts.map(act => {
      const checkState = bossSessionActive ? bossCheckState(empId, 'activity', act.id) : 'none';
      if (!bossSessionActive) return '';
      return `<div class="pk-shift-box">
        <div class="pk-shift-title"><span class="act-dot" style="background:${act.color};width:9px;height:9px"></span><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(act.name)}${act.abbreviation ? ` (${esc(act.abbreviation)})` : ''}</span></div>
        <div class="pk-save-row"><button class="pk-chip${checkState !== 'none' ? ' sel' : ''}" onclick="${bossSessionActive ? `toggleBossCheck(${empId},'activity',${act.id})` : `toggleHostedOperationalCheck(${empId},'${pickerDate}','activity_assignment',${JSON.stringify(String(act.id))})`}">${bossSessionActive ? (checkState === 'all' ? '✓ Checked' : (checkState === 'some' ? '◐ Partly checked' : 'Mark checked')) : 'Check off assignment'}</button></div>
      </div>`;
    }).join('');
    sect.innerHTML = hostedCellItem || statusItem || activityItems ? '<div class="pk-sep"></div><div class="pk-label">Work schedule check</div>' + hostedCellItem + statusItem + activityItems : '';
  } else if (acts.length) {
    sect.innerHTML = '<div class="pk-sep"></div><div class="pk-label">Activity assignment</div>' + acts.map(act => {
      const firstDate = pickerDates.find(date => date >= act.startDate && date <= act.endDate) || pickerDate;
      const assignmentKey = `${empId}_${firstDate}_${act.id}`;
      const assignment = activityAssignment(assignmentKey);
      const selectedCode = (appSettings.workCodes || []).find(code => code.id === assignment.workCodeId);
      const rawShift = assignment.shift || '';
      const selectedShift = !assignment.assigned || assignment.excluded
        ? ''
        : (!assignment.shift
          ? 'normal'
          : (['normal', 'day', 'evening', 'night', 'turn'].includes(rawShift) ? rawShift : 'custom'));
      return `<div class="pk-shift-box">
        <div class="pk-shift-title"><span class="act-dot" style="background:${act.color};width:9px;height:9px"></span><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(act.name)}${act.abbreviation ? ` (${esc(act.abbreviation)})` : ''}</span></div>
        <div class="pk-field" id="pk-code-row-${act.id}" style="${selectedShift === 'normal' ? 'display:none' : ''}"><span class="pk-field-label">Work Code</span>
          <input id="pk-code-${act.id}" type="hidden" value="${esc(assignment.workCodeId || '')}">
          <details class="pk-code-menu" id="pk-code-menu-${act.id}">
            <summary><span class="pk-color-dot" id="pk-code-dot-${act.id}" style="background:${selectedCode?.color || '#94a3b8'}"></span><span id="pk-code-label-${act.id}">${selectedCode ? `${esc(selectedCode.abbreviation)} · ${esc(selectedCode.name)}` : 'Select code'}</span>${svgIcon('chevronDown')}</summary>
            <div class="pk-code-options">${sortedPlanningItems(appSettings.workCodes).map(code => `<button type="button" class="pk-code-option${assignment.workCodeId === code.id ? ' sel' : ''}" data-work-code-id="${esc(code.id)}" onclick="selectPickerWorkCode(${act.id},this.dataset.workCodeId)"><span class="pk-color-dot" style="background:${code.color}"></span><span>${esc(code.abbreviation)} · ${esc(code.name)}</span></button>`).join('')}</div>
          </details>
        </div>
        <div class="form-hint" id="pk-normal-hours-${act.id}" style="${selectedShift === 'normal' ? '' : 'display:none'}">Normal hours — no work code is required.</div>
        <div id="pk-admin-${act.id}" style="${selectedShift === 'normal' ? 'display:none' : ''}">${pickerAdministrativeField(act.id, selectedCode, assignment.administrativeTime)}</div>
        <div class="pk-field"><span class="pk-field-label">Shift Type</span><div class="pk-shift-options" id="pk-shifts-${act.id}" data-shift="${esc(selectedShift === 'custom' ? assignment.shift : selectedShift)}">
          <button class="pk-chip${selectedShift === 'normal' ? ' sel' : ''}" onclick="selectPickerShift(${act.id},'normal')">Normal Hours (NA)</button>
          <button class="pk-chip${selectedShift === 'day' ? ' sel' : ''}" onclick="selectPickerShift(${act.id},'day')">${svgIcon('sun')} Day</button>
           <button class="pk-chip${selectedShift === 'evening' ? ' sel' : ''}" onclick="selectPickerShift(${act.id},'evening')">${svgIcon('evening')} Mid-day / Evening</button>
          <button class="pk-chip${selectedShift === 'night' ? ' sel' : ''}" onclick="selectPickerShift(${act.id},'night')">${svgIcon('moon')} Night</button>
          <button class="pk-chip${selectedShift === 'turn' ? ' sel' : ''}" onclick="selectPickerShift(${act.id},'turn')">${shiftChangeIcon('')} Turnaround</button>
          <button class="pk-chip${selectedShift === 'custom' ? ' sel' : ''}" onclick="selectPickerShift(${act.id},'custom')">Custom</button>
        </div><div id="pk-custom-shift-wrap-${act.id}" style="display:${selectedShift === 'custom' ? 'block' : 'none'}"><input class="pk-input" id="pk-custom-shift-${act.id}" type="text" placeholder="1500-2000" value="${esc(selectedShift === 'custom' ? assignment.shift : '')}" oninput="document.getElementById('pk-shifts-${act.id}').dataset.shift=this.value.trim()"><div class="form-hint">Expected format: HHMM-HHMM, for example 1500-2000.</div></div></div>
        <div class="pk-save-row">
          <button class="pk-clear" ${assignment.assigned && !assignment.excluded ? '' : 'disabled'} onclick="clearActivityAssignment(${empId},${act.id})">${assignment.assigned && !assignment.excluded ? `Remove from ${esc(act.abbreviation || act.name)}` : 'Not assigned'}</button>
          <button class="btn btn-sm btn-primary" onclick="saveActivityAssignment(${empId},${act.id})">Set</button>
        </div>
      </div>`;
    }).join('');
  } else sect.innerHTML = '';

  if (canHostedCheckOff() && showAdminCheckIndicators) {
    document.getElementById('pk-status-section').style.display = 'none';
    document.getElementById('pk-duration-section').style.display = 'none';
    document.getElementById('pk-note-section').innerHTML = '';
    document.getElementById('pk-overtime-section').innerHTML = '';
    document.getElementById('pk-clear-btn').style.display = 'none';
    document.getElementById('pk-add-activity-btn').style.display = 'none';
    const eligibleDates = pickerDates.filter(date => cellActivities(empId, date).length || getEntryObj(`${empId}_${date}`)?.status);
    const checkedCount = eligibleDates.filter(date => hostedOperationalCheckSet(empId, date, 'schedule_cell', 'cell')).length;
    const allChecked = eligibleDates.length > 0 && checkedCount === eligibleDates.length;
    const datesArgument = `[${pickerDates.map(date => `'${date}'`).join(',')}]`;
    sect.innerHTML = eligibleDates.length ? `<div class="pk-sep"></div><div class="pk-label">Check-off</div><div class="pk-shift-box"><div class="pk-shift-title"><span>${pickerDates.length > 1 ? `${eligibleDates.length} selected cells` : 'Schedule cell'}</span></div><div class="pk-save-row"><button class="pk-chip${checkedCount ? ' sel' : ''}" onclick="toggleHostedOperationalChecks(${empId},${datesArgument})">${allChecked ? (pickerDates.length > 1 ? 'Revoke selected checks' : '✓ Checked') : (pickerDates.length > 1 ? `Check off ${eligibleDates.length} selected cells` : 'Check off cell')}</button></div></div>` : '<div class="form-hint">This cell is empty.</div>';
  }

  const picker = document.getElementById('picker');
  picker.classList.add('open');
  const pad = 8;
  const pointedCell = event ? cellFromEl(document.elementFromPoint(event.clientX, event.clientY)) : null;
  const fallbackCell = document.querySelector(`td.status-cell[data-empid="${empId}"][data-date="${pickerDate}"]`);
  const anchor = (pointedCell?.dataset.empid === String(empId) ? pointedCell : fallbackCell)?.getBoundingClientRect();
  picker.style.left = '0px'; picker.style.top = '0px';
  const pw = picker.offsetWidth, ph = picker.offsetHeight;
  const preferredLeft = anchor ? anchor.right + 6 : (event?.clientX || window.innerWidth / 2);
  const left = preferredLeft + pw <= window.innerWidth - pad
    ? preferredLeft
    : (anchor ? anchor.left - pw - 6 : (event?.clientX || window.innerWidth / 2) - pw);
  picker.style.left = Math.max(pad, Math.min(left, window.innerWidth - pw - pad)) + 'px';
  picker.style.top = Math.max(pad, Math.min(anchor?.top ?? (event?.clientY || window.innerHeight / 2), window.innerHeight - ph - pad)) + 'px';
}
function openActivityFromSelection() {
  if (!pickerDates.length) return;
  const blocked = pickerDates.filter(date => employeeHasRotation(pickerEmpId, date));
  if (blocked.length) { alert(`Cannot create an Activity on Shift Rotation date(s): ${blocked.join(', ')}`); return; }
  const sorted = [...pickerDates].sort();
  pendingActivityPreset = {
    startDate: sorted[0],
    endDate: sorted[sorted.length - 1],
    participantId: pickerEmpId,
  };
  closePicker();
  openActModal();
}
function openActivityFromRange(dates) {
  if (!dates || !dates.length) return;
  const sorted = [...dates].sort();
  pendingActivityPreset = {
    startDate: sorted[0],
    endDate: sorted[sorted.length - 1],
    participantId: null,
  };
  openActModal();
}
function openPicker(event, empId, date) {
  if (suppressCellClick) { suppressCellClick = false; event.stopPropagation(); return; }
  event.stopPropagation();
  if (currentPage !== 'shift-rotation' && employeeHasRotation(empId, date)) { showToast('This date is reserved by Shift Rotation.', 4000); return; }
  _showPicker(event, empId, [date]);
}
async function handleCellClick(event, empId, date) {
  if (suppressCellClick) { suppressCellClick = false; event.stopPropagation(); return; }
  event.stopPropagation();
  if (currentPage !== 'shift-rotation' && employeeHasRotation(empId, date)) { showToast('This date is reserved by Shift Rotation. Remove the rotation before planning an Activity.', 4000); return; }
  openPicker(event, empId, date);
}
function selectPickerWorkCode(actId, workCodeId) {
  const code = (appSettings.workCodes || []).find(item => item.id === workCodeId);
  const input = document.getElementById(`pk-code-${actId}`);
  const dot = document.getElementById(`pk-code-dot-${actId}`);
  const label = document.getElementById(`pk-code-label-${actId}`);
  if (input) input.value = workCodeId;
  if (dot) dot.style.background = code?.color || '#94a3b8';
  if (label) label.textContent = code ? `${code.abbreviation} · ${code.name}` : 'Select code';
  document.querySelectorAll(`#pk-code-menu-${actId} .pk-code-option`).forEach(button => button.classList.toggle('sel', button.dataset.workCodeId === workCodeId));
  document.getElementById(`pk-code-menu-${actId}`)?.removeAttribute('open');
  const admin = document.getElementById(`pk-admin-${actId}`);
  if (admin) admin.innerHTML = pickerAdministrativeField(actId, code, '');
}
function pickerAdministrativeField(actId, code, value = '') {
  if (!code || code.aggregationMode === 'days') return code ? '<div class="form-hint" style="margin-bottom:7px">Administrative value: 1d per assigned date</div>' : '';
  if (code.durationMode === 'fixed') return `<div class="form-hint" style="margin-bottom:7px">Administrative value: ${formatHoursNumber(code.fixedHours)}h per assigned date</div>`;
  return `<div class="pk-field"><span class="pk-field-label">Administrative time</span><input class="pk-input" id="pk-admin-time-${actId}" type="text" placeholder="1800-2200" value="${esc(value)}"><div class="form-hint">Compensation interval, separate from the physical shift.</div></div>`;
}
function selectPickerShift(actId, shift) {
  const container = document.getElementById(`pk-shifts-${actId}`);
  if (!container) return;
  const customShift = document.getElementById(`pk-custom-shift-${actId}`);
  const customWrap = document.getElementById(`pk-custom-shift-wrap-${actId}`);
  const codeRow = document.getElementById(`pk-code-row-${actId}`);
  const normalHint = document.getElementById(`pk-normal-hours-${actId}`);
  const adminRow = document.getElementById(`pk-admin-${actId}`);
  const buttons = [...container.querySelectorAll('.pk-chip')];
  const selectedButton = buttons.find(button => button.classList.contains('sel'));
  if (selectedButton?.getAttribute('onclick')?.includes(`'${shift}'`)) {
    const workCodeInput = document.getElementById(`pk-code-${actId}`);
    if (shift === 'normal' && workCodeInput?.value) {
      selectPickerWorkCode(actId, '');
      return;
    }
    container.dataset.shift = '';
    if (codeRow) codeRow.style.display = '';
    if (normalHint) normalHint.style.display = 'none';
    if (adminRow) adminRow.style.display = '';
    if (customWrap) customWrap.style.display = 'none';
    if (customShift) customShift.value = '';
    buttons.forEach(button => button.classList.remove('sel'));
    return;
  }
  const isCustom = shift === 'custom';
  if (shift === 'normal') {
    selectPickerWorkCode(actId, '');
    if (codeRow) codeRow.style.display = 'none';
    if (normalHint) normalHint.style.display = '';
    if (adminRow) adminRow.style.display = 'none';
  } else {
    if (codeRow) codeRow.style.display = '';
    if (normalHint) normalHint.style.display = 'none';
    if (adminRow) adminRow.style.display = '';
  }
  container.dataset.shift = isCustom ? (customShift?.value.trim() || '') : shift;
  if (customWrap) customWrap.style.display = isCustom ? 'block' : 'none';
  if (customShift && !isCustom) customShift.value = '';
  buttons.forEach(button => button.classList.toggle('sel', button.getAttribute('onclick')?.includes(`'${shift}'`)));
  if (isCustom) customShift?.focus();
}
function conflictingActivityAssignments(empId, date, actId) {
  const targetActivity = activities.find(activity => activity.id === actId);
  if (activityStatus(targetActivity) !== 'confirmed') return [];
  return activities.filter(activity => {
    if (activity.id === actId || activityStatus(activity) !== 'confirmed') return false;
    const assignment = activityAssignment(`${empId}_${date}_${activity.id}`);
    return assignment.assigned === true && !assignment.excluded;
  });
}
function confirmActivityReplacement(empId, dates, actId) {
  const conflicts = dates.flatMap(date =>
    conflictingActivityAssignments(empId, date, actId).map(activity => ({ date, activity }))
  );
  if (!conflicts.length) return true;
  const employee = employees.find(item => item.id === empId);
  const details = conflicts.map(({ date, activity }) => `${fmtMed(date)}: ${activity.name}`).join('\n');
  return confirm(`${employee?.name || 'This employee'} already has an activity assignment:\n\n${details}\n\nReplace the existing assignment?`);
}
function removeConflictingActivityAssignments(empId, date, actId) {
  conflictingActivityAssignments(empId, date, actId).forEach(activity => {
    excludeActivityAssignment(`${empId}_${date}_${activity.id}`);
  });
}
async function saveActivityAssignment(empId, actId) {
  const activity = activities.find(item => item.id === actId);
  const workCodeId = document.getElementById(`pk-code-${actId}`)?.value || '';
  const workCode = (appSettings.workCodes || []).find(code => code.id === workCodeId);
  const administrativeTime = document.getElementById(`pk-admin-time-${actId}`)?.value.trim() || '';
  const customShift = document.getElementById(`pk-custom-shift-${actId}`)?.value.trim() || '';
  const selectedShift = document.getElementById(`pk-shifts-${actId}`)?.dataset.shift || '';
  const isNormalWorkingHours = !customShift && selectedShift === 'normal';
  const shift = customShift || selectedShift;
  if (!activity) { alert('Select a Shift Type.'); return; }
  const dates = (pickerDates.length ? pickerDates : [pickerDate]).filter(date => date >= activity.startDate && date <= activity.endDate);
  const blockedDates = dates.filter(date => employeeHasRotation(empId, date));
  if (blockedDates.length) { alert(`Cannot plan this Activity on Shift Rotation date(s): ${blockedDates.join(', ')}`); return; }
  if (!shift) {
    const hasAssignment = dates.some(date => {
      const assignment = activityAssignment(`${empId}_${date}_${actId}`);
      return assignment.assigned && !assignment.excluded;
    });
    if (hasAssignment) { await clearActivityAssignment(empId, actId); return; }
    alert('Select a Shift Type.');
    return;
  }
  if (!isNormalWorkingHours && !workCodeId) { alert('Select a Work Code, or use Normal Working Hours.'); return; }
  if (workCode?.aggregationMode === 'hours' && workCode.durationMode !== 'fixed' && !timeRangeHours(administrativeTime)) { alert('Enter a valid administrative time range, e.g. 1800-2200.'); return; }
  if (!confirmActivityReplacement(empId, dates, actId)) return;
  await mutateState('saveActivityAssignment', () => {
  dates.forEach(date => {
    removeConflictingActivityAssignments(empId, date, actId);
    activityShiftsMap[`${empId}_${date}_${actId}`] = { shift, workCodeId: workCodeId || null, administrativeTime, staffingImpactOverride: null, assigned: true, excluded: false };
  });
  if (pickerSelectedStatus) {
    dates.forEach(date => {
      const statusKey = `${empId}_${date}`;
      const existing = getEntryObj(statusKey);
      entriesMap[statusKey] = { status: pickerSelectedStatus, durationType: existing?.durationType || 'fullday', time: existing?.time || null };
    });
  }
  });
  dates.forEach(date => updateCell(empId, date));
  closePicker();
}
async function clearActivityAssignment(empId, actId) {
  const activity = activities.find(item => item.id === actId);
  if (!activity) return;
  const dates = [...(pickerDates.length ? pickerDates : [pickerDate])].filter(date => date >= activity.startDate && date <= activity.endDate);
  if (!dates.length) return;
  await mutateState('clearActivityAssignment', () => {
    dates.forEach(date => excludeActivityAssignment(`${empId}_${date}_${actId}`));
  });
  dates.forEach(date => updateCell(empId, date));
  closePicker();
}
async function pickStatusById(id) {
  const st = statuses.find(s => s.id === id);
  if (st) await pickStatus(st.key);
}
async function pickStatus(key) {
  const savedStatus = getEntryObj(`${pickerEmpId}_${pickerDate}`)?.status;
  if (savedStatus === key) {
    await removeSelectedStatus();
    return;
  }
  if (pickerSelectedStatus === key) {
    pickerSelectedStatus = null;
    document.querySelectorAll('#pk-status-btns .pk-btn').forEach(button => button.classList.remove('pk-sel'));
    document.getElementById('pk-duration-section').style.display = 'none';
    return;
  }
  pickerSelectedStatus = key;
  document.querySelectorAll('#pk-status-btns .pk-btn').forEach(b => b.classList.remove('pk-sel'));
  const idx = statuses.findIndex(s => s.key === key);
  const btn = document.querySelectorAll('#pk-status-btns .pk-btn')[idx];
  if (btn) btn.classList.add('pk-sel');
  const st = siFor(key);
  updatePickerStatusLifecycle();
  document.getElementById('pk-duration-label').innerHTML = `Duration &mdash; ${esc(st ? st.label : key)} <span class="muted" style="font-weight:400;text-transform:none">(Ignored when assigning an activity below)</span>`;
  document.getElementById('pk-duration-section').style.display = 'flex';
}
function updatePickerStatusLifecycle() {
  document.querySelectorAll('#pk-status-lifecycle [data-lifecycle]').forEach(button => button.classList.toggle('sel', button.dataset.lifecycle === pickerStatusLifecycle));
  const hint = document.getElementById('pk-status-lifecycle-hint');
  if (hint) hint.textContent = pickerStatusLifecycle === 'planned'
    ? 'Planned statuses are informational only and do not affect workload or availability.'
    : 'Confirmed statuses affect workload and availability.';
}
function setPickerStatusLifecycle(lifecycle) {
  pickerStatusLifecycle = lifecycle === 'planned' ? 'planned' : 'confirmed';
  updatePickerStatusLifecycle();
}
async function removeSelectedStatus() {
  if (pickerEmpId == null || !pickerDate) return;
  if (hostedMode && hostedUser?.role === 'viewer') { showToast('Read-only users cannot modify the Schedule.', 3500); return; }
  const dates = pickerDates.length ? pickerDates : [pickerDate];
  await mutateState('removeSelectedStatus', () => {
    dates.forEach(date => entriesMap[`${pickerEmpId}_${date}`] = null);
  });
  pickerSelectedStatus = null;
  document.querySelectorAll('#pk-status-btns .pk-btn').forEach(button => button.classList.remove('pk-sel'));
  document.getElementById('pk-duration-section').style.display = 'none';
  dates.forEach(date => updateCell(pickerEmpId, date));
  const hasActivity = dates.some(date => activities.some(act => {
    if (!actParticipantIds(act).includes(pickerEmpId) || date < act.startDate || date > act.endDate) return false;
    const assignment = activityAssignment(`${pickerEmpId}_${date}_${act.id}`);
    return assignment.assigned === true && !assignment.excluded;
  }));
  document.getElementById('pk-clear-btn').style.display = hasActivity ? 'block' : 'none';
}
async function saveWithDuration(durationType) {
  if (pickerEmpId == null || !pickerDate || !pickerSelectedStatus) return;
  if (hostedMode && hostedUser?.role === 'viewer') { showToast('Read-only users cannot modify the Schedule.', 3500); return; }
  let time = null;
  if (durationType === 'time') {
    time = document.getElementById('pk-time').value.trim();
    if (!time) { alert('Enter a time range, e.g. 1000-1130.'); return; }
  }
  const dates = pickerDates.length ? pickerDates : [pickerDate];
  const selectedStatusDefinition = siFor(pickerSelectedStatus);
  if (selectedStatusDefinition?.isAbsence && pickerStatusLifecycle === 'planned' && hostedMode && hostedUser?.role === 'viewer') { showToast('Read-only users cannot plan or request absence.', 3500); return; }
  if (selectedStatusDefinition?.isAbsence && selectedStatusDefinition.requiresApproval === true && pickerStatusLifecycle === 'planned') {
    const employee = empById(pickerEmpId);
    const response = await fetch('/api/me/absence-requests', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ statusKey: pickerSelectedStatus, startDate: dates.slice().sort()[0], endDate: dates.slice().sort().at(-1), durationType, timeRange: time }) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) { alert(result.error || 'Could not submit the absence request.'); return; }
    showToast(`Absence request submitted for ${employee?.name || 'personnel'}.`, 4000);
    closePicker();
    return;
  }
  await mutateState('saveWithDuration', () => {
    for (const date of dates) entriesMap[`${pickerEmpId}_${date}`] = { status: pickerSelectedStatus, durationType, time, lifecycle: pickerStatusLifecycle };
  });
  dates.forEach(date => updateCell(pickerEmpId, date));
  closePicker();
}
function parseOvertimeHours(value) {
  const hours = Number(String(value || '').trim().replace(',', '.'));
  return Number.isFinite(hours) && hours > 0 && hours <= 24 ? formatHoursNumber(hours) : null;
}
async function saveCellNote() {
  if (pickerEmpId == null || !pickerDates.length) return;
  const note = document.getElementById('pk-cell-note')?.value.trim().slice(0, 240) || '';
  await mutateState('saveCellNote', () => {
  pickerDates.forEach(date => {
    const key = `${pickerEmpId}_${date}`;
    if (note) cellNotesMap[key] = note;
    else delete cellNotesMap[key];
  });
  });
  pickerDates.forEach(date => updateCell(pickerEmpId, date));
  closePicker();
}
async function removeCellNote() {
  if (pickerEmpId == null || !pickerDates.length) return;
  await mutateState('removeCellNote', () => {
    pickerDates.forEach(date => { delete cellNotesMap[`${pickerEmpId}_${date}`]; });
  });
  pickerDates.forEach(date => updateCell(pickerEmpId, date));
  closePicker();
}
async function toggleWorkScheduleCheck(empId, actId) {
  return toggleBossCheck(empId, 'activity', actId);
}
async function toggleBossCheck(empId, kind, id) {
  if (!bossSessionActive || !pickerDates.length) return;
  const dates = bossCheckDates(empId, kind, id);
  if (!dates.length) return;
  const checked = dates.every(date => isBossCheckSet(empId, date, kind, id));
  await mutateState('toggleBossCheck', () => {
  dates.forEach(date => {
    const key = bossCheckKey(empId, date, kind, id);
    if (checked) {
      delete workScheduleChecksMap[key];
      if (kind === 'activity') delete workScheduleChecksMap[`${empId}_${date}_${id}`];
    }
    else workScheduleChecksMap[key] = true;
  });
  });
  dates.forEach(date => updateCell(empId, date));
  _showPicker(null, empId, pickerDates);
}
async function saveOvertime() {
  if (pickerEmpId == null || !pickerDate) return;
  const hours = parseOvertimeHours(document.getElementById('pk-overtime-hours')?.value);
  if (hours === null) { alert('Enter overtime between 0 and 24 hours, e.g. 2.5.'); return; }
  const note = document.getElementById('pk-overtime-note')?.value.trim() || '';
  const dates = pickerDates.length ? pickerDates : [pickerDate];
  await mutateState('saveOvertime', () => {
    dates.forEach(date => { overtimeMap[`${pickerEmpId}_${date}`] = { hours, note }; });
  });
  dates.forEach(date => updateCell(pickerEmpId, date));
  closePicker();
}
async function removeOvertime() {
  if (pickerEmpId == null || !pickerDate) return;
  const dates = pickerDates.length ? pickerDates : [pickerDate];
  await mutateState('removeOvertime', () => {
    dates.forEach(date => overtimeMap[`${pickerEmpId}_${date}`] = null);
  });
  dates.forEach(date => updateCell(pickerEmpId, date));
  closePicker();
}
async function clearStatus() {
  if (pickerEmpId == null || !pickerDate) return;
  const dates = pickerDates.length ? pickerDates : [pickerDate];
  await mutateState('clearStatus', () => {
  dates.forEach(date => {
    entriesMap[`${pickerEmpId}_${date}`] = null;
    overtimeMap[`${pickerEmpId}_${date}`] = null;
    delete cellNotesMap[`${pickerEmpId}_${date}`];
    activities.filter(act => actParticipantIds(act).includes(pickerEmpId) && date >= act.startDate && date <= act.endDate).forEach(act => {
      excludeActivityAssignment(`${pickerEmpId}_${date}_${act.id}`);
      delete workScheduleChecksMap[`${pickerEmpId}_${date}_${act.id}`];
      delete workScheduleChecksMap[bossCheckKey(pickerEmpId, date, 'activity', act.id)];
    });
  });
  });
  dates.forEach(date => updateCell(pickerEmpId, date));
  closePicker();
}
async function saveShift(empId, date, actId, shift) {
  const dates = pickerEmpId === empId && pickerDates.length ? pickerDates : [date];
  await mutateState('saveShift', () => {
  for (const selectedDate of dates) {
    if (pickerSelectedStatus) {
      const statusKey = `${empId}_${selectedDate}`;
      const existing = getEntryObj(statusKey);
      entriesMap[statusKey] = { ...(existing || {}), status: pickerSelectedStatus, durationType: existing?.durationType || 'fullday', time: existing?.time || null };
    }
    const key = `${empId}_${selectedDate}_${actId}`;
    if (shift === null) excludeActivityAssignment(key);
    else activityShiftsMap[key] = { ...activityAssignment(key), shift, assigned: true, excluded: false };
  }
  });
  dates.forEach(selectedDate => updateCell(empId, selectedDate));
  closePicker();
}
async function setAssignmentWorkCode(empId, date, actId, workCodeId) {
  const dates = pickerEmpId === empId && pickerDates.length ? pickerDates : [date];
  if (workCodeId && !confirmActivityReplacement(empId, dates, actId)) return;
  await mutateState('setAssignmentWorkCode', () => {
  for (const selectedDate of dates) {
    const key = `${empId}_${selectedDate}_${actId}`;
    if (!workCodeId) excludeActivityAssignment(key);
    else {
      removeConflictingActivityAssignments(empId, selectedDate, actId);
      activityShiftsMap[key] = { shift: 'normal', workCodeId, assigned: true, excluded: false };
    }
  }
  });
  dates.forEach(selectedDate => updateCell(empId, selectedDate));
  closePicker();
}
async function saveShiftCustom(empId, date, actId) {
  const input = document.getElementById(`pk-shift-${actId}`);
  if (!input) return;
  const shift = input.value.trim();
  await saveShift(empId, date, actId, shift || null);
}
function closePicker() {
  document.getElementById('picker').classList.remove('open');
  pickerEmpId = null; pickerDate = null; pickerDates = []; pickerSelectedStatus = null;
  clearCellSelection();
}
document.addEventListener('click', e => {
  const picker = document.getElementById('picker');
  if (picker.classList.contains('open') && !picker.contains(e.target)) closePicker();
  if (!holidayTriggerContains(e.target) && !holidayPopoverContains(e.target)) closeHolidayAddMenu();
  const sortTh = e.target.closest && e.target.closest('th[data-sort]');
  if (sortTh) setSummarySort(sortTh.dataset.sort);
});

// ═══ STATUS MANAGER ══════════════════════════════════════════════════════════
function openStatusManager() {
  if (!document.getElementById('status-modal')?.classList.contains('open')) openSettingsChild('status-modal', 'settings-modal');
  resetStatusForm();
  resetDailyStatusForm();
  resetWorkCodeForm();
  renderStatusList();
  renderDailyStatusList();
  renderWorkCodeList();
  document.getElementById('status-modal').classList.add('open');
}
function resetStatusForm() {
  editingStatusId = null;
  document.getElementById('sf-form-title').textContent = 'Add an activity category';
  document.getElementById('sf-save-btn').textContent = 'Add category';
  document.getElementById('sf-cancel-edit').style.display = 'none';
  document.getElementById('sf-label').value = '';
  document.getElementById('sf-abbr').value = '';
  selectedStatusColor = PALETTE[0];
  buildSwatchRow('sf-swatches', selectedStatusColor, c => { selectedStatusColor = c; markSwatch('sf-swatches', c); });
}
function renderStatusList() {
  const list = document.getElementById('status-list');
  const activityTypes = sortedPlanningItems(appSettings.activityTypes);
  if (!activityTypes.length) { list.innerHTML = '<div class="empty-note" style="padding:22px">No activity types yet. Add your first one above.</div>'; return; }
  list.innerHTML = activityTypes.map(type => `
    <div class="flex items-center justify-between" style="border:1px solid var(--border);border-radius:8px;padding:8px 10px">
      <span class="flex items-center gap-2">
        <span class="badge-status" style="${statusStyle(type.color)}">${esc(type.abbreviation)}</span>
        <span style="font-weight:500;font-size:13px">${esc(type.name)}</span>
      </span>
      <span class="flex gap-2">
        <button class="icon-btn" title="Edit" onclick="startEditStatus('${esc(type.id)}')">${svgIcon('edit')}</button>
        <button class="icon-btn danger" title="Delete" onclick="deleteActivityType('${esc(type.id)}')">${svgIcon('trash')}</button>
      </span>
    </div>`).join('');
}
function startEditStatus(id) {
  const type = (appSettings.activityTypes || []).find(item => item.id === id);
  if (!type) return;
  editingStatusId = id;
  document.getElementById('sf-form-title').textContent = `Edit activity type - ${type.name}`;
  document.getElementById('sf-save-btn').textContent = 'Save changes';
  document.getElementById('sf-cancel-edit').style.display = 'inline-block';
  document.getElementById('sf-label').value = type.name;
  document.getElementById('sf-abbr').value = type.abbreviation;
  selectedStatusColor = type.color;
  buildSwatchRow('sf-swatches', selectedStatusColor, c => { selectedStatusColor = c; markSwatch('sf-swatches', c); });
}
async function saveStatus() {
  const name = document.getElementById('sf-label').value.trim();
  const abbreviation = document.getElementById('sf-abbr').value.trim().toUpperCase();
  if (!name) { alert('Name is required.'); return; }
  if (!abbreviation) { alert('Abbreviation is required.'); return; }
  let newTypeKey = null;
  await mutateState('saveStatus', () => {
  const activityTypes = appSettings.activityTypes || (appSettings.activityTypes = []);
  if (editingStatusId) {
    const index = activityTypes.findIndex(type => type.id === editingStatusId);
    if (index !== -1) activityTypes[index] = { ...activityTypes[index], name, abbreviation, color: selectedStatusColor };
  } else {
    let key = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || `activity_type_${Date.now()}`;
    let candidate = key, n = 2;
    while (activityTypes.some(type => type.key === candidate)) candidate = `${key}_${n++}`;
    activityTypes.push({ id: `at${Date.now()}`, key: candidate, name, abbreviation, color: selectedStatusColor });
    newTypeKey = candidate;
  }
  persistSettings();
  });
  resetStatusForm(); renderStatusList();
  if (quickActivityTypeReturn && newTypeKey) returnToActivityDraft(newTypeKey);
}
async function deleteActivityType(id) {
  const type = (appSettings.activityTypes || []).find(item => item.id === id);
  if (!type || !confirm(`Delete activity type "${type.name}"? Existing activities keep their saved type key.`)) return;
  await mutateState('deleteActivityType', () => {
    appSettings.activityTypes = appSettings.activityTypes.filter(item => item.id !== id);
    persistSettings();
  });
  renderStatusList();
}
function resetDailyStatusForm() {
  editingDailyStatusId = null;
  document.getElementById('dsf-form-title').textContent = 'Add a daily deviation / absence';
  document.getElementById('dsf-save-btn').textContent = 'Add deviation';
  document.getElementById('dsf-cancel-edit').style.display = 'none';
  document.getElementById('dsf-label').value = '';
  document.getElementById('dsf-abbr').value = '';
  document.getElementById('dsf-absence').checked = false;
  document.getElementById('dsf-out-of-office').checked = false;
  selectedDailyStatusColor = PALETTE[0];
  buildSwatchRow('dsf-swatches', selectedDailyStatusColor, color => { selectedDailyStatusColor = color; markSwatch('dsf-swatches', color); });
}
function renderDailyStatusList() {
  const list = document.getElementById('daily-status-list');
  if (!statuses.length) { list.innerHTML = '<div class="empty-note" style="padding:22px">No daily statuses yet. Add your first one above.</div>'; return; }
  list.innerHTML = statuses.map(status => `
    <div class="flex items-center justify-between" style="border:1px solid var(--border);border-radius:8px;padding:8px 10px">
      <span class="flex items-center gap-2"><span class="badge-status" style="${statusStyle(status.color)}">${esc(status.abbr)}</span><span><span style="font-weight:500;font-size:13px">${esc(status.label)}</span><span class="muted text-sm">${status.isAbsence ? ' · absence' : ''}${status.isOutOfOffice ? ' · out of office' : ''}</span></span></span>
      <span class="flex gap-2"><button class="icon-btn" title="Edit" onclick="startEditDailyStatus(${status.id})">${svgIcon('edit')}</button><button class="icon-btn danger" title="Delete" onclick="confirmDelete('status',${status.id})">${svgIcon('trash')}</button></span>
    </div>`).join('');
}
function startEditDailyStatus(id) {
  const status = statuses.find(item => item.id === id);
  if (!status) return;
  editingDailyStatusId = id;
  document.getElementById('dsf-form-title').textContent = `Edit daily status - ${status.label}`;
  document.getElementById('dsf-save-btn').textContent = 'Save changes';
  document.getElementById('dsf-cancel-edit').style.display = 'inline-block';
  document.getElementById('dsf-label').value = status.label;
  document.getElementById('dsf-abbr').value = status.abbr;
  document.getElementById('dsf-absence').checked = status.isAbsence === true;
  document.getElementById('dsf-requires-approval').checked = status.requiresApproval === true;
  document.getElementById('dsf-out-of-office').checked = status.isOutOfOffice === true;
  selectedDailyStatusColor = status.color;
  buildSwatchRow('dsf-swatches', selectedDailyStatusColor, color => { selectedDailyStatusColor = color; markSwatch('dsf-swatches', color); });
}
async function saveDailyStatus() {
  const label = document.getElementById('dsf-label').value.trim();
  const abbr = document.getElementById('dsf-abbr').value.trim().toUpperCase();
  if (!label || !abbr) { alert('Daily status name and abbreviation are required.'); return; }
  if (statuses.some(status => status.id !== editingDailyStatusId && status.label.toLowerCase() === label.toLowerCase())) { alert('A daily status with this name already exists.'); return; }
  await mutateState('saveDailyStatus', () => {
  if (editingDailyStatusId !== null) {
    const index = statuses.findIndex(status => status.id === editingDailyStatusId);
    if (index !== -1) statuses[index] = { ...statuses[index], label, abbr, color: selectedDailyStatusColor, isAbsence: document.getElementById('dsf-absence').checked, isOutOfOffice: document.getElementById('dsf-out-of-office').checked, requiresApproval: document.getElementById('dsf-requires-approval').checked };
  } else {
    let key = label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || `status_${Date.now()}`;
    let candidate = key, suffix = 2;
    while (statuses.some(status => status.key === candidate)) candidate = `${key}_${suffix++}`;
    statuses.push({ id: nextStatusId++, key: candidate, label, abbr, color: selectedDailyStatusColor, isAbsence: document.getElementById('dsf-absence').checked, isOutOfOffice: document.getElementById('dsf-out-of-office').checked, requiresApproval: document.getElementById('dsf-requires-approval').checked });
  }
  sortDailyStatuses();
  });
  resetDailyStatusForm();
  renderDailyStatusList();
  if (currentPage === 'grid') renderPage();
}
function resetWorkCodeForm() {
  document.getElementById('wcf-id').value = '';
  document.getElementById('wcf-name').value = '';
  document.getElementById('wcf-abbr').value = '';
  document.getElementById('wcf-staffing-impact').value = 'available';
  document.getElementById('wcf-aggregation-mode').value = 'hours';
  document.getElementById('wcf-duration-mode').value = 'entered';
  document.getElementById('wcf-fixed-hours').value = '';
  document.getElementById('wcf-form-title').textContent = 'Add work code';
  selectedWorkCodeColor = '#3b82f6';
  buildSwatchRow('wcf-swatches', selectedWorkCodeColor, color => { selectedWorkCodeColor = color; markSwatch('wcf-swatches', color); });
  document.getElementById('wcf-cancel').style.display = 'none';
  document.getElementById('wcf-save').textContent = 'Add work code';
  updateWorkCodeDurationFields();
  renderWorkCodeList();
}
function updateWorkCodeDurationFields() {
  const isHours = document.getElementById('wcf-aggregation-mode').value === 'hours';
  const isFixed = document.getElementById('wcf-duration-mode').value === 'fixed';
  document.getElementById('wcf-duration-fields').style.display = isHours ? 'grid' : 'none';
  document.getElementById('wcf-fixed-hours-wrap').style.visibility = isFixed ? 'visible' : 'hidden';
}
function renderWorkCodeList() {
  const list = document.getElementById('work-code-list');
  const workCodes = sortedPlanningItems(appSettings.workCodes);
  list.innerHTML = workCodes.length ? workCodes.map(code => {
    const duration = code.aggregationMode === 'days' ? 'Days' : (code.durationMode === 'fixed' ? `Fixed ${formatHoursNumber(code.fixedHours)}h` : 'Entered time');
    const selected = document.getElementById('wcf-id')?.value === code.id;
    return `<div class="flex items-center justify-between" role="button" tabindex="0" onclick="editWorkCode('${esc(code.id)}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();editWorkCode('${esc(code.id)}')}" style="border:1px solid ${selected ? 'var(--primary)' : 'var(--border)'};border-radius:8px;padding:8px 10px;cursor:pointer;background:${selected ? 'color-mix(in srgb,var(--primary) 7%,transparent)' : 'transparent'}"><span class="flex items-center gap-2"><span style="width:8px;height:8px;border-radius:50%;background:${code.color};flex:none"></span><span><b>${esc(code.abbreviation)}</b> · ${esc(code.name)} <span class="muted text-sm">· ${duration} · ${code.staffingImpact === 'unavailable' ? 'Out of office' : 'In office'}</span></span></span><span class="flex gap-2"><button class="icon-btn" title="Edit" onclick="event.stopPropagation();editWorkCode('${esc(code.id)}')">${svgIcon('edit')}</button><button class="icon-btn danger" title="Delete" onclick="event.stopPropagation();deleteWorkCode('${esc(code.id)}')">${svgIcon('trash')}</button></span></div>`;
  }).join('') : '<div class="empty-note" style="padding:22px">No work codes yet.</div>';
}
function editWorkCode(id) {
  const code = (appSettings.workCodes || []).find(item => item.id === id);
  if (!code) return;
  document.getElementById('wcf-id').value = id;
  document.getElementById('wcf-name').value = code.name;
  document.getElementById('wcf-abbr').value = code.abbreviation;
  document.getElementById('wcf-staffing-impact').value = code.staffingImpact;
  document.getElementById('wcf-aggregation-mode').value = code.aggregationMode === 'days' ? 'days' : 'hours';
  document.getElementById('wcf-duration-mode').value = code.durationMode === 'fixed' ? 'fixed' : 'entered';
  document.getElementById('wcf-fixed-hours').value = code.fixedHours || '';
  document.getElementById('wcf-form-title').textContent = `Edit work code - ${code.name}`;
  selectedWorkCodeColor = code.color;
  buildSwatchRow('wcf-swatches', selectedWorkCodeColor, color => { selectedWorkCodeColor = color; markSwatch('wcf-swatches', color); });
  document.getElementById('wcf-cancel').style.display = '';
  document.getElementById('wcf-save').textContent = 'Save changes';
  updateWorkCodeDurationFields();
  renderWorkCodeList();
  document.getElementById('work-code-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
  document.getElementById('wcf-name').focus({ preventScroll: true });
}
async function saveWorkCode() {
  const id = document.getElementById('wcf-id').value;
  const name = document.getElementById('wcf-name').value.trim();
  const abbreviation = document.getElementById('wcf-abbr').value.trim().toUpperCase();
  const staffingImpact = document.getElementById('wcf-staffing-impact').value;
  const aggregationMode = document.getElementById('wcf-aggregation-mode').value === 'days' ? 'days' : 'hours';
  const durationMode = document.getElementById('wcf-duration-mode').value === 'fixed' ? 'fixed' : 'entered';
  const fixedHours = durationMode === 'fixed' ? Number(document.getElementById('wcf-fixed-hours').value) : null;
  if (!name || !abbreviation) { alert('Work code name and abbreviation are required.'); return; }
  if (aggregationMode === 'hours' && durationMode === 'fixed' && (!Number.isFinite(fixedHours) || fixedHours <= 0)) { alert('Enter a positive fixed number of hours.'); return; }
  const nextCode = { id: id || `wc${Date.now()}`, name, abbreviation, staffingImpact, aggregationMode, durationMode, fixedHours, color: selectedWorkCodeColor };
  await mutateState('saveWorkCode', () => {
    const workCodes = appSettings.workCodes || (appSettings.workCodes = []);
    const index = workCodes.findIndex(code => code.id === id);
    if (id && index !== -1) workCodes[index] = nextCode;
    else workCodes.push(nextCode);
    persistSettings();
  });
  resetWorkCodeForm(); renderWorkCodeList();
}
async function deleteWorkCode(id) {
  const code = (appSettings.workCodes || []).find(item => item.id === id);
  if (!code || !confirm(`Delete work code "${code.name}"?`)) return;
  await mutateState('deleteWorkCode', () => {
    appSettings.workCodes = appSettings.workCodes.filter(item => item.id !== id);
    Object.keys(activityShiftsMap).forEach(key => { if (activityAssignment(key).workCodeId === id) activityShiftsMap[key] = { ...activityAssignment(key), workCodeId: null }; });
    persistSettings();
  });
  renderWorkCodeList();
}

// ═══ SWATCH HELPERS ══════════════════════════════════════════════════════════
const swatchHandlers = {};
function buildSwatchRow(containerId, selected, onSelect) {
  swatchHandlers[containerId] = onSelect;
  const el = document.getElementById(containerId);
  el.innerHTML = PALETTE.map(c => `<div class="swatch${c === selected ? ' sel' : ''}" data-color="${c}" style="background:${c}" onclick="swatchHandlers['${containerId}']('${c}')"></div>`).join('');
}
function markSwatch(containerId, color) {
  document.querySelectorAll(`#${containerId} .swatch`).forEach(s => s.classList.toggle('sel', s.dataset.color === color));
}

// ═══ ACTIVITIES ══════════════════════════════════════════════════════════════
function buildActivityTypeOptions(selected) {
  const input = document.getElementById('af-type');
  const label = document.getElementById('af-type-label');
  const dot = document.getElementById('af-type-dot');
  const options = document.getElementById('af-type-options');
  const activityTypes = sortedPlanningItems(appSettings.activityTypes);
  const selectedType = activityTypes.find(type => type.key === selected);
  input.value = selected || '';
  label.textContent = selectedType?.name || (selected ? `${selected} (legacy type)` : 'No type');
  dot.style.background = selectedType?.color || '#94a3b8';
  options.innerHTML = [
    `<button type="button" class="activity-type-option${selected ? '' : ' sel'}" data-type-key="" onclick="selectActivityType(this.dataset.typeKey)"><span class="pk-color-dot" style="background:#94a3b8"></span><span>No type</span></button>`,
    ...activityTypes.map(type => `<button type="button" class="activity-type-option${type.key === selected ? ' sel' : ''}" data-type-key="${esc(type.key)}" onclick="selectActivityType(this.dataset.typeKey)"><span class="pk-color-dot" style="background:${type.color}"></span><span>${esc(type.name)}</span></button>`),
    `<button type="button" class="activity-type-option" onclick="quickCreateActivityType()"><span>+ Create activity type...</span></button>`,
    ...(selected && !selectedType ? [`<button type="button" class="activity-type-option sel" data-type-key="${esc(selected)}" onclick="selectActivityType(this.dataset.typeKey)"><span class="pk-color-dot" style="background:#94a3b8"></span><span>${esc(selected)} (legacy type)</span></button>`] : []),
  ].join('');
}
function selectActivityType(typeKey) {
  buildActivityTypeOptions(typeKey || '');
  document.getElementById('af-type-menu').removeAttribute('open');
  document.querySelector('#af-type-menu summary')?.focus();
}
function quickCreateActivityType() {
  document.getElementById('af-type-menu').removeAttribute('open');
  quickActivityTypeReturn = true;
  document.getElementById('act-modal').classList.remove('open');
  openStatusManager();
  setTimeout(() => document.getElementById('sf-label')?.focus(), 50);
}
function buildParticipantPicker() {
  const container = document.getElementById('af-participants');
  const count = document.getElementById('af-participant-count');
  count.textContent = `(${selectedParticipants.length} selected)`;
  if (!employees.length) { container.innerHTML = '<div class="muted text-sm" style="padding:8px 10px">Add personnel first to assign participants.</div>'; return; }
  container.innerHTML = sortedEmployees().map(emp => {
    const checked = selectedParticipants.some(p => p.id === emp.id);
    return `<div class="participant-option${checked ? ' sel' : ''}">
      <label class="participant-head">
        <input type="checkbox" ${checked ? 'checked' : ''} onchange="toggleParticipant(${emp.id},this.checked)">
        <span style="min-width:0;flex:1">
          <span style="font-size:13px;font-weight:500">${esc(emp.name)}</span>
          <small>${esc(emp.role)} · ${esc(emp.department)}</small>
        </span>
      </label>
    </div>`;
  }).join('');
}
function toggleParticipant(id, checked) {
  if (checked) { if (!selectedParticipants.find(p => p.id === id)) selectedParticipants.push({ id }); }
  else selectedParticipants = selectedParticipants.filter(p => p.id !== id);
  buildParticipantPicker();
}
function openActModal(id) {
  editingActId = id === undefined || id === null || id === '' ? null : Number(id);
  const act = editingActId === null ? null : activities.find(a => a.id === editingActId);
  const relevance = activityRelevance(act);
  const departmentOptions = [...new Set(employees.map(employee => String(employee.department || '').trim()).filter(Boolean))].sort();
  const sectionOptions = [...new Set(employees.map(employeeSection).filter(Boolean))].sort();
  const departmentSelect = document.getElementById('af-relevance-departments');
  const sectionSelect = document.getElementById('af-relevance-sections');
  departmentSelect.innerHTML = departmentOptions.map(value => `<option value="${esc(value)}" ${relevance.departments.includes(value) ? 'selected' : ''}>${esc(value)}</option>`).join('');
  sectionSelect.innerHTML = sectionOptions.map(value => `<option value="${esc(value)}" ${relevance.sections.includes(value) ? 'selected' : ''}>${esc(value)}</option>`).join('');
  const preset = !act ? pendingActivityPreset : null;
  const today = todayStr();
  const defaultStart = preset?.startDate || (today.startsWith(`${gridYear}-`) ? today : `${gridYear}-01-01`);
  const defaultEnd = preset?.endDate || defaultStart;
  document.getElementById('act-modal-title').textContent = act ? 'Edit Activity' : 'Add Activity';
  document.getElementById('af-delete-btn').style.display = act ? 'inline-block' : 'none';
  document.getElementById('af-name').value = act?.name || '';
  document.getElementById('af-abbr').value = act?.abbreviation || '';
  document.getElementById('af-project').value = act?.project || '';
  document.getElementById('af-order').value = act?.order || '';
  document.getElementById('af-billing').value = act?.billing || '';
  buildActivityTypeOptions(act?.type || '');
  document.getElementById('af-status').value = act ? activityStatus(act) : 'tentative';
  document.getElementById('af-count-load').checked = act?.countsTowardLoad !== false;
  document.getElementById('af-day-shift').value = act?.dayShift || '0730-2400';
  document.getElementById('af-evening-shift').value = act?.eveningShift || '1200-2000';
  document.getElementById('af-night-shift').value = act?.nightShift || '0000-0730';
  document.getElementById('af-include-weekends').checked = act?.includeWeekends === true;
  document.getElementById('af-start').value = formatActivityDateInput(act?.startDate || defaultStart);
  document.getElementById('af-end').value = formatActivityDateInput(act?.endDate || defaultEnd);
  updateActivityWeekLabels();
  document.getElementById('af-notes').value = act?.notes || '';
  selectedActColor = act?.color || PALETTE[0];
  selectedParticipants = act ? (act.participants || []).map(p => ({ id: Number(p.id) })).filter(p => Number.isFinite(p.id)) : [];
  document.getElementById('af-prefill-cells').checked = false;
  if (!act && preset?.participantId && employees.some(emp => emp.id === preset.participantId)) {
    selectedParticipants = [{ id: preset.participantId }];
  }
  pendingActivityPreset = null;
  buildSwatchRow('af-swatches', selectedActColor, c => { selectedActColor = c; markSwatch('af-swatches', c); });
  buildParticipantPicker();
  document.getElementById('act-modal').classList.add('open');
  setTimeout(() => document.getElementById('af-name').focus(), 50);
}
function formatActivityDateInput(isoDate) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(isoDate || '').trim());
  return match ? `${match[3]}.${match[2]}.${match[1]}` : '';
}
function parseActivityDateInput(value) {
  const text = String(value || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(text);
  if (!match) return '';
  const isoDate = `${match[3]}-${match[2]}-${match[1]}`;
  const date = new Date(`${isoDate}T00:00:00`);
  return !Number.isNaN(date.getTime()) && fmt(date) === isoDate ? isoDate : '';
}
function normalizeActivityDateInput(input) {
  const isoDate = parseActivityDateInput(input?.value);
  if (isoDate) input.value = formatActivityDateInput(isoDate);
}
function openActivityDatePicker(inputId) {
  const textInput = document.getElementById(inputId);
  const nativeInput = document.getElementById(`${inputId}-native`);
  if (!textInput || !nativeInput) return;
  nativeInput.value = parseActivityDateInput(textInput.value) || '';
  if (typeof nativeInput.showPicker === 'function') {
    try { nativeInput.showPicker(); return; } catch (e) {}
  }
  nativeInput.focus();
}
function onActivityNativeDateChange(inputId) {
  const textInput = document.getElementById(inputId);
  const nativeInput = document.getElementById(`${inputId}-native`);
  if (!textInput || !nativeInput?.value) return;
  textInput.value = formatActivityDateInput(nativeInput.value);
  updateActivityWeekLabels();
}
function updateActivityWeekLabels() {
  const update = (inputId, outputId) => {
    const el = document.getElementById(inputId);
    const out = document.getElementById(outputId);
    if (!el || !out) return;
    const value = parseActivityDateInput(el.value);
    if (!value) { out.textContent = ''; return; }
    const date = new Date(value + 'T00:00:00');
    const dow = date.toLocaleDateString('en-US', { weekday: 'short' });
    out.textContent = `W${isoWeek(date)} · ${dow}`;
  };
  update('af-start', 'af-start-week');
  update('af-end', 'af-end-week');
}
async function saveActivity() {
  const name = document.getElementById('af-name').value.trim();
  const abbr = document.getElementById('af-abbr').value.trim().toUpperCase();
  const project = document.getElementById('af-project').value.trim();
  const order = document.getElementById('af-order').value.trim().toUpperCase();
  const billing = document.getElementById('af-billing').value.trim();
  const start = parseActivityDateInput(document.getElementById('af-start').value);
  const end = parseActivityDateInput(document.getElementById('af-end').value);
  const notes = document.getElementById('af-notes').value.trim();
  const type = document.getElementById('af-type').value;
  const status = document.getElementById('af-status').value;
  const countsTowardLoad = document.getElementById('af-count-load').checked;
  const dayShift = document.getElementById('af-day-shift').value.trim() || '0730-2400';
  const eveningShift = document.getElementById('af-evening-shift').value.trim() || '1200-2000';
  const nightShift = document.getElementById('af-night-shift').value.trim() || '0000-0730';
  const includeWeekends = document.getElementById('af-include-weekends').checked;
  const relevance = { departments: [...document.getElementById('af-relevance-departments').selectedOptions].map(option => option.value), sections: [...document.getElementById('af-relevance-sections').selectedOptions].map(option => option.value) };
  const prefillCells = document.getElementById('af-prefill-cells').checked === true;
  if (!name) { alert('Activity name is required.'); return; }
  if (Array.from(name).length > 25) { alert('Activity name can be at most 25 characters.'); return; }
  if (abbr.length > 6) { alert('Activity abbreviation can be at most 6 characters.'); return; }
  if (project && !/^[A-Za-z0-9\-]+$/.test(project)) { alert('Cost Center must contain only letters, numbers, and hyphens.'); return; }
  if (order && !/^[A-Za-z0-9]{1,9}$/.test(order)) { alert('Order must contain up to 9 alphanumeric characters.'); return; }
  if (!start || !end) { alert('Enter valid start and end dates using dd.mm.yyyy.'); return; }
  if (end < start) { alert('End date must be on or after start date.'); return; }
  if (!timeRangeHours(dayShift) || !timeRangeHours(eveningShift) || !timeRangeHours(nightShift)) { alert('Enter valid Day, Mid-day / Evening, and Night shift ranges.'); return; }
  const rec = { name, abbreviation: abbr, project, order, billing, type, status, countsTowardLoad, dayShift, eveningShift, nightShift, includeWeekends, relevance, color: selectedActColor, startDate: start, endDate: end,
    participants: selectedParticipants.map(p => ({ ...p })), notes };
  await mutateState('saveActivity', () => {
  if (editingActId !== null) {
    rec.id = editingActId;
    const idx = activities.findIndex(a => a.id === editingActId);
    if (idx !== -1) activities[idx] = rec; else activities.push(rec);
    const keepIds = new Set(rec.participants.map(p => p.id));
    for (const key of Object.keys(activityShiftsMap)) {
      const [empIdStr, , actIdStr] = key.split('_');
      if (+actIdStr === rec.id && !keepIds.has(+empIdStr)) activityShiftsMap[key] = null;
    }
  } else {
    rec.id = nextActId++;
    activities.push(rec);
  }
  if (prefillCells) {
    const assignmentDate = new Date(`${rec.startDate}T00:00:00`);
    const assignmentEnd = new Date(`${rec.endDate}T00:00:00`);
    let prefilled = 0;
    while (assignmentDate <= assignmentEnd) {
      const date = fmt(assignmentDate);
      rec.participants.forEach(participant => {
        const statusKey = `${participant.id}_${date}`;
        const hasCellEntry = Boolean(getEntryObj(statusKey));
        const hasActivityAssignment = Object.keys(activityShiftsMap).some(key => {
          const parts = key.split('_');
          return Number(parts[0]) === Number(participant.id) && parts[1] === date && activityAssignment(key)?.assigned === true && activityAssignment(key)?.excluded !== true;
        });
        const targetKey = `${participant.id}_${date}_${rec.id}`;
        if (!hasCellEntry && !hasActivityAssignment && !employeeHasRotation(participant.id, date)) {
          activityShiftsMap[targetKey] = { shift: 'normal', workCodeId: null, administrativeTime: '', staffingImpactOverride: null, assigned: true, excluded: false };
          prefilled++;
        }
      });
      assignmentDate.setDate(assignmentDate.getDate() + 1);
    }
    if (prefilled) showToast(`Prefilled ${prefilled} personnel cell${prefilled === 1 ? '' : 's'}. Existing entries were left unchanged.`, 4500);
  }
  for (const key of Object.keys(activityShiftsMap)) {
    const parts = key.split('_');
    if (+parts[2] === rec.id && (parts[1] < rec.startDate || parts[1] > rec.endDate)) activityShiftsMap[key] = null;
  }
  for (const participant of rec.participants) {
    for (const day = new Date(`${rec.startDate}T00:00:00`); fmt(day) <= rec.endDate; day.setDate(day.getDate() + 1)) {
      const date = fmt(day);
      if (employeeHasRotation(participant.id, date)) {
        const key = `${participant.id}_${date}_${rec.id}`;
        activityShiftsMap[key] = { ...(activityShiftsMap[key] || {}), shift: '', assigned: false, excluded: true };
      }
    }
  }
  activities.sort((a, b) => a.startDate.localeCompare(b.startDate));
  });
  closeModal('act-modal');
  renderPage();
}
function requestDeleteActivityFromModal() {
  if (editingActId === null) return;
  closeModal('act-modal');
  confirmDelete('activity', editingActId);
}

let activityReportId = null;
let activityReportHideInactiveByWeek = false;
function activityReportDates(act) {
  const dates = [];
  for (const d = new Date(`${act.startDate}T00:00:00`); fmt(d) <= act.endDate; d.setDate(d.getDate() + 1)) {
    if (act.includeWeekends || !isWknd(d)) dates.push(fmt(d));
  }
  return dates;
}
function activityReportWeekChunks(dates) {
  const chunks = [];
  for (const date of dates) {
    const weekKey = isoWeekStringFromDate(new Date(`${date}T00:00:00`));
    const chunk = chunks[chunks.length - 1];
    if (chunk?.weekKey === weekKey) chunk.dates.push(date);
    else chunks.push({ weekKey, dates: [date] });
  }
  return chunks;
}
function activityReportHasAssignment(act, empId, date) {
  if (date < act.startDate || date > act.endDate) return false;
  if (!act.includeWeekends && isWknd(new Date(`${date}T00:00:00`))) return false;
  const assignment = activityAssignment(`${empId}_${date}_${act.id}`);
  return assignment.assigned === true && assignment.excluded !== true && Boolean(assignment.shift);
}
function activityReportCellInfo(act, emp, date) {
  const info = activityAssignmentInfo(act, emp.id, date);
  const weekend = isWknd(new Date(`${date}T00:00:00`));
  if (!info) {
    return {
      info: null,
      weekend,
      className: weekend ? 'weekend' : '',
      style: weekend ? 'background:var(--weekend-bg);color:var(--muted);' : 'color:var(--muted);',
      html: '—',
    };
  }
  const shiftMeta = activityShiftMeta(act, info.assignment.shift);
  const shiftKey = shiftMeta?.key || 'custom';
  const tint = shiftKey === 'night' ? 30 : (shiftKey === 'evening' ? 22 : (shiftKey === 'day' ? 14 : 10));
  const color = normalizeHexColor(info.workCode.color, normalizeHexColor(act.color, '#2563eb'));
  const baseColor = weekend ? 'var(--weekend-bg)' : 'var(--surface)';
  const shiftIcon = ['day', 'evening', 'night'].includes(shiftKey) ? shiftMeta.icon : '';
  const shiftClass = ['normal', 'day', 'evening', 'night', 'turn'].includes(shiftKey) ? `${shiftKey}-shift` : 'custom-shift';
  return {
    info,
    weekend,
    className: `${weekend ? 'weekend ' : ''}scheduled ${shiftClass}`,
    style: `background:color-mix(in srgb,${color} ${tint}%,${baseColor});color:var(--text);--shift-color:${color};`,
    html: `<div class="report-shift-line">${shiftIcon}<strong>${esc(info.workCode.abbreviation)} (${esc(info.administrativeValue)})</strong></div><div class="report-physical-shift">${esc(info.physicalShift)}</div>`,
  };
}
function activityReportGroupsForDates(act, participantGroups, dates, hideInactive) {
  if (!hideInactive) return participantGroups;
  return participantGroups.map(group => ({
    ...group,
    participants: group.participants.filter(({ emp }) =>
      dates.some(date => activityReportHasAssignment(act, emp.id, date))),
  })).filter(group => group.participants.length);
}
function ensureActivityReportHideOption() {
  const content = document.getElementById('activity-report-content');
  if (!content) return;
  let checkbox = document.getElementById('activity-report-hide-inactive-week');
  let label = checkbox?.closest('label');
  if (!label) {
    label = document.createElement('label');
    label.innerHTML = '<input type="checkbox" id="activity-report-hide-inactive-week" onchange="updateActivityReportPreview()"> Hide personnel not working in each printed week';
  }
  checkbox = label.querySelector('input');
  checkbox.checked = activityReportHideInactiveByWeek;
  label.style.cssText = 'display:flex;align-items:center;gap:7px;margin:0 0 12px;font-size:12px;color:var(--muted);text-align:left';
  content.insertBefore(label, content.firstChild);
}
function updateActivityReportPreview() {
  activityReportHideInactiveByWeek = document.getElementById('activity-report-hide-inactive-week')?.checked === true;
  if (activityReportId != null) openActivityReport(activityReportId);
}
function activityReportRows(act) {
  const rows = [];
  const dates = activityReportDates(act);
  const participants = [...(act.participants || [])].sort((a, b) =>
    (empById(a.id)?.name || '').localeCompare(empById(b.id)?.name || ''));
  participants.forEach(participant => {
    const emp = empById(participant.id);
    if (!emp) return;
    dates.forEach(date => {
      const info = activityAssignmentInfo(act, emp.id, date);
      rows.push({
        employee: emp.name,
        department: emp.department,
        date,
        shiftType: info ? `${info.workCode.abbreviation} (${info.administrativeValue})` : '',
        shift: info?.physicalShift || 'Not scheduled',
        administrativeValue: info?.administrativeValue || '',
        deviation: dailyDeviationLabel(emp.id, date),
      });
    });
  });
  return rows;
}
function openActivityReport(id) {
  const act = activities.find(item => item.id === id);
  if (!act) return;
  if (activityStatus(act) === 'cancelled') return;
  if (activityReportId !== id) activityReportHideInactiveByWeek = false;
  activityReportId = id;
  const dates = activityReportDates(act);
  const participantGroups = activityReportParticipantGroups(act);

  document.getElementById('activity-report-title').textContent = `${activityStatus(act) === 'tentative' ? 'DRAFT · ' : ''}Work Schedule: ${act.name}`;
  document.getElementById('activity-report-content').innerHTML = `
    <div style="margin-bottom:14px;display:flex;align-items:flex-start;justify-content:space-between;gap:12px"><div style="flex:1;min-width:0"><div style="background:var(--muted-bg);border:1px solid var(--border);border-radius:6px;padding:10px"><div><b>Cost Center:</b> ${esc(act.project || 'Not specified')}</div><div style="margin-top:4px"><b>Order:</b> ${esc(act.order || 'Not specified')}</div><div style="margin-top:4px"><b>Billing explanation:</b> ${esc(act.billing || 'No note')}</div></div><div class="muted text-sm" style="margin-top:7px">Period: ${fmtMed(act.startDate)} – ${fmtMed(act.endDate)} · ${(act.participants || []).length} participant${(act.participants || []).length === 1 ? '' : 's'}</div></div>${renderSecurityLabel()}</div>
    <div style="overflow:auto"><table style="width:100%;border-collapse:collapse;font-size:12px;min-width:620px">
      <thead><tr style="text-align:left;border-bottom:2px solid var(--border)">
        <th style="padding:7px 8px;min-width:150px">Employee</th>${dates.map(date => { const weekend = isWknd(new Date(`${date}T00:00:00`)); return `<th style="padding:7px 8px;min-width:92px;background:${weekend ? 'var(--weekend-bg)' : 'transparent'};color:${weekend ? 'var(--weekend-text)' : 'inherit'};border-left:${weekend ? '1px solid var(--weekend-border)' : '0'};border-right:${weekend ? '1px solid var(--weekend-border)' : '0'}">${new Date(`${date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short' })}<div class="muted" style="font-weight:400;margin-top:2px">${fmtShort(date)}</div></th>`; }).join('')}
      </tr></thead>
      <tbody>${participantGroups.length ? participantGroups.map(group => `<tr><td colspan="${dates.length + 1}" style="padding:7px 8px;background:${group.color}18;border-bottom:1px solid ${group.color}"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background-color:${group.color};margin-right:5px"></span><strong>${esc(group.name)}</strong></td></tr>${group.participants.map(({ participant, emp }) => `<tr style="border-bottom:1px solid var(--border)"><td style="padding:8px;font-weight:500">${esc(emp.name)}</td>${dates.map(date => {
          const cell = activityReportCellInfo(act, emp, date);
          const deviation = dailyDeviationLabel(emp.id, date);
          const details = deviation ? `<div style="font-size:10px;margin-top:3px;color:var(--destructive)">${esc(deviation)}</div>` : '';
          return `<td class="${cell.className}" style="padding:8px;${cell.style}border-left:${cell.weekend ? '1px solid var(--weekend-border)' : '0'};border-right:${cell.weekend ? '1px solid var(--weekend-border)' : '0'}">${cell.html}${details}</td>`;
        }).join('')}</tr>`).join('')}`).join('') : `<tr><td colspan="${dates.length + 1}" class="empty-note" style="padding:24px;text-align:center">No participants assigned.</td></tr>`}</tbody>
    </table>`;
  ensureActivityReportHideOption();
  document.getElementById('activity-report-modal').classList.add('open');
}
function activityReportCsvValue(value) { return `"${String(value ?? '').replace(/"/g, '""')}"`; }
function activityReportParticipantGroups(act) {
  const groups = new Map();
  [...(act.participants || [])].forEach(participant => {
    const emp = empById(participant.id);
    if (!emp) return;
    const name = emp.department || 'Not specified';
    if (!groups.has(name)) groups.set(name, []);
    groups.get(name).push({ participant, emp });
  });
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([name, participants]) => ({
    name,
    color: resolveDeptColor(name) || '#999',
    participants: participants.sort((a, b) => a.emp.name.localeCompare(b.emp.name)),
  }));
}
function exportActivityReportCsv() {
  const act = activities.find(item => item.id === activityReportId);
  if (!act) return;
  const draftLabel = activityStatus(act) === 'tentative' ? 'DRAFT · ' : '';
  const rows = activityReportRows(act);
  const lines = [['Report', 'Activity', 'Cost Center', 'Order', 'Billing explanation', 'Employee', 'Department', 'Date', 'Work Code / Administrative value', 'Physical Shift', 'Daily Deviation / Absence'],
    ...rows.map(row => [`${draftLabel}Work Schedule`, act.name, act.project || '', act.order || '', act.billing || '', row.employee, row.department, row.date, row.shiftType, row.shift, row.deviation])]
    .map(row => row.map(activityReportCsvValue).join(','));
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob), link = document.createElement('a');
  link.href = url;
  link.download = `${act.name.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'activity'}-report.csv`;
  document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
}
function printActivityReport() {
  const act = activities.find(item => item.id === activityReportId);
  if (!act) return;
  const draftLabel = activityStatus(act) === 'tentative' ? 'DRAFT · ' : '';
  const dates = activityReportDates(act);
  if (!dates.length) {
    alert('This activity has no reportable workdays. Enable weekends or extend the activity period before printing.');
    return;
  }
  const participantGroups = activityReportParticipantGroups(act);
  const hideInactiveByWeek = document.getElementById('activity-report-hide-inactive-week')?.checked === true;
  const sections = [];
  for (const week of activityReportWeekChunks(dates)) {
    const chunkDates = week.dates;
    const visibleGroups = activityReportGroupsForDates(act, participantGroups, chunkDates, hideInactiveByWeek);
    sections.push(`<section class="report-section">
      <div class="report-header"><h1>${draftLabel}Work Schedule: ${esc(act.name)}</h1><div class="week-label">Week ${isoWeek(new Date(`${chunkDates[0]}T00:00:00`))}</div></div>
      <div class="info-box"><div><b>Cost Center:</b> ${esc(act.project || 'Not specified')}</div><div><b>Order:</b> ${esc(act.order || 'Not specified')}</div><div><b>Billing explanation:</b> ${esc(act.billing || 'No note')}</div></div>
      <div class="period">Period: ${fmtMed(chunkDates[0])} – ${fmtMed(chunkDates[chunkDates.length - 1])}</div>
      <table><thead><tr><th class="employee-column">Employee</th>${chunkDates.map(date => {
        const weekend = isWknd(new Date(`${date}T00:00:00`));
        return `<th class="date-column${weekend ? ' weekend' : ''}">${new Date(`${date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short' })}<div class="muted">${fmtShort(date)}</div></th>`;
      }).join('')}</tr></thead><tbody>${visibleGroups.length ? visibleGroups.map(group => `<tr class="section-row"><td colspan="${chunkDates.length + 1}" style="background:${group.color}18;border-bottom-color:${group.color}"><span class="section-dot" style="background-color:${group.color}"></span><strong>${esc(group.name)}</strong></td></tr>${group.participants.map(({ participant, emp }) => `<tr><td><b>${esc(emp.name)}</b></td>${chunkDates.map(date => {
          const cell = activityReportCellInfo(act, emp, date);
          return `<td class="${cell.className}" style="${cell.style}">${cell.html}</td>`;
        }).join('')}</tr>`).join('')}`).join('') : `<tr><td colspan="${chunkDates.length + 1}" class="empty-note">${hideInactiveByWeek ? 'No personnel scheduled this week.' : 'No participants assigned.'}</td></tr>`}</tbody></table>
    </section>`);
  }
  const printWindow = window.open('', '_blank', 'width=1400,height=900');
  if (!printWindow) { alert('Please allow pop-ups to print the activity report.'); return; }
  printWindow.document.write(`<!doctype html><html><head><title>Work Schedule - ${esc(act.name)}</title><style>
    @page{size:A4 landscape;margin:8mm}*{box-sizing:border-box}:root{--surface:#fff;--text:#111;--muted:#666;--weekend-bg:#fff7ed;--weekend-text:#c2410c;--weekend-border:#fed7aa}html,body{width:100%}body{font:9px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#111;margin:0}.report-section{page-break-after:always;break-after:page}.report-section:last-child{page-break-after:auto;break-after:auto}.report-header{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.week-label{font-size:12px;font-weight:700;color:#475569}h1{font-size:18px;margin:0 0 5px}.info-box{background:#f5f5f5;border:1px solid #d8d8d8;border-radius:6px;padding:8px;margin-top:8px;display:flex;gap:20px}.period{color:#666;margin:7px 0 10px}table{width:100%;border-collapse:collapse;table-layout:fixed}thead{display:table-header-group}th,td{padding:5px 4px;border:1px solid #ddd;text-align:left;vertical-align:top;overflow-wrap:anywhere}.employee-column{width:145px}.date-column{width:auto}.muted{color:#666;font-size:8px;margin-top:2px}.weekend{background:var(--weekend-bg);color:var(--weekend-text);border-left-color:var(--weekend-border);border-right-color:var(--weekend-border);box-shadow:inset 0 0 0 1px var(--weekend-border)}.empty-note{text-align:center;padding:20px}.scheduled{color:#111}.report-shift-line{display:flex;align-items:center;gap:4px}.report-shift-line .ui-icon{width:11px;height:11px;flex:0 0 11px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;color:var(--shift-color)}.report-physical-shift{font-size:8px;margin-top:2px}.section-dot{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:5px}@media print{*{print-color-adjust:exact;-webkit-print-color-adjust:exact}}
  </style></head><body>${sections.join('')}</body></html>`);
  printWindow.document.close(); printWindow.focus(); printWindow.print();
}

function teamReportDates(start, end) {
  const dates = [];
  for (const d = new Date(`${start}T00:00:00`); fmt(d) <= end; d.setDate(d.getDate() + 1)) dates.push(fmt(d));
  return dates;
}
function teamReportEntries(start, end) {
  return sortedEmployees().map(emp => {
    const employeeActivities = activities.filter(act => {
      const participant = participantFor(act, emp.id);
      return act.startDate <= end && act.endDate >= start && participant && activityRelevantToEmployee(act, emp) && activityHasScheduledShift(act, emp.id, start, end);
    })
      .sort((a, b) => a.startDate.localeCompare(b.startDate) || a.name.localeCompare(b.name));
    return { emp, activities: employeeActivities };
  });
}
function teamReportActivities(entries) {
  return [...new Map(entries.flatMap(({ activities: employeeActivities }) => employeeActivities.map(act => [act.id, act]))).values()]
    .sort((a, b) => a.name.localeCompare(b.name));
}
function teamReportBillingSummary(reportActivities) {
  return `<div style="margin-bottom:15px;padding:10px;background:var(--muted-bg, #f8f9fa);border:1px solid #ccc;font-size:11px"><strong style="display:block;margin-bottom:7px">Billing codes for the period:</strong>${reportActivities.length ? `<table style="width:100%;border-collapse:collapse;font-size:11px"><thead><tr><th style="padding:5px 7px;border:1px solid #ccc;text-align:left">Activity</th><th style="padding:5px 7px;border:1px solid #ccc;text-align:left">CC</th><th style="padding:5px 7px;border:1px solid #ccc;text-align:left">Order</th><th style="padding:5px 7px;border:1px solid #ccc;text-align:left">Free text</th></tr></thead><tbody>${reportActivities.map(act => `<tr><td style="padding:5px 7px;border:1px solid #ccc;font-weight:600;color:${act.color || 'inherit'}">${esc(act.name)}</td><td style="padding:5px 7px;border:1px solid #ccc">${esc(act.project || '-')}</td><td style="padding:5px 7px;border:1px solid #ccc">${esc(act.order || '-')}</td><td style="padding:5px 7px;border:1px solid #ccc">${esc(act.billing || '-')}</td></tr>`).join('')}</tbody></table>` : 'No activities in this period'}</div>`;
}
function teamReportShiftRange(act, participant, shift) {
  const shiftType = assignmentShiftType(shift, participant);
  if (shift === 'normal' || shift === 'day' || shift === 'evening' || shift === 'night') return activityDefaultShift(shift, act);
  if (shift === 'turn') return 'Turnaround';
  const configuredRange = activityDefaultShift(shiftType, act);
  const oppositeDefault = shiftType === 'night' ? activityDefaultShift('day', act) : activityDefaultShift('night', act);
  return shift === 'fullday' || shift === oppositeDefault ? configuredRange : shift;
}
function teamReportCellInfo(emp, act, date) {
  if (!act) return '';
  if (date < act.startDate || date > act.endDate) return '';
  const day = new Date(`${date}T00:00:00`);
  if (isWknd(day) && !act.includeWeekends) return '';
  const info = activityAssignmentInfo(act, emp.id, date);
  if (!info) return null;
  const hours = info.administrativeMeasure.hours;
  const days = info.administrativeMeasure.units;
  const tint = info.assignment.shift === 'night' ? 0.22 : (info.assignment.shift === 'evening' ? 0.18 : 0.12);
  const activityLabel = act.abbreviation || act.name;
  return {
    html: `<div style="display:flex;align-items:center;gap:5px;font-size:10px;font-weight:700;color:${act.color || 'inherit'}"><span style="display:inline-block;width:8px;height:8px;border-radius:999px;background:${act.color || 'currentColor'};flex:0 0 auto"></span>${esc(activityLabel)}</div><div style="font-weight:700">${esc(info.workCode.abbreviation || info.workCode.name)} (${esc(info.administrativeValue)})</div><div style="font-size:10px;margin-top:2px">${esc(info.physicalShift)}</div>`,
    hours,
    days,
    tint,
    workCode: info.workCode,
    activity: act,
  };
}
function teamReportCell(emp, act, date) {
  const info = teamReportCellInfo(emp, act, date);
  return info ? info.html : '';
}
function teamReportEntryCellInfos(entry, date) {
  return entry.activities
    .map(act => teamReportCellInfo(entry.emp, act, date))
    .filter(Boolean);
}
function teamReportEntryCellInfo(entry, date) {
  const infos = teamReportEntryCellInfos(entry, date);
  if (!infos.length) return null;
  return {
    html: infos.map((info, index) => `<div${index ? ' style="margin-top:5px;padding-top:5px;border-top:1px solid rgba(0,0,0,0.08)"' : ''}>${info.html}</div>`).join(''),
    hours: infos.reduce((sum, info) => sum + info.hours, 0),
    days: infos.reduce((sum, info) => sum + info.days, 0),
    tint: infos[0].tint,
    workCode: infos[0].workCode,
    activity: infos[0].activity,
    items: infos,
  };
}
function teamReportActivityLabels(employeeActivities) {
  return employeeActivities.length
    ? employeeActivities.map(act => `<span style="color:${act.color || 'var(--muted)'}">${esc(act.name)}</span>`).join(' · ')
    : 'No activities in this period';
}
function openTeamScheduleReport() {
  const start = new Date();
  const end = new Date(start);
  end.setDate(end.getDate() + 30);
  document.getElementById('team-report-start').value = fmt(start);
  document.getElementById('team-report-end').value = fmt(end);
  teamReportSelectedActivityIds = null;
  document.getElementById('team-report-modal').classList.add('open');
  renderTeamScheduleReport();
}
function teamReportAvailableActivities(start, end) {
  return activities.filter(act => act.startDate <= end && act.endDate >= start && activityVisibleForScheduleSection(act))
    .sort((a, b) => a.startDate.localeCompare(b.startDate) || a.name.localeCompare(b.name));
}
function setTeamReportActivitySelection(id, checked) {
  const start = document.getElementById('team-report-start')?.value;
  const end = document.getElementById('team-report-end')?.value;
  const available = teamReportAvailableActivities(start, end);
  const selected = new Set(teamReportSelectedActivityIds ?? available.map(act => act.id));
  if (checked) selected.add(Number(id)); else selected.delete(Number(id));
  teamReportSelectedActivityIds = [...selected];
  renderTeamScheduleReport();
}
function setTeamReportAllActivities(checked) {
  const start = document.getElementById('team-report-start')?.value;
  const end = document.getElementById('team-report-end')?.value;
  teamReportSelectedActivityIds = checked ? teamReportAvailableActivities(start, end).map(act => act.id) : [];
  renderTeamScheduleReport();
}
function renderTeamScheduleReport() {
  const start = document.getElementById('team-report-start').value;
  const end = document.getElementById('team-report-end').value;
  const content = document.getElementById('team-report-content');
  if (!start || !end || end < start) { content.innerHTML = '<div class="empty-note" style="padding:24px;text-align:center">Choose a valid date range.</div>'; return; }
  const dates = teamReportDates(start, end);
  const availableActivities = teamReportAvailableActivities(start, end);
  if (teamReportSelectedActivityIds === null) teamReportSelectedActivityIds = availableActivities.map(act => act.id);
  const selectedActivityIds = new Set(teamReportSelectedActivityIds);
  const entries = teamReportEntries(start, end).map(entry => ({ ...entry, activities: entry.activities.filter(act => selectedActivityIds.has(act.id)) })).filter(entry => entry.activities.length);
  const reportActivities = teamReportActivities(entries);
  const allSelected = availableActivities.length > 0 && availableActivities.every(act => selectedActivityIds.has(act.id));
  content.innerHTML = `
    <div style="margin-bottom:14px;display:flex;align-items:flex-start;justify-content:space-between;gap:12px"><div><div style="font-weight:600;font-size:14px">Team Work Schedule</div><div class="muted text-sm" style="margin-top:3px">Period: ${fmtMed(start)} – ${fmtMed(end)}</div></div>${renderSecurityLabel()}</div>
    ${teamReportBillingSummary(reportActivities)}
    <div style="margin-bottom:14px;padding:10px;border:1px solid var(--border);border-radius:8px;background:var(--muted-bg)"><div style="font-weight:600;margin-bottom:7px">Activities to include</div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px"><label style="display:flex;align-items:center;gap:6px;font-size:12px"><input type="checkbox" ${allSelected ? 'checked' : ''} onchange="setTeamReportAllActivities(this.checked)"> Select all</label><button class="btn btn-sm" type="button" onclick="setTeamReportAllActivities(false)">Clear all</button></div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:5px">${availableActivities.map(act => `<label style="display:flex;align-items:flex-start;gap:6px;font-size:12px"><input type="checkbox" ${selectedActivityIds.has(act.id) ? 'checked' : ''} onchange="setTeamReportActivitySelection(${act.id},this.checked)"><span><b>${esc(act.name)}</b><small class="muted" style="display:block">${fmtShort(act.startDate)} – ${fmtShort(act.endDate)} · ${esc(activityStatusMeta(act).label)}</small></span></label>`).join('') || '<span class="muted">No activities overlap this period.</span>'}</div></div>
    <div style="overflow:auto"><table style="width:100%;border-collapse:collapse;font-size:11px;min-width:${220 + dates.length * 92 + 150}px">
      <thead><tr style="text-align:left;border-bottom:2px solid var(--border)"><th style="padding:7px 8px;min-width:210px;position:sticky;left:0;background:var(--surface);z-index:1">Employee / Activity</th>${dates.map(date => { const weekend = isWknd(new Date(`${date}T00:00:00`)); return `<th style="padding:7px 6px;min-width:92px;background:${weekend ? 'var(--weekend-bg)' : 'var(--surface)'};color:${weekend ? 'var(--weekend-text)' : 'inherit'};border-left:${weekend ? '1px solid var(--weekend-border)' : '0'};border-right:${weekend ? '1px solid var(--weekend-border)' : '0'}">${new Date(`${date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short' })}<div class="muted" style="font-weight:400;margin-top:2px">${fmtShort(date)}</div></th>`; }).join('')}<th style="padding:7px 8px;min-width:70px">Days</th><th style="padding:7px 8px;min-width:70px">Hours</th></tr></thead>
      <tbody>${entries.map(entry => {
        const totalHours = dates.reduce((sum, date) => sum + (teamReportEntryCellInfo(entry, date)?.hours || 0), 0);
        const totalDays = dates.reduce((sum, date) => sum + (teamReportEntryCellInfo(entry, date)?.days || 0), 0);
        return `<tr style="border-bottom:1px solid var(--border)"><td style="padding:7px 8px;position:sticky;left:0;background:var(--surface);z-index:1"><div style="font-weight:600">${esc(entry.emp.name)}</div><div class="muted" style="font-size:10px;margin-top:2px">${teamReportActivityLabels(entry.activities)}</div></td>${dates.map(date => { const weekend = isWknd(new Date(`${date}T00:00:00`)); const cellInfo = teamReportEntryCellInfo(entry, date); return `<td style="padding:7px 6px;vertical-align:top;background:${cellInfo ? `color-mix(in srgb, ${cellInfo.workCode.color} ${cellInfo.tint * 100}%, transparent)` : (weekend ? 'var(--weekend-bg)' : 'transparent')};border-left:${weekend ? '1px solid var(--weekend-border)' : '0'};border-right:${weekend ? '1px solid var(--weekend-border)' : '0'}">${cellInfo ? cellInfo.html : ''}</td>`; }).join('')}<td style="padding:7px 8px;white-space:nowrap;font-weight:600">${entry.activities.length ? totalDays.toFixed(2) : ''}</td><td style="padding:7px 8px;white-space:nowrap;font-weight:600">${entry.activities.length ? totalHours.toFixed(1) : ''}</td></tr>`;
      }).join('')}</tbody>
    </table></div>`;
}
function printTeamScheduleReport() {
  const start = document.getElementById('team-report-start').value;
  const end = document.getElementById('team-report-end').value;
  if (!start || !end || end < start) { alert('Choose a valid date range first.'); return; }
  const dates = teamReportDates(start, end);
  const selectedActivityIds = new Set(teamReportSelectedActivityIds ?? teamReportAvailableActivities(start, end).map(act => act.id));
  const entries = teamReportEntries(start, end).map(entry => ({ ...entry, activities: entry.activities.filter(act => selectedActivityIds.has(act.id)) })).filter(entry => entry.activities.length);
  const reportActivities = teamReportActivities(entries);
  const secCfg = normalizeSecurityLabel(appSettings.securityLabel);
  const secLabelHtml = secCfg.enabled ? `<span class="security-label" style="--security-label-color:${esc(secCfg.color)}">${esc(secCfg.text)}</span>` : '';
  const sections = [];
  for (let i = 0; i < dates.length; i += 14) {
    const chunkDates = dates.slice(i, i + 14);
    sections.push(`<section class="report-section">
      <div class="report-header"><h1>Team Work Schedule</h1>${secLabelHtml}</div>
      <div class="period">Period: ${fmtMed(chunkDates[0])} – ${fmtMed(chunkDates[chunkDates.length - 1])}</div>
      ${i === 0 ? teamReportBillingSummary(reportActivities) : ''}
      <table><thead><tr><th class="employee-column">Employee / Activity</th>${chunkDates.map(date => {
        const weekend = isWknd(new Date(`${date}T00:00:00`));
        return `<th class="date-column${weekend ? ' weekend' : ''}">${new Date(`${date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short' })}<div class="muted">${fmtShort(date)}</div></th>`;
      }).join('')}<th class="total-column">Days</th><th class="total-column">Hours</th></tr></thead>
      <tbody>${entries.map(entry => {
        const chunkHours = chunkDates.reduce((sum, date) => sum + (teamReportEntryCellInfo(entry, date)?.hours || 0), 0);
        const chunkDays = chunkDates.reduce((sum, date) => sum + (teamReportEntryCellInfo(entry, date)?.days || 0), 0);
        return `<tr><td><b>${esc(entry.emp.name)}</b><div class="muted activity-name">${teamReportActivityLabels(entry.activities)}</div></td>${chunkDates.map(date => {
          const weekend = isWknd(new Date(`${date}T00:00:00`));
          const cellInfo = teamReportEntryCellInfo(entry, date);
          return `<td class="${weekend ? 'weekend' : ''}"${cellInfo ? ` style="background:color-mix(in srgb, ${cellInfo.workCode.color} ${cellInfo.tint * 100}%, transparent)"` : ''}>${cellInfo ? cellInfo.html : ''}</td>`;
        }).join('')}<td class="total-column">${entry.activities.length ? formatHoursNumber(chunkDays) : ''}</td><td class="total-column">${entry.activities.length ? formatHoursNumber(chunkHours) : ''}</td></tr>`;
      }).join('')}</tbody></table>
    </section>`);
  }
  const printWindow = window.open('', '_blank', 'width=1400,height=900');
  if (!printWindow) { alert('Please allow pop-ups to print the team schedule.'); return; }
  printWindow.document.write(`<!doctype html><html><head><title>Team Work Schedule</title><style>@page{size:landscape;margin:8mm}*{box-sizing:border-box}:root{--muted:#666;--text:#111}body{font:8px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#111;margin:0}.report-section{page-break-after:always;break-after:page}.report-section:last-child{page-break-after:auto;break-after:auto}.report-header{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:5px}.report-header h1{font-size:18px;margin:0}.security-label{display:inline-flex;align-items:center;justify-content:center;padding:3px 10px;border-radius:4px;border:1.5px solid currentColor;background:var(--security-label-color,#16a34a);color:#fff;font-size:9px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;line-height:1;-webkit-print-color-adjust:exact;print-color-adjust:exact}.period{color:#666;margin-bottom:10px}table{width:100%;border-collapse:collapse;table-layout:fixed}thead{display:table-header-group}th,td{padding:4px 3px;border:1px solid #ddd;text-align:left;vertical-align:top;overflow-wrap:anywhere}.employee-column{width:170px}.date-column{width:auto}.total-column{width:38px;font-weight:600}.muted{color:#666;font-size:8px;margin-top:2px}.activity-name{margin-top:3px}.weekend{background:var(--weekend-bg)}@media print{*{print-color-adjust:exact;-webkit-print-color-adjust:exact}}</style></head><body>${sections.join('')}</body></html>`);
  printWindow.document.close(); printWindow.focus(); printWindow.print();
}

// ═══ ACTIVITY SCHEDULE REPORT ══════════════════════════════════════
function activityScheduleStatuses() {
  return ['tentative', 'confirmed', 'cancelled'].filter(status => document.getElementById(`as-filter-${status}`)?.checked);
}
function activityScheduleDates(start, end) {
  const dates = [];
  for (const d = new Date(`${start}T00:00:00`); fmt(d) <= end; d.setDate(d.getDate() + 1)) dates.push(fmt(d));
  return dates;
}
function activityScheduleFilteredActivities(start, end, statuses) {
  return activities
    .filter(act => act.startDate <= end && act.endDate >= start && statuses.includes(activityStatus(act)) && activityVisibleForScheduleSection(act))
    .sort((a, b) => a.startDate.localeCompare(b.startDate) || a.name.localeCompare(b.name));
}
function activityScheduleHeaderGroups(dates, keyFor, labelFor, className) {
  const groups = [];
  for (const ds of dates) {
    const date = new Date(`${ds}T00:00:00`);
    const key = keyFor(date);
    const group = groups[groups.length - 1];
    if (group && group.key === key) group.span += 1;
    else groups.push({ key, label: labelFor(date), span: 1 });
  }
  return `<tr class="${className}">${groups.map(group => `<th class="gday" colspan="${group.span}">${esc(group.label)}</th>`).join('')}</tr>`;
}
function activityScheduleDateHeaders(dates) {
  return `${activityScheduleHeaderGroups(
    dates,
    date => `${date.getFullYear()}-${date.getMonth()}`,
    date => date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    'activity-schedule-months'
  )}${activityScheduleHeaderGroups(
    dates,
    date => isoWeekStringFromDate(date),
    date => `Week ${isoWeek(date)}`,
    'activity-schedule-weeks'
  )}<tr class="activity-schedule-days">${dates.map(ds => {
    const date = new Date(`${ds}T00:00:00`);
    return `<th class="gday${isWknd(date) ? ' weekend' : ''}"><span>${date.toLocaleDateString('en-US', { weekday: 'short' })}</span><div>${date.getDate()}</div></th>`;
  }).join('')}</tr>`;
}
function activityScheduleBarRow(act, dates) {
  const lifecycle = activityStatusMeta(act);
  const barBackground = lifecycle.status === 'tentative'
    ? `repeating-linear-gradient(135deg,color-mix(in srgb,${act.color} 38%,transparent) 0 5px,color-mix(in srgb,${act.color} 12%,transparent) 5px 10px)`
    : act.color;
  const barOpacity = lifecycle.status === 'tentative' ? '.9' : '.28';
  const visibleStart = dates[0] > act.startDate ? dates[0] : act.startDate;
  const visibleEnd = dates[dates.length - 1] < act.endDate ? dates[dates.length - 1] : act.endDate;
  const startIdx = dates.indexOf(visibleStart);
  const endIdx = dates.indexOf(visibleEnd);
  const labelWidth = gridSpanLabelWidth(startIdx, endIdx);
  let row = `<tr><td class="gempl sticky-left" style="min-width:210px">
    <div class="act-cell-name">
      <span class="flex items-center gap-2" style="min-width:0">
        <span class="act-dot" style="background:${act.color}"></span>
        <span class="act-name" title="${esc(act.name)}">${esc(activityDisplayName(act))}</span>
        ${act.abbreviation ? `<span style="font-size:10px;font-weight:700;color:${act.color};flex-shrink:0">[${esc(act.abbreviation)}]</span>` : ''}
        ${lifecycle.status === 'confirmed' ? '' : `<span class="act-lifecycle ${lifecycle.className}">${lifecycle.label}</span>`}
      </span>
    </div>
    <div class="act-dates muted">${fmtShort(act.startDate)} – ${fmtShort(act.endDate)} · ${act.participants.length} attending</div>
  </td>`;
  for (const ds of dates) {
    const d = new Date(`${ds}T00:00:00`);
    const inR = ds >= act.startDate && ds <= act.endDate;
    if (!inR) { row += `<td class="gday${isWknd(d) ? ' weekend' : ''}"></td>`; continue; }
    const isS = ds === visibleStart, isE = ds === visibleEnd;
    const brl = isS ? '4px 0 0 4px' : '0', brr = isE ? '0 4px 4px 0' : '0';
    row += `<td class="gday${isWknd(d) ? ' weekend' : ''}${isS ? ' span-label-cell' : ''}" style="height:28px${isS ? ';overflow:visible;z-index:4' : ''}">
        <div class="act-bar${lifecycle.status === 'cancelled' ? ' cancelled-bar' : ''}" style="position:absolute;top:4px;bottom:4px;left:${isS ? '3px' : '0'};right:${isE ? '3px' : '0'};background:${barBackground};opacity:${barOpacity};border-radius:${brl} ${brr}"></div>
        ${isS ? `<span class="grid-span-label" title="${esc(act.name)}" style="color:${act.color};width:${labelWidth}px">${esc(activityDisplayName(act))}${lifecycle.status === 'confirmed' ? '' : (lifecycle.status === 'cancelled' ? `<span class="grid-span-status cancelled">${lifecycle.label}</span>` : ` · ${lifecycle.label}`)}</span>` : ''}
      </td>`;
  }
  return row + '</tr>';
}
function openActivityScheduleReport() {
  const start = new Date();
  const end = new Date(start);
  end.setDate(end.getDate() + 30);
  document.getElementById('as-start').value = fmt(start);
  document.getElementById('as-end').value = fmt(end);
  document.getElementById('activity-schedule-modal').classList.add('open');
  renderActivityScheduleReport();
}
function renderActivityScheduleReport() {
  const start = document.getElementById('as-start').value;
  const end = document.getElementById('as-end').value;
  const content = document.getElementById('activity-schedule-content');
  if (!start || !end || end < start) { content.innerHTML = '<div class="empty-note" style="padding:24px;text-align:center">Choose a valid date range.</div>'; return; }
  const statuses = activityScheduleStatuses();
  const dates = activityScheduleDates(start, end);
  const filtered = activityScheduleFilteredActivities(start, end, statuses);
  const secLabel = renderSecurityLabel();
  content.innerHTML = `
    <div style="margin-bottom:14px;display:flex;align-items:flex-start;justify-content:space-between;gap:12px"><div><div style="font-weight:600;font-size:14px">Activity Schedule</div><div class="muted text-sm" style="margin-top:3px">Period: ${fmtMed(start)} – ${fmtMed(end)}</div></div>${secLabel}</div>
    ${!filtered.length ? '<div class="empty-note" style="padding:24px;text-align:center">No activities match the selected period and filters.</div>' : `<div style="overflow:auto"><table class="gtable"><thead><tr><th class="gempl sticky-left" rowspan="3" style="min-width:210px">Activity</th></tr>${activityScheduleDateHeaders(dates)}</thead><tbody>${filtered.map(act => activityScheduleBarRow(act, dates)).join('')}</tbody></table></div>`}
  `;
}
function printActivityScheduleReport() {
  const start = document.getElementById('as-start').value;
  const end = document.getElementById('as-end').value;
  if (!start || !end || end < start) { alert('Choose a valid date range first.'); return; }
  const statuses = activityScheduleStatuses();
  const dates = activityScheduleDates(start, end);
  const filtered = activityScheduleFilteredActivities(start, end, statuses);
  const secCfg = normalizeSecurityLabel(appSettings.securityLabel);
  const secLabelHtml = secCfg.enabled ? `<span class="security-label" style="--security-label-color:${esc(secCfg.color)}">${esc(secCfg.text)}</span>` : '';
  const sections = [];
  for (let i = 0; i < dates.length; i += 14) {
    const chunkDates = dates.slice(i, i + 14);
    sections.push(`<section class="report-section">
      <div class="report-header"><h1>Activity Schedule</h1>${secLabelHtml}</div>
      <div class="period">Period: ${fmtMed(chunkDates[0])} – ${fmtMed(chunkDates[chunkDates.length - 1])}</div>
      <table><thead><tr><th class="employee-column" rowspan="3">Activity</th></tr>${activityScheduleDateHeaders(chunkDates)}</thead>
      <tbody>${filtered.map(act => activityScheduleBarRow(act, chunkDates)).join('')}</tbody></table>
    </section>`);
  }
  const printWindow = window.open('', '_blank', 'width=1400,height=900');
  if (!printWindow) { alert('Please allow pop-ups to print the activity schedule.'); return; }
  printWindow.document.write(`<!doctype html><html><head><title>Activity Schedule</title><style>@page{size:landscape;margin:8mm}*{box-sizing:border-box}:root{--muted:#666;--text:#111;--destructive:#dc2626;--surface:#fff}body{font:8px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#111;margin:0}.report-section{page-break-after:always;break-after:page}.report-section:last-child{page-break-after:auto;break-after:auto}.report-header{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:5px}.report-header h1{font-size:18px;margin:0}.security-label{display:inline-flex;align-items:center;justify-content:center;padding:3px 10px;border-radius:4px;border:1.5px solid currentColor;background:var(--security-label-color,#16a34a);color:#fff;font-size:9px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;line-height:1;-webkit-print-color-adjust:exact;print-color-adjust:exact}.period{color:#666;margin-bottom:10px}table{width:100%;border-collapse:collapse;table-layout:fixed}thead{display:table-header-group}th,td{padding:4px 3px;border:1px solid #ddd;text-align:left;vertical-align:top;overflow-wrap:anywhere;position:relative}.employee-column{width:170px}.date-column{width:auto}.muted{color:#666;font-size:8px;margin-top:2px}.weekend{background:var(--weekend-bg)}.act-cell-name{display:flex;flex-direction:column;gap:2px}.act-dot{display:inline-block;width:10px;height:10px;border-radius:50%}.act-lifecycle{padding:1px 4px;border-radius:4px;font-size:8px;font-weight:700;text-transform:uppercase}.act-lifecycle.planned{color:#92400e;background:#fef3c7;border:1px solid #f59e0b}.act-lifecycle.cancelled{color:#b91c1c;background:#fee2e2;border:1px solid #ef4444}.act-bar{position:absolute;top:4px;bottom:4px}.act-bar.cancelled-bar::after{content:'';position:absolute;left:0;right:0;top:50%;height:3px;background:var(--destructive);box-shadow:0 0 0 1px var(--surface);transform:translateY(-50%)}.grid-span-label{position:absolute;left:7px;top:50%;transform:translateY(-50%);font-size:9px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;z-index:5}.grid-span-status.cancelled{color:#b91c1c;background:#fee2e2;border:1px solid #ef4444;font-size:9px;font-weight:800;padding:0 3px;border-radius:3px;margin-left:4px}@media print{*{print-color-adjust:exact;-webkit-print-color-adjust:exact}}</style></head><body>${sections.join('')}</body></html>`);
  printWindow.document.close(); printWindow.focus(); printWindow.print();
}

let editingCourseId = null;
function courseStatusFor(courseId, employeeId) {
  const record = courseStatuses[`${courseId}_${employeeId}`] || { status: 'not_relevant', plannedDate: '' };
  return record.status === 'not_taken' ? { ...record, status: 'mandatory' } : record;
}
function courseComplianceMeta(status) {
  if (status === 'taken') return { label: 'Taken', color: '#16a34a' };
  if (status === 'planned') return { label: 'Planned', color: '#ca8a04' };
  if (status === 'mandatory') return { label: 'Mandatory, not planned', color: '#dc2626' };
  return { label: 'Not relevant', color: 'var(--muted)' };
}
function openCourseModal(courseId = null) {
  editingCourseId = courseId;
  const course = courseId === null ? null : courses.find(item => item.id === courseId);
  document.getElementById('course-modal-title').textContent = course ? 'Edit Course' : 'Add Course';
  document.getElementById('course-delete-btn').style.display = course ? 'inline-block' : 'none';
  document.getElementById('course-name').value = course?.name || '';
  document.getElementById('course-code').value = course?.code || '';
  document.getElementById('course-modal').classList.add('open');
}
async function saveCourseFromModal() {
  const name = document.getElementById('course-name').value.trim();
  const code = document.getElementById('course-code').value.trim();
  if (!name) { alert('Course name is required.'); return; }
  if (courses.some(course => course.id !== editingCourseId && course.name.toLowerCase() === name.toLowerCase())) { alert('A course with this name already exists.'); return; }
  await mutateState('saveCourseFromModal', () => {
    if (editingCourseId === null) courses.push({ id: Date.now(), name, code });
    else { const course = courses.find(item => item.id === editingCourseId); if (course) { course.name = name; course.code = code; } }
  });
  closeModal('course-modal'); renderStatusBoard();
}
async function deleteCourseFromModal() {
  if (editingCourseId === null) return;
  await mutateState('deleteCourseFromModal', () => {
    courses = courses.filter(course => course.id !== editingCourseId);
    Object.keys(courseStatuses).forEach(key => { if (key.startsWith(`${editingCourseId}_`)) delete courseStatuses[key]; });
  });
  closeModal('course-modal'); renderStatusBoard();
}
async function saveCourseStatus(courseId, employeeId, status, plannedDate) {
  await mutateState('saveCourseStatus', () => {
    const key = `${courseId}_${employeeId}`;
    if (status === 'not_relevant') delete courseStatuses[key];
    else courseStatuses[key] = { status, plannedDate: plannedDate || '' };
  });
  renderStatusBoard();
}
let editingCourseCell = null;
function openCourseCellModal(courseId, employeeId) {
  const course = courses.find(c => c.id === courseId);
  const employee = empById(employeeId);
  if (!course || !employee) return;
  editingCourseCell = { courseId, employeeId };
  const record = courseStatusFor(courseId, employeeId);
  document.getElementById('course-cell-modal-title').textContent = course.name;
  document.getElementById('course-cell-modal-desc').textContent = `${employee.name} · ${employee.department || ''}`.trim();
  document.getElementById('course-cell-status').value = record.status || 'not_relevant';
  document.getElementById('course-cell-date').value = record.plannedDate || '';
  document.getElementById('course-cell-modal').classList.add('open');
  setTimeout(() => document.getElementById('course-cell-date').focus(), 30);
}
async function saveCourseCellFromModal() {
  if (!editingCourseCell) return;
  const status = document.getElementById('course-cell-status').value;
  const date = document.getElementById('course-cell-date').value;
  await mutateState('saveCourseCell', () => {
    const key = `${editingCourseCell.courseId}_${editingCourseCell.employeeId}`;
    if (status === 'not_relevant') delete courseStatuses[key];
    else courseStatuses[key] = { status, plannedDate: date || '' };
  });
  closeModal('course-cell-modal');
  editingCourseCell = null;
}
async function clearCourseCellFromModal() {
  if (!editingCourseCell) return;
  await mutateState('clearCourseCell', () => {
    const key = `${editingCourseCell.courseId}_${editingCourseCell.employeeId}`;
    delete courseStatuses[key];
  });
  closeModal('course-cell-modal');
  editingCourseCell = null;
}
let editingRequirementId = null;
let editingRequirementEmployeeId = null;
function requirementRecordFor(requirementId, employeeId, year = boardYear) {
  return requirementRecords[`${requirementId}_${employeeId}_${year}`] || { completedDate: '', dueDate: '', result: '', required: true };
}
function changeBoardYear(step) {
  boardYear += step;
  renderStatusBoard();
}
function openRequirementDefinitionModal(requirementId = null) {
  editingRequirementId = requirementId;
  const requirement = requirementId === null ? null : requirements.find(item => item.id === requirementId);
  document.getElementById('req-def-modal-title').textContent = requirement ? 'Edit requirement' : 'Add requirement';
  document.getElementById('req-def-delete-btn').style.display = requirement ? 'inline-block' : 'none';
  document.getElementById('req-def-name').value = requirement?.name || '';
  document.getElementById('req-def-modal').classList.add('open');
}
async function saveRequirementFromModal() {
  const name = document.getElementById('req-def-name').value.trim();
  if (!name) { alert('Requirement name is required.'); return; }
  if (requirements.some(requirement => requirement.id !== editingRequirementId && requirement.name.toLowerCase() === name.toLowerCase())) {
    alert('A requirement with this name already exists.');
    return;
  }
  await mutateState('saveRequirementFromModal', () => {
  if (editingRequirementId === null) {
    const nextId = requirements.reduce((max, requirement) => Math.max(max, Number(requirement.id) || 0), 0) + 1;
    requirements.push({ id: nextId, name });
  } else {
    const requirement = requirements.find(item => item.id === editingRequirementId);
    if (requirement) requirement.name = name;
  }
  });
  closeModal('req-def-modal');
  renderStatusBoard();
}
async function deleteRequirementFromModal() {
  if (editingRequirementId === null) return;
  const requirement = requirements.find(item => item.id === editingRequirementId);
  if (!requirement || !confirm(`Delete requirement "${requirement.name}" and all of its employee records?`)) return;
  await mutateState('deleteRequirementFromModal', () => {
    requirements = requirements.filter(item => item.id !== editingRequirementId);
    Object.keys(requirementRecords).forEach(key => {
      if (key.startsWith(`${editingRequirementId}_`)) delete requirementRecords[key];
    });
  });
  closeModal('req-def-modal');
  renderStatusBoard();
}
function openRequirementRecordModal(requirementId, employeeId) {
  editingRequirementId = requirementId;
  editingRequirementEmployeeId = employeeId;
  const requirement = requirements.find(item => item.id === requirementId);
  const record = requirementRecordFor(requirementId, employeeId);
  document.getElementById('req-record-modal-title').textContent = `${empById(employeeId)?.name || 'Employee'} · ${requirement?.name || 'Requirement'} · ${boardYear}`;
  document.getElementById('req-record-required').value = record.required === false ? 'not_required' : 'required';
  document.getElementById('req-record-completed').value = record.completedDate || '';
  document.getElementById('req-record-due').value = record.dueDate || '';
  document.getElementById('req-record-result').value = record.result || '';
  toggleRequirementFields();
  document.getElementById('req-record-modal').classList.add('open');
}
function toggleRequirementFields() {
  document.getElementById('req-record-fields').style.display = document.getElementById('req-record-required').value === 'not_required' ? 'none' : 'block';
}
async function saveRequirementRecordFromModal() {
  if (editingRequirementId === null || editingRequirementEmployeeId === null) return;
  const required = document.getElementById('req-record-required').value !== 'not_required';
  const completedDate = required ? document.getElementById('req-record-completed').value : '';
  const dueDate = required ? document.getElementById('req-record-due').value : '';
  const result = required ? document.getElementById('req-record-result').value.trim() : '';
  const key = `${editingRequirementId}_${editingRequirementEmployeeId}_${boardYear}`;
  await mutateState('saveRequirementRecordFromModal', () => {
    if (!required) requirementRecords[key] = { completedDate: '', dueDate: '', result: '', required: false };
    else if (!completedDate && !dueDate && !result) delete requirementRecords[key];
    else requirementRecords[key] = { completedDate, dueDate, result, required: true };
  });
  closeModal('req-record-modal');
  renderStatusBoard();
}
function renderLegacyStatusBoard() {
  const employeeList = [...employees].sort((a, b) =>
    a.department.localeCompare(b.department) ||
    ((a.sortOrder ?? 99) - (b.sortOrder ?? 99)) ||
    a.name.localeCompare(b.name));
  const courseRows = courses.slice().sort((a, b) => a.name.localeCompare(b.name));
  const boardWidth = 260 + employeeList.length * 190;
  document.getElementById('content').innerHTML = `
    <div class="mb-6"><div class="page-title">Personnel Status Board</div><div class="page-sub">Track courses, planned training, and fitness tests for every employee.</div></div>
    <div class="flex items-center justify-between mb-4" style="gap:12px;flex-wrap:wrap"><div class="card-title" style="font-size:15px">Courses (${courses.length})</div><button class="btn btn-primary" onclick="openCourseModal()">Add course</button></div>
    <div class="card" style="padding:0;overflow:auto"><table style="width:100%;border-collapse:collapse;min-width:${boardWidth}px;font-size:12px">
      <thead><tr style="text-align:left;border-bottom:2px solid var(--border)"><th style="position:sticky;left:0;background:var(--surface);z-index:2;padding:10px 12px;min-width:160px">Course</th>${employeeList.map(employee => `<th style="padding:8px 7px;min-width:140px;vertical-align:top"><div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(employee.name)}</div><div class="muted" style="font-size:9px;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(employee.department)}</div></th>`).join('')}</tr></thead>
      <tbody>${courseRows.length ? courseRows.map(course => `<tr style="border-bottom:1px solid var(--border)"><td style="position:sticky;left:0;background:var(--surface);z-index:1;padding:10px 12px"><button class="btn btn-sm" onclick="openCourseModal(${course.id})" style="text-align:left;max-width:220px;white-space:normal">${esc(course.name)}${course.code ? `<span class="muted" style="display:block;font-size:10px;margin-top:2px">${esc(course.code)}</span>` : ''}</button></td>${employeeList.map(employee => { const record = courseStatusFor(course.id, employee.id); const compliance = courseComplianceMeta(record.status); return `<td style="padding:8px 12px;vertical-align:top"><div style="display:flex;align-items:center;gap:5px;margin-bottom:4px;color:${compliance.color};font-size:10px;font-weight:600"><span style="width:8px;height:8px;border-radius:50%;background:${compliance.color};display:inline-block"></span>${compliance.label}</div><select class="plain-select" style="width:100%;font-size:11px" onchange="saveCourseStatus(${course.id},${employee.id},this.value,this.nextElementSibling.value)"><option value="not_relevant"${record.status === 'not_relevant' ? ' selected' : ''}>Not relevant</option><option value="mandatory"${record.status === 'mandatory' ? ' selected' : ''}>Mandatory, not planned</option><option value="planned"${record.status === 'planned' ? ' selected' : ''}>Planned</option><option value="taken"${record.status === 'taken' ? ' selected' : ''}>Taken</option></select><input type="date" value="${esc(record.plannedDate || '')}" ${record.status === 'planned' ? '' : 'disabled'} style="width:100%;margin-top:5px;padding:5px 6px;border:1px solid var(--border);border-radius:6px;font-size:11px;background:var(--surface);color:var(--text)" onchange="saveCourseStatus(${course.id},${employee.id},this.previousElementSibling.value,this.value)" title="Planned date"></td>`; }).join('')}</tr>`).join('') : `<tr><td colspan="${employeeList.length + 1}" class="empty-note">No courses yet. Add a course to start tracking.</td></tr>`}</tbody>
    </table></div>
    <div class="card" style="margin-top:24px;padding:0;overflow:auto"><div style="padding:14px 12px 8px;font-weight:600">Fitness Tests</div><table style="width:100%;border-collapse:collapse;min-width:${180 + employeeList.length * 130}px;font-size:12px"><thead><tr style="text-align:left;border-bottom:2px solid var(--border)"><th style="position:sticky;left:0;background:var(--surface);z-index:2;padding:10px 12px;min-width:150px">Test</th>${employeeList.map(employee => `<th style="padding:10px 8px;min-width:125px;white-space:nowrap">${esc(employee.name)}</th>`).join('')}</tr></thead><tbody>${['condition', 'strength'].map(testType => `<tr style="border-bottom:1px solid var(--border)"><td style="position:sticky;left:0;background:var(--surface);z-index:1;padding:10px 12px;font-weight:600">${testType === 'condition' ? 'Condition' : 'Strength'}</td>${employeeList.map(employee => { const record = fitnessFor(employee.id, testType); const label = record.required === false ? 'Not required' : (record.grade ? `Grade ${esc(record.grade)}` : 'Not entered'); const color = record.required === false ? 'var(--muted)' : (record.grade ? '#16a34a' : '#dc2626'); return `<td style="padding:8px;vertical-align:top"><button class="btn btn-sm" onclick="openFitnessModal(${employee.id},'${testType}')" style="width:100%;text-align:left;color:${color};white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="Click to edit date and grade">${label}</button></td>`; }).join('')}</tr>`).join('')}</tbody></table></div>`;
}

function annualRequirementCell(requirement, employee) {
  const record = requirementRecordFor(requirement.id, employee.id);
  if (record.required === false) {
    return `<button class="btn btn-sm" onclick="openRequirementRecordModal(${requirement.id},${employee.id})" style="width:100%;height:auto;min-height:54px;padding:7px 9px;text-align:left;white-space:normal;color:var(--muted)" title="Edit annual requirement">Not required</button>`;
  }
  const overdue = Boolean(record.dueDate && record.dueDate < todayStr());
  const isCompleted = Boolean(record.completedDate || record.result);
  const accent = overdue ? 'var(--destructive)' : (isCompleted ? '#16a34a' : '#dc2626');
  const status = overdue ? 'Overdue' : (record.result ? esc(record.result) : (record.completedDate ? 'Completed' : 'Not entered'));
  const completed = record.completedDate ? `<div class="muted" style="font-size:10px;margin-top:3px">Completed ${fmtMed(record.completedDate)}</div>` : '';
  const due = record.dueDate ? `<div style="font-size:10px;margin-top:2px;color:${overdue ? 'var(--destructive)' : 'var(--muted)'}">Due ${fmtMed(record.dueDate)}</div>` : '';
  return `<button class="btn btn-sm" onclick="openRequirementRecordModal(${requirement.id},${employee.id})" style="width:100%;height:auto;min-height:54px;padding:7px 9px;text-align:left;white-space:normal;border-color:${overdue ? 'var(--destructive)' : 'var(--border)'};background:${overdue ? 'color-mix(in srgb,var(--destructive) 9%,var(--surface))' : 'var(--surface)'}" title="Edit annual requirement"><strong style="color:${accent}">${status}</strong>${completed}${due}</button>`;
}
function courseCellSummary(record) {
  const counts = { mandatory: 0, planned: 0, taken: 0, not_relevant: 0 };
  return counts;
}
function courseCellHtml(course, employee) {
  const record = courseStatusFor(course.id, employee.id);
  const compliance = courseComplianceMeta(record.status);
  const dateLabel = record.plannedDate ? fmtMed(record.plannedDate) : '';
  const dateLine = dateLabel ? `<div class="muted" style="font-size:10px;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${dateLabel}</div>` : '';
  const overdue = record.status === 'planned' && record.plannedDate && record.plannedDate < todayStr();
  const accent = overdue ? 'var(--destructive)' : compliance.color;
  const statusLabel = overdue ? 'Overdue' : compliance.label;
  return `<button type="button" class="course-cell" onclick="openCourseCellModal(${course.id},${employee.id})" title="${esc(course.name)} · ${esc(employee.name)} — click to edit" style="--accent:${accent}">
    <div class="course-cell-row">
      <span class="course-cell-dot" style="background:${accent}"></span>
      <span class="course-cell-status" style="color:${accent}">${esc(statusLabel)}</span>
    </div>
    ${dateLine}
  </button>`;
}
function setBoardFilter(key, value) {
  boardFilters[key] = value;
  renderStatusBoard();
}
function renderStatusBoard() {
  const allEmployees = [...employees].sort((a, b) =>
    a.department.localeCompare(b.department, 'nb', { sensitivity: 'base' }) ||
    ((a.sortOrder ?? 99) - (b.sortOrder ?? 99)) ||
    a.name.localeCompare(b.name, 'nb', { sensitivity: 'base' }));
  const courseRows = [...courses].sort((a, b) => a.name.localeCompare(b.name, 'nb', { sensitivity: 'base' }));
  const requirementColumns = [...requirements].sort((a, b) => a.name.localeCompare(b.name, 'nb', { sensitivity: 'base' }));

  // Apply filters
  const searchLower = (boardFilters.search || '').toLowerCase();
  const employeeList = allEmployees.filter(emp => {
    if (boardFilters.dept && emp.department !== boardFilters.dept) return false;
    if (searchLower && !emp.name.toLowerCase().includes(searchLower) && !(emp.department || '').toLowerCase().includes(searchLower)) return false;
    if (boardFilters.status !== 'all') {
      const hasMatch = courseRows.some(course => {
        const rec = courseStatusFor(course.id, emp.id);
        if (boardFilters.status === 'overdue') {
          return rec.status === 'planned' && rec.plannedDate && rec.plannedDate < todayStr();
        }
        return rec.status === boardFilters.status;
      });
      if (!hasMatch) return false;
    }
    return true;
  });

  // Group employees by department for sticky headers
  const byDept = new Map();
  for (const emp of employeeList) {
    const dept = emp.department || 'Unassigned';
    if (!byDept.has(dept)) byDept.set(dept, []);
    byDept.get(dept).push(emp);
  }
  const deptGroups = [...byDept.entries()].map(([dept, list]) => ({ dept, list }));

  // Per-employee summary counts
  function employeeSummary(emp) {
    const counts = { mandatory: 0, planned: 0, taken: 0, overdue: 0 };
    for (const course of courseRows) {
      const rec = courseStatusFor(course.id, emp.id);
      if (rec.status === 'mandatory') counts.mandatory++;
      else if (rec.status === 'planned') {
        if (rec.plannedDate && rec.plannedDate < todayStr()) counts.overdue++;
        else counts.planned++;
      } else if (rec.status === 'taken') counts.taken++;
    }
    return counts;
  }
  // Per-course summary counts
  function courseSummary(course) {
    const counts = { mandatory: 0, planned: 0, taken: 0, overdue: 0, total: employeeList.length };
    for (const emp of employeeList) {
      const rec = courseStatusFor(course.id, emp.id);
      if (rec.status === 'mandatory') counts.mandatory++;
      else if (rec.status === 'planned') {
        if (rec.plannedDate && rec.plannedDate < todayStr()) counts.overdue++;
        else counts.planned++;
      } else if (rec.status === 'taken') counts.taken++;
    }
    return counts;
  }

  const allDepts = [...new Set(allEmployees.map(e => e.department).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'nb', { sensitivity: 'base' }));
  const requirementBoardWidth = 230 + requirementColumns.length * 190;

  // Filter bar
  const filterBar = `
    <div class="flex items-center gap-2 mb-4" style="flex-wrap:wrap">
      <div class="search-box" style="max-width:240px">
        <span class="search-ico"><svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg></span>
        <input id="board-search" type="text" placeholder="Search employees…" value="${esc(boardFilters.search)}" oninput="setBoardFilter('search', this.value)">
      </div>
      <select class="plain-select" style="height:32px;padding:5px 9px" onchange="setBoardFilter('dept', this.value)" aria-label="Filter by department">
        <option value="">All departments</option>
        ${allDepts.map(d => `<option value="${esc(d)}"${boardFilters.dept === d ? ' selected' : ''}>${esc(d)}</option>`).join('')}
      </select>
      <select class="plain-select" style="height:32px;padding:5px 9px" onchange="setBoardFilter('status', this.value)" aria-label="Filter by status">
        <option value="all"${boardFilters.status === 'all' ? ' selected' : ''}>All statuses</option>
        <option value="mandatory"${boardFilters.status === 'mandatory' ? ' selected' : ''}>Mandatory only</option>
        <option value="planned"${boardFilters.status === 'planned' ? ' selected' : ''}>Planned only</option>
        <option value="overdue"${boardFilters.status === 'overdue' ? ' selected' : ''}>Overdue only</option>
        <option value="taken"${boardFilters.status === 'taken' ? ' selected' : ''}>Taken only</option>
      </select>
      ${(boardFilters.dept || boardFilters.search || boardFilters.status !== 'all') ? `<button class="btn btn-sm" onclick="boardFilters={dept:'',status:'all',search:''};renderStatusBoard()">Clear filters</button>` : ''}
      <span class="muted text-sm" style="margin-left:auto">${employeeList.length} of ${allEmployees.length} employees · ${courseRows.length} courses</span>
    </div>`;

  // Build course table (employee × course matrix)
  let courseBody;
  if (!courseRows.length) {
    courseBody = `<tr><td class="empty-note">No courses yet. Add a course to start tracking.</td></tr>`;
  } else if (!employeeList.length) {
    courseBody = `<tr><td class="empty-note">No employees match the current filters.</td></tr>`;
  } else {
    const rows = [];
    for (const group of deptGroups) {
      const deptColor = resolveDeptColor(group.dept) || '#3b82f6';
      rows.push(`<tr class="dept-row"><td colspan="${courseRows.length + 2}" style="background:${deptColor}1a;border-bottom:1px solid ${deptColor};color:var(--text)">${esc(group.dept)} <span style="font-weight:400;text-transform:none">· ${group.list.length} ${group.list.length === 1 ? 'person' : 'people'}</span></td></tr>`);
      for (const emp of group.list) {
        const summary = employeeSummary(emp);
        const summaryParts = [];
        if (summary.overdue) summaryParts.push(`<span style="color:var(--destructive);font-weight:700">${summary.overdue} overdue</span>`);
        if (summary.mandatory) summaryParts.push(`<span style="color:#dc2626">${summary.mandatory} mandatory</span>`);
        if (summary.planned) summaryParts.push(`<span style="color:#ca8a04">${summary.planned} planned</span>`);
        if (summary.taken) summaryParts.push(`<span style="color:#16a34a">${summary.taken} taken</span>`);
        const summaryHtml = summaryParts.length ? `<div class="muted" style="font-size:10px;margin-top:3px;display:flex;flex-wrap:wrap;gap:6px">${summaryParts.join(' · ')}</div>` : '';
        rows.push(`<tr data-employee-id="${emp.id}" style="border-bottom:1px solid var(--border)">
          <td style="position:sticky;left:0;background:var(--surface);z-index:1;padding:8px 10px;min-width:180px">
            <div style="font-weight:600;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(emp.name)}</div>
            <div class="muted" style="font-size:10px;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(emp.department || '')}</div>
            ${summaryHtml}
          </td>
          ${courseRows.map(course => `<td style="padding:4px 5px;vertical-align:top;min-width:120px">${courseCellHtml(course, emp)}</td>`).join('')}
          <td style="padding:4px 5px;vertical-align:top;min-width:90px;text-align:center">
            <div style="font-size:11px;font-weight:600;color:${summary.overdue ? 'var(--destructive)' : 'var(--text)'}">${summary.overdue + summary.mandatory + summary.planned + summary.taken}/${courseRows.length}</div>
            <div class="muted" style="font-size:9px;margin-top:2px">tracked</div>
          </td>
        </tr>`);
      }
    }
    courseBody = rows.join('');
  }

  // Course summary header row
  const courseSummaryHeader = courseRows.length ? `<tr style="background:var(--muted-bg);font-size:10px;font-weight:600;color:var(--muted)">
    <td style="position:sticky;left:0;background:var(--muted-bg);z-index:1;padding:6px 10px;text-align:right">Course totals →</td>
    ${courseRows.map(course => {
      const s = courseSummary(course);
      const parts = [];
      if (s.overdue) parts.push(`<span style="color:var(--destructive)">${s.overdue}OD</span>`);
      if (s.mandatory) parts.push(`<span style="color:#dc2626">${s.mandatory}M</span>`);
      if (s.planned) parts.push(`<span style="color:#ca8a04">${s.planned}P</span>`);
      if (s.taken) parts.push(`<span style="color:#16a34a">${s.taken}T</span>`);
      return `<td style="padding:6px 5px;text-align:center;min-width:120px"><div style="display:flex;flex-direction:column;gap:2px;align-items:center">${parts.length ? parts.join(' ') : '<span class="muted">—</span>'}<div class="muted" style="font-size:9px">${s.taken}/${s.total}</div></div></td>`;
    }).join('')}
    <td style="padding:6px 5px"></td>
  </tr>` : '';

  const requirementBody = employeeList.length && requirementColumns.length
    ? employeeList.map(employee => `<tr data-employee-id="${employee.id}" style="border-bottom:1px solid var(--border)"><td style="position:sticky;left:0;background:var(--surface);z-index:1;padding:8px 10px"><div style="font-weight:600;font-size:11px">${esc(employee.name)}</div><div class="muted" style="font-size:9px;margin-top:2px">${esc(employee.department)}</div></td>${requirementColumns.map(requirement => `<td data-requirement-id="${requirement.id}" style="padding:5px 6px;vertical-align:top">${annualRequirementCell(requirement, employee)}</td>`).join('')}</tr>`).join('')
    : `<tr><td colspan="${requirementColumns.length + 1}" class="empty-note">${employeeList.length ? 'No annual requirements yet. Add one to start tracking.' : 'Add employees before tracking annual requirements.'}</td></tr>`;

  document.getElementById('content').innerHTML = `
    <div class="flex items-center justify-between mb-6" style="gap:12px;flex-wrap:wrap">
      <div><div class="page-title">Personnel Status Board</div><div class="page-sub">Track courses, planned training, annual certifications, and recurring requirements.</div></div>
      <div class="flex items-center gap-2" style="flex-wrap:wrap">
        ${renderSecurityLabel()}
        <div class="year-nav" style="gap:8px;background:var(--surface);padding:4px 8px;border-radius:8px;border:1px solid var(--border)">
          <button class="btn btn-icon" onclick="changeBoardYear(-1)" aria-label="Previous year">${svgIcon('chevronLeft')}</button>
          <span class="year-label" style="min-width:60px">${boardYear}</span>
          <button class="btn btn-icon" onclick="changeBoardYear(1)" aria-label="Next year">${svgIcon('chevronRight')}</button>
        </div>
      </div>
    </div>
    ${filterBar}
    <div class="flex items-center justify-between mb-4" style="gap:12px;flex-wrap:wrap"><div class="card-title" style="font-size:15px">Courses (${courseRows.length})</div><button class="btn btn-primary" onclick="openCourseModal()">Add course</button></div>
    <div class="card" style="padding:0;overflow:auto"><table style="width:100%;border-collapse:collapse;font-size:12px"><thead><tr style="text-align:left;border-bottom:2px solid var(--border)"><th style="position:sticky;left:0;background:var(--surface);z-index:2;padding:8px 10px;min-width:180px">Employee</th>${courseRows.map(course => `<th style="padding:8px 10px;min-width:120px;vertical-align:top"><button class="btn btn-sm" onclick="openCourseModal(${course.id})" style="text-align:left;width:100%;height:auto;white-space:normal;font-size:11px">${esc(course.name)}${course.code ? `<span class="muted" style="display:block;font-size:9px;margin-top:2px">${esc(course.code)}</span>` : ''}</button></th>`).join('')}<th style="padding:8px 10px;min-width:90px;background:var(--muted-bg);font-size:11px">Total</th></tr></thead><tbody>${courseBody}${courseSummaryHeader}</tbody></table></div>
    <div class="flex items-center justify-between" style="gap:12px;flex-wrap:wrap;margin:24px 0 16px"><div><div class="card-title" style="font-size:15px">Annual Requirements (${requirements.length})</div><div class="muted text-sm" style="margin-top:3px">Records shown for ${boardYear}.</div></div><button class="btn btn-primary" onclick="openRequirementDefinitionModal()">Add requirement</button></div>
    <div class="card" style="padding:0;overflow:auto"><table style="width:100%;border-collapse:collapse;min-width:${requirementBoardWidth}px;font-size:12px"><thead><tr style="text-align:left;border-bottom:2px solid var(--border)"><th style="position:sticky;left:0;background:var(--surface);z-index:2;padding:8px 10px;min-width:140px">Employee</th>${requirementColumns.map(requirement => `<th data-requirement-id="${requirement.id}" style="padding:6px 8px;min-width:150px;vertical-align:top"><button class="btn btn-sm" onclick="openRequirementDefinitionModal(${requirement.id})" style="width:100%;height:auto;text-align:left;white-space:normal;font-size:11px">${esc(requirement.name)}</button></th>`).join('')}</tr></thead><tbody>${requirementBody}</tbody></table></div>`;
}

// ═══ PERSONNEL ═══════════════════════════════════════════════════════════════
async function setDepartmentColor(dept, color) {
  if (!dept) return;
  const safe = normalizeHexColor(color, '#3b82f6');
  await mutateState('setDepartmentColor', () => {
    appSettings.departmentColors = appSettings.departmentColors || {};
    appSettings.departmentColors[dept] = safe;
    persistSettings();
  }, { saveDisk: true });
  renderPage();
  showToast(`Color updated for ${dept}. Remember to Save Changes.`, 4000);
}
async function setSubdepartmentColor(dept, subdept, color) {
  const safe = normalizeHexColor(color, resolveDeptColor(dept) || '#64748b');
  await mutateState('setSubdepartmentColor', () => {
    appSettings.subdepartmentColors = appSettings.subdepartmentColors || {};
    appSettings.subdepartmentColors[subdepartmentColorKey(dept, subdept)] = safe;
    persistSettings();
  }, { saveDisk: true });
  renderPage();
  showToast(`Color updated for ${dept} / ${subdept}. Remember to Save Changes.`, 4000);
}
function personnelSectionKey(organisation, department, section) {
  return `${organisation}\u0000${department}\u0000${section}`;
}
function personnelDepartmentKey(organisation, department) { return `${organisation}\u0000${department}`; }
function togglePersonnelDepartment(organisation, department) {
  const key = personnelDepartmentKey(organisation, department);
  if (collapsedPersonnelDepartments.has(key)) collapsedPersonnelDepartments.delete(key);
  else collapsedPersonnelDepartments.add(key);
  renderEmployees();
}
function togglePersonnelSection(organisation, department, section) {
  const key = personnelSectionKey(organisation, department, section);
  if (collapsedPersonnelSections.has(key)) collapsedPersonnelSections.delete(key);
  else collapsedPersonnelSections.add(key);
  renderEmployees();
}
function startPersonnelDrag(event, empId) {
  draggedPersonnelId = Number(empId);
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('text/plain', String(empId));
  event.currentTarget.classList.add('personnel-dragging');
}
function endPersonnelDrag(event) {
  event.currentTarget.classList.remove('personnel-dragging');
  draggedPersonnelId = null;
}
function allowPersonnelDrop(event) {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
  event.currentTarget.classList.add('personnel-drop-target');
}
function clearPersonnelDrop(event) {
  event.currentTarget.classList.remove('personnel-drop-target');
}
async function dropPersonnel(event, targetId) {
  event.preventDefault();
  clearPersonnelDrop(event);
  const sourceId = draggedPersonnelId || Number(event.dataTransfer.getData('text/plain'));
  if (!sourceId || sourceId === Number(targetId)) return;
  const source = empById(sourceId), target = empById(Number(targetId));
  if (!source || !target) return;
  const sameGroup = employeeHierarchyPath(source) === employeeHierarchyPath(target);
  if (!sameGroup && !confirm(`Move ${source.name} into ${employeeHierarchyPath(target) || 'this hierarchy group'}?`)) return;
  await mutateState('dropPersonnel', () => {
    if (!sameGroup) {
      source.organisation = target.organisation || '';
      source.department = target.department || '';
      source.section = target.section || target.subdepartment || '';
      source.process = target.process || '';
      source.team = target.team || '';
      source.subdepartment = source.section;
    }
    const groupMembers = employees.filter(employee => employee.id !== source.id && employeeHierarchyPath(employee) === employeeHierarchyPath(target)).sort((a, b) => (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999));
    const targetIndex = groupMembers.findIndex(employee => employee.id === target.id);
    const insertAt = Math.max(0, targetIndex);
    groupMembers.splice(insertAt, 0, source);
    groupMembers.forEach((employee, index) => { employee.sortOrder = (index + 1) * 10; });
    ensureEmployeeSortOrders(employees);
  }, { saveDisk: true });
  renderEmployees();
}
function renderEmployees() {
  const searchLower = empSearch.toLowerCase();
  const filtered = employees.filter(emp => {
    const matchesSearch = !searchLower ||
      emp.name.toLowerCase().includes(searchLower) || (emp.email || '').toLowerCase().includes(searchLower) ||
      (emp.organisation || '').toLowerCase().includes(searchLower) || (emp.department || '').toLowerCase().includes(searchLower) || (emp.section || '').toLowerCase().includes(searchLower) || (emp.process || '').toLowerCase().includes(searchLower) || (emp.team || '').toLowerCase().includes(searchLower) || (emp.subdepartment || '').toLowerCase().includes(searchLower) || (emp.role || '').toLowerCase().includes(searchLower) ||
      (emp.level || '').toLowerCase().includes(searchLower) || (emp.birthday || '').toLowerCase().includes(searchLower) ||
      (emp.homeAddress || '').toLowerCase().includes(searchLower);
    const matchesDept = !empFilterDept || emp.department === empFilterDept;
    const matchesCat = empFilterCatId === null || (emp.categoryIds || []).includes(empFilterCatId);
    return matchesSearch && matchesDept && matchesCat;
  });
  const byDept = new Map();
  for (const emp of filtered) { 
    const deptName = emp.department || '';
    const subdeptName = employeeHierarchyLeaf(emp);
    const organisationName = emp.organisation || 'Unassigned organisation';
    const groupKey = `${organisationName}\u0000${deptName}\u0000${subdeptName}`;
    if (!byDept.has(groupKey)) byDept.set(groupKey, []);
    byDept.get(groupKey).push(emp);
  }
  const groups = [...byDept.entries()].map(([groupKey, list]) => {
    const [organisation, department, subdepartment] = groupKey.split('\u0000');
    const sorted = [...list].sort((a, b) => ((a.sortOrder ?? 9999) - (b.sortOrder ?? 9999)) || a.name.localeCompare(b.name));
    return { organisation, department, subdepartment, list: sorted, minOrder: sorted[0]?.sortOrder ?? 99, processOrder: Math.min(...list.map(employee => Number(employee.processOrder) || Number(employee.sortOrder) || 9999)) };
  });
  groups.sort((a, b) => {
    const left = a.list[0] || { organisation: a.organisation, department: a.department, section: a.subdepartment };
    const right = b.list[0] || { organisation: b.organisation, department: b.department, section: b.subdepartment };
    if (!left.department && right.department) return -1;
    if (left.department && !right.department) return 1;
    return comparePersonnelHierarchy(left, right) || (Number(a.processOrder) - Number(b.processOrder));
  });
  const allDepts = orderedDepartments().filter(department => department !== 'Unassigned');
  const departmentOrderControls = allDepts.map((dept, index) => {
    const color = resolveDeptColor(dept) || PALETTE[index % PALETTE.length];
    return `<div style="display:flex;align-items:center;gap:8px;padding:6px 8px;border:1px solid var(--border);border-radius:10px;background:var(--surface)">
      <span class="muted" style="width:22px;text-align:right;font-variant-numeric:tabular-nums">${index + 1}</span>
      <span class="chip-dot" style="background:${color};display:inline-block;width:8px;height:8px;border-radius:50%"></span>
      <span style="flex:1;font-size:12px;font-weight:600">${esc(dept)}</span>
      <button type="button" class="icon-btn" title="Move ${esc(dept)} up" aria-label="Move ${esc(dept)} up" ${index === 0 ? 'disabled' : ''} onclick="moveDepartment(${esc(JSON.stringify(dept))},-1)">${svgIcon('chevronUp')}</button>
      <button type="button" class="icon-btn" title="Move ${esc(dept)} down" aria-label="Move ${esc(dept)} down" ${index === allDepts.length - 1 ? 'disabled' : ''} onclick="moveDepartment(${esc(JSON.stringify(dept))},1)">${svgIcon('chevronDown')}</button>
    </div>`;
  }).join('');
  const subdepartmentOrderControls = allDepts.map(dept => {
    const teams = orderedSubdepartmentsFor(dept);
    if (!teams.length) return '';
    const color = resolveDeptColor(dept) || PALETTE[allDepts.indexOf(dept) % PALETTE.length];
    return `<div style="border:1px solid var(--border);border-radius:10px;background:var(--surface);overflow:hidden">
      <div style="padding:7px 9px;background:${color}18;border-bottom:1px solid ${color};font-size:12px;font-weight:700">${esc(dept)}</div>
      <div>${teams.map((team, index) => `<div style="display:flex;align-items:center;gap:8px;padding:6px 8px;${index ? 'border-top:1px solid var(--border);' : ''}">
        <span class="muted" style="width:22px;text-align:right;font-variant-numeric:tabular-nums">${index + 1}</span>
        <span style="flex:1;font-size:12px">${esc(team)}</span>
        <button type="button" class="icon-btn" title="Move ${esc(team)} up" aria-label="Move ${esc(team)} up" ${index === 0 ? 'disabled' : ''} onclick="moveSubdepartment(${esc(JSON.stringify(dept))},${esc(JSON.stringify(team))},-1)">${svgIcon('chevronUp')}</button>
        <button type="button" class="icon-btn" title="Move ${esc(team)} down" aria-label="Move ${esc(team)} down" ${index === teams.length - 1 ? 'disabled' : ''} onclick="moveSubdepartment(${esc(JSON.stringify(dept))},${esc(JSON.stringify(team))},1)">${svgIcon('chevronDown')}</button>
      </div>`).join('')}</div>
    </div>`;
  }).filter(Boolean).join('');
  const deptSwatches = allDepts.map((dept, idx) => {
    const color = resolveDeptColor(dept) || PALETTE[idx % PALETTE.length];
    const paletteButtons = PALETTE.map(option => `
      <button type="button" class="swatch${option === color ? ' sel' : ''}" title="${option}"
        style="background:${option};width:18px;height:18px"
        onclick="setDepartmentColor(${esc(JSON.stringify(dept))}, '${option}')"></button>`).join('');
    return `<div style="display:flex;align-items:center;gap:8px;padding:6px 8px;border:1px solid var(--border);border-radius:10px;background:var(--surface);font-size:12px">
      <span style="min-width:120px;display:inline-flex;align-items:center;gap:6px">
        <span class="chip-dot" style="background:${color};display:inline-block;width:8px;height:8px;border-radius:50%"></span>
        <span>${esc(dept)}</span>
      </span>
      <div class="swatches" style="gap:5px">${paletteButtons}</div>
    </div>`;
  }).join('');
  const sectionSwatches = [...new Set(employees.filter(emp => emp.section || emp.subdepartment).map(emp => `${emp.department || 'Unassigned'}\u0000${emp.section || emp.subdepartment}`))].sort().map(key => {
    const [dept, section] = key.split('\u0000');
    const color = resolveSectionColor(dept, section) || resolveDeptColor(dept) || PALETTE[allDepts.indexOf(dept) % PALETTE.length];
    const sectionButtons = PALETTE.map(option => `<button type="button" class="swatch${option === color ? ' sel' : ''}" title="${option}" style="background:${option};width:18px;height:18px" onclick="setSectionColor(${esc(JSON.stringify(dept))},${esc(JSON.stringify(section))},'${option}')"></button>`).join('');
    return `<div style="display:flex;align-items:center;gap:8px;padding:6px 8px;border:1px solid var(--border);border-radius:10px;background:var(--surface);font-size:12px"><span style="min-width:160px;display:inline-flex;align-items:center;gap:6px"><span class="chip-dot" style="background:${color};display:inline-block;width:8px;height:8px;border-radius:50%"></span><span>${esc(dept)} / ${esc(section)}</span></span><div class="swatches" style="gap:5px">${sectionButtons}</div></div>`;
  }).join('');
  const teamSwatches = [...new Set(employees.filter(emp => emp.team).map(emp => `${emp.department || 'Unassigned'}\u0000${emp.section || emp.subdepartment || 'Unassigned section'}\u0000${emp.process || 'Unassigned process'}\u0000${emp.team}`))].sort().map(key => {
    const [dept, section, process, team] = key.split('\u0000');
    const color = resolveSubdepartmentColor(dept, team) || resolveProcessColor(dept, section, process) || resolveSectionColor(dept, section) || resolveDeptColor(dept) || PALETTE[allDepts.indexOf(dept) % PALETTE.length];
    const paletteButtons = PALETTE.map(option => `<button type="button" class="swatch${option === color ? ' sel' : ''}" title="${option}" style="background:${option};width:18px;height:18px" onclick="setSubdepartmentColor(${esc(JSON.stringify(dept))},${esc(JSON.stringify(team))},'${option}')"></button>`).join('');
    return `<div style="display:grid;grid-template-columns:minmax(180px,240px) 216px;align-items:center;gap:8px;padding:6px 8px;border:1px solid var(--border);border-radius:10px;background:var(--surface);font-size:12px;max-width:480px"><span style="display:inline-flex;align-items:center;gap:6px;min-width:0"><span class="chip-dot" style="background:${color};display:inline-block;width:8px;height:8px;border-radius:50%;flex-shrink:0"></span><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(section)} / ${esc(process)} / ${esc(team)}</span></span><div class="swatches" style="gap:5px">${paletteButtons}</div></div>`;
  }).join('');
  const processSwatches = [...new Set(employees.filter(emp => emp.process).map(emp => `${emp.department || 'Unassigned'}\u0000${emp.section || emp.subdepartment || ''}\u0000${emp.process}`))].sort().map(key => {
    const [dept, section, process] = key.split('\u0000');
    const color = resolveProcessColor(dept, section, process) || resolveSectionColor(dept, section) || resolveDeptColor(dept) || PALETTE[allDepts.indexOf(dept) % PALETTE.length];
    const paletteButtons = PALETTE.map(option => `<button type="button" class="swatch${option === color ? ' sel' : ''}" title="${option}" style="background:${option};width:18px;height:18px" onclick="setProcessColor(${esc(JSON.stringify(dept))},${esc(JSON.stringify(section))},${esc(JSON.stringify(process))},'${option}')"></button>`).join('');
    return `<div style="display:flex;align-items:center;gap:8px;padding:6px 8px;border:1px solid var(--border);border-radius:10px;background:var(--surface);font-size:12px"><span style="min-width:190px;display:inline-flex;align-items:center;gap:6px"><span class="chip-dot" style="background:${color};display:inline-block;width:8px;height:8px;border-radius:50%"></span><span>${esc(dept)} / ${esc(section)} / ${esc(process)}</span></span><div class="swatches" style="gap:5px">${paletteButtons}</div></div>`;
  }).join('');

  const catChip = cat => `<span class="chip" style="${chipStyle(cat.color)}"><span class="chip-dot" style="background:${cat.color}"></span>${esc(cat.name)}</span>`;
  let rowsHtml = '';
  if (!filtered.length) {
    rowsHtml = `<tr><td colspan="10" class="empty-note">${employees.length ? 'No personnel match the current filters.' : 'No personnel yet. Click "Add Employee" to create the first record.'}</td></tr>`;
  } else {
    let renderedOrganisation = null;
    let renderedDepartment = null;
    for (const group of groups) {
      if (group.organisation !== renderedOrganisation) {
        renderedOrganisation = group.organisation;
        renderedDepartment = null;
        const organisationPeople = filtered.filter(emp => (emp.organisation || 'Unassigned organisation') === group.organisation).length;
        rowsHtml += `<tr class="dept-row organisation-row"><td colspan="10" style="background:var(--primary);color:var(--primary-fg);font-size:13px;font-weight:800;letter-spacing:.03em;padding:8px 12px">${esc(group.organisation)} <span style="font-weight:500;opacity:.8;text-transform:none">· ${organisationPeople} ${organisationPeople === 1 ? 'person' : 'people'}</span></td></tr>`;
      }
      const deptColor = resolveDeptColor(group.department) || 'var(--border)';
      if (group.department && group.department !== renderedDepartment) {
        renderedDepartment = group.department;
        const departmentCollapsed = collapsedPersonnelDepartments.has(personnelDepartmentKey(group.organisation, group.department));
        const departmentPeople = filtered.filter(emp => (emp.organisation || 'Unassigned organisation') === group.organisation && (emp.department || 'Unassigned') === group.department).length;
        rowsHtml += `<tr class="dept-row"><td colspan="10" style="background:${deptColor}22;border-bottom:2px solid ${deptColor};color:var(--text);font-weight:700"><button class="icon-btn" type="button" onclick="togglePersonnelDepartment(${esc(JSON.stringify(group.organisation))},${esc(JSON.stringify(group.department))})">${svgIcon(departmentCollapsed ? 'chevronRight' : 'chevronDown')}</button>${esc(group.department)} <span style="font-weight:400;text-transform:none">· ${departmentPeople} ${departmentPeople === 1 ? 'person' : 'people'}</span></td></tr>`;
      }
      if (group.department && collapsedPersonnelDepartments.has(personnelDepartmentKey(group.organisation, group.department))) continue;
      const sectionName = group.list[0]?.section || group.subdepartment || '';
      const processName = group.list[0]?.process || '';
      const departmentGroupCount = groups.filter(candidate => candidate.organisation === group.organisation && candidate.department === group.department).length;
      const sectionHeading = [sectionName, processName].filter(Boolean).join(' / ') || (departmentGroupCount > 1 ? 'Unassigned section / process / team' : '');
      const sectionColor = resolveSectionColor(group.department, sectionName) || deptColor;
      const sectionKey = personnelSectionKey(group.organisation, group.department, sectionName);
      const sectionCollapsed = collapsedPersonnelSections.has(sectionKey);
      if (sectionHeading) {
        rowsHtml += `<tr class="dept-row"><td colspan="10" style="background:color-mix(in srgb,${sectionColor} 16%,var(--surface));border-bottom:1px solid ${sectionColor};border-left:4px solid ${sectionColor};color:var(--text);padding-left:20px"><button class="icon-btn" type="button" aria-label="${sectionCollapsed ? 'Expand' : 'Collapse'} ${esc(sectionHeading)}" onclick="togglePersonnelSection(${esc(JSON.stringify(group.organisation))},${esc(JSON.stringify(group.department))},${esc(JSON.stringify(sectionName))})">${svgIcon(sectionCollapsed ? 'chevronRight' : 'chevronDown')}</button>${esc(sectionHeading)} <span style="font-weight:400;text-transform:none">· ${group.list.length} ${group.list.length === 1 ? 'person' : 'people'}</span></td></tr>`;
        if (sectionCollapsed) continue;
      }
      for (const emp of group.list) {
        const cats = (emp.categoryIds || []).map(catById).filter(Boolean);
        const personnelColor = resolveProcessColor(emp.department || 'Unassigned', emp.section || emp.subdepartment || '', emp.process || '')
          || (emp.team ? resolveSubdepartmentColor(emp.department || 'Unassigned', emp.team) : null)
          || sectionColor;
        rowsHtml += `<tr class="personnel-colored-row" style="--personnel-row-color:${personnelColor}" draggable="true" ondragstart="startPersonnelDrag(event,${emp.id})" ondragend="endPersonnelDrag(event)" ondragover="allowPersonnelDrop(event)" ondragleave="clearPersonnelDrop(event)" ondrop="dropPersonnel(event,${emp.id})">
          <td><span class="personnel-drag-handle" title="Drag to reorder" aria-hidden="true">⋮⋮</span><div style="font-weight:500;display:inline">${esc(emp.name)}</div>${cats.length ? `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:3px">${cats.map(catChip).join('')}</div>` : ''}</td>
          <td class="muted">${esc(emp.email || '') || '<span class="sum-dash">—</span>'}</td>
          <td>${esc(emp.role || '')}</td>
          <td class="muted">${esc(employeeHierarchyLeaf(emp))}${emp.level ? `<div style="font-size:11px;margin-top:2px">${esc(emp.level)}</div>` : ''}</td>
          <td class="muted">${emp.birthday ? esc(fmtMed(emp.birthday)) : '<span class="sum-dash">—</span>'}</td>
          <td class="muted">${emp.homeAddress ? esc(emp.homeAddress) : '<span class="sum-dash">—</span>'}</td>
          <td>${emp.phoneWork ? `<a class="tel-link" href="tel:${esc(emp.phoneWork)}">${esc(emp.phoneWork)}</a>` : '<span class="sum-dash">—</span>'}</td>
          <td>${emp.phonePrivate ? `<a class="tel-link" href="tel:${esc(emp.phonePrivate)}">${esc(emp.phonePrivate)}</a>` : '<span class="sum-dash">—</span>'}</td>
          <td class="muted" style="font-variant-numeric:tabular-nums">${emp.sortOrder ?? ''}</td>
          <td style="white-space:nowrap;text-align:right">
        <button class="icon-btn" title="Edit" onclick="openEmpModal(${emp.id})"><svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m4 16-.8 4.8L8 20l11.5-11.5a2.1 2.1 0 0 0-3-3z"/><path d="m14.5 6.5 3 3"/></svg></button>
        <button class="icon-btn danger" title="Delete" onclick="confirmDelete('employee',${emp.id})"><svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3"/></svg></button>
          </td>
        </tr>`;
      }
    }
  }

  document.getElementById('content').innerHTML = `
    <div class="flex items-center justify-between mb-4" style="flex-wrap:wrap;gap:12px">
      <div>
        <div class="page-title">Personnel</div>
        <div class="page-sub">${employees.length} team member${employees.length !== 1 ? 's' : ''} across ${allDepts.length} department${allDepts.length !== 1 ? 's' : ''}</div>
      </div>
      <div class="flex gap-2">
        <button class="btn" onclick="openCategoryManager()"><svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m20.5 13.5-7 7a2 2 0 0 1-2.8 0l-7.2-7.2a2 2 0 0 1-.5-1.1L2.5 5a2 2 0 0 1 2.2-2.2l7.2.5a2 2 0 0 1 1.1.5l7.5 7.5a1.6 1.6 0 0 1 0 2.2z"/><circle cx="7.5" cy="7.5" r="1.2"/></svg> Manage Categories</button>
        <button class="btn" onclick="nav('status-board')">Status Board</button>
        <button class="btn btn-primary" onclick="openEmpModal()"><svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg> Add Employee</button>
      </div>
    </div>
    <div class="flex items-center gap-2 mb-4" style="flex-wrap:wrap">
      <div class="search-box">
        <span class="search-ico"><svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg></span>
        <input id="emp-search" placeholder="Search name, email, role, department, team, or level…" value="${esc(empSearch)}" oninput="empSearch=this.value;renderEmployees();document.getElementById('emp-search').focus()">
      </div>
      <select class="plain-select" onchange="empFilterDept=this.value;renderEmployees()">
        <option value="">All departments</option>
        ${allDepts.map(d => `<option value="${esc(d)}"${empFilterDept === d ? ' selected' : ''}>${esc(d)}</option>`).join('')}
      </select>
    </div>
    ${categories.length ? `<div class="flex items-center gap-2 mb-4" style="flex-wrap:wrap">
      <button class="filter-chip${empFilterCatId === null ? ' active' : ''}" onclick="empFilterCatId=null;renderEmployees()">All categories</button>
      ${categories.map(c => `<button class="filter-chip${empFilterCatId === c.id ? ' active' : ''}" onclick="empFilterCatId=${c.id};renderEmployees()"><span class="chip-dot" style="background:${c.color};display:inline-block;width:7px;height:7px;border-radius:50%;margin-right:5px"></span>${esc(c.name)}</button>`).join('')}
    </div>` : ''}
    <div class="card mb-4" style="padding:12px">
      <button class="btn btn-sm" type="button" onclick="hierarchyOrderExpanded=!hierarchyOrderExpanded;renderEmployees()" style="display:flex;align-items:center;gap:6px">
        ${svgIcon(hierarchyOrderExpanded ? 'chevronDown' : 'chevronRight')} Hierarchy order
      </button>
      ${hierarchyOrderExpanded ? `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px;margin-top:12px">
        <div>
          <div style="font-size:13px;font-weight:700">Department order</div>
          <div class="form-hint">Controls the department hierarchy in Schedule.</div>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,220px));justify-content:start;gap:8px;margin-top:10px">
            ${departmentOrderControls || '<span class="muted text-sm">Add at least two departments to manage their order.</span>'}
          </div>
        </div>
        <div>
          <div style="font-size:13px;font-weight:700">Sub-team order</div>
          <div class="form-hint">Controls the sub-team hierarchy in Schedule. Employees without a sub-team remain first.</div>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,220px));justify-content:start;gap:8px;margin-top:10px">
            ${subdepartmentOrderControls || '<span class="muted text-sm">Add at least one sub-team to manage its order.</span>'}
          </div>
        </div>
      </div>` : ''}
    </div>
    <div class="card mb-4" style="padding:12px">
      <button class="btn btn-sm" type="button" onclick="deptColorsExpanded=!deptColorsExpanded;renderEmployees()" style="display:flex;align-items:center;gap:6px">
         ${svgIcon(deptColorsExpanded ? 'chevronDown' : 'chevronRight')} Department header colors
      </button>
      ${deptColorsExpanded
         ? `<div class="hierarchy-color-panel" style="max-height:300px;overflow:auto;padding-right:4px;margin-top:10px"><details data-color-group="departments"><summary style="cursor:pointer;font-size:12px;font-weight:700">Departments</summary><div class="flex items-center gap-2" style="flex-wrap:wrap;margin-top:6px">${deptSwatches || '<span class="muted text-sm">No departments yet.</span>'}</div></details><details data-color-group="sections" style="margin-top:8px"><summary style="cursor:pointer;font-size:12px;font-weight:700">Sections</summary><div class="flex items-center gap-2" style="flex-wrap:wrap;margin-top:6px">${sectionSwatches || '<span class="muted text-sm">No sections yet.</span>'}</div></details><details data-color-group="processes" style="margin-top:8px"><summary style="cursor:pointer;font-size:12px;font-weight:700">Processes</summary><div class="flex items-center gap-2" style="flex-wrap:wrap;margin-top:6px">${processSwatches || '<span class="muted text-sm">No processes yet.</span>'}</div></details><details data-color-group="teams" style="margin-top:8px"><summary style="cursor:pointer;font-size:12px;font-weight:700">Teams</summary><div class="flex items-center gap-2" style="flex-wrap:wrap;margin-top:6px">${teamSwatches || '<span class="muted text-sm">No teams yet.</span>'}</div></details></div>`
        : ''}
    </div>
    <div class="card" style="padding:0;overflow:hidden">
      <div style="overflow:auto">
        <table class="list-table">
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Department / Level</th><th>Birthday</th><th>Home address</th><th>Work phone</th><th>Private phone</th><th>Order</th><th></th></tr></thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </div>
    </div>`;
  const searchEl = document.getElementById('emp-search');
  if (searchEl && empSearch) { const v = searchEl.value; searchEl.focus(); searchEl.setSelectionRange(v.length, v.length); }
}

function buildEmpCategoryPicker() {
  const box = document.getElementById('ef-categories');
  if (!categories.length) {
    box.innerHTML = '<div class="muted text-sm" style="border:1px dashed var(--border);border-radius:6px;padding:10px;text-align:center">No categories yet. Create some from "Manage Categories".</div>';
    return;
  }
  box.innerHTML = `<div style="display:flex;flex-wrap:wrap;gap:6px;border:1px solid var(--border);border-radius:6px;padding:8px">` +
    categories.map(cat => {
      const on = selectedEmpCatIds.includes(cat.id);
      return `<button type="button" class="chip chip-btn${on ? '' : ' off'}" style="${chipStyle(cat.color)}" onclick="toggleEmpCategory(${cat.id})">${on ? svgIcon('check') : ''}<span class="chip-dot" style="background:${cat.color}"></span>${esc(cat.name)}</button>`;
    }).join('') + '</div>';
}
function toggleEmpCategory(id) {
  selectedEmpCatIds = selectedEmpCatIds.includes(id) ? selectedEmpCatIds.filter(x => x !== id) : [...selectedEmpCatIds, id];
  buildEmpCategoryPicker();
}
function openEmpModal(id) {
  editingEmpId = id || null;
  const emp = id ? empById(id) : null;
  document.getElementById('emp-modal-title').textContent = emp ? 'Edit Employee' : 'Add Employee';
  document.getElementById('ef-name').value = emp?.name || '';
  document.getElementById('ef-email').value = emp?.email || '';
  document.getElementById('ef-role').value = emp?.role || '';
  document.getElementById('ef-organisation').value = emp?.organisation || '';
  document.getElementById('ef-dept').value = emp?.department || '';
  document.getElementById('ef-section').value = emp?.section || emp?.subdepartment || '';
  document.getElementById('ef-process').value = emp?.process || '';
  document.getElementById('ef-team').value = emp?.team || '';
  updateEmployeeHierarchySuggestions();
  ['ef-organisation', 'ef-dept', 'ef-section', 'ef-process'].forEach(fieldId => {
    const field = document.getElementById(fieldId);
    if (field) field.oninput = updateEmployeeHierarchySuggestions;
  });
  document.getElementById('ef-level').value = emp?.level || '';
  document.getElementById('ef-birthday').value = emp?.birthday || '';
  document.getElementById('ef-address').value = emp?.homeAddress || '';
  document.getElementById('ef-phone-work').value = emp?.phoneWork || '';
  document.getElementById('ef-phone-priv').value = emp?.phonePrivate || '';
  document.getElementById('ef-sort').value = emp?.sortOrder ?? nextAvailableEmployeeSortOrder();
  document.getElementById('ef-shift-rotation').checked = emp?.includeInShiftRotation === true;
  const shiftTeamSelect = document.getElementById('ef-shift-team');
  shiftTeamSelect.innerHTML = `<option value="">Unassigned Shift Team</option>${normalizeShiftTeams(appSettings.shiftTeams).map(team => `<option value="${esc(team.id)}">${esc(team.name)}</option>`).join('')}`;
  shiftTeamSelect.value = emp?.shiftTeamId || '';
  selectedEmpCatIds = emp ? [...(emp.categoryIds || [])] : [];
  buildEmpCategoryPicker();
  document.getElementById('emp-modal').classList.add('open');
  setTimeout(() => document.getElementById('ef-name').focus(), 50);
}
function setDataListOptions(id, values) {
  const list = document.getElementById(id);
  if (list) list.innerHTML = [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, 'nb', { sensitivity: 'base' })).map(value => `<option value="${esc(value)}"></option>`).join('');
}
function updateEmployeeHierarchySuggestions() {
  const organisation = document.getElementById('ef-organisation')?.value.trim() || '';
  const department = document.getElementById('ef-dept')?.value.trim() || '';
  const section = document.getElementById('ef-section')?.value.trim() || '';
  const process = document.getElementById('ef-process')?.value.trim() || '';
  setDataListOptions('ef-organisations', employees.map(emp => emp.organisation));
  setDataListOptions('ef-departments', employees.filter(emp => !organisation || emp.organisation === organisation).map(emp => emp.department));
  setDataListOptions('ef-sections', employees.filter(emp => (!organisation || emp.organisation === organisation) && (!department || emp.department === department)).map(emp => emp.section || emp.subdepartment));
  setDataListOptions('ef-processes', employees.filter(emp => (!department || emp.department === department) && (!section || (emp.section || emp.subdepartment) === section)).map(emp => emp.process));
  setDataListOptions('ef-teams', employees.filter(emp => (!department || emp.department === department) && (!section || (emp.section || emp.subdepartment) === section) && (!process || emp.process === process)).map(emp => emp.team));
}
async function saveEmployee() {
  const name = document.getElementById('ef-name').value.trim();
  const email = document.getElementById('ef-email').value.trim();
  const role = document.getElementById('ef-role').value.trim();
  const organisation = document.getElementById('ef-organisation').value.trim();
  const dept = document.getElementById('ef-dept').value.trim();
  const section = document.getElementById('ef-section').value.trim();
  const process = document.getElementById('ef-process').value.trim();
  const team = document.getElementById('ef-team').value.trim();
  const level = document.getElementById('ef-level').value.trim();
  const birthday = document.getElementById('ef-birthday').value;
  const homeAddress = document.getElementById('ef-address').value.trim();
  const phoneWork = document.getElementById('ef-phone-work').value.trim();
  const phonePrivate = document.getElementById('ef-phone-priv').value.trim();
  const sortRaw = document.getElementById('ef-sort').value.trim();
  const includeInShiftRotation = document.getElementById('ef-shift-rotation').checked === true;
  const shiftTeamId = document.getElementById('ef-shift-team').value;
  if (!name || !email || !role) { alert('Name, email, and role are required.'); return; }
  if (Array.from(name).length > 30) { alert('Employee name can be at most 30 characters.'); return; }
  let sortOrder;
  if (sortRaw !== '') {
    const n = parseInt(sortRaw, 10);
    if (isNaN(n) || n < 1 || n > 9999) { alert('Sort order must be a number between 1 and 9999.'); return; }
    sortOrder = n;
  }
  if (sortOrder === undefined) sortOrder = editingEmpId
    ? (normalizeEmployeeSortOrder(empById(editingEmpId)?.sortOrder) ?? nextAvailableEmployeeSortOrder(employees, editingEmpId))
    : nextAvailableEmployeeSortOrder();

  const rec = { name, email, role, organisation, department: dept, section, process, team, subdepartment: section, level, birthday, homeAddress, phoneWork, phonePrivate, sortOrder, categoryIds: [...selectedEmpCatIds], includeInShiftRotation, shiftTeamId };
  const existingEmployee = editingEmpId ? empById(editingEmpId) : null;
  const rotationDates = existingEmployee?.includeInShiftRotation && !includeInShiftRotation
    ? rotationDatesForEmployee(editingEmpId) : [];
  if (rotationDates.length) {
    confirmShiftRotationRemoval(existingEmployee, rotationDates.length, () => completeEmployeeSave(rec));
    return;
  }
  await completeEmployeeSave(rec);
}
async function completeEmployeeSave(rec) {
  await mutateState('saveEmployee', () => {
    if (editingEmpId) {
      rec.id = editingEmpId;
      const idx = employees.findIndex(e => e.id === editingEmpId);
      if (idx !== -1) employees[idx] = rec; else employees.push(rec);
      if (!rec.includeInShiftRotation) removeEmployeeRotationRelations(editingEmpId);
    } else {
      rec.id = nextEmpId++;
      employees.push(rec);
    }
    ensureDepartmentOrders();
    ensureSubdepartmentOrders();
    employees.sort((a, b) => a.name.localeCompare(b.name));
  }, { saveDisk: true });

  closeModal('emp-modal');
  renderEmployees();
}
function confirmShiftRotationRemoval(employee, rotationDateCount, onConfirm) {
  document.getElementById('confirm-msg').textContent = `${employee?.name || 'This person'} has ${rotationDateCount} Shift Rotation date${rotationDateCount === 1 ? '' : 's'}. Removing them from Shift Rotation will clear these dates from Schedule. Continue?`;
  const confirmButton = document.getElementById('confirm-ok');
  confirmButton.textContent = 'Clear rotation & save';
  confirmButton.className = 'btn btn-danger';
  confirmButton.onclick = async () => {
    await onConfirm();
    confirmButton.textContent = 'Delete';
    closeModal('confirm-modal');
  };
  document.getElementById('confirm-modal').classList.add('open');
}

async function moveDepartment(dept, direction) {
  const departments = orderedDepartments().filter(department => department !== 'Unassigned');
  const fromIndex = departments.indexOf(dept);
  const toIndex = fromIndex + Number(direction);
  if (fromIndex < 0 || toIndex < 0 || toIndex >= departments.length) return;
  await mutateState('moveDepartment', () => {
    const reordered = [...departments];
    [reordered[fromIndex], reordered[toIndex]] = [reordered[toIndex], reordered[fromIndex]];
    reordered.forEach((department, index) => {
      departmentOrder[department] = (index + 1) * 10;
    });
  }, { saveDisk: true });
  renderEmployees();
}

async function moveSubdepartment(dept, subdept, direction) {
  const teams = orderedSubdepartmentsFor(dept);
  const fromIndex = teams.indexOf(subdept);
  const toIndex = fromIndex + Number(direction);
  if (fromIndex < 0 || toIndex < 0 || toIndex >= teams.length) return;
  await mutateState('moveSubdepartment', () => {
    const reordered = [...teams];
    [reordered[fromIndex], reordered[toIndex]] = [reordered[toIndex], reordered[fromIndex]];
    reordered.forEach((team, index) => {
      subdepartmentOrder[subdepartmentOrderKey(dept, team)] = (index + 1) * 10;
    });
  }, { saveDisk: true });
  renderEmployees();
}

// ═══ CATEGORIES ══════════════════════════════════════════════════════════════
function openCategoryManager() {
  editingCatId = null;
  document.getElementById('cf-name').value = '';
  selectedCatColor = PALETTE[7];
  buildSwatchRow('cf-swatches', selectedCatColor, c => { selectedCatColor = c; markSwatch('cf-swatches', c); });
  renderCategoryList();
  document.getElementById('cat-modal').classList.add('open');
}
function renderCategoryList() {
  const list = document.getElementById('cat-list');
  if (!categories.length) { list.innerHTML = '<div class="empty-note" style="padding:22px">No categories yet. Create one above.</div>'; return; }
  list.innerHTML = categories.map(cat => editingCatId === cat.id
    ? `<div style="border:1px solid var(--border);border-radius:8px;padding:10px;display:flex;flex-direction:column;gap:8px">
        <input id="cat-edit-name" value="${esc(cat.name)}" style="padding:7px 10px;border:1px solid var(--border);border-radius:6px;font-size:13px;background:var(--surface);color:var(--text);outline:none;font-family:inherit">
        <div class="swatches" id="cat-edit-swatches"></div>
        <div class="flex gap-2" style="justify-content:flex-end">
          <button class="btn btn-sm" onclick="editingCatId=null;renderCategoryList()">Cancel</button>
          <button class="btn btn-sm btn-primary" onclick="saveCategoryEdit(${cat.id})">Save</button>
        </div>
      </div>`
    : `<div class="flex items-center justify-between" style="border:1px solid var(--border);border-radius:8px;padding:8px 10px">
    document.querySelectorAll('.hierarchy-color-panel details[data-color-group]').forEach(details => {
      details.addEventListener('toggle', () => {
        if (details.open) openPersonnelColorGroups.add(details.dataset.colorGroup);
        else openPersonnelColorGroups.delete(details.dataset.colorGroup);
      });
    });
        <span class="chip" style="${chipStyle(cat.color)}"><span class="chip-dot" style="background:${cat.color}"></span>${esc(cat.name)}</span>
        <span class="flex gap-2">
          <button class="icon-btn" title="Edit" onclick="startEditCategory(${cat.id})"><svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m4 16-.8 4.8L8 20l11.5-11.5a2.1 2.1 0 0 0-3-3z"/><path d="m14.5 6.5 3 3"/></svg></button>
          <button class="icon-btn danger" title="Delete" onclick="confirmDelete('category',${cat.id})"><svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3"/></svg></button>
        </span>
      </div>`).join('');
  if (editingCatId) {
    const cat = catById(editingCatId);
    if (cat) buildSwatchRow('cat-edit-swatches', selectedCatColor, c => { selectedCatColor = c; markSwatch('cat-edit-swatches', c); });
  }
}
function startEditCategory(id) {
  editingCatId = id;
  const cat = catById(id);
  if (cat) selectedCatColor = cat.color;
  renderCategoryList();
}
async function saveCategoryEdit(id) {
  const cat = catById(id);
  const name = document.getElementById('cat-edit-name').value.trim();
  if (!cat || !name) return;
  if (categories.some(c => c.id !== id && c.name.toLowerCase() === name.toLowerCase())) { alert('A category with this name already exists.'); return; }
  await mutateState('saveCategoryEdit', () => {
    cat.name = name;
    cat.color = selectedCatColor;
  });
  editingCatId = null;
  renderCategoryList();
  if (currentPage === 'employees') renderEmployees();
}
async function createCategory() {
  const name = document.getElementById('cf-name').value.trim();
  if (!name) return;
  if (categories.some(c => c.name.toLowerCase() === name.toLowerCase())) { alert('A category with this name already exists.'); return; }
  await mutateState('createCategory', () => {
    categories.push({ id: nextCatId++, name, color: selectedCatColor });
  });
  document.getElementById('cf-name').value = '';
  renderCategoryList();
  if (currentPage === 'employees') renderEmployees();
}

// ═══ DELETION ════════════════════════════════════════════════════════════════
function confirmDelete(kind, id) {
  const src = kind === 'employee' ? empById(id)
    : kind === 'activity' ? activities.find(a => a.id === id)
    : kind === 'status' ? statuses.find(s => s.id === id)
    : kind === 'category' ? catById(id) : null;
  const label = src ? (src.name || src.label || '') : '';
  const messages = {
    employee: `Delete ${label}? Their statuses and activity participation are removed permanently.`,
    activity: `Delete the activity "${label}"? This removes it from the grid permanently.`,
    status: `Delete the status "${label}"? Existing day entries with this status keep their raw value but lose styling.`,
    category: `Delete the category "${label}"? It is removed from all personnel.`,
  };
  document.getElementById('confirm-msg').textContent = messages[kind] || `Delete ${label}?`;
  document.getElementById('confirm-ok').onclick = async () => {
    await mutateState('confirmDelete', () => {
    if (kind === 'employee') {
      employees = employees.filter(e => e.id !== id);
      for (const key of Object.keys(entriesMap)) if (key.startsWith(`${id}_`)) entriesMap[key] = null;
      for (const key of Object.keys(overtimeMap)) if (key.startsWith(`${id}_`)) overtimeMap[key] = null;
      for (const key of Object.keys(activityShiftsMap)) if (key.startsWith(`${id}_`)) activityShiftsMap[key] = null;
      for (const key of Object.keys(shiftRotationMap)) if (key.startsWith(`${id}_`)) shiftRotationMap[key] = null;
      for (const key of Object.keys(workScheduleChecksMap)) if (key.startsWith(`${id}_`)) delete workScheduleChecksMap[key];
      removeEmployeeRotationRelations(id);
      for (const act of activities) act.participants = act.participants.filter(p => p.id !== id);
    } else if (kind === 'activity') {
      activities = activities.filter(a => a.id !== id);
      for (const key of Object.keys(activityShiftsMap)) if (key.endsWith(`_${id}`)) activityShiftsMap[key] = null;
    } else if (kind === 'status') {
      statuses = statuses.filter(s => s.id !== id);
    } else if (kind === 'category') {
      categories = categories.filter(c => c.id !== id);
      for (const emp of employees) emp.categoryIds = (emp.categoryIds || []).filter(cid => cid !== id);
      if (empFilterCatId === id) empFilterCatId = null;
    }
    });
    updateSbStatus();
    closeModal('confirm-modal');
    if (kind === 'status') { renderDailyStatusList(); if (currentPage === 'grid') renderPage(); }
    else if (kind === 'category') { renderCategoryList(); if (currentPage === 'employees') renderEmployees(); }
    else renderPage();
  };
  document.getElementById('confirm-modal').classList.add('open');
}

// ═══ WORKLOAD & 30-DAY ENGINE ════════════════════════════════════════════════
function rollingDatesFor(startDate = new Date(), daysCount = 30) {
  const dates = [];
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  for (let i = 0; i < daysCount; i++) {
    const cur = new Date(start);
    cur.setDate(start.getDate() + i);
    dates.push(fmt(cur));
  }
  return dates;
}
function weekDatesFor(date = new Date()) {
  return rollingDatesFor(date, 30);
}
function isNormalWorkDate(dateString) {
  const date = new Date(`${dateString}T00:00:00`);
  const holiday = holidayFor(dateString);
  return !isWknd(date) && (!holiday || holiday.nonWorking !== true);
}
function statusCountsTowardLoadOnDate(status, dateString) {
  if (!status?.isAbsence) return true;
  return isNormalWorkDate(dateString);
}
function entryCountsTowardLoad(entry, status, dateString) {
  return !statusEntryIsPlanned(entry) && statusCountsTowardLoadOnDate(status, dateString);
}
function statusLoadMeasure(entry) {
  if (!entry || entry.status === 'at_work') return { units: 0, hours: 0 };
  if (statusEntryIsPlanned(entry)) return { units: 0, hours: 0 };
  if (entry.durationType === '24hours') return { units: 0, hours: 24 };
  if (entry.durationType === 'time') return { units: 0, hours: timeRangeHours(entry.time) ?? 0 };
  return { units: 1, hours: 0 };
}
function workloadHoursBeyondCore(hours) {
  const value = Number(hours);
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.max(0, value - (Number(appSettings.coreHoursPerDay) || 0));
}
function activityAdministrativeMeasure(activity, empId, date) {
  if (!activity || activityStatus(activity) !== 'confirmed' || !activityCountsTowardLoad(activity)) return { units: 0, hours: 0 };
  if (!activity.includeWeekends && isWknd(new Date(`${date}T00:00:00`))) return { units: 0, hours: 0 };
  const assignment = activityAssignment(`${empId}_${date}_${activity.id}`);
  if (!assignment.assigned || assignment.excluded) return { units: 0, hours: 0 };
  const workCode = (appSettings.workCodes || []).find(code => code.id === assignment.workCodeId);
  if (!workCode) return { units: 0, hours: 0 };
  if (workCode.aggregationMode === 'days') return { units: 1, hours: 0 };
  if (workCode.abbreviation === 'ATF' && ['day', 'night'].includes(assignment.shift)) return { units: 1, hours: 0 };
  const shiftMeta = activityShiftMeta(activity, assignment.shift);
  const legacyInterval = shiftMeta?.range || (timeRangeHours(assignment.shift) ? assignment.shift : '');
  const enteredHours = timeRangeHours(assignment.administrativeTime || legacyInterval) || 0;
  if (enteredHours >= 24) return { units: 1, hours: 0 };
  return { units: 0, hours: enteredHours };
}
function activityLoadMeasure(activity, empId, date) {
  if (!activity || activityStatus(activity) !== 'confirmed' || !activityCountsTowardLoad(activity)) return { units: 0, hours: 0 };
  const assignment = activityAssignment(`${empId}_${date}_${activity.id}`);
  if (!assignment.assigned || assignment.excluded) return { units: 0, hours: 0 };
  return { units: 0, hours: activityShiftHours(activity, empId, date) };
}
function formatHoursNumber(value) { return Number(Number(value || 0).toFixed(1)); }
function formatCompactMeasure(units, hours) {
  const parts = [];
  if (units > 0) parts.push(`${formatHoursNumber(units)}d`);
  if (hours > 0) parts.push(`${formatHoursNumber(hours)}h`);
  return parts.join(' · ') || '0';
}
function formatLoadMeasure(units, hours) {
  const parts = [];
  if (units > 0) parts.push(`${units} ${units === 1 ? 'day' : 'days'}`);
  if (hours > 0) parts.push(`${formatHoursNumber(hours)} h`);
  return parts.join(' · ') || '0';
}
function addLoadMeasure(left = {}, right = {}) {
  return { units: (left.units || 0) + (right.units || 0), hours: (left.hours || 0) + (right.hours || 0) };
}
function getEmployeeWorkload(emp, dateStrings = rollingDatesFor(new Date(), 30)) {
  let statusUnits = 0;
  let timedStatusHours = 0;
  let activityUnits = 0;
  let timedActivityHours = 0;
  let absenceUnits = 0;
  let timedAbsenceHours = 0;
  let oooUnits = 0;
  let oooHours = 0;
  let overtimeHours = 0;

  dateStrings.forEach(ds => {
    overtimeHours += Number(overtimeMap[`${emp.id}_${ds}`]?.hours) || 0;
    const entry = getEntryObj(`${emp.id}_${ds}`);
    if (entry) {
      const st = siFor(entry.status);
      if (!entryCountsTowardLoad(entry, st, ds)) return;
      const measure = statusLoadMeasure(entry);
      if (entryCountsTowardLoad(entry, st, ds)) {
        statusUnits += measure.units;
        timedStatusHours += measure.hours;
        if (st?.isAbsence) { absenceUnits += measure.units; timedAbsenceHours += measure.hours; }
        if (st?.isOutOfOffice) { oooUnits += measure.units; oooHours += measure.hours; }
      }
    }

    Object.entries(activityShiftsMap).forEach(([key]) => {
      if (!key.startsWith(`${emp.id}_${ds}_`)) return;
      const activityId = +key.split('_')[2];
      const activity = activities.find(act => act.id === activityId);
      if (!activity || activityStatus(activity) !== 'confirmed') return;
      if (activity && !activityCountsTowardLoad(activity)) return;
      const measure = activityAdministrativeMeasure(activity, emp.id, ds);
      activityUnits += measure.units;
      timedActivityHours += measure.hours;
    });
  });

  return {
    statusUnits,
    statusHoursActual: timedStatusHours,
    activityUnits,
    activityHoursActual: timedActivityHours,
    absenceUnits,
    absenceHoursActual: timedAbsenceHours,
    oooUnits,
    oooHours,
    overtimeHours,
    totalUnits: statusUnits + activityUnits,
    totalHoursActual: timedStatusHours + timedActivityHours + overtimeHours,
  };
}
function staffingShiftIntervalsFor(empId, date) {
  const intervals = [];
  for (const activity of activities) {
    if (activityStatus(activity) !== 'confirmed' || !activityCountsTowardLoad(activity) || !actParticipantIds(activity).includes(empId)) continue;
    if (date < activity.startDate || date > activity.endDate || (!activity.includeWeekends && isWknd(new Date(`${date}T00:00:00`)))) continue;
    const assignment = activityAssignment(`${empId}_${date}_${activity.id}`);
    if (!assignment.assigned || assignment.excluded || !assignment.shift) continue;
    const shift = ['normal', 'day', 'evening', 'night'].includes(assignment.shift) ? activityDefaultShift(assignment.shift, activity) : assignment.shift;
    const interval = timeRangeInterval(shift);
    if (interval) intervals.push(interval);
  }
  return mergeIntervals(intervals);
}
function getEmployeeStaffingLoad(emp, dateStrings) {
  const coreHours = Number(appSettings.coreHoursPerDay) || 0;
  let capacityHours = 0;
  let extraHours = 0;
  let overtimeHours = 0;
  for (const date of dateStrings) {
    const normalDay = isNormalWorkDate(date);
    if (normalDay) capacityHours += coreHours;
    const intervals = staffingShiftIntervalsFor(emp.id, date);
    const workedHours = intervals.reduce((sum, interval) => sum + Math.max(0, interval.end - interval.start), 0);
    extraHours += normalDay ? Math.max(0, workedHours - coreHours) : workedHours;
    overtimeHours += Number(overtimeMap[`${emp.id}_${date}`]?.hours) || 0;
  }
  const percentage = capacityHours > 0 ? ((capacityHours + extraHours + overtimeHours) / capacityHours) * 100 : (extraHours + overtimeHours > 0 ? Infinity : 0);
  const overloaded = overtimeHours > 0 || percentage > appSettings.highMax;
  const label = overloaded ? 'Overloaded' : percentage <= appSettings.lightMax ? 'Light' : percentage <= appSettings.normalMax ? 'Normal' : 'High';
  return { capacityHours, extraHours, overtimeHours, percentage, overloaded, label };
}
function datesInRange(startDate, endDate) {
  const dates = [];
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  for (const day = new Date(start); day <= end; day.setDate(day.getDate() + 1)) dates.push(fmt(day));
  return dates;
}
function workloadRange() {
  const anchor = new Date(`${workloadAnchorDate}T00:00:00`);
  if (workloadPeriod === 'month') {
    const start = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    const end = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
    return {
      start: fmt(start),
      end: fmt(end),
      label: start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      subtitle: `${fmtShort(fmt(start))} – ${fmtShort(fmt(end))}`,
      anchorYear: anchor.getFullYear(),
    };
  }
  if (workloadPeriod === 'week') {
    const day = anchor.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const start = new Date(anchor);
    start.setDate(anchor.getDate() + diffToMonday);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    const info = isoWeekInfo(start);
    return {
      start: fmt(start),
      end: fmt(end),
      label: `Week ${info.week}, ${info.year}`,
      subtitle: `${fmtShort(fmt(start))} – ${fmtShort(fmt(end))}`,
      anchorYear: info.year,
    };
  }
  const start = new Date(anchor.getFullYear(), 0, 1);
  const end = new Date(anchor.getFullYear(), 11, 31);
  return {
    start: fmt(start),
    end: fmt(end),
    label: String(anchor.getFullYear()),
    subtitle: `${anchor.getFullYear()} full year`,
    anchorYear: anchor.getFullYear(),
  };
}
function shiftWorkloadPeriod(step) {
  const anchor = new Date(`${workloadAnchorDate}T00:00:00`);
  if (workloadPeriod === 'month') anchor.setMonth(anchor.getMonth() + step);
  else if (workloadPeriod === 'week') anchor.setDate(anchor.getDate() + (step * 7));
  else anchor.setFullYear(anchor.getFullYear() + step);
  workloadAnchorDate = fmt(anchor);
  renderDashboard();
}
function setWorkloadPeriod(period) {
  workloadPeriod = period === 'month' || period === 'week' ? period : 'year';
  renderDashboard();
}
function teamWorkloadForDates(dateStrings) {
  return employees.reduce((acc, emp) => {
    const row = getEmployeeWorkload(emp, dateStrings);
    acc.statusUnits += row.statusUnits;
    acc.statusHours += row.statusHoursActual;
    acc.activityUnits += row.activityUnits;
    acc.activityHours += row.activityHoursActual;
    acc.absenceUnits += row.absenceUnits;
    acc.absenceHours += row.absenceHoursActual;
    acc.oooUnits += row.oooUnits;
    acc.oooHours += row.oooHours;
    acc.overtimeHours += row.overtimeHours;
    acc.totalUnits += row.totalUnits;
    acc.totalHours += row.totalHoursActual;
    return acc;
  }, { statusUnits: 0, statusHours: 0, activityUnits: 0, activityHours: 0, absenceUnits: 0, absenceHours: 0, oooUnits: 0, oooHours: 0, overtimeHours: 0, totalUnits: 0, totalHours: 0 });
}

// ═══ DASHBOARD ═══════════════════════════════════════════════════════════════
function staffingLoadForDates(dateStrings) {
  const total = { capacityHours: 0, extraHours: 0, overtimeHours: 0 };
  for (const emp of employees) {
    const load = getEmployeeStaffingLoad(emp, dateStrings);
    total.capacityHours += load.capacityHours;
    total.extraHours += load.extraHours;
    total.overtimeHours += load.overtimeHours;
  }
  total.percentage = total.capacityHours > 0
    ? ((total.capacityHours + total.extraHours + total.overtimeHours) / total.capacityHours) * 100
    : (total.extraHours + total.overtimeHours > 0 ? Infinity : 0);
  return total;
}
function staffingActivityCountForDates(dateStrings) {
  return activities.filter(activity => {
    if (activityStatus(activity) !== 'confirmed' || !activityCountsTowardLoad(activity)) return false;
    return dateStrings.some(date => date >= activity.startDate && date <= activity.endDate);
  }).length;
}
function renderTeamStaffingChart(dateStrings) {
  if (!dateStrings.length || !employees.length) return '<div class="empty-note" style="padding:24px">No staffing data for this interval.</div>';
  const bucketSize = dateStrings.length > 93 ? 'month' : (dateStrings.length > 45 ? 'week' : 'day');
  const buckets = [];
  for (const date of dateStrings) {
    const key = bucketSize === 'month' ? date.slice(0, 7) : bucketSize === 'week' ? isoWeekStringFromDate(new Date(`${date}T00:00:00`)) : date;
    let bucket = buckets.find(item => item.key === key);
    if (!bucket) { bucket = { key, dates: [] }; buckets.push(bucket); }
    bucket.dates.push(date);
  }
  const points = buckets
    .map(bucket => ({ ...bucket, load: staffingLoadForDates(bucket.dates), activityCount: staffingActivityCountForDates(bucket.dates) }))
    .filter(point => point.load.capacityHours > 0 || point.load.extraHours > 0 || point.load.overtimeHours > 0);
  if (!points.length) return '<div class="empty-note" style="padding:24px">No working days with staffing data for this interval.</div>';
  const width = 760, height = 210, left = 42, right = 18, top = 18, bottom = 34;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const highestLoad = Math.max(100, ...points.map(point => Number.isFinite(point.load.percentage) ? point.load.percentage : 140));
  const maxValue = Math.max(120, Math.ceil((highestLoad * 1.1) / 20) * 20);
  const maxActivityCount = Math.max(1, ...points.map(point => point.activityCount));
  const maxActivityBarHeight = plotHeight * .85;
  const x = index => left + ((index + .5) * plotWidth / points.length);
  const y = value => top + (maxValue - Math.min(maxValue, Math.max(0, value))) * plotHeight / maxValue;
  const barWidth = Math.max(5, Math.min(28, (plotWidth / points.length) * .62));
  const activityBars = points.map((point, index) => {
    const barHeight = point.activityCount * maxActivityBarHeight / maxActivityCount;
    return `<rect x="${x(index) - barWidth / 2}" y="${height - bottom - barHeight}" width="${barWidth}" height="${barHeight}" rx="2" fill="#14b8a6" opacity=".32"><title>${esc(point.key)}: ${point.activityCount} ${point.activityCount === 1 ? 'activity' : 'activities'}</title></rect>`;
  }).join('');
  const activityLabels = points.map((point, index) => {
    if (!point.activityCount) return '';
    const barHeight = point.activityCount * maxActivityBarHeight / maxActivityCount;
    const barTop = height - bottom - barHeight;
    const labelY = barHeight >= 20 ? barTop + 14 : barTop - 4;
    return `<text x="${x(index)}" y="${labelY}" text-anchor="middle" font-size="10" font-weight="700" fill="#0f766e">${point.activityCount}</text>`;
  }).join('');
  const line = points.map((point, index) => `${x(index)},${y(Number.isFinite(point.load.percentage) ? point.load.percentage : maxValue)}`).join(' ');
  const gridValue = value => `<line x1="${left}" x2="${width - right}" y1="${y(value)}" y2="${y(value)}" stroke="currentColor" opacity=".12"/><text x="${left - 7}" y="${y(value) + 4}" text-anchor="end" font-size="10" fill="currentColor" opacity=".65">${value}%</text>`;
  const labels = points.map((point, index) => {
    const date = new Date(`${point.dates[0]}T00:00:00`);
    const label = bucketSize === 'month' ? date.toLocaleDateString('en-US', { month: 'short' }) : bucketSize === 'week' ? `W${isoWeek(date)}` : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `<text x="${x(index)}" y="${height - 12}" text-anchor="middle" font-size="9" fill="currentColor" opacity=".7">${esc(label)}</text>`;
  }).join('');
  const markers = points.map((point, index) => {
    const value = Number.isFinite(point.load.percentage) ? point.load.percentage : maxValue;
    const overtime = point.load.overtimeHours > 0;
    return `<circle cx="${x(index)}" cy="${y(value)}" r="${overtime ? 4 : 3}" fill="${overtime ? '#c2410c' : 'var(--accent-blue)'}"><title>${esc(point.key)}: ${Number.isFinite(point.load.percentage) ? `${formatHoursNumber(point.load.percentage)}% staffing load` : 'Overloaded'} · ${point.activityCount} ${point.activityCount === 1 ? 'activity' : 'activities'}${overtime ? ` · ${formatHoursNumber(point.load.overtimeHours)}h overtime` : ''}</title></circle>`;
  }).join('');
  return `<div style="overflow:auto"><svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Team staffing load and activity count over selected interval" style="width:100%;min-width:520px;height:210px;color:var(--muted);display:block"><text x="${left}" y="11" font-size="10" fill="currentColor">Staffing load</text><rect x="${left + 78}" y="3" width="9" height="9" rx="2" fill="#14b8a6" opacity=".55"/><text x="${left + 92}" y="11" font-size="10" fill="currentColor">Activities (max ${maxActivityCount})</text>${activityBars}${gridValue(100)}${gridValue(appSettings.highMax)}<polyline points="${line}" fill="none" stroke="var(--accent-blue)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>${markers}${activityLabels}${labels}</svg></div>`;
}
function renderDashboard() {
  const today = todayStr();
  const cardStatuses = statuses.filter(s => s.key !== 'at_work').slice(0, 3);
  const counts = {};
  statuses.forEach(s => { counts[s.key] = 0; });
  let availableToday = 0;
  let availablePartialHours = 0;
  let oooToday = 0;
  let absentToday = 0;
  let absentPartialHours = 0;
  const unavailableTodayPeople = [];
  for (const emp of employees) {
    const entry = getEntryObj(`${emp.id}_${today}`);
    if (entry && counts[entry.status] !== undefined) counts[entry.status]++;
    const status = entry ? siFor(entry.status) : null;
    const unavailableActivity = unavailableActivityFor(emp.id, today);
    const statusUnavailable = status && (status.isAbsence || status.isOutOfOffice);
    const isPartial = entry?.durationType === 'time';
    const partialHours = isPartial && entry?.time ? (timeRangeHours(entry.time) ?? 0) : 0;
    const coreHours = appSettings.coreHoursPerDay || 7.5;
    const availableHours = isPartial ? Math.max(0, coreHours - partialHours) : (statusUnavailable ? 0 : coreHours);
    if (!statusUnavailable && !unavailableActivity) {
      availableToday += isPartial ? 0 : 1;
      availablePartialHours += isPartial ? availableHours : 0;
    }
    if (statusUnavailable) {
      unavailableTodayPeople.push({ name: emp.name, status: isPartial ? `${status.label} (${partialHours}h)` : status.label });
    } else if (unavailableActivity) {
      const assignment = activityAssignment(`${emp.id}_${today}_${unavailableActivity.id}`);
      const workCode = (appSettings.workCodes || []).find(code => code.id === assignment.workCodeId);
      unavailableTodayPeople.push({ name: emp.name, status: `${workCode?.name || 'Activity'} · ${unavailableActivity.name}` });
    }
    if ((status && status.isOutOfOffice) || (!statusUnavailable && unavailableActivity)) oooToday++;
    if (status && status.isAbsence) {
      absentToday += isPartial ? 0 : 1;
      absentPartialHours += isPartial ? partialHours : 0;
    }
  }
  const totalAvailableHours = availableToday * (appSettings.coreHoursPerDay || 7.5) + availablePartialHours;
  const totalCoreHours = employees.length * (appSettings.coreHoursPerDay || 7.5);
  const availableDisplay = totalCoreHours > 0 ? (totalAvailableHours / totalCoreHours * 100).toFixed(0) + '%' : '0%';
  const availableDetail = availablePartialHours > 0 ? ` (${availableToday} full + ${availablePartialHours.toFixed(1)}h partial)` : ` (${availableToday})`;
  const unavailableTodayInline = unavailableTodayPeople.length
    ? `Unavailable today: ${unavailableTodayPeople.map(item => `${item.name} (${item.status})`).join(', ')}`
    : 'Everyone is available today.';

  const trendDays = [];
  for (let i = 0; i < 14; i++) { const d = new Date(); d.setDate(d.getDate() + i); trendDays.push(d); }
  const totalEmployees = employees.length || 1;
  const coreHours = appSettings.coreHoursPerDay || 7.5;
  const trendData = trendDays.map(d => {
    const ds = fmt(d), dayCounts = {};
    let assignmentUnavailable = 0;
    let partialAbsenceHours = 0;
    statuses.forEach(s => { dayCounts[s.key] = 0; });
    for (const emp of employees) {
      const entry = getEntryObj(`${emp.id}_${ds}`);
      if (entry && dayCounts[entry.status] !== undefined) dayCounts[entry.status]++;
      const status = entry ? siFor(entry.status) : null;
      if ((!status || (!status.isAbsence && !status.isOutOfOffice)) && unavailableActivityFor(emp.id, ds)) assignmentUnavailable++;
      if (entry?.durationType === 'time' && status?.isAbsence) {
        partialAbsenceHours += timeRangeHours(entry.time) ?? 0;
      }
    }
    const unavailableStatusKeys = statuses.filter(s => s.isAbsence || s.isOutOfOffice).map(s => s.key);
    const unavailable = unavailableStatusKeys.reduce((sum, key) => sum + (dayCounts[key] || 0), 0) + assignmentUnavailable;
    const available = Math.max(0, totalEmployees - unavailable);
    const availableHours = available * coreHours + Math.max(0, (totalEmployees * coreHours - partialAbsenceHours - unavailable * coreHours));
    return {
      date: d,
      ds,
      counts: dayCounts,
      total: Object.values(dayCounts).reduce((a, b) => a + b, 0),
      available,
      availableHours,
      unavailable,
      partialAbsenceHours,
      assignmentUnavailable,
    };
  });
  const trendMax = Math.max(1, totalEmployees);

  const upcoming = [];
  for (const [key, raw] of Object.entries(entriesMap)) {
    const idx = key.indexOf('_');
    const empId = +key.slice(0, idx), date = key.slice(idx + 1);
    if (date <= today) continue;
    const entry = getEntryObj(key);
    const emp = empById(empId);
    if (!entry || !emp) continue;
    if (entry.status === 'at_work') continue;
    upcoming.push({ emp, date, entry });
  }
  upcoming.sort((a, b) => a.date.localeCompare(b.date) || a.emp.name.localeCompare(b.emp.name));
  const upcomingByDate = upcoming.reduce((map, item) => {
    if (!map.has(item.date)) map.set(item.date, []);
    map.get(item.date).push(item);
    return map;
  }, new Map());

  const rosterGroups = deptGroups();
  const statusBadge = key => {
    const st = siFor(key);
    const label = st ? st.label : friendlyStatusLabel(key);
    const color = st ? st.color : '#22c55e';
    return `<span class="badge-status" style="${statusStyle(color)}">${esc(label)}</span>`;
  };
  const upcomingInlineName = item => {
    const st = siFor(item.entry.status);
    const label = st ? st.label : friendlyStatusLabel(item.entry.status);
    const isPartial = item.entry?.durationType === 'time';
    const hours = isPartial && item.entry?.time ? timeRangeHours(item.entry.time) : 0;
    const detail = isPartial && hours ? `${label} (${hours.toFixed(1)}h)` : label;
    return `${esc(item.emp.name)} <span class="muted" style="font-size:12px">(${esc(detail)})</span>`;
  };

  const wlRange = workloadRange();
  const workloadDates = datesInRange(new Date(`${wlRange.start}T00:00:00`), new Date(`${wlRange.end}T00:00:00`));
  const workloadRows = employees.map(emp => ({ emp, ...getEmployeeWorkload(emp, workloadDates), staffing: getEmployeeStaffingLoad(emp, workloadDates) }))
    .sort((a, b) => b.totalUnits - a.totalUnits || b.totalHoursActual - a.totalHoursActual || a.emp.name.localeCompare(b.emp.name, 'nb'));
  const workloadTeamTotals = teamWorkloadForDates(workloadDates);
  const workloadTeamStaffing = employees.reduce((total, emp) => {
    const load = getEmployeeStaffingLoad(emp, workloadDates);
    total.capacityHours += load.capacityHours;
    total.extraHours += load.extraHours;
    total.overtimeHours += load.overtimeHours;
    return total;
  }, { capacityHours: 0, extraHours: 0, overtimeHours: 0 });
  workloadTeamStaffing.percentage = workloadTeamStaffing.capacityHours > 0
    ? ((workloadTeamStaffing.capacityHours + workloadTeamStaffing.extraHours + workloadTeamStaffing.overtimeHours) / workloadTeamStaffing.capacityHours) * 100
    : (workloadTeamStaffing.extraHours + workloadTeamStaffing.overtimeHours > 0 ? Infinity : 0);
  workloadTeamStaffing.overloaded = workloadTeamStaffing.overtimeHours > 0 || workloadTeamStaffing.percentage > appSettings.highMax;
  workloadTeamStaffing.label = workloadTeamStaffing.overloaded ? 'Overloaded' : workloadTeamStaffing.percentage <= appSettings.lightMax ? 'Light' : workloadTeamStaffing.percentage <= appSettings.normalMax ? 'Normal' : 'High';

  const yearlyWorkload = [];
  for (let month = 0; month < 12; month++) {
    const start = new Date(wlRange.anchorYear, month, 1);
    const end = new Date(wlRange.anchorYear, month + 1, 0);
    const dates = datesInRange(start, end);
    const totals = teamWorkloadForDates(dates);
    yearlyWorkload.push({
      month,
      label: start.toLocaleDateString('en-US', { month: 'short' }),
      totalUnits: totals.totalUnits,
      totalHours: totals.totalHours,
      statusUnits: totals.statusUnits,
      statusHours: totals.statusHours,
      activityUnits: totals.activityUnits,
      activityHours: totals.activityHours,
      overtimeHours: totals.overtimeHours,
      absenceUnits: totals.absenceUnits,
      absenceHours: totals.absenceHours,
    });
  }
  const yearMaxUnits = Math.max(1, ...yearlyWorkload.map(m => m.totalUnits));
  const yearMaxHours = Math.max(1, ...yearlyWorkload.map(m => m.totalHours));

  const workloadOverview = workloadRows.length
    ? workloadRows.map(row => {
        return `
          <div class="absence-row" style="padding:10px 0;">
            <div style="min-width:0;flex:1;margin-right:12px;">
              <div style="display:flex;align-items:center;justify-content:space-between;">
                <div style="font-size:13.5px;font-weight:500">${esc(row.emp.name)}</div>
                <div style="font-size:11.5px;font-weight:600;font-variant-numeric:tabular-nums">${Number.isFinite(row.staffing.percentage) ? `${formatHoursNumber(row.staffing.percentage)}%` : 'Overloaded'} · ${row.staffing.label}</div>
              </div>
              <div class="muted text-sm">${esc(row.emp.role)} · ${esc(row.emp.department)}</div>
              <div class="muted text-sm" style="margin-top:6px;display:flex;gap:10px;flex-wrap:wrap">
                <span>Status: ${formatLoadMeasure(row.statusUnits, row.statusHoursActual)}</span>
                <span>Activities: ${formatLoadMeasure(row.activityUnits, row.activityHoursActual)}</span>
                <span>Extra shift hours: ${formatHoursNumber(row.staffing.extraHours)} h</span>
                <span>Overtime: ${formatHoursNumber(row.overtimeHours)} h</span>
                <span>Absence: ${formatLoadMeasure(row.absenceUnits, row.absenceHoursActual)}</span>
              </div>
            </div>
          </div>`;
      }).join('')
    : '<div class="empty-note" style="height:200px;display:flex;align-items:center;justify-content:center">No personnel yet.</div>';

  document.getElementById('content').innerHTML = `
    <div class="mb-6">
      <div class="page-title">Dashboard</div>
      <div class="page-sub">Staffing overview for today and upcoming absences.</div>
      <div class="muted text-sm" style="margin-top:6px">Today: <b style="color:var(--text)">${fmtMed(today)}</b></div>
    </div>
    ${hostedMode && hostedUser?.role === 'admin' ? '<div class="dashboard-alert-grid mb-6"><div id="admin-change-review-card" class="card admin-change-review-card"><div class="card-title mb-2" style="font-size:15px">Grid Changes</div><div class="muted text-sm">Loading recent changes…</div></div></div>' : ''}
    <div class="dash-grid-4 mb-6">
      <div class="card">
        <div class="card-title-muted">Available</div>
        <div class="card-value" style="margin-top:6px">${availableToday} / ${employees.length}</div>
        <div class="muted text-sm" style="margin-top:6px">${esc(unavailableTodayInline)}</div>
      </div>
      <div class="card">
        <div class="card-title-muted">Total employed</div>
        <div class="card-value" style="margin-top:6px">${employees.length}</div>
      </div>
      <div class="card">
        <div class="card-title-muted">Out of office</div>
        <div class="card-value" style="margin-top:6px">${oooToday}</div>
      </div>
      <div class="card">
        <div class="card-title-muted">Absent</div>
        <div class="card-value" style="margin-top:6px">${absentToday}</div>
      </div>
      ${cardStatuses.map(st => `
        <div class="card">
          <div class="flex items-center justify-between">
            <div class="card-title-muted">${esc(st.label)}</div>
            <span class="badge-status" style="${statusStyle(st.color)};padding:1px 7px;font-size:11px;border-radius:6px">${esc(st.abbr)}</span>
          </div>
          <div class="card-value" style="margin-top:6px">${counts[st.key] || 0}</div>
        </div>`).join('')}
      ${cardStatuses.length === 0 ? '<div class="card"><div class="card-title-muted">Statuses</div><div class="muted text-sm" style="margin-top:8px">No daily statuses configured.</div></div>' : ''}
    </div>
    <div class="card mb-6" style="padding:20px 18px 12px;">
      <div class="flex items-center justify-between mb-3" style="gap:12px;flex-wrap:wrap;">
        <div class="card-title" style="font-size:15px;margin:0;">14-day availability (from today)</div>
        <div style="display:flex;flex-wrap:wrap;gap:10px;font-size:11px;color:var(--muted);">
          <span style="display:inline-flex;align-items:center;gap:5px;"><span style="width:10px;height:10px;border-radius:50%;display:inline-block;background:#22c55e"></span>Available</span>
          <span style="display:inline-flex;align-items:center;gap:5px;"><span style="width:10px;height:10px;border-radius:50%;display:inline-block;background:#ef4444"></span>OOO</span>
          <span style="display:inline-flex;align-items:center;gap:5px;"><span style="width:10px;height:10px;border-radius:50%;display:inline-block;background:#f59e0b"></span>Absent</span>
          <span style="display:inline-flex;align-items:center;gap:5px;"><span style="width:10px;height:10px;border-radius:50%;display:inline-block;background:#0ea5e9"></span>Assigned elsewhere</span>
        </div>
      </div>
      ${employees.length === 0
        ? '<div class="empty-note" style="height:240px;display:flex;align-items:center;justify-content:center">No personnel yet.</div>'
        : `<div class="trend-wrap" style="height:240px;">${trendData.map(t => {
            const segs = [];
            if (t.available > 0) segs.push(`<div class="trend-seg" style="height:${(t.available / trendMax) * 100}%;background:#22c55e"></div>`);
            const unavailableStatuses = statuses.filter(s => s.isAbsence || s.isOutOfOffice);
            unavailableStatuses.forEach(s => {
              const c = t.counts[s.key] || 0;
              if (c > 0) segs.push(`<div class="trend-seg" style="height:${(c / trendMax) * 100}%;background:${s.color}"></div>`);
            });
            if (t.assignmentUnavailable > 0) segs.push(`<div class="trend-seg" style="height:${(t.assignmentUnavailable / trendMax) * 100}%;background:#0ea5e9"></div>`);
            const availableHours = t.availableHours || (t.available * coreHours);
            const tipLines = [
              `<div><span class="dot" style="width:7px;height:7px;border-radius:50%;display:inline-block;background:#22c55e;margin-right:4px"></span>Available: <b>${t.available} (${availableHours.toFixed(1)}h)</b></div>`
            ];
            unavailableStatuses.filter(s => (t.counts[s.key] || 0) > 0).forEach(s => {
              tipLines.push(`<div><span class="dot" style="width:7px;height:7px;border-radius:50%;display:inline-block;background:${s.color};margin-right:4px"></span>${esc(s.label)}: <b>${t.counts[s.key]}</b></div>`);
            });
            if (t.partialAbsenceHours > 0) tipLines.push(`<div><span class="dot" style="width:7px;height:7px;border-radius:50%;display:inline-block;background:#f59e0b;margin-right:4px"></span>Partial absence: <b>${t.partialAbsenceHours.toFixed(1)}h</b></div>`);
            if (t.assignmentUnavailable > 0) tipLines.push(`<div><span class="dot" style="width:7px;height:7px;border-radius:50%;display:inline-block;background:#0ea5e9;margin-right:4px"></span>Assigned elsewhere: <b>${t.assignmentUnavailable}</b></div>`);
            const tip = tipLines.join('') || '<div class="muted">No status entries</div>';
            const isTodayCol = t.ds === today;
            return `<div style="flex:1;display:flex;flex-direction:column;align-items:stretch;min-width:0;height:240px;${isTodayCol ? 'background:color-mix(in srgb, var(--accent-blue) 8%, transparent);border:1px solid color-mix(in srgb, var(--accent-blue) 45%, transparent);border-radius:6px;padding:2px 2px 0;' : ''}">
              <div class="trend-col">${segs.join('')}<div class="trend-tip"><b>${t.date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</b>${tip}</div></div>
              <div class="trend-x" style="${isTodayCol ? 'color:var(--accent-blue);font-weight:700;' : ''}">${isTodayCol ? 'Today' : t.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
            </div>`;
          }).join('')}</div>`}
    </div>
    <div class="dash-grid-main mb-6">
      <div class="dash-left-column">
      <div class="card">
        <div class="card-title mb-4" style="font-size:15px">Upcoming Absences</div>
        ${upcoming.length
          ? `<div style="max-height:220px;overflow:auto;padding-right:6px">${[...upcomingByDate.entries()].slice(0, 30).map(([date, items]) => `
              <div class="absence-row" style="align-items:flex-start;justify-content:flex-start;flex-wrap:wrap;padding:8px 0;">
                <div style="font-size:12px;font-weight:700;color:var(--text);flex:0 0 auto">${fmtMed(date)}:</div>
                <div style="font-size:13.5px;font-weight:500;line-height:1.4;flex:1 1 260px;min-width:0">${items.map(upcomingInlineName).join(', ')}</div>
              </div>`).join('')}</div>`
          : '<div class="empty-note" style="height:120px;display:flex;align-items:center;justify-content:center">No upcoming absences scheduled.</div>'}
      </div>
      <div class="dash-grid-roster">
        ${rosterGroups.length ? rosterGroups.map(group => `
          <div class="card">
            <div class="flex items-center justify-between mb-4">
              <div><div class="card-title" style="font-size:14px">${esc(group.dept)}</div><div class="muted text-sm" style="margin-top:2px">${esc(group.subdept || 'All teams/processes')}</div></div>
              <div class="muted text-sm">${group.emps.length} member${group.emps.length !== 1 ? 's' : ''}</div>
            </div>
            ${group.emps.map(emp => {
              const entry = getEntryObj(`${emp.id}_${today}`);
              const key = entry?.status ?? 'at_work';
              return `<div class="roster-row"><div><div style="font-size:13.5px;font-weight:500">${esc(emp.name)}</div><div class="muted" style="font-size:11.5px">${esc(emp.role)}</div></div>${statusBadge(key)}</div>`;
            }).join('')}
          </div>`).join('') : '<div class="card empty-note">No personnel yet.</div>'}
      </div>
      </div>
      <div class="card">
        <div class="flex items-center justify-between" style="gap:8px;flex-wrap:wrap">
          <div>
            <div class="card-title" style="font-size:15px">Staffing Load</div>
            <div class="muted text-sm" style="margin-top:4px;">Period: ${wlRange.subtitle}</div>
          </div>
          <div class="year-nav" style="gap:8px">
            <select class="plain-select" onchange="setWorkloadPeriod(this.value)" aria-label="Workload period">
              <option value="year" ${workloadPeriod === 'year' ? 'selected' : ''}>Full year</option>
              <option value="month" ${workloadPeriod === 'month' ? 'selected' : ''}>Month</option>
              <option value="week" ${workloadPeriod === 'week' ? 'selected' : ''}>Week</option>
            </select>
            <button class="btn btn-icon" onclick="shiftWorkloadPeriod(-1)" aria-label="Previous workload period">${svgIcon('chevronLeft')}</button>
            <span class="year-label" style="min-width:120px">${esc(wlRange.label)}</span>
            <button class="btn btn-icon" onclick="shiftWorkloadPeriod(1)" aria-label="Next workload period">${svgIcon('chevronRight')}</button>
          </div>
        </div>
        <div class="muted text-sm" style="margin-top:8px;display:flex;gap:10px;flex-wrap:wrap">
          <span><b style="color:var(--text)">${workloadTeamTotals.totalUnits}</b> full units/days</span>
          <span><b style="color:var(--text)">${formatHoursNumber(workloadTeamTotals.totalHours)} h</b> timed work</span>
          <span>Overtime: <b style="color:#c2410c">${formatHoursNumber(workloadTeamTotals.overtimeHours)} h</b></span>
          <span>Absence: ${formatLoadMeasure(workloadTeamTotals.absenceUnits, workloadTeamTotals.absenceHours)}</span>
          <span>Staffing load: <b style="color:var(--text)">${Number.isFinite(workloadTeamStaffing.percentage) ? `${formatHoursNumber(workloadTeamStaffing.percentage)}%` : 'Overloaded'}</b> · ${workloadTeamStaffing.label}</span>
        </div>
        <div style="margin-top:12px;border-top:1px solid var(--border);padding-top:8px">${renderTeamStaffingChart(workloadDates)}</div>
        <div style="display:flex;flex-direction:column;gap:0;margin-top:12px;max-height:300px;overflow:auto;padding-right:6px">${workloadOverview}</div>
        <div style="border-top:1px solid var(--border);margin-top:10px;padding-top:10px">
          <div class="flex items-center justify-between" style="gap:8px;flex-wrap:wrap">
            <div class="card-title" style="font-size:13px">Yearly load distribution (${wlRange.anchorYear})</div>
          </div>
          <div class="muted text-sm" style="margin-top:8px">Full units/days</div>
          <div class="trend-wrap" style="height:160px;margin-top:8px;gap:5px">
            ${yearlyWorkload.map(m => `
              <div style="flex:1;display:flex;flex-direction:column;align-items:stretch;min-width:0;height:160px">
                <div class="trend-col">
                  <div class="trend-seg" style="height:${m.totalUnits > 0 ? Math.max(2, (m.totalUnits / yearMaxUnits) * 100) : 0}%;background:#0ea5e9;opacity:.92;border-radius:3px 3px 0 0"></div>
                  <div class="trend-tip"><b>${m.label} ${wlRange.anchorYear}</b><div>Total: <b>${m.totalUnits} units</b></div><div>Status: <b>${m.statusUnits}</b></div><div>Activities: <b>${m.activityUnits}</b></div><div>Absence: <b>${m.absenceUnits}</b></div></div>
                </div>
                <div class="trend-x">${m.label}</div>
              </div>
            `).join('')}
          </div>
          <div class="muted text-sm" style="margin-top:12px">Timed hours</div>
          <div class="trend-wrap" style="height:160px;margin-top:8px;gap:5px">
            ${yearlyWorkload.map(m => `
              <div style="flex:1;display:flex;flex-direction:column;align-items:stretch;min-width:0;height:160px">
                <div class="trend-col">
                  <div class="trend-seg" style="height:${m.totalHours > 0 ? Math.max(2, (m.totalHours / yearMaxHours) * 100) : 0}%;background:#f59e0b;opacity:.92;border-radius:3px 3px 0 0"></div>
                  <div class="trend-tip"><b>${m.label} ${wlRange.anchorYear}</b><div>Total: <b>${formatHoursNumber(m.totalHours)} h</b></div><div>Status: <b>${formatHoursNumber(m.statusHours)} h</b></div><div>Activities: <b>${formatHoursNumber(m.activityHours)} h</b></div><div>Overtime: <b>${formatHoursNumber(m.overtimeHours)} h</b></div><div>Absence: <b>${formatHoursNumber(m.absenceHours)} h</b></div></div>
                </div>
                <div class="trend-x">${m.label}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
    </div>`;
  if (hostedMode && hostedUser?.role === 'admin') void loadAdminChangeReviewCard();
}

async function openAbsenceRequestModal() { await renderAbsenceInbox(); }

async function loadAdminChangeReviewCard() {
  const card = document.getElementById('admin-change-review-card');
  if (!card) return;
  try {
    const response = await fetch('/api/admin/change-review?limit=5', { cache: 'no-store' });
    if (!response.ok) throw new Error('Could not load changes.');
    const result = await response.json();
    const events = groupGridChangeEvents(Array.isArray(result.events) ? result.events.filter(event => !event.acknowledged) : []).slice(0, 5);
    const formatEvent = event => {
      const employee = event.employeeId !== null && event.employeeId !== undefined ? empById(event.employeeId) : null;
      const target = event.resourceKind === 'schedule_cell' ? `${employee?.name || `Employee ${event.employeeId ?? 'unknown'}`}${event.date ? ` · ${event.date}` : ''}` : (event.summary?.name || event.resourceKey);
      const label = friendlyChangeLabel(event);
      return `<button class="admin-change-row" type="button" data-change-event="${event.id}"><span class="admin-change-dot"></span><span class="admin-change-copy"><strong>${esc(target)}</strong><small>${esc(label)} · ${esc(event.actorName)} · ${esc(new Date(event.occurredAt).toLocaleString())}</small></span></button>`;
    };
    card.innerHTML = `<div class="flex items-center justify-between" style="gap:12px"><div><div class="card-title" style="font-size:15px">Grid Changes</div><div class="muted text-sm" style="margin-top:4px">${events.length ? `${events.length} recent change${events.length === 1 ? '' : 's'}` : 'No recent changes'}</div></div>${events.length ? '<div style="display:flex;gap:6px"><button class="btn btn-sm btn-danger" type="button" onclick="acknowledgeAllAdminChanges()">Clear all</button><button class="btn btn-sm" type="button" onclick="openAdminChangeReview()">View all changes</button></div>' : ''}</div>${events.length ? `<div class="admin-change-list">${events.map(formatEvent).join('')}</div>` : '<div class="empty-note" style="padding:18px 0 4px">No Grid Changes need review.</div>'}`;
    card.querySelectorAll('[data-change-event]').forEach(button => button.addEventListener('click', () => jumpToAdminChange(events.find(event => String(event.id) === button.dataset.changeEvent))));
  } catch (error) { card.innerHTML = `<div class="card-title" style="font-size:15px">My employees’ changes</div><div class="muted text-sm" style="margin-top:8px">${esc(error.message || 'Could not load changes.')}</div>`; }
}
async function openAdminChangeReview() {
  const modal = document.getElementById('admin-change-review-modal');
  const list = document.getElementById('admin-change-review-list');
  if (!modal || !list) return;
  modal.classList.add('open');
  list.textContent = 'Loading changes…';
  const response = await fetch('/api/admin/change-review?limit=100', { cache: 'no-store' });
  const result = await response.json().catch(() => ({}));
  const events = groupGridChangeEvents(Array.isArray(result.events) ? result.events.filter(event => !event.acknowledged) : []);
  list.innerHTML = events.length ? events.map(event => { const employee = event.employeeId !== null && event.employeeId !== undefined ? empById(event.employeeId) : null; const target = event.resourceKind === 'schedule_cell' ? `${employee?.name || `Employee ${event.employeeId ?? 'unknown'}`}${event.date ? ` · ${event.date}` : ''}` : (event.summary?.name || event.resourceKey); return `<div class="admin-change-review-item"><button class="admin-change-row" type="button" data-review-event="${event.id}"><span class="admin-change-dot"></span><span class="admin-change-copy"><strong>${esc(target)}</strong><small>${esc(friendlyChangeLabel(event))} · ${esc(event.actorName)} · ${esc(new Date(event.occurredAt).toLocaleString())}</small></span></button><button class="btn btn-sm" type="button" data-ack-event="${event.id}">Clear</button></div>`; }).join('') : '<div class="empty-note">No Grid Changes need review.</div>';
  list.querySelectorAll('[data-review-event]').forEach(button => button.addEventListener('click', () => jumpToAdminChange(events.find(event => String(event.id) === button.dataset.reviewEvent))));
  list.querySelectorAll('[data-ack-event]').forEach(button => button.addEventListener('click', () => acknowledgeAdminChange(Number(button.dataset.ackEvent))));
}
function friendlyChangeLabel(event) {
  const name = event.summary?.name || 'the activity';
  const employee = event.employeeId !== null && event.employeeId !== undefined ? empById(event.employeeId) : null;
  if (event.eventType === 'activity.participant_added') return `Added ${employee?.name || 'an employee'} to activity ${event.summary?.activityName || name}`;
  if (event.eventType === 'activity.participant_removed') return `Removed ${employee?.name || 'an employee'} from activity ${event.summary?.activityName || name}`;
  const status = event.summary?.status ? ` · ${event.summary.status}${event.summary.lifecycle ? ` (${event.summary.lifecycle})` : ''}` : '';
  const time = event.summary?.time ? ` · ${event.summary.time}` : '';
  const activities = Array.isArray(event.summary?.activityNames) && event.summary.activityNames.length ? ` · Activity: ${event.summary.activityNames.join(', ')}` : '';
  if (event.groupedDates?.length > 1 && event.summary?.activityNames?.length) return `Added to scheduled activity ${event.summary.activityNames[0]} from ${formatChangeDate(event.groupedDates[0])} to ${formatChangeDate(event.groupedDates[event.groupedDates.length - 1])}`;
  if (event.eventType === 'schedule_cell.created') return `Added schedule entry${status}${time}${activities}`;
  if (event.eventType === 'schedule_cell.cleared') return `Cleared schedule entry${status}${activities}`;
  if (event.eventType === 'schedule_cell.updated') return `Updated schedule entry${status}${time}${activities}`;
  if (event.eventType === 'activity.created') return `Created activity ${name}`;
  if (event.eventType === 'activity.deleted') return `Deleted activity ${name}`;
  if (event.eventType === 'activity.updated') return `Updated activity ${name}`;
  return String(event.eventType || 'Changed schedule').replaceAll('_', ' ').replaceAll('.', ' · ');
}
function formatChangeDate(date) {
  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}
function groupGridChangeEvents(events) {
  const grouped = [];
  const groups = new Map();
  for (const event of events) {
    const activityName = event.summary?.activityNames?.[0];
    if (event.resourceKind !== 'schedule_cell' || !activityName || !event.employeeId || !event.date) {
      grouped.push(event);
      continue;
    }
    const key = `${event.eventType}|${event.actorUserId}|${event.employeeId}|${activityName}`;
    let group = groups.get(key);
    if (!group) {
      group = { ...event, groupedDates: [], summary: { ...event.summary, activityNames: [activityName] } };
      groups.set(key, group);
      grouped.push(group);
    }
    group.groupedDates.push(event.date);
    group.date = group.groupedDates[0];
  }
  return grouped.sort((a, b) => String(b.occurredAt).localeCompare(String(a.occurredAt)));
}
async function acknowledgeAdminChange(eventId) {
  const response = await fetch('/api/admin/change-review/acknowledge', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ eventId }) });
  if (!response.ok) { showToast('Could not clear this Grid Change.', 3000); return; }
  await openAdminChangeReview();
  if (currentPage === 'dashboard') await loadAdminChangeReviewCard();
}
async function acknowledgeAllAdminChanges() {
  const response = await fetch('/api/admin/change-review?limit=1000', { cache: 'no-store' });
  const result = await response.json().catch(() => ({}));
  const events = (result.events || []).filter(event => !event.acknowledged);
  for (const event of events) await fetch('/api/admin/change-review/acknowledge', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ eventId: event.id }) });
  closeModal('admin-change-review-modal');
  if (currentPage === 'dashboard') await loadAdminChangeReviewCard();
}
function jumpToAdminChange(event) {
  if (!event) return;
  closeModal('admin-change-review-modal');
  nav('grid');
  if (event.date) jumpToScheduleDate(event.date);
  requestAnimationFrame(() => {
    const selector = event.employeeId && event.date ? `.status-cell[data-empid="${event.employeeId}"][data-date="${event.date}"]` : null;
    const cell = selector ? document.querySelector(selector) : null;
    if (cell) { cell.classList.add('admin-change-highlight'); cell.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' }); setTimeout(() => cell.classList.remove('admin-change-highlight'), 5000); }
  });
}

// ═══ SUMMARY ═════════════════════════════════════════════════════════════════
function summaryRange() {
  if (summaryPeriod === 'month') {
    const [yearStr, monthStr] = String(summaryMonthValue || '').split('-');
    const year = +yearStr || summaryYear;
    const month = +monthStr || 1;
    const start = fmt(new Date(year, month - 1, 1));
    const end = fmt(new Date(year, month, 0));
    return {
      start,
      end,
      label: new Date(`${start}T00:00:00`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      subtitle: `${fmtShort(start)} – ${fmtShort(end)}`,
    };
  }
  if (summaryPeriod === 'week') {
    const weekStart = isoWeekStartDate(summaryWeekValue) || isoWeekStartDate(isoWeekStringFromDate(new Date()));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    const start = fmt(weekStart);
    const end = fmt(weekEnd);
    const info = isoWeekInfo(weekStart);
    return {
      start,
      end,
      label: `Week ${info.week}, ${info.year}`,
      subtitle: `${fmtShort(start)} – ${fmtShort(end)}`,
    };
  }
  const start = `${summaryYear}-01-01`;
  const end = `${summaryYear}-12-31`;
  return {
    start,
    end,
    label: String(summaryYear),
    subtitle: `${summaryYear} full year`,
  };
}
function shiftSummaryPeriod(step) {
  if (summaryPeriod === 'month') {
    const [yearStr, monthStr] = String(summaryMonthValue || '').split('-');
    const base = new Date((+yearStr || summaryYear), ((+monthStr || 1) - 1), 1);
    base.setMonth(base.getMonth() + step);
    summaryMonthValue = `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, '0')}`;
    summaryYear = base.getFullYear();
  } else if (summaryPeriod === 'week') {
    const base = isoWeekStartDate(summaryWeekValue) || new Date();
    base.setDate(base.getDate() + (step * 7));
    summaryWeekValue = isoWeekStringFromDate(base);
    summaryYear = isoWeekInfo(base).year;
  } else {
    summaryYear += step;
    summaryMonthValue = `${summaryYear}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    summaryWeekValue = isoWeekStringFromDate(new Date(summaryYear, 0, 4));
  }
  renderSummary();
}
function setSummaryPeriod(period) {
  const next = period === 'month' || period === 'week' ? period : 'year';
  summaryPeriod = next;
  if (summaryPeriod === 'month' && !/^\d{4}-\d{2}$/.test(String(summaryMonthValue || ''))) {
    summaryMonthValue = `${summaryYear}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  }
  if (summaryPeriod === 'week' && !/^\d{4}-W\d{2}$/.test(String(summaryWeekValue || ''))) {
    summaryWeekValue = isoWeekStringFromDate(new Date());
  }
  renderSummary();
}
function setSummaryMonth(value) {
  if (!/^\d{4}-\d{2}$/.test(String(value || ''))) return;
  summaryMonthValue = value;
  summaryYear = +value.slice(0, 4);
  renderSummary();
}
function setSummaryWeek(value) {
  if (!/^\d{4}-W\d{2}$/.test(String(value || ''))) return;
  summaryWeekValue = value;
  const start = isoWeekStartDate(value);
  if (start) summaryYear = isoWeekInfo(start).year;
  renderSummary();
}
function computeSummaryRows(startDate, endDate) {
  const rows = employees.map(emp => ({ emp, counts: {}, statusMeasures: {}, workCodeMeasures: {}, overtimeHours: 0 }));
  const rowByEmp = new Map(rows.map(r => [r.emp.id, r]));

  for (const [key, raw] of Object.entries(entriesMap)) {
    const idx = key.indexOf('_');
    const empId = +key.slice(0, idx), date = key.slice(idx + 1);
    if (date < startDate || date > endDate) continue;
    const row = rowByEmp.get(empId);
    if (!row) continue;
    const entry = getEntryObj(key);
    if (!entry) continue;
    const status = siFor(entry.status);
    if (!entryCountsTowardLoad(entry, status, date)) continue;
    row.counts[entry.status] = (row.counts[entry.status] || 0) + 1;
    if (entryCountsTowardLoad(entry, status, date)) {
      row.statusMeasures[entry.status] = addLoadMeasure(row.statusMeasures[entry.status], statusLoadMeasure(entry));
    }
  }

  for (const [key, shift] of Object.entries(activityShiftsMap)) {
    const parts = key.split('_');
    if (parts.length !== 3) continue;
    const [empIdStr, date, actIdStr] = parts;
    if (date < startDate || date > endDate) continue;
    const empId = +empIdStr;
    const row = rowByEmp.get(empId);
    const act = activities.find(a => a.id === +actIdStr);
    if (!row || !act) continue;

    const measure = activityAdministrativeMeasure(act, empId, date);
    if (!measure.units && !measure.hours) continue;
    const assignment = activityAssignment(key);
    if (assignment.workCodeId) row.workCodeMeasures[assignment.workCodeId] = addLoadMeasure(row.workCodeMeasures[assignment.workCodeId], measure);
  }
  for (const [key, overtime] of Object.entries(overtimeMap)) {
    const separator = key.indexOf('_');
    const empId = +key.slice(0, separator), date = key.slice(separator + 1);
    if (date < startDate || date > endDate) continue;
    const row = rowByEmp.get(empId);
    if (row) row.overtimeHours += Number(overtime.hours) || 0;
  }
  return rows;
}
function defaultSummaryColumns() {
  return { configured: false, statusKeys: [], showAbsence: true, showOoo: true, workCodeIds: (appSettings.workCodes || []).map(code => code.id) };
}
function effectiveSummaryColumns() {
  const saved = normalizeSummaryColumns(appSettings.summaryColumns);
  if (!saved) return defaultSummaryColumns();
  const statusKeys = new Set(statuses.map(status => status.key));
  const workCodeIds = new Set((appSettings.workCodes || []).map(code => code.id));
  return {
    ...saved,
    statusKeys: saved.statusKeys.filter(key => statusKeys.has(key)),
    workCodeIds: saved.workCodeIds.filter(id => workCodeIds.has(id)),
  };
}
function renderSummaryColumnsModal() {
  let modal = document.getElementById('summary-columns-modal');
  if (!modal) {
    document.body.insertAdjacentHTML('beforeend', '<div class="modal-bg" id="summary-columns-modal"><div class="modal" style="width:560px" id="summary-columns-modal-content"></div></div>');
    modal = document.getElementById('summary-columns-modal');
  }
  const draft = summaryColumnsDraft || { ...defaultSummaryColumns(), configured: true };
  const statusSet = new Set(draft.statusKeys || []);
  const workCodeSet = new Set(draft.workCodeIds || []);
  document.getElementById('summary-columns-modal-content').innerHTML = `
    <h3>Summary columns</h3>
    <p class="modal-desc">Choose the optional columns shown between Employee and Total. Full units and timed hours remain separate.</p>
    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:var(--muted);margin-bottom:7px">Daily statuses</div>
    <div class="form-row-2" style="margin-bottom:16px">
      ${statuses.map(status => `<label style="display:flex;align-items:center;gap:7px;font-size:12px"><input type="checkbox" data-id="${esc(status.key)}" onchange="setSummaryColumnDraft('status',this.dataset.id,this.checked)" ${statusSet.has(status.key) ? 'checked' : ''}><span class="dot" style="background:${status.color}"></span>${esc(status.label)}</label>`).join('') || '<span class="muted text-sm">No daily statuses configured.</span>'}
    </div>
    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:var(--muted);margin-bottom:7px">Aggregates</div>
    <div style="display:flex;gap:18px;flex-wrap:wrap;margin-bottom:16px">
      <label style="display:flex;align-items:center;gap:7px;font-size:12px"><input type="checkbox" onchange="setSummaryColumnDraft('absence','',this.checked)" ${draft.showAbsence ? 'checked' : ''}>Absence</label>
      <label style="display:flex;align-items:center;gap:7px;font-size:12px"><input type="checkbox" onchange="setSummaryColumnDraft('ooo','',this.checked)" ${draft.showOoo ? 'checked' : ''}>Out of office</label>
    </div>
    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:var(--muted);margin-bottom:7px">Work Codes</div>
    <div class="form-row-2" style="margin-bottom:16px">
      ${sortedPlanningItems(appSettings.workCodes).map(code => `<label style="display:flex;align-items:center;gap:7px;font-size:12px"><input type="checkbox" data-id="${esc(code.id)}" onchange="setSummaryColumnDraft('workCode',this.dataset.id,this.checked)" ${workCodeSet.has(code.id) ? 'checked' : ''}><span class="dot" style="background:${code.color}"></span><span><b>${esc(code.abbreviation)}</b> · ${esc(code.name)} <span class="muted">(Cells)</span></span></label>`).join('') || '<span class="muted text-sm">No Work Codes configured.</span>'}
    </div>
    <div class="muted text-sm">Employee, Overtime, and Total are always shown.</div>
    <div class="modal-actions">
      <button class="btn" onclick="resetSummaryColumns()">Reset to default</button>
      <button class="btn" onclick="closeModal('summary-columns-modal')">Cancel</button>
      <button class="btn btn-primary" onclick="applySummaryColumns()">Apply</button>
    </div>`;
}
function openSummaryColumns() {
  const current = effectiveSummaryColumns();
  summaryColumnsDraft = { ...current, configured: true, statusKeys: [...current.statusKeys], workCodeIds: [...current.workCodeIds] };
  renderSummaryColumnsModal();
  document.getElementById('summary-columns-modal').classList.add('open');
}
function setSummaryColumnDraft(kind, id, checked) {
  if (!summaryColumnsDraft) return;
  if (kind === 'absence') summaryColumnsDraft.showAbsence = checked;
  else if (kind === 'ooo') summaryColumnsDraft.showOoo = checked;
  else {
    const field = kind === 'status' ? 'statusKeys' : 'workCodeIds';
    const values = new Set(summaryColumnsDraft[field] || []);
    if (checked) values.add(id); else values.delete(id);
    summaryColumnsDraft[field] = [...values];
  }
}
async function applySummaryColumns() {
  const summaryColumns = normalizeSummaryColumns(summaryColumnsDraft);
  await mutateState('applySummaryColumns', () => {
    appSettings.summaryColumns = summaryColumns;
    persistSettings();
  });
  summaryColumnsDraft = null;
  closeModal('summary-columns-modal');
  renderSummary();
}
async function resetSummaryColumns() {
  await mutateState('resetSummaryColumns', () => {
    appSettings.summaryColumns = null;
    persistSettings();
  });
  summaryColumnsDraft = null;
  closeModal('summary-columns-modal');
  renderSummary();
}
function setSummarySort(key) {
  if (summarySortKey === key) summarySortDir = summarySortDir === 'asc' ? 'desc' : 'asc';
  else { summarySortKey = key; summarySortDir = key === 'name' ? 'asc' : 'desc'; }
  renderSummary();
}
function setSummarySortDirection(direction) {
  summarySortDir = direction === 'asc' ? 'asc' : 'desc';
  renderSummary();
}
function setSummaryViewMode(mode) {
  summaryViewMode = mode === 'graph' ? 'graph' : 'table';
  renderSummary();
}
function setSummaryGraphOption(kind, value) {
  if (kind === 'metric') summaryGraphMetric = value;
  if (kind === 'measure') summaryGraphMeasure = value === 'days' ? 'days' : 'hours';
  if (kind === 'direction') summaryGraphDir = value === 'asc' ? 'asc' : 'desc';
  renderSummary();
}
function renderSummary() {
  const range = summaryRange();
  const rows = computeSummaryRows(range.start, range.end);
  const columnSettings = effectiveSummaryColumns();
  const visibleStatuses = statuses.filter(status => columnSettings.statusKeys.includes(status.key));
  const visibleWorkCodes = sortedPlanningItems(appSettings.workCodes).filter(code => columnSettings.workCodeIds.includes(code.id));
  const workCodeMeasure = (row, code) => row.workCodeMeasures[code.id] || { units: 0, hours: 0 };
  const statusMeasure = (row, key) => row.statusMeasures[key] || { units: 0, hours: 0 };
  const flagMeasure = (row, flag) => statuses.reduce((total, status) => status[flag] ? addLoadMeasure(total, statusMeasure(row, status.key)) : total, { units: 0, hours: 0 });
  const hasAbsence = columnSettings.showAbsence && statuses.some(status => status.isAbsence);
  const hasOoo = columnSettings.showOoo && statuses.some(status => status.isOutOfOffice);
  const totalStatusKeys = new Set(visibleStatuses.map(status => status.key));
  if (hasAbsence) statuses.filter(status => status.isAbsence).forEach(status => totalStatusKeys.add(status.key));
  if (hasOoo) statuses.filter(status => status.isOutOfOffice).forEach(status => totalStatusKeys.add(status.key));
  const rowTotalMeasure = row => ({
    ...visibleWorkCodes.reduce((total, code) => addLoadMeasure(total, workCodeMeasure(row, code)),
      [...totalStatusKeys].reduce((total, key) => addLoadMeasure(total, statusMeasure(row, key)), { units: 0, hours: 0 })),
    hours: visibleWorkCodes.reduce((total, code) => addLoadMeasure(total, workCodeMeasure(row, code)),
      [...totalStatusKeys].reduce((total, key) => addLoadMeasure(total, statusMeasure(row, key)), { units: 0, hours: 0 })).hours + row.overtimeHours,
  });
  const compareMeasures = (left, right) => (left.units || 0) - (right.units || 0)
    || (left.hours || 0) - (right.hours || 0);
  const validSortKeys = new Set(['people', 'name', 'total', '__overtime', ...(hasAbsence ? ['__absence'] : []), ...(hasOoo ? ['__ooo'] : []), ...visibleStatuses.map(status => status.key), ...visibleWorkCodes.map(code => `wc:${code.id}`)]);
  if (!validSortKeys.has(summarySortKey)) { summarySortKey = 'people'; summarySortDir = 'asc'; }
  const peopleOrder = (a, b) =>
    ((a.emp.sortOrder ?? 99) - (b.emp.sortOrder ?? 99)) ||
    a.emp.name.localeCompare(b.emp.name, 'nb', { sensitivity: 'base' });
  const compareRows = (a, b) => {
    if (summarySortKey === 'people') return peopleOrder(a, b);
    let av, bv;
    if (summarySortKey === 'name') { av = a.emp.name; bv = b.emp.name; }
    else if (summarySortKey === 'total') return (summarySortDir === 'asc' ? 1 : -1) * compareMeasures(rowTotalMeasure(a), rowTotalMeasure(b)) || peopleOrder(a, b);
    else if (summarySortKey === '__absence') return (summarySortDir === 'asc' ? 1 : -1) * compareMeasures(flagMeasure(a, 'isAbsence'), flagMeasure(b, 'isAbsence')) || peopleOrder(a, b);
    else if (summarySortKey === '__ooo') return (summarySortDir === 'asc' ? 1 : -1) * compareMeasures(flagMeasure(a, 'isOutOfOffice'), flagMeasure(b, 'isOutOfOffice')) || peopleOrder(a, b);
    else if (summarySortKey === '__overtime') return (summarySortDir === 'asc' ? 1 : -1) * (a.overtimeHours - b.overtimeHours) || peopleOrder(a, b);
    else if (summarySortKey.startsWith('wc:')) {
      const code = visibleWorkCodes.find(item => item.id === summarySortKey.slice(3));
      return (summarySortDir === 'asc' ? 1 : -1) * compareMeasures(code ? workCodeMeasure(a, code) : {}, code ? workCodeMeasure(b, code) : {}) || peopleOrder(a, b);
    } else return (summarySortDir === 'asc' ? 1 : -1) * compareMeasures(statusMeasure(a, summarySortKey), statusMeasure(b, summarySortKey)) || peopleOrder(a, b);
    const compared = typeof av === 'string'
      ? av.localeCompare(bv, 'nb', { sensitivity: 'base' })
      : av - bv;
    return (summarySortDir === 'asc' ? compared : -compared) || peopleOrder(a, b);
  };
  const teamGroups = [...rows.reduce((teams, row) => {
    const team = row.emp.department || 'No team';
    if (!teams.has(team)) teams.set(team, []);
    teams.get(team).push(row);
    return teams;
  }, new Map()).entries()]
    .sort(([a], [b]) => a.localeCompare(b, 'nb', { sensitivity: 'base' }))
    .map(([team, teamRows]) => ({ team, rows: teamRows.sort(compareRows) }));
  const sorted = teamGroups.flatMap(group => group.rows);
  const numericSort = summarySortKey !== 'people' && summarySortKey !== 'name';
  const rankedRows = numericSort ? [...rows].sort(compareRows) : sorted;

  const sortIcon = col => svgIcon(summarySortKey !== col ? 'sort' : (summarySortDir === 'asc' ? 'chevronUp' : 'chevronDown'));
  const countPill = (count, color) => count > 0
    ? `<span class="sum-pill" style="color:${color};background:${color}18;border-color:${color}40">${count}</span>`
    : '<span class="sum-dash">—</span>';
  const formatSummaryMeasure = measure => {
    const parts = [];
    if ((measure.units || 0) > 0) parts.push(`${formatHoursNumber(measure.units)}d`);
    if ((measure.hours || 0) > 0) parts.push(`${formatHoursNumber(measure.hours)}h`);
    return parts.join(' · ');
  };
  const measurePill = (measure, color) => {
    const value = formatSummaryMeasure(measure);
    return value
      ? `<span class="sum-pill" style="color:${color};background:${color}18;border-color:${color}40">${value}</span>`
      : '<span class="sum-dash">—</span>';
  };

  const headHtml = `<tr>
    <th data-sort="name" onclick="setSummarySort(this.dataset.sort)">Employee <span style="opacity:.55">${sortIcon('name')}</span></th>
    ${visibleStatuses.map(s => `<th class="num" data-sort="${esc(s.key)}" onclick="setSummarySort(this.dataset.sort)">${esc(s.label)} <span style="opacity:.55">${sortIcon(s.key)}</span></th>`).join('')}
    ${hasAbsence ? `<th class="num" data-sort="__absence" onclick="setSummarySort(this.dataset.sort)" title="Full days and timed absence hours">Absence <span style="opacity:.55">${sortIcon('__absence')}</span></th>` : ''}
    ${hasOoo ? `<th class="num" data-sort="__ooo" onclick="setSummarySort(this.dataset.sort)" title="Full days and timed out-of-office hours">OOO <span style="opacity:.55">${sortIcon('__ooo')}</span></th>` : ''}
    <th class="num" data-sort="__overtime" onclick="setSummarySort(this.dataset.sort)" title="Additional overtime hours">Overtime <span style="opacity:.55">${sortIcon('__overtime')}</span></th>
    ${visibleWorkCodes.map(code => `<th class="num" style="color:${code.color}" title="${esc(code.name)} · Full days and timed hours" data-sort="wc:${esc(code.id)}" onclick="setSummarySort(this.dataset.sort)">${esc(code.abbreviation || code.name)} <span style="opacity:.55">${sortIcon('wc:' + code.id)}</span></th>`).join('')}
    <th class="num" data-sort="total" onclick="setSummarySort(this.dataset.sort)" title="Full days and timed hours matching the selected columns">Total <span style="opacity:.55">${sortIcon('total')}</span></th>
  </tr>`;
  const sortOptions = [
    { key: 'people', label: 'Hierarchy' }, { key: 'name', label: 'Employee' },
    ...visibleStatuses.map(item => ({ key: item.key, label: item.label })),
    ...(hasAbsence ? [{ key: '__absence', label: 'Absence' }] : []),
    ...(hasOoo ? [{ key: '__ooo', label: 'OOO' }] : []),
    { key: '__overtime', label: 'Overtime' },
    ...visibleWorkCodes.map(item => ({ key: `wc:${item.id}`, label: item.name })),
    { key: 'total', label: 'Total' },
  ];
  const tableSortControls = `<div class="sum-sort-controls" aria-label="Table sorting">
    <span class="sum-control-caption">Sort table</span>
    <select class="plain-select" onchange="setSummarySort(this.value)">${sortOptions.map(item => `<option value="${esc(item.key)}" ${item.key === summarySortKey ? 'selected' : ''}>${esc(item.label)}</option>`).join('')}</select>
    <select class="plain-select" onchange="setSummarySortDirection(this.value)" aria-label="Sort direction">
      <option value="desc" ${summarySortDir === 'desc' ? 'selected' : ''}>High to low</option>
      <option value="asc" ${summarySortDir === 'asc' ? 'selected' : ''}>Low to high</option>
    </select>
  </div>`;

  const totalCols = 3 + visibleStatuses.length + visibleWorkCodes.length + (hasAbsence ? 1 : 0) + (hasOoo ? 1 : 0);
  const minibarFor = (items, field, label) => {
    const total = items.reduce((sum, item) => sum + (item.measure[field] || 0), 0);
    return total > 0 ? `<div class="minibar" aria-label="${label}">${items.map(item => {
      const value = item.measure[field] || 0;
      return value > 0 ? `<div style="width:${(value / total) * 100}%;background:${item.color}" title="${esc(item.label)}: ${field === 'units' ? `${value} units` : `${formatHoursNumber(value)} h`}"></div>` : '';
    }).join('')}</div>` : '';
  };
  const employeeRowHtml = row => {
    const cats = (row.emp.categoryIds || []).map(catById).filter(Boolean);
    const barItems = [
      ...visibleStatuses.map(st => ({ label: st.label, color: st.color, measure: statusMeasure(row, st.key) })),
      { label: 'Overtime', color: '#c2410c', measure: { units: 0, hours: row.overtimeHours } },
      ...visibleWorkCodes.map(code => ({ label: code.name, color: code.color, measure: workCodeMeasure(row, code) })),
    ];
    const minibar = minibarFor(barItems, 'units', 'Cell distribution');
    return `<tr data-employee-id="${row.emp.id}">
      <td>
        <div style="font-weight:500">${esc(row.emp.name)}</div>
        <div class="muted" style="font-size:11.5px">${esc(row.emp.role)} · ${esc(row.emp.department)}</div>
        ${cats.length ? `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:3px">${cats.map(cat => `<span class="chip" style="${chipStyle(cat.color)};font-size:10px;padding:0 7px"><span class="chip-dot" style="background:${cat.color}"></span>${esc(cat.name)}</span>`).join('')}</div>` : ''}
        ${minibar}
      </td>
      ${visibleStatuses.map(st => `<td class="num">${measurePill(statusMeasure(row, st.key), st.color)}</td>`).join('')}
      ${hasAbsence ? `<td class="num">${measurePill(flagMeasure(row, 'isAbsence'), '#dc2626')}</td>` : ''}
      ${hasOoo ? `<td class="num">${measurePill(flagMeasure(row, 'isOutOfOffice'), '#7c3aed')}</td>` : ''}
      <td class="num">${measurePill({ units: 0, hours: row.overtimeHours }, '#c2410c')}</td>
      ${visibleWorkCodes.map(code => `<td class="num" title="${esc(code.name)} · Full days and timed hours">${measurePill(workCodeMeasure(row, code), code.color)}</td>`).join('')}
      <td class="num">${measurePill(rowTotalMeasure(row), 'var(--text)')}</td>
    </tr>`;
  };
  const bodyHtml = sorted.length ? (numericSort
    ? `<tr class="sum-team-row"><td colspan="${totalCols}">Global ranking · ${rankedRows.length} employees</td></tr>${rankedRows.map(employeeRowHtml).join('')}`
    : teamGroups.map(group => `
      <tr class="sum-team-row" data-team="${esc(group.team)}"><td colspan="${totalCols}">${esc(group.team)} · ${group.rows.length} ${group.rows.length === 1 ? 'employee' : 'employees'}</td></tr>
      ${group.rows.map(employeeRowHtml).join('')}`).join('')) : `<tr><td colspan="${totalCols}" class="empty-note">No data found for ${range.label}.</td></tr>`;

  const totals = sorted.reduce((acc, row) => {
    statuses.forEach(st => { acc.status[st.key] = addLoadMeasure(acc.status[st.key], statusMeasure(row, st.key)); });
    visibleWorkCodes.forEach(code => { acc.workCodes[code.id] = addLoadMeasure(acc.workCodes[code.id], workCodeMeasure(row, code)); });
    acc.overtimeHours += row.overtimeHours;
    acc.total = addLoadMeasure(acc.total, rowTotalMeasure(row));
    return acc;
  }, { status: {}, workCodes: {}, overtimeHours: 0, total: { units: 0, hours: 0 } });
  const footerHtml = sorted.length ? `<tfoot>
    <tr>
      <td style="font-weight:700">Total (${sorted.length} employees)</td>
      ${visibleStatuses.map(st => `<td class="num">${measurePill(totals.status[st.key], st.color)}</td>`).join('')}
      ${hasAbsence ? `<td class="num">${measurePill(statuses.reduce((sum, st) => st.isAbsence ? addLoadMeasure(sum, totals.status[st.key]) : sum, { units: 0, hours: 0 }), '#dc2626')}</td>` : ''}
      ${hasOoo ? `<td class="num">${measurePill(statuses.reduce((sum, st) => st.isOutOfOffice ? addLoadMeasure(sum, totals.status[st.key]) : sum, { units: 0, hours: 0 }), '#7c3aed')}</td>` : ''}
      <td class="num">${measurePill({ units: 0, hours: totals.overtimeHours }, '#c2410c')}</td>
      ${visibleWorkCodes.map(code => `<td class="num">${measurePill(totals.workCodes[code.id], code.color)}</td>`).join('')}
      <td class="num">${measurePill(totals.total, 'var(--text)')}</td>
    </tr>
  </tfoot>` : '';

  const legend = visibleStatuses.map(st => {
    const total = sorted.reduce((sum, row) => addLoadMeasure(sum, statusMeasure(row, st.key)), { units: 0, hours: 0 });
    return `<span><span class="dot" style="background:${st.color}"></span>${esc(st.label)}: <b style="color:var(--text)">${formatSummaryMeasure(total) || '0'}</b></span>`;
  }).join('') + '<span style="opacity:.4">|</span><span><span class="dot" style="background:#c2410c"></span>Overtime: <b style="color:var(--text)">' + formatHoursNumber(totals.overtimeHours) + 'h</b></span>' + (visibleWorkCodes.length ? '<span style="opacity:.4">|</span>' + visibleWorkCodes.map(code => {
    const total = sorted.reduce((sum, row) => addLoadMeasure(sum, workCodeMeasure(row, code)), { units: 0, hours: 0 });
    return `<span><span class="dot" style="background:${code.color}"></span>${esc(code.name)}: <b style="color:var(--text)">${formatSummaryMeasure(total) || '0'}</b></span>`;
  }).join('') : '');

  const graphMetricOptions = [
    ...visibleStatuses.map(status => ({ key: status.key, label: status.label, color: status.color, measure: row => statusMeasure(row, status.key) })),
    ...(hasAbsence ? [{ key: '__absence', label: 'Absence', color: '#dc2626', measure: row => flagMeasure(row, 'isAbsence') }] : []),
    ...(hasOoo ? [{ key: '__ooo', label: 'OOO', color: '#7c3aed', measure: row => flagMeasure(row, 'isOutOfOffice') }] : []),
    { key: '__overtime', label: 'Overtime', color: '#c2410c', measure: row => ({ units: 0, hours: row.overtimeHours }) },
    ...visibleWorkCodes.map(code => ({ key: `wc:${code.id}`, label: code.name, color: code.color, measure: row => workCodeMeasure(row, code) })),
    { key: 'total', label: 'Total', color: '#0f766e', measure: row => rowTotalMeasure(row) },
  ];
  const graphMetric = graphMetricOptions.find(item => item.key === summaryGraphMetric) || graphMetricOptions.at(-1);
  summaryGraphMetric = graphMetric?.key || 'total';
  const graphRows = [...rows].map(row => ({ row, value: graphMetric ? (graphMetric.measure(row)[summaryGraphMeasure] || 0) : 0 }))
    .sort((a, b) => (summaryGraphDir === 'asc' ? a.value - b.value : b.value - a.value) || peopleOrder(a.row, b.row));
  const graphMax = Math.max(1, ...graphRows.map(item => item.value));
  const graphHtml = graphRows.length ? graphRows.map((item, index) => `
    <div class="sum-rank-row">
      <div class="sum-rank-num">${index + 1}</div>
      <div class="sum-rank-person"><b>${esc(item.row.emp.name)}</b><span>${esc(item.row.emp.department || 'No team')}</span></div>
      <div class="sum-rank-track"><div class="sum-rank-fill" style="width:${Math.max(item.value ? 2 : 0, item.value / graphMax * 100)}%;background:${graphMetric.color}"></div></div>
      <div class="sum-rank-value">${formatHoursNumber(item.value)} ${summaryGraphMeasure === 'days' ? 'd' : 'h'}</div>
    </div>`).join('') : '<div class="empty-note">No employees available for this period.</div>';
  const graphControls = `<div class="sum-graph-controls">
    <label>Metric <select class="plain-select" onchange="setSummaryGraphOption('metric',this.value)">${graphMetricOptions.map(item => `<option value="${esc(item.key)}" ${item.key === summaryGraphMetric ? 'selected' : ''}>${esc(item.label)}</option>`).join('')}</select></label>
    <label>Unit <select class="plain-select" onchange="setSummaryGraphOption('measure',this.value)"><option value="days" ${summaryGraphMeasure === 'days' ? 'selected' : ''}>Days</option><option value="hours" ${summaryGraphMeasure === 'hours' ? 'selected' : ''}>Hours</option></select></label>
    <label>Order <select class="plain-select" onchange="setSummaryGraphOption('direction',this.value)"><option value="desc" ${summaryGraphDir === 'desc' ? 'selected' : ''}>Highest first</option><option value="asc" ${summaryGraphDir === 'asc' ? 'selected' : ''}>Lowest first</option></select></label>
  </div>`;
  document.getElementById('content').innerHTML = `
    <div class="flex items-center justify-between mb-4" style="flex-wrap:wrap;gap:12px">
      <div>
        <div class="page-title">Summary</div>
        <div class="page-sub">Selected statuses, absence totals, overtime, and Work Codes for ${range.label}. Period: ${range.subtitle}.</div>
      </div>
      <div class="year-nav" style="gap:8px">
        ${summaryViewMode === 'table' ? tableSortControls : ''}
        <button class="btn" onclick="openSummaryColumns()">Columns</button>
        <div class="sum-view-switch" role="group" aria-label="Summary view">
          <button class="btn ${summaryViewMode === 'table' ? 'active' : ''}" onclick="setSummaryViewMode('table')">Table</button>
          <button class="btn ${summaryViewMode === 'graph' ? 'active' : ''}" onclick="setSummaryViewMode('graph')">Graph</button>
        </div>
        <select class="plain-select" onchange="setSummaryPeriod(this.value)" aria-label="Summary period">
          <option value="year" ${summaryPeriod === 'year' ? 'selected' : ''}>Full year</option>
          <option value="month" ${summaryPeriod === 'month' ? 'selected' : ''}>Month</option>
          <option value="week" ${summaryPeriod === 'week' ? 'selected' : ''}>Week</option>
        </select>
        <button class="btn btn-icon" onclick="shiftSummaryPeriod(-1)" aria-label="Previous period">${svgIcon('chevronLeft')}</button>
        <span class="year-label" style="min-width:120px">${esc(range.label)}</span>
        <button class="btn btn-icon" onclick="shiftSummaryPeriod(1)" aria-label="Next period">${svgIcon('chevronRight')}</button>
      </div>
    </div>
    ${summaryViewMode === 'graph' ? `${graphControls}<div class="sum-graph">${graphHtml}</div>` : `<div class="sum-wrap">
      <table class="sum-table">
        <thead>${headHtml}</thead>
        <tbody>${bodyHtml}</tbody>
        ${footerHtml}
      </table>
    </div>`}
    <div class="legend-row">${legend}</div>`;
}

// ═══ MODAL PLUMBING ══════════════════════════════════════════════════════════
function returnToActivityDraft(typeKey = null) {
  if (!quickActivityTypeReturn) return;
  quickActivityTypeReturn = false;
  document.getElementById('status-modal').classList.remove('open');
  if (typeKey !== null) buildActivityTypeOptions(typeKey);
  document.getElementById('act-modal').classList.add('open');
}
let settingsModalStack = [];
function openSettingsChild(childId, parentId = null) {
  const parent = parentId || settingsModalStack.at(-1) || null;
  if (parent && document.getElementById(parent)?.classList.contains('open')) settingsModalStack.push(parent);
  document.querySelectorAll('.modal-bg.settings-flow-open').forEach(modal => modal.classList.remove('open', 'settings-flow-open'));
  document.getElementById(childId)?.classList.add('open', 'settings-flow-open');
  updateSettingsBackButtons();
}
function goBackSettings() {
  document.querySelector('.modal-bg.settings-flow-open.open')?.classList.remove('open', 'settings-flow-open');
  const parentId = settingsModalStack.pop();
  if (parentId) document.getElementById(parentId)?.classList.add('open', 'settings-flow-open');
  updateSettingsBackButtons();
}
function resetSettingsModalStack() {
  settingsModalStack = [];
  document.querySelectorAll('.modal-bg.settings-flow-open').forEach(modal => modal.classList.remove('open', 'settings-flow-open'));
}
function updateSettingsBackButtons() {
  document.querySelectorAll('[data-settings-back]').forEach(button => { button.style.display = settingsModalStack.length ? '' : 'none'; });
}
function closeModal(id) {
  const modal = document.getElementById(id);
  modal?.classList.remove('open');
  if (id === 'status-modal' && quickActivityTypeReturn) returnToActivityDraft();
  if (id === 'settings-modal' || modal?.classList.contains('settings-flow-open')) resetSettingsModalStack();
}
document.getElementById('account-form')?.addEventListener('submit', saveHostedUser);
document.getElementById('personal-settings-form')?.addEventListener('submit', savePersonalSettings);
document.querySelectorAll('.modal-bg').forEach(bg => {
  bg.addEventListener('mousedown', e => {
    if (e.target === bg) closeModal(bg.id);
  });
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closePicker();
    document.querySelectorAll('.modal-bg.open').forEach(m => {
      closeModal(m.id);
    });
  }
});

// ═══ BOOT ════════════════════════════════════════════════════════════════════
async function bootApp() {
  hostedMode = window.location.protocol !== 'file:';
  loadSidebarMode();
  loadAppZoom();
  loadSettings();
  loadGridPreferences();
  let storedRemoteSource = 'none';
  try {
    const fileMeta = JSON.parse(lsGet(LOCAL_FILE_META_KEY) || '{}');
    hasUnsavedChanges = fileMeta.dirty === true;
    activeFileName = typeof fileMeta.fileName === 'string' ? fileMeta.fileName : '';
    storedRemoteSource = ['portable-default', 'file-handle'].includes(fileMeta.source) ? fileMeta.source : 'none';
  } catch (err) { }
  let parsedLocalState = null;
  try {
    const rawLocalState = lsGet(LOCAL_STATE_KEY);
    if (rawLocalState) {
      parsedLocalState = JSON.parse(rawLocalState);
      if (!parsedLocalState || typeof parsedLocalState !== 'object') parsedLocalState = null;
    }
  } catch (err) {
    console.warn('Could not load local JSON data.');
  }
  let configuredFileLoaded = false;
  if (hostedMode) {
    try {
      configuredFileLoaded = await authenticateHostedApp();
      if (configuredFileLoaded) await loadHostedPlanner();
    } catch (err) {
      console.warn('Could not authenticate hosted planner:', err?.message || err);
      showHostedAuthScreen('login', err?.message || 'Hosted service is unavailable.');
    }
  }
  if (!hostedMode && storedRemoteSource === 'file-handle') {
    try {
      const storedHandle = await loadStoredLocalBackupHandle();
      if (storedHandle) {
        const hasPermission = await ensureLocalBackupPermission(storedHandle);
        if (hasPermission) {
          const file = await storedHandle.getFile();
          await loadDataFile(file, storedHandle, { captureDirectory: false });
          configuredFileLoaded = true;
        }
      }
    } catch (err) {
      console.warn('Could not restore the configured JSON file:', err?.message || err);
      await clearStoredLocalBackupHandle();
      activeFileName = '';
    }
  }
  if (!hostedMode && !configuredFileLoaded && parsedLocalState) {
    loadFromData(parsedLocalState);
    setRemoteUpdateSource('none');
    // Loading browser recovery data is a clean reload state. Any later edit
    // will call markUnsaved() again; do not carry a stale dirty flag from a
    // previous session into the freshly loaded application.
    markFileSaved();
    startupRecoveredDataAvailable = true;
  } else if (!hostedMode && !configuredFileLoaded && storedRemoteSource === 'portable-default') {
    try {
      await loadPortableDefaultPlannerData({ closeSettings: false });
      configuredFileLoaded = true;
    } catch (e) {
      console.warn('Portable default load failed:', e?.message || e);
    }
  }
  if (!hostedMode && !configuredFileLoaded) {
    setRemoteUpdateSource('none');
  }

  hiddenEmployees = new Set([...hiddenEmployees].filter(id => employees.some(emp => emp.id === id)));
  saveGridPreferences();
  updateDefaultJsonStatus();
  updateShiftRotationNavigation();
  updateWorkwheelNavigation();
  applyTheme(); applyAppName(); applySidebarMode(); applyAppZoom(); updateSaveButton(); updateAutoSyncButton(); updateUndoButton();
  document.getElementById('af-start').addEventListener('change', updateActivityWeekLabels);
  document.getElementById('af-end').addEventListener('change', updateActivityWeekLabels);
  document.getElementById('af-start').addEventListener('input', updateActivityWeekLabels);
  document.getElementById('af-end').addEventListener('input', updateActivityWeekLabels);
  
  updateSbStatus();
  if (hostedMode) {
    setSyncStatusState('updated');
    if (!configuredFileLoaded) return;
    return;
  }
  if (remoteUpdateSource === 'none') {
    setSyncStatusState('out-of-sync');
    if (!configuredFileLoaded) setStartupFileSelectionRequired(true);
    return;
  }
  await loadStoredPlannerDirectoryHandle();
  await createBackupIfNeeded({ notifyOnly: true });
  setSyncStatusState('updated');
  nav('grid');
}

bootApp();