@echo off
echo.
echo ╔════════════════════════════════════════════════╗
echo ║  SafetySnap Django Auto-Restart              ║
echo ║  Started by: Ansible Automation              ║
echo ║  Time: %date% %time%                         ║
echo ╚════════════════════════════════════════════════╝
echo.
echo [AUTO-RESTARTED] Starting Django Server...
echo.
cd /d "/mnt/d/PROJECTS/SafetySnap/backend"
/mnt/d/PROJECTS/SafetySnap/venv/Scripts/python.exe manage.py runserver 0.0.0.0:8000
