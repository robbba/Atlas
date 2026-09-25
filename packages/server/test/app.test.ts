import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { buildApp } from '../src/app.ts';
import { openDatabase } from '../src/db.ts';

test('hosted setup, login, and protected planner access', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'atlas-app-'));
  const database = openDatabase({ filename: join(directory, 'atlas.db') });
  const app = buildApp({ database });
  try {
    const status = await app.inject({ method: 'GET', url: '/api/auth/bootstrap-status' });
    assert.deepEqual(status.json(), { setupRequired: true });
    assert.equal((await app.inject({ method: 'GET', url: '/api/planner' })).statusCode, 401);

    const setup = await app.inject({
      method: 'POST',
      url: '/api/setup/create-admin',
      payload: { name: 'Ada Lovelace', username: 'ada', email: 'ada@example.test', password: 'correct horse battery staple' },
    });
    assert.equal(setup.statusCode, 201);
    assert.equal(setup.json().user.role, 'admin');
    assert.equal(setup.json().user.password, undefined);

    const login = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { username: 'ada', password: 'correct horse battery staple' },
    });
    assert.equal(login.statusCode, 200);
    const cookie = login.headers['set-cookie'];
    assert.ok(cookie?.toString().includes('HttpOnly'));
    assert.ok(cookie?.toString().includes('SameSite=Strict'));

    const planner = await app.inject({
      method: 'GET',
      url: '/api/planner',
      headers: { cookie: cookie!.toString().split(';')[0] },
    });
    assert.equal(planner.statusCode, 200);

    const secondSetup = await app.inject({
      method: 'POST',
      url: '/api/setup/create-admin',
      payload: { name: 'Grace Hopper', username: 'grace', email: 'grace@example.test', password: 'another correct password' },
    });
    assert.equal(secondSetup.statusCode, 409);
  } finally {
    await app.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

test('responsibility-scoped admins can change application settings', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'atlas-settings-'));
  const database = openDatabase({ filename: join(directory, 'atlas.db') });
  const app = buildApp({ database });
  try {
    const setup = await app.inject({
      method: 'POST',
      url: '/api/setup/create-admin',
      payload: { name: 'Global Admin', username: 'global', email: 'global@example.test', password: 'correct horse battery staple' },
    });
    assert.equal(setup.statusCode, 201);

    const scopedAdmin = database.createUser({
      name: 'Scoped Admin', username: 'scoped', email: 'scoped@example.test', password: 'another correct password', role: 'admin',
    });
    database.syncResponsibilityUnits([{ id: 'unit-cisb-reitan', parentId: null, kind: 'organisation', name: 'CISBn Reitan / JTCC', path: 'CISBn Reitan / JTCC' }]);
    database.setAdminResponsibilityScope(scopedAdmin.id, 'CISBn Reitan / JTCC', true, setup.json().user.id);
    database.createUser({
      name: 'Planner', username: 'planner', email: 'planner@example.test', password: 'planner correct password', role: 'planner',
    });

    const login = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { username: 'scoped', password: 'another correct password' },
    });
    assert.equal(login.statusCode, 200);
    const cookie = login.headers['set-cookie']!.toString().split(';')[0];

    const update = await app.inject({
      method: 'PATCH',
      url: '/api/admin/settings',
      headers: { cookie },
      payload: { operationalChecksEnabled: false },
    });
    assert.equal(update.statusCode, 200);
    assert.deepEqual(update.json(), { operationalChecksEnabled: false });
    assert.equal(database.getOperationalChecksEnabled(), false);

    const plannerLogin = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { username: 'planner', password: 'planner correct password' },
    });
    const plannerCookie = plannerLogin.headers['set-cookie']!.toString().split(';')[0];
    const forbidden = await app.inject({
      method: 'PATCH',
      url: '/api/admin/settings',
      headers: { cookie: plannerCookie },
      payload: { operationalChecksEnabled: true },
    });
    assert.equal(forbidden.statusCode, 403);
  } finally {
    await app.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

test('My schedule expands weekly Workwheel events only on their weekly occurrence date', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'atlas-upcoming-'));
  const database = openDatabase({ filename: join(directory, 'atlas.db') });
  const app = buildApp({ database });
  try {
    const setup = await app.inject({
      method: 'POST',
      url: '/api/setup/create-admin',
      payload: { name: 'Ada Lovelace', username: 'ada', email: 'ada@example.test', password: 'correct horse battery staple' },
    });
    assert.equal(setup.statusCode, 201);
    const adminId = setup.json().user.id as string;
    const employee = { id: 10, name: 'Ada Lovelace', role: 'Planner', email: 'ada@example.test' };
    database.setUserPersonnelLink(adminId, employee.id, adminId);
    const planner = database.getPlanner();
    const document = {
      ...planner.document,
      employees: [employee],
    };
    database.savePlanner(document, planner.revision);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const occurrenceDates = Array.from({ length: 20 }, (_, offset) => {
      const date = new Date(today);
      date.setDate(today.getDate() + offset);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    });
    const weeklyStart = occurrenceDates[0];
    const weeklyWeekday = (new Date(`${weeklyStart}T00:00:00`).getDay() + 2) % 7;
    const futureStartDate = new Date(`${weeklyStart}T00:00:00`);
    futureStartDate.setDate(futureStartDate.getDate() + 2);
    const futureStart = `${futureStartDate.getFullYear()}-${String(futureStartDate.getMonth() + 1).padStart(2, '0')}-${String(futureStartDate.getDate()).padStart(2, '0')}`;
    const futureWeekday = (futureStartDate.getDay() + 1) % 7;
    const saveWorkwheel = database.saveWorkwheel as (value: Readonly<Record<string, unknown>>, revision: number) => { revision: number };
    saveWorkwheel({
      version: 1,
      wheels: [{ id: 'wheel-1', name: 'Team wheel' }],
      activities: [
        { id: 'weekly-1', wheelId: 'wheel-1', title: 'Weekly coordination', date: weeklyStart, endDate: occurrenceDates[12], recurrence: 'weekly', weekday: weeklyWeekday, participantIds: [employee.id], status: 'confirmed' },
        { id: 'future-weekly', wheelId: 'wheel-1', title: 'Future weekday coordination', date: futureStart, endDate: occurrenceDates[12], recurrence: 'weekly', weekday: futureWeekday, participantIds: [employee.id], status: 'confirmed' },
      ],
      availableActivities: [],
    }, database.getWorkwheel().revision);

    const cookie = setup.headers['set-cookie']!.toString().split(';')[0];
    const response = await app.inject({ method: 'GET', url: '/api/me/upcoming?days=20', headers: { cookie } });
    assert.equal(response.statusCode, 200);
    const data = response.json() as { days: Array<{ date: string; workwheelMeetings: Array<{ id: string }> }> };
    const meetingDates = data.days.filter(day => day.workwheelMeetings.some(meeting => meeting.id === 'weekly-1')).map(day => day.date);
    assert.deepEqual(meetingDates, [occurrenceDates[2], occurrenceDates[9]]);
    const futureMeetingDates = data.days.filter(day => day.workwheelMeetings.some(meeting => meeting.id === 'future-weekly')).map(day => day.date);
    assert.deepEqual(futureMeetingDates, [occurrenceDates[3], occurrenceDates[10]]);
  } finally {
    await app.close();
    rmSync(directory, { recursive: true, force: true });
  }
});
