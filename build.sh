#!/bin/bash
cd /home/ubuntu/aifi
npm install
cd /home/ubuntu/aifi/apps/web
VITE_API_URL=https://docmind.space /home/ubuntu/aifi/node_modules/.bin/vite build
sudo systemctl reload nginx
echo "✅ Frontend built and deployed!"
