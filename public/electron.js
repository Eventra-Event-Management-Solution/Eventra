const { app, BrowserWindow, ipcMain, nativeImage } = require("electron");
const path = require("path");
const isDev = process.env.NODE_ENV !== "production";

let mainWindow;

function createWindow() {
  const iconPath = path.join(__dirname, "./logo.ico"); // Adjust path as needed
  const icon = nativeImage.createFromPath(iconPath);
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: icon,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
    icon: path.join(__dirname, "logo.svg"),
    menu: null,
  });
  mainWindow.setMenu(null);
  mainWindow.maximize();
  mainWindow.webContents.openDevTools();

  // Load the app
  const startUrl = isDev
    ? "http://localhost:3000"
    : `file://${path.join(__dirname, "../build/index.html")}`;

  mainWindow.loadURL(startUrl);

  // Emitted when the window is closed
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// Create window when Electron is ready
app.whenReady().then(createWindow);

// Quit when all windows are closed
app.on("window-all-closed", () => {
  // On macOS it is common for applications to stay open until the user quits
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On macOS it's common to re-create a window when the dock icon is clicked
  if (mainWindow === null) {
    createWindow();
  }
});

// Handle IPC messages from renderer process if needed
ipcMain.on("app-message", (event, arg) => {
  console.log(arg);
  event.reply("app-reply", "Message received!");
});
