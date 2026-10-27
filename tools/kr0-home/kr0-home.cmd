@echo off
rem kr0-home for cmd and PowerShell: put this folder on PATH, then run "kr0-home help".
rem If Windows refuses to run the script, see "Windows script policy" in README.md.
powershell -NoProfile -File "%~dp0kr0-home.ps1" %*
