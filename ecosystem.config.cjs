module.exports = {
  apps: [
    {
      name: 'removation',
      script: 'node_modules/.bin/next',
      args: 'start',
      cwd: '/home/nikhil/Documents/Remo2/Removation_3',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '4G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      node_args: '--max-old-space-size=4096 --expose-gc',
    },
  ],
}
