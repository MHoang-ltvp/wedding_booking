// Toàn bộ code Node.js/Express
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");
const yaml = require("yaml");
const swaggerUi = require("swagger-ui-express");
const { connectDB } = require("./config/database");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 9999;

app.use(cors());
app.use(express.json());

/** Swagger UI — OpenAPI 3 tại backend/docs/openapi.yaml */
try {
  const openapiPath = path.join(__dirname, "docs", "openapi.yaml");
  const openapiRaw = fs.readFileSync(openapiPath, "utf8");
  const openapiDocument = yaml.parse(openapiRaw);
  app.use(
    "/api/docs",
    swaggerUi.serve,
    swaggerUi.setup(openapiDocument, {
      customCss: ".swagger-ui .topbar { display: none }",
      customSiteTitle: "Wedding Booking API",
    }),
  );
  app.get("/api/openapi.yaml", (req, res) => {
    res.type("text/yaml").send(openapiRaw);
  });
  app.get("/api/openapi.json", (req, res) => {
    res.json(openapiDocument);
  });
} catch (e) {
  console.warn("Swagger: không load openapi.yaml —", e.message);
}

const routes = require("./routes");
app.use("/api", routes);

connectDB();

// Root route: tránh "Cannot GET /" khi mở backend trên trình duyệt
app.get("/", (req, res) => {
  res.json({
    ok: true,
    message: "Wedding Booking Backend",
    health: "/api/health",
    swagger: "/api/docs",
    openapiYaml: "/api/openapi.yaml",
    openapiJson: "/api/openapi.json",
  });
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true, message: "Backend đang chạy" });
});

app.listen(PORT, () => {
  console.log(`Backend chạy tại http://localhost:${PORT}`);
});
