const { app, BrowserWindow, ipcMain, nativeImage } = require("electron");
const path = require("path");
const http = require("http");
const isDev = process.env.NODE_ENV !== "production";

let mainWindow;
let server;

function startServer() {
  server = http.createServer((req, res) => {});

  server.listen(3000, "127.0.0.1", () => {
    console.log("Server running at http://127.0.0.1:3000/");
  });
}

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

  const startUrl = isDev
    ? "http://localhost:3000"
    : `file://${path.join(__dirname, "../build/index.html")}`;

  mainWindow.loadURL(startUrl);

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
  mainWindow.webContents.openDevTools();
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("ready", () => {
  startServer();
  createWindow();
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
