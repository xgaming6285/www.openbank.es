@echo off
echo ========================================
echo Openbank Balance Manipulator Setup
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo Node.js version:
node --version
echo.

REM Check if package.json exists
if not exist "package.json" (
    echo ERROR: package.json not found
    echo Please run this script from the project directory
    echo.
    pause
    exit /b 1
)

REM Check if Openbank.html exists
if not exist "Openbank.html" (
    echo WARNING: Openbank.html not found in current directory
    echo Please make sure the Openbank.html file is in the same folder as this script
    echo.
)

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    echo.
    if errorlevel 1 (
        echo ERROR: Failed to install dependencies
        echo Please check your internet connection and try again
        echo.
        pause
        exit /b 1
    )
)

echo Starting Openbank Balance Manipulator Dashboard...
echo.
echo Dashboard will be available at: http://localhost:3000
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

REM Start the server
node server.js

pause

