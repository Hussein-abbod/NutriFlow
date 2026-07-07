@echo off
echo Starting NutriFlow System on Connected Device...

:: Start Backend in a new window
echo Starting FastAPI Backend...
start "NutriFlow Backend" cmd /k "cd backend && call venv\Scripts\activate && uvicorn app.main:app --reload --host 0.0.0.0"

:: Start Frontend (Flutter) in a new window
echo Starting Flutter Frontend (Phone)...
start "NutriFlow Frontend" cmd /k "cd mobile && flutter run"

echo Both services have been started in new command prompt windows.
echo Keep those windows open to keep the system running.
echo.
echo =========================================================
echo IMPORTANT: To make the app work on your physical phone,
echo you MUST update the baseUrl in api_client.dart to use 
echo your computer's local Wi-Fi IP address instead of localhost.
echo =========================================================
echo.
pause
