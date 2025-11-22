# Security: Protecting Actual Values

## Problem
The `actual.csv` file contains the true values that teams should not see during the competition.

## Solution
We use a Cloudflare Worker to calculate RMSE server-side without exposing actual values.

## Setup Instructions

### 1. Deploy Cloudflare Worker

1. Sign up for Cloudflare (free tier available)
2. Install Wrangler CLI:
   ```bash
   npm install -g wrangler
   ```
3. Login to Cloudflare:
   ```bash
   wrangler login
   ```
4. Navigate to the worker directory:
   ```bash
   cd cloudflare-worker
   ```
5. Deploy the worker:
   ```bash
   wrangler deploy
   ```
6. Set the secret in Cloudflare Dashboard:
   - Go to Workers & Pages → Your Worker → Settings → Variables
   - Add secret: `ACTUAL_VALUES` = `0.3,1,3,-1` (your actual values, comma-separated)

### 2. Update the Endpoint URL

In `Datachallenge/private/leaderboard.html`, replace:
```javascript
const rmseEndpoint = 'https://rmse-calculator.YOUR_SUBDOMAIN.workers.dev';
```

With your actual Cloudflare Worker URL (you'll get this after deployment).

### 3. Remove actual.csv from Public Access

The file `Datachallenge/assets/actual.csv` is now in `.gitignore` and should not be committed.

## Alternative: Use GitHub Secrets + Serverless Function

If you prefer to use GitHub Actions, you can create a serverless function that:
- Reads actual values from GitHub Secrets
- Calculates RMSE server-side
- Returns only the RMSE value

This requires setting up a serverless platform (Vercel, Netlify, etc.).

