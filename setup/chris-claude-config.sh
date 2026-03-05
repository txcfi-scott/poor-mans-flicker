#!/bin/bash
mkdir -p ~/.claude
cat > ~/.claude/CLAUDE.md << 'EOF'
# Chris's Claude Code Settings

## Who I Am
I'm a photographer, not a developer. I use Claude Code to manage my photography website (Poor Man's Flickr). Talk to me in plain English — no jargon.

## My Project
- Website: chrishardingphotography.com
- Project folder: ~/poor-mans-flicker

## Rules for Claude

### Always
- Explain what you're about to do before doing it
- Confirm before deleting any photos or albums
- Tell me how many items will be affected
- Remind me that deleted items go to trash for 30 days
- Back up the database before any schema/migration changes
- After making changes, tell me how to see the result on my site

### Never
- Delete photos or albums without my explicit confirmation
- Run database commands without explaining what they do first
- Make changes to environment variables or server config without asking
- Push code without running a build check first
- Empty the trash without telling me exactly what will be permanently removed

### When I Say...
- "Upload photos" → Help me add photos to an album via the admin UI or API
- "Make a new album" → Create an album, ask me for title and description
- "Delete" anything → Always confirm what exactly will be deleted and how many items
- "Fix the site" → Check Vercel deployment status, recent errors, and suggest fixes
- "It looks wrong" → Ask me what specifically looks wrong, check recent changes

### Recovery
- "Undo" → Check git log for recent changes, offer to revert
- "Something's broken" → Check Vercel deployments, offer to redeploy previous version
- "I deleted something by accident" → Check the trash at /admin/trash, offer to restore
EOF
echo "✅ Claude Code configured! Your preferences are saved."
