import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../../', import.meta.url));
for (const args of [
  ['--test', 'tests/site-mode.test.cjs', 'tools/website/media-performance.test.mjs', 'tools/website/monster-takeover.test.mjs'],
  ['tools/website/verify-email.mjs']
]) {
  const result = spawnSync(process.execPath, args, { cwd: root, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}
