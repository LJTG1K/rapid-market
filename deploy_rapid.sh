#!/bin/bash
cd /data/.openclaw/workspace/rapid-repo

# Step 2: Configure git
echo "Step 2: Configuring git user.email..."
git config user.email "lachlan.j.ta@gmail.com"
echo "✓ Email configured"

# Step 3: Configure git user name
echo "Step 3: Configuring git user.name..."
git config user.name "Lachlan Taylor"
echo "✓ Name configured"

# Step 4: Stage files
echo "Step 4: Adding files to staging..."
git add pages/api/products.ts pages/index.tsx pages/tech-listings.tsx
echo "✓ Files staged"

# Step 5: Commit
echo "Step 5: Committing changes..."
git commit -m "Add Tech category to RAPID marketplace - New /tech-listings page, updated API for dual-sheet support, homepage with Fashion/Tech cards"
echo "✓ Changes committed"

# Step 6: Push
echo "Step 6: Pushing to GitHub..."
git push origin main
echo "✓ Pushed to origin/main"

echo ""
echo "✅ All steps completed successfully!"
