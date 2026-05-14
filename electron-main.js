const { app, BrowserWindow, Menu, shell, dialog } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'ChimioPro - Gestion des Protocoles de Chimiothérapie',
    icon: path.join(__dirname, 'assets', 'icon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true
    },
    show: false,
    backgroundColor: '#1a1a2e'
  });

  mainWindow.loadFile('index.html');

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.maximize();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  buildMenu();
}

function buildMenu() {
  const template = [
    {
      label: 'Fichier',
      submenu: [
        {
          label: 'Recharger',
          accelerator: 'F5',
          click: () => mainWindow.webContents.reload()
        },
        { type: 'separator' },
        {
          label: 'Quitter',
          accelerator: 'Alt+F4',
          click: () => app.quit()
        }
      ]
    },
    {
      label: 'Affichage',
      submenu: [
        {
          label: 'Plein écran',
          accelerator: 'F11',
          click: () => mainWindow.setFullScreen(!mainWindow.isFullScreen())
        },
        {
          label: 'Zoom avant',
          accelerator: 'Ctrl+=',
          click: () => {
            const current = mainWindow.webContents.getZoomFactor();
            mainWindow.webContents.setZoomFactor(Math.min(current + 0.1, 3));
          }
        },
        {
          label: 'Zoom arrière',
          accelerator: 'Ctrl+-',
          click: () => {
            const current = mainWindow.webContents.getZoomFactor();
            mainWindow.webContents.setZoomFactor(Math.max(current - 0.1, 0.5));
          }
        },
        {
          label: 'Zoom par défaut',
          accelerator: 'Ctrl+0',
          click: () => mainWindow.webContents.setZoomFactor(1)
        }
      ]
    },
    {
      label: 'Aide',
      submenu: [
        {
          label: 'À propos de ChimioPro',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'À propos de ChimioPro',
              message: 'ChimioPro v1.0.0',
              detail: 'Logiciel de gestion des protocoles de chimiothérapie\nCHNCAK Touba\n\nContact: onco.chn.cak@gmail.com',
              buttons: ['OK']
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
