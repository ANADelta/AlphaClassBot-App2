// PM2 ecosystem configuration for AlphaClassBot
module.exports = {
  apps: [
    {
      name: 'alphaclassbot-app2',
      script: 'npx',
      args: 'wrangler pages dev dist --d1=alphaclassbot-production --local --ip 0.0.0.0 --port 3000',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      watch: false, // Disable PM2 file monitoring (wrangler handles hot reload)
      instances: 1, // Development mode uses only one instance
      exec_mode: 'fork',
      restart_delay: 2000,
      max_restarts: 5,
      min_uptime: '10s'
    }
  ]
}