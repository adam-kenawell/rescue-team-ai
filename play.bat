@echo off
cd /d "%~dp0backend"
poetry run python manage.py play %*
