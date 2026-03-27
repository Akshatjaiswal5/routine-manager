// Run this script to generate PNG icons from the SVG
// Usage: node generate-icons.mjs
// Requires: npm install -D sharp
import sharp from 'sharp'
import { readFileSync } from 'fs'

const svg = readFileSync('./public/icons/icon.svg')

await sharp(svg).resize(192, 192).png().toFile('./public/icons/icon-192.png')
await sharp(svg).resize(512, 512).png().toFile('./public/icons/icon-512.png')
await sharp(svg).resize(180, 180).png().toFile('./public/icons/apple-touch-icon.png')

console.log('Icons generated successfully!')
