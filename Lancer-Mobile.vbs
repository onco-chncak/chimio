' Lanceur ChimioPro Mobile
Option Explicit

Dim oShell, oFSO, oNet, scriptDir

Set oShell = CreateObject("WScript.Shell")
Set oFSO   = CreateObject("Scripting.FileSystemObject")
Set oNet   = CreateObject("WScript.Network")

scriptDir = oFSO.GetParentFolderName(WScript.ScriptFullName)

' --- Detecter l'IP locale via PowerShell ---
Dim psCmd, exec, ip
psCmd = "powershell.exe -NoProfile -Command """ & _
    "(Get-NetIPAddress -AddressFamily IPv4 | Where-Object {" & _
    "$_.InterfaceAlias -notmatch 'Loopback' -and " & _
    "$_.IPAddress -notmatch '^169\.' -and " & _
    "$_.PrefixOrigin -ne 'WellKnown'} | Select-Object -First 1).IPAddress"""

Set exec = oShell.Exec(psCmd)
Do While exec.Status = 0 : WScript.Sleep 100 : Loop
ip = Trim(exec.StdOut.ReadAll())
If ip = "" Then ip = "192.168.1.x"

Dim port : port = "8080"
Dim url  : url  = "http://" & ip & ":" & port

' --- Demarrer le serveur en arriere-plan ---
Dim serverCmd
serverCmd = "powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -File """ & _
            scriptDir & "\Serveur-Mobile.ps1"" -Port " & port
oShell.Run serverCmd, 0, False

WScript.Sleep 1500

' --- Afficher la fenetre d'instructions ---
Dim msg
msg = "ChimioPro est accessible sur votre telephone !" & vbCrLf & vbCrLf & _
      "======================================" & vbCrLf & _
      "  ADRESSE A TAPER SUR LE TELEPHONE :" & vbCrLf & vbCrLf & _
      "     " & url & vbCrLf & vbCrLf & _
      "======================================" & vbCrLf & vbCrLf & _
      "CONDITIONS REQUISES :" & vbCrLf & _
      "  - Le telephone doit etre sur le meme Wi-Fi que ce PC" & vbCrLf & vbCrLf & _
      "ETAPES SUR LE TELEPHONE :" & vbCrLf & _
      "  Android (Chrome)  : Menu (3 pts) > Ajouter a l'ecran d'accueil" & vbCrLf & _
      "  iPhone (Safari)   : Partager (carre+fleche) > Sur l'ecran d'accueil" & vbCrLf & vbCrLf & _
      "Le serveur tourne en arriere-plan." & vbCrLf & _
      "Cliquez OK pour fermer ce message (le serveur reste actif)."

MsgBox msg, vbInformation, "ChimioPro Mobile - Pret !"
