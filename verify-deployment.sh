#!/bin/bash

echo "=== RDCM Mining Dashboard Deployment Verification ==="
echo ""
echo "📦 Public folder contents:"
ls -lh public/ | tail -n +2
echo ""
echo "📝 Index.html first 15 lines:"
head -15 public/index.html | grep -E '<title>|⛏️'
echo ""
echo "⚙️  Netlify config:"
cat netlify.toml | head -15
echo ""
echo "✅ Deployment triggered - Netlify is building..."
echo "🌍 Check live at: https://rdcmnation14.netlify.app/"
