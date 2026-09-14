@echo off
setlocal
set GRADLE_VERSION=8.10.2
set APP_HOME=%~dp0
if "%GRADLE_USER_HOME%"=="" set GRADLE_USER_HOME=%USERPROFILE%\.gradle
set DIST_DIR=%GRADLE_USER_HOME%\wrapper\dists\localon-gradle-%GRADLE_VERSION%
set GRADLE_HOME=%DIST_DIR%\gradle-%GRADLE_VERSION%
set ZIP_FILE=%DIST_DIR%\gradle-%GRADLE_VERSION%-bin.zip
set DIST_URL=https://services.gradle.org/distributions/gradle-%GRADLE_VERSION%-bin.zip

if not exist "%GRADLE_HOME%\bin\gradle.bat" (
  if not exist "%DIST_DIR%" mkdir "%DIST_DIR%"
  echo Gradle %GRADLE_VERSION% not found locally. Downloading it once...
  powershell -NoProfile -ExecutionPolicy Bypass -Command "Invoke-WebRequest -UseBasicParsing '%DIST_URL%' -OutFile '%ZIP_FILE%'"
  if errorlevel 1 exit /b 1
  powershell -NoProfile -ExecutionPolicy Bypass -Command "Expand-Archive -Force '%ZIP_FILE%' '%DIST_DIR%'"
  if errorlevel 1 exit /b 1
  del "%ZIP_FILE%"
)

call "%GRADLE_HOME%\bin\gradle.bat" -p "%APP_HOME%" %*
endlocal
