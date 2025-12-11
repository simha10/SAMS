module.exports = {
  apps: [
    {
      name: 'sams-frontend',
      script: 'pnpm',
      args: 'run preview',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production'
      },
      env_development: {
        NODE_ENV: 'development'
      },
      // Restart app if it uses more than 512MB of memory
      max_memory_restart: '512M',
      // Logging
      error_file: './logs/frontend-err.log',
      out_file: './logs/frontend-out.log',
      log_file: './logs/frontend-combined.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      // Watch for changes in development
      watch: process.env.NODE_ENV === 'development',
      // Delay between restarts
      restart_delay: 1000,
      // Graceful shutdown
      kill_timeout: 5000,
      // Auto-restart on crashes
      autorestart: true,
      // Merge logs
      combine_logs: true
    }
  ]
};