# ─── start-sharing.ps1 ────────────────────────────────────────────────────────
# One command to start a full remote sharing session.
# Uses TWO Cloudflare tunnels (no ngrok needed):
#   1. Backend API (port 3000)
#   2. Metro bundler (port 8081)
# ──────────────────────────────────────────────────────────────────────────────

# ── Config ────────────────────────────────────────────────────────────────────
$PINE_DIR      = "C:\Users\nick\Desktop\pine\artifacts\Pine"
$BACKEND_DIR   = "C:\Users\nick\Desktop\pine\artifacts\pine-backend"
$MOBILE_ENV    = "$PINE_DIR\.env"
$BACKEND_ENV   = "$BACKEND_DIR\.env"
$CORS_BASE     = "CORS_ORIGINS=http://localhost:19006,http://localhost:8081,http://localhost:3000,http://localhost:5000"

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "      Pine - Remote Sharing Session         " -ForegroundColor Cyan
Write-Host "     (Cloudflare tunnels, no ngrok)         " -ForegroundColor DarkCyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# ── Cleanup: kill any leftover cloudflared processes from previous runs ───────
$stale = Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue
if ($stale) {
    Write-Host "[CLEANUP] Stopping leftover cloudflared processes..." -ForegroundColor DarkYellow
    $stale | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

# ── Helper: Start a Cloudflare tunnel and wait for the URL ────────────────────
function Start-CfTunnel {
    param(
        [string]$Port,
        [string]$Label
    )

    $logFile = "$env:TEMP\pine_cf_${Label}.log"
    if (Test-Path $logFile) { Remove-Item $logFile -Force -ErrorAction SilentlyContinue }

    $proc = Start-Process -FilePath "cloudflared" `
        -ArgumentList "tunnel", "--url", "http://localhost:$Port" `
        -RedirectStandardError $logFile `
        -NoNewWindow -PassThru

    $url = $null
    $timeout = 45
    $elapsed = 0
    # Wait a moment for cloudflared to create the log file
    Start-Sleep -Seconds 3
    $elapsed = 3
    while ($elapsed -lt $timeout) {
        Start-Sleep -Seconds 1
        $elapsed++
        if (Test-Path $logFile) {
            # Read file using FileShare.ReadWrite so we can read while cloudflared writes
            try {
                $fs = [System.IO.FileStream]::new(
                    $logFile,
                    [System.IO.FileMode]::Open,
                    [System.IO.FileAccess]::Read,
                    [System.IO.FileShare]::ReadWrite
                )
                $sr = [System.IO.StreamReader]::new($fs)
                $log = $sr.ReadToEnd()
                $sr.Close()
                $fs.Close()
            } catch {
                continue
            }
            if ($log -and $log -match "https://[a-z0-9-]+\.trycloudflare\.com") {
                $url = $matches[0]
                break
            }
        }
    }

    return @{ Process = $proc; Url = $url }
}

# ── 1. Start Cloudflare tunnel for Backend (port 3000) ────────────────────────
Write-Host "[1/5] Starting Cloudflare tunnel for Backend (port 3000)..." -ForegroundColor Yellow

$backend = Start-CfTunnel -Port 3000 -Label "backend"

if (-not $backend.Url) {
    Write-Host "[ERROR] Could not get backend Cloudflare tunnel URL." -ForegroundColor Red
    Write-Host "        Is cloudflared installed? winget install Cloudflare.cloudflared" -ForegroundColor Red
    $backend.Process | Stop-Process -ErrorAction SilentlyContinue
    exit 1
}

$backendUrl = $backend.Url
Write-Host "[OK] Backend tunnel ready: $backendUrl" -ForegroundColor Green

# ── 2. Start Cloudflare tunnel for Metro (port 8081) ──────────────────────────
Write-Host "[2/5] Starting Cloudflare tunnel for Metro (port 8081)..." -ForegroundColor Yellow

$metro = Start-CfTunnel -Port 8081 -Label "metro"

if (-not $metro.Url) {
    Write-Host "[ERROR] Could not get Metro Cloudflare tunnel URL." -ForegroundColor Red
    $backend.Process | Stop-Process -ErrorAction SilentlyContinue
    $metro.Process | Stop-Process -ErrorAction SilentlyContinue
    exit 1
}

$metroUrl = $metro.Url
Write-Host "[OK] Metro tunnel ready: $metroUrl" -ForegroundColor Green

# ── 3. Update .env files ───────────────────────────────────────────────────────
Write-Host "[3/5] Updating .env files with new backend URL..." -ForegroundColor Yellow

# Pine/.env — EXPO_PUBLIC_API_URL
$mobileEnvContent = Get-Content $MOBILE_ENV
$mobileEnvContent = $mobileEnvContent -replace "^EXPO_PUBLIC_API_URL=.*$", "EXPO_PUBLIC_API_URL=$backendUrl/v1"
Set-Content $MOBILE_ENV $mobileEnvContent -Encoding UTF8

# pine-backend/.env — NGROK_URL + CORS_ORIGINS (add both tunnel URLs)
$backendEnvContent = Get-Content $BACKEND_ENV
$backendEnvContent = $backendEnvContent -replace "^NGROK_URL=.*$", "NGROK_URL=$backendUrl"
$backendEnvContent = $backendEnvContent -replace "^CORS_ORIGINS=.*$", "$CORS_BASE,$backendUrl,$metroUrl"
Set-Content $BACKEND_ENV $backendEnvContent -Encoding UTF8

Write-Host "[OK] Both .env files updated" -ForegroundColor Green

# ── 4. Restart backend in a new window ────────────────────────────────────────
Write-Host "[4/5] Restarting backend server..." -ForegroundColor Yellow

# Kill whatever is on port 3000
$portConn = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
if ($portConn) {
    Stop-Process -Id $portConn.OwningProcess -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

# Start backend in a new CMD window so logs are visible
Start-Process -FilePath "cmd.exe" `
    -ArgumentList "/k", "cd /d `"$BACKEND_DIR`" && npm run start:dev" `
    -WindowStyle Normal

Write-Host "[OK] Backend restarting in a new window (wait ~10s for it to be ready)" -ForegroundColor Green
Start-Sleep -Seconds 10

# ── 5. Start Expo with Cloudflare tunnel (no ngrok) ──────────────────────────
Write-Host "[5/5] Starting Expo (Metro tunnelled via Cloudflare)..." -ForegroundColor Yellow
Write-Host ""
Write-Host "============================================================" -ForegroundColor White
Write-Host "" -ForegroundColor White
Write-Host "  Backend API:" -ForegroundColor Gray
Write-Host "  $backendUrl" -ForegroundColor Green
Write-Host "" -ForegroundColor White
Write-Host "  Metro bundler (share this with your friend):" -ForegroundColor Gray
Write-Host "  $metroUrl" -ForegroundColor Green
Write-Host "" -ForegroundColor White
Write-Host "  Your friend opens their dev build and enters:" -ForegroundColor Gray
Write-Host "  $metroUrl" -ForegroundColor Cyan
Write-Host "" -ForegroundColor White
Write-Host "============================================================" -ForegroundColor White
Write-Host ""

# Tell Metro about its public URL so assets/source maps resolve correctly
$env:EXPO_PACKAGER_PROXY_URL = $metroUrl

Set-Location $PINE_DIR
pnpm expo start --dev-client

# ── Cleanup when Expo exits ────────────────────────────────────────────────────
Write-Host ""
Write-Host "[DONE] Stopping Cloudflare tunnels..." -ForegroundColor Yellow
$backend.Process | Stop-Process -ErrorAction SilentlyContinue
$metro.Process | Stop-Process -ErrorAction SilentlyContinue
