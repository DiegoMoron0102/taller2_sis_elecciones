import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AdminJwtPayload {
  adminId: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      admin?: AdminJwtPayload;
    }
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Token de administrador requerido" });
    return;
  }

  const token = header.slice(7);
  const secret = process.env.JWT_ADMIN_SECRET;
  if (!secret) {
    res.status(500).json({ error: "Configuración de seguridad incompleta" });
    return;
  }

  try {
    const payload = jwt.verify(token, secret) as AdminJwtPayload;
    req.admin = payload;
    next();
  } catch {
    res.status(401).json({ error: "Token inválido o expirado" });
  }
}
