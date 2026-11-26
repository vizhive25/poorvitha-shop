# Deploying Poorvitha Mobiles

The shop uses a **MySQL database** for everything that must not be lost: orders, products, staff, activity log **and photos uploaded in the admin**. The app folder itself holds only code, so redeploying never loses data.

There are two ways to host it:

| | **A. Hostinger "Unlimited" (managed Node.js web app)** | **B. VPS (Ubuntu server)** |
|---|---|---|
| Cost | Lowest | Higher (and you maintain the server) |
| Effort | Click-through setup, deploy from GitHub | Server commands (Nginx, PM2, MySQL) |
| Good for | This shop | This shop, or anything needing full control |

> **Keep any trading/algo code on a separate server.** Never on this machine.

---

# Route A: Hostinger Unlimited (Node.js web app)

Based on Hostinger's written answers (21 Nov 2026): Node 18/20/22/24 supported, custom build commands supported, Prisma + MySQL supported (host `127.0.0.1`, port `3306`), no terminal `npm`, no root. **Runtime files in the app folder are not durable, which is why everything is in MySQL.**

### A1. Before you pay
1. On Hostinger's checkout, confirm the plan is **Unlimited with Web Apps (Node.js)** and the price you expect (₹4,776 for 24 months **before GST** when I checked). Take a screenshot.
2. Prefer 24 months and claim the **free domain `poorvithamobiles.com`** (free for year 1; renews around ₹1,499 + GST). Refunding the hosting within 30 days may deduct the domain's price.

### A2. Code on GitHub
```bash
local> git init && git add -A && git commit -m "Poorvitha Mobiles"
local> # create a PRIVATE repo on GitHub, then:
local> git remote add origin https://github.com/YOUR-ACCOUNT/poorvitha-shop.git && git push -u origin main
```
`.gitignore` already excludes `.env`, `node_modules` and `.next`. **Never commit real keys.**

### A3. Create the database
hPanel → **Databases → MySQL Databases** → create a database + user. Note the names and the password. The app connects with:
```
mysql://DBUSER:DBPASSWORD@127.0.0.1:3306/DBNAME
```
(If the password contains `@ : / ? # %`, URL-encode it, e.g. `@` → `%40`.)

### A4. Create the Node.js web app
hPanel → **Websites → Add website → Node.js web app** → connect GitHub → pick the repo and branch. Then:

| Setting | Value |
|---|---|
| Framework | Next.js (auto-detected) |
| Node.js version | 22.x |
| Build command | `npx prisma migrate deploy && npm run build` |
| Start | the Next.js preset's default (`npm start`) |

**Environment variables** (hPanel → the app → Environment variables). Fill these in; full list in `.env.production.example`:
- `NEXT_PUBLIC_SITE_URL` = `https://poorvithamobiles.com` **(must be set before the build)**
- `DATABASE_URL` = the MySQL URL from A3
- `ADMIN_SECRET` = 64 random hex characters (generate at https://generate-random.org or with `openssl rand -hex 32`)
- `ADMIN_PASSWORD` = a long random one-time setup password
- Leave Razorpay/Shiprocket/SMS blank until tested (section 5). For email set `SMTP_HOST=smtp.hostinger.com`, `SMTP_PORT=465`, `SMTP_USER` = full mailbox address, `SMTP_PASS`, `MAIL_FROM`, `OWNER_EMAIL`.

Deploy. Watch the **build log**: it must show the Prisma migration applying and `✓ Generating static pages`.

> **If the build cannot reach the database:** open **phpMyAdmin** for your database, import `deploy/schema.sql` from the repo, and change the build command to `npm run build`. (Later schema changes would then need manual SQL, so ask me for a new SQL file when the database design changes.)

### A5. Domain and https
Claim the free domain in hPanel and connect it to the web app (hPanel guides this; also make sure `www` works). The free SSL certificate turns on automatically. Open `https://poorvithamobiles.com`.

### A6. First sign-in and starter products
1. Go to `/admin/login`, enter **your email** and the `ADMIN_PASSWORD`, then choose your own password. (Do this right away: until an Owner exists, anyone who knew the setup password could claim the admin.)
2. **Admin → Products → Bulk update prices → Starter catalogue → "Load starter catalogue"**. It adds the 148 starter products (never overwrites edits).
3. **Staff**: add your team. Then set real prices (Bulk update), check stock, weights and the business details in `src/config/site.ts` (phone, address, GSTIN) and redeploy.

### A7. Limits to respect
Hostinger's documented limits for Unlimited: 2 CPU cores, 3 GB RAM, **120 processes / 60 entry processes**; a Next.js app uses ~10–11 threads, and both `poorvithamobiles.com` and `www` count. Don't run extra background processes. Builds have no published memory limit: if a build fails with an out-of-memory error, tell me and we'll slim it.

### A8. Lost the Owner password (no terminal on this plan)
Add two environment variables `ADMIN_RESET_EMAIL` (the owner's email) and `ADMIN_RESET_PASSWORD` (a temporary password), redeploy/restart, sign in with them, choose a new password, then **delete both variables**.

### A9. Backups
- Turn on/keep Hostinger's automatic backups and know how to restore from hPanel.
- Weekly: phpMyAdmin → **Export** the database (SQL). It contains orders **and photos**. Store the file somewhere other than Hostinger (Google Drive etc.).
- Easiest: **Admin → Backups → Download full backup** (Owner only). One `.json.gz` file with products, orders, staff, activity log and photos. The Backups page warns when the last download is over 7 days old.
- Source code is safe in GitHub.
- **Restore** (only into an empty database, e.g. a freshly created one): set `DATABASE_URL`, run `npx prisma migrate deploy`, then `npm run db:restore -- path/to/backup.json.gz`. It refuses to run if the database already has data. Test this once on a local/spare database before launch.

### A10. Updating later
Push to GitHub → Hostinger redeploys (or press Redeploy). The build runs `prisma migrate deploy`, which applies new table changes without deleting data.

---

# Route B: VPS (Ubuntu 22.04/24.04, 2 GB RAM or more)

### B1. Server basics (once)
```bash
local> ssh root@YOUR_SERVER_IP
server$ adduser deploy && usermod -aG sudo deploy && rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy && exit
local> ssh deploy@YOUR_SERVER_IP
server$ sudo apt update && sudo apt -y upgrade
server$ sudo apt -y install nginx git mysql-server ufw certbot python3-certbot-nginx build-essential
server$ curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt -y install nodejs && sudo npm i -g pm2
server$ sudo ufw allow OpenSSH && sudo ufw allow 'Nginx Full' && sudo ufw --force enable
```
Add 2 GB swap if the server has only 2 GB RAM (`fallocate -l 2G /swapfile`, `mkswap`, `swapon`, add to `/etc/fstab`). Turn off SSH password login once your key works.

### B2. Database
```bash
server$ sudo mysql
mysql> CREATE DATABASE poorvitha CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
mysql> CREATE USER 'shop'@'localhost' IDENTIFIED BY 'a-long-random-password';
mysql> GRANT ALL ON poorvitha.* TO 'shop'@'localhost'; FLUSH PRIVILEGES; EXIT;
```
`DATABASE_URL="mysql://shop:a-long-random-password@127.0.0.1:3306/poorvitha"`

### B3. Code, settings, build
```bash
server$ sudo mkdir -p /var/www/poorvitha && sudo chown deploy:deploy /var/www/poorvitha
server$ git clone https://github.com/YOUR-ACCOUNT/poorvitha-shop.git /var/www/poorvitha
server$ cd /var/www/poorvitha && cp .env.production.example .env && nano .env && chmod 600 .env
server$ npm ci && npx prisma migrate deploy && npm run build
server$ pm2 start deploy/ecosystem.config.cjs && pm2 save && pm2 startup     # run the command it prints
server$ curl http://127.0.0.1:3000/api/health                                   # {"ok":true}
```

### B4. Domain, Nginx, https
Point the domain's **A records** (`@` and `www`) to the server IP, then:
```bash
server$ sudo cp deploy/nginx.conf.example /etc/nginx/sites-available/poorvitha && sudo nano /etc/nginx/sites-available/poorvitha   # replace yourdomain.in
server$ sudo ln -s /etc/nginx/sites-available/poorvitha /etc/nginx/sites-enabled/ && sudo rm -f /etc/nginx/sites-enabled/default
server$ sudo nginx -t && sudo systemctl reload nginx
server$ sudo certbot --nginx -d yourdomain.in -d www.yourdomain.in
```
### B5. First sign-in, starter products
Same as **A6**. Lost the Owner password: `npm run user:create -- you@yourdomain.in "new-password-1" OWNER "Your Name"` (or use the `ADMIN_RESET_*` method in A8).

### B6. Backups and updates
`deploy/backup.sh` dumps the database daily (instructions at the top of the file). **Copy `/var/backups/poorvitha` off the server regularly** and test one restore. Update with `bash deploy/update.sh`.

---

# Both routes

## 5. Turn on the integrations (one at a time, testing each)

**Razorpay:** add the **live** keys, restart. Razorpay Dashboard → Webhooks: `https://poorvithamobiles.com/api/payments/webhook` with events `payment.captured`, `order.paid`, `payment.failed` and a secret that you also set as `RAZORPAY_WEBHOOK_SECRET`. Test with a small real payment, confirm **PAID** in the admin, then **refund it in Razorpay**.
> **Hostinger's CDN can wrongly block webhook POSTs with a 403.** After setting the webhook, check Razorpay's webhook log for `200` responses. If you see `403`, lower the CDN security level or switch the CDN off in hPanel for this site (there is no webhook allowlist). Payments still confirm through the browser even if the webhook fails, but the webhook is the safety net.

**Shiprocket:** add the API-user email/password, pickup name and a random `SHIPROCKET_WEBHOOK_TOKEN`; Shiprocket → Settings → API → Webhooks: `https://poorvithamobiles.com/api/logistics/webhook` (the URL/domain may not contain "shiprocket", "kartrocket", "sr" or "kr"). Ship one order and **check the COD amount in Shiprocket equals the admin total**. Every shipment uses your Shiprocket wallet.

**Email:** use a mailbox on your domain (Hostinger includes mailboxes free for the first year, then about ₹39 per mailbox per month). Port 25 is blocked, so use 465 or 587. Add the SPF/DKIM records your mail provider shows.

**SMS:** after DLT approval, fill the `MSG91_*` values (templates in README).

## 6. Monitoring
Add `https://poorvithamobiles.com/api/health` to a free uptime monitor (UptimeRobot / BetterStack). Check the admin Dashboard daily (new orders, low stock, red "paid but cancelled" refund alert).

## 7. Go-live checklist

**Business and content**
- [ ] `src/config/site.ts` has the real address, email, GSTIN, hours (phone numbers are set)
- [ ] Policy pages reviewed; returns and shipping promises are what you really offer
- [ ] Real prices set for every product you sell (Bulk update); the ~54 "price on request" items are priced or intentionally left
- [ ] Permission to use brand photos confirmed

**Technical**
- [ ] `https://` works with the padlock for both `poorvithamobiles.com` and `www`
- [ ] `/api/health` returns `{"ok":true}`; uptime monitor added
- [ ] Owner account created; setup password long and random; staff added; `ADMIN_RESET_*` removed
- [ ] **Test that data survives a redeploy:** place a COD order and upload a photo in the admin, redeploy once, confirm both are still there
- [ ] Backups work and a copy is stored outside the host; one restore tried

**Money and orders**
- [ ] COD test order: email/SMS arrive, stock drops, cancelling restores stock
- [ ] Razorpay live test paid and refunded; webhook shows `200` in Razorpay's log
- [ ] Shiprocket test shipment, label, COD amount and `/track` page verified
- [ ] A final look on a phone

**Later:** submit `/sitemap.xml` to Google Search Console, add Google Business Profile, add analytics.

## 8. Troubleshooting
| Symptom | Likely cause / fix |
|---|---|
| Build fails at "prisma migrate deploy" | Wrong `DATABASE_URL` (check user, password encoding, database name) or the build can't reach the DB: use the phpMyAdmin fallback in A4 |
| Site shows an error after deploy | Check the app's runtime log in hPanel; confirm all environment variables are set |
| Admin login says "Incorrect" | Use the account email; after 8 wrong tries wait 15 min; or use the `ADMIN_RESET_*` method |
| Admin photo upload fails | Photos must be JPG/PNG/WebP under 3 MB |
| Orders but no payment confirmation | Check Razorpay webhook log for 403 (CDN) and that `RAZORPAY_WEBHOOK_SECRET` matches |
| Emails land in spam | Add SPF/DKIM for your domain |
| Links point to localhost | `NEXT_PUBLIC_SITE_URL` wasn't set before the build: set it and redeploy |
