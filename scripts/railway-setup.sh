#!/bin/bash
# Railway Setup Helper Script
# Generates required secrets and provides setup instructions

echo "🚂 Railway Deployment Setup Helper"
echo "===================================="
echo ""

# Check if openssl is available
if ! command -v openssl &> /dev/null; then
    echo "⚠️  openssl not found. Please install it to generate encryption keys."
    exit 1
fi

# Generate encryption key
echo "🔐 Generating ENCRYPTION_KEY..."
ENCRYPTION_KEY=$(openssl rand -base64 32)
echo "ENCRYPTION_KEY=$ENCRYPTION_KEY"
echo ""

echo "📋 Railway Setup Checklist:"
echo ""
echo "1. Create Railway Project:"
echo "   - Go to https://railway.app/dashboard"
echo "   - Click 'New Project' → 'Deploy from GitHub repo'"
echo "   - Select your repository"
echo ""
echo "2. Add PostgreSQL Database:"
echo "   - Click '+ New' → 'Database' → 'Add PostgreSQL'"
echo ""
echo "3. Configure Environment Variables:"
echo "   Click on your web service → Variables tab → Add:"
echo ""
echo "   DATABASE_URL=\${{Postgres.DATABASE_URL}}"
echo "   NODE_ENV=production"
echo "   PORT=3000"
echo "   CORS_ORIGIN=https://\${{RAILWAY_PUBLIC_DOMAIN}}"
echo "   ENCRYPTION_KEY=$ENCRYPTION_KEY"
echo "   CLERK_PUBLISHABLE_KEY=pk_live_xxxxx  # From clerk.com"
echo "   CLERK_SECRET_KEY=sk_live_xxxxx       # From clerk.com"
echo ""
echo "4. Add Build Arguments (Settings → Build):"
echo "   VITE_CLERK_PUBLISHABLE_KEY=pk_live_xxxxx"
echo "   VITE_API_URL=https://\${{RAILWAY_PUBLIC_DOMAIN}}"
echo ""
echo "5. Deploy:"
echo "   - Push to GitHub"
echo "   - Railway auto-deploys"
echo "   - Check logs for migration success"
echo ""
echo "6. Generate Domain (Settings → Networking):"
echo "   - Click 'Generate Domain'"
echo "   - Get your app URL"
echo ""
echo "✅ Setup complete! See docs/RAILWAY_DEPLOYMENT.md for details."
