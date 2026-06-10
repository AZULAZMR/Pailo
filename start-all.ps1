$ErrorActionPreference = 'SilentlyContinue'
$backendDir = "C:\Users\manal\AppData\Local\Temp\opencode\health-app\backend"
$frontendDir = "C:\Users\manal\AppData\Local\Temp\opencode\health-app\frontend"
$outFile = "C:\Users\manal\AppData\Local\Temp\opencode\tunnel-url.txt"

# Start backend
$bp = Start-Process -WindowStyle Hidden -FilePath "C:\Program Files\nodejs\npx.cmd" -ArgumentList "tsx src/index.ts" -WorkingDirectory $backendDir -PassThru

# Wait for backend to be ready
Start-Sleep 15

# Test backend
try {
    $r = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -UseBasicParsing -TimeoutSec 5
    Write-Output "Backend OK"
} catch {
    Write-Output "Backend FAIL: $_"
    exit 1
}

# Start localtunnel with output to file
Start-Process -WindowStyle Hidden -FilePath "C:\Program Files\nodejs\npx.cmd" -ArgumentList "localtunnel --port 3000" -WorkingDirectory $backendDir -RedirectStandardOutput $outFile -RedirectStandardError "$outFile.err"

Start-Sleep 10

# Read tunnel URL
$tunnelUrl = ""
if (Test-Path $outFile) {
    $content = Get-Content $outFile -Raw
    Write-Output "Tunnel output: $content"
    $match = [regex]::Match($content, 'https?://[^\s]+')
    if ($match.Success) {
        $tunnelUrl = $match.Value.Trim()
    }
}

if ($tunnelUrl -eq "") {
    # Try to check error output
    if (Test-Path "$outFile.err") {
        $err = Get-Content "$outFile.err" -Raw
        Write-Output "Tunnel error: $err"
    }
    Write-Output "Could not determine tunnel URL"
    exit 1
}

Write-Output "Tunnel URL: $tunnelUrl"

# Test tunnel
try {
    $r2 = curl.exe -s -w "`nHTTP: %{http_code}" "$tunnelUrl/api/health" 2>&1
    Write-Output "Tunnel test: $r2"
} catch {
    Write-Output "Tunnel test error: $_"
}

# Update api.ts with tunnel URL
$apiFile = "$frontendDir\src\services\api.ts"
$newUrl = $tunnelUrl.TrimEnd('/') + '/api'
(Get-Content $apiFile) -replace "const API_BASE = '.*';", "const API_BASE = '$newUrl';" | Set-Content $apiFile
Write-Output "Updated API_BASE to: $newUrl"

# Start Expo
$ep = Start-Process -WindowStyle Hidden -FilePath "C:\Program Files\nodejs\npx.cmd" -ArgumentList "expo start --lan" -WorkingDirectory $frontendDir -PassThru
Write-Output "Expo started: PID $($ep.Id)"

Write-Output "`nDONE - Scan QR at http://localhost:8081"
