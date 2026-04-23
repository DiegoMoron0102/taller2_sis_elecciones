import { Router } from 'express';
import { VotoController } from '../controllers/votoController';

const router = Router();

// POST /api/voto/emitir
// Emitir voto cifrado con prueba ZK
router.post('/emitir', VotoController.emitirVoto);

// GET /api/voto/estadisticas
// Obtener estadísticas de votación
router.get('/estadisticas', VotoController.obtenerEstadisticas);

// GET /api/voto/estado-eleccion
// Verificar si la elección está abierta
router.get('/estado-eleccion', VotoController.verificarEstadoEleccion);

// POST /api/voto/verificar-elegibilidad
// Verificar elegibilidad de un nullifier
router.post('/verificar-elegibilidad', VotoController.verificarElegibilidadNullifier);

// POST /api/voto/preparar
// Preparar voto (generar nullifier para preview)
router.post('/preparar', VotoController.prepararVoto);

// GET /api/voto/boletas
// Obtener todas las boletas de blockchain
router.get('/boletas', VotoController.obtenerBoletas);

export default router;
