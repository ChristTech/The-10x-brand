@echo off
echo Setting up The 10x Brand website assets...
mkdir website\images 2>nul

set AI=C:\Users\adebi\.gemini\antigravity\brain\5e273b6f-74f9-46ce-b3cf-77b69b3ca31e

copy "%AI%\hero_background_1775668300801.png"     "website\images\hero_bg.png"
copy "%AI%\about_section_image_1775668317542.png"  "website\images\about_section.png"
copy "%AI%\portfolio_elevate_1775668334080.png"    "website\images\portfolio_elevate.png"
copy "%AI%\portfolio_nexa_1775668350183.png"       "website\images\portfolio_nexa.png"
copy "%AI%\portfolio_pulse_1775668367277.png"      "website\images\portfolio_pulse.png"
copy "%AI%\portfolio_velocity_1775668387540.png"   "website\images\portfolio_velocity.png"

echo.
echo Done! Open website\index.html in your browser.
pause
