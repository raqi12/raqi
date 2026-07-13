const path = require('path');

const root = __dirname;
const apiDir = path.join(root, 'api');
const envFile = path.join(root, '.env');

/** @type {import('pm2').StartOptions} */
module.exports = {
  apps: [
    {
      name: 'raqi-api',
      cwd: apiDir,
      script: 'dist/main.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      node_args: `--env-file=${envFile}`,
      error_file: path.join(root, 'logs/api-error.log'),
      out_file: path.join(root, 'logs/api-out.log'),
      merge_logs: true,
      time: true,
    },
  ],
};
