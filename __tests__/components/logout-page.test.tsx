/**
 * Tests for Logout Page
 */

import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { useRouter } from "next/navigation";
import LogoutPage from "@/app/auth/logout/page";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

describe("LogoutPage", () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
  });

  it("should show loading state initially", () => {
    (global.fetch as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<LogoutPage />);

    expect(screen.getByText("Disconnessione in corso...")).toBeInTheDocument();
    expect(screen.getByText(/Stai uscendo dalla sessione/)).toBeInTheDocument();
  });

  it("should show success state after successful logout", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    render(<LogoutPage />);

    await waitFor(() => {
      expect(screen.getByText("Disconnessione completata")).toBeInTheDocument();
    });

    expect(screen.getByText(/Sei uscito dalla sessione con successo/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Accedi di nuovo/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Torna alla homepage/i })).toBeInTheDocument();
  });

  it("should show error state when logout fails", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: "Session expired" }),
    });

    render(<LogoutPage />);

    await waitFor(() => {
      expect(screen.getByText("Errore")).toBeInTheDocument();
    });

    expect(screen.getByText("Session expired")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Riprova/i })).toBeInTheDocument();
  });

  it("should navigate to login when clicking 'Accedi di nuovo'", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    render(<LogoutPage />);

    await waitFor(() => {
      expect(screen.getByText("Disconnessione completata")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Accedi di nuovo/i }));

    expect(mockPush).toHaveBeenCalledWith("/auth/login");
  });

  it("should navigate to homepage when clicking 'Torna alla homepage'", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    render(<LogoutPage />);

    await waitFor(() => {
      expect(screen.getByText("Disconnessione completata")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Torna alla homepage/i }));

    expect(mockPush).toHaveBeenCalledWith("/");
  });

  it("should call POST to /api/auth/logout on mount", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    render(<LogoutPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    });
  });
});
