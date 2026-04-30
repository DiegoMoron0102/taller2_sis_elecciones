import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import VotingShell, { ProgressStepper } from "~~/components/voting/VotingShell";

describe("VotingShell — componente de shell (PF-00)", () => {
  it("renderiza el nombre de marca VotoSeguro en el header", () => {
    render(<VotingShell><div>contenido</div></VotingShell>);
    expect(screen.getByText("VotoSeguro")).toBeInTheDocument();
  });

  it("renderiza el contenido hijo dentro del shell", () => {
    render(<VotingShell><p>Hijo de prueba</p></VotingShell>);
    expect(screen.getByText("Hijo de prueba")).toBeInTheDocument();
  });

  it("muestra el sessionId cuando se provee como prop", () => {
    render(<VotingShell sessionId="SESION-TEST"><div/></VotingShell>);
    expect(screen.getByText(/SESION-TEST/)).toBeInTheDocument();
  });

  it("no muestra ningún sessionId si no se provee", () => {
    render(<VotingShell><div/></VotingShell>);
    expect(screen.queryByText(/ID de Sesión/)).not.toBeInTheDocument();
  });

  it("renderiza los enlaces del footer a verificar, votar y explorer", () => {
    render(<VotingShell><div/></VotingShell>);
    expect(screen.getByRole("link", { name: /Verificar/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Votar/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Explorer/i })).toBeInTheDocument();
  });
});

describe("ProgressStepper (PF-00b)", () => {
  it("muestra 'Paso X de Y' correctamente", () => {
    render(<ProgressStepper totalSteps={4} currentStep={2} faseActual="Autenticación" />);
    expect(screen.getByText("Paso 2 de 4")).toBeInTheDocument();
  });

  it("muestra la fase actual recibida como prop", () => {
    render(<ProgressStepper totalSteps={4} currentStep={3} faseActual="Emisión del voto" />);
    expect(screen.getByText(/Emisión del voto/)).toBeInTheDocument();
  });

  it("muestra el indicador de progreso (barra)", () => {
    const { container } = render(
      <ProgressStepper totalSteps={4} currentStep={2} faseActual="Test" />
    );
    const barra = container.querySelector(".bg-\\[\\#197fe6\\]");
    expect(barra).toBeTruthy();
  });
});
