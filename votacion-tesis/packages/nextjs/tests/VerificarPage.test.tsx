import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import VerificarPage from "~~/app/verificar/page";

describe("VerificarPage (PF-01)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renderiza el título de autenticación SSI/VC", () => {
    render(<VerificarPage />);
    expect(screen.getByText(/Autenticación con SSI\/VC/i)).toBeInTheDocument();
  });

  it("muestra textarea de VC por defecto (modo vc)", () => {
    render(<VerificarPage />);
    expect(screen.getByPlaceholderText(/\{"@context"/i)).toBeInTheDocument();
  });

  it("muestra los tres campos del formulario al cambiar a modo legado", () => {
    render(<VerificarPage />);
    fireEvent.click(screen.getByRole("button", { name: /Campos individuales/i }));
    expect(screen.getByPlaceholderText("LP123456")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Juan Pérez")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("12345678L")).toBeInTheDocument();
  });

  it("el botón de autenticación está presente y habilitado inicialmente", () => {
    render(<VerificarPage />);
    const btn = screen.getByRole("button", { name: /Autenticar credencial digital/i });
    expect(btn).toBeInTheDocument();
    expect(btn).not.toBeDisabled();
  });

  it("muestra mensaje de error cuando la API devuelve error (modo legado)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ mensaje: "Credencial inválida en servidor" }),
    }));

    render(<VerificarPage />);
    fireEvent.click(screen.getByRole("button", { name: /Campos individuales/i }));

    fireEvent.change(screen.getByPlaceholderText("LP123456"), { target: { value: "LP999999" } });
    fireEvent.change(screen.getByPlaceholderText("Juan Pérez"), { target: { value: "Juan Perez" } });
    fireEvent.change(screen.getByPlaceholderText("12345678L"), { target: { value: "12345678L" } });
    fireEvent.submit(screen.getByRole("button", { name: /Autenticar/i }).closest("form")!);

    await waitFor(() => {
      expect(screen.getByText(/Credencial inválida en servidor/i)).toBeInTheDocument();
    });
  });

  it("llama a router.push('/votar') cuando la API responde con token (modo legado)", async () => {
    const { useRouter } = await import("next/navigation");
    const pushMock = vi.fn();
    vi.mocked(useRouter).mockReturnValue({ push: pushMock } as any);

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ token: "a".repeat(64), sessionId: "s-test" }),
    }));

    render(<VerificarPage />);
    fireEvent.click(screen.getByRole("button", { name: /Campos individuales/i }));

    fireEvent.change(screen.getByPlaceholderText("LP123456"), { target: { value: "LP123456" } });
    fireEvent.change(screen.getByPlaceholderText("Juan Pérez"), { target: { value: "Juan Lopez" } });
    fireEvent.change(screen.getByPlaceholderText("12345678L"), { target: { value: "12345678L" } });
    fireEvent.submit(screen.getByRole("button", { name: /Autenticar/i }).closest("form")!);

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/votar");
    });
  });

  it("el botón muestra 'Verificando credencial...' mientras carga (modo legado)", async () => {
    let resolvePromise!: (v: any) => void;
    const fetchPromise = new Promise(resolve => { resolvePromise = resolve; });
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(fetchPromise));

    render(<VerificarPage />);
    fireEvent.click(screen.getByRole("button", { name: /Campos individuales/i }));

    fireEvent.change(screen.getByPlaceholderText("LP123456"), { target: { value: "LP123456" } });
    fireEvent.change(screen.getByPlaceholderText("Juan Pérez"), { target: { value: "Juan Lopez" } });
    fireEvent.change(screen.getByPlaceholderText("12345678L"), { target: { value: "12345678L" } });
    fireEvent.submit(screen.getByRole("button", { name: /Autenticar/i }).closest("form")!);

    await waitFor(() => {
      expect(screen.getByText(/Verificando credencial.../i)).toBeInTheDocument();
    });

    resolvePromise({ ok: false, json: async () => ({}) });
  });
});
