# Kill process on port 3000 before starting dev server
Write-Host "Checking for processes on port 3000..." -ForegroundColor Yellow

$portProcess = netstat -ano | findstr ":3000" | findstr "LISTENING"

if ($portProcess) {
    Write-Host "Found process on port 3000, attempting to kill..." -ForegroundColor Red
    
    # Extract PID from netstat output (last column)
    $processId = $portProcess -split '\s+' | Select-Object -Last 1
    
    if ($processId -match '^\d+$') {
        try {
            Stop-Process -Id $processId -Force -ErrorAction Stop
            Write-Host "Successfully killed process $processId" -ForegroundColor Green
            Start-Sleep -Seconds 1
        }
        catch {
            Write-Host "Failed to kill process: $_" -ForegroundColor Red
        }
    }
}
else {
    Write-Host "Port 3000 is free!" -ForegroundColor Green
}

Write-Host "Starting Next.js dev server on port 3000..." -ForegroundColor Cyan
npm run next-dev
