import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import React from "react";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// Mock simple de next/navigation para tests unitarios
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() })),
  usePathname: vi.fn(() => "/"),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

// Mock de next/link que simplemente renderiza un <a>
vi.mock("next/link", () => ({
  default: ({ children, href, ...rest }: any) => React.createElement("a", { href, ...rest }, children),
}));
