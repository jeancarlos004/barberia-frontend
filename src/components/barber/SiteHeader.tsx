import { Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";

import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";

const links = [
  { to: "/", label: "Inicio" },
  { to: "/servicios", label: "Servicios" },
  { to: "/reservar", label: "Reservar" },
] as const;

export function SiteHeader() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="mx-auto grid h-16 max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-3 sm:gap-4 sm:px-4 md:grid-cols-[auto_minmax(0,1fr)_auto]">
        <Logo className="min-w-0 [&>span:last-child]:hidden min-[390px]:[&>span:last-child]:block" />
        <nav className="hidden min-w-0 items-center justify-self-end gap-7 md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeOptions={{ exact: l.to === "/" }}
              activeProps={{ className: "text-primary" }}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
          {isAuthenticated && user?.role === "cliente" && (
            <Link
              to="/mis-turnos"
              activeProps={{ className: "text-primary" }}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Mis turnos
            </Link>
          )}
          {isAuthenticated && user?.role === "admin" && (
            <Link
              to="/admin"
              activeProps={{ className: "text-primary" }}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Dashboard
            </Link>
          )}
        </nav>
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          {isAuthenticated ? (
            <>
              <span className="hidden text-sm text-muted-foreground sm:inline">{user?.nombre}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
              >
                Cerrar sesión
              </Button>
            </>
          ) : (
            <Button asChild size="sm">
              <Link to="/auth">Ingresar</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
