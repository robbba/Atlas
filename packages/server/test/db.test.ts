import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { openDatabase } from '../src/db.ts';

test('initializes a WAL-backed and idempotent SQLite schema', () => {
  const directory = mkdtempSync(join(tmpdir(), 'atlas-db-'));
  const filename = join(directory, 'atlas.db');
  try {
    const first = openDatabase({ filename });
    assert.equal(first.getJournalMode(), 'wal');
    first.upsertUser({ id: 'user-1', externalId: null, name: 'Ada', role: 'admin' });
    first.writeAuditLog({ userId: 'user-1', action: 'user.created', target: 'users/user-1' });
    assert.equal(first.listAuditLogs().length, 1);
    first.close();

    const second = openDatabase({ filename });
    assert.equal(second.listAuditLogs().length, 1);
    second.close();
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
