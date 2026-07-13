#!/usr/bin/env node
/**
 * Fail fast when production node_modules is incomplete (common after rsync without npm ci).
 */
const required = [
  '@nestjs/platform-socket.io',
  'socket.io',
  '@nestjs/websockets',
  '@nestjs/swagger',
  'mongoose',
];

const missing = required.filter((name) => {
  try {
    require.resolve(name);
    return false;
  } catch {
    return true;
  }
});

if (missing.length > 0) {
  console.error(
    `[raqi] Missing production dependencies: ${missing.join(', ')}\n` +
      'Run in the api directory: npm ci --omit=dev',
  );
  process.exit(1);
}

console.log('[raqi] Production dependencies OK');
