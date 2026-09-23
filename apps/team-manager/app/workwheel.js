'use strict';

// Workwheel prototype: intentionally independent from the main planner JSON.
const WORKWHEEL_STORAGE_KEY = 'team-manager-workwheel-state';
const WORKWHEEL_FILE_META_KEY = 'team-manager-workwheel-file-meta';
let workwheelState = { version: 1, wheels: [], activities: [], availableActivities: [] };
let workwheelSelectedId = '';
let workwheelMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
let workwheelEditingId = null;

function workwheelEsc(value) { return typeof esc === 'function' ? esc(value) : String(value ?? '').replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch])); }
function workwheelDate(value) { return /^\d{4}-\d{2}-\d{2}$/.test(String(value)) ? String(value) : ''; }
function workwheelLocalDate(date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
function workwheelDisplayDate(value) { const date = workwheelDate(value); return date ? `${date.slice(8, 10)}.${date.slice(5, 7)}.${date.slice(0, 4)}` : ''; }
function workwheelNormalize(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const wheels = Array.isArray(source.wheels) ? source.wheels.map((wheel, index) => ({
    id: String(wheel.id || `wheel-${index + 1}`), name: String(wheel.name || `Section ${index + 1}`).trim(), section: String(wheel.section || wheel.name || '').trim(), color: /^#[\da-fA-F]{6}$/.test(wheel.color) ? wheel.color : '#3b82f6'
  })).filter(wheel => wheel.name) : [];
  const wheelIds = new Set(wheels.map(wheel => wheel.id));
  const normalizeActivity = (activity, index, library = false) => ({
    id: String(activity.id || `workwheel-activity-${index + 1}`), sourceActivityId: activity.sourceActivityId == null ? null : Number(activity.sourceActivityId), wheelId: wheelIds.has(String(activity.wheelId)) ? String(activity.wheelId) : (wheels[0]?.id || ''), title: String(activity.title || 'Activity').trim(), type: String(activity.type || 'meeting'), date: workwheelDate(activity.date), time: String(activity.time || '').trim(), responsibleId: String(activity.responsibleId || ''), responsibleName: String(activity.responsibleName || '').trim(), notes: String(activity.notes || '').trim(), color: /^#[\da-fA-F]{6}$/.test(activity.color) ? activity.color : '#3b82f6', status: ['planned', 'confirmed', 'cancelled'].includes(activity.status) ? activity.status : 'planned', recurrence: ['none', 'daily', 'weekly', 'fortnightly', 'monthly'].includes(activity.recurrence) ? activity.recurrence : 'none', weekday: Number.isInteger(Number(activity.weekday)) ? Number(activity.weekday) : new Date(`${activity.date}T00:00:00`).getDay(), endDate: workwheelDate(activity.endDate)
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
  const status = document.getElementById('workwheel-file-status');
  if (status) status.textContent = 'Browser recovery updated. Use Export JSON to create a portable file.';
}
function workwheelResponsible(activity) {
  const employee = typeof empById === 'function' && activity.responsibleId ? empById(Number(activity.responsibleId)) : null;
  return employee?.name || activity.responsibleName || 'Unassigned';
}
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
function workwheelMonthDates() { const y = workwheelMonth.getFullYear(), m = workwheelMonth.getMonth(); return { year: y, month: m, from: `${y}-${String(m + 1).padStart(2, '0')}-01`, to: `${y}-${String(m + 1).padStart(2, '0')}-${String(new Date(y, m + 1, 0).getDate()).padStart(2, '0')}`, days: new Date(y, m + 1, 0).getDate() }; }
function workwheelDayOfMonth(date) { return new Date(`${date}T00:00:00`).getDate(); }
function workwheelIsoWeek(date) { const value = new Date(`${date}T00:00:00`); value.setHours(0, 0, 0, 0); value.setDate(value.getDate() + 3 - ((value.getDay() + 6) % 7)); const week1 = new Date(value.getFullYear(), 0, 4); return 1 + Math.round(((value - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7); }
function workwheelWeekKey(date) { const value = new Date(`${date}T00:00:00`); value.setDate(value.getDate() - ((value.getDay() + 6) % 7)); return workwheelLocalDate(value); }
function workwheelReferenceDay(year, month, days) {
  const today = new Date();
  return today.getFullYear() === year && today.getMonth() === month ? today.getDate() : 1;
}
function workwheelAngleForDate(date, year, month, days) {
  const dayAngle = ((workwheelDayOfMonth(date) - 0.5) / days) * 360 - 90;
  const referenceAngle = ((workwheelReferenceDay(year, month, days) - 0.5) / days) * 360 - 90;
  // Positive CSS rotation moves clockwise. With Today fixed at north, later
  // calendar dates must therefore use positive angular offsets.
  return dayAngle - referenceAngle;
}
function workwheelDateSectorStart(date, year, month, days) {
  return workwheelAngleForDate(date, year, month, days) - (360 / days) / 2;
}
function workwheelTodayMarker(year, month, days) {
  const today = new Date();
  if (today.getFullYear() !== year || today.getMonth() !== month) return '';
  const date = workwheelLocalDate(today);
  return `<div class="workwheel-today-marker" title="Today: ${workwheelEsc(workwheelDisplayDate(date))}"><span>Today</span></div>`;
}
function workwheelRingMarkup(year, month, days) {
  const dates = Array.from({ length: days }, (_, index) => `${year}-${String(month + 1).padStart(2, '0')}-${String(index + 1).padStart(2, '0')}`);
  const monthTransitionStart = workwheelDateSectorStart(dates[0], year, month, days);
  const monthTransitionSize = Math.min(360 / days * 3, 36);
  const nextMonthName = new Date(year, month + 1, 1).toLocaleDateString('en-US', { month:'short' }).toUpperCase();
  const weeks = [];
  const weekBoundaries = [];
  let startIndex = 0;
  while (startIndex < dates.length) {
    const weekKey = workwheelWeekKey(dates[startIndex]);
    let endIndex = startIndex;
    while (endIndex + 1 < dates.length && workwheelWeekKey(dates[endIndex + 1]) === weekKey) endIndex++;
    const startAngle = workwheelDateSectorStart(dates[startIndex], year, month, days);
    const span = (endIndex - startIndex + 1) * (360 / days);
    const weekNumber = workwheelIsoWeek(dates[startIndex]);
    weeks.push(`<i class="workwheel-week-band" style="--week-start:${startAngle}deg;--week-size:${Math.min(359, span)}deg" title="ISO week ${weekNumber}"></i><span class="workwheel-week-label" style="--ring-angle:${workwheelAngleForDate(dates[startIndex], year, month, days)}deg">W${weekNumber}</span>`);
    weekBoundaries.push(`<i class="workwheel-week-boundary" style="--sector-angle:${startAngle}deg" title="Start of ISO week ${weekNumber}"></i>`);
    startIndex = endIndex + 1;
  }
  const weekMarkup = weeks.join('');
  const dayLabels = dates.map((date, index) => { const day = index + 1; const angle = workwheelAngleForDate(date, year, month, days); const weekday = new Date(`${date}T00:00:00`).toLocaleDateString('en-GB', { weekday: 'short' }); const weekend = [0, 6].includes(new Date(`${date}T00:00:00`).getDay()); return `<span class="workwheel-day-label${weekend ? ' weekend' : ''}" style="--ring-angle:${angle}deg" title="${weekday} ${workwheelDisplayDate(date)}"><b>${day}</b><small>${weekday}</small></span>`; }).join('');
  const daySectors = dates.map(date => `<i class="workwheel-day-sector" style="--sector-angle:${workwheelDateSectorStart(date, year, month, days)}deg"></i>`).join('');
  return `<div class="workwheel-ring workwheel-days-ring"><i class="workwheel-month-transition" style="--transition-start:${monthTransitionStart}deg;--transition-size:${monthTransitionSize}deg" title="Next month: ${workwheelEsc(nextMonthName)}"></i>${daySectors}${dayLabels}<span class="workwheel-month-transition-label" style="--ring-angle:${monthTransitionStart + monthTransitionSize / 2 - 90}deg">${workwheelEsc(nextMonthName)}</span></div><div class="workwheel-week-spokes">${weekBoundaries.join('')}</div><div class="workwheel-ring workwheel-weeks-ring">${weekMarkup}</div><div class="workwheel-month-label">${new Date(year, month, 1).toLocaleDateString('en-US', { month:'long', year:'numeric' })}</div>`;
}
function renderWorkwheel() {
  if (typeof appSettings === 'undefined' || appSettings.workwheelEnabled !== true) { nav('grid'); return; }
  loadWorkwheelState();
  const content = document.getElementById('content');
  const range = workwheelMonthDates();
  const wheel = workwheelState.wheels.find(item => item.id === workwheelSelectedId);
  const wheelActivities = wheel ? workwheelState.activities.filter(item => item.wheelId === wheel.id).flatMap(item => workwheelOccurrences(item, range.from, range.to)) : [];
  const upcomingTo = new Date(); upcomingTo.setDate(upcomingTo.getDate() + (appSettings.workwheelUpcomingDays || 14));
  const upcomingDate = workwheelLocalDate(upcomingTo);
  const todayDate = workwheelLocalDate(new Date());
  const upcoming = workwheelState.activities.filter(item => !wheel || item.wheelId === wheel.id).flatMap(item => workwheelOccurrences(item, todayDate, upcomingDate)).filter(item => item.status !== 'cancelled').sort((a, b) => a.occurrenceDate.localeCompare(b.occurrenceDate) || a.time.localeCompare(b.time));
  const todayUpcoming = upcoming.filter(item => item.occurrenceDate === todayDate);
  const futureUpcoming = upcoming.filter(item => item.occurrenceDate > todayDate);
  const daySectorSize = 360 / range.days;
  const segmentItems = wheelActivities.map(activity => {
    const activityEnd = workwheelDate(activity.endDate) && activity.endDate >= activity.occurrenceDate ? activity.endDate : activity.occurrenceDate;
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
    return `<div class="workwheel-segment${item.long ? ' workwheel-segment-long' : ''}" style="${segmentStyle}" title="${segmentTitle}"></div><button type="button" class="workwheel-segment-hit${item.long ? ' workwheel-segment-long' : ''}" data-activity-id="${workwheelEsc(activity.id)}" style="${segmentStyle}" title="Open ${workwheelEsc(activity.title)}" aria-label="Open ${workwheelEsc(activity.title)} on ${workwheelEsc(workwheelDisplayDate(activity.occurrenceDate))}" onclick="event.stopPropagation();openWorkwheelActivity('${workwheelEsc(activity.id)}')"></button><span class="workwheel-segment-label" style="${labelStyle}">${segmentLabel}</span>`;
  }).join('');
  const legendActivities = [...new Map(wheelActivities.map(activity => [activity.id, activity])).values()];
  const list = legendActivities.map(activity => `<div class="workwheel-activity-row"><span class="workwheel-dot" style="background:${workwheelEsc(activity.color)}"></span><div><strong style="color:${workwheelEsc(activity.color)}">${workwheelEsc(activity.title)}</strong><small>${workwheelEsc(workwheelDisplayDate(activity.occurrenceDate))}${activity.time ? ` · ${workwheelEsc(activity.time)}` : ''}${workwheelRecurrenceLabel(activity.recurrence) ? ` · ${workwheelRecurrenceLabel(activity.recurrence)}` : ''} · ${workwheelEsc(workwheelResponsible(activity))}</small></div><button class="icon-btn" onclick="openWorkwheelActivity('${workwheelEsc(activity.id)}')">Edit</button><button class="icon-btn danger" title="Delete activity" onclick="confirmDeleteWorkwheelActivity('${workwheelEsc(activity.id)}')">Delete</button></div>`).join('') || '<div class="empty-note">No activities in this period.</div>';
  const upcomingItem = activity => `<div class="workwheel-upcoming-item"><b>${workwheelEsc(activity.title)}</b><span>${workwheelEsc(workwheelDisplayDate(activity.occurrenceDate))}${activity.time ? ` · ${workwheelEsc(activity.time)}` : ''}</span><small>${workwheelEsc(activity.type)}${workwheelRecurrenceLabel(activity.recurrence) ? ` · ${workwheelRecurrenceLabel(activity.recurrence)}` : ''} · ${workwheelEsc(workwheelResponsible(activity))}</small></div>`;
  const todayList = todayUpcoming.map(upcomingItem).join('') || '<div class="empty-note">No events today.</div>';
  const futureList = futureUpcoming.slice(0, 12).map(upcomingItem).join('') || '<div class="empty-note">Nothing upcoming.</div>';
  // Keep the initial template compatible; the panel is replaced with the two
  // explicit agenda sections immediately after rendering.
  const upcomingList = futureList;
  const scheduleLibraryList = typeof activities !== 'undefined' && activities.length
    ? activities.slice().sort((a, b) => String(a.startDate || '').localeCompare(String(b.startDate || ''))).map(activity => `<div class="workwheel-library-item"><span class="workwheel-dot" style="background:${workwheelEsc(activity.color || '#3b82f6')}"></span><div><strong>${workwheelEsc(activity.name || 'Activity')}</strong><small>${workwheelEsc(workwheelDisplayDate(activity.startDate || ''))}${activity.endDate && activity.endDate !== activity.startDate ? ` → ${workwheelEsc(workwheelDisplayDate(activity.endDate))}` : ''} · Schedule activity</small></div><button class="btn btn-sm" onclick="importScheduleWorkwheelActivity(${Number(activity.id)})">Import</button></div>`).join('')
    : '<div class="empty-note">No schedule activities available to import.</div>';
  content.innerHTML = `<div class="workwheel-page"><header class="workwheel-header"><div><h1 class="page-title">Workwheel</h1><p class="page-sub">Monthly overview with days, weeks, activities, and today’s position. Dates progress clockwise.</p></div><div class="flex gap-2"><button class="btn btn-sm" onclick="changeWorkwheelMonth(-1)">‹</button><strong class="workwheel-period">${workwheelMonth.toLocaleDateString('en-US', { month:'long', year:'numeric' })}</strong><button class="btn btn-sm" onclick="changeWorkwheelMonth(1)">›</button><button class="btn btn-primary" onclick="openWorkwheelActivity()">Add activity</button></div></header><div class="workwheel-toolbar"><select class="plain-select" onchange="selectWorkwheel(this.value)">${workwheelState.wheels.map(item => `<option value="${workwheelEsc(item.id)}" ${item.id === workwheelSelectedId ? 'selected' : ''}>${workwheelEsc(item.name)}</option>`).join('') || '<option>No wheels</option>'}</select><button class="btn btn-sm" onclick="addWorkwheel()">New wheel</button><button class="btn btn-sm" onclick="openWorkwheelFileSettings()">Data file</button></div>${wheel ? `<div class="workwheel-layout"><section class="card workwheel-card"><div class="workwheel-circle" data-direction="clockwise">${workwheelRingMarkup(range.year, range.month, range.days)}${workwheelTodayMarker(range.year, range.month, range.days)}<div class="workwheel-core"><b>${workwheelEsc(wheel.name)}</b><small>${range.year} · ${wheelActivities.length} occurrences this month</small></div>${segments || '<div class="workwheel-empty-ring">Add an activity</div>'}</div><div class="workwheel-legend">${list}</div></section><aside class="card workwheel-upcoming"><h3>Upcoming</h3><p class="page-sub">Next ${appSettings.workwheelUpcomingDays || 14} days</p>${upcomingList}</aside></div>` : `<div class="card workwheel-empty"><h3>Create your first wheel</h3><p class="page-sub">Start with a section such as JDLOC.</p><button class="btn btn-primary" onclick="addWorkwheel()">Create wheel</button></div>`}<section class="card workwheel-library"><div class="workwheel-library-header"><div><h3>Available schedule activities</h3><p class="page-sub">Import activities already created in Schedule into the selected wheel.</p></div></div><div class="workwheel-library-list">${scheduleLibraryList}</div></section></div>`;
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
  workwheelState.wheels.push({ id, name, section, color: '#3b82f6' });
  workwheelSelectedId = id;
  saveWorkwheelState();
  closeModal('workwheel-create-modal');
  renderWorkwheel();
}
function openWorkwheelActivity(id = null) {
  workwheelEditingId = id;
  const activity = workwheelState.activities.find(item => item.id === id);
  document.getElementById('ww-activity-title').value = activity?.title || '';
  document.getElementById('ww-activity-date').value = activity?.date || workwheelLocalDate(new Date());
  document.getElementById('ww-activity-time').value = activity?.time || '';
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
  document.getElementById('ww-activity-color').value = activity?.color || '#3b82f6';
  document.getElementById('ww-activity-responsible').value = activity?.responsibleName || '';
  document.getElementById('ww-activity-notes').value = activity?.notes || '';
  document.getElementById('ww-activity-delete').style.display = activity ? '' : 'none';
  document.getElementById('workwheel-activity-modal').classList.add('open');
  toggleWorkwheelWeekday();
  setTimeout(() => document.getElementById('ww-activity-title')?.focus(), 30);
}
function toggleWorkwheelWeekday() {
  const recurring = document.getElementById('ww-activity-recurrence')?.value === 'weekly';
  const row = document.getElementById('ww-weekday-row');
  if (row) row.style.display = recurring ? '' : 'none';
}
function saveWorkwheelActivity() {
  const title = document.getElementById('ww-activity-title').value.trim();
  const date = document.getElementById('ww-activity-date').value;
  if (!title || !workwheelDate(date)) return alert('Enter a title and valid date.');
  const activity = workwheelState.activities.find(item => item.id === workwheelEditingId) || { id: `workwheel-activity-${Date.now()}`, color: '#3b82f6', status: 'planned' };
  const recurrence = document.getElementById('ww-activity-recurrence').value;
  Object.assign(activity, { title, wheelId: workwheelSelectedId, date, endDate: recurrence === 'none' ? activity.endDate || '' : '', time: document.getElementById('ww-activity-time').value.trim(), type: document.getElementById('ww-activity-type').value, recurrence, weekday: recurrence === 'weekly' ? Number(document.getElementById('ww-activity-weekday').value) : new Date(`${date}T00:00:00`).getDay(), color: document.getElementById('ww-activity-color').value || '#3b82f6', responsibleName: document.getElementById('ww-activity-responsible').value.trim(), notes: document.getElementById('ww-activity-notes').value.trim() });
  if (!workwheelEditingId) workwheelState.activities.push(activity);
  saveWorkwheelState();
  closeModal('workwheel-activity-modal');
  renderWorkwheel();
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
function openWorkwheelFileSettings() { document.getElementById('workwheel-file-status').textContent = `Loaded ${workwheelState.activities.length} activities in ${workwheelState.wheels.length} wheels.`; document.getElementById('workwheel-file-modal').classList.add('open'); }
function importWorkwheelFile() { document.getElementById('workwheel-json-file').click(); }
function handleWorkwheelFile(event) { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => { try { workwheelState = workwheelNormalize(JSON.parse(reader.result)); workwheelSelectedId = workwheelState.wheels[0]?.id || ''; saveWorkwheelState(); renderWorkwheel(); document.getElementById('workwheel-file-modal').classList.remove('open'); } catch (error) { alert('The Workwheel JSON file could not be read.'); } }; reader.readAsText(file); }
function saveWorkwheelFileAs() { const blob = new Blob([JSON.stringify(workwheelState, null, 2)], { type: 'application/json' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'workwheel.json'; link.click(); URL.revokeObjectURL(link.href); }
function loadWorkwheelExample() { workwheelState = workwheelNormalize({ wheels: [{ id:'jdloc', name:'JDLOC', section:'JDLOC', color:'#2563eb' }], activities: [{ id:'example-meeting', wheelId:'jdloc', title:'JDLOC weekly meeting', date:workwheelLocalDate(new Date()), recurrence:'weekly', weekday:4, type:'meeting', responsibleName:'Responsible person', color:'#2563eb', status:'planned' }] }); workwheelSelectedId = 'jdloc'; saveWorkwheelState(); renderWorkwheel(); }
loadWorkwheelState();
