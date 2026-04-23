import { Router } from 'express';
import { AuthController } from '../controllers/authController';

const router = Router();

// POST /api/auth/verificar-elegibilidad
// Verificar credencial y emitir token anónimo
router.post('/verificar-elegibilidad', AuthController.verificarElegibilidad);

// POST /api/auth/validar-token
// Validar token existente
router.post('/validar-token', AuthController.validarToken);

// POST /api/auth/cerrar-sesion
// Cerrar sesión (marcar token como usado)
router.post('/cerrar-sesion', AuthController.cerrarSesion);

// GET /api/auth/estadisticas
// Obtener estadísticas de tokens (solo admin)
router.get('/estadisticas', AuthController.obtenerEstadisticas);

export default router;
