
' Lanceur ChimioPro - Ouvre l'application dans Edge en mode bureau
Option Explicit

Dim oShell, oFSO, appPath, edgePath, fileUrl, args

Set oShell = CreateObject("WScript.Shell")
Set oFSO = CreateObject("Scripting.FileSystemObject")

' Chemin vers le dossier de l'application (même dossier que ce script)
appPath = oFSO.GetParentFolderName(WScript.ScriptFullName)
fileUrl = "file:///" & Replace(appPath & "\index.html", "\", "/")

' Chercher Microsoft Edge
Dim edgePaths(3)
edgePaths(0) = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
edgePaths(1) = "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
edgePaths(2) = oShell.ExpandEnvironmentStrings("%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe")
edgePaths(3) = oShell.ExpandEnvironmentStrings("%ProgramFiles%\Microsoft\Edge\Application\msedge.exe")

edgePath = ""
Dim i
For i = 0 To 3
    If oFSO.FileExists(edgePaths(i)) Then
        edgePath = edgePaths(i)
        Exit For
    End If
Next

If edgePath = "" Then
    MsgBox "Microsoft Edge n'a pas été trouvé sur ce poste." & vbCrLf & _
           "Veuillez installer Microsoft Edge et réessayer.", vbCritical, "ChimioPro"
    WScript.Quit 1
End If

' Dossier profil utilisateur dédié à ChimioPro
Dim profileDir
profileDir = oShell.ExpandEnvironmentStrings("%APPDATA%\ChimioPro\EdgeProfile")

' Arguments Edge en mode application (fenêtre sans barre d'adresse ni onglets)
args = """" & edgePath & """ " & _
       "--app=""" & fileUrl & """ " & _
       "--user-data-dir=""" & profileDir & """ " & _
       "--window-size=1400,900 " & _
       "--disable-extensions " & _
       "--no-default-browser-check"

' Lancer Edge
oShell.Run args, 1, False
