const mongoose = require("mongoose");

const cachedResponseSchema = new mongoose.Schema({
  cacheKey: {
    type: String,
    required: true,
    unique: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600 // 10 dakika sonra otomatik silinir (MongoDB TTL index)
  }
});

module.exports = mongoose.model("CachedResponse", cachedResponseSchema);
