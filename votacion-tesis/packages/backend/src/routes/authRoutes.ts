import { Router } from "express";
import { AuthController } from "../controllers/authController";

const router = Router();

router.post("/verificar-elegibilidad", AuthController.verificarElegibilidad);
router.post("/validar-token", AuthController.validarToken);

export default router;
