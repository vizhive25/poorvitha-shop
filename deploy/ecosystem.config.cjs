// PM2 process file: keeps the shop running, restarts it after a crash or a server reboot.
module.exports = {
  apps: [{
    name: "poorvitha-shop",
    cwd: "/var/www/poorvitha",
    script: "node_modules/next/dist/bin/next",
    args: "start -p 3000 -H 127.0.0.1",   // only Nginx (on this machine) can reach it
    env: { NODE_ENV: "production" },
    max_memory_restart: "700M",
    autorestart: true,
  }],
};
