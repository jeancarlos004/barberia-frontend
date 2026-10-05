import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { Logo } from "@/components/barber/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { solicitarRecuperacionPassword } from "@/lib/barber-store";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Ingresar o registrarse — Barberia YESIT" },
      { name: "description", content: "Accede a tu cuenta para reservar y gestionar tus turnos en Barberia YESIT." },
      { property: "og:title", content: "Ingresar o registrarse — Barberia YESIT" },
      { property: "og:description", content: "Inicia sesión o crea tu cuenta para reservar turnos." },
    ],
  }),
  component: Auth,
});

function Auth() {
  const navigate = useNavigate();
  const { login, register, isLoading } = useAuth();
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [regData, setRegData] = useState({ nombre: "", email: "", telefono: "", password: "" });
  const [resetEmail, setResetEmail] = useState("");
  const [showResetForm, setShowResetForm] = useState(false);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await solicitarRecuperacionPassword(resetEmail);
      toast.success("Se ha enviado un correo con las instrucciones para restablecer tu contraseña");
      setShowResetForm(false);
      setResetEmail("");
    } catch (err) {
      toast.error("Error al solicitar recuperación de contraseña");
    }
  };

  const goHome = (role: string) =>
    navigate({ to: role === "admin" ? "/admin" : "/mis-turnos", replace: true });

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-3 py-8 sm:px-4 sm:py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="surface-elite rounded-xl p-4 sm:rounded-2xl sm:p-6">
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Iniciar sesión</TabsTrigger>
              <TabsTrigger value="registro">Registrarse</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-6">
              <form
                className="space-y-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const res = await login(loginData.email, loginData.password);
                  if (!res.ok) {
                    toast.error(res.error);
                    return;
                  }
                  toast.success(`Bienvenido, ${res.user!.nombre}`);
                  // Navigate based on user role
                  if (res.user!.role === "admin") {
                    navigate({ to: "/admin", replace: true });
                  } else {
                    navigate({ to: "/mis-turnos", replace: true });
                  }
                }}
              >
                <Field label="Correo">
                  <Input
                    type="email"
                    required
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  />
                </Field>
                <Field label="Contraseña">
                  <Input
                    type="password"
                    required
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  />
                </Field>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Entrando…" : "Entrar"}
                </Button>
                <button
                  type="button"
                  onClick={() => setShowResetForm(true)}
                  className="mt-2 w-full text-sm text-muted-foreground hover:text-foreground"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </form>
              
              {showResetForm && (
                <div className="mt-4 space-y-4 rounded-lg border border-border/60 bg-secondary/40 p-4">
                  <p className="text-sm font-medium">Recuperar Contraseña</p>
                  <form onSubmit={handlePasswordReset} className="space-y-3">
                    <Field label="Correo">
                      <Input
                        type="email"
                        required
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="tu@correo.com"
                      />
                    </Field>
                    <div className="flex gap-2">
                      <Button type="submit" size="sm" className="flex-1">
                        Enviar
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowResetForm(false);
                          setResetEmail("");
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </form>
                </div>
              )}
              
              <div className="mt-6 rounded-lg border border-border/60 bg-secondary/40 p-3 text-xs text-muted-foreground">
                <p className="font-medium text-foreground">Cuentas de prueba</p>
                <p>Cliente: cliente@barberia.com / cliente123</p>
                <p>Admin: admin@barberia.com / admin123</p>
              </div>
            </TabsContent>

            <TabsContent value="registro" className="mt-6">
              <form
                className="space-y-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const res = await register(regData);
                  if (!res.ok) {
                    toast.error(res.error);
                    return;
                  }
                  toast.success("Cuenta creada correctamente");
                  // Navigate to mis-turnos after registration
                  navigate({ to: "/mis-turnos", replace: true });
                }}
              >
                <Field label="Nombre completo">
                  <Input
                    required
                    value={regData.nombre}
                    onChange={(e) => setRegData({ ...regData, nombre: e.target.value })}
                  />
                </Field>
                <Field label="Correo">
                  <Input
                    type="email"
                    required
                    value={regData.email}
                    onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                  />
                </Field>
                <Field label="Teléfono">
                  <Input
                    required
                    value={regData.telefono}
                    onChange={(e) => setRegData({ ...regData, telefono: e.target.value })}
                  />
                </Field>
                <Field label="Contraseña">
                  <Input
                    type="password"
                    required
                    minLength={8}
                    value={regData.password}
                    onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                  />
                </Field>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Creando…" : "Crear cuenta"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
