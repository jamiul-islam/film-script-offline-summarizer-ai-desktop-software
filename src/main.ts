import { app, BrowserWindow } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { initializeIPCHandlers, cleanupIPCHandlers } from './main/ipc-handlers';
import { initializeDatabase } from './database';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

let isInitialized = false;

const createWindow = async () => {
  // Initialize database and IPC handlers only once
  if (!isInitialized) {
    try {
      await initializeDatabase();
      initializeIPCHandlers();
      isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize application:', error);
      app.quit();
      return;
    }
  }

  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true,
    },
    titleBarStyle: 'hiddenInset',
    show: false, // Don't show until ready
  });

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
  }

  // Open the DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  cleanupIPCHandlers();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Handle app termination
app.on('before-quit', () => {
  cleanupIPCHandlers();
});

// Security: Prevent new window creation
app.on('web-contents-created', (_, contents) => {
  contents.on('new-window', navigationEvent => {
    navigationEvent.preventDefault();
  });
});

// Security: Prevent navigation to external URLs
app.on('web-contents-created', (_, contents) => {
  contents.on('will-navigate', (navigationEvent, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);

    if (parsedUrl.origin !== MAIN_WINDOW_VITE_DEV_SERVER_URL) {
      navigationEvent.preventDefault();
    }
  });
});
