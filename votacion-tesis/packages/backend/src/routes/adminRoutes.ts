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

// Padrón de votantes elegibles
router.get("/padron", requireAdmin, AdminController.obtenerVotantesElegibles);
router.post("/padron", requireAdmin, AdminController.agregarVotanteElegible);
router.post("/padron/csv", requireAdmin, AdminController.cargarPadronCSV);

export default router;
