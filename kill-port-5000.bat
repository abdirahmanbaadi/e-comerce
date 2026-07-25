@echo off
echo Killing any process running on port 5000 (backend server)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000') do (
    echo Killing PID %%a
    taskkill /f /pid %%a
)
echo.
echo Done! Port 5000 is now free. You can restart your server.
pause
