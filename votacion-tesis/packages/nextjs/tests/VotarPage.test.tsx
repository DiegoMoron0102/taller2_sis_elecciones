import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import VotarPage from "~~/app/votar/page";

const ESTADO_ABIERTO = {
  abierta: true,
  candidatos: ["Ana Mamani - Partido A", "Carlos Quispe - Partido B", "Luis Flores - Partido C"],
  totalBoletas: 5,
};

const ESTADO_CERRADO = {
  abierta: false,
  candidatos: ["Ana Mamani - Partido A"],
  totalBoletas: 10,
};

describe("VotarPage (PF-02)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(window, "localStorage", {
      value: { getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn() },
      writable: true,
    });
  });

  it("muestra estado de carga antes de obtener elección", () => {
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(new Promise(() => {})));
    render(<VotarPage />);
    expect(screen.getByText(/Cargando estado de elección/i)).toBeInTheDocument();
  });

  it("muestra los candidatos cuando la elección está abierta", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ESTADO_ABIERTO,
    }));

    render(<VotarPage />);

    await waitFor(() => {
      expect(screen.getByText(/Ana Mamani/i)).toBeInTheDocument();
      expect(screen.getByText(/Carlos Quispe/i)).toBeInTheDocument();
      expect(screen.getByText(/Luis Flores/i)).toBeInTheDocument();
    });
  });

  it("muestra el partido debajo del nombre del candidato", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ESTADO_ABIERTO,
    }));

    render(<VotarPage />);

    await waitFor(() => {
      expect(screen.getByText("Partido A")).toBeInTheDocument();
      expect(screen.getByText("Partido B")).toBeInTheDocument();
    });
  });

  it("el botón 'Emitir voto' aparece habilitado cuando la elección está abierta", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ESTADO_ABIERTO,
    }));

    render(<VotarPage />);

    await waitFor(() => {
      const btn = screen.getByRole("button", { name: /Emitir voto/i });
      expect(btn).not.toBeDisabled();
    });
  });

  it("el botón 'Emitir voto' aparece deshabilitado cuando la elección está cerrada", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ESTADO_CERRADO,
    }));

    render(<VotarPage />);

    await waitFor(() => {
      const btn = screen.getByRole("button", { name: /Emitir voto/i });
      expect(btn).toBeDisabled();
    });
  });

  it("muestra el total de boletas on-chain", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ESTADO_ABIERTO,
    }));

    render(<VotarPage />);

    await waitFor(() => {
      expect(screen.getByText(/Boletas on-chain: 5/i)).toBeInTheDocument();
    });
  });

  it("muestra confirmación de voto tras emisión exitosa", async () => {
    let callCount = 0;
    vi.stubGlobal("fetch", vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve({ ok: true, json: async () => ESTADO_ABIERTO });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({
          mensaje: "Voto emitido exitosamente",
          transaccion: { hash: "0xabc123", bloque: 42 },
          boleta: { nullifier: "0xnull01" },
          hashComprobante: "0xcheck01",
        }),
      });
    }));

    vi.spyOn(window.localStorage, "getItem").mockReturnValue("t".repeat(64));

    render(<VotarPage />);

    // Esperar a que aparezcan los candidatos
    await waitFor(() => screen.getByText(/Ana Mamani/i));

    // Seleccionar el primer candidato haciendo clic en su botón contenedor
    const candidatoBtn = screen.getByText("Ana Mamani").closest("button") as HTMLElement;
    fireEvent.click(candidatoBtn);

    // Emitir voto
    fireEvent.click(screen.getByRole("button", { name: /Emitir voto/i }));

    await waitFor(() => {
      expect(screen.getByText(/Voto emitido exitosamente/i)).toBeInTheDocument();
    });
  });
});
