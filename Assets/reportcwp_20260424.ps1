# Navigate to the folder where this script is running
$currentDir = Convert-Path .

Write-Host "Starting automation: Converting all local images to AVIF..." -ForegroundColor Cyan

# Batch convert both JPEGs and PNGs to AVIF at 70% quality
magick mogrify -format avif -quality 70% "$currentDir\*.jpg"
magick mogrify -format avif -quality 70% "$currentDir\*.png"

Write-Host "Success! Your optimized AVIF files are ready." -ForegroundColor Green
Pause
