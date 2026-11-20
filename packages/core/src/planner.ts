export type LocalDate = string;
export type LocalTimeRange = string;

export interface PlannerEmployee {
  readonly id: number;
  readonly name: string;
  readonly email: string;
  readonly role: string;
  readonly organisation: string;
  readonly department: string;
  readonly section: string;
  readonly process: string;
  readonly team: string;
  readonly level: string;
  readonly birthday: LocalDate | '';
  readonly homeAddress: string;
  readonly phoneWork: string;
  readonly phonePrivate: string;
  readonly sortOrder: number;
  readonly categoryIds: readonly number[];
  readonly includeInShiftRotation: boolean;
  readonly shiftTeamId: string;
}

export interface PlannerActivity {
  readonly id: number;
  readonly name: string;
  readonly abbreviation: string;
  readonly startDate: LocalDate;
  readonly endDate: LocalDate;
  readonly color: string;
  readonly status: 'tentative' | 'confirmed' | 'cancelled';
  readonly participants: readonly { readonly id: number }[];
  readonly [key: string]: unknown;
}

export interface DailyStatusDefinition {
  readonly id: number;
  readonly key: string;
  readonly label: string;
  readonly abbr: string;
  readonly color: string;
  readonly isAbsence: boolean;
  readonly isOutOfOffice: boolean;
  readonly requiresApproval?: boolean;
}

export interface DailyEntry {
  readonly status: string;
  readonly lifecycle?: 'confirmed' | 'planned';
  readonly durationType?: 'fullday' | '24hours' | 'time';
  readonly time?: LocalTimeRange | null;
  readonly workCodeId?: string | null;
}

export interface PlannerMeeting {
  readonly id: string;
  readonly title: string;
  readonly typeId: string;
  readonly date: LocalDate;
  readonly endDate: LocalDate | '';
  readonly startTime: string;
  readonly endTime: string;
  readonly allDay: boolean;
  readonly location: string;
  readonly notes: string;
  readonly status: 'planned' | 'confirmed' | 'cancelled';
  readonly showInEmployeeGrid: boolean;
  readonly participantIds: readonly number[];
  readonly responsibleId: number | null;
  readonly externalAttendees: string;
  readonly recurrence: 'none' | 'daily' | 'weekly' | 'fortnightly' | 'monthly';
  readonly weekday: number;
  readonly color: string;
}

export interface PlannerDocument {
  readonly appVersion: string;
  readonly dataVersion: number;
  readonly version: number;
  readonly savedAt: string;
  readonly dailyStatusesSeparated: true;
  readonly appSettings: Readonly<Record<string, unknown>>;
  readonly employees: readonly PlannerEmployee[];
  readonly categories: readonly Readonly<Record<string, unknown>>[];
  readonly statuses: readonly DailyStatusDefinition[];
  readonly activities: readonly PlannerActivity[];
  readonly meetings: readonly PlannerMeeting[];
  readonly meetingTypes: readonly { readonly id: string; readonly name: string; readonly color: string }[];
  readonly entriesMap: Readonly<Record<string, DailyEntry | string | null>>;
  readonly [key: string]: unknown;
}

export interface RevisionedPlannerDocument {
  readonly revision: number;
  readonly document: PlannerDocument;
}

export function createBlankPlannerDocument(now = new Date().toISOString()): PlannerDocument {
  return {
    appVersion: 'hosted-0.1.0',
    dataVersion: 9,
    version: 9,
    savedAt: now,
    dailyStatusesSeparated: true,
    appSettings: { appName: 'ATLAS' },
    employees: [],
    categories: [],
    statuses: [],
    activities: [],
    meetings: [],
    meetingTypes: [
      { id: 'meeting', name: 'Meeting', color: '#2563eb' },
      { id: 'briefing', name: 'Briefing', color: '#0f766e' },
      { id: 'orientation', name: 'Orientation', color: '#7c3aed' },
      { id: 'other', name: 'Other', color: '#64748b' },
    ],
    entriesMap: {},
    activityShiftsMap: {},
    shiftRotationMap: {},
    overtimeMap: {},
    cellNotesMap: {},
    workScheduleChecksMap: {},
    courses: [],
    courseStatuses: {},
    requirements: [],
    requirementRecords: {},
    nextEmpId: 1,
    nextActId: 1,
    nextStatusId: 1,
    nextCatId: 1,
  };
}

function normalizeMeetings(value: unknown, typeDefinitions: Array<{ id: string; name: string; color: string }>): PlannerMeeting[] {
  if (!Array.isArray(value)) return [];
  const types = new Map(typeDefinitions.map(type => [type.id, type.color]));
  const seen = new Set<string>();
  return value.map((entry, index) => {
    const item = isRecord(entry) ? entry : {};
    const id = String(item.id ?? `meeting-${index + 1}`).trim().slice(0, 80);
    const title = String(item.title ?? '').trim().slice(0, 120);
    const date = String(item.date ?? '');
    const recurrence = ['none', 'daily', 'weekly', 'fortnightly', 'monthly'].includes(String(item.recurrence)) ? String(item.recurrence) as PlannerMeeting['recurrence'] : 'none';
    if (!id || !title || !validDate(date) || seen.has(id)) return null;
    seen.add(id);
    const rawAttendees = item.externalAttendees ?? item.attendees;
    return {
      id, title, typeId: String(item.typeId ?? 'meeting').slice(0, 64), date,
      endDate: recurrence === 'none' ? (validDate(item.endDate) && String(item.endDate) >= date ? String(item.endDate) : date) : (validDate(item.endDate) && String(item.endDate) > date ? String(item.endDate) : ''),
      startTime: String(item.startTime ?? '').slice(0, 5), endTime: String(item.endTime ?? '').slice(0, 5),
      allDay: item.allDay === true, location: String(item.location ?? '').trim().slice(0, 160), notes: String(item.notes ?? '').trim().slice(0, 1000),
      status: ['planned', 'confirmed', 'cancelled'].includes(String(item.status)) ? String(item.status) as PlannerMeeting['status'] : 'planned',
      showInEmployeeGrid: item.showInEmployeeGrid !== false,
      participantIds: Array.isArray(item.participantIds) ? [...new Set(item.participantIds.map(Number).filter(Number.isFinite))] : [],
      responsibleId: Number.isFinite(Number(item.responsibleId)) ? Number(item.responsibleId) : null,
      externalAttendees: Array.isArray(rawAttendees) ? rawAttendees.map(attendee => typeof attendee === 'string' ? attendee : isRecord(attendee) ? attendee.name : '').filter(Boolean).join(', ').slice(0, 500) : String(rawAttendees ?? '').trim().slice(0, 500),
      recurrence, weekday: Number.isInteger(Number(item.weekday)) ? Number(item.weekday) : new Date(`${date}T00:00:00`).getDay(),
      color: types.get(String(item.typeId ?? '')) || (validColor(item.color) ? String(item.color) : '#2563eb'),
    };
  }).filter(item => item !== null);
}

function normalizeMeetingTypes(value: unknown): Array<{ id: string; name: string; color: string }> {
  const defaults = [
    { id: 'meeting', name: 'Meeting', color: '#2563eb' },
    { id: 'briefing', name: 'Briefing', color: '#0f766e' },
    { id: 'orientation', name: 'Orientation', color: '#7c3aed' },
    { id: 'other', name: 'Other', color: '#64748b' },
  ];
  if (!Array.isArray(value)) return defaults;
  const seen = new Set<string>();
  const result = value.map((entry, index) => {
    const item = isRecord(entry) ? entry : {};
    const id = String(item.id ?? `meeting-type-${index + 1}`).trim().slice(0, 64);
    const name = String(item.name ?? '').trim().slice(0, 48);
    const color = validColor(item.color) ? String(item.color) : '#64748b';
    if (!id || !name || seen.has(id)) return null;
    seen.add(id);
    return { id, name, color };
  }).filter((item): item is { id: string; name: string; color: string } => item !== null);
  return result.length ? result : defaults;
}

export function normalizeLegacyPlannerDocument(input: unknown): PlannerDocument {
  if (!isRecord(input)) throw new Error('Planner JSON must be an object.');
  const employees = Array.isArray(input.employees) ? input.employees.map(normalizeEmployee) : [];
  const activities = Array.isArray(input.activities) ? input.activities.map(normalizeActivity) : [];
  const statuses = Array.isArray(input.statuses) ? input.statuses.map(normalizeStatus) : [];
  const meetingTypes = normalizeMeetingTypes(input.meetingTypes);
  const meetings = normalizeMeetings(input.meetings, meetingTypes);
  const now = new Date().toISOString();
  return {
    ...input,
    appVersion: String(input.appVersion ?? 'legacy'),
    dataVersion: Number(input.dataVersion ?? input.version ?? 9),
    version: Number(input.version ?? input.dataVersion ?? 9),
    savedAt: typeof input.savedAt === 'string' ? input.savedAt : now,
    dailyStatusesSeparated: true,
    appSettings: isRecord(input.appSettings) ? input.appSettings : { appName: 'ATLAS' },
    employees,
    categories: Array.isArray(input.categories) ? input.categories.filter(isRecord) : [],
    statuses,
    activities,
    meetings,
    meetingTypes,
    entriesMap: isRecord(input.entriesMap) ? input.entriesMap as Record<string, DailyEntry | string | null> : {},
  };
}

function normalizeEmployee(value: unknown, index: number): PlannerEmployee {
  const item = isRecord(value) ? value : {};
  return {
    id: finiteNumber(item.id, index + 1),
    name: String(item.name ?? '').trim(),
    email: String(item.email ?? '').trim(),
    role: String(item.role ?? '').trim(),
    organisation: String(item.organisation ?? item.organization ?? '').trim(),
    department: String(item.department ?? '').trim(),
    section: String(item.section ?? item.subdepartment ?? '').trim(),
    process: String(item.process ?? '').trim(),
    team: String(item.team ?? '').trim(),
    level: String(item.level ?? '').trim(),
    birthday: validDate(item.birthday) ? String(item.birthday) : '',
    homeAddress: String(item.homeAddress ?? '').trim(),
    phoneWork: String(item.phoneWork ?? '').trim(),
    phonePrivate: String(item.phonePrivate ?? '').trim(),
    sortOrder: finiteNumber(item.sortOrder, (index + 1) * 10),
    categoryIds: Array.isArray(item.categoryIds) ? item.categoryIds.map(Number).filter(Number.isFinite) : [],
    includeInShiftRotation: item.includeInShiftRotation === true,
    shiftTeamId: String(item.shiftTeamId ?? '').trim(),
  };
}

function normalizeActivity(value: unknown, index: number): PlannerActivity {
  const item = isRecord(value) ? value : {};
  return {
    ...item,
    id: finiteNumber(item.id, index + 1),
    name: String(item.name ?? 'Activity').trim(),
    abbreviation: String(item.abbreviation ?? '').trim().toUpperCase().slice(0, 6),
    startDate: validDate(item.startDate) ? String(item.startDate) : '',
    endDate: validDate(item.endDate) ? String(item.endDate) : '',
    color: validColor(item.color) ? String(item.color) : '#3b82f6',
    status: ['tentative', 'confirmed', 'cancelled'].includes(String(item.status))
      ? item.status as PlannerActivity['status'] : 'tentative',
    participants: Array.isArray(item.participants)
      ? item.participants.filter(isRecord).map((participant) => ({ id: Number(participant.id) })).filter(({ id }) => Number.isFinite(id))
      : [],
  };
}

function normalizeStatus(value: unknown, index: number): DailyStatusDefinition {
  const item = isRecord(value) ? value : {};
  const key = String(item.key ?? `status-${index + 1}`).trim();
  return {
    id: finiteNumber(item.id, index + 1), key,
    label: String(item.label ?? key).trim(),
    abbr: String(item.abbr ?? '?').trim().slice(0, 3),
    color: validColor(item.color) ? String(item.color) : '#64748b',
    isAbsence: item.isAbsence === true,
    isOutOfOffice: item.isOutOfOffice === true,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function finiteNumber(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function validDate(value: unknown): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value ?? ''));
}

function validColor(value: unknown): boolean {
  return /^#[\da-fA-F]{6}$/.test(String(value ?? ''));
}