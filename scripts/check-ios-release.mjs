import { loadEnv } from 'vite';
const env = loadEnv('production', process.cwd(), 'VITE_');
const failures = [];
for (const key of ['VITE_AUTH0_DOMAIN', 'VITE_AUTH0_NATIVE_CLIENT_ID', 'VITE_AUTH0_AUDIENCE', 'VITE_SCANNER_API']) {
  if (!env[key] || /your-|example/.test(env[key])) failures.push(`${key} must be configured`);
}
try {
  const url = new URL(env.VITE_SCANNER_API);
  if (url.protocol !== 'https:' || ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) failures.push('Scanner must use a deployed HTTPS endpoint');
} catch { failures.push('Scanner URL is invalid'); }
if (env.VITE_APPLE_AUTH0_CONNECTION !== 'apple') failures.push('Enable the Apple connection before release');
if (env.VITE_APP_EXPERIENCE === 'legacy') failures.push('The native build must use the phone experience');
if (failures.length) {
  console.error('iOS release configuration incomplete:\n- ' + failures.join('\n- '));
  process.exitCode = 1;
} else console.log('Build settings passed. Complete the device and service checks in IOS_HANDOFF.md before upload.');
