'use strict';

// Workwheel prototype: intentionally independent from the main planner JSON.
const WORKWHEEL_STORAGE_KEY = 'team-manager-workwheel-state';
const WORKWHEEL_FILE_META_KEY = 'team-manager-workwheel-file-meta';
const WORKWHEEL_VIEW_KEY = 'team-manager-workwheel-view';
let workwheelState = { version: 1, wheels: [], activities: [], availableActivities: [] };
let workwheelSelectedId = '';
let workwheelMonth = new Date();
// Ensure we're focused on the current month
if (workwheelMonth.getDate() > 28) workwheelMonth = new Date(workwheelMonth.getFullYear(), workwheelMonth.getMonth() + 1, 1);
if (workwheelMonth.getMonth() !== new Date().getMonth()) workwheelMonth = new Date();
let workwheelEditingId = null;
let workwheelZoom = 100;
let workwheelFocus = { mode: 'month', date: '', weekStart: '' };
let workwheelRevision = 0;
let workwheelHostedLoaded = false;
let workwheelPendingConflicts = [];
function loadWorkwheelView() {
  try {
    const view = JSON.parse(localStorage.getItem(WORKWHEEL_VIEW_KEY) || '{}');
    workwheelZoom = workwheelZoomValue(view.zoom);
    workwheelFocus = view.focus && ['month', 'week', 'day'].includes(view.focus.mode) ? { mode: view.focus.mode, date: workwheelDate(view.focus.date), weekStart: workwheelDate(view.focus.weekStart) } : { mode: 'month', date: '', weekStart: '' };
  } catch (error) { workwheelZoom = 100; workwheelFocus = { mode: 'month', date: '', weekStart: '' }; }
}
function saveWorkwheelView() { try { localStorage.setItem(WORKWHEEL_VIEW_KEY, JSON.stringify({ zoom: workwheelZoom, focus: workwheelFocus })); } catch (error) { } }

function workwheelEsc(value) { return typeof esc === 'function' ? esc(value) : String(value ?? '').replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch])); }
function workwheelPalette() { return typeof PALETTE !== 'undefined' ? PALETTE : ['#2563eb','#3b82f6','#4f46e5','#6366f1','#7c3aed','#8b5cf6','#a855f7','#c026d3','#db2777','#ec4899','#f43f5e','#e11d48','#ef4444','#dc2626','#f97316','#ea580c','#f59e0b','#d97706','#eab308','#65a30d','#10b981','#059669','#14b8a6','#0d9488','#06b6d4','#0ea5e9','#0284c7','#64748b','#475569']; }
function buildWorkwheelColorPicker(selected) {
  const container = document.getElementById('ww-activity-swatches');
  if (!container) return;
  const color = /^#[\da-fA-F]{6}$/.test(String(selected || '')) ? selected : workwheelPalette()[0];
  container.innerHTML = workwheelPalette().map(option => `<button type="button" class="swatch${option.toLowerCase() === color.toLowerCase() ? ' sel' : ''}" data-color="${option}" title="${option}" aria-label="Use event color ${option}" style="background:${option}" onclick="selectWorkwheelColor('${option}')"></button>`).join('');
  const input = document.getElementById('ww-activity-color');
  if (input) input.value = color;
}
function selectWorkwheelColor(color) {
  const value = /^#[\da-fA-F]{6}$/.test(String(color || '')) ? color : workwheelPalette()[0];
  const input = document.getElementById('ww-activity-color');
  if (input) input.value = value;
  document.querySelectorAll('#ww-activity-swatches .swatch').forEach(button => button.classList.toggle('sel', button.dataset.color.toLowerCase() === value.toLowerCase()));
}
function workwheelDate(value) { return /^\d{4}-\d{2}-\d{2}$/.test(String(value)) ? String(value) : ''; }
function workwheelLocalDate(date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
function workwheelDisplayDate(value) { const date = workwheelDate(value); return date ? `${date.slice(8, 10)}.${date.slice(5, 7)}.${date.slice(0, 4)}` : ''; }
function workwheelNormalize(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const wheels = Array.isArray(source.wheels) ? source.wheels.map((wheel, index) => ({
    id: String(wheel.id || `wheel-${index + 1}`), name: String(wheel.name || `Wheel ${index + 1}`).trim(), section: String(wheel.section || wheel.name || '').trim(), unitPath: String(wheel.unitPath || wheel.section || '').trim(), ownerUserId: String(wheel.ownerUserId || '').trim(), editorUserIds: Array.isArray(wheel.editorUserIds) ? [...new Set(wheel.editorUserIds.map(String))] : [], color: /^#[\da-fA-F]{6}$/.test(wheel.color) ? wheel.color : '#3b82f6'
  })).filter(wheel => wheel.name) : [];
  const wheelIds = new Set(wheels.map(wheel => wheel.id));
  const normalizeActivity = (activity, index, library = false) => ({
       id: String(activity.id || `workwheel-activity-${index + 1}`), linkedScheduleActivityId: activity.linkedScheduleActivityId == null ? null : Number(activity.linkedScheduleActivityId), sourceActivityId: activity.sourceActivityId == null ? null : Number(activity.sourceActivityId), wheelId: wheelIds.has(String(activity.wheelId)) ? String(activity.wheelId) : (wheels[0]?.id || ''), title: String(activity.title || 'Activity').trim(), type: String(activity.type || 'meeting'), date: workwheelDate(activity.date), time: String(activity.time || '').trim(), startTime: String(activity.startTime || '').trim(), endTime: String(activity.endTime || '').trim(), location: String(activity.location || '').trim(), participantIds: Array.isArray(activity.participantIds) ? [...new Set(activity.participantIds.map(Number).filter(Number.isFinite))] : [], responsibleMode: activity.responsibleMode === 'external' || (!activity.responsibleId && activity.responsibleName) ? 'external' : 'internal', responsibleId: String(activity.responsibleId || ''), responsibleName: String(activity.responsibleName || '').trim(), responsibleOrganization: String(activity.responsibleOrganization || '').trim(), responsibleEmail: String(activity.responsibleEmail || '').trim(), responsiblePhone: String(activity.responsiblePhone || '').trim(), notes: String(activity.notes || '').trim(), color: /^#[\da-fA-F]{6}$/.test(activity.color) ? activity.color : '#3b82f6', status: ['planned', 'confirmed', 'cancelled'].includes(activity.status) ? activity.status : 'planned', recurrence: ['none', 'daily', 'weekly', 'fortnightly', 'monthly'].includes(activity.recurrence) ? activity.recurrence : 'none', weekday: Number.isInteger(Number(activity.weekday)) ? Number(activity.weekday) : new Date(`${activity.date}T00:00:00`).getDay(), endDate: workwheelDate(activity.endDate)
  });
  const activities = Array.isArray(source.activities) ? source.activities.map((activity, index) => normalizeActivity(activity, index)).filter(activity => activity.title && activity.date && activity.wheelId) : [];
  const availableActivities = Array.isArray(source.availableActivities) ? source.availableActivities.map((activity, index) => normalizeActivity(activity, index, true)).filter(activity => activity.title).map(activity => ({ ...activity, wheelId: '' })) : [];
  return { version: 1, wheels, activities, availableActivities };
}
function loadWorkwheelState() {
  try { workwheelState = workwheelNormalize(JSON.parse(localStorage.getItem(WORKWHEEL_STORAGE_KEY) || '{}')); } catch (error) { workwheelState = workwheelNormalize({}); }
  if (!workwheelSelectedId || !workwheelState.wheels.some(wheel => wheel.id === workwheelSelectedId)) workwheelSelectedId = workwheelState.wheels[0]?.id || '';
}
function saveWorkwheelState() {
  localStorage.setItem(WORKWHEEL_STORAGE_KEY, JSON.stringify(workwheelState));
  if (typeof hostedMode !== 'undefined' && hostedMode) saveHostedWorkwheel();
  const status = document.getElementById('workwheel-file-status');
  if (status) status.textContent = 'Browser recovery updated. Use Export JSON to create a portable file.';
}
function workwheelCanEdit(wheel = workwheelState.wheels.find(item => item.id === workwheelSelectedId)) {
  if (typeof hostedUser === 'undefined' || !hostedUser) return true;
  return hostedUser.role === 'admin' || wheel?.ownerUserId === hostedUser.id || wheel?.editorUserIds?.includes(hostedUser.id);
}
async function loadHostedWorkwheel() {
  if (workwheelHostedLoaded || typeof hostedMode === 'undefined' || !hostedMode) return;
  const response = await fetch('/api/workwheel', { cache: 'no-store' });
  if (!response.ok) return;
  const result = await response.json();
  workwheelRevision = Number(result.revision) || 1;
  const hosted = workwheelNormalize(result.document || {});
  const local = workwheelNormalize(workwheelState);
  workwheelState = hosted.wheels.length || hosted.activities.length ? hosted : local;
  workwheelHostedLoaded = true;
  if (!hosted.wheels.length && local.wheels.length) await saveHostedWorkwheel();
}
async function saveHostedWorkwheel() {
  if (typeof hostedMode === 'undefined' || !hostedMode || !workwheelRevision) return;
  const response = await fetch('/api/workwheel', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ document: workwheelState, expectedRevision: workwheelRevision }) });
  const result = await response.json().catch(() => ({}));
  if (response.status === 409) { workwheelHostedLoaded = false; await loadHostedWorkwheel(); showToast?.('Workwheel was updated elsewhere and has been reloaded.', 4000); return; }
  if (response.ok) workwheelRevision = Number(result.revision) || workwheelRevision + 1;
}
function workwheelResponsible(activity) {
  const employee = typeof empById === 'function' && activity.responsibleId ? empById(Number(activity.responsibleId)) : null;
  return employee?.name || activity.responsibleName || 'Unassigned';
}
function toggleWorkwheelResponsibleMode() {
  const mode = document.querySelector('input[name="ww-responsible-mode"]:checked')?.value || 'internal';
  document.getElementById('ww-responsible-internal').style.display = mode === 'internal' ? '' : 'none';
  document.getElementById('ww-responsible-external').style.display = mode === 'external' ? '' : 'none';
}
function populateWorkwheelResponsibleOptions(selectedId = '') {
  const select = document.getElementById('ww-activity-responsible-id');
  if (!select) return;
  const people = typeof employees !== 'undefined' ? [...employees].sort((a, b) => a.name.localeCompare(b.name)) : [];
  select.innerHTML = '<option value="">Unassigned</option>' + people.map(person => `<option value="${Number(person.id)}" ${String(person.id) === String(selectedId) ? 'selected' : ''}>${workwheelEsc(person.name)}${person.department ? ` · ${workwheelEsc(person.department)}` : ''}</option>`).join('');
}
function populateWorkwheelParticipants(selectedIds = []) {
  const list = document.getElementById('ww-activity-participants');
  if (!list) return;
  const selected = new Set((selectedIds || []).map(Number));
  const people = typeof employees !== 'undefined' ? [...employees].sort((a, b) => a.name.localeCompare(b.name)) : [];
  list.innerHTML = people.length ? people.map(person => `<label><input type="checkbox" value="${Number(person.id)}" ${selected.has(Number(person.id)) ? 'checked' : ''} onchange="refreshWorkwheelConflictWarning()"><span>${workwheelEsc(person.name)}${person.department ? ` · ${workwheelEsc(person.department)}` : ''}</span></label>`).join('') : '<div class="form-hint">No personnel records available.</div>';
}
function filterWorkwheelParticipants(query = '') {
  const needle = String(query).trim().toLowerCase();
  document.querySelectorAll('#ww-activity-participants label').forEach(label => { label.style.display = !needle || label.textContent.toLowerCase().includes(needle) ? '' : 'none'; });
}
function setAllWorkwheelParticipants(selected) {
  document.querySelectorAll('#ww-activity-participants label').forEach(label => { if (label.style.display !== 'none') label.querySelector('input').checked = selected; });
}
async function checkWorkwheelConflicts() {
  const participantIds = [...document.querySelectorAll('#ww-activity-participants input:checked')].map(input => Number(input.value)).filter(Number.isFinite);
  const response = await fetch('/api/workwheel/conflicts', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ workwheelActivityId: workwheelEditingId, participantIds, occurrenceDate: document.getElementById('ww-activity-date')?.value, startTime: document.getElementById('ww-activity-start-time')?.value, endTime: document.getElementById('ww-activity-end-time')?.value }) });
  if (!response.ok) return [];
  const result = await response.json();
  workwheelPendingConflicts = Array.isArray(result.conflicts) ? result.conflicts : [];
  const note = document.getElementById('ww-conflict-warning');
  if (note) note.innerHTML = workwheelPendingConflicts.length ? `<strong>Potential conflicts</strong><br>${workwheelPendingConflicts.map(item => `${workwheelEsc(item.title)} · ${workwheelEsc(item.date)} · ${workwheelEsc(item.time)}`).join('<br>')}` : '';
  return workwheelPendingConflicts;
}
function workwheelTimeOverlaps(firstStart, firstEnd, secondStart, secondEnd) {
  if (!firstStart || !firstEnd || !secondStart || !secondEnd) return true;
  return firstStart < secondEnd && secondStart < firstEnd;
}
function workwheelCurrentConflicts() {
  const date = document.getElementById('ww-activity-date')?.value || '';
  const startTime = document.getElementById('ww-activity-start-time')?.value || '';
  const endTime = document.getElementById('ww-activity-end-time')?.value || '';
  const participantIds = new Set([...document.querySelectorAll('#ww-activity-participants input:checked')].map(input => Number(input.value)).filter(Number.isFinite));
  if (!date || !participantIds.size) return [];
  const conflicts = [];
  for (const other of typeof activities !== 'undefined' ? activities : []) {
    if (workwheelEditingId && Number(other.id) === Number(workwheelState.activities.find(item => item.id === workwheelEditingId)?.linkedScheduleActivityId)) continue;
    if (date < other.startDate || date > other.endDate) continue;
    const otherParticipants = (other.participants || []).map(participant => Number(participant.id)).filter(id => participantIds.has(id));
    if (otherParticipants.length) conflicts.push({ source: 'schedule', title: other.name || 'Schedule activity', date, time: 'All day', participantIds: otherParticipants });
  }
  for (const other of workwheelState.activities) {
    if (other.id === workwheelEditingId) continue;
    const occurrence = workwheelOccurrences(other, date, date)[0];
    if (!occurrence) continue;
    const otherParticipants = (other.participantIds || []).filter(id => participantIds.has(Number(id)));
    if (otherParticipants.length && workwheelTimeOverlaps(startTime, endTime, other.startTime, other.endTime)) conflicts.push({ source: 'workwheel', title: other.title, date, time: other.startTime && other.endTime ? `${other.startTime}–${other.endTime}` : 'All day', participantIds: otherParticipants });
  }
  return conflicts;
}
function refreshWorkwheelConflictWarning() {
  workwheelPendingConflicts = workwheelCurrentConflicts();
  const note = document.getElementById('ww-conflict-warning');
  if (note) note.innerHTML = workwheelPendingConflicts.length ? `<strong>Potential conflicts</strong><br>${workwheelPendingConflicts.map(item => `${workwheelEsc(item.title)} · ${workwheelEsc(item.date)} · ${workwheelEsc(item.time)}`).join('<br>')}` : '';
  return workwheelPendingConflicts;
}
// Visual guideline: a filled sector indicates an activity is scheduled on that date.
// The color of the sector comes from the activity's color setting.
// Visual guideline: a filled sector indicates an activity is scheduled on that date.
// The color of the sector comes from the activity's color setting.
function workwheelRecurrenceLabel(recurrence) {
  return { daily: 'Daily', weekly: 'Weekly', fortnightly: 'Every 14 days', monthly: 'Monthly' }[recurrence] || '';
}
function workwheelOccurrences(activity, from, to) {
  const result = [], start = new Date(`${activity.date}T00:00:00`), limit = new Date(`${to}T00:00:00`);
  if (Number.isNaN(start.getTime())) return result;
  for (const cursor = new Date(start); cursor <= limit; cursor.setDate(cursor.getDate() + 1)) {
    const date = workwheelLocalDate(cursor);
    if (date < from || (activity.recurrence === 'none' && activity.endDate && date > activity.endDate)) continue;
    const elapsed = Math.round((cursor - start) / 86400000);
    const matches = activity.recurrence === 'daily' || (activity.recurrence === 'weekly' && elapsed % 7 === 0) || (activity.recurrence === 'fortnightly' && elapsed % 14 === 0) || (activity.recurrence === 'monthly' && cursor.getDate() === start.getDate()) || (activity.recurrence === 'none' && date === activity.date);
    if (matches) result.push({ ...activity, occurrenceDate: date });
  }
  return result;
}
function workwheelGridLookaheadEnd() {
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  end.setDate(end.getDate() + Math.max(1, Math.min(365, Number(appSettings?.workwheelUpcomingDays) || 14)) - 1);
  return workwheelLocalDate(end);
}
function workwheelMonthDates() { const y = workwheelMonth.getFullYear(), m = workwheelMonth.getMonth(); return { year: y, month: m, from: `${y}-${String(m + 1).padStart(2, '0')}-01`, to: `${y}-${String(m + 1).padStart(2, '0')}-${String(new Date(y, m + 1, 0).getDate()).padStart(2, '0')}`, days: new Date(y, m + 1, 0).getDate() }; }
function workwheelDayOfMonth(date) { return new Date(`${date}T00:00:00`).getDate(); }
function workwheelIsoWeek(date) { const value = new Date(`${date}T00:00:00`); value.setHours(0, 0, 0, 0); value.setDate(value.getDate() + 3 - ((value.getDay() + 6) % 7)); const week1 = new Date(value.getFullYear(), 0, 4); return 1 + Math.round(((value - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7); }
function workwheelWeekKey(date) { const value = new Date(`${date}T00:00:00`); value.setDate(value.getDate() - ((value.getDay() + 6) % 7)); return workwheelLocalDate(value); }
function workwheelReferenceDay(year, month, days) {
  const today = new Date();
  return today.getFullYear() === year && today.getMonth() === month ? today.getDate() : 1;
}
function workwheelAngleForDate(date, year, month, days) {
  // Today stays fixed at 12 o'clock. The calendar rotates around it each day,
  // while preserving each day's real relative position in the active month.
  const dayAngle = ((workwheelDayOfMonth(date) - 0.5) / days) * 360;
  const referenceDay = workwheelReferenceDay(year, month, days);
  const referenceAngle = ((referenceDay - 0.5) / days) * 360;
  return dayAngle - referenceAngle;
}
function workwheelDateSectorStart(date, year, month, days) {
  return workwheelAngleForDate(date, year, month, days) - (360 / days) / 2;
}
function workwheelSvgPoint(cx, cy, radius, angle) {
  const radians = (angle - 90) * Math.PI / 180;
  return { x: cx + radius * Math.cos(radians), y: cy + radius * Math.sin(radians) };
}
function workwheelSvgArc(cx, cy, outerRadius, innerRadius, startAngle, endAngle) {
  const outerStart = workwheelSvgPoint(cx, cy, outerRadius, startAngle);
  const outerEnd = workwheelSvgPoint(cx, cy, outerRadius, endAngle);
  const innerEnd = workwheelSvgPoint(cx, cy, innerRadius, endAngle);
  const innerStart = workwheelSvgPoint(cx, cy, innerRadius, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${outerStart.x.toFixed(2)} ${outerStart.y.toFixed(2)} A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${outerEnd.x.toFixed(2)} ${outerEnd.y.toFixed(2)} L ${innerEnd.x.toFixed(2)} ${innerEnd.y.toFixed(2)} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerStart.x.toFixed(2)} ${innerStart.y.toFixed(2)} Z`;
}
function workwheelTodayMarker(year, month, days) {
  const today = new Date();
  if (today.getFullYear() !== year || today.getMonth() !== month) return '';
  const date = workwheelLocalDate(today);
  return `<svg class="ww-svg-today" viewBox="0 0 800 800" preserveAspectRatio="xMidYMid meet" aria-label="Today: ${workwheelEsc(workwheelDisplayDate(date))}"><line x1="400" y1="18" x2="400" y2="248"/><path d="M 390 8 L 410 8 L 400 30 Z"/><rect x="376" y="35" width="48" height="21" rx="5"/><text x="400" y="50">Today</text></svg>`;
}
function workwheelRingMarkup(year, month, days) {
  const dates = Array.from({ length: days }, (_, index) => `${year}-${String(month + 1).padStart(2, '0')}-${String(index + 1).padStart(2, '0')}`);
  const cx = 400, cy = 400, daySpan = 360 / days;
  const dayCells = dates.map((date, index) => {
    const start = workwheelDateSectorStart(date, year, month, days);
    const end = start + daySpan;
    const middle = start + daySpan / 2;
    const day = index + 1;
    const point = workwheelSvgPoint(cx, cy, 313, middle);
    const weekday = new Date(`${date}T00:00:00`).toLocaleDateString('en-GB', { weekday: 'short' });
    const weekend = [0, 6].includes(new Date(`${date}T00:00:00`).getDay());
    const today = workwheelLocalDate(new Date());
    const past = date < today;
    const current = date === today;
    const dayClass = `${weekend ? ' weekend' : ''}${past ? ' past' : ''}${current ? ' current' : ''}`;
    return `<g class="ww-svg-day-group${dayClass}"><path class="ww-svg-day" d="${workwheelSvgArc(cx, cy, 382, 248, start, end)}" data-date="${date}" tabindex="0" role="button" aria-label="${weekday} ${workwheelDisplayDate(date)}" onclick="focusWorkwheelDay('${date}')"/><text class="ww-svg-day-number" x="${point.x.toFixed(2)}" y="${(point.y - 3).toFixed(2)}">${day}</text><text class="ww-svg-day-name" x="${point.x.toFixed(2)}" y="${(point.y + 12).toFixed(2)}">${weekday}</text></g>`;
  }).join('');
  const weekBands = [];
  let startIndex = 0;
  while (startIndex < dates.length) {
    const weekKey = workwheelWeekKey(dates[startIndex]);
    let endIndex = startIndex;
    while (endIndex + 1 < dates.length && workwheelWeekKey(dates[endIndex + 1]) === weekKey) endIndex++;
    const start = workwheelDateSectorStart(dates[startIndex], year, month, days);
    const end = start + (endIndex - startIndex + 1) * daySpan;
    const point = workwheelSvgPoint(cx, cy, 205, start + (end - start) / 2);
    weekBands.push(`<path class="ww-svg-week" d="${workwheelSvgArc(cx, cy, 248, 158, start, end)}" tabindex="0" role="button" aria-label="Focus ISO week ${workwheelIsoWeek(dates[startIndex])}" onclick="focusWorkwheelWeek('${dates[startIndex]}')"/><text class="ww-svg-week-label" x="${point.x.toFixed(2)}" y="${point.y.toFixed(2)}">W${workwheelIsoWeek(dates[startIndex])}</text>`);
    startIndex = endIndex + 1;
  }
  const monthName = new Date(year, month, 1).toLocaleDateString('en-US', { month:'long', year:'numeric' });
  const boundaryAngle = workwheelDateSectorStart(dates[0], year, month, days);
  const boundaryInner = workwheelSvgPoint(cx, cy, 142, boundaryAngle);
  const boundaryOuter = workwheelSvgPoint(cx, cy, 390, boundaryAngle);
  const startLabel = workwheelSvgPoint(cx, cy, 367, boundaryAngle + 2.7);
  const endLabel = workwheelSvgPoint(cx, cy, 367, boundaryAngle - 2.7);
  const nextMonth = new Date(year, month + 1, 1).toLocaleDateString('en-US', { month:'short' }).toUpperCase();
  return `<svg class="workwheel-svg" viewBox="0 0 800 800" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${workwheelEsc(monthName)} calendar"><circle class="ww-svg-base" cx="400" cy="400" r="390"/>${weekBands.join('')}${dayCells}<g class="ww-svg-month-boundary"><line x1="${boundaryInner.x.toFixed(2)}" y1="${boundaryInner.y.toFixed(2)}" x2="${boundaryOuter.x.toFixed(2)}" y2="${boundaryOuter.y.toFixed(2)}"/><circle cx="${boundaryOuter.x.toFixed(2)}" cy="${boundaryOuter.y.toFixed(2)}" r="6"/><text class="ww-svg-month-end" x="${endLabel.x.toFixed(2)}" y="${endLabel.y.toFixed(2)}">END</text><text class="ww-svg-month-start" x="${startLabel.x.toFixed(2)}" y="${startLabel.y.toFixed(2)}">${workwheelEsc(nextMonth)}</text></g><g class="ww-svg-month-button" tabindex="0" role="button" aria-label="Back to month overview" onclick="resetWorkwheelFocus()" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();resetWorkwheelFocus()}"><circle class="ww-svg-month-core" cx="400" cy="400" r="142"/><text class="ww-svg-month-label" x="400" y="400">${workwheelEsc(new Date(year, month, 1).toLocaleDateString('en-US', { month:'long' }))}</text><text class="ww-svg-year-label" x="400" y="424">${year}</text><text class="ww-svg-overview-hint" x="400" y="449">Month overview</text></g></svg>`;
}
function workwheelZoomValue(value) { return [75, 100, 125, 150, 175, 200].includes(Number(value)) ? Number(value) : 100; }
function setWorkwheelZoom(value) { workwheelZoom = workwheelZoomValue(value); saveWorkwheelView(); renderWorkwheel(); }
function focusWorkwheelDay(date) { workwheelFocus = { mode: 'day', date, weekStart: workwheelWeekKey(date) }; saveWorkwheelView(); renderWorkwheel(); }
function focusWorkwheelWeek(date) { workwheelFocus = { mode: 'week', date: '', weekStart: workwheelWeekKey(date) }; saveWorkwheelView(); renderWorkwheel(); }
function resetWorkwheelFocus() { workwheelFocus = { mode: 'month', date: '', weekStart: '' }; saveWorkwheelView(); renderWorkwheel(); }
function workwheelFocusDates() {
  if (workwheelFocus.mode === 'day' && workwheelFocus.date) return [workwheelFocus.date];
  if (workwheelFocus.mode === 'week' && workwheelFocus.weekStart) {
    const start = new Date(`${workwheelFocus.weekStart}T00:00:00`);
    return Array.from({ length: 7 }, (_, index) => { const day = new Date(start); day.setDate(start.getDate() + index); return workwheelLocalDate(day); });
  }
  return [];
}
function renderWorkwheelFocus(activityOccurrences) {
  const dates = workwheelFocusDates();
  if (!dates.length) return '';
  const byDate = new Map(dates.map(date => [date, activityOccurrences.filter(activity => activity.occurrenceDate === date)]));
  if (workwheelFocus.mode === 'day') {
    const date = dates[0], events = byDate.get(date) || [];
    return `<section class="card workwheel-focus"><div class="workwheel-focus-header"><div><span class="eyebrow">Day focus</span><h2>${workwheelEsc(workwheelDisplayDate(date))}</h2></div><div class="flex gap-2"><button class="btn btn-sm" onclick="openWorkwheelActivityForDate('${date}')">Add activity</button><button class="btn btn-sm" onclick="resetWorkwheelFocus()">Back to overview</button></div></div><div class="workwheel-day-focus-list">${events.length ? events.map(activity => `<button class="workwheel-focus-event" style="--event-color:${workwheelEsc(activity.color)}" onclick="openWorkwheelActivity('${workwheelEsc(activity.id)}')"><b>${esc(activity.startTime && activity.endTime ? `${activity.startTime}–${activity.endTime}` : activity.time || 'All day')}</b><span>${workwheelEsc(activity.title)}</span><small>${workwheelEsc(workwheelResponsible(activity))}${activity.location ? ` · ${workwheelEsc(activity.location)}` : ''} · ${workwheelEsc(activity.status)}</small></button>`).join('') : '<div class="empty-note">No activities planned for this day.</div>'}</div></section>`;
  }
  return `<section class="card workwheel-focus"><div class="workwheel-focus-header"><div><span class="eyebrow">Week focus</span><h2>Week ${workwheelIsoWeek(dates[0])}</h2></div><button class="btn btn-sm" onclick="resetWorkwheelFocus()">Back to overview</button></div><div class="workwheel-week-focus">${dates.map(date => { const events = byDate.get(date) || []; return `<article class="workwheel-week-day"><header><b>${workwheelEsc(new Date(`${date}T00:00:00`).toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'short' }))}</b><button class="btn btn-sm" onclick="openWorkwheelActivityForDate('${date}')">+</button></header>${events.length ? events.map(activity => `<button class="workwheel-focus-event" style="--event-color:${workwheelEsc(activity.color)}" onclick="openWorkwheelActivity('${workwheelEsc(activity.id)}')"><b>${esc(activity.startTime && activity.endTime ? `${activity.startTime}–${activity.endTime}` : activity.time || 'All day')}</b><span>${workwheelEsc(activity.title)}</span><small>${workwheelEsc(workwheelResponsible(activity))}${activity.location ? ` · ${workwheelEsc(activity.location)}` : ''}</small></button>`).join('') : '<small class="muted">No activities</small>'}</article>`; }).join('')}</div></section>`;
}
async function renderWorkwheel() {
  if (typeof appSettings === 'undefined' || appSettings.workwheelEnabled !== true) { nav('grid'); return; }
  loadWorkwheelState();
  await loadHostedWorkwheel();
  const content = document.getElementById('content');
  const range = workwheelMonthDates();
  const wheel = workwheelState.wheels.find(item => item.id === workwheelSelectedId);
  const wheelActivities = wheel ? workwheelState.activities.filter(item => item.wheelId === wheel.id).flatMap(item => workwheelOccurrences(item, range.from, range.to)) : [];
  const focusPanel = renderWorkwheelFocus(wheelActivities);
  const upcomingTo = new Date(); upcomingTo.setDate(upcomingTo.getDate() + (appSettings.workwheelUpcomingDays || 14));
  const upcomingDate = workwheelLocalDate(upcomingTo);
  const todayDate = workwheelLocalDate(new Date());
  const upcoming = workwheelState.activities.filter(item => !wheel || item.wheelId === wheel.id).flatMap(item => workwheelOccurrences(item, todayDate, upcomingDate)).filter(item => item.status !== 'cancelled').sort((a, b) => a.occurrenceDate.localeCompare(b.occurrenceDate) || a.time.localeCompare(b.time));
  const todayUpcoming = upcoming.filter(item => item.occurrenceDate === todayDate);
  const futureUpcoming = upcoming.filter(item => item.occurrenceDate > todayDate);
  const daySectorSize = 360 / range.days;
  const segmentItems = wheelActivities.map(activity => {
    // For recurring activities, endDate is the series boundary—not the visual
    // duration of every occurrence. Only non-recurring activities span days.
    const activityEnd = activity.recurrence === 'none' && workwheelDate(activity.endDate) && activity.endDate >= activity.occurrenceDate ? activity.endDate : activity.occurrenceDate;
    const durationDays = Math.max(1, Math.round((new Date(`${activityEnd}T00:00:00`) - new Date(`${activity.occurrenceDate}T00:00:00`)) / 86400000) + 1);
    const startDay = workwheelDayOfMonth(activity.occurrenceDate);
    const endDay = Math.min(range.days, startDay + durationDays - 1);
    return { activity, activityEnd, durationDays, startDay, endDay, long: durationDays > 2 };
  });
  const assignLanes = items => {
    const ends = [];
    const lanes = new Map();
    [...items].sort((a, b) => a.startDay - b.startDay || b.endDay - a.endDay).forEach(item => {
      let lane = ends.findIndex(end => end < item.startDay);
      if (lane < 0) { lane = ends.length; ends.push(item.endDay); } else ends[lane] = item.endDay;
      lanes.set(item, lane);
    });
    return lanes;
  };
  const shortLanes = assignLanes(segmentItems.filter(item => !item.long));
  const longLanes = assignLanes(segmentItems.filter(item => item.long));
  const canEdit = workwheelCanEdit(wheel);
  const segments = segmentItems.map(item => {
    const { activity, activityEnd, durationDays } = item;
    const lane = item.long ? longLanes.get(item) : shortLanes.get(item);
    const laneOuter = item.long ? Math.max(43 - lane * 10, 22) : Math.max(71 - lane * 11, 50);
    const laneInner = item.long ? Math.max(laneOuter - 8, 14) : Math.max(laneOuter - 9, 41);
    const spanDays = Math.min(range.days, durationDays);
    const segmentSize = Math.min(359, spanDays * daySectorSize - 1);
    const start = workwheelDateSectorStart(activity.occurrenceDate, range.year, range.month, range.days);
    const segmentMid = start + segmentSize / 2;
    const labelRadius = (laneInner + laneOuter) / 2;
    const labelAngle = segmentMid * Math.PI / 180;
    // The radial mask is sized with CSS's farthest-corner radius rather than
    // the circle's nearest-side radius. Convert that mask percentage to the
    // same Cartesian coordinate system used by the full wheel.
    const labelX = 50 + labelRadius / Math.SQRT2 * Math.sin(labelAngle);
    const labelY = 50 - labelRadius / Math.SQRT2 * Math.cos(labelAngle);
    const segmentLabel = workwheelEsc(String(activity.title || 'Event').trim().slice(0, 4).toUpperCase());
    const segmentTitle = `${workwheelEsc(activity.title)} — ${workwheelEsc(workwheelDisplayDate(activity.occurrenceDate))}${durationDays > 1 ? ` to ${workwheelEsc(workwheelDisplayDate(activityEnd))}` : ''} · Week ${workwheelIsoWeek(activity.occurrenceDate)}`;
    const segmentStyle = `--segment-start:${workwheelEsc(start)}deg;--segment-size:${workwheelEsc(segmentSize)}deg;--segment-color:${workwheelEsc(activity.color)};--segment-inner:${laneInner}%;--segment-outer:${laneOuter}%`;
    const labelStyle = `${segmentStyle};--label-x:${workwheelEsc(labelX)}%;--label-y:${workwheelEsc(labelY)}%`;
    return `<div class="workwheel-segment${item.long ? ' workwheel-segment-long' : ''}" data-activity-id="${workwheelEsc(activity.id)}" data-segment-start="${workwheelEsc(start)}" data-segment-size="${workwheelEsc(segmentSize)}" data-segment-inner="${workwheelEsc(laneInner)}" data-segment-outer="${workwheelEsc(laneOuter)}" style="${segmentStyle}" title="${segmentTitle}"></div><span class="workwheel-segment-label" style="${labelStyle}">${segmentLabel}</span>`;
  }).join('');
  const legendActivities = [...new Map(wheelActivities.map(activity => [activity.id, activity])).values()];
  const list = legendActivities.map(activity => `<div class="workwheel-activity-row"><span class="workwheel-dot" style="background:${workwheelEsc(activity.color)}"></span><div><strong style="color:${workwheelEsc(activity.color)}">${workwheelEsc(activity.title)}</strong><small>${workwheelEsc(workwheelDisplayDate(activity.occurrenceDate))}${activity.startTime && activity.endTime ? ` · ${workwheelEsc(activity.startTime)}–${workwheelEsc(activity.endTime)}` : activity.time ? ` · ${workwheelEsc(activity.time)}` : ' · All day'}${activity.location ? ` · ${workwheelEsc(activity.location)}` : ''}${workwheelRecurrenceLabel(activity.recurrence) ? ` · ${workwheelRecurrenceLabel(activity.recurrence)}` : ''} · ${workwheelEsc(workwheelResponsible(activity))}</small></div><div class="workwheel-activity-actions"><button class="icon-btn" onclick="openWorkwheelActivity('${workwheelEsc(activity.id)}')">Edit</button><button class="icon-btn danger" title="Delete activity" onclick="confirmDeleteWorkwheelActivity('${workwheelEsc(activity.id)}')">Delete</button></div></div>`).join('') || '<div class="empty-note">No activities in this period.</div>';
  const upcomingItem = activity => `<div class="workwheel-upcoming-item" style="--agenda-color:${workwheelEsc(activity.color)};border-left-color:${workwheelEsc(activity.color)}"><span class="workwheel-agenda-dot" style="background:${workwheelEsc(activity.color)}"></span><div><b style="color:${workwheelEsc(activity.color)}">${workwheelEsc(activity.title)}</b><span>${workwheelEsc(workwheelDisplayDate(activity.occurrenceDate))}${activity.startTime && activity.endTime ? ` · ${workwheelEsc(activity.startTime)}–${workwheelEsc(activity.endTime)}` : activity.time ? ` · ${workwheelEsc(activity.time)}` : ' · All day'}</span><small>${workwheelEsc(activity.type)}${activity.location ? ` · ${workwheelEsc(activity.location)}` : ''}${workwheelRecurrenceLabel(activity.recurrence) ? ` · ${workwheelRecurrenceLabel(activity.recurrence)}` : ''} · ${workwheelEsc(workwheelResponsible(activity))}</small></div></div>`;
  const todayList = todayUpcoming.map(upcomingItem).join('') || '<div class="empty-note">No events today.</div>';
  const futureList = futureUpcoming.slice(0, 12).map(upcomingItem).join('') || '<div class="empty-note">Nothing upcoming.</div>';
  // Keep the initial template compatible; the panel is replaced with the two
  // explicit agenda sections immediately after rendering.
  const upcomingList = futureList;
// Guidelines: events with specific dates appear on that date; events with times appear as notes alongside. Use consistent YYYY-MM-DD format.
  const emptyWheelDescription = 'Create a wheel for a team, process, or other organisational unit.';
  const importedScheduleIds = new Set(workwheelState.activities.filter(activity => activity.wheelId === workwheelSelectedId).map(activity => Number(activity.sourceActivityId)).filter(Number.isFinite));
  const scheduleLibraryList = typeof activities !== 'undefined' && activities.length
    ? activities.filter(activity => !importedScheduleIds.has(Number(activity.id))).slice().sort((a, b) => String(a.startDate || '').localeCompare(String(b.startDate || ''))).map(activity => `<div class="workwheel-library-item"><span class="workwheel-dot" style="background:${workwheelEsc(activity.color || '#3b82f6')}"></span><div><strong>${workwheelEsc(activity.name || 'Activity')}</strong><small>${workwheelEsc(workwheelDisplayDate(activity.startDate || ''))}${activity.endDate && activity.endDate !== activity.startDate ? ` → ${workwheelEsc(workwheelDisplayDate(activity.endDate))}` : ''} · Schedule activity</small></div><button class="btn btn-sm" onclick="importScheduleWorkwheelActivity(${Number(activity.id)})">Make available</button></div>`).join('')
    : '<div class="empty-note">No additional Schedule activities are available.</div>';
  const todayOverlay = workwheelTodayMarker(range.year, range.month, range.days);
  content.innerHTML = `<div class="workwheel-page"><header class="workwheel-header"><div><h1 class="page-title">Workwheel</h1><p class="page-sub">Plan recurring activities for teams and organisational units.</p></div><div class="flex gap-2"><button class="btn btn-sm" onclick="changeWorkwheelMonth(-1)">‹</button><strong class="workwheel-period">${workwheelMonth.toLocaleDateString('en-US', { month:'long', year:'numeric' })}</strong><button class="btn btn-sm" onclick="changeWorkwheelMonth(1)">›</button><button class="btn btn-primary" onclick="openWorkwheelActivity()">Add activity</button></div></header><div class="workwheel-toolbar"><select class="plain-select" onchange="selectWorkwheel(this.value)">${workwheelState.wheels.map(item => `<option value="${workwheelEsc(item.id)}" ${item.id === workwheelSelectedId ? 'selected' : ''}>${workwheelEsc(item.name)}</option>`).join('') || '<option>No wheels</option>'}</select><label class="workwheel-zoom">Zoom <select class="plain-select" onchange="setWorkwheelZoom(this.value)">${[75,100,125,150,175,200].map(value => `<option value="${value}" ${value === workwheelZoom ? 'selected' : ''}>${value}%</option>`).join('')}</select></label><button class="btn btn-sm" onclick="addWorkwheel()">New wheel</button><button class="btn btn-sm" onclick="openWorkwheelFileSettings()">Data file</button></div>${wheel ? `<div class="workwheel-layout"><section class="card workwheel-card"><div class="workwheel-viewport"><div class="workwheel-zoom-stage" style="--workwheel-scale:${workwheelZoom / 100}"><div class="workwheel-circle" data-direction="clockwise">${workwheelRingMarkup(range.year, range.month, range.days)}${todayOverlay}${segments || '<div class="workwheel-empty-ring">Add an activity</div>'}</div></div></div><div class="workwheel-legend">${list}</div></section><aside class="card workwheel-upcoming"><h3>Upcoming</h3><p class="page-sub">Next ${appSettings.workwheelUpcomingDays || 14} days</p>${upcomingList}</aside></div>` : `<div class="card workwheel-empty"><h3>Create your first wheel</h3><p class="page-sub">${emptyWheelDescription}</p><button class="btn btn-primary" onclick="addWorkwheel()">Create wheel</button></div>`}<section class="card workwheel-library"><div class="workwheel-library-header"><div><h3>Available schedule activities</h3><p class="page-sub">Import activities already created in Schedule into the selected wheel.</p></div></div><div class="workwheel-library-list">${scheduleLibraryList}</div></section>${focusPanel}</div>`;
  const upcomingPanel = content.querySelector('.workwheel-upcoming');
  if (upcomingPanel) {
    upcomingPanel.innerHTML = `<h3>Today</h3><p class="page-sub">Today’s agenda</p>${todayList}<h3 class="workwheel-upcoming-next-heading">Next ${appSettings.workwheelUpcomingDays || 14} days</h3>${futureList}`;
  }
  content.querySelector('.workwheel-circle')?.addEventListener('click', handleWorkwheelCircleClick);
}
function selectWorkwheel(id) { workwheelSelectedId = id; renderWorkwheel(); }
function handleWorkwheelCircleClick(event) {
  const circle = event.currentTarget;
  const rect = circle.getBoundingClientRect();
  const x = event.clientX - (rect.left + rect.width / 2);
  const y = event.clientY - (rect.top + rect.height / 2);
  const radius = Math.hypot(x, y);
  const percent = radius / (Math.min(rect.width, rect.height) / 2) * 100;
  if (percent < 14 || percent > 74) return;
  let angle = Math.atan2(y, x) * 180 / Math.PI + 90;
  if (angle < 0) angle += 360;
  const hit = [...circle.querySelectorAll('.workwheel-segment[data-activity-id]')].find(segment => {
    const inner = Number(segment.dataset.segmentInner), outer = Number(segment.dataset.segmentOuter);
    if (percent < inner || percent > outer) return false;
    let start = Number(segment.dataset.segmentStart) % 360;
    if (start < 0) start += 360;
    const size = Number(segment.dataset.segmentSize);
    const end = start + size;
    return end <= 360 ? angle >= start && angle <= end : angle >= start || angle <= end - 360;
  });
  if (hit) openWorkwheelActivity(hit.dataset.activityId);
}
function changeWorkwheelMonth(offset) { workwheelMonth = new Date(workwheelMonth.getFullYear(), workwheelMonth.getMonth() + offset, 1); renderWorkwheel(); }
function addWorkwheel() {
  const name = document.getElementById('workwheel-name-input');
  const section = document.getElementById('workwheel-section-input');
  if (name) name.value = '';
  if (section) section.value = '';
  document.getElementById('workwheel-create-modal')?.classList.add('open');
  setTimeout(() => name?.focus(), 30);
}
function saveNewWorkwheel() {
  const name = document.getElementById('workwheel-name-input')?.value.trim();
  const section = document.getElementById('workwheel-section-input')?.value.trim() || name;
  if (!name) return;
  const id = `wheel-${Date.now()}`;
  workwheelState.wheels.push({ id, name, section, unitPath: section, ownerUserId: typeof hostedUser !== 'undefined' ? String(hostedUser?.id || '') : '', editorUserIds: [], color: '#3b82f6' });
  workwheelSelectedId = id;
  saveWorkwheelState();
  closeModal('workwheel-create-modal');
  renderWorkwheel();
}
function openWorkwheelActivity(id = null) {
  if (!workwheelCanEdit()) { alert('You have view-only access to this Workwheel.'); return; }
  workwheelEditingId = id;
  const activity = workwheelState.activities.find(item => item.id === id);
  const canEdit = workwheelCanEdit();
  document.getElementById('ww-activity-title').value = activity?.title || '';
  document.getElementById('ww-activity-date').value = activity?.date || workwheelLocalDate(new Date());
  document.getElementById('ww-activity-end-date').value = activity?.endDate || '';
  document.getElementById('ww-activity-start-time').value = activity?.startTime || '';
  document.getElementById('ww-activity-end-time').value = activity?.endTime || '';
  document.getElementById('ww-activity-location').value = activity?.location || '';
  const typeSelect = document.getElementById('ww-activity-type');
  const activityType = activity?.type || 'meeting';
  if (activityType && ![...typeSelect.options].some(option => option.value === activityType)) {
    const importedTypeOption = document.createElement('option');
    importedTypeOption.value = activityType;
    importedTypeOption.textContent = activityType;
    typeSelect.appendChild(importedTypeOption);
  }
  typeSelect.value = activityType;
  document.getElementById('ww-activity-recurrence').value = activity?.recurrence || 'none';
  document.getElementById('ww-activity-weekday').value = String(activity?.weekday ?? new Date(`${activity?.date || workwheelLocalDate(new Date())}T00:00:00`).getDay());
  buildWorkwheelColorPicker(activity?.color || '#2563eb');
  const responsibleMode = activity?.responsibleMode || (activity?.responsibleId ? 'internal' : activity?.responsibleName ? 'external' : 'internal');
  const modeInput = document.querySelector(`input[name="ww-responsible-mode"][value="${responsibleMode}"]`);
  if (modeInput) modeInput.checked = true;
  populateWorkwheelResponsibleOptions(activity?.responsibleId || '');
  populateWorkwheelParticipants(activity?.participantIds || []);
  document.getElementById('ww-activity-responsible').value = activity?.responsibleName || '';
  document.getElementById('ww-responsible-organization').value = activity?.responsibleOrganization || '';
  document.getElementById('ww-responsible-email').value = activity?.responsibleEmail || '';
  document.getElementById('ww-responsible-phone').value = activity?.responsiblePhone || '';
  toggleWorkwheelResponsibleMode();
  document.getElementById('ww-activity-notes').value = activity?.notes || '';
  document.getElementById('ww-activity-delete').style.display = activity ? '' : 'none';
  const publishButton = document.getElementById('ww-publish-schedule');
  if (publishButton) publishButton.style.display = activity && canEdit ? '' : 'none';
  if (publishButton) publishButton.textContent = activity?.linkedScheduleActivityId ? 'Update Schedule' : 'Publish to Schedule';
  document.getElementById('workwheel-activity-modal').classList.add('open');
  toggleWorkwheelWeekday();
  ['ww-activity-date', 'ww-activity-start-time', 'ww-activity-end-time', 'ww-activity-recurrence'].forEach(id => document.getElementById(id)?.addEventListener('input', refreshWorkwheelConflictWarning));
  refreshWorkwheelConflictWarning();
  setTimeout(() => document.getElementById('ww-activity-title')?.focus(), 30);
}
function openWorkwheelActivityForDate(date) {
  openWorkwheelActivity();
  document.getElementById('ww-activity-date').value = workwheelDate(date) || workwheelLocalDate(new Date());
}
function toggleWorkwheelWeekday() {
  const recurring = document.getElementById('ww-activity-recurrence')?.value === 'weekly';
  const row = document.getElementById('ww-weekday-row');
  if (row) row.style.display = recurring ? '' : 'none';
}
function saveWorkwheelActivity() {
  if (!workwheelCanEdit()) { alert('You have view-only access to this Workwheel.'); return; }
  const title = document.getElementById('ww-activity-title').value.trim();
  const date = document.getElementById('ww-activity-date').value;
  if (!title || !workwheelDate(date)) return alert('Enter a title and valid date.');
  const endDateInput = document.getElementById('ww-activity-end-date').value;
  const endDate = endDateInput || date;
  const startTime = document.getElementById('ww-activity-start-time').value;
  const endTime = document.getElementById('ww-activity-end-time').value;
  if ((startTime && !endTime) || (!startTime && endTime)) return alert('Enter both a start time and an end time, or leave both blank for an all-day activity.');
  if (startTime && endDate === date && endTime <= startTime) return alert('End time must be later than the start time.');
  if (!workwheelDate(endDate) || endDate < date) return alert('End date must be the same as or later than the start date.');
  const activity = workwheelState.activities.find(item => item.id === workwheelEditingId) || { id: `workwheel-activity-${Date.now()}`, color: '#3b82f6', status: 'planned' };
  const recurrence = document.getElementById('ww-activity-recurrence').value;
  const responsibleMode = document.querySelector('input[name="ww-responsible-mode"]:checked')?.value || 'internal';
  const responsibleName = document.getElementById('ww-activity-responsible').value.trim();
  if (responsibleMode === 'external' && !responsibleName) return alert('Enter the external responsible person’s name.');
  const participantIds = [...document.querySelectorAll('#ww-activity-participants input:checked')].map(input => Number(input.value)).filter(Number.isFinite);
  Object.assign(activity, { title, wheelId: workwheelSelectedId, participantIds, date, endDate: recurrence === 'none' ? endDate : workwheelGridLookaheadEnd(), time: startTime && endTime ? `${startTime.replace(':','')}-${endTime.replace(':','')}` : '', startTime, endTime, location: document.getElementById('ww-activity-location').value.trim(), type: document.getElementById('ww-activity-type').value, recurrence, weekday: recurrence === 'weekly' ? Number(document.getElementById('ww-activity-weekday').value) : new Date(`${date}T00:00:00`).getDay(), color: document.getElementById('ww-activity-color').value || '#3b82f6', responsibleMode, responsibleId: responsibleMode === 'internal' ? document.getElementById('ww-activity-responsible-id').value : '', responsibleName: responsibleMode === 'external' ? responsibleName : '', responsibleOrganization: responsibleMode === 'external' ? document.getElementById('ww-responsible-organization').value.trim() : '', responsibleEmail: responsibleMode === 'external' ? document.getElementById('ww-responsible-email').value.trim() : '', responsiblePhone: responsibleMode === 'external' ? document.getElementById('ww-responsible-phone').value.trim() : '', notes: document.getElementById('ww-activity-notes').value.trim() });
  if (!workwheelEditingId) workwheelState.activities.push(activity);
  saveWorkwheelState();
  closeModal('workwheel-activity-modal');
  renderWorkwheel();
}
async function publishCurrentWorkwheelActivity() {
  if (!workwheelEditingId) { alert('Save the Workwheel activity before publishing it to Schedule.'); return; }
  const conflicts = await checkWorkwheelConflicts();
  if (conflicts.length && !confirm(`Potential conflicts found:\n\n${conflicts.map(item => `${item.title} · ${item.date} · ${item.time}`).join('\n')}\n\nPublish anyway?`)) return;
  const response = await fetch('/api/workwheel/publish-to-schedule', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ workwheelActivityId: workwheelEditingId }) });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) { alert(result.error || 'Could not publish the activity to Schedule.'); return; }
  const activity = workwheelState.activities.find(item => item.id === workwheelEditingId);
  if (activity) activity.linkedScheduleActivityId = result.scheduleActivity.id;
  saveWorkwheelState();
  showToast('Activity published to Schedule.', 3500);
  closeModal('workwheel-activity-modal');
  renderWorkwheel();
}
async function publishCurrentWorkwheelActivityId(id) {
  workwheelEditingId = id;
  await publishCurrentWorkwheelActivity();
}
function deleteWorkwheelActivity(id) {
  const activity = workwheelState.activities.find(item => item.id === id);
  if (!activity) return;
  workwheelState.activities = workwheelState.activities.filter(item => item.id !== id);
  saveWorkwheelState();
  workwheelEditingId = null;
  closeModal('workwheel-activity-modal');
  renderWorkwheel();
}
function confirmDeleteWorkwheelActivity(id = workwheelEditingId) {
  if (!workwheelCanEdit()) { alert('You have view-only access to this Workwheel.'); return; }
  const activity = workwheelState.activities.find(item => item.id === id);
  if (!activity) return;
  if (confirm(`Delete "${activity.title}" and all of its recurring occurrences?`)) deleteWorkwheelActivity(id);
}
function openWorkwheelActivityTemplate() {
  document.getElementById('ww-template-title').value = '';
  document.getElementById('ww-template-type').value = 'meeting';
  document.getElementById('ww-template-color').value = '#3b82f6';
  document.getElementById('workwheel-template-modal').classList.add('open');
  setTimeout(() => document.getElementById('ww-template-title')?.focus(), 30);
}
function saveWorkwheelActivityTemplate() {
  const title = document.getElementById('ww-template-title').value.trim();
  if (!title) return;
  workwheelState.availableActivities.push({ id: `workwheel-template-${Date.now()}`, title, type: document.getElementById('ww-template-type').value, color: document.getElementById('ww-template-color').value || '#3b82f6', recurrence: 'none', date: '', wheelId: '' });
  saveWorkwheelState();
  closeModal('workwheel-template-modal');
  renderWorkwheel();
}
function importAvailableWorkwheelActivity(templateId) {
  const template = workwheelState.availableActivities.find(activity => activity.id === templateId);
  if (!template || !workwheelSelectedId) return;
  const date = workwheelLocalDate(new Date());
  const activity = { ...template, id: `workwheel-activity-${Date.now()}`, wheelId: workwheelSelectedId, date, recurrence: 'none', weekday: new Date(`${date}T00:00:00`).getDay(), status: 'planned' };
  workwheelState.activities.push(activity);
  saveWorkwheelState();
  renderWorkwheel();
}
function importScheduleWorkwheelActivity(activityId) {
  const source = typeof activities !== 'undefined' ? activities.find(activity => Number(activity.id) === Number(activityId)) : null;
  if (!source || !workwheelSelectedId) return;
  const scheduleType = typeof activityTypeMeta === 'function' ? activityTypeMeta(source) : null;
  const scheduleColor = scheduleType?.color || source.color || '#3b82f6';
  const existing = workwheelState.activities.find(activity => activity.sourceActivityId === Number(source.id) && activity.wheelId === workwheelSelectedId);
  const imported = {
    id: existing?.id || `workwheel-schedule-${source.id}-${Date.now()}`,
    sourceActivityId: Number(source.id),
    wheelId: workwheelSelectedId,
    title: String(source.name || 'Schedule activity'),
    type: scheduleType?.name || scheduleType?.label || source.type || 'Schedule activity',
    date: workwheelDate(source.startDate) || workwheelLocalDate(new Date()),
    endDate: workwheelDate(source.endDate),
    time: String(source.time || ''),
    responsibleName: '',
    notes: 'Imported from Schedule',
    color: /^#[\da-fA-F]{6}$/.test(scheduleColor) ? scheduleColor : '#3b82f6',
    status: source.status === 'cancelled' ? 'cancelled' : 'planned',
    recurrence: 'none',
    weekday: new Date(`${source.startDate}T00:00:00`).getDay(),
  };
  if (existing) Object.assign(existing, imported);
  else workwheelState.activities.push(imported);
  saveWorkwheelState();
  renderWorkwheel();
}
function openWorkwheelFileSettings() { if (typeof openSettingsChild === 'function') openSettingsChild('workwheel-file-modal', 'settings-modal'); else document.getElementById('workwheel-file-modal').classList.add('open'); document.getElementById('workwheel-file-status').textContent = `Loaded ${workwheelState.activities.length} activities in ${workwheelState.wheels.length} wheels.`; }
function importWorkwheelFile() { document.getElementById('workwheel-json-file').click(); }
function handleWorkwheelFile(event) { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => { try { workwheelState = workwheelNormalize(JSON.parse(reader.result)); workwheelSelectedId = workwheelState.wheels[0]?.id || ''; saveWorkwheelState(); renderWorkwheel(); document.getElementById('workwheel-file-modal').classList.remove('open'); } catch (error) { alert('The Workwheel JSON file could not be read.'); } }; reader.readAsText(file); }
function saveWorkwheelFileAs() { const blob = new Blob([JSON.stringify(workwheelState, null, 2)], { type: 'application/json' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'workwheel.json'; link.click(); URL.revokeObjectURL(link.href); }
function loadWorkwheelExample() { alert('Example Workwheel data has been removed. Create a wheel manually for your own team or organisation.'); }
loadWorkwheelState();
loadWorkwheelView();
