import Fastify, { type FastifyInstance } from 'fastify';
import fastifyStatic from '@fastify/static';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { randomBytes } from 'node:crypto';
import type { AtlasDatabase } from './db.js';
import { normalizeLegacyPlannerDocument } from '@atlas/core';

export interface AppOptions {
  readonly database: AtlasDatabase;
  readonly clientDistPath?: string;
}

export function buildApp(options: AppOptions): FastifyInstance {
  const app = Fastify({ logger: true });

  const cookieName = 'atlas_session';
  const readSessionToken = (request: { headers: { cookie?: string | undefined } }): string | null => {
    const match = request.headers.cookie?.split(';').map(value => value.trim()).find(value => value.startsWith(`${cookieName}=`));
    return match ? decodeURIComponent(match.slice(cookieName.length + 1)) : null;
  };
  const setSessionCookie = (reply: { header(name: string, value: string): unknown }, token: string, maxAge: number) => {
    reply.header('set-cookie', `${cookieName}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}`);
  };
  const clearSessionCookie = (reply: { header(name: string, value: string): unknown }) => {
    reply.header('set-cookie', `${cookieName}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`);
  };
  const currentSession = (request: { headers: { cookie?: string | undefined } }) => {
    const token = readSessionToken(request);
    return token ? options.database.getAuthSession(token) : null;
  };
  const requireRole = (request: { headers: { cookie?: string | undefined } }, reply: { code(code: number): { send(body: unknown): unknown } }, roles: readonly string[]) => {
    const session = currentSession(request);
    if (!session) { reply.code(401).send({ error: 'Authentication required' }); return null; }
    if (!roles.includes(session.role)) { reply.code(403).send({ error: 'Insufficient permissions' }); return null; }
    return session;
  };

  app.get('/healthz', async () => ({ status: 'ok' as const }));
  app.get('/api/healthz', async () => ({ status: 'ok' as const }));

  app.get('/api/auth/bootstrap-status', async () => ({ setupRequired: options.database.isSetupRequired() }));
  app.post<{ Body: { name?: string; username?: string; email?: string; password?: string; organizationName?: string; organizationSlug?: string; multisiteEnabled?: boolean; organizationType?: 'process-subteams' | 'section-process-team' | 'department-section-process-team' | 'organisation-department-section-process-team'; timezone?: string; shiftRotationEnabled?: boolean; workwheelEnabled?: boolean; operationalChecksEnabled?: boolean } }>('/api/setup/create-admin', async (request, reply) => {
    const name = request.body?.name?.trim();
    const username = request.body?.username?.trim();
    const email = request.body?.email?.trim().toLowerCase();
    const password = request.body?.password;
    const organizationSlug = String(request.body?.organizationSlug || 'default').trim().toLowerCase();
    const organizationName = String(request.body?.organizationName || 'Organisation').trim();
    const multisiteEnabled = request.body?.multisiteEnabled === true;
    if (!/^[a-z0-9-]{2,64}$/.test(organizationSlug) || !organizationName || organizationName.length > 120) return reply.code(400).send({ error: 'A valid organization name and slug are required' });
    if (!name || !username || !email || !password || name.length > 120 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || password.length < 12) return reply.code(400).send({ error: 'Name, username, valid email, and a password of at least 12 characters are required' });
    try {
      const setupOptions: { name: string; username: string; email: string; password: string; organizationType?: 'process-subteams' | 'section-process-team' | 'department-section-process-team' | 'organisation-department-section-process-team'; timezone?: string; shiftRotationEnabled?: boolean; workwheelEnabled?: boolean; operationalChecksEnabled?: boolean } = { name, username, email, password };
      if (request.body?.organizationType !== undefined) setupOptions.organizationType = request.body.organizationType;
      if (request.body?.timezone !== undefined) setupOptions.timezone = request.body.timezone;
      if (request.body?.shiftRotationEnabled !== undefined) setupOptions.shiftRotationEnabled = request.body.shiftRotationEnabled;
      if (request.body?.workwheelEnabled !== undefined) setupOptions.workwheelEnabled = request.body.workwheelEnabled;
      if (request.body?.operationalChecksEnabled !== undefined) setupOptions.operationalChecksEnabled = request.body.operationalChecksEnabled;
      const user = options.database.createInitialAdmin(setupOptions);
      options.database.setInstallationOrganization({ name: organizationName, slug: organizationSlug, multisiteEnabled });
      options.database.writeAuditLog({ userId: user.id, action: 'setup.completed', target: `users/${user.id}` });
      const token = randomBytes(32).toString('base64url');
      const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();
      options.database.createAuthSession(user.id, token, expiresAt);
      setSessionCookie(reply, token, 8 * 60 * 60);
      return reply.code(201).send({ user: publicUser(user), expiresAt });
    } catch (error) {
      if (error instanceof Error && error.message === 'SETUP_ALREADY_COMPLETED') return reply.code(409).send({ error: 'Initial setup has already been completed' });
      return reply.code(400).send({ error: 'Could not create administrator' });
    }
  });
  app.post<{ Body: { name?: string; username?: string; password?: string; organizationSlug?: string } }>('/api/auth/login', async (request, reply) => {
    const username = (request.body?.username ?? request.body?.name)?.trim();
    const password = request.body?.password ?? '';
    const installation = options.database.getInstallationSettings();
    const requestedSlug = String(request.body?.organizationSlug || '').trim().toLowerCase();
    if (installation.multisiteEnabled && requestedSlug !== installation.organizationSlug) return reply.code(401).send({ error: 'Unknown organization code' });
    const user = username ? options.database.listUsers().find(candidate => candidate.username?.toLowerCase() === username.toLowerCase()) : undefined;
    if (!user || user.disabled || !options.database.verifyUserPassword(user.id, password)) return reply.code(401).send({ error: 'Invalid credentials' });
    options.database.touchUserActivity(user.id, true);
    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();
    options.database.createAuthSession(user.id, token, expiresAt);
    options.database.writeAuditLog({ userId: user.id, action: 'auth.login', target: `users/${user.id}` });
    setSessionCookie(reply, token, 8 * 60 * 60);
    return { user: publicUser(user), expiresAt };
  });
  app.get('/api/auth/me', async (request, reply) => {
    const session = requireRole(request, reply, ['admin', 'planner', 'viewer']);
    return session ? { user: { ...publicUser(options.database.getUserById(session.userId)!), preferences: options.database.getUserPreferences(session.userId), availableUsers: options.database.listUsers().filter(user => user.id !== session.userId).map(publicUser) }, installation: options.database.getInstallationSettings(), operationalChecksEnabled: options.database.getOperationalChecksEnabled(), expiresAt: session.expiresAt } : undefined;
  });
  app.patch<{ Body: { name?: string; email?: string; password?: string; preferences?: { jumpToTodayOnGridChange?: boolean; darkMode?: boolean; zoom?: number; colleagueChangeNotificationsEnabled?: boolean; colleagueChangeUserIds?: string[] } } }>('/api/me/profile', async (request, reply) => {
    const actor = requireRole(request, reply, ['admin', 'planner', 'viewer']);
    if (!actor) return;
    const body = request.body ?? {};
    if (body.name !== undefined && !body.name.trim()) return reply.code(400).send({ error: 'Name cannot be empty' });
    if (body.email !== undefined && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(body.email.trim())) return reply.code(400).send({ error: 'A valid email is required' });
    if (body.password !== undefined && body.password.length < 12) return reply.code(400).send({ error: 'Password must be at least 12 characters' });
    try {
      const profileChanges: { name?: string; email?: string; password?: string } = {};
      if (body.name !== undefined) profileChanges.name = body.name;
      if (body.email !== undefined) profileChanges.email = body.email;
      if (body.password !== undefined) profileChanges.password = body.password;
      const user = options.database.updateUser(actor.userId, profileChanges);
      const preferences = body.preferences ? options.database.updateUserPreferences(actor.userId, body.preferences) : options.database.getUserPreferences(actor.userId);
      if (body.password) options.database.revokeAllAuthSessions(actor.userId, new Date().toISOString());
      options.database.writeAuditLog({ userId: actor.userId, action: 'user.profile_updated', target: `users/${user.id}` });
      return { user: publicUser(user), preferences };
    } catch { return reply.code(400).send({ error: 'Could not update profile' }); }
  });
  app.get('/api/admin/settings', async (request, reply) => {
    if (!requireRole(request, reply, ['admin'])) return;
    return { operationalChecksEnabled: options.database.getOperationalChecksEnabled() };
  });
  app.get('/api/admin/statistics', async (request, reply) => {
    const actor = requireRole(request, reply, ['admin']);
    if (!actor) return;
    return options.database.getDatabaseStatistics();
  });
  app.get('/api/workwheel', async (request, reply) => {
    if (!requireRole(request, reply, ['admin', 'planner', 'viewer'])) return;
    return options.database.getWorkwheel();
  });
  app.put<{ Body: { document?: Readonly<Record<string, unknown>>; expectedRevision?: number } }>('/api/workwheel', async (request, reply) => {
    const actor = requireRole(request, reply, ['admin', 'planner']);
    if (!actor) return;
    if (!request.body?.document || typeof request.body.expectedRevision !== 'number') return reply.code(400).send({ error: 'document and expectedRevision are required' });
    try {
      const saved = options.database.saveWorkwheel(request.body.document, request.body.expectedRevision);
      options.database.writeAuditLog({ userId: actor.userId, action: 'workwheel.updated', target: 'workwheel/default' });
      return saved;
    } catch (error) {
      if (error instanceof Error && error.message === 'WORKWHEEL_REVISION_CONFLICT') return reply.code(409).send({ error: 'Workwheel changed by another user. Reload before saving.' });
      return reply.code(400).send({ error: 'Could not save Workwheel' });
    }
  });
  app.post<{ Body: { workwheelActivityId?: string; participantIds?: number[]; occurrenceDate?: string; startTime?: string; endTime?: string } }>('/api/workwheel/conflicts', async (request, reply) => {
    if (!requireRole(request, reply, ['admin', 'planner', 'viewer'])) return;
    const workwheel = options.database.getWorkwheel().document as { activities?: Array<Record<string, unknown>> };
    const activityId = String(request.body?.workwheelActivityId || '');
    const source = (workwheel.activities ?? []).find(item => String(item.id) === activityId);
    if (!source) return reply.code(404).send({ error: 'Workwheel activity not found' });
    const participants = new Set((request.body?.participantIds || (Array.isArray(source.participantIds) ? source.participantIds : [])).map(Number).filter(Number.isFinite));
    const occurrenceDate = String(request.body?.occurrenceDate || source.date || '');
    const startTime = String(request.body?.startTime || source.startTime || '').trim();
    const endTime = String(request.body?.endTime || source.endTime || '').trim();
    const timedOverlap = (otherStart: string, otherEnd: string) => {
      if (!startTime || !endTime || !otherStart || !otherEnd) return true;
      return startTime < otherEnd && otherStart < endTime;
    };
    const conflicts: Array<Record<string, unknown>> = [];
    const planner = options.database.getPlanner().document as unknown as { activities?: Array<Record<string, unknown>> };
    for (const other of planner.activities ?? []) {
      if (Number(other.id) === Number(source.linkedScheduleActivityId)) continue;
      const otherParticipants = Array.isArray(other.participants) ? other.participants.map(item => Number((item as Record<string, unknown>).id)).filter(Number.isFinite) : [];
      if (!otherParticipants.some(id => participants.has(id))) continue;
      const start = String(other.startDate || ''), end = String(other.endDate || start);
      if (occurrenceDate < start || occurrenceDate > end) continue;
      conflicts.push({ source: 'schedule', activityId: other.id, title: other.name || 'Schedule activity', date: occurrenceDate, time: 'All day', participantIds: otherParticipants.filter(id => participants.has(id)) });
    }
    for (const other of workwheel.activities ?? []) {
      if (String(other.id) === activityId) continue;
      const otherDate = String(other.date || '');
      if (otherDate !== occurrenceDate) continue;
      const otherParticipants = Array.isArray(other.participantIds) ? other.participantIds.map(Number).filter(Number.isFinite) : [];
      if (!otherParticipants.some(id => participants.has(id)) || !timedOverlap(String(other.startTime || ''), String(other.endTime || ''))) continue;
      conflicts.push({ source: 'workwheel', activityId: other.id, title: other.title || 'Workwheel activity', date: occurrenceDate, time: other.startTime && other.endTime ? `${other.startTime}–${other.endTime}` : 'All day', participantIds: otherParticipants.filter(id => participants.has(id)) });
    }
    return { conflicts };
  });
  app.post<{ Body: { confirmation?: string } }>('/api/admin/factory-reset', async (request, reply) => {
    const actor = requireRole(request, reply, ['admin']);
    if (!actor) return;
    if (request.body?.confirmation !== 'RESET ATLAS') return reply.code(400).send({ error: 'Type RESET ATLAS to confirm the factory reset' });
    options.database.factoryReset();
    return reply.code(204).send();
  });
  app.patch<{ Body: { operationalChecksEnabled?: boolean } }>('/api/admin/settings', async (request, reply) => {
    const actor = requireRole(request, reply, ['admin']);
    if (!actor) return;
    if (options.database.listAdminResponsibilityScopes(actor.userId).length > 0) return reply.code(403).send({ error: 'Only global administrators can change organization settings' });
    if (typeof request.body?.operationalChecksEnabled !== 'boolean') return reply.code(400).send({ error: 'operationalChecksEnabled is required' });
    options.database.setOperationalChecksEnabled(request.body.operationalChecksEnabled);
    options.database.writeAuditLog({ userId: actor.userId, action: 'settings.operational_checks_changed', target: `settings/operational-checks/${request.body.operationalChecksEnabled}` });
    return { operationalChecksEnabled: request.body.operationalChecksEnabled };
  });
  app.post('/api/auth/logout', async (request, reply) => {
    const token = readSessionToken(request);
    const session = currentSession(request);
    if (token) options.database.revokeAuthSession(token, new Date().toISOString());
    if (session) options.database.writeAuditLog({ userId: session.userId, action: 'auth.logout', target: `users/${session.userId}` });
    clearSessionCookie(reply);
    return { ok: true };
  });
  app.get('/api/admin/users', async (request, reply) => {
    if (!requireRole(request, reply, ['admin'])) return;
    return { users: options.database.listUsers().map(user => ({ ...publicUser(user), responsibilityScopes: options.database.listAdminResponsibilityScopes(user.id) })) };
  });
  app.get('/api/admin/personnel-link-options', async (request, reply) => {
    if (!requireRole(request, reply, ['admin'])) return;
    const planner = options.database.getPlanner().document;
    options.database.syncResponsibilityUnits(buildResponsibilityUnits(planner.employees));
    const linked = new Set(options.database.listUsers().map(user => user.employeeId).filter((id): id is number => id !== null));
    return { employees: planner.employees.map(employee => ({ id: employee.id, name: employee.name, organisation: employee.organisation, department: employee.department, section: employee.section, linked: linked.has(employee.id) })) };
  });
  app.get('/api/admin/responsibility-units', async (request, reply) => {
    if (!requireRole(request, reply, ['admin'])) return;
    const planner = options.database.getPlanner().document;
    options.database.syncResponsibilityUnits(buildResponsibilityUnits(planner.employees));
    return { units: options.database.listResponsibilityUnits() };
  });
  app.put<{ Params: { userId: string }; Body: { unitPath?: string; includeDescendants?: boolean } }>('/api/admin/users/:userId/responsibility-scopes', async (request, reply) => {
    const actor = requireRole(request, reply, ['admin']);
    if (!actor) return;
    if (options.database.listAdminResponsibilityScopes(actor.userId).length > 0) return reply.code(403).send({ error: 'Only global administrators can manage responsibility scopes' });
    if (!options.database.getUserById(request.params.userId)) return reply.code(404).send({ error: 'User not found' });
    try {
      const scope = options.database.setAdminResponsibilityScope(request.params.userId, request.body?.unitPath ?? '', request.body?.includeDescendants !== false, actor.userId);
      options.database.writeAuditLog({ userId: actor.userId, action: 'admin.responsibility_scope_granted', target: `users/${request.params.userId}/scopes/${scope.id}` });
      return { scope };
    } catch (error) { return reply.code(400).send({ error: error instanceof Error && error.message === 'RESPONSIBILITY_UNIT_NOT_FOUND' ? 'Responsibility unit not found' : 'Could not grant responsibility scope' }); }
  });
  app.delete<{ Params: { userId: string; scopeId: string } }>('/api/admin/users/:userId/responsibility-scopes/:scopeId', async (request, reply) => {
    const actor = requireRole(request, reply, ['admin']);
    if (!actor) return;
    if (options.database.listAdminResponsibilityScopes(actor.userId).length > 0) return reply.code(403).send({ error: 'Only global administrators can manage responsibility scopes' });
    options.database.removeAdminResponsibilityScope(request.params.userId, request.params.scopeId);
    options.database.writeAuditLog({ userId: actor.userId, action: 'admin.responsibility_scope_removed', target: `users/${request.params.userId}/scopes/${request.params.scopeId}` });
    return { ok: true };
  });
  app.post<{ Body: { name?: string; username?: string; email?: string; password?: string; role?: 'admin' | 'planner' | 'viewer' } }>('/api/admin/users', async (request, reply) => {
    const actor = requireRole(request, reply, ['admin']);
    if (!actor) return;
    const { name, username, email, password, role } = request.body ?? {};
    if (!name?.trim() || !username?.trim() || !email?.trim() || !password || password.length < 12 || !role || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) return reply.code(400).send({ error: 'name, username, email, role, and a password of at least 12 characters are required' });
    try {
      const user = options.database.createUser({ name, username, email, password, role });
      options.database.writeAuditLog({ userId: actor.userId, action: 'user.created', target: `users/${user.id}` });
      return reply.code(201).send({ user: publicUser(user) });
    } catch { return reply.code(400).send({ error: 'Could not create user' }); }
  });
  app.put<{ Params: { userId: string }; Body: { employeeId?: number | null } }>('/api/admin/users/:userId/personnel-link', async (request, reply) => {
    const actor = requireRole(request, reply, ['admin']);
    if (!actor) return;
    if (!options.database.getUserById(request.params.userId)) return reply.code(404).send({ error: 'User not found' });
    const employeeId = request.body?.employeeId === null ? null : Number(request.body?.employeeId);
    if (employeeId !== null && (!Number.isInteger(employeeId) || !options.database.getPlanner().document.employees.some(employee => employee.id === employeeId))) return reply.code(400).send({ error: 'Personnel record not found' });
    try {
      options.database.setUserPersonnelLink(request.params.userId, employeeId, actor.userId);
      options.database.writeAuditLog({ userId: actor.userId, action: employeeId === null ? 'user.personnel_unlinked' : 'user.personnel_linked', target: `users/${request.params.userId}` });
      return { ok: true, employeeId };
    } catch { return reply.code(409).send({ error: 'That personnel record is already linked to another account' }); }
  });

  app.get('/api/me/upcoming', async (request, reply) => {
    const session = requireRole(request, reply, ['admin', 'planner', 'viewer']);
    if (!session) return;
    const employeeId = options.database.getUserPersonnelLink(session.userId);
    if (employeeId === null) return { linked: false };
    const planner = options.database.getPlanner().document;
    const employee = planner.employees.find(candidate => candidate.id === employeeId);
    if (!employee) return { linked: false };
    const requestedDays = Number((request.query as { days?: string }).days ?? 14);
    const days = Number.isInteger(requestedDays) ? Math.max(1, Math.min(365, requestedDays)) : 31;
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const dates = Array.from({ length: days }, (_, index) => { const date = new Date(start); date.setDate(start.getDate() + index); return localDate(date); });
    const statuses = new Map((planner.statuses ?? []).map(status => [status.key, status]));
    const activityShifts = (planner.activityShiftsMap ?? {}) as Record<string, Record<string, unknown>>;
    const workwheel = options.database.getWorkwheel().document as { wheels?: Array<{ id?: string; name?: string }>; activities?: Array<{ id?: string; wheelId?: string; title?: string; date?: string; endDate?: string; time?: string; color?: string; status?: string; recurrence?: string; responsibleMode?: string; responsibleId?: string; participantIds?: Array<number | string> }> };
    const wheels = new Map((workwheel.wheels ?? []).map(wheel => [String(wheel.id), wheel]));
    const workwheelMeetingsForDate = (date: string) => (workwheel.activities ?? []).filter(activity => {
      const responsible = activity.responsibleMode !== 'external' && Number(activity.responsibleId) === employeeId;
      const participant = (activity.participantIds ?? []).map(Number).includes(employeeId);
      if (!responsible && !participant) return false;
      return activity.date === date || (activity.endDate && activity.date && date >= activity.date && date <= activity.endDate);
    }).map(activity => ({ id: String(activity.id), wheelId: String(activity.wheelId || ''), wheelName: String(wheels.get(String(activity.wheelId || ''))?.name || 'Workwheel'), title: String(activity.title || 'Meeting'), time: String(activity.time || ''), color: String(activity.color || '#3b82f6'), status: String(activity.status || 'planned'), source: 'workwheel' as const }));
    return {
      linked: true,
      employee: { id: employee.id, name: employee.name, role: employee.role, organisation: employee.organisation, department: employee.department, section: employee.section },
      startDate: dates[0], endDate: dates[dates.length - 1],
      days: dates.map(date => {
        const entryRaw = planner.entriesMap?.[`${employee.id}_${date}`];
        const entry = typeof entryRaw === 'string' ? { status: entryRaw } : entryRaw;
        const status = entry ? statuses.get(entry.status) : undefined;
        const dayActivities = planner.activities.filter(activity => activity.startDate <= date && activity.endDate >= date && activity.participants.some(participant => participant.id === employee.id)).map(activity => {
          const assignment = activityShifts[`${employee.id}_${date}_${activity.id}`];
          return { id: activity.id, name: activity.name, abbreviation: activity.abbreviation, color: activity.color, status: activity.status, assignment: assignment ? { assigned: assignment.assigned === true, excluded: assignment.excluded === true, shift: typeof assignment.shift === 'string' ? assignment.shift : undefined, workCode: assignment.workCode } : undefined };
        });
        return { date, ...(status ? { status: { key: status.key, label: status.label, abbreviation: status.abbr, color: status.color, lifecycle: entry?.lifecycle ?? 'confirmed', durationType: entry?.durationType, time: entry?.time ?? null, isAbsence: status.isAbsence, isOutOfOffice: status.isOutOfOffice } } : {}), activities: dayActivities, workwheelMeetings: workwheelMeetingsForDate(date) };
      }),
    };
  });
  app.get('/api/me/absence-requests', async (request, reply) => {
    const session = requireRole(request, reply, ['admin', 'planner', 'viewer']);
    if (!session) return;
    const employeeId = options.database.getUserPersonnelLink(session.userId);
    return { requests: employeeId === null ? [] : options.database.listAbsenceRequests(employeeId) };
  });
  app.post<{ Body: { statusKey?: string; startDate?: string; endDate?: string; durationType?: 'fullday' | '24hours' | 'time'; timeRange?: string | null } }>('/api/me/absence-requests', async (request, reply) => {
    const session = requireRole(request, reply, ['admin', 'planner', 'viewer']);
    if (!session) return;
    const employeeId = options.database.getUserPersonnelLink(session.userId);
    if (employeeId === null) return reply.code(400).send({ error: 'Your account is not linked to personnel' });
    const planner = options.database.getPlanner().document;
    const status = planner.statuses.find(candidate => candidate.key === request.body?.statusKey && candidate.isAbsence);
    if (!status || !request.body?.startDate || !request.body.endDate || request.body.endDate < request.body.startDate) return reply.code(400).send({ error: 'Valid absence code and date range are required' });
    const requestStatus = (status as typeof status & { requiresApproval?: boolean }).requiresApproval === true ? 'pending' as const : 'approved' as const;
    const absence = options.database.createAbsenceRequest({ requesterUserId: session.userId, employeeId, statusKey: status.key, startDate: request.body.startDate, endDate: request.body.endDate, durationType: request.body.durationType ?? 'fullday', timeRange: request.body.timeRange ?? null, requestStatus });
    options.database.writeAuditLog({ userId: session.userId, action: requestStatus === 'approved' ? 'absence.self_reported' : 'absence.requested', target: `absence-requests/${absence.id}` });
    return reply.code(201).send({ request: absence });
  });
  app.get('/api/admin/absence-requests', async (request, reply) => {
    const actor = requireRole(request, reply, ['admin']);
    if (!actor) return;
    return { requests: options.database.listAbsenceRequests().filter(item => item.requestStatus === 'pending') };
  });
  app.post<{ Params: { id: string }; Body: { decision?: 'approved' | 'declined' } }>('/api/admin/absence-requests/:id/decision', async (request, reply) => {
    const actor = requireRole(request, reply, ['admin']);
    if (!actor || !['approved', 'declined'].includes(request.body?.decision ?? '')) return reply.code(400).send({ error: 'Valid decision is required' });
    const absence = options.database.decideAbsenceRequest(request.params.id, request.body.decision as 'approved' | 'declined', actor.userId);
    if (absence.requestStatus === 'approved') {
      const current = options.database.getPlanner();
      const document = normalizeLegacyPlannerDocument(current.document);
      const entries = { ...document.entriesMap } as Record<string, string | import('@atlas/core').DailyEntry | null>;
      const start = new Date(`${absence.startDate}T00:00:00`);
      const end = new Date(`${absence.endDate}T00:00:00`);
      for (const date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
        const dateKey = localDate(date);
        entries[`${absence.employeeId}_${dateKey}`] = {
          status: absence.statusKey,
          lifecycle: 'confirmed',
          durationType: absence.durationType,
          time: absence.timeRange,
        };
      }
      const documentForSave = { ...document, entriesMap: entries };
      try {
        const saved = options.database.savePlanner(documentForSave, current.revision);
        options.database.recordPlannerChangeEvents([{
          revision: saved.revision,
          occurredAt: new Date().toISOString(),
          actorUserId: actor.userId,
          actorName: actor.name,
          eventType: 'absence.approved',
          resourceKind: 'schedule_cell',
          resourceKey: `${absence.employeeId}_${absence.startDate}:${absence.endDate}`,
          employeeId: absence.employeeId,
          activityId: null,
          date: absence.startDate,
          summary: { status: absence.statusKey, startDate: absence.startDate, endDate: absence.endDate },
        }]);
      } catch (error) {
        if (error instanceof Error && error.message === 'PLANNER_REVISION_CONFLICT') return reply.code(409).send({ error: 'Planner changed while applying the approved absence' });
        return reply.code(500).send({ error: 'Could not apply approved absence to the schedule' });
      }
    }
    options.database.writeAuditLog({ userId: actor.userId, action: `absence.${request.body.decision}`, target: `absence-requests/${absence.id}` });
    return { request: absence };
  });
  app.patch<{ Params: { userId: string }; Body: { name?: string; username?: string; email?: string; password?: string; role?: 'admin' | 'planner' | 'viewer'; disabled?: boolean } }>('/api/admin/users/:userId', async (request, reply) => {
    const actor = requireRole(request, reply, ['admin']);
    if (!actor) return;
    const changes = request.body ?? {};
    if (changes.name !== undefined && !changes.name.trim()) return reply.code(400).send({ error: 'Name cannot be empty' });
    if (changes.username !== undefined && !changes.username.trim()) return reply.code(400).send({ error: 'Username cannot be empty' });
    if (changes.email !== undefined && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(changes.email.trim())) return reply.code(400).send({ error: 'A valid email is required' });
    if (changes.password !== undefined && changes.password.length < 12) return reply.code(400).send({ error: 'Password must be at least 12 characters' });
    try {
      const user = options.database.updateUser(request.params.userId, changes);
      if (changes.password || changes.disabled === true) options.database.revokeAllAuthSessions(user.id, new Date().toISOString());
      options.database.writeAuditLog({ userId: actor.userId, action: 'user.updated', target: `users/${user.id}` });
      return { user: publicUser(user) };
    } catch (error) {
      if (error instanceof Error && error.message === 'FINAL_ADMIN') return reply.code(409).send({ error: 'The final administrator cannot be demoted or deleted' });
      if (error instanceof Error && error.message === 'USER_NOT_FOUND') return reply.code(404).send({ error: 'User not found' });
      return reply.code(400).send({ error: 'Could not update user' });
    }
  });
  app.delete<{ Params: { userId: string } }>('/api/admin/users/:userId', async (request, reply) => {
    const actor = requireRole(request, reply, ['admin']);
    if (!actor) return;
    try {
      options.database.deleteUser(request.params.userId);
      options.database.writeAuditLog({ userId: actor.userId, action: 'user.deleted', target: `users/${request.params.userId}` });
      return { ok: true };
    } catch (error) {
      if (error instanceof Error && error.message === 'FINAL_ADMIN') return reply.code(409).send({ error: 'The final administrator cannot be demoted or deleted' });
      return reply.code(404).send({ error: 'User not found' });
    }
  });
  app.post<{ Params: { userId: string } }>('/api/admin/users/:userId/revoke-sessions', async (request, reply) => {
    const actor = requireRole(request, reply, ['admin']);
    if (!actor) return;
    const user = options.database.getUserById(request.params.userId);
    if (!user) return reply.code(404).send({ error: 'User not found' });
    options.database.revokeAllAuthSessions(user.id, new Date().toISOString());
    options.database.writeAuditLog({ userId: actor.userId, action: 'user.sessions_revoked', target: `users/${user.id}` });
    return { ok: true };
  });

  app.get('/api/planner', async (request, reply) => {
    if (!requireRole(request, reply, ['admin', 'planner', 'viewer'])) return;
    return options.database.getPlanner();
  });
  app.get('/api/planner/export', async (request, reply) => {
    if (!requireRole(request, reply, ['admin', 'planner'])) return;
    const planner = options.database.getPlanner();
    return reply.header('content-type', 'application/json').send(planner.document);
  });
  app.post<{ Body: { document: unknown; expectedRevision: number } }>('/api/planner', async (request, reply) => {
    const actor = requireRole(request, reply, ['admin', 'planner']);
    if (!actor) return;
    const expectedRevision = Number(request.body?.expectedRevision);
    if (!Number.isInteger(expectedRevision) || !('document' in (request.body ?? {}))) {
      return reply.code(400).send({ error: 'document and expectedRevision are required' });
    }
    try {
      const previousDocument = options.database.getPlanner().document;
      const document = { ...normalizeLegacyPlannerDocument(request.body.document), lastChangedByUserId: actor.userId };
      if (actor.role === 'planner' && !plannerUpdateIsOperationalOnly(options.database.getPlanner().document, document)) {
        return reply.code(403).send({ error: 'Users may only change cells and activities' });
      }
      const result = options.database.savePlanner(document, expectedRevision);
      options.database.writeAuditLog({ userId: actor.userId, action: 'planner.updated', target: 'planner/default' });
      options.database.recordPlannerChangeEvents(diffPlannerChanges(previousDocument, document, result.revision, actor.userId, actor.name));
      return result;
    } catch (error) {
      if (error instanceof Error && error.message === 'PLANNER_REVISION_CONFLICT') {
        return reply.code(409).send({ error: 'Planner has changed on the server', current: options.database.getPlanner() });
      }
      return reply.code(400).send({ error: error instanceof Error ? error.message : 'Invalid planner document' });
    }
  });
  app.post<{ Body: { workwheelActivityId?: string; expectedPlannerRevision?: number } }>('/api/workwheel/publish-to-schedule', async (request, reply) => {
    const actor = requireRole(request, reply, ['admin', 'planner']);
    if (!actor) return;
    const workwheel = options.database.getWorkwheel().document as { activities?: Array<Record<string, unknown>>; wheels?: Array<Record<string, unknown>> };
    const activity = (workwheel.activities ?? []).find(item => String(item.id) === String(request.body?.workwheelActivityId));
    if (!activity) return reply.code(404).send({ error: 'Workwheel activity not found' });
    const planner = options.database.getPlanner();
    const linkedIdValue = activity.linkedScheduleActivityId;
    const linkedId = linkedIdValue === null || linkedIdValue === undefined ? null : Number(linkedIdValue);
    const nextActivityId = Number(planner.document.nextActId ?? 1);
    const participants = Array.isArray(activity.participantIds) ? activity.participantIds.map(id => ({ id: Number(id) })).filter(item => Number.isFinite(item.id)) : [];
    const linkedScheduleActivity = linkedId !== null && Number.isInteger(linkedId) && linkedId >= 0 ? planner.document.activities.find(item => item.id === linkedId) : undefined;
    const scheduleActivityId = linkedScheduleActivity && linkedScheduleActivity.name !== String(activity.title || 'Workwheel activity') ? nextActivityId : (linkedScheduleActivity?.id ?? nextActivityId);
    const scheduleActivity = { id: scheduleActivityId, workwheelActivityId: String(activity.id), source: 'workwheel', name: String(activity.title || 'Workwheel activity'), abbreviation: String(activity.title || 'Activity').slice(0, 6).toUpperCase(), startDate: String(activity.date || ''), endDate: activity.recurrence && activity.recurrence !== 'none' ? String(activity.date || '') : String(activity.endDate || activity.date || ''), color: String(activity.color || '#3b82f6'), status: (activity.status === 'cancelled' ? 'cancelled' : 'confirmed') as 'cancelled' | 'confirmed', participants };
    const activities = [...planner.document.activities.filter(item => item.id !== scheduleActivity.id), scheduleActivity];
    const activityShiftsMap = { ...((planner.document.activityShiftsMap as Record<string, unknown> | undefined) || {}) };
    const assignmentStart = new Date(`${scheduleActivity.startDate}T00:00:00`);
    const assignmentEnd = new Date(`${scheduleActivity.endDate}T00:00:00`);
    for (const participant of participants) {
      for (const cursor = new Date(assignmentStart); cursor <= assignmentEnd; cursor.setDate(cursor.getDate() + 1)) {
        const date = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;
        activityShiftsMap[`${participant.id}_${date}_${scheduleActivity.id}`] = { shift: 'normal', workCodeId: null, administrativeTime: '', staffingImpactOverride: null, assigned: true, excluded: false };
      }
    }
    const document = { ...planner.document, activities, activityShiftsMap, nextActId: Math.max(Number(planner.document.nextActId || 1), scheduleActivity.id + 1), lastChangedByUserId: actor.userId };
    const result = options.database.savePlanner(document, planner.revision);
    const updatedWorkwheel = { ...workwheel, activities: (workwheel.activities ?? []).map(item => String(item.id) === String(activity.id) ? { ...item, linkedScheduleActivityId: scheduleActivity.id } : item) };
    const savedWorkwheel = options.database.saveWorkwheel(updatedWorkwheel, options.database.getWorkwheel().revision);
    options.database.writeAuditLog({ userId: actor.userId, action: 'workwheel.published_to_schedule', target: `workwheel/${activity.id}/schedule/${scheduleActivity.id}` });
    return { planner: result, workwheel: savedWorkwheel, scheduleActivity };
  });
  app.get('/api/admin/change-review', async (request, reply) => {
    const actor = requireRole(request, reply, ['admin']);
    if (!actor) return;
    const acknowledged = new Set(options.database.listAcknowledgedPlannerEvents(actor.userId));
    return { events: options.database.listPlannerChangeEvents(100).map(event => ({ ...event, acknowledged: acknowledged.has(event.id) })) };
  });
  app.post<{ Body: { eventId?: number } }>('/api/admin/change-review/acknowledge', async (request, reply) => {
    const actor = requireRole(request, reply, ['admin']);
    if (!actor || !Number.isInteger(request.body?.eventId)) return reply.code(400).send({ error: 'eventId is required' });
    const eventId = request.body.eventId as number;
    options.database.acknowledgePlannerChangeEvent(actor.userId, eventId);
    options.database.writeAuditLog({ userId: actor.userId, action: 'change_review.acknowledged', target: `planner-change/${eventId}` });
    return { ok: true };
  });
  app.delete<{ Params: { eventId: string } }>('/api/admin/change-review/acknowledge/:eventId', async (request, reply) => {
    const actor = requireRole(request, reply, ['admin']);
    if (!actor) return;
    const eventId = Number(request.params.eventId);
    if (!Number.isInteger(eventId)) return reply.code(400).send({ error: 'Invalid eventId' });
    options.database.unacknowledgePlannerChangeEvent(actor.userId, eventId);
    return { ok: true };
  });
  app.get<{ Querystring: { employeeId?: string; date?: string; subjectKind?: 'schedule_cell' | 'absence_request'; subjectKey?: string } }>('/api/admin/operational-checks', async (request, reply) => {
    const actor = requireRole(request, reply, ['admin']);
    if (!actor) return;
    if (!request.query.employeeId && !request.query.date && !request.query.subjectKind && !request.query.subjectKey) {
      return { checks: options.database.listOperationalChecks() };
    }
    const employeeId = Number(request.query.employeeId);
    if (!Number.isInteger(employeeId) || !request.query.date || !request.query.subjectKind || !request.query.subjectKey) return reply.code(400).send({ error: 'employeeId, date, subjectKind, and subjectKey are required' });
    if (!adminCanCheckEmployee(options.database, actor.userId, employeeId)) return reply.code(403).send({ error: 'Employee is outside your responsibility scope' });
    return { check: options.database.getOperationalCheck(employeeId, request.query.date, request.query.subjectKind, request.query.subjectKey) };
  });
  app.put<{ Body: { employeeId?: number; date?: string; subjectKind?: 'schedule_cell' | 'absence_request'; subjectKey?: string } }>('/api/admin/operational-checks', async (request, reply) => {
    const actor = requireRole(request, reply, ['admin']);
    if (!actor) return;
    if (!options.database.getOperationalChecksEnabled()) return reply.code(403).send({ error: 'Operational checks are disabled for this organization' });
    const employeeId = Number(request.body?.employeeId);
    if (!Number.isInteger(employeeId) || !request.body?.date || !request.body.subjectKind || !request.body.subjectKey) return reply.code(400).send({ error: 'employeeId, date, subjectKind, and subjectKey are required' });
    if (!adminCanCheckEmployee(options.database, actor.userId, employeeId)) return reply.code(403).send({ error: 'Employee is outside your responsibility scope' });
    try {
      const check = options.database.setOperationalCheck(employeeId, request.body.date, request.body.subjectKind, request.body.subjectKey, actor.userId);
      options.database.writeAuditLog({ userId: actor.userId, action: 'operational_check.created', target: `${request.body.subjectKind}/${request.body.subjectKey}` });
      return { check };
    } catch { return reply.code(400).send({ error: 'Could not check off this entry' }); }
  });
  app.delete<{ Querystring: { employeeId?: string; date?: string; subjectKind?: 'schedule_cell' | 'absence_request'; subjectKey?: string } }>('/api/admin/operational-checks', async (request, reply) => {
    const actor = requireRole(request, reply, ['admin']);
    if (!actor) return;
    if (!options.database.getOperationalChecksEnabled()) return reply.code(403).send({ error: 'Operational checks are disabled for this organization' });
    const employeeId = Number(request.query.employeeId);
    if (!Number.isInteger(employeeId) || !request.query.date || !request.query.subjectKind || !request.query.subjectKey) return reply.code(400).send({ error: 'employeeId, date, subjectKind, and subjectKey are required' });
    if (!adminCanCheckEmployee(options.database, actor.userId, employeeId)) return reply.code(403).send({ error: 'Employee is outside your responsibility scope' });
    options.database.revokeOperationalCheck(employeeId, request.query.date, request.query.subjectKind, request.query.subjectKey);
    options.database.writeAuditLog({ userId: actor.userId, action: 'operational_check.revoked', target: `${request.query.subjectKind}/${request.query.subjectKey}` });
    return { ok: true };
  });
  app.post<{ Body: { document: unknown } }>('/api/planner/import/legacy/dry-run', async (request, reply) => {
    if (!requireRole(request, reply, ['admin'])) return;
    try {
      const document = normalizeLegacyPlannerDocument(request.body?.document);
      return { valid: true, document, warnings: [] };
    } catch (error) {
      return reply.code(400).send({ valid: false, error: error instanceof Error ? error.message : 'Invalid planner document' });
    }
  });


  const clientDistPath = options.clientDistPath;
  if (clientDistPath !== undefined && existsSync(clientDistPath)) {
    void app.register(fastifyStatic, {
      root: resolve(clientDistPath),
      wildcard: false,
    });
    app.setNotFoundHandler((request, reply) => {
      if (request.raw.url?.startsWith('/api/')) {
        return reply.code(404).send({ error: 'Not found' });
      }
      return reply.sendFile('index.html');
    });
  }

  app.addHook('onClose', () => {
    options.database.close();
  });

  return app;
}

function publicUser(user: { id: string; name: string; username?: string; email?: string; role: string; disabled: boolean; employeeId: number | null; createdAt?: string }) {
  return { id: user.id, name: user.name, username: user.username, email: user.email, role: user.role, disabled: user.disabled, employeeId: user.employeeId, ...(user.createdAt ? { createdAt: user.createdAt } : {}) };
}

function localDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function buildResponsibilityUnits(employees: readonly { organisation?: string; department?: string; section?: string; process?: string; team?: string }[]): Array<import('./db.js').ResponsibilityUnitRecord> {
  type MutableUnit = { id: string; parentId: string | null; kind: 'organisation' | 'department' | 'section' | 'process' | 'team'; name: string; path: string };
  const units = new Map<string, MutableUnit>();
  for (const employee of employees) {
    let parentPath: string | null = null;
    const levels = [
      ['organisation', employee.organisation], ['department', employee.department], ['section', employee.section], ['process', employee.process], ['team', employee.team],
    ] as const;
    for (const [kind, rawName] of levels) {
      const name = String(rawName || '').trim();
      if (!name) continue;
      const path: string = parentPath ? `${parentPath} / ${name}` : name;
      if (!units.has(path)) units.set(path, { id: randomUnitId(path), parentId: null, kind, name, path });
      parentPath = path;
    }
  }
  const ordered = [...units.values()].sort((a, b) => a.path.length - b.path.length);
  const ids = new Map<string, string>();
  for (const unit of ordered) {
    const parentPath = unit.path.includes(' / ') ? unit.path.slice(0, unit.path.lastIndexOf(' / ')) : null;
    const id = ids.get(unit.path) ?? unit.id;
    ids.set(unit.path, id);
    unit.parentId = parentPath ? (ids.get(parentPath) ?? null) : null;
  }
  return ordered;
}

function adminCanCheckEmployee(database: import('./db.js').AtlasDatabase, userId: string, employeeId: number): boolean {
  const planner = database.getPlanner().document;
  const employee = planner.employees.find(candidate => candidate.id === employeeId);
  if (!employee) return false;
  const scopes = database.listAdminResponsibilityScopes(userId);
  if (!scopes.length) return true;
  return scopes.some(scope => scope.includeDescendants && employeePath(employee).startsWith(`${scope.unitPath} / `) || employeePath(employee) === scope.unitPath);
}

function employeePath(employee: { organisation?: string; department?: string; section?: string; process?: string; team?: string }): string {
  return [employee.organisation, employee.department, employee.section, employee.process, employee.team].map(value => String(value || '').trim()).filter(Boolean).join(' / ');
}

function randomUnitId(path: string): string {
  return `unit-${Buffer.from(path).toString('base64url')}`;
}

const plannerOperationalFields = new Set([
  'savedAt', 'entriesMap', 'activities', 'activityShiftsMap', 'cellNotesMap',
  'overtimeMap', 'workScheduleChecksMap', 'shiftRotationMap',
]);

function plannerUpdateIsOperationalOnly(current: Record<string, unknown>, next: Record<string, unknown>): boolean {
  const keys = new Set([...Object.keys(current), ...Object.keys(next)]);
  for (const key of keys) {
    if (plannerOperationalFields.has(key)) continue;
    if (JSON.stringify(current[key]) !== JSON.stringify(next[key])) return false;
  }
  return true;
}

function diffPlannerChanges(previous: import('@atlas/core').PlannerDocument, next: import('@atlas/core').PlannerDocument, revision: number, actorUserId: string, actorName: string): Array<Omit<import('./db.js').PlannerChangeEventRecord, 'id'>> {
  const events: Array<Omit<import('./db.js').PlannerChangeEventRecord, 'id'>> = [];
  const now = new Date().toISOString();
  const previousEntries = previous.entriesMap ?? {};
  const nextEntries = next.entriesMap ?? {};
  const keys = new Set([...Object.keys(previousEntries), ...Object.keys(nextEntries)]);
  for (const key of keys) {
    if (JSON.stringify(previousEntries[key]) === JSON.stringify(nextEntries[key])) continue;
    const match = key.match(/^(\d+)_(\d{4}-\d{2}-\d{2})$/);
    const employeeId = match ? Number(match[1]) : null;
    const date: string | null = match?.[2] ?? null;
    const nextEntry = normalizeEntrySummary(nextEntries[key]);
    const previousEntry = normalizeEntrySummary(previousEntries[key]);
    const activityNames = next.activities.filter(activity => activity.participants.some(participant => participant.id === employeeId && date && date >= activity.startDate && date <= activity.endDate)).map(activity => activity.name);
    events.push({ revision, occurredAt: now, actorUserId, actorName, eventType: previousEntries[key] == null ? 'schedule_cell.created' : nextEntries[key] == null ? 'schedule_cell.cleared' : 'schedule_cell.updated', resourceKind: 'schedule_cell', resourceKey: key, employeeId, activityId: null, date, summary: { changed: true, status: nextEntry?.status ?? previousEntry?.status ?? null, lifecycle: nextEntry?.lifecycle ?? previousEntry?.lifecycle ?? null, durationType: nextEntry?.durationType ?? previousEntry?.durationType ?? null, time: nextEntry?.time ?? previousEntry?.time ?? null, activityNames } });
  }
  const previousActivities = new Map(previous.activities.map(activity => [activity.id, activity]));
  const nextActivities = new Map(next.activities.map(activity => [activity.id, activity]));
  const activityIds = new Set([...previousActivities.keys(), ...nextActivities.keys()]);
  for (const id of activityIds) {
    const before = previousActivities.get(id);
    const after = nextActivities.get(id);
    if (JSON.stringify(before) === JSON.stringify(after)) continue;
    const activityName = after?.name ?? before?.name ?? '';
    events.push({ revision, occurredAt: now, actorUserId, actorName, eventType: !before ? 'activity.created' : !after ? 'activity.deleted' : 'activity.updated', resourceKind: 'activity', resourceKey: `activity:${id}`, employeeId: null, activityId: id, date: after?.startDate ?? before?.startDate ?? null, summary: { name: activityName, status: after?.status ?? before?.status ?? 'unknown' } });
    if (before && after) {
      const beforeParticipants = new Set(before.participants.map(participant => participant.id));
      const afterParticipants = new Set(after.participants.map(participant => participant.id));
      for (const employeeId of afterParticipants) {
        if (!beforeParticipants.has(employeeId)) events.push({ revision, occurredAt: now, actorUserId, actorName, eventType: 'activity.participant_added', resourceKind: 'activity_participant', resourceKey: `activity:${id}/employee:${employeeId}`, employeeId, activityId: id, date: after.startDate, summary: { name: activityName, activityName, employeeId } });
      }
      for (const employeeId of beforeParticipants) {
        if (!afterParticipants.has(employeeId)) events.push({ revision, occurredAt: now, actorUserId, actorName, eventType: 'activity.participant_removed', resourceKind: 'activity_participant', resourceKey: `activity:${id}/employee:${employeeId}`, employeeId, activityId: id, date: after.startDate, summary: { name: activityName, activityName, employeeId } });
      }
    }
  }
  return events;
}

function normalizeEntrySummary(value: unknown): { status?: string; lifecycle?: string; durationType?: string; time?: string | null } | null {
  if (typeof value === 'string') return { status: value };
  if (!value || typeof value !== 'object') return null;
  const entry = value as Record<string, unknown>;
  const result: { status?: string; lifecycle?: string; durationType?: string; time?: string | null } = { time: typeof entry.time === 'string' ? entry.time : null };
  if (typeof entry.status === 'string') result.status = entry.status;
  if (typeof entry.lifecycle === 'string') result.lifecycle = entry.lifecycle;
  if (typeof entry.durationType === 'string') result.durationType = entry.durationType;
  return result;
}
