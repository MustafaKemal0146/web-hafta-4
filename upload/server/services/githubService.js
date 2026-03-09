const { Octokit } = require("@octokit/rest");
const CachedResponse = require("../models/CachedResponse");

/** Auth tipini belirle */
function detectAuthType(value) {
  if (!value) return "none";
  const v = value.trim();
  if (v.includes("::")) return "username-with-token";
  if (v.startsWith("ghp_") || v.startsWith("github_pat_") || v.startsWith("gho_")) return "token";
  return "username";
}

/** URL'den username çıkar */
function parseUsername(raw) {
  const trimmed = raw.trim().replace(/\/$/, "");
  const match = trimmed.match(/github\.com\/([a-zA-Z0-9_\-]+)/);
  return match ? match[1] : trimmed;
}

/** Auth değerini parçala → { username?, token? } */
function parseAuth(auth) {
  const type = detectAuthType(auth);
  if (type === "token") return { token: auth.trim(), username: null };
  if (type === "username-with-token") {
    const [userPart, tokenPart] = auth.split("::");
    return { username: parseUsername(userPart), token: tokenPart.trim() };
  }
  return { username: parseUsername(auth), token: process.env.GITHUB_FALLBACK_TOKEN || null };
}

/** Octokit instance oluştur */
function makeOctokit(token) {
  return token ? new Octokit({ auth: token }) : new Octokit();
}

/** Cache'den oku veya API'dan çekip kaydet */
async function getCachedOrFetch(cacheKey, fetchFn) {
  // Önce cache kontrol et
  const cached = await CachedResponse.findOne({ cacheKey });
  if (cached && cached.data) {
    return cached.data;
  }

  try {
    // API'dan çek
    const data = await fetchFn();
    
    // Asenkron olarak (beklemeden) cache'e yaz (yoksa oluştur, varsa güncelle - TTL sıfırlanır)
    CachedResponse.findOneAndUpdate(
      { cacheKey },
      { data, createdAt: new Date() },
      { upsert: true }
    ).catch(err => console.error("Cache save error:", err));
    
    return data;
  } catch (err) {
    // Rate limit hatası aldıysak (403), cache'de "stale" (eski) veri var mı diye son bir kez daha bak
    // (TTL bitmiş olabilir ama belki MongoDB henüz silmemiştir, gerçi TTL siliyor ama yine de şansımızı deneyelim)
    if (err.status === 403) {
      // Eger strict TTL yoksa veya özel bir esnek sorgu atarsak buraya gelebiliriz.
      // Şimdilik hataya özel cacheKey ve stale bilgisi ekleyip throw yapıyoruz ki errorHandler'da işleyebilelim.
      err.cacheKeyRaw = cacheKey;
    }
    throw err;
  }
}

/** Repolar: token varsa auth API, yoksa public */
async function getRepos(auth) {
  const { username, token } = parseAuth(auth);

  if (!username) {
    // Kendi repoları (cache eklemiyoruz, çünkü tokena özel ve dinamik değişebilir, public profil cache'i daha önemli)
    const octokit = makeOctokit(token);
    const { data } = await octokit.repos.listForAuthenticatedUser({
      sort: "updated", per_page: 100, visibility: "all"
    });
    return data;
  }

  // Username repos (cache'li)
  const cacheKey = `repos:${username}`;
  return getCachedOrFetch(cacheKey, async () => {
    const octokit = makeOctokit(token);
    const { data } = await octokit.repos.listForUser({
      username, sort: "updated", per_page: 100, type: "all"
    });
    return data;
  });
}

/** Commit listesi (cache'li) */
async function getCommits(auth, owner, repo, perPage = 100) {
  const { token } = parseAuth(auth);
  const cacheKey = `commits:${owner}:${repo}:${perPage}`;
  return getCachedOrFetch(cacheKey, async () => {
    const octokit = makeOctokit(token);
    const { data } = await octokit.repos.listCommits({ owner, repo, per_page: perPage });
    return data;
  });
}

/** Kullanıcı profili (cache'li) */
async function getUserProfile(auth) {
  const { username, token } = parseAuth(auth);
  if (!username) {
    const octokit = makeOctokit(token);
    const { data } = await octokit.users.getAuthenticated();
    return data;
  }
  const cacheKey = `profile:${username}`;
  return getCachedOrFetch(cacheKey, async () => {
    const octokit = makeOctokit(token);
    const { data } = await octokit.users.getByUsername({ username });
    return data;
  });
}

module.exports = { getRepos, getCommits, getUserProfile, detectAuthType, parseUsername, parseAuth };
