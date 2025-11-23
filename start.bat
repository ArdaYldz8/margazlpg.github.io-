@echo off
echo.
echo ================================================================
echo    MARGAZ KONTROL SISTEMI - BASLATILIYOR
echo ================================================================
echo.
echo Backend serveri baslatiyor...
echo.
cd backend
start cmd /k "npm start"
echo.
echo ================================================================
echo    SISTEM BASLATILDI!
echo ================================================================
echo.
echo  Tarayicinizda su adresi acin:
echo  http://localhost:3000
echo.
echo  Sistemi durdurmak icin acilan terminal penceresini kapatin.
echo.
echo ================================================================
pause
