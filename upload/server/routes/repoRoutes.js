const express = require("express");
const {
  listRepos,
  listRepoCommits,
  getSummaryStats,
  getProfile
} = require("../controllers/repoController");

const router = express.Router();

router.get("/", listRepos);
router.get("/profile", getProfile);
router.get("/:owner/:repo/commits", listRepoCommits);

module.exports = router;
