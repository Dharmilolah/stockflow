#!/bin/bash
echo "🚀 Deploying StockFlow to Vercel..."
echo ""
echo "Step 1: Installing Vercel CLI..."
npm install -g vercel

echo ""
echo "Step 2: Logging in to Vercel..."
vercel login

echo ""
echo "Step 3: Deploying..."
vercel --prod --yes \
  --name stockflow \
  --build-env VITE_SUPABASE_URL=https://nrctzpevpiqoexbqmrnv.supabase.co \
  --build-env VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yY3R6cGV2cGlxb2V4YnFtcm52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4NzI4NjYsImV4cCI6MjA5MDQ0ODg2Nn0.VqqEXZnuXzR-z4Sol8FfIn5RgbIUUi-rUDOQt857U1c

echo ""
echo "✅ Done! Your app is live."
