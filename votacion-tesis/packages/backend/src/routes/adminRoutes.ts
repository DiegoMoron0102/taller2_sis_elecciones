import { Router } from "express";
import { AdminController } from "../controllers/adminController";
import { requireAdmin } from "../middleware/adminAuth";

const router = Router();

// Ruta pública — login del administrador
router.post("/login", AdminController.login);

// Rutas protegidas — requieren JWT de admin
router.get("/estado", requireAdmin, AdminController.obtenerEstado);
router.post("/abrir-jornada", requireAdmin, AdminController.abrirJornada);
router.post("/cerrar-jornada", requireAdmin, AdminController.cerrarJornada);
router.post("/habilitar-escrutinio", requireAdmin, AdminController.habilitarEscrutinio);
router.get("/logs-auditoria", requireAdmin, AdminController.obtenerLogs);

// Candidatos
router.get("/candidatos", requireAdmin, AdminController.obtenerCandidatos);
router.post("/candidatos", requireAdmin, AdminController.agregarCandidato);
router.delete("/candidatos/:id", requireAdmin, AdminController.eliminarCandidato);
router.patch("/candidatos/:id/foto", requireAdmin, AdminController.actualizarFotoCandidato);

// Padrón de votantes elegibles
router.get("/padron", requireAdmin, AdminController.obtenerVotantesElegibles);
router.post("/padron", requireAdmin, AdminController.agregarVotanteElegible);
router.post("/padron/csv", requireAdmin, AdminController.cargarPadronCSV);

// Reconfiguración completa para nueva elección
router.post("/reconfigurar", requireAdmin, AdminController.reconfigurarEleccion);

// Escrutinio cooperativo (Shamir)
router.get("/escrutinio/estado", requireAdmin, AdminController.obtenerEstadoEscrutinio);
router.post("/escrutinio/inicializar", requireAdmin, AdminController.inicializarEscrutinio);
router.post("/escrutinio/aportar-compartimento", requireAdmin, AdminController.aportarCompartimento);
router.post("/escrutinio/aportar-directo", requireAdmin, AdminController.aportarCompartimentoDirecto);
router.post("/escrutinio/ejecutar", requireAdmin, AdminController.ejecutarEscrutinio);
router.post("/escrutinio/resetear", requireAdmin, AdminController.resetearEscrutinio);

export default router;
