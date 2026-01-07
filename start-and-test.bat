@echo off
echo Starting server...
start /min "MovieaServer" cmd /c "node index.js"
timeout /t 5 /nobreak > nul
echo Server should be running now. Testing...
node test-reviews.js
echo.
echo Press any key to stop the server...
pause > nul
taskkill /FI "WindowTitle eq MovieaServer*" /F
