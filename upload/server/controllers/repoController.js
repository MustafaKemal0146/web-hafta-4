const { getRepos, getCommits, getUserProfile } = require("../services/githubService");
const { asyncHandler } = require("../middleware/errorHandler");

/** x-github-auth header'ını oku */
function readAuth(req) {
  const auth = req.headers["x-github-auth"];
  if (!auth) {
    const err = new Error("x-github-auth header gerekli (kullanıcı adı, URL veya token)");
    err.statusCode = 401;
    throw err;
  }
  return auth;
}

function parseDayKey(d) { return new Date(d).toISOString().slice(0, 10); }
function calculateStreak(set) {
  let n = 0, cur = new Date();
  while (set.has(cur.toISOString().slice(0, 10))) { n++; cur.setDate(cur.getDate() - 1); }
  return n;
}
const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

// asyncHandler → unhandled rejection yok, server çökmüyor
const listRepos = asyncHandler(async (req, res) => {
  const repos = await getRepos(readAuth(req));
  res.json(repos);
});

const listRepoCommits = asyncHandler(async (req, res) => {
  const { owner, repo } = req.params;
  const commits = await getCommits(readAuth(req), owner, repo);
  res.json(commits);
});

const getProfile = asyncHandler(async (req, res) => {
  const profile = await getUserProfile(readAuth(req));
  res.json(profile);
});

const getSummaryStats = asyncHandler(async (req, res) => {
  const auth = readAuth(req);
  const repos = await getRepos(auth);
  const top   = repos.slice(0, 5);
  const allCommits = [];
  for (const r of top) {
    try {
      const c = await getCommits(auth, r.owner.login, r.name, 100);
      allCommits.push(...c);
    } catch { /* repo erişimi yok, atla */ }
  }
  const dayMap = allCommits.reduce((acc, c) => {
    const d = c.commit?.author?.date; if (!d) return acc;
    const k = parseDayKey(d); acc[k] = (acc[k] || 0) + 1; return acc;
  }, {});
  const wdMap = allCommits.reduce((acc, c) => {
    const d = c.commit?.author?.date; if (!d) return acc;
    const i = new Date(d).getDay(); acc[i] = (acc[i] || 0) + 1; return acc;
  }, {});
  const madKey = Object.keys(wdMap).sort((a,b) => wdMap[b]-wdMap[a])[0];
  res.json({
    totalRepos: repos.length,
    totalCommits: allCommits.length,
    currentStreak: calculateStreak(new Set(Object.keys(dayMap))),
    mostActiveDay: madKey !== undefined ? DAYS[Number(madKey)] : "N/A"
  });
});

module.exports = { listRepos, listRepoCommits, getSummaryStats, getProfile };
