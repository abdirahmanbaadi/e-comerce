@echo off
echo Killing any process running on port 5173 (Vite frontend)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173 ^| findstr LISTENING') do (
    echo Killing PID %%a
    taskkill /f /pid %%a
)
echo.
echo Done! Port 5173 is now free. Run: npm run dev
pause
