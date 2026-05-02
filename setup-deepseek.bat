@echo off
REM ==========================================
REM DeepSeek CLI Setup Script for Windows
REM MYFIT Project
REM ==========================================

echo.
echo ========================================
echo  DeepSeek CLI Setup for MYFIT Project
echo ========================================
echo.

REM Check if Node.js is installed
echo [1/5] Checking Node.js installation...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
)

node --version
echo Node.js found!
echo.

REM Check if npm is available
echo [2/5] Checking npm...
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: npm is not available!
    pause
    exit /b 1
)

npm --version
echo npm found!
echo.

REM Check if Ollama is installed
echo [3/5] Checking Ollama installation...
where ollama >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo WARNING: Ollama is not installed!
    echo.
    echo Please download and install Ollama from:
    echo https://ollama.ai/download
    echo.
    set /p CONTINUE="Continue anyway? (y/n): "
    if /i not "%CONTINUE%"=="y" exit /b 1
) else (
    echo Ollama found!
)
echo.

REM Install DeepSeek CLI globally
echo [4/5] Installing DeepSeek CLI...
call npm install -g run-deepseek-cli
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to install DeepSeek CLI!
    echo Try running this script as Administrator.
    pause
    exit /b 1
)
echo DeepSeek CLI installed successfully!
echo.

REM Verify installation
echo [5/5] Verifying installation...
deepseek --version
if %ERRORLEVEL% NEQ 0 (
    echo WARNING: Could not verify deepseek command
) else (
    echo DeepSeek CLI verified!
)
echo.

REM Create .env file if it doesn't exist
if not exist ".env" (
    echo Creating .env configuration file...
    copy .env.example .env
    echo .env file created! Please review and update settings.
) else (
    echo .env file already exists.
)
echo.

REM Instructions for next steps
echo ========================================
echo  Setup Complete!
echo ========================================
echo.
echo Next steps:
echo.
echo 1. If you haven't installed Ollama yet:
echo    - Download from https://ollama.ai/download
echo    - Install and restart your terminal
echo.
echo 2. Start Ollama service:
echo    ollama serve
echo.
echo 3. Install DeepSeek Coder model:
echo    ollama pull deepseek-coder:6.7b
echo.
echo 4. Start using DeepSeek CLI:
echo    cd c:\Users\HKN\MYFIT-
echo    deepseek
echo.
echo For more information, see:
echo - DEEPSEEK_CLI_INTEGRATION.md
echo - https://github.com/holasoymalva/deepseek-cli
echo.
pause
