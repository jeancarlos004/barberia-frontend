import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Clock, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { EstadoBadge } from "@/components/barber/EstadoBadge";
import { SiteHeader } from "@/components/barber/SiteHeader";
import { Button } from "@/components/ui/button";
import {
  ApiError,
  formatFecha,
  formatHora,
  formatPrecio,
  invalidateBarber,
  toKey,
  turnoExpress,
  useBarberData,
  useCurrentUser,
} from "@/lib/barber-store";

export const Route = createFileRoute("/mis-turnos")({
  head: () => ({
    meta: [
      { title: "Mis turnos — Barberia YESIT" },
      { name: "description", content: "Consulta, cancela y gestiona tus turnos reservados en Barberia YESIT." },
      { property: "og:title", content: "Mis turnos — Barberia YESIT" },
      { property: "og:description", content: "Tu próximo turno, historial y turno express en un solo lugar." },
    ],
  }),
  component: MisTurnos,
});

function MisTurnos() {
  const user = useCurrentUser();
  const db = useBarberData(user);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [mounted, setMounted] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  // Redirect to auth if not authenticated
  if (!user) {
    navigate({ to: "/auth", replace: true });
    return null;
  }

  const hoy = toKey(new Date());
  const míos = db.appointments.filter((a) => a.userId === user.id);
  const proximos = míos.filter((a) => a.fecha >= hoy && a.estado !== "cancelado" && a.estado !== "completado");
  const historial = míos.filter((a) => !proximos.includes(a)).reverse();
  const servicio = (id: string, nombre?: string) => nombre ?? "Servicio";

  const express = async () => {
    if (!user) {
      toast.error("Debes iniciar sesión para usar turno express");
      navigate({ to: "/auth" });
      return;
    }

    const servicioActivo = db.services.filter((s) => s.activo)[0];
    if (!servicioActivo) {
      toast.error("No hay servicios disponibles");
      return;
    }

    setBusy(true);
    try {
      await turnoExpress(servicioActivo.id);
      await invalidateBarber(queryClient);
      toast.success("¡Turno express reservado!");
      navigate({ to: "/mis-turnos" });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo reservar el turno express");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto grid max-w-5xl gap-8 px-4 py-7 sm:py-10 lg:grid-cols-[1fr_18rem]">
        <div className="min-w-0">
          <h1 className="font-display text-3xl uppercase">Mis turnos</h1>

          <h2 className="mt-8 font-display text-lg">Próximos turnos</h2>
          <div className="mt-3 space-y-3">
            {proximos.map((a) => (
              <div key={a.id} className="surface-elite rounded-xl p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-lg">{servicio(a.serviceId, a.servicioNombre) ?? "Servicio"}</h3>
                    <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                      <CalendarDays className="size-4" /> {formatFecha(a.fecha)}
                    </p>
                    <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="size-4" /> {formatHora(a.hora)}
                    </p>
                  </div>
                  <EstadoBadge estado={a.estado} />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => {
                    toast.info("Función temporalmente deshabilitada");
                  }}
                >
                  Cancelar turno
                </Button>
              </div>
            ))}
            {proximos.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No tienes turnos próximos.{" "}
                <Link to="/reservar" className="text-primary underline">
                  Reserva uno
                </Link>
                .
              </p>
            )}
          </div>

          <h2 className="mt-10 font-display text-lg">Historial de turnos</h2>
          <div className="mt-3 space-y-3 sm:hidden">
            {historial.map((a) => (
              <article key={a.id} className="rounded-xl border border-border p-4">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{servicio(a.serviceId, a.servicioNombre)}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{formatFecha(a.fecha)} · {formatHora(a.hora)}</p>
                  </div>
                  <EstadoBadge estado={a.estado} />
                </div>
              </article>
            ))}
            {historial.length === 0 && <p className="py-5 text-center text-sm text-muted-foreground">Sin historial todavía</p>}
          </div>
          <div className="mt-3 hidden overflow-x-auto rounded-xl border border-border sm:block">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-normal">Fecha</th>
                  <th className="px-4 py-3 font-normal">Servicio</th>
                  <th className="px-4 py-3 font-normal">Hora</th>
                  <th className="px-4 py-3 font-normal">Estado</th>
                </tr>
              </thead>
              <tbody>
                {historial.map((a) => (
                  <tr key={a.id} className="border-t border-border/60">
                    <td className="px-4 py-3">{a.fecha}</td>
                    <td className="px-4 py-3">{servicio(a.serviceId, a.servicioNombre)}</td>
                    <td className="px-4 py-3">{formatHora(a.hora)}</td>
                    <td className="px-4 py-3">
                      <EstadoBadge estado={a.estado} />
                    </td>
                  </tr>
                ))}
                {historial.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                      Sin historial todavía
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="surface-elite h-fit rounded-xl p-5">
          <h2 className="font-display text-lg">¿Necesitas un turno más rápido?</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Reservamos automáticamente el próximo espacio disponible.
          </p>
          <Button className="mt-4 w-full" onClick={express} disabled={busy}>
            <Zap className="size-4" /> {busy ? "Buscando…" : "Turno express"}
          </Button>
          <p className="mt-4 text-xs text-muted-foreground">
            Servicio: {db.services.filter((s) => s.activo)[0]?.nombre} ·{" "}
            {formatPrecio(db.services.filter((s) => s.activo)[0]?.precio ?? 0)}
          </p>
        </aside>
      </main>
    </div>
  );
}
