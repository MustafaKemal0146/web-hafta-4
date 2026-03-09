const Draft = require("../models/Draft");

async function getAllDrafts(req, res, next) {
  try {
    const drafts = await Draft.find().sort({ updatedAt: -1 });
    res.json(drafts);
  } catch (error) {
    next(error);
  }
}

async function createDraft(req, res, next) {
  try {
    const draft = await Draft.create(req.body);
    res.status(201).json(draft);
  } catch (error) {
    next(error);
  }
}

async function updateDraft(req, res, next) {
  try {
    const { id } = req.params;
    const draft = await Draft.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true
    });

    if (!draft) {
      res.status(404);
      throw new Error("Draft not found");
    }

    res.json(draft);
  } catch (error) {
    next(error);
  }
}

async function deleteDraft(req, res, next) {
  try {
    const { id } = req.params;
    const draft = await Draft.findByIdAndDelete(id);
    if (!draft) {
      res.status(404);
      throw new Error("Draft not found");
    }
    res.json({ message: "Draft deleted" });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllDrafts,
  createDraft,
  updateDraft,
  deleteDraft
};
