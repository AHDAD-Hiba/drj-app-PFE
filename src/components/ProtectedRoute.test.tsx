import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProtectedRoute } from "./ProtectedRoute";
import { useAuth } from "@/hooks/common/useAuth";

vi.mock("@/hooks/common/useAuth", () => ({
  useAuth: vi.fn(),
}));

const mockedUseAuth = vi.mocked(useAuth);

const renderGuard = () =>
  render(
    <MemoryRouter initialEntries={["/protected"]}>
      <ProtectedRoute allowedRoles={["admin"]}>
        <div>Contenu protege</div>
      </ProtectedRoute>
    </MemoryRouter>,
  );

describe("ProtectedRoute", () => {
  beforeEach(() => {
    mockedUseAuth.mockReturnValue({
      user: null,
      session: null,
      utilisateur: null,
      role: null,
      loading: false,
      signOut: vi.fn(),
      isAdmin: false,
      isRegional: false,
      isPrefectoral: false,
      isEquipeRegional: false,
      roleRedirectPath: "/auth",
    });
  });

  it("redirige un utilisateur non connecte vers /auth", () => {
    renderGuard();

    expect(screen.queryByText("Contenu protege")).not.toBeInTheDocument();
  });

  it("refuse un utilisateur authentifie sans role", () => {
    mockedUseAuth.mockReturnValue({
      ...mockedUseAuth.mock.results[0]?.value,
      user: { id: "user-1" } as ReturnType<typeof useAuth>["user"],
      utilisateur: null,
      role: null,
      roleRedirectPath: "/auth",
    });

    renderGuard();

    expect(screen.getByText("Accès Non Autorisé")).toBeInTheDocument();
    expect(screen.queryByText("Contenu protege")).not.toBeInTheDocument();
  });

  it("refuse un utilisateur avec un role non autorise", () => {
    mockedUseAuth.mockReturnValue({
      ...mockedUseAuth.mock.results[0]?.value,
      user: { id: "user-1" } as ReturnType<typeof useAuth>["user"],
      role: "directeur_prefectoral",
      utilisateur: {
        id: "profile-1",
        auth_user_id: "user-1",
        nom: "Utilisateur",
        email: "user@example.com",
        role: "directeur_prefectoral",
        direction_id: "direction-1",
      },
      roleRedirectPath: "/saisie",
    });

    renderGuard();

    expect(screen.getByText("Accès Non Autorisé")).toBeInTheDocument();
    expect(screen.queryByText("Contenu protege")).not.toBeInTheDocument();
  });

  it("affiche le contenu avec un role autorise", () => {
    mockedUseAuth.mockReturnValue({
      ...mockedUseAuth.mock.results[0]?.value,
      user: { id: "user-1" } as ReturnType<typeof useAuth>["user"],
      role: "admin",
      utilisateur: {
        id: "profile-1",
        auth_user_id: "user-1",
        nom: "Administrateur",
        email: "admin@example.com",
        role: "admin",
        direction_id: null,
      },
      isAdmin: true,
      roleRedirectPath: "/admin/users",
    });

    renderGuard();

    expect(screen.getByText("Contenu protege")).toBeInTheDocument();
  });
});
