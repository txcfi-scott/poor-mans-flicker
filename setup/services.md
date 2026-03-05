# Service Accounts Setup

You need three free accounts to run your photography site. This takes about 15 minutes total.

---

## 1. Vercel (Hosts Your Website)

**What it does:** Runs your website and auto-deploys when you push code.

### Sign Up
1. Go to https://vercel.com/signup
2. Click "Continue with GitHub" (use the same GitHub account that has your repo)
3. That's it — your account is linked to GitHub automatically

### Connect Your Repo
1. Go to https://vercel.com/new
2. Find "poor-mans-flicker" in the list and click "Import"
3. Leave all settings as default
4. Click "Deploy"
5. Your site is now live at a .vercel.app URL

### Add Environment Variables
1. Go to your project on Vercel → Settings → Environment Variables
2. Add each variable from the list below (you'll get the values from the other service setups):
   - `TURSO_DATABASE_URL`
   - `TURSO_AUTH_TOKEN`
   - `R2_ENDPOINT`
   - `R2_ACCESS_KEY`
   - `R2_SECRET_KEY`
   - `R2_BUCKET`
   - `R2_PUBLIC_URL`
   - `ADMIN_TOKEN` — make up a long random password (this is your admin login)
   - `NEXT_PUBLIC_SITE_URL` — your Vercel URL or custom domain

### Custom Domain (Optional)
1. Go to your project → Settings → Domains
2. Add your domain (e.g., chrishardingphotography.com)
3. It will tell you what DNS records to add in Cloudflare

### CLI Access (for Claude Code)
Claude Code can manage Vercel deployments using the Vercel CLI:
```bash
npm install -g vercel
vercel login
```
Follow the browser prompt to authenticate. After this, Claude Code can:
- Deploy: `vercel --prod`
- Check status: `vercel ls`
- View logs: `vercel logs`
- Manage env vars: `vercel env add VARIABLE_NAME`

---

## 2. Turso (Your Database)

**What it does:** Stores your album and photo information (not the actual images — those go on Cloudflare).

### Sign Up
1. Go to https://turso.tech
2. Click "Start for Free"
3. Sign up with GitHub

### Create Your Database
The easiest way is to let Claude Code do it. In your terminal:
```bash
# Install the Turso CLI
brew install tursodatabase/tap/turso

# Log in
turso auth login
```
This opens a browser window — log in with GitHub.

Then let Claude Code handle the rest, or do it manually:
```bash
# Create the database
turso db create poor-mans-flicker

# Get the connection URL
turso db show poor-mans-flicker --url

# Create an auth token
turso db tokens create poor-mans-flicker
```

Copy the URL and token — you'll need these for Vercel environment variables:
- `TURSO_DATABASE_URL` = the URL from `turso db show`
- `TURSO_AUTH_TOKEN` = the token from `turso db tokens create`

### CLI Access (for Claude Code)
After `turso auth login`, Claude Code can:
- Create/delete databases: `turso db create/destroy`
- Push schema: `npx drizzle-kit push`
- Query data: `turso db shell poor-mans-flicker "SELECT * FROM albums"`
- Manage tokens: `turso db tokens create`
- View usage: `turso db inspect poor-mans-flicker`

### Free Tier Limits
- 9 GB total storage
- 1 billion row reads/month
- 25 million row writes/month
- This is way more than you'll ever need for a photo portfolio

---

## 3. Cloudflare (Domain + Image Storage)

**What it does:** Registers your domain name, stores your actual photo files (R2), and serves them fast worldwide via CDN.

### Sign Up
1. Go to https://dash.cloudflare.com/sign-up
2. Create account with email + password

### Register Your Domain
1. In Cloudflare dashboard → Domain Registration → Register Domains
2. Search for your domain (e.g., chrishardingphotography.com)
3. Purchase it (~$10.46/year)

### Create an R2 Bucket (Image Storage)
1. In Cloudflare dashboard → R2 Object Storage
2. Click "Create bucket"
3. Name it `pmf-photos`
4. Click "Create bucket"

### Set Up Public Access for the Bucket
1. Go to your bucket → Settings
2. Under "Public Access" → click "Allow Access"
3. Add a custom domain: `photos.chrishardingphotography.com` (or whatever your domain is)
4. Cloudflare will automatically set up DNS for this

### Create R2 API Token
1. Go to your bucket → Settings → "Manage R2 API Tokens"
   OR go to: My Profile → API Tokens → R2
2. Click "Create API Token"
3. Permissions: "Object Read & Write"
4. Scope: Select your `pmf-photos` bucket
5. Click "Create API Token"
6. **SAVE THESE VALUES** — you won't see them again:
   - Access Key ID → this is `R2_ACCESS_KEY`
   - Secret Access Key → this is `R2_SECRET_KEY`

### Get Your R2 Endpoint
Your R2 endpoint URL follows this pattern:
```
https://<ACCOUNT_ID>.r2.cloudflarestorage.com
```
Find your Account ID: Cloudflare dashboard → right sidebar → "Account ID"

So your environment variables are:
- `R2_ENDPOINT` = `https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com`
- `R2_ACCESS_KEY` = the Access Key ID from above
- `R2_SECRET_KEY` = the Secret Access Key from above
- `R2_BUCKET` = `pmf-photos`
- `R2_PUBLIC_URL` = `https://photos.chrishardingphotography.com` (the custom domain you set up)

### DNS for Vercel
When you add your domain in Vercel (Step 1), Vercel will give you DNS records to add. In Cloudflare:
1. Go to your domain → DNS → Records
2. Add the records Vercel tells you (usually a CNAME record)
3. Set the proxy status to "DNS only" (gray cloud) for Vercel records

### CLI Access (for Claude Code)
```bash
npm install -g wrangler
wrangler login
```
After login, Claude Code can:
- Manage R2: `wrangler r2 object put/get/delete`
- Manage DNS: via Cloudflare API with your API token
- List buckets: `wrangler r2 bucket list`

### Create a General API Token (for DNS management)
1. My Profile → API Tokens → Create Token
2. Use template "Edit zone DNS"
3. Zone Resources: your domain
4. Create Token
5. Save this token — you or Claude can use it for DNS changes

---

## Quick Reference: All Your Environment Variables

After setting up all three services, you'll have:

| Variable | Where It Comes From |
|----------|-------------------|
| `TURSO_DATABASE_URL` | Turso: `turso db show poor-mans-flicker --url` |
| `TURSO_AUTH_TOKEN` | Turso: `turso db tokens create poor-mans-flicker` |
| `R2_ENDPOINT` | Cloudflare: `https://<account-id>.r2.cloudflarestorage.com` |
| `R2_ACCESS_KEY` | Cloudflare: R2 API token → Access Key ID |
| `R2_SECRET_KEY` | Cloudflare: R2 API token → Secret Access Key |
| `R2_BUCKET` | `pmf-photos` (what you named the bucket) |
| `R2_PUBLIC_URL` | `https://photos.yourdomain.com` (R2 custom domain) |
| `ADMIN_TOKEN` | You make this up — any long random string |
| `NEXT_PUBLIC_SITE_URL` | Your domain: `https://chrishardingphotography.com` |

Add ALL of these to:
1. **Vercel** → Project Settings → Environment Variables (for production)
2. **Your local .env.local file** (for local development)

---

## What Claude Code Can Do After Setup

Once the CLIs are authenticated, Claude Code can manage everything:

| Task | How |
|------|-----|
| Deploy the site | `vercel --prod` or just `git push` |
| Update database schema | `npx drizzle-kit push` |
| Query the database | `turso db shell` |
| Upload files to R2 | Via the app's API or `wrangler r2 object put` |
| Manage DNS | Cloudflare API |
| Check deployment status | `vercel ls` |
| View error logs | `vercel logs` |
| Add env variables | `vercel env add` |
| Create database backups | `turso db dump` |
