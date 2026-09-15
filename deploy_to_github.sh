#!/usr/bin/env bash
# ==============================================================================
# Automated GitHub Deployment Script for OBE-ICAS Platform
# Author: Engr. Dr. Nabeel Khalid
# Target: https://github.com/DrNabeelKhalid/OBE-Evaluator
# ==============================================================================

set -e

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$REPO_DIR"

echo "=========================================================="
echo "🚀 OBE-ICAS: Deploying Updates to GitHub..."
echo "=========================================================="

# 1. Check if git is installed
if ! command -v git &> /dev/null; then
  echo ""
  echo "❌ Git is not installed on this system."
  echo "👉 Please install git by running:"
  echo "   sudo apt update && sudo apt install -y git"
  echo ""
  exit 1
fi

# 2. Check SSH Authentication to GitHub
echo "🔑 Verifying SSH connection to GitHub..."
if ! ssh -o BatchMode=yes -o StrictHostKeyChecking=accept-new -T git@github.com 2>&1 | grep -q -E "successfully authenticated|Hi DrNabeelKhalid"; then
  echo ""
  echo "⚠️  GitHub SSH Authentication not yet completed."
  echo "👉 Please add your public SSH key to GitHub (Settings -> SSH and GPG keys):"
  echo "   https://github.com/settings/keys"
  echo ""
  echo "Your Public Key (copy the line below):"
  echo "----------------------------------------------------------------------"
  cat /home/dr-nabeel-khalid/.ssh/id_ed25519.pub
  echo "----------------------------------------------------------------------"
  echo ""
  echo "Once added, re-run: ./deploy_to_github.sh"
  exit 1
fi

echo "✅ GitHub SSH Authentication successful!"

# 3. Configure git user identity
git config user.name "Engr. Dr. Nabeel Khalid"
git config user.email "DrNabeelKhalid@users.noreply.github.com"

# 4. Stage and commit changes
echo "📦 Staging changed files..."
git add index.html js/ css/ public/ README.md deploy_to_github.sh

echo "📝 Creating commit..."
git commit -m "Integrate Learning Beyond AI (LBAI) Framework and Two-Lane Assessment Workbench" || echo "No changes to commit or already committed."

# 5. Push to GitHub
echo "🚀 Pushing to origin main..."
git push origin main

echo ""
echo "=========================================================="
echo "🎉 SUCCESS! Changes pushed to GitHub repository."
echo "🔗 Repository: https://github.com/DrNabeelKhalid/OBE-Evaluator"
echo "🌐 Live Deployment: https://drnabeelkhalid.github.io/OBE-Evaluator/"
echo "⏳ GitHub Actions will update the live site in ~60 seconds."
echo "=========================================================="
