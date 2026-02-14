#!/usr/bin/env node

import fs from 'fs';
import { createCanvas, loadImage } from 'canvas';

async function createBadgeIcon() {
  // Load the original icon
  const image = await loadImage('src-tauri/icons/icon.png');
  
  // Create canvas with same size
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext('2d');
  
  // Draw original icon
  ctx.drawImage(image, 0, 0);
  
  // Draw red dot badge in top-right corner
  const badgeSize = image.width * 0.3; // 30% of icon size
  const badgeX = image.width - badgeSize / 2;
  const badgeY = badgeSize / 2;
  
  // Draw white circle background (for better visibility)
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.arc(badgeX, badgeY, badgeSize / 2 + 2, 0, Math.PI * 2);
  ctx.fill();
  
  // Draw red dot
  ctx.fillStyle = '#FF3B30'; // macOS red color
  ctx.beginPath();
  ctx.arc(badgeX, badgeY, badgeSize / 2, 0, Math.PI * 2);
  ctx.fill();
  
  // Save the new icon
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync('src-tauri/icons/icon-badge.png', buffer);
  console.log('✅ Created icon-badge.png');
}

createBadgeIcon().catch(console.error);
