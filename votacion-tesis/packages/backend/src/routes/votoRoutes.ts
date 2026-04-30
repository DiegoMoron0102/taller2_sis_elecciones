import { Router } from "express";
import { VotoController } from "../controllers/votoController";

const router = Router();

router.post("/emitir", VotoController.emitir);
router.get("/estado-eleccion", VotoController.estadoEleccion);
router.get("/boletas", VotoController.boletas);
router.get("/comprobante", VotoController.comprobante);

export default router;
