# AadhiRiya Business Dashboard

## What this version includes
- Monthly EV income, EB cost, ZEON commission and recorded profit
- Cumulative profit
- GST output / input / indicative payable tracker
- TNEB / EB bill payment status
- Recurring expense tracker
- Alerts for unpaid bills and mismatches
- Responsive layout for phone and desktop

## Important security rule
Do NOT store portal passwords in this repository.
Do NOT add passwords to index.html, script.js, data.js, or GitHub.

## ZEON live sync
The dashboard is ready for a secure integration, but live sync should use a supported ZEON API/export endpoint.
If ZEON provides an API token or documented export endpoint, add a server-side backend and keep secrets in server-only environment variables.

## Deploy
Replace the files in your existing GitHub repository, commit, and push.
Vercel will automatically redeploy the same public URL if it is connected to the repository.

## Data source
The initial values in data.js were created from the two Excel files provided in the chat.
