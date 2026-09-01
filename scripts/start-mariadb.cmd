@echo off
setlocal
set "MYSQLD=C:\Program Files\MariaDB 12.3\bin\mysqld.exe"
set "DEFAULTS=C:\Program Files\MariaDB 12.3\data\my.ini"

netstat -ano | findstr ":3306" | findstr "LISTENING" >nul
if %ERRORLEVEL%==0 (
  echo MariaDB/MySQL is already listening on port 3306.
  exit /b 0
)

if not exist "%MYSQLD%" (
  echo MariaDB was not found at:
  echo   %MYSQLD%
  echo Install MariaDB or MySQL, then start it so port 3306 is open.
  exit /b 1
)

echo Starting MariaDB on port 3306...
start "MariaDB" /MIN "%MYSQLD%" --defaults-file="%DEFAULTS%"
timeout /t 3 /nobreak >nul
netstat -ano | findstr ":3306" | findstr "LISTENING" >nul
if %ERRORLEVEL%==0 (
  echo MariaDB is running.
  exit /b 0
)

echo MariaDB did not open port 3306. Try running Command Prompt as Administrator.
exit /b 1
