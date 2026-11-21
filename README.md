# Poorvitha Mobiles – online store

Next.js 15 + Prisma. Storefront at `/`, admin panel at `/admin`.

## Run locally

The database is **MySQL** (Hostinger provides MySQL; locally we use Docker):

```bash
docker run -d --name poorvitha-mysql -e MYSQL_ROOT_PASSWORD=choose-a-password -e MYSQL_DATABASE=poorvitha   -p 127.0.0.1:3307:3306 -v poorvitha-mysql-data:/var/lib/mysql mysql:8.0   --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci
```

Put `DATABASE_URL="mysql://root:choose-a-password@127.0.0.1:3307/poorvitha"` in `.env` (copy `.env.example`), then:

```bash
npm install
npx prisma migrate deploy   # creates the tables
npx prisma db seed          # loads the starter catalogue (safe to re-run)
npm run dev                 # http://localhost:3000  (admin: /admin)
```

Settings live in `.env`: `DATABASE_URL`, `ADMIN_PASSWORD` (one-time setup password), `ADMIN_SECRET` (long random string), `NEXT_PUBLIC_SITE_URL`, plus the optional Razorpay / Shiprocket / email / SMS values below.

Photos uploaded in the admin are stored **in the database** (table `UploadedImage`, served at `/uploads/…`), so they survive redeploys and are included in database backups. Max 3 MB each. Product photos that ship with the code live in `public/products/`.

## Admin panel (`/admin`)

**Launch checklist.** Owners can open **Admin → Launch** on the live site: it checks the website address, shop details, security settings, payment/shipping/email setup and the catalogue, and lists what still needs fixing.

**Sign-in and staff.** Each person has their own account (email + password). The very first sign-in creates the **Owner**: enter your email and the setup password from `.env` (`ADMIN_PASSWORD`), then you are asked to choose your own password. After that, the Owner adds staff under **Staff** with a temporary password they must change at first sign-in.

| Role | Can do |
|---|---|
| Owner | everything, including Staff and the Activity log |
| Manager | products and orders (status, shipping, messages, CSV export) |
| Orders only | view and process orders; no products, staff or revenue |

Every important action (sign-ins, price/stock changes, order status, shipments, staff changes, exports) is recorded under **Activity**. Deactivating someone, resetting their password or "Sign out everywhere" ends their sessions immediately; sessions otherwise last 12 hours. There is a lock-out after 8 wrong attempts in 15 minutes. If the Owner is locked out, run on the server: `npm run user:create -- owner@yourdomain.in "a-new-password-1" OWNER "Your Name"` (creates the account or resets its password).

- **Dashboard:** new orders, 30-day revenue, low stock.
- **Products:** add, edit, upload images, set price / stock / live / “price on request”, delete. Quick edit price and stock from the list.
- **Orders:** view, change status (Placed → Confirmed → Shipped → Delivered / Cancelled), internal notes, CSV export. Cancelling returns stock.

Uploaded photos live in the database, so **back up the database** (it holds orders, products, staff and photos).

## Going live

**Full step-by-step guide: [DEPLOY.md](DEPLOY.md)**: Route A (Hostinger Unlimited Node.js web app, with MySQL) and Route B (VPS), integrations, backups and the go-live checklist.

## Online payments (Razorpay)

1. In the Razorpay dashboard use **Test Mode** first: copy the Key ID and Key Secret into `.env` as `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET`.
2. Add a webhook (Settings → Webhooks): URL `https://YOUR-DOMAIN/api/payments/webhook`, events `payment.captured`, `order.paid`, `payment.failed`, and a secret of your choice, stored as `RAZORPAY_WEBHOOK_SECRET`. (For local testing, expose the site with a Cloudflare tunnel and use that URL.)
3. Restart the server. Checkout now offers “Pay online” (UPI, cards, net banking, wallets) alongside Cash on Delivery. With the keys blank, only COD is offered.
4. Test with Razorpay's test UPI/cards, then swap in **Live** keys (and a live webhook) at launch.

How it works: placing an online order reserves stock and creates a Razorpay order for the server-side total. The browser's payment result is verified by signature; the webhook is the backup if the customer closes the tab. Unpaid orders are released after 30 minutes. A payment that arrives after release is flagged in the admin (refund it in Razorpay). Refunds are done in the Razorpay dashboard.

## Shipping (Shiprocket)

1. In Shiprocket: **Settings → API → Add New API User** (use a different email from your main login). Put its email and password in `.env` as `SHIPROCKET_EMAIL` / `SHIPROCKET_PASSWORD`.
2. Set `SHIPROCKET_PICKUP_LOCATION` to the exact nickname of your pickup address in Shiprocket (Settings → Pickup Addresses). Optionally set `SHIPROCKET_FALLBACK_EMAIL` (used when a customer gives no email).
3. Webhook for automatic status updates: Settings → API → Webhooks → URL `https://YOUR-DOMAIN/api/logistics/webhook`, enable it, and enter your `SHIPROCKET_WEBHOOK_TOKEN` as the security token. Shiprocket does not accept URLs/domains containing “shiprocket”, “kartrocket”, “sr” or “kr”.
4. Restart. On each paid or COD order in the admin, the **Shipping** box lets you confirm weight and package size, then **Create shipment & request pickup**. That creates the Shiprocket order, assigns a courier/AWB, requests pickup and fetches the label. It is resumable if a step fails. **Refresh status** and **Cancel shipment** are there too.
5. Customers can track at `/track` with their order ID and mobile number.

Every shipment uses your live Shiprocket wallet. Product weights (grams) are editable per product and pre-fill the shipping weight; check the estimates. On your first COD shipment, confirm in the Shiprocket panel that the COD amount equals the order total shown in the admin.

## Emails and SMS

**Email** works with any SMTP account (Zoho Mail, Gmail app password, Brevo, Resend, your host's mail…). Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` (e.g. `Poorvitha Mobiles <orders@yourdomain.in>`) and `OWNER_EMAIL` (gets a “new order” alert). Use a mailbox on your own domain and set up SPF/DKIM with your mail provider so messages don't land in spam. Leave `SMTP_HOST` blank to turn email off.

Customers with an email address get: order confirmed (COD on placing, online once payment is confirmed), shipped (with courier + AWB + tracking link), delivered, cancelled.

**SMS** uses MSG91 (Flow API). Indian SMS needs **DLT registration** (entity, sender ID and approved templates), which is done with your telecom operator's DLT portal and MSG91. Then create two MSG91 templates whose variables are named `VAR1`, `VAR2`, … and put their IDs in `MSG91_TEMPLATE_CONFIRMED` (VAR1 name, VAR2 order id, VAR3 amount) and `MSG91_TEMPLATE_SHIPPED` (VAR1 name, VAR2 order id, VAR3 courier, VAR4 AWB), plus `MSG91_AUTH_KEY`. Suggested wording:

- Confirmed: `Dear ##VAR1##, your order ##VAR2## of Rs ##VAR3## is confirmed. - Poorvitha Mobiles`
- Shipped: `Dear ##VAR1##, your order ##VAR2## is shipped via ##VAR3##, AWB ##VAR4##. - Poorvitha Mobiles`

Every message is logged per order (see **Messages to customer** on the admin order page) and a failed one can be resent with one click. A message is never sent twice for the same order event. Failures never block an order.

## Not built yet

Separate staff logins, courier choice/rate preview at checkout, WhatsApp messages.
