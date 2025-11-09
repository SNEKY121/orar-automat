# Uni SMS Scheduler

Sends a daily SMS with tomorrow's classes via Twilio.

Setup:
1. Fill JSON files under config/ and data/.
2. Add Twilio credentials as GitHub repo Secrets:
   - TWILIO_ACCOUNT_SID
   - TWILIO_AUTH_TOKEN
   - TWILIO_FROM_NUMBER
   - TWILIO_TO_NUMBER
3. Push to GitHub and enable Actions. Adjust cron in .github/workflows/daily-sms.yml.

Local test:
- Install deps: npm ci
- Export env vars locally and run: node src/index.js

Validate: npm run validate
