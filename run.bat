@echo off
echo Starting NutriFlow System...

:: Start Backend in a new window
echo Starting FastAPI Backend...
start "NutriFlow Backend" cmd /k "cd backend && call venv\Scripts\activate && uvicorn app.main:app --reload --host 0.0.0.0"

:: Start Frontend (Flutter) in a new window
echo Starting Flutter Frontend (Chrome)...
start "NutriFlow Frontend" cmd /k "cd mobile && flutter run -d chrome --web-port=8080"

echo Both services have been started in new command prompt windows.
echo Keep those windows open to keep the system running.
pause
