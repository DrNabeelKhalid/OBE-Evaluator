#!/usr/bin/env bash
# ==============================================================================
# Automated Vercel Deployment Script for OBE-ICAS Platform
# Author: Engr. Dr. Nabeel Khalid
# Repository: https://github.com/DrNabeelKhalid/OBE-Evaluator
# ==============================================================================

set -e

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$REPO_DIR"

echo "=========================================================="
echo "▲ OBE-ICAS: Deploying to Vercel..."
echo "=========================================================="

# 1. Check if git is available
if ! command -v git &> /dev/null; then
  echo "❌ Git is not installed."
  exit 1
fi

# 2. Check if there are changes to stage and push
if [ -n "$(git status --porcelain)" ]; then
  echo "📦 Staging and committing local changes..."
  git add .
  git commit -m "chore(deploy): prepare updates for Vercel deployment" || true
fi

# 3. Push to GitHub (Triggers automatic Vercel Git integration if connected)
echo "🚀 Pushing to GitHub (origin/main)..."
git push origin main

echo ""
echo "=========================================================="
echo "✅ GitHub sync complete!"
echo "If your GitHub repo is connected to Vercel, your live"
echo "site will update automatically within ~15 seconds."
echo "=========================================================="
echo ""

# 4. Optional Direct Vercel CLI Deployment
read -p "Would you like to deploy directly via Vercel CLI now? (y/N): " -r choice
if [[ "$choice" =~ ^[Yy]$ ]]; then
  echo "▲ Running Vercel CLI production deployment..."
  if command -v vercel &> /dev/null; then
    vercel --prod
  else
    npx --yes vercel --prod
  fi
fi

echo ""
echo "=========================================================="
echo "🎉 Deployment Guide & Dashboard:"
echo "👉 Vercel Dashboard: https://vercel.com/dashboard"
echo "👉 1-Click Deploy:   https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FDrNabeelKhalid%2FOBE-Evaluator"
echo "=========================================================="
