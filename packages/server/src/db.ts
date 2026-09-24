import Database from 'better-sqlite3';
import { randomBytes, randomUUID, scryptSync, timingSafeEqual, createHash } from 'node:crypto';
import { existsSync, statSync } from 'node:fs';
import {
  createBlankPlannerDocument,
  createInitialState,
  normalizeLegacyPlannerDocument,
  reduceState,
  type AtlasAction,
  type AtlasState,
  type PlannerDocument,
  type RevisionedPlannerDocument,
} from '@atlas/core';

export interface AtlasUserRecord {
  readonly id: string;
  readonly externalId: string | null;
  readonly name: string;
  readonly username?: string;
  readonly email?: string;
  readonly role: 'admin' | 'planner' | 'viewer';
}

export interface AuthUserRecord extends AtlasUserRecord {
  readonly disabled: boolean;
  readonly createdAt: string;
  readonly employeeId: number | null;
}

export interface UserPreferencesRecord {
  readonly jumpToTodayOnGridChange: boolean;
  readonly darkMode: boolean;
  readonly zoom: number;
  readonly colleagueChangeNotificationsEnabled: boolean;
  readonly colleagueChangeUserIds: readonly string[];
}

export interface InstallationSettingsRecord {
  readonly organizationType: 'process-subteams' | 'section-process-team' | 'department-section-process-team' | 'organisation-department-section-process-team';
  readonly organizationName: string;
  readonly organizationSlug: string;
  readonly multisiteEnabled: boolean;
  readonly timezone: string;
  readonly shiftRotationEnabled: boolean;
  readonly workwheelEnabled: boolean;
  readonly operationalChecksEnabled: boolean;
}

export interface DatabaseStatisticsRecord {
  readonly generatedAt: string;
  readonly storage: { readonly databaseBytes: number; readonly walBytes: number; readonly shmBytes: number; readonly totalBytes: number; readonly modifiedAt: string | null };
  readonly records: { readonly users: number; readonly personnel: number; readonly activities: number; readonly scheduleEntries: number; readonly statuses: number; readonly categories: number; readonly absenceRequests: number };
  readonly users: { readonly onlineNow: number; readonly recentlyActive: number; readonly neverActive: number; readonly disabled: number };
  readonly changes: { readonly planner24h: number; readonly planner7d: number; readonly audit24h: number; readonly audit7d: number };
  readonly health: { readonly sqliteVersion: string; readonly journalMode: string; readonly schemaVersion: number; readonly integrityCheck: string };
}

export interface WorkwheelDocumentRecord {
  readonly revision: number;
  readonly document: Readonly<Record<string, unknown>>;
  readonly updatedAt: string;
}

export interface AuthSessionRecord {
  readonly id: string;
  readonly userId: string;
  readonly name: string;
  readonly role: AtlasUserRecord['role'];
  readonly expiresAt: string;
}

export interface ResponsibilityUnitRecord {
  readonly id: string;
  readonly parentId: string | null;
  readonly kind: 'organisation' | 'department' | 'section' | 'process' | 'team';
  readonly name: string;
  readonly path: string;
}

export interface AdminResponsibilityScopeRecord {
  readonly id: string;
  readonly userId: string;
  readonly unitId: string;
  readonly includeDescendants: boolean;
  readonly unitPath: string;
}

export interface SessionRecord {
  readonly id: string;
  readonly userId: string;
  readonly tokenHash: string;
  readonly expiresAt: string;
  readonly createdAt: string;
  readonly revokedAt: string | null;
}

export interface AuditLogRecord {
  readonly id: number;
  readonly userId: string | null;
  readonly action: string;
  readonly target: string;
  readonly timestamp: string;
}

export interface PlannerChangeEventRecord {
  readonly id: number;
  readonly revision: number;
  readonly occurredAt: string;
  readonly actorUserId: string | null;
  readonly actorName: string;
  readonly eventType: string;
  readonly resourceKind: string;
  readonly resourceKey: string;
  readonly employeeId: number | null;
  readonly activityId: number | null;
  readonly date: string | null;
  readonly summary: Readonly<Record<string, unknown>>;
}

export interface OperationalCheckRecord {
  readonly id: number;
  readonly employeeId: number;
  readonly date: string;
  readonly subjectKind: 'schedule_cell' | 'absence_request';
  readonly subjectKey: string;
  readonly checkedByUserId: string;
  readonly checkedByName: string;
  readonly checkedAt: string;
  readonly revokedAt: string | null;
}

export interface AbsenceRequestRecord {
  readonly id: string;
  readonly requesterUserId: string;
  readonly employeeId: number;
  readonly statusKey: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly durationType: 'fullday' | '24hours' | 'time';
  readonly timeRange: string | null;
  readonly requestStatus: 'pending' | 'approved' | 'declined' | 'withdrawn';
  readonly createdAt: string;
  readonly decidedAt: string | null;
  readonly decidedByUserId: string | null;
}

export interface AtlasDatabase {
  close(): void;
  getJournalMode(): string;
  upsertUser(user: AtlasUserRecord): void;
  getUserById(id: string): AuthUserRecord | null;
  listUsers(): readonly AuthUserRecord[];
  listPersonnelLinks(): readonly { readonly id: number; readonly name: string; readonly organisation?: string; readonly department?: string; readonly section?: string; readonly linkedUserId: string | null }[];
  getUserPersonnelLink(userId: string): number | null;
  setUserPersonnelLink(userId: string, employeeId: number | null, linkedByUserId: string): void;
  syncResponsibilityUnits(units: readonly ResponsibilityUnitRecord[]): void;
  listResponsibilityUnits(): readonly ResponsibilityUnitRecord[];
  listAdminResponsibilityScopes(userId?: string): readonly AdminResponsibilityScopeRecord[];
  setAdminResponsibilityScope(userId: string, unitPath: string, includeDescendants: boolean, grantedByUserId: string): AdminResponsibilityScopeRecord;
  removeAdminResponsibilityScope(userId: string, scopeId: string): void;
  countAdmins(): number;
  isSetupRequired(): boolean;
  getOperationalChecksEnabled(): boolean;
  getInstallationSettings(): InstallationSettingsRecord;
  setInstallationOrganization(input: { readonly name: string; readonly slug: string; readonly multisiteEnabled: boolean }): void;
  getDatabaseStatistics(): DatabaseStatisticsRecord;
  getWorkwheel(): WorkwheelDocumentRecord;
  saveWorkwheel(document: Readonly<Record<string, unknown>>, expectedRevision: number): WorkwheelDocumentRecord;
  touchUserActivity(userId: string, login?: boolean): void;
  setOperationalChecksEnabled(enabled: boolean): void;
  createInitialAdmin(user: { readonly name: string; readonly username: string; readonly email: string; readonly password: string; readonly organizationType?: InstallationSettingsRecord['organizationType']; readonly timezone?: string; readonly shiftRotationEnabled?: boolean; readonly workwheelEnabled?: boolean; readonly operationalChecksEnabled?: boolean }): AuthUserRecord;
  verifyUserPassword(userId: string, password: string): boolean;
  createUser(user: { readonly id?: string; readonly name: string; readonly username: string; readonly email: string; readonly role: AtlasUserRecord['role']; readonly password: string }): AuthUserRecord;
  updateUser(userId: string, changes: { readonly name?: string; readonly username?: string; readonly email?: string; readonly role?: AtlasUserRecord['role']; readonly disabled?: boolean; readonly password?: string }): AuthUserRecord;
  getUserPreferences(userId: string): UserPreferencesRecord;
  updateUserPreferences(userId: string, changes: Partial<UserPreferencesRecord>): UserPreferencesRecord;
  factoryReset(): void;
  deleteUser(userId: string): void;
  createAuthSession(userId: string, token: string, expiresAt: string): void;
  getAuthSession(token: string): AuthSessionRecord | null;
  revokeAuthSession(token: string, revokedAt: string): void;
  revokeAllAuthSessions(userId: string, revokedAt: string): void;
  createSession(session: SessionRecord): void;
  revokeSession(sessionId: string, revokedAt: string): void;
  writeAuditLog(entry: Omit<AuditLogRecord, 'id' | 'timestamp'> & { readonly timestamp?: string }): void;
  listAuditLogs(limit?: number): readonly AuditLogRecord[];
  getState(): AtlasState;
  applyAction(action: AtlasAction): AtlasState;
  getPlanner(): RevisionedPlannerDocument;
  savePlanner(document: PlannerDocument, expectedRevision: number): RevisionedPlannerDocument;
  recordPlannerChangeEvents(events: readonly Omit<PlannerChangeEventRecord, 'id'>[]): void;
  listPlannerChangeEvents(limit?: number): readonly PlannerChangeEventRecord[];
  acknowledgePlannerChangeEvent(userId: string, eventId: number): void;
  unacknowledgePlannerChangeEvent(userId: string, eventId: number): void;
  listAcknowledgedPlannerEvents(userId: string): readonly number[];
  getOperationalCheck(employeeId: number, date: string, subjectKind: OperationalCheckRecord['subjectKind'], subjectKey: string): OperationalCheckRecord | null;
  setOperationalCheck(employeeId: number, date: string, subjectKind: OperationalCheckRecord['subjectKind'], subjectKey: string, userId: string): OperationalCheckRecord;
  revokeOperationalCheck(employeeId: number, date: string, subjectKind: OperationalCheckRecord['subjectKind'], subjectKey: string): void;
  listOperationalChecks(): readonly OperationalCheckRecord[];
  createAbsenceRequest(request: Omit<AbsenceRequestRecord, 'id' | 'createdAt' | 'decidedAt' | 'decidedByUserId'>): AbsenceRequestRecord;
  listAbsenceRequests(employeeId?: number): readonly AbsenceRequestRecord[];
  decideAbsenceRequest(id: string, status: 'approved' | 'declined' | 'withdrawn', decidedByUserId: string): AbsenceRequestRecord;
}

export interface DatabaseOptions {
  readonly filename?: string;
}

/**
 * The sole persistence module. Keep direct SQL and SQLite-specific behavior here
 * so another database engine can replace this adapter without touching routes.
 */
export function openDatabase(options: DatabaseOptions = {}): AtlasDatabase {
  const filename = options.filename ?? process.env.ATLAS_DB_PATH ?? 'atlas.db';
  const database = new Database(filename);

  database.pragma('journal_mode = WAL');
  database.pragma('foreign_keys = ON');
  database.pragma('busy_timeout = 5000');
  migrate(database);

  const upsertUser = database.prepare(`
    INSERT INTO users (id, external_id, name, username, email, role)
    VALUES (@id, @externalId, @name, @username, @email, @role)
    ON CONFLICT(id) DO UPDATE SET
      external_id = excluded.external_id,
      name = excluded.name,
      username = excluded.username,
      email = excluded.email,
      role = excluded.role
  `);
  const insertSession = database.prepare(`
    INSERT INTO sessions (id, user_id, token_hash, expires_at, created_at, revoked_at)
    VALUES (@id, @userId, @tokenHash, @expiresAt, @createdAt, @revokedAt)
  `);
  const revokeSession = database.prepare('UPDATE sessions SET revoked_at = ? WHERE id = ?');
  const selectUser = database.prepare(`SELECT u.id, u.external_id AS externalId, u.name, u.username, u.email, u.role, u.disabled, u.created_at AS createdAt, upl.employee_id AS employeeId FROM users u LEFT JOIN user_personnel_links upl ON upl.user_id = u.id WHERE u.id = ?`);
  const selectUsers = database.prepare(`SELECT u.id, u.external_id AS externalId, u.name, u.username, u.email, u.role, u.disabled, u.created_at AS createdAt, upl.employee_id AS employeeId FROM users u LEFT JOIN user_personnel_links upl ON upl.user_id = u.id ORDER BY u.name`);
  const selectUserLink = database.prepare(`SELECT employee_id AS employeeId FROM user_personnel_links WHERE user_id = ?`);
  const upsertUserLink = database.prepare(`INSERT INTO user_personnel_links (user_id, employee_id, linked_at, linked_by_user_id) VALUES (?, ?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET employee_id = excluded.employee_id, linked_at = excluded.linked_at, linked_by_user_id = excluded.linked_by_user_id`);
  const deleteUserLink = database.prepare(`DELETE FROM user_personnel_links WHERE user_id = ?`);
  const selectUnits = database.prepare(`SELECT id, parent_id AS parentId, kind, name, path FROM responsibility_units ORDER BY path`);
  const selectScopes = database.prepare(`SELECT s.id, s.user_id AS userId, s.unit_id AS unitId, s.include_descendants AS includeDescendants, u.path AS unitPath FROM admin_responsibility_scopes s JOIN responsibility_units u ON u.id = s.unit_id WHERE (? IS NULL OR s.user_id = ?) ORDER BY u.path`);
  const insertUnit = database.prepare(`INSERT INTO responsibility_units (id, parent_id, kind, name, path) VALUES (?, ?, ?, ?, ?) ON CONFLICT(path) DO UPDATE SET parent_id = excluded.parent_id, kind = excluded.kind, name = excluded.name`);
  const selectUnitByPath = database.prepare(`SELECT id, parent_id AS parentId, kind, name, path FROM responsibility_units WHERE path = ?`);
  const insertScope = database.prepare(`INSERT INTO admin_responsibility_scopes (id, user_id, unit_id, include_descendants, granted_by_user_id, granted_at) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(user_id, unit_id) DO UPDATE SET include_descendants = excluded.include_descendants, granted_by_user_id = excluded.granted_by_user_id, granted_at = excluded.granted_at`);
  const deleteScope = database.prepare(`DELETE FROM admin_responsibility_scopes WHERE id = ? AND user_id = ?`);
  const selectAdminCount = database.prepare(`SELECT count(*) AS count FROM users WHERE role = 'admin' AND disabled = 0`);
  const selectSetup = database.prepare(`SELECT setup_completed_at AS setupCompletedAt FROM installation_settings WHERE id = 'default'`);
  const selectChecksEnabled = database.prepare(`SELECT operational_checks_enabled AS enabled FROM installation_settings WHERE id = 'default'`);
  const insertCredential = database.prepare(`INSERT INTO local_credentials (user_id, password_hash, updated_at) VALUES (?, ?, ?)`);
  const updateCredential = database.prepare(`UPDATE local_credentials SET password_hash = ?, updated_at = ? WHERE user_id = ?`);
  const selectCredential = database.prepare(`SELECT password_hash AS passwordHash FROM local_credentials WHERE user_id = ?`);
  const selectAuthSession = database.prepare(`
    SELECT s.id, s.user_id AS userId, u.name, u.role, s.expires_at AS expiresAt
    FROM sessions s JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ? AND s.revoked_at IS NULL AND u.disabled = 0
  `);
  const insertAudit = database.prepare(`
    INSERT INTO audit_logs (user_id, action, target, timestamp)
    VALUES (@userId, @action, @target, @timestamp)
  `);
  const listAuditLogs = database.prepare(`
    SELECT id, user_id AS userId, action, target, timestamp
    FROM audit_logs
    ORDER BY id DESC
    LIMIT ?
  `);
  const selectEmployees = database.prepare('SELECT id, name, role FROM employees ORDER BY name');
  const selectActivities = database.prepare(`
    SELECT id, name, start_at AS startAt, end_at AS endAt FROM activities ORDER BY start_at
  `);
  const selectShifts = database.prepare(`
    SELECT id, employee_id AS employeeId, activity_id AS activityId,
           start_at AS startAt, end_at AS endAt
    FROM shifts ORDER BY start_at
  `);
  const upsertEmployee = database.prepare(`
    INSERT INTO employees (id, name, role) VALUES (@id, @name, @role)
    ON CONFLICT(id) DO UPDATE SET name = excluded.name, role = excluded.role
  `);
  const upsertActivity = database.prepare(`
    INSERT INTO activities (id, name, start_at, end_at) VALUES (@id, @name, @startAt, @endAt)
    ON CONFLICT(id) DO UPDATE SET name = excluded.name, start_at = excluded.start_at, end_at = excluded.end_at
  `);
  const upsertShift = database.prepare(`
    INSERT INTO shifts (id, employee_id, activity_id, start_at, end_at)
    VALUES (@id, @employeeId, @activityId, @startAt, @endAt)
    ON CONFLICT(id) DO UPDATE SET employee_id = excluded.employee_id,
      activity_id = excluded.activity_id, start_at = excluded.start_at, end_at = excluded.end_at
  `);
  const deleteUser = database.prepare('DELETE FROM users WHERE id = ?');
  const deleteEmployee = database.prepare('DELETE FROM employees WHERE id = ?');
  const deleteActivity = database.prepare('DELETE FROM activities WHERE id = ?');
  const deleteShift = database.prepare('DELETE FROM shifts WHERE id = ?');
  const selectPlanner = database.prepare('SELECT revision, document_json AS documentJson FROM planner_documents WHERE id = ?');
  const insertPlanner = database.prepare(`
    INSERT INTO planner_documents (id, schema_version, revision, document_json, updated_at)
    VALUES ('default', 1, 1, ?, ?)
  `);
  const updatePlanner = database.prepare(`
    UPDATE planner_documents
    SET revision = revision + 1, document_json = ?, updated_at = ?
    WHERE id = 'default' AND revision = ?
  `);
  const insertChangeEvent = database.prepare(`INSERT INTO planner_change_events (planner_revision, occurred_at, actor_user_id, actor_name, event_type, resource_kind, resource_key, employee_id, activity_id, date, summary_json) VALUES (@revision, @occurredAt, @actorUserId, @actorName, @eventType, @resourceKind, @resourceKey, @employeeId, @activityId, @date, @summaryJson)`);
  const selectChangeEvents = database.prepare(`SELECT id, planner_revision AS revision, occurred_at AS occurredAt, actor_user_id AS actorUserId, actor_name AS actorName, event_type AS eventType, resource_kind AS resourceKind, resource_key AS resourceKey, employee_id AS employeeId, activity_id AS activityId, date, summary_json AS summaryJson FROM planner_change_events ORDER BY id DESC LIMIT ?`);
  const insertAcknowledgement = database.prepare(`INSERT OR IGNORE INTO admin_event_acknowledgements (admin_user_id, event_id, acknowledged_at) VALUES (?, ?, ?)`);
  const deleteAcknowledgement = database.prepare(`DELETE FROM admin_event_acknowledgements WHERE admin_user_id = ? AND event_id = ?`);
  const selectAcknowledgements = database.prepare(`SELECT event_id AS eventId FROM admin_event_acknowledgements WHERE admin_user_id = ?`);
  const selectOperationalCheck = database.prepare(`SELECT c.id, c.employee_id AS employeeId, c.date, c.subject_kind AS subjectKind, c.subject_key AS subjectKey, c.checked_by_user_id AS checkedByUserId, u.name AS checkedByName, c.checked_at AS checkedAt, c.revoked_at AS revokedAt FROM operational_checks c JOIN users u ON u.id = c.checked_by_user_id WHERE c.employee_id = ? AND c.date = ? AND c.subject_kind = ? AND c.subject_key = ? AND c.revoked_at IS NULL`);
  const insertOperationalCheck = database.prepare(`INSERT INTO operational_checks (employee_id, date, subject_kind, subject_key, checked_by_user_id, checked_at) VALUES (?, ?, ?, ?, ?, ?)`);
  const revokeOperationalCheck = database.prepare(`UPDATE operational_checks SET revoked_at = ? WHERE employee_id = ? AND date = ? AND subject_kind = ? AND subject_key = ? AND revoked_at IS NULL`);
  const selectOperationalChecks = database.prepare(`SELECT c.id, c.employee_id AS employeeId, c.date, c.subject_kind AS subjectKind, c.subject_key AS subjectKey, c.checked_by_user_id AS checkedByUserId, u.name AS checkedByName, c.checked_at AS checkedAt, c.revoked_at AS revokedAt FROM operational_checks c JOIN users u ON u.id = c.checked_by_user_id WHERE c.revoked_at IS NULL ORDER BY c.id DESC`);
  const selectAbsenceRequests = database.prepare(`SELECT id, requester_user_id AS requesterUserId, employee_id AS employeeId, status_key AS statusKey, start_date AS startDate, end_date AS endDate, duration_type AS durationType, time_range AS timeRange, request_status AS requestStatus, created_at AS createdAt, decided_at AS decidedAt, decided_by_user_id AS decidedByUserId FROM absence_requests WHERE (? IS NULL OR employee_id = ?) ORDER BY created_at DESC`);

  const getState = (): AtlasState => {
    let state = createInitialState();
    for (const user of selectUsers.all() as AtlasActionUser[]) state = reduceState(state, { type: 'user.upsert', user });
    for (const employee of selectEmployees.all() as AtlasActionEmployee[]) state = reduceState(state, { type: 'employee.upsert', employee });
    for (const activity of selectActivities.all() as AtlasActionActivity[]) state = reduceState(state, { type: 'activity.upsert', activity });
    for (const shift of selectShifts.all() as AtlasActionShift[]) state = reduceState(state, { type: 'shift.upsert', shift });
    return state;
  };

  const persistAction = database.transaction((action: AtlasAction): AtlasState => {
    const nextState = reduceState(getState(), action);
    switch (action.type) {
      case 'user.upsert': upsertUser.run(action.user); break;
      case 'user.remove': deleteUser.run(action.userId); break;
      case 'employee.upsert': upsertEmployee.run(action.employee); break;
      case 'employee.remove': deleteEmployee.run(action.employeeId); break;
      case 'activity.upsert': upsertActivity.run(action.activity); break;
      case 'activity.remove': deleteActivity.run(action.activityId); break;
      case 'shift.upsert': upsertShift.run(action.shift); break;
      case 'shift.remove': deleteShift.run(action.shiftId); break;
    }
    insertAudit.run({
      userId: null,
      action: action.type,
      target: getActionTarget(action),
      timestamp: new Date().toISOString(),
    });
    return nextState;
  });

  return {
    close: () => database.close(),
    getJournalMode: () => {
      const row = database.pragma('journal_mode', { simple: true });
      return String(row).toLowerCase();
    },
    upsertUser: (user) => {
      upsertUser.run({ ...user, username: user.username ?? user.name.toLowerCase().replace(/\s+/g, '.'), email: user.email ?? `${user.username ?? user.name.toLowerCase().replace(/\s+/g, '.')}@local.invalid` });
    },
    getUserById: (id) => selectUser.get(id) as AuthUserRecord | undefined ?? null,
    listUsers: () => selectUsers.all() as AuthUserRecord[],
    listPersonnelLinks: () => [],
    getUserPersonnelLink: (userId) => (selectUserLink.get(userId) as { employeeId: number } | undefined)?.employeeId ?? null,
    setUserPersonnelLink: (userId, employeeId, linkedByUserId) => {
      if (employeeId === null) deleteUserLink.run(userId);
      else upsertUserLink.run(userId, employeeId, new Date().toISOString(), linkedByUserId);
    },
    syncResponsibilityUnits: (units) => {
      const sync = database.transaction(() => {
        for (const unit of units) {
          const existing = selectUnitByPath.get(unit.path) as { id: string } | undefined;
          insertUnit.run(existing?.id ?? unit.id, unit.parentId, unit.kind, unit.name, unit.path);
        }
      });
      sync();
    },
    listResponsibilityUnits: () => selectUnits.all() as ResponsibilityUnitRecord[],
    listAdminResponsibilityScopes: (userId) => selectScopes.all(userId ?? null, userId ?? null).map((raw) => { const row = raw as { id: string; userId: string; unitId: string; includeDescendants: number; unitPath: string }; return { id: row.id, userId: row.userId, unitId: row.unitId, includeDescendants: Boolean(row.includeDescendants), unitPath: row.unitPath }; }),
    setAdminResponsibilityScope: (userId, unitPath, includeDescendants, grantedByUserId) => {
      const unit = selectUnitByPath.get(unitPath) as ResponsibilityUnitRecord | undefined;
      if (!unit) throw new Error('RESPONSIBILITY_UNIT_NOT_FOUND');
      insertScope.run(randomUUID(), userId, unit.id, includeDescendants ? 1 : 0, grantedByUserId, new Date().toISOString());
      return { ...unit, id: unit.id, userId, unitId: unit.id, includeDescendants, unitPath: unit.path };
    },
    removeAdminResponsibilityScope: (userId, scopeId) => { deleteScope.run(scopeId, userId); },
    countAdmins: () => Number((selectAdminCount.get() as { count: number }).count),
    isSetupRequired: () => {
      const row = selectSetup.get() as { setupCompletedAt: string | null } | undefined;
      return row?.setupCompletedAt == null;
    },
    getOperationalChecksEnabled: () => Boolean((selectChecksEnabled.get() as { enabled: number } | undefined)?.enabled ?? 1),
    getInstallationSettings: () => {
      const row = database.prepare(`SELECT organization_type AS organizationType, organization_name AS organizationName, organization_slug AS organizationSlug, multisite_enabled AS multisiteEnabled, timezone, shift_rotation_enabled AS shiftRotationEnabled, workwheel_enabled AS workwheelEnabled, operational_checks_enabled AS operationalChecksEnabled FROM installation_settings WHERE id = 'default'`).get() as { organizationType?: InstallationSettingsRecord['organizationType']; organizationName?: string; organizationSlug?: string; multisiteEnabled?: number; timezone?: string; shiftRotationEnabled?: number; workwheelEnabled?: number; operationalChecksEnabled?: number } | undefined;
      return { organizationType: row?.organizationType === 'section-process-team' || row?.organizationType === 'department-section-process-team' || row?.organizationType === 'organisation-department-section-process-team' ? row.organizationType : 'process-subteams', organizationName: row?.organizationName ?? 'Organisation', organizationSlug: row?.organizationSlug ?? 'default', multisiteEnabled: Boolean(row?.multisiteEnabled), timezone: row?.timezone ?? 'UTC', shiftRotationEnabled: Boolean(row?.shiftRotationEnabled), workwheelEnabled: Boolean(row?.workwheelEnabled), operationalChecksEnabled: Boolean(row?.operationalChecksEnabled ?? 1) };
    },
    setInstallationOrganization: ({ name, slug, multisiteEnabled }) => { database.prepare(`UPDATE installation_settings SET organization_name = ?, organization_slug = ?, multisite_enabled = ? WHERE id = 'default'`).run(name.trim(), slug.trim().toLowerCase(), multisiteEnabled ? 1 : 0); },
    getDatabaseStatistics: () => {
      const now = Date.now();
      const cutoff5m = new Date(now - 5 * 60 * 1000).toISOString();
      const cutoff24h = new Date(now - 24 * 60 * 60 * 1000).toISOString();
      const cutoff7d = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
      const count = (sql: string): number => Number((database.prepare(sql).get() as { count: number }).count);
      const fileStats = (path: string) => existsSync(path) ? statSync(path) : null;
      const main = fileStats(filename);
      const wal = fileStats(`${filename}-wal`);
      const shm = fileStats(`${filename}-shm`);
      const planner = JSON.parse((database.prepare(`SELECT document_json AS documentJson FROM planner_documents WHERE id = 'default'`).get() as { documentJson?: string } | undefined)?.documentJson ?? '{}') as { employees?: unknown[]; activities?: unknown[]; statuses?: unknown[]; categories?: unknown[]; entriesMap?: Record<string, unknown> };
      const sqliteVersion = String((database.prepare('SELECT sqlite_version() AS version').get() as { version: string }).version);
      const schemaVersion = Number((database.prepare('SELECT max(version) AS version FROM schema_migrations').get() as { version: number }).version ?? 0);
      const integrityCheck = String((database.prepare('PRAGMA integrity_check').get() as { integrity_check?: string })?.integrity_check ?? 'unavailable');
      return {
        generatedAt: new Date(now).toISOString(),
        storage: { databaseBytes: main?.size ?? 0, walBytes: wal?.size ?? 0, shmBytes: shm?.size ?? 0, totalBytes: (main?.size ?? 0) + (wal?.size ?? 0) + (shm?.size ?? 0), modifiedAt: main?.mtime.toISOString() ?? null },
        records: { users: count('SELECT count(*) AS count FROM users'), personnel: planner.employees?.length ?? 0, activities: planner.activities?.length ?? 0, scheduleEntries: Object.keys(planner.entriesMap ?? {}).length, statuses: planner.statuses?.length ?? 0, categories: planner.categories?.length ?? 0, absenceRequests: count('SELECT count(*) AS count FROM absence_requests') },
        users: { onlineNow: count(`SELECT count(*) AS count FROM users WHERE disabled = 0 AND last_active_at >= '${cutoff5m}'`), recentlyActive: count(`SELECT count(*) AS count FROM users WHERE disabled = 0 AND last_active_at >= '${cutoff7d}'`), neverActive: count(`SELECT count(*) AS count FROM users WHERE last_active_at IS NULL`), disabled: count('SELECT count(*) AS count FROM users WHERE disabled = 1') },
        changes: { planner24h: count(`SELECT count(*) AS count FROM planner_change_events WHERE occurred_at >= '${cutoff24h}'`), planner7d: count(`SELECT count(*) AS count FROM planner_change_events WHERE occurred_at >= '${cutoff7d}'`), audit24h: count(`SELECT count(*) AS count FROM audit_logs WHERE timestamp >= '${cutoff24h}'`), audit7d: count(`SELECT count(*) AS count FROM audit_logs WHERE timestamp >= '${cutoff7d}'`) },
        health: { sqliteVersion, journalMode: String(database.pragma('journal_mode', { simple: true })), schemaVersion, integrityCheck },
      };
    },
    getWorkwheel: () => {
      const row = database.prepare(`SELECT revision, document_json AS documentJson, updated_at AS updatedAt FROM workwheel_documents WHERE id = 'default'`).get() as { revision: number; documentJson: string; updatedAt: string } | undefined;
      if (row) return { revision: row.revision, document: JSON.parse(row.documentJson), updatedAt: row.updatedAt };
      const updatedAt = new Date().toISOString();
      const document = { version: 1, wheels: [], activities: [], availableActivities: [] };
      database.prepare(`INSERT INTO workwheel_documents (id, revision, document_json, updated_at) VALUES ('default', 1, ?, ?)`).run(JSON.stringify(document), updatedAt);
      return { revision: 1, document, updatedAt };
    },
    saveWorkwheel: (document, expectedRevision) => {
      const updatedAt = new Date().toISOString();
      const result = database.prepare(`UPDATE workwheel_documents SET revision = revision + 1, document_json = ?, updated_at = ? WHERE id = 'default' AND revision = ?`).run(JSON.stringify(document), updatedAt, expectedRevision);
      if (result.changes !== 1) throw new Error('WORKWHEEL_REVISION_CONFLICT');
      return { revision: expectedRevision + 1, document, updatedAt };
    },
    touchUserActivity: (userId, login = false) => {
      const now = new Date().toISOString();
      database.prepare(`UPDATE users SET last_active_at = ?, last_login_at = CASE WHEN ? THEN ? ELSE last_login_at END, updated_at = ? WHERE id = ?`).run(now, login ? 1 : 0, now, now, userId);
    },
    setOperationalChecksEnabled: (enabled) => { database.prepare(`UPDATE installation_settings SET operational_checks_enabled = ? WHERE id = 'default'`).run(enabled ? 1 : 0); },
    createInitialAdmin: ({ name, username, email, password, organizationType = 'process-subteams', timezone = 'UTC', shiftRotationEnabled = false, workwheelEnabled = false, operationalChecksEnabled = true }) => {
      const create = database.transaction(() => {
        const current = selectSetup.get() as { setupCompletedAt: string | null } | undefined;
        const adminCount = (selectAdminCount.get() as { count: number }).count;
        if (!current || current.setupCompletedAt !== null || adminCount !== 0) throw new Error('SETUP_ALREADY_COMPLETED');
        const user = { id: randomUUID(), externalId: null, name: name.trim(), username: username.trim(), email: email.trim().toLowerCase(), role: 'admin' as const };
        upsertUser.run(user);
        insertCredential.run(user.id, hashPassword(password), new Date().toISOString());
        database.prepare(`UPDATE installation_settings SET setup_completed_at = ?, setup_completed_by = ?, organization_type = ?, timezone = ?, shift_rotation_enabled = ?, workwheel_enabled = ?, operational_checks_enabled = ? WHERE id = 'default'`).run(new Date().toISOString(), user.id, organizationType, timezone, shiftRotationEnabled ? 1 : 0, workwheelEnabled ? 1 : 0, operationalChecksEnabled ? 1 : 0);
        return { ...user, disabled: false, employeeId: null, createdAt: new Date().toISOString() };
      });
      return create();
    },
    verifyUserPassword: (userId, password) => {
      const row = selectCredential.get(userId) as { passwordHash: string } | undefined;
      return row !== undefined && verifyPassword(password, row.passwordHash);
    },
    createUser: ({ id = randomUUID(), name, username, email, role, password }) => {
      const user = { id, externalId: null, name: name.trim(), username: username.trim(), email: email.trim().toLowerCase(), role };
      const create = database.transaction(() => {
        upsertUser.run(user);
        insertCredential.run(user.id, hashPassword(password), new Date().toISOString());
      });
      create();
      return selectUser.get(user.id) as AuthUserRecord;
    },
    updateUser: (userId, changes) => {
      const existing = selectUser.get(userId) as AuthUserRecord | undefined;
      if (!existing) throw new Error('USER_NOT_FOUND');
      const adminCount = (selectAdminCount.get() as { count: number }).count;
      if (changes.role && existing.role === 'admin' && changes.role !== 'admin' && adminCount <= 1) throw new Error('FINAL_ADMIN');
      database.prepare(`UPDATE users SET name = COALESCE(?, name), username = COALESCE(?, username), email = COALESCE(?, email), role = COALESCE(?, role), disabled = COALESCE(?, disabled), updated_at = ? WHERE id = ?`).run(changes.name?.trim() ?? null, changes.username?.trim() ?? null, changes.email?.trim().toLowerCase() ?? null, changes.role ?? null, changes.disabled === undefined ? null : (changes.disabled ? 1 : 0), new Date().toISOString(), userId);
      if (changes.password) updateCredential.run(hashPassword(changes.password), new Date().toISOString(), userId);
      return selectUser.get(userId) as AuthUserRecord;
    },
    getUserPreferences: (userId) => {
      const row = database.prepare(`SELECT jump_to_today_on_grid_change AS jumpToTodayOnGridChange, dark_mode AS darkMode, zoom, colleague_change_notifications_enabled AS colleagueChangeNotificationsEnabled, colleague_change_user_ids AS colleagueChangeUserIds FROM user_preferences WHERE user_id = ?`).get(userId) as (Omit<UserPreferencesRecord, 'colleagueChangeUserIds'> & { colleagueChangeUserIds?: string }) | undefined;
      let colleagueChangeUserIds: string[] = [];
      try { colleagueChangeUserIds = row?.colleagueChangeUserIds ? JSON.parse(row.colleagueChangeUserIds).filter((id: unknown): id is string => typeof id === 'string') : []; } catch { colleagueChangeUserIds = []; }
      return row ? { ...row, colleagueChangeNotificationsEnabled: Boolean(row.colleagueChangeNotificationsEnabled), colleagueChangeUserIds } as UserPreferencesRecord : { jumpToTodayOnGridChange: true, darkMode: false, zoom: 100, colleagueChangeNotificationsEnabled: false, colleagueChangeUserIds };
    },
    updateUserPreferences: (userId, changes) => {
      const current = database.prepare(`SELECT jump_to_today_on_grid_change AS jumpToTodayOnGridChange, dark_mode AS darkMode, zoom, colleague_change_notifications_enabled AS colleagueChangeNotificationsEnabled, colleague_change_user_ids AS colleagueChangeUserIds FROM user_preferences WHERE user_id = ?`).get(userId) as (Omit<UserPreferencesRecord, 'colleagueChangeUserIds'> & { colleagueChangeUserIds?: string }) | undefined;
      let currentUserIds: string[] = [];
      try { currentUserIds = current?.colleagueChangeUserIds ? JSON.parse(current.colleagueChangeUserIds).filter((id: unknown): id is string => typeof id === 'string') : []; } catch { currentUserIds = []; }
      const next = { jumpToTodayOnGridChange: changes.jumpToTodayOnGridChange ?? current?.jumpToTodayOnGridChange ?? true, darkMode: changes.darkMode ?? current?.darkMode ?? false, zoom: changes.zoom ?? current?.zoom ?? 100, colleagueChangeNotificationsEnabled: changes.colleagueChangeNotificationsEnabled ?? Boolean(current?.colleagueChangeNotificationsEnabled), colleagueChangeUserIds: changes.colleagueChangeUserIds ?? currentUserIds };
      database.prepare(`INSERT INTO user_preferences (user_id, jump_to_today_on_grid_change, dark_mode, zoom, colleague_change_notifications_enabled, colleague_change_user_ids) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET jump_to_today_on_grid_change=excluded.jump_to_today_on_grid_change, dark_mode=excluded.dark_mode, zoom=excluded.zoom, colleague_change_notifications_enabled=excluded.colleague_change_notifications_enabled, colleague_change_user_ids=excluded.colleague_change_user_ids`).run(userId, next.jumpToTodayOnGridChange ? 1 : 0, next.darkMode ? 1 : 0, next.zoom, next.colleagueChangeNotificationsEnabled ? 1 : 0, JSON.stringify([...new Set(next.colleagueChangeUserIds)]));
      return next;
    },
    factoryReset: () => {
      database.transaction(() => {
        database.exec(`
          DELETE FROM admin_event_acknowledgements;
          DELETE FROM operational_checks;
          DELETE FROM absence_requests;
          DELETE FROM admin_responsibility_scopes;
          DELETE FROM responsibility_units;
          DELETE FROM user_personnel_links;
          DELETE FROM user_preferences;
          DELETE FROM local_credentials;
          DELETE FROM sessions;
          DELETE FROM audit_logs;
          DELETE FROM planner_change_events;
          DELETE FROM planner_documents;
          DELETE FROM shifts;
          DELETE FROM activities;
          DELETE FROM employees;
          DELETE FROM users;
          UPDATE installation_settings SET setup_completed_at = NULL, setup_completed_by = NULL, organization_type = 'team', timezone = 'UTC', shift_rotation_enabled = 0, workwheel_enabled = 0, operational_checks_enabled = 1 WHERE id = 'default';
        `);
      })();
    },
    deleteUser: (userId) => {
      const existing = selectUser.get(userId) as AuthUserRecord | undefined;
      const adminCount = (selectAdminCount.get() as { count: number }).count;
      if (existing?.role === 'admin' && adminCount <= 1) throw new Error('FINAL_ADMIN');
      database.prepare(`DELETE FROM users WHERE id = ?`).run(userId);
    },
    createAuthSession: (userId, token, expiresAt) => insertSession.run({ id: randomUUID(), userId, tokenHash: hashToken(token), expiresAt, createdAt: new Date().toISOString(), revokedAt: null }),
    getAuthSession: (token) => {
      const row = selectAuthSession.get(hashToken(token)) as AuthSessionRecord | undefined;
      return row && new Date(row.expiresAt).getTime() > Date.now() ? row : null;
    },
    revokeAuthSession: (token, revokedAt) => database.prepare(`UPDATE sessions SET revoked_at = ? WHERE token_hash = ?`).run(revokedAt, hashToken(token)),
    revokeAllAuthSessions: (userId, revokedAt) => database.prepare(`UPDATE sessions SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL`).run(revokedAt, userId),
    createSession: (session) => {
      insertSession.run(session);
    },
    revokeSession: (sessionId, revokedAt) => {
      revokeSession.run(revokedAt, sessionId);
    },
    writeAuditLog: (entry) => {
      insertAudit.run({ ...entry, timestamp: entry.timestamp ?? new Date().toISOString() });
    },
    listAuditLogs: (limit = 100) => listAuditLogs.all(limit) as AuditLogRecord[],
    getState,
    applyAction: (action) => persistAction(action),
    getPlanner: () => {
      const row = selectPlanner.get('default') as { revision: number; documentJson: string } | undefined;
      if (row === undefined) {
        const document = createBlankPlannerDocument();
        insertPlanner.run(JSON.stringify(document), document.savedAt);
        return { revision: 1, document };
      }
      return { revision: row.revision, document: normalizeLegacyPlannerDocument(JSON.parse(row.documentJson)) };
    },
    savePlanner: (document, expectedRevision) => {
      const normalized = normalizeLegacyPlannerDocument(document);
      const updatedAt = new Date().toISOString();
      const result = updatePlanner.run(JSON.stringify({ ...normalized, savedAt: updatedAt }), updatedAt, expectedRevision);
      if (result.changes !== 1) throw new Error('PLANNER_REVISION_CONFLICT');
      return { revision: expectedRevision + 1, document: { ...normalized, savedAt: updatedAt } };
    },
    recordPlannerChangeEvents: (events) => {
      const insert = database.transaction(() => { for (const event of events) insertChangeEvent.run({ ...event, summaryJson: JSON.stringify(event.summary) }); });
      insert();
    },
    listPlannerChangeEvents: (limit = 100) => selectChangeEvents.all(limit).map((raw) => { const row = raw as Omit<PlannerChangeEventRecord, 'summary'> & { summaryJson: string }; return { ...row, summary: JSON.parse(row.summaryJson) }; }),
    acknowledgePlannerChangeEvent: (userId, eventId) => { insertAcknowledgement.run(userId, eventId, new Date().toISOString()); },
    unacknowledgePlannerChangeEvent: (userId, eventId) => { deleteAcknowledgement.run(userId, eventId); },
    listAcknowledgedPlannerEvents: (userId) => selectAcknowledgements.all(userId).map(row => Number((row as { eventId: number }).eventId)),
    getOperationalCheck: (employeeId, date, subjectKind, subjectKey) => selectOperationalCheck.get(employeeId, date, subjectKind, subjectKey) as OperationalCheckRecord | undefined ?? null,
    setOperationalCheck: (employeeId, date, subjectKind, subjectKey, userId) => { insertOperationalCheck.run(employeeId, date, subjectKind, subjectKey, userId, new Date().toISOString()); return selectOperationalCheck.get(employeeId, date, subjectKind, subjectKey) as OperationalCheckRecord; },
    revokeOperationalCheck: (employeeId, date, subjectKind, subjectKey) => { revokeOperationalCheck.run(new Date().toISOString(), employeeId, date, subjectKind, subjectKey); },
    listOperationalChecks: () => selectOperationalChecks.all() as OperationalCheckRecord[],
    createAbsenceRequest: (request) => { const id = randomUUID(); database.prepare(`INSERT INTO absence_requests (id, requester_user_id, employee_id, status_key, start_date, end_date, duration_type, time_range, request_status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(id, request.requesterUserId, request.employeeId, request.statusKey, request.startDate, request.endDate, request.durationType, request.timeRange, request.requestStatus, new Date().toISOString()); return (selectAbsenceRequests.all(request.employeeId, request.employeeId) as AbsenceRequestRecord[]).find(item => item.id === id)!; },
    listAbsenceRequests: (employeeId) => selectAbsenceRequests.all(employeeId ?? null, employeeId ?? null) as AbsenceRequestRecord[],
    decideAbsenceRequest: (id, status, decidedByUserId) => { database.prepare(`UPDATE absence_requests SET request_status = ?, decided_at = ?, decided_by_user_id = ? WHERE id = ?`).run(status, new Date().toISOString(), decidedByUserId, id); return database.prepare(`SELECT id, requester_user_id AS requesterUserId, employee_id AS employeeId, status_key AS statusKey, start_date AS startDate, end_date AS endDate, duration_type AS durationType, time_range AS timeRange, request_status AS requestStatus, created_at AS createdAt, decided_at AS decidedAt, decided_by_user_id AS decidedByUserId FROM absence_requests WHERE id = ?`).get(id) as AbsenceRequestRecord; },
  };
}

type AtlasActionUser = Extract<AtlasAction, { type: 'user.upsert' }>['user'];
type AtlasActionEmployee = Extract<AtlasAction, { type: 'employee.upsert' }>['employee'];
type AtlasActionActivity = Extract<AtlasAction, { type: 'activity.upsert' }>['activity'];
type AtlasActionShift = Extract<AtlasAction, { type: 'shift.upsert' }>['shift'];

function getActionTarget(action: AtlasAction): string {
  switch (action.type) {
    case 'user.upsert': return `users/${action.user.id}`;
    case 'user.remove': return `users/${action.userId}`;
    case 'employee.upsert': return `employees/${action.employee.id}`;
    case 'employee.remove': return `employees/${action.employeeId}`;
    case 'activity.upsert': return `activities/${action.activity.id}`;
    case 'activity.remove': return `activities/${action.activityId}`;
    case 'shift.upsert': return `shifts/${action.shift.id}`;
    case 'shift.remove': return `shifts/${action.shiftId}`;
  }
}

function migrate(database: Database.Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );
  `);

  const applyInitialMigration = database.transaction(() => {
    database.exec(`
      CREATE TABLE users (
        id TEXT PRIMARY KEY,
        external_id TEXT UNIQUE,
        name TEXT NOT NULL CHECK (length(trim(name)) > 0),
        role TEXT NOT NULL CHECK (role IN ('admin', 'planner', 'viewer')),
        disabled INTEGER NOT NULL DEFAULT 0 CHECK (disabled IN (0, 1)),
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
        updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
      );

      CREATE TABLE sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash TEXT NOT NULL UNIQUE,
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL,
        revoked_at TEXT
      );

      CREATE TABLE audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        action TEXT NOT NULL CHECK (length(trim(action)) > 0),
        target TEXT NOT NULL CHECK (length(trim(target)) > 0),
        timestamp TEXT NOT NULL
      );

      CREATE INDEX sessions_active_by_token_idx ON sessions (token_hash, expires_at) WHERE revoked_at IS NULL;
      CREATE INDEX audit_logs_by_user_timestamp_idx ON audit_logs (user_id, timestamp DESC);
    `);
    database.prepare('INSERT INTO schema_migrations (version) VALUES (1)').run();
  });
  const initialApplied = database.prepare('SELECT 1 FROM schema_migrations WHERE version = 1').get();
  if (initialApplied === undefined) applyInitialMigration();

  const schedulingApplied = database.prepare('SELECT 1 FROM schema_migrations WHERE version = 2').get();
  if (schedulingApplied === undefined) {
    database.transaction(() => {
      database.exec(`
        CREATE TABLE employees (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL CHECK (length(trim(name)) > 0),
          role TEXT NOT NULL CHECK (length(trim(role)) > 0)
        );
        CREATE TABLE activities (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL CHECK (length(trim(name)) > 0),
          start_at TEXT NOT NULL,
          end_at TEXT NOT NULL CHECK (end_at > start_at)
        );
        CREATE TABLE shifts (
          id TEXT PRIMARY KEY,
          employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
          activity_id TEXT NOT NULL REFERENCES activities(id) ON DELETE RESTRICT,
          start_at TEXT NOT NULL,
          end_at TEXT NOT NULL CHECK (end_at > start_at)
        );
        CREATE INDEX shifts_by_employee_time_idx ON shifts (employee_id, start_at, end_at);
        CREATE INDEX shifts_by_activity_idx ON shifts (activity_id);
        CREATE TABLE planner_documents (
          id TEXT PRIMARY KEY,
          schema_version INTEGER NOT NULL,
          revision INTEGER NOT NULL,
          document_json TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
      `);
      database.prepare('INSERT INTO schema_migrations (version) VALUES (2)').run();
    })();
  }

  if (database.prepare('SELECT 1 FROM schema_migrations WHERE version = 3').get() === undefined) {
    database.transaction(() => {
      const userColumns = database.prepare(`PRAGMA table_info(users)`).all() as Array<{ name: string }>;
      if (!userColumns.some(column => column.name === 'disabled')) database.exec(`ALTER TABLE users ADD COLUMN disabled INTEGER NOT NULL DEFAULT 0 CHECK (disabled IN (0, 1))`);
      database.exec(`
        CREATE TABLE local_credentials (user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, password_hash TEXT NOT NULL, updated_at TEXT NOT NULL);
        CREATE TABLE installation_settings (id TEXT PRIMARY KEY CHECK (id = 'default'), setup_completed_at TEXT, setup_completed_by TEXT REFERENCES users(id) ON DELETE SET NULL);
        INSERT INTO installation_settings (id) VALUES ('default');
      `);
      database.prepare(`INSERT INTO schema_migrations (version) VALUES (3)`).run();
    })();
  }
  if (database.prepare('SELECT 1 FROM schema_migrations WHERE version = 4').get() === undefined) {
    database.transaction(() => {
      database.exec(`
        CREATE TABLE user_personnel_links (user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, employee_id INTEGER NOT NULL UNIQUE, linked_at TEXT NOT NULL, linked_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL);
      `);
      database.prepare(`INSERT INTO schema_migrations (version) VALUES (4)`).run();
    })();
  }
  if (database.prepare('SELECT 1 FROM schema_migrations WHERE version = 5').get() === undefined) {
    database.transaction(() => {
      database.exec(`
        CREATE TABLE responsibility_units (id TEXT PRIMARY KEY, parent_id TEXT REFERENCES responsibility_units(id) ON DELETE CASCADE, kind TEXT NOT NULL CHECK (kind IN ('organisation','department','section','process','team')), name TEXT NOT NULL, path TEXT NOT NULL UNIQUE);
        CREATE TABLE admin_responsibility_scopes (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, unit_id TEXT NOT NULL REFERENCES responsibility_units(id) ON DELETE CASCADE, include_descendants INTEGER NOT NULL DEFAULT 1 CHECK (include_descendants IN (0,1)), granted_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL, granted_at TEXT NOT NULL, UNIQUE(user_id, unit_id));
      `);
      database.prepare(`INSERT INTO schema_migrations (version) VALUES (5)`).run();
    })();
  }
  if (database.prepare('SELECT 1 FROM schema_migrations WHERE version = 6').get() === undefined) {
    database.transaction(() => {
      database.exec(`CREATE TABLE planner_change_events (id INTEGER PRIMARY KEY AUTOINCREMENT, planner_revision INTEGER NOT NULL, occurred_at TEXT NOT NULL, actor_user_id TEXT REFERENCES users(id) ON DELETE SET NULL, actor_name TEXT NOT NULL, event_type TEXT NOT NULL, resource_kind TEXT NOT NULL, resource_key TEXT NOT NULL, employee_id INTEGER, activity_id INTEGER, date TEXT, summary_json TEXT NOT NULL); CREATE INDEX planner_change_events_order_idx ON planner_change_events (id DESC);`);
      database.prepare(`INSERT INTO schema_migrations (version) VALUES (6)`).run();
    })();
  }
  if (database.prepare('SELECT 1 FROM schema_migrations WHERE version = 7').get() === undefined) {
    database.transaction(() => {
      database.exec(`CREATE TABLE operational_checks (id INTEGER PRIMARY KEY AUTOINCREMENT, employee_id INTEGER NOT NULL, date TEXT NOT NULL, subject_kind TEXT NOT NULL CHECK (subject_kind IN ('schedule_cell','absence_request')), subject_key TEXT NOT NULL, checked_by_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT, checked_at TEXT NOT NULL, revoked_at TEXT); CREATE INDEX operational_checks_lookup_idx ON operational_checks (employee_id, date, subject_kind, subject_key, revoked_at);`);
      database.prepare(`INSERT INTO schema_migrations (version) VALUES (7)`).run();
    })();
  }
  if (database.prepare('SELECT 1 FROM schema_migrations WHERE version = 8').get() === undefined) {
    database.transaction(() => {
      database.exec(`CREATE TABLE admin_event_acknowledgements (admin_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, event_id INTEGER NOT NULL REFERENCES planner_change_events(id) ON DELETE CASCADE, acknowledged_at TEXT NOT NULL, PRIMARY KEY (admin_user_id, event_id));`);
      database.prepare(`INSERT INTO schema_migrations (version) VALUES (8)`).run();
    })();
  }
  if (database.prepare('SELECT 1 FROM schema_migrations WHERE version = 9').get() === undefined) {
    database.transaction(() => {
      database.exec(`
        ALTER TABLE operational_checks RENAME TO operational_checks_legacy;
        CREATE TABLE operational_checks (id INTEGER PRIMARY KEY AUTOINCREMENT, employee_id INTEGER NOT NULL, date TEXT NOT NULL, subject_kind TEXT NOT NULL CHECK (subject_kind IN ('schedule_cell','absence_request')), subject_key TEXT NOT NULL, checked_by_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT, checked_at TEXT NOT NULL, revoked_at TEXT);
        INSERT INTO operational_checks (employee_id, date, subject_kind, subject_key, checked_by_user_id, checked_at, revoked_at)
          SELECT employee_id, date, 'schedule_cell', 'cell', checked_by_user_id, MIN(checked_at), revoked_at
          FROM operational_checks_legacy GROUP BY employee_id, date, checked_by_user_id, revoked_at;
        DROP TABLE operational_checks_legacy;
        CREATE INDEX operational_checks_lookup_idx ON operational_checks (employee_id, date, subject_kind, subject_key, revoked_at);
      `);
      database.prepare(`INSERT INTO schema_migrations (version) VALUES (9)`).run();
    })();
  }
  if (database.prepare('SELECT 1 FROM schema_migrations WHERE version = 10').get() === undefined) {
    database.transaction(() => {
      database.exec(`ALTER TABLE installation_settings ADD COLUMN operational_checks_enabled INTEGER NOT NULL DEFAULT 1 CHECK (operational_checks_enabled IN (0,1));`);
      database.prepare(`INSERT INTO schema_migrations (version) VALUES (10)`).run();
    })();
  }
  if (database.prepare('SELECT 1 FROM schema_migrations WHERE version = 11').get() === undefined) {
    database.transaction(() => {
      database.exec(`CREATE TABLE absence_requests (id TEXT PRIMARY KEY, requester_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, employee_id INTEGER NOT NULL, status_key TEXT NOT NULL, start_date TEXT NOT NULL, end_date TEXT NOT NULL, duration_type TEXT NOT NULL CHECK (duration_type IN ('fullday','24hours','time')), time_range TEXT, request_status TEXT NOT NULL CHECK (request_status IN ('pending','approved','declined','withdrawn')), created_at TEXT NOT NULL, decided_at TEXT, decided_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL); CREATE INDEX absence_requests_queue_idx ON absence_requests (request_status, created_at DESC);`);
      database.prepare(`INSERT INTO schema_migrations (version) VALUES (11)`).run();
    })();
  }
  if (database.prepare('SELECT 1 FROM schema_migrations WHERE version = 12').get() === undefined) {
    database.transaction(() => {
      database.exec(`
        ALTER TABLE users ADD COLUMN username TEXT;
        ALTER TABLE users ADD COLUMN email TEXT;
        UPDATE users SET username = lower(replace(name, ' ', '.')) WHERE username IS NULL;
        UPDATE users SET email = lower(username || '@local.invalid') WHERE email IS NULL;
        CREATE UNIQUE INDEX users_username_unique_idx ON users (lower(username));
        CREATE UNIQUE INDEX users_email_unique_idx ON users (lower(email));
        CREATE TABLE user_preferences (
          user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
          jump_to_today_on_grid_change INTEGER NOT NULL DEFAULT 1 CHECK (jump_to_today_on_grid_change IN (0,1)),
          dark_mode INTEGER NOT NULL DEFAULT 0 CHECK (dark_mode IN (0,1)),
          zoom INTEGER NOT NULL DEFAULT 100 CHECK (zoom IN (80,90,100,110,125,150,175))
        );
      `);
      database.prepare(`INSERT INTO schema_migrations (version) VALUES (12)`).run();
    })();
  }
  if (database.prepare('SELECT 1 FROM schema_migrations WHERE version = 13').get() === undefined) {
    database.transaction(() => {
      database.exec(`ALTER TABLE installation_settings ADD COLUMN organization_type TEXT NOT NULL DEFAULT 'team'; ALTER TABLE installation_settings ADD COLUMN timezone TEXT NOT NULL DEFAULT 'UTC'; ALTER TABLE installation_settings ADD COLUMN shift_rotation_enabled INTEGER NOT NULL DEFAULT 0 CHECK (shift_rotation_enabled IN (0,1)); ALTER TABLE installation_settings ADD COLUMN workwheel_enabled INTEGER NOT NULL DEFAULT 0 CHECK (workwheel_enabled IN (0,1));`);
      database.prepare(`INSERT INTO schema_migrations (version) VALUES (13)`).run();
    })();
  }
  if (database.prepare('SELECT 1 FROM schema_migrations WHERE version = 14').get() === undefined) {
    database.transaction(() => {
      database.exec(`ALTER TABLE users ADD COLUMN last_login_at TEXT; ALTER TABLE users ADD COLUMN last_active_at TEXT;`);
      database.prepare(`INSERT INTO schema_migrations (version) VALUES (14)`).run();
    })();
  }
  if (database.prepare('SELECT 1 FROM schema_migrations WHERE version = 15').get() === undefined) {
    database.transaction(() => {
      database.exec(`CREATE TABLE workwheel_documents (id TEXT PRIMARY KEY CHECK (id = 'default'), revision INTEGER NOT NULL, document_json TEXT NOT NULL, updated_at TEXT NOT NULL);`);
      database.prepare(`INSERT INTO schema_migrations (version) VALUES (15)`).run();
    })();
  }
  if (database.prepare('SELECT 1 FROM schema_migrations WHERE version = 16').get() === undefined) {
    database.transaction(() => {
      database.exec(`ALTER TABLE user_preferences ADD COLUMN colleague_change_notifications_enabled INTEGER NOT NULL DEFAULT 0 CHECK (colleague_change_notifications_enabled IN (0,1)); ALTER TABLE user_preferences ADD COLUMN colleague_change_user_ids TEXT NOT NULL DEFAULT '[]';`);
      database.prepare(`INSERT INTO schema_migrations (version) VALUES (16)`).run();
    })();
  }
  if (database.prepare('SELECT 1 FROM schema_migrations WHERE version = 17').get() === undefined) {
    database.transaction(() => {
      database.exec(`ALTER TABLE installation_settings ADD COLUMN organization_name TEXT NOT NULL DEFAULT 'Organisation'; ALTER TABLE installation_settings ADD COLUMN organization_slug TEXT NOT NULL DEFAULT 'default'; ALTER TABLE installation_settings ADD COLUMN multisite_enabled INTEGER NOT NULL DEFAULT 0 CHECK (multisite_enabled IN (0,1));`);
      database.prepare(`INSERT INTO schema_migrations (version) VALUES (17)`).run();
    })();
  }
}

const SCRYPT_COST = 16384;
function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const derived = scryptSync(password, salt, 64, { N: SCRYPT_COST, r: 8, p: 1, maxmem: 32 * 1024 * 1024 });
  return `scrypt$${SCRYPT_COST}$${salt.toString('base64url')}$${derived.toString('base64url')}`;
}

export function verifyPassword(password: string, encoded: string): boolean {
  const [, cost, saltText, hashText] = encoded.split('$');
  if (!cost || !saltText || !hashText) return false;
  const expected = Buffer.from(hashText, 'base64url');
  const actual = scryptSync(password, Buffer.from(saltText, 'base64url'), expected.length, { N: Number(cost), r: 8, p: 1, maxmem: 32 * 1024 * 1024 });
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function hashToken(token: string): string { return createHash('sha256').update(token).digest('hex'); }
