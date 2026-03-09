const VideoExport = require("../models/VideoExport");

async function createVideoExport(req, res, next) {
  try {
    const { repoName, filePath = "", status = "pending" } = req.body;
    if (!repoName) {
      res.status(400);
      throw new Error("repoName is required");
    }

    const record = await VideoExport.create({
      repoName,
      filePath,
      status,
      exportDate: new Date()
    });

    res.status(201).json(record);
  } catch (error) {
    next(error);
  }
}

async function updateVideoExport(req, res, next) {
  try {
    const { id } = req.params;
    const record = await VideoExport.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true
    });

    if (!record) {
      res.status(404);
      throw new Error("Export record not found");
    }

    res.json(record);
  } catch (error) {
    next(error);
  }
}

async function listVideoExports(req, res, next) {
  try {
    const records = await VideoExport.find().sort({ createdAt: -1 }).limit(100);
    res.json(records);
  } catch (error) {
    next(error);
  }
}

const { exec } = require("child_process");
const os = require("os");

async function streamVideoExport(req, res) {
  const repoPath = req.query.repoPath || os.homedir();
  
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive"
  });

  const sendEvent = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  const exportProcess = exec("npx --yes create-video@latest", { cwd: repoPath });

  exportProcess.stdout.on("data", (data) => {
    sendEvent("progress", data.toString());
  });

  exportProcess.stderr.on("data", (data) => {
    sendEvent("progress", data.toString());
  });

  exportProcess.on("close", (code) => {
    sendEvent("done", { success: code === 0, code });
    res.end();
  });

  req.on("close", () => {
    exportProcess.kill();
  });
}

module.exports = {
  createVideoExport,
  updateVideoExport,
  listVideoExports,
  streamVideoExport
};
