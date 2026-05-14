# Serveur HTTP local pour ChimioPro Mobile (PWA)
param([int]$Port = 8080)

$appDir = Split-Path -Parent $MyInvocation.MyCommand.Path

$mimeTypes = @{
    '.html' = 'text/html; charset=utf-8'
    '.css'  = 'text/css; charset=utf-8'
    '.js'   = 'application/javascript; charset=utf-8'
    '.json' = 'application/json; charset=utf-8'
    '.svg'  = 'image/svg+xml'
    '.png'  = 'image/png'
    '.ico'  = 'image/x-icon'
    '.xls'  = 'application/vnd.ms-excel'
    '.xlsx' = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
}

# Detecter l'IP locale
$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
    $_.InterfaceAlias -notmatch 'Loopback' -and
    $_.IPAddress -notmatch '^169\.' -and
    $_.PrefixOrigin -ne 'WellKnown'
} | Select-Object -First 1).IPAddress
if (-not $ip) { $ip = "127.0.0.1" }

# Tenter d'ecouter sur toutes les interfaces (necessite admin)
# Si echec, ecouter localhost uniquement
$listener = New-Object System.Net.HttpListener
$allInterfaces = $false

try {
    $listener.Prefixes.Add("http://+:$Port/")
    $listener.Start()
    $allInterfaces = $true
} catch {
    $listener = New-Object System.Net.HttpListener
    $listener.Prefixes.Add("http://localhost:$Port/")
    $listener.Prefixes.Add("http://127.0.0.1:$Port/")
    try {
        $listener.Start()
    } catch {
        Write-Host "Impossible de demarrer le serveur sur le port $Port." -ForegroundColor Red
        Write-Host "Essayez: .\Serveur-Mobile.ps1 -Port 9090" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "   ChimioPro - Serveur Mobile" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
if ($allInterfaces) {
    Write-Host "  Telephone : http://${ip}:$Port" -ForegroundColor Yellow
} else {
    Write-Host "  (Mode restreint - localhost uniquement)" -ForegroundColor Yellow
    Write-Host "  Lancez en tant qu'Administrateur pour l'acces reseau" -ForegroundColor Gray
}
Write-Host "  PC        : http://localhost:$Port" -ForegroundColor Cyan
Write-Host ""
Write-Host "Ctrl+C pour arreter." -ForegroundColor Gray

function Get-Response($context) {
    $req  = $context.Request
    $resp = $context.Response

    $urlPath = $req.Url.LocalPath -replace '^/', ''
    if ($urlPath -eq '' -or $urlPath -eq '/') { $urlPath = 'index.html' }

    $filePath = Join-Path $appDir ($urlPath -replace '/', [System.IO.Path]::DirectorySeparatorChar)

    $resp.Headers.Add("Access-Control-Allow-Origin", "*")
    $resp.Headers.Add("Service-Worker-Allowed", "/")
    $resp.Headers.Add("Cache-Control", "no-cache")

    if (Test-Path $filePath -PathType Leaf) {
        $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
        $resp.ContentType = if ($mimeTypes.ContainsKey($ext)) { $mimeTypes[$ext] } else { 'application/octet-stream' }
        $bytes = [System.IO.File]::ReadAllBytes($filePath)
        $resp.ContentLength64 = $bytes.Length
        $resp.OutputStream.Write($bytes, 0, $bytes.Length)
        Write-Host "  200 /$urlPath" -ForegroundColor DarkGray
    } else {
        $resp.StatusCode = 404
        $bytes = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
        $resp.ContentLength64 = $bytes.Length
        $resp.OutputStream.Write($bytes, 0, $bytes.Length)
        Write-Host "  404 /$urlPath" -ForegroundColor DarkGray
    }
    $resp.OutputStream.Close()
}

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        Get-Response $context
    }
} finally {
    $listener.Stop()
    Write-Host "Serveur arrete." -ForegroundColor Gray
}
