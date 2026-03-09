const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  exportVideo: (repoPath) => ipcRenderer.invoke("export-video", repoPath),
  onExportProgress: (callback) => {
    const listener = (_, message) => callback(message);
    ipcRenderer.on("export-progress", listener);
    return () => ipcRenderer.removeListener("export-progress", listener);
  }
});
