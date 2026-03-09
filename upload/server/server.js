const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const connectDb = require("./config/db");
const repoRoutes = require("./routes/repoRoutes");
const statsRoutes = require("./routes/statsRoutes");
const draftRoutes = require("./routes/draftRoutes");
const exportRoutes = require("./routes/exportRoutes");
const { notFound, errorHandler } = require("./middleware/errorHandler");

dotenv.config({ path: "../.env" });

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173"
  })
);
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/repos", repoRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/drafts", draftRoutes);
app.use("/api/export", exportRoutes);

app.use(notFound);
app.use(errorHandler);

const port = process.env.PORT || 3000;

connectDb()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error("Database connection failed:", error.message);
    process.exit(1);
  });
