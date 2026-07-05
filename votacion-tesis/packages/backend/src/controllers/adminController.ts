import { Request, Response } from "express";
import { z } from "zod";
import * as AdminService from "../services/adminService";
import * as EscrutinioService from "../services/escrutinioService";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Contraseña requerida"),
});

export class AdminController {
  static async login(req: Request, res: Response) {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Datos inválidos", detalle: parsed.error.flatten() });
      return;
    }
    try {
      const resultado = await AdminService.loginAdmin(parsed.data.email, parsed.data.password);
      res.status(200).json({ mensaje: "Login exitoso", ...resultado });
    } catch (error) {
      res.status(401).json({
        error: "No autorizado",
        mensaje: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  static async obtenerEstado(req: Request, res: Response) {
    try {
      const estado = await AdminService.obtenerEstadoAdmin();
      res.status(200).json(estado);
    } catch (error) {
      res.status(500).json({
        error: "Error al obtener estado",
        mensaje: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  static async abrirJornada(req: Request, res: Response) {
    try {
      await AdminService.abrirJornada(req.admin!.adminId);
      res.status(200).json({ mensaje: "Jornada electoral abierta exitosamente" });
    } catch (error) {
      res.status(400).json({
        error: "No se pudo abrir la jornada",
        mensaje: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  static async cerrarJornada(req: Request, res: Response) {
    try {
      await AdminService.cerrarJornada(req.admin!.adminId);
      res.status(200).json({ mensaje: "Jornada electoral cerrada exitosamente" });
    } catch (error) {
      res.status(400).json({
        error: "No se pudo cerrar la jornada",
        mensaje: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  static async habilitarEscrutinio(req: Request, res: Response) {
    try {
      await AdminService.habilitarEscrutinio(req.admin!.adminId);
      res.status(200).json({ mensaje: "Escrutinio habilitado exitosamente" });
    } catch (error) {
      res.status(400).json({
        error: "No se pudo habilitar el escrutinio",
        mensaje: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  static async obtenerLogs(req: Request, res: Response) {
    try {
      const limite = Number(req.query.limite) || 50;
      const logs = await AdminService.obtenerLogsAuditoria(Math.min(limite, 200));
      res.status(200).json({ logs });
    } catch (error) {
      res.status(500).json({
        error: "Error al obtener logs",
        mensaje: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  static async obtenerCandidatos(req: Request, res: Response) {
    try {
      const candidatos = await AdminService.obtenerCandidatos();
      res.status(200).json({ candidatos });
    } catch (error) {
      res.status(500).json({
        error: "Error al obtener candidatos",
        mensaje: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  static async agregarCandidato(req: Request, res: Response) {
    const schema = z.object({
      nombre: z.string().min(1, "Nombre requerido"),
      descripcion: z.string().optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Datos inválidos", detalle: parsed.error.flatten() });
      return;
    }
    try {
      const candidato = await AdminService.agregarCandidato(parsed.data.nombre, parsed.data.descripcion);
      res.status(201).json({ mensaje: "Candidato agregado", candidato });
    } catch (error) {
      res.status(400).json({
        error: "No se pudo agregar candidato",
        mensaje: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  static async eliminarCandidato(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      await AdminService.eliminarCandidato(id);
      res.status(200).json({ mensaje: "Candidato eliminado" });
    } catch (error) {
      res.status(400).json({
        error: "No se pudo eliminar candidato",
        mensaje: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  static async actualizarFotoCandidato(req: Request, res: Response) {
    const schema = z.object({ fotoUrl: z.string().nullable() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "URL inválida", detalle: parsed.error.flatten() });
      return;
    }
    try {
      const candidato = await AdminService.actualizarFotoCandidato(
        String(req.params.id),
        parsed.data.fotoUrl,
      );
      res.status(200).json({ mensaje: "Foto actualizada", candidato });
    } catch (error) {
      res.status(400).json({
        error: "No se pudo actualizar la foto",
        mensaje: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  static async obtenerVotantesElegibles(req: Request, res: Response) {
    try {
      const votantes = await AdminService.obtenerVotantesElegibles();
      res.status(200).json({ votantes });
    } catch (error) {
      res.status(500).json({
        error: "Error al obtener votantes elegibles",
        mensaje: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  static async agregarVotanteElegible(req: Request, res: Response) {
    const schema = z.object({
      numeroPadron: z.string().min(1, "Número de padrón requerido"),
      nombre: z.string().optional(),
      ci: z.string().optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Datos inválidos", detalle: parsed.error.flatten() });
      return;
    }
    try {
      const resultado = await AdminService.agregarVotanteElegible(
        parsed.data.numeroPadron,
        parsed.data.nombre,
        parsed.data.ci,
      );
      const { vc, ...votante } = resultado;
      res.status(201).json({ mensaje: "Votante agregado al padrón", votante, vc: vc ?? null });
    } catch (error) {
      res.status(400).json({
        error: "No se pudo agregar votante",
        mensaje: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  static async cargarPadronCSV(req: Request, res: Response) {
    try {
      const { contenido } = z.object({ contenido: z.string() }).parse(req.body);
      const lineas = contenido.split("\n");
      const resultado = await AdminService.cargarPadronCSV(lineas, req.admin!.adminId);
      res.status(200).json(resultado);
    } catch (error) {
      res.status(400).json({
        error: "Error al cargar padrón",
        mensaje: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  static async obtenerEstadoEscrutinio(_req: Request, res: Response) {
    try {
      const estado = await EscrutinioService.obtenerEstadoEscrutinio();
      res.status(200).json(estado);
    } catch (error) {
      res.status(500).json({
        error: "Error al obtener estado de escrutinio",
        mensaje: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  static async inicializarEscrutinio(req: Request, res: Response) {
    const schema = z.object({
      custodios: z.array(z.object({
        nombre: z.string().min(1),
        partido: z.string().min(1),
      })).length(EscrutinioService.SHARES_N).optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Datos inválidos", detalle: parsed.error.flatten() });
      return;
    }
    try {
      const resultado = EscrutinioService.inicializarShares(parsed.data?.custodios);
      res.status(200).json({
        mensaje: "Compartimentos Shamir generados exitosamente",
        n: resultado.config.n,
        umbral: resultado.config.umbral,
        fechaGeneracion: resultado.config.fechaGeneracion,
        custodios: resultado.config.custodios,
        bundles: resultado.bundles.map(b => ({
          custodio: b.custodio,
          compartimento: b.compartimento,
          vc: b.vc,
        })),
      });
    } catch (error) {
      res.status(400).json({
        error: "No se pudo inicializar el escrutinio",
        mensaje: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  static async aportarCompartimento(req: Request, res: Response) {
    const schema = z.object({
      vc: z.object({
        "@context": z.array(z.string()),
        type: z.array(z.string()),
        issuer: z.string(),
        issuanceDate: z.string(),
        credentialSubject: z.object({
          nombre: z.string(),
          partido: z.string(),
          indiceCompartimento: z.number().int().min(1),
        }),
        proof: z.object({
          type: z.string(),
          created: z.string(),
          verificationMethod: z.string(),
          proofValue: z.string(),
        }),
      }),
      compartimento: z.object({
        indice: z.number().int().min(1),
        valor: z.string(),
        fechaGeneracion: z.string(),
      }),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Datos inválidos", detalle: parsed.error.flatten() });
      return;
    }
    try {
      const resultado = EscrutinioService.aportarCompartimento(
        parsed.data.vc as any,
        parsed.data.compartimento,
      );
      res.status(200).json({
        mensaje: `Compartimento ${resultado.indice} aportado por ${resultado.custodio.nombre} (${resultado.custodio.partido})`,
        ...resultado,
      });
    } catch (error) {
      res.status(400).json({
        error: "No se pudo registrar el compartimento",
        mensaje: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  static async aportarCompartimentoDirecto(req: Request, res: Response) {
    const schema = z.object({ indice: z.number().int().min(1).max(10) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Índice inválido" });
      return;
    }
    try {
      const resultado = EscrutinioService.aportarCompartimentoDirecto(parsed.data.indice);
      res.status(200).json({
        mensaje: `Compartimento ${resultado.indice} cargado desde disco`,
        ...resultado,
      });
    } catch (error) {
      res.status(400).json({
        error: "No se pudo cargar el compartimento",
        mensaje: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  static async ejecutarEscrutinio(req: Request, res: Response) {
    try {
      const resultado = await EscrutinioService.ejecutarEscrutinio(req.admin!.adminId);
      res.status(200).json({ mensaje: "Escrutinio ejecutado exitosamente", ...resultado });
    } catch (error) {
      res.status(400).json({
        error: "No se pudo ejecutar el escrutinio",
        mensaje: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  static async resetearEscrutinio(req: Request, res: Response) {
    try {
      const resultado = await EscrutinioService.resetearEscrutinio(req.admin!.adminId);
      res.status(200).json({
        mensaje: "Escrutinio reiniciado para nueva jornada",
        ...resultado,
      });
    } catch (error) {
      res.status(400).json({
        error: "No se pudo reiniciar el escrutinio",
        mensaje: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  static async reconfigurarEleccion(req: Request, res: Response) {
    const adminId = (req as unknown as { admin: { adminId: string } }).admin.adminId;
    try {
      const resultado = await AdminService.reconfigurarEleccion(adminId);
      res.status(200).json({
        mensaje: "Elección reconfigurada correctamente. Recuerde re-desplegar los contratos para limpiar el estado on-chain.",
        ...resultado,
      });
    } catch (error) {
      res.status(500).json({
        error: "No se pudo reconfigurar la elección",
        mensaje: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }
}
