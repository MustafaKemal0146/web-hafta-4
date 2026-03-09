const CachedResponse = require("../models/CachedResponse");

function notFound(req, res) {
  res.status(404).json({ message: `Not Found: ${req.originalUrl}` });
}

// Global hata yakalayıcı
async function errorHandler(err, req, res, next) {
  // Eğer rate limit hatasıysa (403) ve elimizde eski cacheKey varsa
  if (err.status === 403 && err.cacheKeyRaw) {
    try {
      // TTL süresi geçmiş olsa bile, veritabanından kalıcı silinmeden önce yakalamak için
      // veya TTL uzatılmışsa diye son bir kez cache kontrolü yapıyoruz.
      const staleData = await CachedResponse.findOne({ cacheKey: err.cacheKeyRaw });
      if (staleData && staleData.data) {
        console.log(`[Cache] Serving STALE data due to rate limit for ${err.cacheKeyRaw}`);
        // İstemciye verinin eski olduğunu belirtmek için başlık ekliyoruz (opsiyonel ama iyi bir pratik)
        res.setHeader("X-Cache", "STALE");
        return res.status(200).json(staleData.data);
      }
    } catch (e) {
      console.error("Stale cache error:", e);
    }
    
    // Cache'de hiçbir şey yoksa istemciye 429 Too Many Requests dönelim ki UI'da düzgün gösterilsin
    return res.status(429).json({ message: "GitHub API limiti doldu ve gösterilecek önbelleğe alınmış veri yok. Lütfen PAT token kullanın." });
  }

  // Normal hata yönetimi
  const status =
    (err.status === 403 && err.message?.includes("rate limit")) ? 429 : // octokit limits for non-cached reqs
    err.status ||          // Octokit HTTP error codes
    err.statusCode ||      // Manuel atılan hatalar
    (res.statusCode >= 400 ? res.statusCode : 500);

  const message =
    err.response?.data?.message || // Octokit detaylı mesaj
    err.message ||
    "İç sunucu hatası";

  res.status(status).json({ message, status });
}

// Async route wrapper
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = { notFound, errorHandler, asyncHandler };
