// PM2 process configuration for the SDAN / sydan.org Next.js site.
// The port comes from the PORT environment variable (chosen by
// deploy/provision.sh so it never collides with other apps on the server).
// It falls back to 3100 if PORT isn't set.
const PORT = process.env.PORT || 3100;

module.exports = {
  apps: [
    {
      name: "sydan",
      // Runs the production Next.js server (package.json "start" => "next start").
      // `next start` reads the PORT env var, so we don't hard-code -p.
      script: "node_modules/next/dist/bin/next",
      args: "start",
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",
        PORT: PORT,
      },
      // Logs (viewable with: pm2 logs sydan)
      out_file: "./logs/out.log",
      error_file: "./logs/error.log",
      merge_logs: true,
      time: true,
    },
  ],
};
