# Script d'installation ChimioPro
# Cree les raccourcis sur le Bureau et dans le Menu Demarrer

$appDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$vbsLauncher = Join-Path $appDir "ChimioPro.vbs"

if (-not (Test-Path $vbsLauncher)) {
    Write-Host "ERREUR: ChimioPro.vbs introuvable dans $appDir" -ForegroundColor Red
    pause
    exit 1
}

$WshShell = New-Object -ComObject WScript.Shell

# Raccourci Bureau
$desktopPath = [System.Environment]::GetFolderPath("Desktop")
$shortcutBureau = "$desktopPath\ChimioPro.lnk"
$lnk = $WshShell.CreateShortcut($shortcutBureau)
$lnk.TargetPath = "wscript.exe"
$lnk.Arguments = """$vbsLauncher"""
$lnk.WorkingDirectory = $appDir
$lnk.Description = "ChimioPro - Gestion des protocoles de chimiotherapie"
$lnk.WindowStyle = 1

# Icone : utiliser l'icone de Edge par defaut si pas d'icone specifique
$iconPath = Join-Path $appDir "assets\icon.ico"
if (Test-Path $iconPath) {
    $lnk.IconLocation = $iconPath
} else {
    $edgeIcon = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe,0"
    if (Test-Path "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe") {
        $lnk.IconLocation = $edgeIcon
    }
}
$lnk.Save()

# Raccourci Menu Demarrer
$startMenuPath = [System.Environment]::GetFolderPath("StartMenu")
$startMenuApp = "$startMenuPath\Programs\ChimioPro"
New-Item -ItemType Directory -Force -Path $startMenuApp | Out-Null

$shortcutMenu = "$startMenuApp\ChimioPro.lnk"
$lnk2 = $WshShell.CreateShortcut($shortcutMenu)
$lnk2.TargetPath = "wscript.exe"
$lnk2.Arguments = """$vbsLauncher"""
$lnk2.WorkingDirectory = $appDir
$lnk2.Description = "ChimioPro - Gestion des protocoles de chimiotherapie"
$lnk2.WindowStyle = 1
if (Test-Path $iconPath) { $lnk2.IconLocation = $iconPath }
$lnk2.Save()

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  ChimioPro installe avec succes !" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Raccourcis crees :" -ForegroundColor Cyan
Write-Host "  Bureau      : $shortcutBureau"
Write-Host "  Menu Demarrer : $shortcutMenu"
Write-Host ""
Write-Host "Double-cliquez sur l'icone ChimioPro sur votre bureau pour lancer l'application."
Write-Host ""
pause
