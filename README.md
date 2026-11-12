# PoultryPro: Poultry Farm Store (React + Vite + Tailwind + Node API)

Online shop with email/password and Google login (plus optional mobile OTP), Cash on Delivery orders,
product and store reviews, a "Let's collaborate" inbox, WhatsApp chat button, order emails, and a full admin dashboard.

## Run it
```bash
npm install
copy .env.example .env     # Mac/Linux: cp .env.example .env
npm run dev
```
Shop: http://localhost:5173   Admin: http://localhost:5173/admin   (Node.js 18+)

Open `.env` and set at least `ADMIN_PASSWORD`, `ADMIN_EMAIL`, `WHATSAPP_NUMBER`.

## What needs your own keys
| Feature | Keys in `.env` | Without it |
| --- | --- | --- |
| Emails to customers and to you | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`, `ADMIN_EMAIL` | Emails are printed in the terminal, not sent. Orders and messages still work. |
| Login with Google | `GOOGLE_CLIENT_ID` | Google button is hidden. Email and mobile login still work. |
| WhatsApp button | `WHATSAPP_NUMBER` | Button is hidden. |
| Real SMS OTP | `OTP_MODE=twilio` + Twilio keys | OTP shown on screen (test mode). |

Never upload `.env` or `server/data.json` to GitHub. Both are in `.gitignore`.

## Admin panel (/admin)
Dashboard (sales chart, top products, low stock), Orders (status updates email the customer, CSV export),
Products, Customers, Reviews (hide, delete, reply publicly), Messages (read and reply by email).

## Notes
- Customer emails are not verified yet, and there is no "forgot password" page. Customers can also use Google or mobile OTP.
- Product ratings come only from real customer reviews.
- Data is stored in `server/data.json`. For many orders per day, move to a real database.
- Going live: `npm start` serves site and API together. Needs a Node host (Render, Railway, VPS) with a persistent disk. Set `NODE_ENV=production` and `SITE_URL`.
