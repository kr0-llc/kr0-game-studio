@echo off
rem kr0 Asset Desk launcher for Windows. Edit DRIVE_ART if your folder is elsewhere.
rem Scenario keys: set SCENARIO_API_KEY and SCENARIO_API_SECRET once in your user
rem environment variables (Settings > System > About > Advanced system settings).
cd /d "%~dp0"
set "DRIVE_ART=G:\My Drive\kr0 Studio Art"
if not exist "%DRIVE_ART%" (
  echo Drive folder not found: %DRIVE_ART%
  echo Is Google Drive for Desktop running? Edit DRIVE_ART in this file if the path differs.
  pause
  exit /b 1
)
start "" http://127.0.0.1:8765
python asset_desk.py --root "drive=%DRIVE_ART%" --root "repo=%~dp0..\..\art" --scan
pause
