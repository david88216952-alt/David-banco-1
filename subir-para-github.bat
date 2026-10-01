@echo off
chcp 65001 > nul
echo ===================================================
echo   Subindo NexusPay Treasury para o GitHub...
echo ===================================================
echo.

git branch -M main
git remote set-url origin https://github.com/david88216952-alt/fintech-webauthn.git
git push -u origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ===================================================
    echo   SUCESSO! O projeto ja esta no seu GitHub:
    echo   https://github.com/david88216952-alt/fintech-webauthn
    echo ===================================================
) else (
    echo.
    echo Ops! Se o repositorio ainda nao existir no GitHub,
    echo crie-o primeiro em https://github.com/new com o nome fintech-webauthn
)
echo.
pause
