const express = require("express");
const {
  createVideoExport,
  updateVideoExport,
  listVideoExports,
  streamVideoExport
} = require("../controllers/exportController");

const router = express.Router();

router.post("/video", createVideoExport);
router.get("/video/stream", streamVideoExport);
router.get("/history", listVideoExports);
router.put("/video/:id", updateVideoExport);

module.exports = router;
