#!/bin/bash
# =============================================================================
# Poor Man's Flickr — Bootstrap Script for Chris's Mac
#
# Sets up everything needed to develop and manage the photography portfolio site.
# Designed to be run via:
#   curl -sSL https://raw.githubusercontent.com/txcfi-scott/poor-mans-flicker/main/setup/bootstrap.sh | bash
#
# Safe to run multiple times (idempotent). Each step checks before installing.
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
NC='\033[0m' # No Color

info()    { printf "${BLUE}[INFO]${NC}  %s\n" "$1"; }
success() { printf "${GREEN}[OK]${NC}    %s\n" "$1"; }
warn()    { printf "${YELLOW}[WARN]${NC}  %s\n" "$1"; }
fail()    { printf "${RED}[ERROR]${NC} %s\n" "$1"; exit 1; }
step()    { printf "\n${BOLD}==> %s${NC}\n" "$1"; }

# ---------------------------------------------------------------------------
# 1. Xcode Command Line Tools
# ---------------------------------------------------------------------------
step "Checking Xcode Command Line Tools"

if xcode-select -p &>/dev/null; then
    success "Xcode CLI tools already installed"
else
    info "Installing Xcode Command Line Tools..."
    info "A system dialog may appear — click 'Install' and wait for it to finish."
    xcode-select --install 2>/dev/null || true

    # Wait for the installation to complete
    until xcode-select -p &>/dev/null; do
        sleep 5
    done
    success "Xcode CLI tools installed"
fi

# ---------------------------------------------------------------------------
# 2. Homebrew
# ---------------------------------------------------------------------------
step "Checking Homebrew"

if command -v brew &>/dev/null; then
    success "Homebrew already installed"
else
    info "Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)" || fail "Homebrew installation failed"

    # Add Homebrew to PATH for this session (and detect arch)
    if [[ -f /opt/homebrew/bin/brew ]]; then
        # Apple Silicon
        eval "$(/opt/homebrew/bin/brew shellenv)"
    elif [[ -f /usr/local/bin/brew ]]; then
        # Intel
        eval "$(/usr/local/bin/brew shellenv)"
    fi

    success "Homebrew installed"
fi

# Ensure brew is on PATH for the rest of the script
if [[ -f /opt/homebrew/bin/brew ]]; then
    eval "$(/opt/homebrew/bin/brew shellenv)"
elif [[ -f /usr/local/bin/brew ]]; then
    eval "$(/usr/local/bin/brew shellenv)"
fi

# ---------------------------------------------------------------------------
# 3. Node.js via fnm (Fast Node Manager)
# ---------------------------------------------------------------------------
step "Checking Node.js (via fnm)"

if command -v fnm &>/dev/null; then
    success "fnm already installed"
else
    info "Installing fnm (Fast Node Manager)..."
    brew install fnm || fail "fnm installation failed"
    success "fnm installed"
fi

# Configure fnm for this session
eval "$(fnm env --use-on-cd --shell bash)"

# Add fnm to shell profile if not already there
SHELL_PROFILE=""
if [[ -f "$HOME/.zshrc" ]]; then
    SHELL_PROFILE="$HOME/.zshrc"
elif [[ -f "$HOME/.bash_profile" ]]; then
    SHELL_PROFILE="$HOME/.bash_profile"
elif [[ -f "$HOME/.bashrc" ]]; then
    SHELL_PROFILE="$HOME/.bashrc"
fi

if [[ -n "$SHELL_PROFILE" ]]; then
    if ! grep -q 'fnm env' "$SHELL_PROFILE" 2>/dev/null; then
        info "Adding fnm to $SHELL_PROFILE..."
        {
            echo ""
            echo "# fnm (Fast Node Manager)"
            echo 'eval "$(fnm env --use-on-cd)"'
        } >> "$SHELL_PROFILE"
        success "fnm added to shell profile"
    else
        success "fnm already in shell profile"
    fi

    # Also ensure Homebrew is in the shell profile (Apple Silicon)
    if [[ -f /opt/homebrew/bin/brew ]] && ! grep -q '/opt/homebrew/bin/brew shellenv' "$SHELL_PROFILE" 2>/dev/null; then
        info "Adding Homebrew to $SHELL_PROFILE (Apple Silicon)..."
        {
            echo ""
            echo "# Homebrew (Apple Silicon)"
            echo 'eval "$(/opt/homebrew/bin/brew shellenv)"'
        } >> "$SHELL_PROFILE"
        success "Homebrew added to shell profile"
    fi
fi

# Install Node.js 22 if not already available
if fnm ls 2>/dev/null | grep -q "v22"; then
    success "Node.js 22 already installed via fnm"
else
    info "Installing Node.js 22..."
    fnm install 22 || fail "Node.js 22 installation failed"
    success "Node.js 22 installed"
fi

fnm use 22 || fail "Could not activate Node.js 22"
success "Using Node.js $(node --version)"

# ---------------------------------------------------------------------------
# 4. Claude Code CLI
# ---------------------------------------------------------------------------
step "Checking Claude Code CLI"

if command -v claude &>/dev/null; then
    success "Claude Code CLI already installed"
else
    info "Installing Claude Code CLI..."
    npm install -g @anthropic-ai/claude-code || fail "Claude Code CLI installation failed"
    success "Claude Code CLI installed"
fi

# ---------------------------------------------------------------------------
# 5. Clone the repository
# ---------------------------------------------------------------------------
step "Checking repository"

REPO_DIR="$HOME/poor-mans-flicker"

if [[ -d "$REPO_DIR/.git" ]]; then
    success "Repository already cloned at $REPO_DIR"
    info "Pulling latest changes..."
    cd "$REPO_DIR" && git pull || warn "Could not pull latest changes (you may need to resolve conflicts)"
else
    if [[ -d "$REPO_DIR" ]]; then
        warn "$REPO_DIR exists but is not a git repo — backing up to ${REPO_DIR}.bak"
        mv "$REPO_DIR" "${REPO_DIR}.bak"
    fi
    info "Cloning repository..."
    cd "$HOME" && git clone https://github.com/txcfi-scott/poor-mans-flicker.git || fail "Failed to clone repository"
    success "Repository cloned to $REPO_DIR"
fi

cd "$REPO_DIR"

# ---------------------------------------------------------------------------
# 6. Install npm dependencies
# ---------------------------------------------------------------------------
step "Installing npm dependencies"

npm install || fail "npm install failed"
success "Dependencies installed"

# ---------------------------------------------------------------------------
# 7. Vercel GitHub App (requires browser)
# ---------------------------------------------------------------------------
step "Vercel GitHub Integration"

info "Opening your browser to install the Vercel GitHub App..."
info "This connects Vercel to the repo so it can auto-deploy when you push changes."
echo ""
open "https://github.com/apps/vercel/installations/select_target" 2>/dev/null || warn "Could not open browser — visit https://github.com/apps/vercel/installations/select_target manually"
echo ""
printf "${YELLOW}Grant Vercel access to the 'poor-mans-flicker' repo in your browser.${NC}\n"
printf "${YELLOW}Press Enter when done...${NC} "
read -r
success "Vercel GitHub integration step complete"

# ---------------------------------------------------------------------------
# 8. Done!
# ---------------------------------------------------------------------------
echo ""
echo ""
printf "${GREEN}${BOLD}============================================${NC}\n"
printf "${GREEN}${BOLD}  Setup complete!${NC}\n"
printf "${GREEN}${BOLD}============================================${NC}\n"
echo ""
printf "To start working on your site:\n"
echo ""
printf "  ${BOLD}cd ~/poor-mans-flicker${NC}\n"
printf "  ${BOLD}claude${NC}\n"
echo ""
printf "Then just tell Claude what you want to change!\n"
echo ""
