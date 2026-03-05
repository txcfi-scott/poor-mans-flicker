#!/bin/bash
# Poor Man's Flickr — Development Environment Setup
# Run this on Chris's Mac to set everything up

set -e

echo "=== Poor Man's Flickr — Setup ==="
echo ""

# Check for Homebrew
if ! command -v brew &> /dev/null; then
    echo "Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
    eval "$(/opt/homebrew/bin/brew shellenv)"
fi

# Install Node.js
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    brew install node
fi

# Install Git
if ! command -v git &> /dev/null; then
    echo "Installing Git..."
    brew install git
fi

# Install Claude Code
echo "Installing Claude Code..."
npm install -g @anthropic-ai/claude-code

# Install service CLIs
echo "Installing Turso CLI..."
brew install tursodatabase/tap/turso

echo "Installing Vercel CLI..."
npm install -g vercel

echo "Installing Wrangler (Cloudflare CLI)..."
npm install -g wrangler

# Clone repo
if [ ! -d "$HOME/poor-mans-flicker" ]; then
    echo "Cloning repository..."
    cd ~
    git clone https://github.com/txcfi-scott/poor-mans-flicker.git
fi

cd ~/poor-mans-flicker

# Install dependencies
echo "Installing project dependencies..."
npm install

# Create .env.local from example
if [ ! -f .env.local ]; then
    cp .env.local.example .env.local
    echo ""
    echo "IMPORTANT: Edit ~/poor-mans-flicker/.env.local with your actual credentials"
fi

echo ""
echo "=== Setup Complete ==="
echo ""
echo "=== Next Steps ==="
echo "Log into your services:"
echo "  turso auth login"
echo "  vercel login"
echo "  wrangler login"
echo ""
echo "To start working on your site:"
echo "  cd ~/poor-mans-flicker"
echo "  claude"
echo ""
echo "To run the site locally:"
echo "  npm run dev"
echo ""
