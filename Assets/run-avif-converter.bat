@echo off
title AVIF Image Automation Script
echo ===================================================
echo [INFO] Scanning folder for high-res images...
echo ===================================================

:: Check if ImageMagick is correctly installed
where magick >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] ImageMagick is not installed or path not updated!
    echo Installing ImageMagick now via Winget...
    winget install ImageMagick.ImageMagick --silent
    echo [INFO] Installed! Please close this window and run the script again.
    pause
    exit
)

:: Convert every JPG, JPEG, and PNG to AVIF at 70% high-performance quality
echo [PROCESSING] Converting files. Please wait...
magick mogrify -format avif -quality 70% "*.jpg"
magick mogrify -format avif -quality 70% "*.jpeg"
magick mogrify -format avif -quality 70% "*.png"

echo ===================================================
echo [SUCCESS] Automation finished! All AVIF files are ready.
echo ===================================================
pause
