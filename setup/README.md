# Setting Up Your Development Environment

This guide gets your Mac ready to work on your photography site with Claude Code.

## What You Need
- A Mac (you have this)
- Your Claude Code subscription ($20/mo -- you have this)
- About 15 minutes for initial setup

## Step 1: Install Homebrew (Mac package manager)
Open Terminal and paste:
```
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```
Follow the prompts. When done, close and reopen Terminal.

## Step 2: Install Node.js
```
brew install node
```
Verify: `node --version` should show v20 or higher.

## Step 3: Install Git
```
brew install git
```

## Step 4: Install Claude Code
```
npm install -g @anthropic-ai/claude-code
```

## Step 5: Clone Your Site
```
cd ~
git clone https://github.com/txcfi-scott/poor-mans-flicker.git
cd poor-mans-flicker
npm install
```

## Step 6: Set Up Environment Variables
```
cp .env.local.example .env.local
```
Then edit .env.local with your actual values (Scott will provide these).

## Step 7: Test It Works
```
npm run dev
```
Open http://localhost:3000 in your browser. You should see your site.

## Using Claude Code
To work on your site:
```
cd ~/poor-mans-flicker
claude
```
Then just tell Claude what you want in plain English:
- "Add a new album called Summer 2026"
- "Change the slideshow transition speed to 8 seconds"
- "Fix the layout on mobile"
- "Add a watermark to uploaded photos"

Claude reads the CLAUDE.md file automatically and knows how everything works.

## Updating Your Site
After Claude makes changes:
```
git add -A
git commit -m "description of changes"
git push
```
Vercel will automatically deploy the update within a minute or two.
