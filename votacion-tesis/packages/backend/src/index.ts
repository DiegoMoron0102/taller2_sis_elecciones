import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import authRoutes from "./routes/authRoutes";
import votoRoutes from "./routes/votoRoutes";
import adminRoutes from "./routes/adminRoutes";

const app = express();
const PORT = Number(process.env.PORT ?? 4000);

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN ?? "http://localhost:3000", credentials: true }));
app.use(express.json({ limit: "1mb" }));

app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "votacion-backend",
    version: "0.1.0",
    timestamp: new Date().toISOString(),
  });
});

app.get("/", (_req, res) => {
  res.json({
    mensaje: "API del Sistema de Votación Descentralizada",
    endpoints: {
      health: "GET /health",
      auth: "/api/auth/* (pendiente)",
      voto: "/api/voto/* (pendiente)",
      admin: "/api/admin/* (pendiente)",
      auditoria: "/api/auditoria/* (pendiente)",
    },
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/voto", votoRoutes);
app.use("/api/admin", adminRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`🚀 Backend corriendo en http://localhost:${PORT}`);
    console.log(`💚 Health check en http://localhost:${PORT}/health`);
  });
}

export default app;
