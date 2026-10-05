import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { SiteHeader } from "@/components/barber/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { confirmarRecuperacionPassword } from "@/lib/barber-store";

export const Route = createFileRoute("/reset-password")({
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/reset-password" });
  const token = (search as { token?: string }).token || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!token) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
          <div className="w-full max-w-md surface-elite rounded-xl p-8 text-center">
            <h1 className="font-display text-3xl uppercase">Token Inválido</h1>
            <p className="mt-2 text-muted-foreground">No se proporcionó un token de recuperación válido.</p>
            <Button
              className="mt-6"
              onClick={() => navigate({ to: "/auth" })}
            >
              Volver a iniciar sesión
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }
    
    setIsLoading(true);
    try {
      await confirmarRecuperacionPassword(token, password);
      toast.success("Contraseña restablecida exitosamente");
      navigate({ to: "/auth" });
    } catch (err) {
      toast.error("Error al restablecer la contraseña. El token puede ser inválido o expirado.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6 surface-elite rounded-xl p-8">
          <div className="text-center">
            <h1 className="font-display text-3xl uppercase">Restablecer Contraseña</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Ingresa tu nueva contraseña
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nueva Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Procesando..." : "Restablecer Contraseña"}
            </Button>
          </form>

          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate({ to: "/auth" })}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Volver a iniciar sesión
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
