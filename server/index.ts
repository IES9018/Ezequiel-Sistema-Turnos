import express from "express";
import cors from "cors";
import compression from "compression";
import dotenv from "dotenv";
import { existsSync } from "node:fs";
import path from "node:path";

import authRoutes from "./routes/auth.js";
import serviciosRoutes from "./routes/servicios.js";
import profesionalesRoutes from "./routes/profesionales.js";
import turnosRoutes from "./routes/turnos.js";
import { securityHeaders } from "./middlewares/security-headers.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.disable("x-powered-by");
app.use(securityHeaders);
app.use(compression());
app.use(cors());
app.use(express.json({ limit: "100kb" }));

app.get("/api/health", (_req, res) => {
  res.json({ success: true, data: { status: "ok", timestamp: new Date().toISOString() } });
});

app.use("/api/auth", authRoutes);
app.use("/api/servicios", serviciosRoutes);
app.use("/api/profesionales", profesionalesRoutes);
app.use("/api/turnos", turnosRoutes);

const clientDist = path.resolve(process.cwd(), "client/dist");
if (process.env.NODE_ENV === "production" && existsSync(clientDist)) {
  app.use(
    express.static(clientDist, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith("index.html")) {
          res.setHeader("Cache-Control", "no-cache");
        } else if (filePath.includes(`${path.sep}assets${path.sep}`)) {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        }
      },
    }),
  );
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

app.use((_req, res) => {
  res.status(404).json({ success: false, error: "Ruta no encontrada" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
