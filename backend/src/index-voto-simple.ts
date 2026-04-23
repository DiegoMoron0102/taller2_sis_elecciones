import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

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

// Rutas API - Simuladas sin dependencias externas
app.post('/api/auth/verificar-elegibilidad', (req, res) => {
  try {
    const { numeroPadron, nombre, ci } = req.body;
    
    if (!numeroPadron || !nombre || !ci) {
      return res.status(400).json({
        error: 'Datos de credencial incompletos',
        mensaje: 'Se requiere número de padrón, nombre y CI'
      });
    }

    const crypto = require('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    
    res.status(200).json({
      mensaje: 'Credencial verificada exitosamente',
      token,
      expiresIn: 3600,
      sessionId: 'session-' + Date.now(),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error en verificarElegibilidad:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      mensaje: 'No se pudo procesar la credencial'
    });
  }
});

app.post('/api/voto/emitir', (req, res) => {
  try {
    const { candidatoId, token } = req.body;
    
    if (!candidatoId || !token) {
      return res.status(400).json({
        error: 'Datos de voto incompletos',
        mensaje: 'Se requiere candidatoId y token'
      });
    }

    const crypto = require('crypto');
    
    // Generar nullifier
    const nullifier = '0x' + crypto.createHash('sha256').update(token).digest('hex');
    
    // Simular cifrado de voto
    const votoCifrado = '0x' + crypto.randomBytes(32).toString('hex');
    
    // Simular prueba ZK
    const pruebaZK = '0x' + crypto.randomBytes(32).toString('hex');
    
    // Simular transacción
    const txHash = '0x' + crypto.randomBytes(32).toString('hex');
    const bloque = Math.floor(Math.random() * 1000000) + 1000000;

    res.status(200).json({
      mensaje: 'Voto emitido exitosamente',
      boleta: {
        votoCifrado,
        pruebaZK,
        nullifier
      },
      transaccion: {
        hash: txHash,
        bloque
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error en emitirVoto:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      mensaje: 'No se pudo emitir el voto'
    });
  }
});

app.get('/api/voto/estado-eleccion', (req, res) => {
  res.status(200).json({
    eleccionAbierta: true,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/voto/estadisticas', (req, res) => {
  res.status(200).json({
    estadisticas: {
      totalVotos: 0,
      eleccionAbierta: true
    },
    timestamp: new Date().toISOString()
  });
});

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
