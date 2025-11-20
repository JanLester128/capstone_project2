# Quick Debug Script for 500 Errors
# Run this in PowerShell: .\debug-500-error.ps1

Write-Host "=== Laravel 500 Error Debug Helper ===" -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
if (Test-Path ".env") {
    Write-Host "[✓] .env file exists" -ForegroundColor Green
    
    # Check APP_DEBUG
    $appDebug = Select-String -Path ".env" -Pattern "APP_DEBUG" | ForEach-Object { $_.Line }
    if ($appDebug -match "APP_DEBUG=true") {
        Write-Host "[✓] APP_DEBUG is enabled" -ForegroundColor Green
    } else {
        Write-Host "[!] APP_DEBUG is NOT enabled" -ForegroundColor Yellow
        Write-Host "   To enable: Set APP_DEBUG=true in .env file" -ForegroundColor Yellow
    }
} else {
    Write-Host "[!] .env file not found" -ForegroundColor Red
}

Write-Host ""

# Check latest log entries
if (Test-Path "storage\logs\laravel.log") {
    Write-Host "=== Latest Error from Log (Last 30 lines) ===" -ForegroundColor Cyan
    Write-Host ""
    Get-Content "storage\logs\laravel.log" -Tail 30 | Select-String -Pattern "ERROR|Exception|Error|500" -Context 2
} else {
    Write-Host "[!] Log file not found at storage\logs\laravel.log" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Quick Fixes ===" -ForegroundColor Cyan
Write-Host "1. Enable debug mode: Set APP_DEBUG=true in .env" -ForegroundColor White
Write-Host "2. Clear caches: php artisan config:clear" -ForegroundColor White
Write-Host "3. Check browser console (F12) for JavaScript errors" -ForegroundColor White
Write-Host "4. Visit the page and check the error message shown" -ForegroundColor White
Write-Host ""

