import {
  createBlankPlannerDocument,
  normalizeLegacyPlannerDocument,
  type PlannerDocument,
  type RevisionedPlannerDocument,
} from '@atlas/core';
import { createPlannerApi } from './api';
import './styles.css';

const api = createPlannerApi();
const appRoot = document.querySelector<HTMLDivElement>('#app');
if (appRoot === null) throw new Error('ATLAS application root is missing.');
const root = appRoot;

let planner: RevisionedPlannerDocument = { revision: 0, document: createBlankPlannerDocument() };
let activePage = 'schedule';
let saveState: 'saved' | 'saving' | 'error' = 'saved';
let scheduleOffset = 0;
let scheduleDays = 14;
let selectedCell: { employeeId: number; date: string } | null = null;
let selectedCells = new Set<string>();
let scheduleSection = 'All sections';
let scheduleActivityFilter = 'all';
let undoDocuments: PlannerDocument[] = [];
let scheduleViewMode: 'all' | 'timeline' | 'employees' = 'all';
let editorMode: 'activity' | 'holiday' | null = null;

void bootstrap();

async function bootstrap(): Promise<void> {
  root.innerHTML = loadingMarkup();
  try { planner = await api.load(); render(); }
  catch (error) { root.innerHTML = errorMarkup(error instanceof Error ? error.message : 'Could not load ATLAS.'); }
}

function render(): void {
  const documentState = planner.document;
  root.innerHTML = `<div class="app-shell"><aside class="sidebar"><div class="brand"><span class="brand-mark">▦</span><span>ATLAS</span></div><div class="brand-sub">Adaptive Timeline, Load & Allocation System</div><nav class="nav" aria-label="Main navigation">${navButton('schedule', '▤', 'Schedule')}${navButton('dashboard', '◫', 'Dashboard')}${navButton('people', '♙', 'People')}${navButton('summary', '▥', 'Summary')}</nav><div class="sidebar-bottom"><button class="side-action" data-action="import">⇧ Import planner JSON</button><button class="side-action" data-action="export">⇩ Export planner JSON</button><button class="side-action" data-action="save">● ${saveState === 'saving' ? 'Saving…' : saveState === 'error' ? 'Save failed' : 'Saved'}</button><input id="import-file" type="file" accept="application/json,.json" hidden><div class="offline-status"><span class="status-dot"></span> Hosted · SQLite</div></div></aside><main class="workspace"><header class="topbar${activePage === 'schedule' ? ' schedule-global-hidden' : ''}"><div><span class="eyebrow">ATLAS / ${activePage}</span><h1>${pageTitle(activePage)}</h1></div><div class="topbar-actions"><span class="revision">Revision ${planner.revision}</span><button class="primary-button" data-action="save">Save changes</button></div></header><section class="content">${pageMarkup(activePage, documentState)}</section></main></div>${editorMode ? editorMarkup(documentState) : ''}`;
  bindEvents();
}

function navButton(id: string, icon: string, label: string): string { return `<button class="nav-button${activePage === id ? ' active' : ''}" data-page="${id}"><span>${icon}</span>${label}</button>`; }
function pageTitle(page: string): string { return ({ schedule: 'Schedule', dashboard: 'Dashboard', people: 'People', summary: 'Summary' } as Record<string, string>)[page] ?? 'Schedule'; }

function pageMarkup(page: string, state: PlannerDocument): string {
  if (page === 'people') return peopleMarkup(state);
  if (page === 'dashboard') return dashboardMarkup(state);
  if (page === 'summary') return summaryMarkup(state);
  return scheduleMarkup(state);
}

function scheduleMarkup(state: PlannerDocument): string {
  const today = new Date();
  const days = Array.from({ length: scheduleDays }, (_, index) => addDays(today, scheduleOffset * scheduleDays + index));
  const activities = state.activities.filter((activity) => activity.startDate && activity.endDate && (scheduleActivityFilter === 'all' || activity.status === scheduleActivityFilter));
  const employees = state.employees.slice().sort(compareScheduleEmployees);
  const visibleEmployees = scheduleSection === 'All sections' ? employees : employees.filter((employee) => (employee.section || 'Unassigned') === scheduleSection);
  const grouped = new Map<string, typeof employees>();
  for (const employee of visibleEmployees) {
    const group = employee.department || 'Unassigned';
    grouped.set(group, [...(grouped.get(group) ?? []), employee]);
  }
  const firstDay = days[0] ?? today;
  const lastDay = days[days.length - 1] ?? today;
  const sections = Array.from(new Set(employees.map((employee) => employee.section || 'Unassigned')));
  const picker = selectedCell ? statusPicker(state, selectedCell) : '';
  const showTimeline = scheduleViewMode !== 'employees';
  const showEmployees = scheduleViewMode !== 'timeline';
  return `<section class="schedule-workspace"><div class="schedule-toolbar-main"><div><div class="page-title">${escapeHtml(String(state.appSettings.appName ?? 'ATLAS'))}</div><div class="atlas-full-name">Adaptive Timeline, Load &amp; Allocation System</div><div class="page-sub">Daily status with week numbers and activity timeline.</div></div><div class="schedule-actions"><button class="secondary-button" data-schedule="today">Today</button><button class="secondary-button" data-schedule="jump">Jump…</button><select class="schedule-select" data-filter="view"><option value="all"${scheduleViewMode === 'all' ? ' selected' : ''}>Show: All</option><option value="timeline"${scheduleViewMode === 'timeline' ? ' selected' : ''}>Timeline only</option><option value="employees"${scheduleViewMode === 'employees' ? ' selected' : ''}>Employees only</option></select><select class="schedule-select" data-filter="section"><option>All sections</option>${sections.map((section) => `<option${scheduleSection === section ? ' selected' : ''}>${escapeHtml(section)}</option>`).join('')}</select></div></div><div class="schedule-controls"><button class="schedule-period${scheduleDays === 7 ? ' active' : ''}" data-period="7">Week</button><button class="schedule-period${scheduleDays === 14 ? ' active' : ''}" data-period="14">Month</button><button class="schedule-period${scheduleDays === 31 ? ' active' : ''}" data-period="31">Year</button><span class="schedule-period-label">${formatDate(firstDay)} – ${formatDate(lastDay)}</span><button class="icon-button" data-schedule="previous">‹</button><button class="icon-button" data-schedule="next">›</button><span class="toolbar-spacer"></span><select class="schedule-select" data-filter="activity"><option value="all">Show: All</option><option value="confirmed"${scheduleActivityFilter === 'confirmed' ? ' selected' : ''}>Confirmed only</option><option value="tentative"${scheduleActivityFilter === 'tentative' ? ' selected' : ''}>Planned only</option><option value="cancelled"${scheduleActivityFilter === 'cancelled' ? ' selected' : ''}>Cancelled only</option></select></div><div class="tm-grid"><div class="tm-grid-head tm-grid-row"><div class="tm-person-head">Activities / Personnel</div>${days.map((day) => dayHeader(day)).join('')}</div><div class="tm-grid-body">${showTimeline ? `<div class="tm-section-row"><div>Activities <small>${activities.length}</small><button class="inline-add" data-editor="activity">+</button></div><div class="tm-section-fill"></div></div>${activities.map((activity) => activityRow(activity, days)).join('') || `<div class="tm-empty-row"><div>No activities yet.</div><div class="tm-section-fill"></div></div>`}<div class="tm-section-row"><div>Holidays <button class="inline-add" data-editor="holiday">+</button></div><div class="tm-section-fill"></div></div><div class="tm-holiday-row"><div>Calendar / special days</div>${days.map((day) => `<div class="tm-day-cell holiday-cell">${isWeekend(day) ? 'Weekend' : ''}</div>`).join('')}</div>` : ''}${showEmployees ? `<div class="tm-section-row"><div>Employees <small>${visibleEmployees.length}</small></div><div class="tm-section-fill"></div></div>${[...grouped.entries()].map(([group, members]) => `<div class="tm-group-row"><div>${escapeHtml(group)} <small>${members.length} ${members.length === 1 ? 'person' : 'people'}</small></div><div class="tm-section-fill"></div></div>${members.map((employee) => employeeRow(employee, days, state)).join('')}`).join('') || `<div class="tm-empty-row"><div>No personnel yet. Use Import planner JSON.</div><div class="tm-section-fill"></div></div>`}` : ''}</div></div>${picker}</section>`;
}

function employeeRow(employee: PlannerDocument['employees'][number], days: Date[], state: PlannerDocument): string {
  return `<div class="tm-grid-row tm-employee-row"><div class="tm-person-cell"><span class="avatar">${initials(employee.name)}</span><span><strong>${escapeHtml(employee.name || 'Unnamed')}</strong><small>${escapeHtml([employee.section, employee.role].filter(Boolean).join(' · '))}</small></span></div>${days.map((day) => { const date = dateKey(day); const key = `${employee.id}_${date}`; const entry = state.entriesMap[key]; const status = typeof entry === 'string' ? entry : entry && typeof entry === 'object' && 'status' in entry ? String(entry.status) : ''; const selected = selectedCells.has(key); return `<button class="tm-day-cell tm-status-cell${status ? ' filled' : ''}${selected ? ' selected' : ''}" data-cell="${employee.id}:${date}" title="${escapeHtml(status || 'Edit status')}">${escapeHtml(status || '')}</button>`; }).join('')}</div>`;
}

function compareScheduleEmployees(left: PlannerDocument['employees'][number], right: PlannerDocument['employees'][number]): number {
  const hierarchyFields: (keyof PlannerDocument['employees'][number])[] = ['organisation', 'department', 'section', 'process', 'team'];
  for (const field of hierarchyFields) {
    const leftValue = String(left[field] ?? '').trim();
    const rightValue = String(right[field] ?? '').trim();
    const leftUnassigned = !leftValue || /^unassigned(?:\s|$)/i.test(leftValue);
    const rightUnassigned = !rightValue || /^unassigned(?:\s|$)/i.test(rightValue);
    if (leftUnassigned !== rightUnassigned) return leftUnassigned ? -1 : 1;
    if (!leftUnassigned) {
      const comparison = leftValue.localeCompare(rightValue, 'nb', { sensitivity: 'base' });
      if (comparison) return comparison;
    }
  }
  return left.sortOrder - right.sortOrder || left.name.localeCompare(right.name, 'nb', { sensitivity: 'base' });
}

function statusPicker(state: PlannerDocument, selection: { employeeId: number; date: string }): string {
  const employee = state.employees.find((item) => item.id === selection.employeeId);
  const current = state.entriesMap[`${selection.employeeId}_${selection.date}`];
  const currentStatus = typeof current === 'string' ? current : current && typeof current === 'object' && 'status' in current ? String(current.status) : '';
  return `<div class="status-picker"><div><strong>${escapeHtml(employee?.name ?? 'Personnel')}</strong><small>${selection.date}</small></div><div class="status-picker-options">${state.statuses.map((status) => `<button data-status="${escapeHtml(status.key)}" style="--status-color:${escapeHtml(status.color)}" class="status-option${currentStatus === status.key ? ' selected' : ''}">${escapeHtml(status.abbr)} <span>${escapeHtml(status.label)}</span></button>`).join('') || '<span class="muted-copy">No daily statuses configured.</span>'}</div><button class="secondary-button" data-cell-close>Close</button></div>`;
}

function activityRow(activity: PlannerDocument['activities'][number], days: Date[]): string {
  return `<div class="tm-grid-row tm-activity-row"><div class="tm-person-cell"><span class="activity-dot" style="background:${escapeHtml(activity.color)}"></span><span><strong>${escapeHtml(activity.abbreviation || activity.name)}</strong><small>${escapeHtml(activity.name)} · ${activity.status === 'confirmed' ? 'Confirmed' : 'Planned'}</small></span></div>${days.map((day) => { const date = dateKey(day); const active = date >= activity.startDate && date <= activity.endDate; return `<div class="tm-day-cell tm-activity-cell${active ? ' active' : ''}" style="${active ? `--activity-color:${escapeHtml(activity.color)}` : ''}">${active && date === activity.startDate ? escapeHtml(activity.abbreviation || activity.name.slice(0, 6)) : ''}</div>`; }).join('')}</div>`;
}

function dayHeader(day: Date): string { return `<div class="tm-day-head${isWeekend(day) ? ' weekend' : ''}"><b>${day.toLocaleDateString('en-GB', { weekday: 'short' }).slice(0, 2).toUpperCase()}</b><strong>${day.getDate()}</strong><small>W${isoWeek(day)}</small></div>`; }
function addDays(date: Date, amount: number): Date { const result = new Date(date); result.setDate(result.getDate() + amount); return result; }
function dateKey(date: Date): string { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
function formatDate(date: Date): string { return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }
function isWeekend(date: Date): boolean { return date.getDay() === 0 || date.getDay() === 6; }
function isoWeek(date: Date): number { const target = new Date(date.valueOf()); const day = (date.getDay() + 6) % 7; target.setDate(target.getDate() - day + 3); const firstThursday = new Date(target.getFullYear(), 0, 4); return 1 + Math.round(((target.getTime() - firstThursday.getTime()) / 86400000 - 3 + ((firstThursday.getDay() + 6) % 7)) / 7); }

function peopleMarkup(state: PlannerDocument): string { return `<section class="card page-card"><div class="section-heading"><div><span class="eyebrow">Personnel management</span><h2>${state.employees.length} team members</h2></div><button class="primary-button" data-action="import">Import planner JSON</button></div><div class="search-row"><input placeholder="Search name, department, role, or team…"><button class="secondary-button">Manage categories</button></div><div class="people-list">${state.employees.map((employee) => `<div class="person-list-row"><span class="avatar">${initials(employee.name)}</span><div class="person-main"><strong>${escapeHtml(employee.name)}</strong><span>${escapeHtml([employee.organisation, employee.department, employee.section, employee.process, employee.team].filter(Boolean).join(' / ') || 'Unassigned hierarchy')}</span></div><span class="role-pill">${escapeHtml(employee.role || 'No role')}</span><button class="icon-button">⋯</button></div>`).join('') || '<div class="empty-state">No personnel imported yet.</div>'}</div></section>`; }
function dashboardMarkup(state: PlannerDocument): string { return `<div class="dashboard-grid"><section class="card welcome-card"><span class="eyebrow">Operational overview</span><h2>Good morning, planner.</h2><p>ATLAS is hosting the Team Manager planning model. Import your existing planner JSON to populate the workspace without changing the original application.</p><button class="primary-button" data-action="import">Import existing planner</button></section><section class="card"><span class="eyebrow">Current data</span><div class="big-number">${state.employees.length}</div><p>personnel available for planning</p></section><section class="card"><span class="eyebrow">Schedule coverage</span><div class="big-number">${state.activities.length}</div><p>activities in the hosted planner</p></section></div>`; }
function summaryMarkup(state: PlannerDocument): string { return `<section class="card page-card"><span class="eyebrow">Workload and reporting</span><h2>Summary</h2><p class="muted-copy">The hosted summary is connected to the imported planner document. Workload calculations will be migrated into the core engine next.</p><div class="summary-placeholder"><strong>${state.employees.length} personnel</strong><span>${state.activities.length} activities · ${Object.keys(state.entriesMap).length} daily entries</span></div></section>`; }

function editorMarkup(_state: PlannerDocument): string {
  if (editorMode === 'activity') return `<div class="modal-bg open"><div class="modal"><h3>Add Activity</h3><p class="modal-desc">Create a timeline activity without modifying the original Team Manager app.</p><div class="form-row"><label>Name *</label><input id="activity-name" maxlength="25" placeholder="Q2 Planning"></div><div class="form-row-2"><div class="form-row"><label>From</label><input id="activity-start" type="date"></div><div class="form-row"><label>To</label><input id="activity-end" type="date"></div></div><div class="form-row"><label>Color</label><input id="activity-color" type="color" value="#3b82f6"></div><div class="modal-actions"><button class="secondary-button" data-editor-close>Cancel</button><button class="primary-button" data-editor-save="activity">Save</button></div></div></div>`;
  return `<div class="modal-bg open"><div class="modal"><h3>Add Holiday</h3><p class="modal-desc">Highlight a holiday or special calendar period.</p><div class="form-row"><label>Name *</label><input id="holiday-name" placeholder="Summer vacation"></div><div class="form-row-2"><div class="form-row"><label>From</label><input id="holiday-start" type="date"></div><div class="form-row"><label>To</label><input id="holiday-end" type="date"></div></div><div class="form-row"><label>Color</label><input id="holiday-color" type="color" value="#ef4444"></div><div class="modal-actions"><button class="secondary-button" data-editor-close>Cancel</button><button class="primary-button" data-editor-save="holiday">Save</button></div></div></div>`;
}

function bindEvents(): void {
  root.querySelectorAll<HTMLButtonElement>('[data-page]').forEach((button) => button.addEventListener('click', () => { activePage = button.dataset.page ?? 'schedule'; render(); }));
  root.querySelectorAll<HTMLButtonElement>('[data-action="save"]').forEach((button) => button.addEventListener('click', () => { void savePlanner(); }));
  root.querySelector<HTMLButtonElement>('[data-action="undo"]')?.addEventListener('click', () => { const previous = undoDocuments.pop(); if (previous) { planner = { ...planner, document: previous }; selectedCell = null; selectedCells.clear(); void savePlanner(); } });
  root.querySelectorAll<HTMLButtonElement>('[data-action="export"]').forEach((button) => button.addEventListener('click', exportPlanner));
  root.querySelectorAll<HTMLButtonElement>('[data-action="import"]').forEach((button) => button.addEventListener('click', () => root.querySelector<HTMLInputElement>('#import-file')?.click()));
  root.querySelector<HTMLInputElement>('#import-file')?.addEventListener('change', handleImport);
  root.querySelectorAll<HTMLButtonElement>('[data-period]').forEach((button) => button.addEventListener('click', () => { scheduleDays = Number(button.dataset.period ?? 14); scheduleOffset = 0; render(); }));
  root.querySelectorAll<HTMLButtonElement>('[data-schedule="previous"]').forEach((button) => button.addEventListener('click', () => { scheduleOffset -= 1; render(); }));
  root.querySelectorAll<HTMLButtonElement>('[data-schedule="next"]').forEach((button) => button.addEventListener('click', () => { scheduleOffset += 1; render(); }));
  root.querySelectorAll<HTMLButtonElement>('[data-schedule="today"]').forEach((button) => button.addEventListener('click', () => { scheduleOffset = 0; render(); }));
  root.querySelector<HTMLSelectElement>('[data-filter="section"]')?.addEventListener('change', (event) => { scheduleSection = (event.currentTarget as HTMLSelectElement).value; render(); });
  root.querySelector<HTMLSelectElement>('[data-filter="activity"]')?.addEventListener('change', (event) => { scheduleActivityFilter = (event.currentTarget as HTMLSelectElement).value; render(); });
  root.querySelector<HTMLSelectElement>('[data-filter="view"]')?.addEventListener('change', (event) => { scheduleViewMode = (event.currentTarget as HTMLSelectElement).value as typeof scheduleViewMode; render(); });
  root.querySelector<HTMLButtonElement>('[data-schedule="jump"]')?.addEventListener('click', () => { const value = window.prompt('Jump to date (YYYY-MM-DD)', dateKey(new Date())); if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return; const target = new Date(`${value}T12:00:00`); const diff = Math.round((target.getTime() - new Date().setHours(12, 0, 0, 0)) / 86400000); scheduleOffset = Math.floor(diff / scheduleDays); render(); });
  root.querySelectorAll<HTMLButtonElement>('[data-editor]').forEach((button) => button.addEventListener('click', () => { editorMode = button.dataset.editor as 'activity' | 'holiday'; render(); }));
  root.querySelector<HTMLButtonElement>('[data-editor-close]')?.addEventListener('click', () => { editorMode = null; render(); });
  root.querySelector<HTMLButtonElement>('[data-editor-save="activity"]')?.addEventListener('click', () => addActivityFromEditor());
  root.querySelector<HTMLButtonElement>('[data-editor-save="holiday"]')?.addEventListener('click', () => addHolidayFromEditor());
  root.querySelectorAll<HTMLButtonElement>('[data-cell]').forEach((button) => button.addEventListener('click', () => { const [employeeId, date] = (button.dataset.cell ?? '').split(':'); if (date === undefined) return; selectedCell = { employeeId: Number(employeeId), date }; render(); }));
  root.querySelectorAll<HTMLButtonElement>('[data-cell-close]').forEach((button) => button.addEventListener('click', () => { selectedCell = null; render(); }));
  root.querySelectorAll<HTMLButtonElement>('[data-status]').forEach((button) => button.addEventListener('click', () => {
    if (selectedCell === null) return;
    const status = button.dataset.status;
    if (!status) return;
    const key = `${selectedCell.employeeId}_${selectedCell.date}`;
    undoDocuments.push(planner.document);
    if (undoDocuments.length > 20) undoDocuments.shift();
    const entriesMap = { ...planner.document.entriesMap, [key]: { status, durationType: 'fullday', lifecycle: 'confirmed' as const } };
    planner = { ...planner, document: normalizeLegacyPlannerDocument({ ...planner.document, entriesMap, savedAt: new Date().toISOString() }) };
    selectedCell = null;
    void savePlanner();
  }));
}
function addActivityFromEditor(): void { const name = valueOf('activity-name'); const startDate = valueOf('activity-start'); const endDate = valueOf('activity-end'); if (!name || !startDate || !endDate) return; pushUndo(); const activity = { id: nextId(planner.document.activities), name, abbreviation: name.slice(0, 6).toUpperCase(), startDate, endDate, color: valueOf('activity-color') || '#3b82f6', status: 'tentative' as const, participants: [] }; planner = { ...planner, document: normalizeLegacyPlannerDocument({ ...planner.document, activities: [...planner.document.activities, activity] }) }; editorMode = null; void savePlanner(); }
function addHolidayFromEditor(): void { const name = valueOf('holiday-name'); const startDate = valueOf('holiday-start'); const endDate = valueOf('holiday-end'); if (!name || !startDate || !endDate) return; pushUndo(); const holidays = Array.isArray(planner.document.appSettings.holidays) ? planner.document.appSettings.holidays : []; planner = { ...planner, document: normalizeLegacyPlannerDocument({ ...planner.document, appSettings: { ...planner.document.appSettings, holidays: [...holidays, { id: Date.now(), name, startDate, endDate, color: valueOf('holiday-color') || '#ef4444' }] } }) }; editorMode = null; void savePlanner(); }
function pushUndo(): void { undoDocuments.push(planner.document); if (undoDocuments.length > 20) undoDocuments.shift(); }
function valueOf(id: string): string { return (root.querySelector<HTMLInputElement>(`#${id}`)?.value ?? '').trim(); }
function nextId(items: readonly { id: number }[]): number { return items.reduce((max, item) => Math.max(max, item.id), 0) + 1; }
async function savePlanner(): Promise<void> { saveState = 'saving'; render(); try { planner = await api.save(planner.document, planner.revision); saveState = 'saved'; } catch { saveState = 'error'; } render(); }
function exportPlanner(): void { const blob = new Blob([JSON.stringify(planner.document, null, 2)], { type: 'application/json' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'atlas-planner.json'; link.click(); URL.revokeObjectURL(link.href); }
async function handleImport(event: Event): Promise<void> { const input = event.currentTarget as HTMLInputElement; const file = input.files?.[0]; if (!file) return; try { planner = { revision: planner.revision, document: normalizeLegacyPlannerDocument(JSON.parse(await file.text())) }; await savePlanner(); } catch { saveState = 'error'; render(); } }
function loadingMarkup(): string { return '<div class="loading-screen"><span class="brand-mark">▦</span><strong>Loading ATLAS…</strong></div>'; }
function errorMarkup(message: string): string { return `<div class="loading-screen"><span class="brand-mark">!</span><strong>Could not load ATLAS</strong><p>${escapeHtml(message)}</p><button class="primary-button" onclick="location.reload()">Retry</button></div>`; }
function initials(name: string): string { return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('') || '—'; }
function escapeHtml(value: string): string { return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character] ?? character); }
