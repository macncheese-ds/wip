@echo off
REM Quick Start for WIP QR Scanner

echo ========================================
echo  WIP QR Scanner - Quick Start
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not found. Please install Node.js 14+
    pause
    exit /b 1
)

REM Check if MySQL is running
echo Checking MySQL connection...
mysql -u root -e "SELECT 1" >nul 2>&1
if errorlevel 1 (
    echo WARNING: MySQL not accessible or not running
    echo Make sure to:
    echo 1. Start MySQL service
    echo 2. Create database: mysql -u root -e "CREATE DATABASE IF NOT EXISTS wip_scanner"
    echo.
)

REM Setup backend
echo.
echo [1/3] Setting up backend...
cd backend
if not exist node_modules (
    echo Installing npm packages...
    call npm install
)

REM Create .env file if not exists
if not exist .env (
    echo Creating .env from .env.example...
    copy .env.example .env
    echo NOTE: Edit backend\.env with your database credentials!
)

REM Init database
echo.
echo [2/3] Initializing database...
mysql -u root wip_scanner < init.sql
if errorlevel 1 (
    echo WARNING: Database script failed - please check MySQL connection
)

REM Seed data
echo.
echo [3/3] Seeding sample data...
call npm run seed

REM Start backend
echo.
echo.
echo ========================================
echo Starting Backend API...
echo ========================================
call npm start

REM Note: Frontend is static HTML
echo.
echo To open frontend:
echo   file:///c:/Marcelo/wip/frontend/index.html
echo.
pause
