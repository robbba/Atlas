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
