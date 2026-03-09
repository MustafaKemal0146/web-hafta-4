const mongoose = require("mongoose");

const videoExportSchema = new mongoose.Schema(
  {
    repoName: {
      type: String,
      required: true
    },
    exportDate: {
      type: Date,
      default: Date.now
    },
    filePath: {
      type: String,
      default: ""
    },
    status: {
      type: String,
      enum: ["pending", "done", "failed"],
      default: "pending"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("VideoExport", videoExportSchema);
