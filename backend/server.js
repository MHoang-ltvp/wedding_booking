// Toàn bộ code Node.js/Express
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { connectDB } = require("./config/database");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 9999;

app.use(cors());
app.use(express.json());

const routes = require("./routes");
app.use("/api", routes);

connectDB();

// Root route: tránh "Cannot GET /" khi mở backend trên trình duyệt
app.get("/", (req, res) => {
  res.json({
    ok: true,
    message: "Wedding Booking Backend",
    health: "/api/health",
  });
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true, message: "Backend đang chạy" });
});

app.listen(PORT, () => {
  console.log(`Backend chạy tại http://localhost:${PORT}`);
});
