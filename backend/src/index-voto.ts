import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import votoRoutes from './routes/votoRoutes';

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/voto', votoRoutes);

// Ruta de salud
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Backend de Votación Descentralizada',
    version: '1.0.0'
  });
});

// Ruta raíz
app.get('/', (req, res) => {
  res.status(200).json({
    mensaje: 'API del Sistema de Votación Descentralizada',
    endpoints: {
      auth: '/api/auth',
      voto: '/api/voto',
      health: '/health'
    },
    documentacion: 'https://github.com/DiegoMoron0102/taller2_sis_elecciones'
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📋 API disponible en http://localhost:${PORT}/api`);
  console.log(`💚 Health check en http://localhost:${PORT}/health`);
});

export default app;
