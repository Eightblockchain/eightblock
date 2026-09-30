const path = require('path');

const root = __dirname;
const frontendPort = process.env.FRONTEND_PORT || 3006;
const adminPort = process.env.ADMIN_PORT || 3007;

const shared = {
  instances: 2,
  exec_mode: 'cluster',
  env: {
    NODE_ENV: 'production',
  },
  log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
  merge_logs: true,
  max_memory_restart: '1G',
  min_uptime: '10s',
  max_restarts: 10,
  autorestart: true,
  watch: false,
};

module.exports = {
  apps: [
    {
      ...shared,
      name: 'eightblock-backend',
      cwd: path.join(root, 'backend'),
      script: 'dist/server.js',
      // The server calls process.send('ready') once listening; reloads wait for it.
      wait_ready: true,
      listen_timeout: 15000,
      kill_timeout: 12000,
      error_file: path.join(root, 'logs/backend-error.log'),
      out_file: path.join(root, 'logs/backend-out.log'),
    },
    {
      ...shared,
      name: 'eightblock-frontend',
      cwd: path.join(root, 'frontend'),
      script: 'node_modules/next/dist/bin/next',
      args: `start -p ${frontendPort}`,
      listen_timeout: 15000,
      kill_timeout: 10000,
      error_file: path.join(root, 'logs/frontend-error.log'),
      out_file: path.join(root, 'logs/frontend-out.log'),
    },
    {
      ...shared,
      // Only admins use it, so one instance is plenty.
      instances: 1,
      name: 'eightblock-admin',
      cwd: path.join(root, 'admin'),
      script: 'node_modules/next/dist/bin/next',
      args: `start -p ${adminPort}`,
      listen_timeout: 15000,
      kill_timeout: 10000,
      error_file: path.join(root, 'logs/admin-error.log'),
      out_file: path.join(root, 'logs/admin-out.log'),
    },
  ],
};
