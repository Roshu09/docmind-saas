module.exports = {
  apps: [
    {
      name: 'aifi-api',
      cwd: '/home/ubuntu/aifi/apps/api',
      script: 'server.js',
      env_file: '/home/ubuntu/aifi/.env',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '400M',
    },
    {
      name: 'aifi-worker',
      cwd: '/home/ubuntu/aifi/apps/worker',
      script: 'src/index.js',
      env_file: '/home/ubuntu/aifi/.env',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
    }
  ]
}
