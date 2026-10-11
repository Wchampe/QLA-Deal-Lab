@echo off
cd /d "%~dp0"
if "%OLLAMA_MODELS%"=="" if exist "E:\ollama-models\manifests" set "OLLAMA_MODELS=E:\ollama-models"
node start-ollama.js
node server.js
pause
