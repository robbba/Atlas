import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { buildApp } from './app.js';
import { openDatabase } from './db.js';

const moduleDirectory = dirname(fileURLToPath(import.meta.url));
const port = Number.parseInt(process.env.PORT ?? '3000', 10);
const clientDistPath = process.env.ATLAS_CLIENT_DIST_PATH
  ?? resolve(moduleDirectory, '../../../apps/team-manager');
const database = openDatabase();
const app = buildApp({
  database,
  clientDistPath,
});

try {
  await app.listen({ port, host: '0.0.0.0' });
} catch (error) {
  app.log.error(error);
  await app.close();
  process.exitCode = 1;
}
