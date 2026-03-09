const electron = require("electron");
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const ipcMain = electron.ipcMain;
const path = require("path");
const { exec } = require("child_process");

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const devUrl = process.env.ELECTRON_START_URL;
  if (devUrl) {
    mainWindow.loadURL(devUrl);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../client/dist/index.html"));
  }
}



app.whenReady().then(() => {
  createWindow();

  ipcMain.handle("export-video", async (event, repoPath) => {
    return new Promise((resolve) => {
      const safeCwd = repoPath || app.getPath("home");
      const process = exec("npx create-video@latest", { cwd: safeCwd });
      let output = "";

      process.stdout.on("data", (data) => {
        const chunk = data.toString();
        output += chunk;
        if (mainWindow) mainWindow.webContents.send("export-progress", chunk);
      });

      process.stderr.on("data", (data) => {
        const chunk = data.toString();
        output += chunk;
        if (mainWindow) mainWindow.webContents.send("export-progress", chunk);
      });

      process.on("close", (code) => {
        resolve({
          success: code === 0,
          output,
          code
        });
      });
    });
  });
});


app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
