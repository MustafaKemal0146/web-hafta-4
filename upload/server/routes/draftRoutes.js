const express = require("express");
const {
  getAllDrafts,
  createDraft,
  updateDraft,
  deleteDraft
} = require("../controllers/draftController");

const router = express.Router();

router.get("/", getAllDrafts);
router.post("/", createDraft);
router.put("/:id", updateDraft);
router.delete("/:id", deleteDraft);

module.exports = router;
