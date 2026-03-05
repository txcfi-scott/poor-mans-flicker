#!/bin/bash
# =============================================================================
# Poor Man's Flickr — Bulletproof Bootstrap
#
# One command. Zero manual steps (except one browser click for Vercel).
#
#   curl -sSL https://raw.githubusercontent.com/txcfi-scott/poor-mans-flicker/main/setup/bootstrap.sh | bash
#
# Idempotent. Safe to run multiple times.
# =============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Colors and helpers
# ---------------------------------------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

info()    { printf "${BLUE}  ℹ️  ${NC} %s\n" "$1"; }
success() { printf "${GREEN}  ✅ ${NC} %s\n" "$1"; }
warn()    { printf "${YELLOW}  ⚠️  ${NC} %s\n" "$1"; }
fail()    { printf "${RED}  ❌ ${NC} %s\n" "$1"; exit 1; }
step()    { printf "\n${BOLD}━━━ %s ━━━${NC}\n" "$1"; }

# ---------------------------------------------------------------------------
# Detect shell profile
# ---------------------------------------------------------------------------
if [[ "${SHELL:-}" == */zsh ]]; then
    SHELL_PROFILE="$HOME/.zshrc"
elif [[ "${SHELL:-}" == */bash ]]; then
    SHELL_PROFILE="$HOME/.bash_profile"
else
    SHELL_PROFILE="$HOME/.zshrc"
fi

# Create the profile file if it doesn't exist
touch "$SHELL_PROFILE"

info "Shell profile: $SHELL_PROFILE"

# ---------------------------------------------------------------------------
# Step 1: Xcode Command Line Tools
# ---------------------------------------------------------------------------
step "Step 1/8: Xcode Command Line Tools"

if xcode-select -p &>/dev/null; then
    success "Xcode CLI tools already installed"
else
    info "Installing Xcode Command Line Tools..."
    # Headless install trick — avoids the GUI dialog
    touch /tmp/.com.apple.dt.CommandLineTools.installondemand.in-progress
    XCODE_PKG=$(softwareupdate -l 2>/dev/null | grep -o 'Command Line Tools for Xcode-[0-9.]*' | head -1)
    if [ -n "$XCODE_PKG" ]; then
        info "Found package: $XCODE_PKG — installing (this takes a few minutes)..."
        softwareupdate -i "$XCODE_PKG" --verbose
        rm -f /tmp/.com.apple.dt.CommandLineTools.installondemand.in-progress
        success "Xcode CLI tools installed"
    else
        rm -f /tmp/.com.apple.dt.CommandLineTools.installondemand.in-progress
        xcode-select --install 2>/dev/null || true
        echo ""
        warn "A dialog appeared — click 'Install' and wait for it to finish."
        warn "Then re-run this script:"
        echo ""
        echo "  curl -sSL https://raw.githubusercontent.com/txcfi-scott/poor-mans-flicker/main/setup/bootstrap.sh | bash"
        echo ""
        exit 0
    fi
fi

# Verify
xcode-select -p &>/dev/null || fail "Xcode CLI tools are not installed"

# ---------------------------------------------------------------------------
# Step 2: Homebrew
# ---------------------------------------------------------------------------
step "Step 2/8: Homebrew"

# Check for brew in known locations (it may not be on PATH yet)
if command -v brew &>/dev/null; then
    success "Homebrew already installed"
elif [[ -f /opt/homebrew/bin/brew ]]; then
    success "Homebrew already installed (Apple Silicon, adding to PATH)"
elif [[ -f /usr/local/bin/brew ]]; then
    success "Homebrew already installed (Intel, adding to PATH)"
else
    info "Installing Homebrew..."
    NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)" || fail "Homebrew installation failed"
    success "Homebrew installed"
fi

# IMMEDIATELY add to current session PATH
if [[ -f /opt/homebrew/bin/brew ]]; then
    eval "$(/opt/homebrew/bin/brew shellenv)"
    if ! grep -q 'homebrew' "$SHELL_PROFILE" 2>/dev/null; then
        info "Adding Homebrew to $SHELL_PROFILE..."
        {
            echo ""
            echo "# Homebrew (Apple Silicon)"
            echo 'eval "$(/opt/homebrew/bin/brew shellenv)"'
        } >> "$SHELL_PROFILE"
    fi
elif [[ -f /usr/local/bin/brew ]]; then
    eval "$(/usr/local/bin/brew shellenv)"
    if ! grep -q 'homebrew' "$SHELL_PROFILE" 2>/dev/null; then
        info "Adding Homebrew to $SHELL_PROFILE..."
        {
            echo ""
            echo "# Homebrew (Intel)"
            echo 'eval "$(/usr/local/bin/brew shellenv)"'
        } >> "$SHELL_PROFILE"
    fi
fi

# Verify
command -v brew &>/dev/null || fail "Homebrew is not on PATH after installation"
success "Homebrew ready: $(brew --prefix)"

# ---------------------------------------------------------------------------
# Step 3: Node.js via fnm
# ---------------------------------------------------------------------------
step "Step 3/8: Node.js (via fnm)"

if ! command -v fnm &>/dev/null; then
    info "Installing fnm (Fast Node Manager)..."
    brew install fnm || fail "fnm installation failed"
    success "fnm installed"
else
    success "fnm already installed"
fi

# IMMEDIATELY configure fnm for the current session
eval "$(fnm env --use-on-cd --shell bash)"
export PATH="$HOME/.local/share/fnm:$PATH"

# Add to profile if not there
if ! grep -q 'fnm env' "$SHELL_PROFILE" 2>/dev/null; then
    info "Adding fnm to $SHELL_PROFILE..."
    {
        echo ""
        echo "# fnm (Fast Node Manager)"
        echo 'eval "$(fnm env --use-on-cd)"'
    } >> "$SHELL_PROFILE"
fi

# Install and activate Node 22
if fnm ls 2>/dev/null | grep -q "v22"; then
    success "Node.js 22 already installed"
else
    info "Installing Node.js 22..."
    fnm install 22 || fail "Node.js 22 installation failed"
    success "Node.js 22 installed"
fi

fnm use 22 || fail "Could not activate Node.js 22"

# Verify
command -v node &>/dev/null || fail "Node.js is not available after fnm setup"
success "Node: $(node --version)"
success "npm:  $(npm --version)"

# ---------------------------------------------------------------------------
# Step 4: Claude Code CLI
# ---------------------------------------------------------------------------
step "Step 4/8: Claude Code CLI"

# Add npm global bin to PATH BEFORE checking for claude
NPM_BIN="$(npm config get prefix)/bin"
export PATH="$NPM_BIN:$PATH"

if ! grep -q 'npm config get prefix' "$SHELL_PROFILE" 2>/dev/null; then
    info "Adding npm global bin to $SHELL_PROFILE..."
    {
        echo ""
        echo "# npm global bin"
        echo 'export PATH="$(npm config get prefix)/bin:$PATH"'
    } >> "$SHELL_PROFILE"
fi

if command -v claude &>/dev/null; then
    success "Claude Code CLI already installed"
else
    info "Installing Claude Code CLI..."
    npm install -g @anthropic-ai/claude-code || fail "Claude Code CLI installation failed"
    success "Claude Code CLI installed"
fi

# Verify
command -v claude &>/dev/null || fail "Claude Code CLI is not available after installation"
success "Claude Code: $(claude --version 2>/dev/null || echo 'installed')"

# ---------------------------------------------------------------------------
# Step 5: Clone the repository
# ---------------------------------------------------------------------------
step "Step 5/8: Clone repository"

REPO_DIR="$HOME/poor-mans-flicker"

if [[ -d "$REPO_DIR/.git" ]]; then
    success "Repository already cloned at $REPO_DIR"
    info "Pulling latest changes..."
    cd "$REPO_DIR" && git pull || warn "Could not pull (you may have local changes)"
else
    if [[ -d "$REPO_DIR" ]]; then
        BACKUP="${REPO_DIR}.backup.$(date +%s)"
        warn "Directory exists but isn't a git repo — backing up to $BACKUP"
        mv "$REPO_DIR" "$BACKUP"
    fi
    info "Cloning repository..."
    git clone https://github.com/txcfi-scott/poor-mans-flicker.git "$REPO_DIR" || fail "Failed to clone repository"
    success "Repository cloned to $REPO_DIR"
fi

cd "$REPO_DIR"

info "Installing npm dependencies..."
npm install || fail "npm install failed"
success "Dependencies installed"

# ---------------------------------------------------------------------------
# Step 6: Claude Code global config
# ---------------------------------------------------------------------------
step "Step 6/8: Claude Code configuration"

mkdir -p "$HOME/.claude"

if [[ -f "$HOME/.claude/CLAUDE.md" ]]; then
    warn "~/.claude/CLAUDE.md already exists — leaving it untouched"
else
    cat > "$HOME/.claude/CLAUDE.md" << 'CLAUDE_EOF'
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
CLAUDE_EOF
    success "Created ~/.claude/CLAUDE.md"
fi

# ---------------------------------------------------------------------------
# Step 7: Vercel GitHub App
# ---------------------------------------------------------------------------
step "Step 7/8: Vercel GitHub Integration"

echo ""
info "One last step — connecting Vercel to GitHub."
info "A browser window will open. Grant access to the poor-mans-flicker repo."
echo ""

# When running via curl | bash, stdin is the pipe, not the terminal.
# Use /dev/tty for interactive prompts.
printf "${YELLOW}  Press Enter to open the browser...${NC} "
read -r < /dev/tty

open "https://github.com/apps/vercel/installations/select_target" 2>/dev/null \
    || warn "Could not open browser — visit https://github.com/apps/vercel/installations/select_target manually"

echo ""
printf "${YELLOW}  Done granting access? Press Enter to continue...${NC} "
read -r < /dev/tty

success "Vercel GitHub integration step complete"

# ---------------------------------------------------------------------------
# Step 8: Source profile and verify everything
# ---------------------------------------------------------------------------
step "Step 8/8: Final verification"

# Source the profile so everything is live in this session
# (Use bash-compatible source since we're running in bash)
set +eu
source "$SHELL_PROFILE" 2>/dev/null || true
set -eu

# Re-activate fnm in case source clobbered it
eval "$(fnm env --use-on-cd --shell bash)" 2>/dev/null || true
fnm use 22 2>/dev/null || true

# Final PATH fixup
NPM_BIN="$(npm config get prefix 2>/dev/null)/bin"
export PATH="$NPM_BIN:$PATH"

echo ""
printf "${GREEN}${BOLD}=========================================${NC}\n"
printf "${GREEN}${BOLD}  ✅ All set! Everything is installed.   ${NC}\n"
printf "${GREEN}${BOLD}=========================================${NC}\n"
echo ""
printf "  ${BOLD}Node:${NC}    %s\n" "$(node --version 2>/dev/null || echo 'unknown')"
printf "  ${BOLD}npm:${NC}     %s\n" "$(npm --version 2>/dev/null || echo 'unknown')"
printf "  ${BOLD}Claude:${NC}  %s\n" "$(claude --version 2>/dev/null || echo 'installed')"
printf "  ${BOLD}Project:${NC} ~/poor-mans-flicker\n"
printf "  ${BOLD}Website:${NC} chrishardingphotography.com\n"
echo ""
printf "  To start working on your site:\n"
echo ""
printf "    ${BOLD}cd ~/poor-mans-flicker${NC}\n"
printf "    ${BOLD}claude${NC}\n"
echo ""
printf "  Then just tell Claude what you want!\n"
echo ""
