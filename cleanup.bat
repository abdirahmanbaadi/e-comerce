@echo off
echo Deleting duplicate folders from root...
rmdir /s /q "bedroom" 2>nul
rmdir /s /q "chair" 2>nul
rmdir /s /q "css" 2>nul
rmdir /s /q "dining-room" 2>nul
rmdir /s /q "js" 2>nul
rmdir /s /q "legacy" 2>nul
rmdir /s /q "living-room" 2>nul
rmdir /s /q "office" 2>nul
rmdir /s /q "outdoor" 2>nul
del /f /q "hero1.jpeg" 2>nul
echo Cleanup complete!
pause
