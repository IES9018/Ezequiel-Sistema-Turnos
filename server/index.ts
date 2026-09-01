import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.js";
import serviciosRoutes from "./routes/servicios.js";
import profesionalesRoutes from "./routes/profesionales.js";
import turnosRoutes from "./routes/turnos.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ success: true, data: { status: "ok", timestamp: new Date().toISOString() } });
});

app.use("/api/auth", authRoutes);
app.use("/api/servicios", serviciosRoutes);
app.use("/api/profesionales", profesionalesRoutes);
app.use("/api/turnos", turnosRoutes);

app.use((_req, res) => {
  res.status(404).json({ success: false, error: "Ruta no encontrada" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
