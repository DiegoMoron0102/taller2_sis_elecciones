import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ExplorerPage from "~~/app/explorer/page";

describe("ExplorerPage (PF-03)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("muestra el título 'Explorador de Boletas'", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ boletas: [] }),
    }));

    render(<ExplorerPage />);
    expect(screen.getByText(/Explorador de Boletas/i)).toBeInTheDocument();
  });

  it("muestra estado vacío cuando no hay boletas registradas", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ boletas: [] }),
    }));

    render(<ExplorerPage />);

    await waitFor(() => {
      expect(screen.getByText(/Aún no hay boletas registradas on-chain/i)).toBeInTheDocument();
    });
  });

  it("muestra 'Total de boletas: 0' cuando no hay datos", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ boletas: [] }),
    }));

    render(<ExplorerPage />);

    await waitFor(() => {
      expect(screen.getByText(/Total de boletas: 0/i)).toBeInTheDocument();
    });
  });

  it("muestra filas de boletas cuando la API responde con datos", async () => {
    const boletas = [
      { nullifier: "0xaabbccddee11223344556677", votoCifrado: "0xvoto01xxxxxx", bloque: 42 },
      { nullifier: "0x99887766554433221100ffee", votoCifrado: "0xvoto02yyyyyy", bloque: 43 },
    ];

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ boletas }),
    }));

    render(<ExplorerPage />);

    await waitFor(() => {
      expect(screen.getByText(/Total de boletas: 2/i)).toBeInTheDocument();
    });

    const filas = screen.getAllByRole("row");
    // 1 header + 2 filas de datos
    expect(filas.length).toBe(3);
  });

  it("muestra los números de bloque de cada boleta", async () => {
    const boletas = [
      { nullifier: "0xaabb", votoCifrado: "0xvoto01", bloque: 101 },
    ];

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ boletas }),
    }));

    render(<ExplorerPage />);

    await waitFor(() => {
      expect(screen.getByText("101")).toBeInTheDocument();
    });
  });
});
